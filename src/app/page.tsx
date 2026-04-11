import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { initializeDb } from "@/lib/init-db";
import CalendarView from "@/components/CalendarView";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  await initializeDb();

  const allEntries = await db.select({ date: entries.date }).from(entries);
  const entryDates = allEntries.map((e) => e.date);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex gap-1 w-24">
            <Link href="/entries">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                日記一覧
              </Button>
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">4423 Diary</h1>
          <div className="flex gap-1">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                設定
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit" className="text-zinc-400 hover:text-zinc-100">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <CalendarView entryDates={entryDates} />
      </main>
    </div>
  );
}
