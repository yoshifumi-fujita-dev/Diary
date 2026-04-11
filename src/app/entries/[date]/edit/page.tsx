"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor"), {
  ssr: false,
});

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function EditEntryPage() {
  const router = useRouter();
  const { date } = useParams<{ date: string }>();
  const searchParams = useSearchParams();
  const fromList = searchParams.get("from") === "list";
  const backHref = fromList ? `/entries?year=${date.slice(0, 4)}&skip_auth=1` : "/";
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasEntry, setHasEntry] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedContentRef = useRef("");
  const savingRef = useRef(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [autosaveIntervalMs, setAutosaveIntervalMs] = useState(1500);
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(180000);
  const idleTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    fetch(`/api/entries/${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((entry) => {
        if (entry) {
          setContent(entry.content ?? "");
          setHasEntry(true);
          lastSavedContentRef.current = entry.content ?? "";
          setLastSavedAt(new Date(entry.updatedAt ?? Date.now()));
          setSaveState("saved");
        } else {
          lastSavedContentRef.current = "";
        }
        setLoaded(true);
      });
  }, [date]);

  useEffect(() => {
    fetch("/api/settings/autosave")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setAutosaveEnabled(Boolean(data.enabled));
        setAutosaveIntervalMs(Number(data.intervalMs) || 1500);
        const nextIdle = Number(data.idleTimeoutMs);
        setIdleTimeoutMs(Number.isFinite(nextIdle) ? nextIdle : 180000);
      })
      .catch(() => {
        setAutosaveEnabled(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/settings/auto-lock")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const nextIdle = Number(data.idleTimeoutMs);
        setIdleTimeoutMs(Number.isFinite(nextIdle) ? nextIdle : 180000);
      });
  }, []);

  useEffect(() => {
    const resetIdle = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["keydown", "mousedown", "mousemove", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));

    const tick = () => {
      if (idleTimeoutMs === 0) {
        idleTimerRef.current = window.setTimeout(tick, 1000);
        return;
      }
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= idleTimeoutMs) {
        router.push("/?autolock=1");
        return;
      }
      idleTimerRef.current = window.setTimeout(tick, 1000);
    };

    idleTimerRef.current = window.setTimeout(tick, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [router, idleTimeoutMs]);

  useEffect(() => {
    if (!autosaveEnabled && saveState === "saved") {
      setSaveState("idle");
    }
  }, [autosaveEnabled, saveState]);

  async function saveEntry({ redirect }: { redirect: boolean }) {
    if (savingRef.current) return;
    if (!loaded) return;
    if (content === lastSavedContentRef.current) {
      if (redirect) router.push("/");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveState("saving");
    const res = await fetch(`/api/entries/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      lastSavedContentRef.current = content;
      setHasEntry(true);
      setLastSavedAt(new Date());
      setSaveState("saved");
      if (redirect) router.push("/");
    } else {
      setSaveState("error");
    }
    savingRef.current = false;
    setSaving(false);
  }

  useEffect(() => {
    if (!loaded) return;
    if (content === lastSavedContentRef.current) return;

    if (!autosaveEnabled) return;
    const id = setTimeout(() => {
      saveEntry({ redirect: false });
    }, autosaveIntervalMs);

    return () => clearTimeout(id);
  }, [content, loaded, autosaveEnabled, autosaveIntervalMs]);

  async function handleDelete() {
    await fetch(`/api/entries/${date}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={backHref} className="text-sm text-zinc-400 hover:text-zinc-100">
            {fromList ? "← 日記一覧" : "← カレンダー"}
          </Link>
          <span className="text-zinc-500 text-sm">{formatDate(date)}</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loaded && <TiptapEditor content={content} onChange={setContent} />}

        <div className="text-xs text-zinc-500">
          {saveState === "error" && "保存に失敗しました"}
          {saveState !== "error" && lastSavedAt && `保存済み ${lastSavedAt.toLocaleTimeString("ja-JP")}`}
        </div>

        {hasEntry && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="w-full py-2.5 rounded-xl text-zinc-500 hover:text-red-400 transition-colors text-sm"
          >
            この日の日記を削除
          </button>
        )}

        {confirming && (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl bg-red-900/50 text-red-400 hover:bg-red-900 transition-colors text-sm font-medium"
            >
              削除する
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
            >
              キャンセル
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
