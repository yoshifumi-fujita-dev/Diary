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

export async function upsertEntry(date: string, content: string) {
  const [existing] = await db.select().from(entries).where(eq(entries.date, date));
  if (existing) {
    const [row] = await db
      .update(entries)
      .set({ content, updatedAt: sql`(datetime('now', 'localtime'))` })
      .where(eq(entries.date, date))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(entries)
    .values({ date, content })
    .returning();
  return row;
}

export async function deleteEntryByDate(date: string) {
  await db.delete(entries).where(eq(entries.date, date));
}

export async function listEntriesByYear(year: string) {
  const allDates = await db.select({ date: entries.date }).from(entries);
  const yearSet = new Set(allDates.map((r) => r.date.slice(0, 4)));
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));

  if (!/^\d{4}$/.test(year)) {
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
