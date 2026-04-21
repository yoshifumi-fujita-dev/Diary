import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { entries } from "@/db/schema";
import { initializeDb } from "@/server/auth/init-db";
import CalendarView from "@/features/calendar/components/CalendarView";

function getTodayStrJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  await initializeDb();

  const allEntries = await db.select({ date: entries.date }).from(entries);
  const entryDates = allEntries.map((e) => e.date);
  const todayStr = getTodayStrJST();

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-center">
          <h1 className="text-xl font-semibold text-zinc-100">4423 Diary</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <CalendarView entryDates={entryDates} todayStr={todayStr} />
      </main>
    </div>
  );
}
