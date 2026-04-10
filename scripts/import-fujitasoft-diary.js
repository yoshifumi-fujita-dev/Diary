const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { TextDecoder } = require("util");
const dotenv = require("dotenv");
const { createClient } = require("@libsql/client");

const DEFAULT_SOURCE_DIR = "/Users/yoshifumi.fujita/Desktop/MySoft/FujitaSoft/Schedule";
const PASSWORD = "Fujita_4423";
const SALT = "saltは必ず8バイト以上";

const args = process.argv.slice(2);
const SOURCE_DIR = args.find((a) => !a.startsWith("--")) || DEFAULT_SOURCE_DIR;
const OVERWRITE = args.includes("--overwrite");
const DRY_RUN = args.includes("--dry-run");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  console.error("TURSO_DATABASE_URL が設定されていません。 .env.local を確認してください。");
  process.exit(1);
}

function collectFiles(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (/^\d{8}\.txt$/.test(entry.name)) {
      out.push(full);
    }
  }
}

function deriveKeyIv(password, saltStr) {
  const salt = Buffer.from(saltStr, "utf8");
  const keyIv = crypto.pbkdf2Sync(password, salt, 1000, 48, "sha1");
  return {
    key: keyIv.subarray(0, 32),
    iv: keyIv.subarray(32, 48),
  };
}

function decryptFile(filePath) {
  const data = fs.readFileSync(filePath);
  const { key, iv } = deriveKeyIv(PASSWORD, SALT);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  const text = new TextDecoder("shift_jis").decode(decrypted);
  return text.replace(/\u0000/g, "");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
  if (!normalized) return "";
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function dateFromFilename(filePath) {
  const base = path.basename(filePath, ".txt");
  if (!/^\d{8}$/.test(base)) return null;
  return `${base.slice(0, 4)}-${base.slice(4, 6)}-${base.slice(6, 8)}`;
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`ソースフォルダが見つかりません: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = [];
  collectFiles(SOURCE_DIR, files);
  files.sort();

  if (files.length === 0) {
    console.log("対象の .txt ファイルが見つかりませんでした。");
    return;
  }

  const client = createClient({ url: dbUrl, authToken: dbToken });
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const skippedDates = [];

  for (const filePath of files) {
    const date = dateFromFilename(filePath);
    if (!date) {
      skipped += 1;
      continue;
    }

    try {
      const rawText = decryptFile(filePath);
      const content = textToHtml(rawText);

      if (!content) {
        skipped += 1;
        continue;
      }

      if (DRY_RUN) {
        imported += 1;
        continue;
      }

      const exists = await client.execute({
        sql: "select 1 from entries where date = ? limit 1",
        args: [date],
      });

      if (exists.rows.length > 0 && !OVERWRITE) {
        skipped += 1;
        skippedDates.push(date);
        continue;
      }

      if (exists.rows.length > 0 && OVERWRITE) {
        await client.execute({
          sql: "update entries set content = ?, updated_at = datetime('now','localtime') where date = ?",
          args: [content, date],
        });
        imported += 1;
        continue;
      }

      await client.execute({
        sql: "insert into entries (date, content) values (?, ?)",
        args: [date, content],
      });
      imported += 1;
    } catch (err) {
      failed += 1;
      console.error(`失敗: ${filePath}`, err);
    }
  }

  await client.close();

  console.log(`対象ファイル: ${files.length}`);
  console.log(`インポート: ${imported}`);
  console.log(`スキップ: ${skipped}`);
  console.log(`失敗: ${failed}`);
  if (skippedDates.length > 0) {
    console.log("スキップ日付:");
    skippedDates.sort().forEach((d) => console.log(`- ${d}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
