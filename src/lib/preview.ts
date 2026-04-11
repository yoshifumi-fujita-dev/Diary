export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function makePreview(html: string, length: number): string {
  const text = stripHtml(html);
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}
