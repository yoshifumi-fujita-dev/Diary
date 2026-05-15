"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const FONTS = [
  { key: "shippori", label: "明朝体", css: "var(--font-shippori)", sample: "今日も良い一日でした。" },
  { key: "noto-sans", label: "ゴシック体", css: "var(--font-noto-sans)", sample: "今日も良い一日でした。" },
  { key: "klee", label: "手書き風", css: "var(--font-klee)", sample: "今日も良い一日でした。" },
];

export default function FontSettingsPage() {
  const [current, setCurrent] = useState("shippori");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/font")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setCurrent(data.font); });
  }, []);

  async function handleSelect(key: string) {
    setCurrent(key);
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings/font", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ font: key }),
    });
    const font = FONTS.find((f) => f.key === key);
    if (font) document.documentElement.style.setProperty("--app-font", font.css);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← 設定
          </Link>
          <span className="text-zinc-100 font-medium">フォント設定</span>
          <div className="w-16 text-right text-xs text-zinc-500">
            {saving ? "保存中..." : saved ? "保存済み" : ""}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 pb-24 sm:pb-8 space-y-3">
        {FONTS.map((font) => (
          <button
            key={font.key}
            onClick={() => handleSelect(font.key)}
            className={`w-full text-left px-5 py-4 rounded-2xl border transition-colors ${
              current === font.key
                ? "border-zinc-500 bg-zinc-800"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <div className="text-xs text-zinc-400 mb-2 flex items-center gap-2">
              {font.label}
              {current === font.key && (
                <span className="text-zinc-300">✓</span>
              )}
            </div>
            <div
              className="text-zinc-100 text-base leading-relaxed"
              style={{ fontFamily: font.css }}
            >
              {font.sample}
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}
