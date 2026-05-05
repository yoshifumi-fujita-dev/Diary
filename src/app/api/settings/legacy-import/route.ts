import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { TextDecoder } from "util";
import { db } from "@/server/db";
import { entries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/server/auth";

const DEFAULT_SOURCE_DIR = "/Users/yoshifumi.fujita/Desktop/MySoft/FujitaSoft/Schedule";
const DEFAULT_PASSWORD = "Fujita_4423";
const DEFAULT_SALT = "saltは必ず8バイト以上";

export const runtime = "nodejs";
export const maxDuration = 300;

function collectFiles(dir: string, out: string[]) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (/^\d{8}\.txt$/.test(item.name)) {
      out.push(full);
    }
  }
}

function deriveKeyIv(password: string, saltStr: string) {
  const salt = Buffer.from(saltStr, "utf8");
  const keyIv = crypto.pbkdf2Sync(password, salt, 1000, 48, "sha1");
  return {
    key: keyIv.subarray(0, 32),
    iv: keyIv.subarray(32, 48),
  };
}

function decryptBuffer(data: Buffer, password: string, salt: string) {
  const { key, iv } = deriveKeyIv(password, salt);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  const text = new TextDecoder("shift_jis").decode(decrypted);
  return text.replace(/\u0000/g, "");
}

function decryptFile(filePath: string, password: string, salt: string) {
  const data = fs.readFileSync(filePath);
  return decryptBuffer(data, password, salt);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
  if (!normalized) return "";
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function dateFromFilename(filePath: string) {
  const base = path.basename(filePath, ".txt");
  if (!/^\d{8}$/.test(base)) return null;
  return `${base.slice(0, 4)}-${base.slice(4, 6)}-${base.slice(6, 8)}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "ローカル環境専用の機能です" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  if (isMultipart) {
    const formData = await request.formData();
    const password =
      typeof formData.get("password") === "string" && (formData.get("password") as string).length > 0
        ? (formData.get("password") as string)
        : DEFAULT_PASSWORD;
    const salt =
      typeof formData.get("salt") === "string" && (formData.get("salt") as string).length > 0
        ? (formData.get("salt") as string)
        : DEFAULT_SALT;
    const overwrite = formData.get("overwrite") === "true";
    const dryRun = formData.get("dryRun") === "true";
    const files = formData.getAll("files").filter((item) => item instanceof File) as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "ファイルが選択されていません。" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const skippedDates: string[] = [];
    const failedFiles: { file: string; error: string }[] = [];

    for (const file of files) {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      const fileName = relativePath && relativePath.length > 0 ? relativePath : file.name;
      const date = dateFromFilename(fileName);
      if (!date) {
        skipped += 1;
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const rawText = decryptBuffer(buffer, password, salt);
        const content = textToHtml(rawText);

        if (!content) {
          skipped += 1;
          continue;
        }

        if (dryRun) {
          imported += 1;
          continue;
        }

        const [existing] = await db.select().from(entries).where(eq(entries.date, date));
        if (existing && !overwrite) {
          skipped += 1;
          skippedDates.push(date);
          continue;
        }

        if (existing && overwrite) {
          await db
            .update(entries)
            .set({ content, updatedAt: sql`(datetime('now', 'localtime'))` })
            .where(eq(entries.date, date));
          imported += 1;
          continue;
        }

        await db.insert(entries).values({ date, content });
        imported += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : "Unknown error";
        if (failedFiles.length < 20) {
          failedFiles.push({ file: fileName, error: message });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      source: "upload",
      dryRun,
      overwrite,
      files: files.length,
      imported,
      skipped,
      failed,
      skippedDates,
      failedFiles,
    });
  }

  const body = await request.json().catch(() => ({}));
  const sourceDir =
    typeof body?.sourceDir === "string" && body.sourceDir.trim()
      ? body.sourceDir.trim()
      : DEFAULT_SOURCE_DIR;
  const password =
    typeof body?.password === "string" && body.password.length > 0
      ? body.password
      : DEFAULT_PASSWORD;
  const salt = typeof body?.salt === "string" && body.salt.length > 0 ? body.salt : DEFAULT_SALT;
  const overwrite = Boolean(body?.overwrite);
  const dryRun = Boolean(body?.dryRun);

  if (!fs.existsSync(sourceDir)) {
    return NextResponse.json({ error: `ソースフォルダが見つかりません: ${sourceDir}` }, { status: 400 });
  }

  const stat = fs.statSync(sourceDir);
  if (!stat.isDirectory()) {
    return NextResponse.json({ error: `フォルダではありません: ${sourceDir}` }, { status: 400 });
  }

  const files: string[] = [];
  collectFiles(sourceDir, files);
  files.sort();

  if (files.length === 0) {
    return NextResponse.json({
      ok: true,
      sourceDir,
      dryRun,
      overwrite,
      files: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      skippedDates: [],
      failedFiles: [],
      note: "対象の .txt ファイルが見つかりませんでした。",
    });
  }

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const skippedDates: string[] = [];
  const failedFiles: { file: string; error: string }[] = [];

  for (const filePath of files) {
    const date = dateFromFilename(filePath);
    if (!date) {
      skipped += 1;
      continue;
    }

    try {
      const rawText = decryptFile(filePath, password, salt);
      const content = textToHtml(rawText);

      if (!content) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        imported += 1;
        continue;
      }

      const [existing] = await db.select().from(entries).where(eq(entries.date, date));
      if (existing && !overwrite) {
        skipped += 1;
        skippedDates.push(date);
        continue;
      }

      if (existing && overwrite) {
        await db
          .update(entries)
          .set({ content, updatedAt: sql`(datetime('now', 'localtime'))` })
          .where(eq(entries.date, date));
        imported += 1;
        continue;
      }

      await db.insert(entries).values({ date, content });
      imported += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Unknown error";
      if (failedFiles.length < 20) {
        failedFiles.push({ file: filePath, error: message });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sourceDir,
    dryRun,
    overwrite,
    files: files.length,
    imported,
    skipped,
    failed,
    skippedDates,
    failedFiles,
  });
}
