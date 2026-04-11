"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type ListItem = { date: string; preview: string };

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CURRENT_YEAR = String(new Date().getFullYear());

function parseDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function EntriesListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year") ?? CURRENT_YEAR;

  const [items, setItems] = useState<ListItem[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const skipAuth = searchParams.get("skip_auth") === "1";
  const [showModal, setShowModal] = useState(!skipAuth);
  const [verified, setVerified] = useState(skipAuth);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(180000);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());

  const grouped = useMemo(() => {
    const map: Record<string, ListItem[]> = {};
    for (const item of items) {
      const key = item.date.slice(0, 7);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [, month] = key.split("-").map(Number);
        return { key, label: `${month}月`, items: map[key] };
      });
  }, [items]);

  const yearIndex = years.indexOf(yearParam);
  const prevYear = years[yearIndex + 1] ?? null;
  const nextYear = years[yearIndex - 1] ?? null;

  async function load(year: string) {
    setLoading(true);
    setLoadError("");
    setItems([]);
    try {
      const res = await fetch(`/api/entries/list?year=${year}`);
      if (res.status === 401) {
        const data = await res.json().catch(() => null);
        if (data?.error === "Unauthorized") {
          router.push("/login");
          return;
        }
        setShowModal(true);
        return;
      }
      if (!res.ok) {
        setLoadError(`読み込みに失敗しました (${res.status})`);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setYears(data.years ?? []);
    } catch {
      setLoadError("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!verified) return;
    load(yearParam);
  }, [yearParam, verified]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showModal]);

  useEffect(() => {
    if (!yearDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [yearDropdownOpen]);

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
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [router, idleTimeoutMs]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setPwError("");

    const res = await fetch("/api/auth/verify-diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setShowModal(false);
      setPassword("");
      setVerified(true);
    } else {
      setPwError("パスワードが違います");
    }
    setVerifying(false);
  }

  return (
    <>
      {/* ── 年ナビ + 月ナビ（スティッキー） ── */}
      <div className="sticky top-13.25 z-10 bg-zinc-950 border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4">
          {/* 年ナビ */}
          <div className="flex items-center justify-between py-3">
            <div className="w-20">
              {prevYear && (
                <Link
                  href={`/entries?year=${prevYear}`}
                  className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  ← {prevYear}
                </Link>
              )}
            </div>
            <div ref={dropdownRef} className="relative flex items-center gap-2">
              <button
                onClick={() => setYearDropdownOpen((v) => !v)}
                className="text-zinc-100 font-medium hover:text-zinc-300 transition-colors"
              >
                {yearParam}年 ▾
              </button>
              {items.length > 0 && (
                <span className="text-xs text-zinc-400">{items.length}件</span>
              )}
              {yearDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 py-1 min-w-24">
                  {years.map((y) => (
                    <Link
                      key={y}
                      href={`/entries?year=${y}`}
                      onClick={() => setYearDropdownOpen(false)}
                      className={`block px-4 py-2 text-sm text-center transition-colors ${
                        y === yearParam
                          ? "text-zinc-100 font-medium"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      }`}
                    >
                      {y}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="w-20 text-right">
              {nextYear && (
                <Link
                  href={`/entries?year=${nextYear}`}
                  className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  {nextYear} →
                </Link>
              )}
            </div>
          </div>

          {/* 月ナビ */}
          <div className="flex justify-center gap-x-0.5 pb-2">
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, "0");
              const key = `${yearParam}-${m}`;
              const hasEntries = grouped.some((g) => g.key === key);
              return hasEntries ? (
                <a
                  key={m}
                  href={`#month-${key}`}
                  className="px-2 py-1 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  {i + 1}月
                </a>
              ) : (
                <span key={m} className="px-2 py-1 text-sm text-zinc-700 cursor-default">
                  {i + 1}月
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── エントリ一覧 ── */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-zinc-600 text-sm">読み込み中...</div>
        )}
        {!loading && loadError && (
          <div className="text-red-400 text-sm">{loadError}</div>
        )}
        {!loading && !loadError && items.length === 0 && (
          <div className="text-zinc-600 text-sm text-center py-16">
            {yearParam}年の日記はありません
          </div>
        )}

        {!loading && !loadError && grouped.map((group) => (
          <section key={group.key} id={`month-${group.key}`} className="mb-8 scroll-mt-36">
            <h2 className="text-xs text-zinc-400 mb-2 pb-2 border-b border-zinc-800/60">
              {group.label}
              <span className="ml-2 text-zinc-500">{group.items.length}件</span>
            </h2>
            <div>
              {group.items.map((item) => {
                const d = parseDate(item.date);
                const weekday = WEEKDAYS[d.getDay()];
                const isSun = d.getDay() === 0;
                const isSat = d.getDay() === 6;
                return (
                  <Link
                    key={item.date}
                    href={`/entries/${item.date}/edit?from=list`}
                    className="flex items-baseline gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-zinc-900/70 transition-colors group"
                  >
                    <span
                      className={`text-xs w-5 shrink-0 text-center ${
                        isSun ? "text-red-400" : isSat ? "text-blue-400" : "text-zinc-400"
                      }`}
                    >
                      {weekday}
                    </span>
                    <span className="text-sm text-zinc-400 shrink-0 tabular-nums w-8">
                      {d.getDate()}日
                    </span>
                    <span className="text-sm text-zinc-500 truncate group-hover:text-zinc-300 transition-colors min-w-0">
                      {item.preview || (
                        <span className="text-zinc-700 italic text-xs">（空）</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h2 className="text-zinc-100 font-semibold text-base mb-4">
              日記パスワードを入力
            </h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
                placeholder="パスワード"
              />
              {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-2.5 rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {verifying ? "確認中..." : "開く"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function EntriesListPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← カレンダー
          </Link>
          <span className="text-zinc-100 font-medium">日記一覧</span>
          <div className="w-16" />
        </div>
      </header>
      <Suspense fallback={<div className="text-zinc-600 text-sm p-8">読み込み中...</div>}>
        <EntriesListInner />
      </Suspense>
    </div>
  );
}
