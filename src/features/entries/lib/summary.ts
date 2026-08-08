import { createHash } from "node:crypto";
import { stripHtml } from "@/features/entries/lib/text";

export const MAX_SUMMARY_SOURCE_LENGTH = 12_000;

export function getSummarySource(content: string): string {
  return stripHtml(content).slice(0, MAX_SUMMARY_SOURCE_LENGTH);
}

export function getSummarySourceHash(content: string): string {
  return createHash("sha256").update(stripHtml(content)).digest("hex");
}