import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  content: text("content").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now', 'localtime'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
