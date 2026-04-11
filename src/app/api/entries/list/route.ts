import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makePreview(html: string, length: number): string {
  const text = stripHtml(html);
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diaryAccess = (await cookies()).get("diary_access")?.value;
  if (diaryAccess !== "1") return NextResponse.json({ error: "Forbidden" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  // 全エントリの日付を取得して年一覧を作る
  const allDates = await db.select({ date: entries.date }).from(entries);
  const yearSet = new Set(allDates.map((r) => r.date.slice(0, 4)));
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));

  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json({ items: [], years });
  }

  // 指定年のエントリを取得（SQLのLIKEをsqlテンプレートで記述）
  const rows = await db
    .select({ date: entries.date, content: entries.content })
    .from(entries)
    .where(sql`${entries.date} LIKE ${year + "-%"}`)
    .orderBy(desc(entries.date));

  const items = rows.map((row) => ({
    date: row.date,
    preview: makePreview(row.content, 60),
  }));

  return NextResponse.json({ items, years });
}
