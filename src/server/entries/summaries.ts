import { eq, sql } from "drizzle-orm";
import { entrySummaries } from "@/db/schema";
import {
  getSummarySourceHash,
} from "@/features/entries/lib/summary";
import { db } from "@/server/db";

export { getSummarySource, getSummarySourceHash, MAX_SUMMARY_SOURCE_LENGTH } from "@/features/entries/lib/summary";

export type EntrySummaryState = {
  summary: string;
  isStale: boolean;
  updatedAt: string;
};

export async function getEntrySummary(entryId: number, content: string): Promise<EntrySummaryState | null> {
  const [row] = await db
    .select()
    .from(entrySummaries)
    .where(eq(entrySummaries.entryId, entryId));

  if (!row) return null;

  return {
    summary: row.summary,
    isStale: row.sourceHash !== getSummarySourceHash(content),
    updatedAt: row.updatedAt,
  };
}

export async function saveEntrySummary(input: {
  entryId: number;
  content: string;
  summary: string;
  model: string;
  promptVersion: string;
}) {
  const sourceHash = getSummarySourceHash(input.content);
  const [row] = await db
    .insert(entrySummaries)
    .values({
      entryId: input.entryId,
      summary: input.summary,
      sourceHash,
      model: input.model,
      promptVersion: input.promptVersion,
    })
    .onConflictDoUpdate({
      target: entrySummaries.entryId,
      set: {
        summary: input.summary,
        sourceHash,
        model: input.model,
        promptVersion: input.promptVersion,
        updatedAt: sql`(datetime('now', 'localtime'))`,
      },
    })
    .returning();

  return row;
}

export async function deleteEntrySummary(entryId: number) {
  await db.delete(entrySummaries).where(eq(entrySummaries.entryId, entryId));
}