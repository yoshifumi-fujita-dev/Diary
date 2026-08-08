import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { entries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeleteButton from "@/features/entries/components/DeleteButton";
import EntrySummary from "@/features/entries/components/EntrySummary";
import { formatDate } from "@/features/entries/lib/date";
import { getEntrySummary } from "@/server/entries";

type Props = {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EntryPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const [{ date }, query] = await Promise.all([params, searchParams]);
  const fromList = query.from === "list";
  const backHref = fromList ? `/entries?year=${date.slice(0, 4)}&skip_auth=1` : "/";
  const editHref = `/entries/${date}/edit?mode=edit${fromList ? "&from=list" : ""}`;
  const [entry] = await db.select().from(entries).where(eq(entries.date, date));
  const summary = entry ? await getEntrySummary(entry.id, entry.content) : null;

  return (
    <div className="min-h-dvh bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-0 pb-4 flex items-center justify-between">
          <Link href={backHref} className="text-sm text-zinc-400 hover:text-zinc-100">
            {fromList ? "← 日記一覧" : "← カレンダー"}
          </Link>
          <div className="flex gap-2">
            <Link href={editHref}>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                {entry ? "編集" : "書く"}
              </Button>
            </Link>
            {entry && <DeleteButton date={date} />}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-sm text-zinc-500 mb-4">{formatDate(date, "long")}</div>
        {entry ? (
          <>
            <EntrySummary
              date={date}
              initialSummary={summary?.summary ?? null}
              initialIsStale={summary?.isStale ?? false}
              hasContent={entry.content.length > 0}
            />
            <div
              className="prose prose-invert prose-zinc max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p>この日の日記はまだありません</p>
            <Link href={editHref}>
              <Button className="mt-4" size="sm">
                書く
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
