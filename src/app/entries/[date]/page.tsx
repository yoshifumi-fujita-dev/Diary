import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeleteButton from "./DeleteButton";

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

type Params = { params: Promise<{ date: string }> };

export default async function EntryPage({ params }: Params) {
  const session = await auth();
  if (!session) redirect("/login");

  const { date } = await params;
  const [entry] = await db.select().from(entries).where(eq(entries.date, date));

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← カレンダー
          </Link>
          <div className="flex gap-2">
            <Link href={`/entries/${date}/edit`}>
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
        <div className="text-sm text-zinc-500 mb-4">{formatDate(date)}</div>
        {entry ? (
          <>
            <div
              className="prose prose-invert prose-zinc max-w-none"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p>この日の日記はまだありません</p>
            <Link href={`/entries/${date}/edit`}>
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
