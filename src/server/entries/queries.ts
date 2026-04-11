import { db } from "@/server/db";
import { entries } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { makePreview } from "@/features/entries/lib/preview";

export async function listEntries() {
  return db.select().from(entries).orderBy(desc(entries.date));
}

export async function getEntryByDate(date: string) {
  const [row] = await db.select().from(entries).where(eq(entries.date, date));
  return row ?? null;
}

export async function listEntriesByYear(year: string) {
  const allDates = await db.select({ date: entries.date }).from(entries);
  const yearSet = new Set(allDates.map((r) => r.date.slice(0, 4)));
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));

  if (!/^(\d{4})$/.test(year)) {
    return { items: [], years };
  }

  const rows = await db
    .select({ date: entries.date, content: entries.content })
    .from(entries)
    .where(sql`${entries.date} LIKE ${year + "-%"}`)
    .orderBy(desc(entries.date));

  const items = rows.map((row) => ({
    date: row.date,
    preview: makePreview(row.content, 60),
  }));

  return { items, years };
}
