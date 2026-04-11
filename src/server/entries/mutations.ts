import { db } from "@/server/db";
import { entries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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
