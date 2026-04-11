import { stripHtml } from "@/features/entries/lib/text";

export function makePreview(html: string, length: number): string {
  const text = stripHtml(html);
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}
