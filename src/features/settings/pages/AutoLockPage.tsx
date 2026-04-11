"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const idleTimeouts = [
  { label: "無効", value: 0 },
  { label: "1分", value: 60000 },
  { label: "2分", value: 120000 },
  { label: "3分", value: 180000 },
  { label: "5分", value: 300000 },
  { label: "10分", value: 600000 },
];

export default function AutoLockPage() {
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(180000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/auto-lock")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const nextIdle = Number(data.idleTimeoutMs);
        setIdleTimeoutMs(Number.isFinite(nextIdle) ? nextIdle : 180000);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/settings/auto-lock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idleTimeoutMs }),
    });
    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "保存に失敗しました");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← 設定
          </Link>
          <span className="text-zinc-100 font-medium">自動ロック</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">自動ロックの設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-zinc-100 text-sm font-medium">自動ロックまでの時間</div>
              <div className="grid grid-cols-3 gap-2">
                {idleTimeouts.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setIdleTimeoutMs(item.value)}
                    className={`py-2 rounded-lg text-xs transition-colors ${
                      idleTimeoutMs === item.value
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                    } ${loading ? "opacity-50" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="text-zinc-500 text-xs">
                操作がないときに自動でカレンダーへ戻します
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {saved && <p className="text-green-400 text-sm">保存しました</p>}

            <Button type="button" onClick={handleSave} disabled={saving || loading} size="sm" className="w-full">
              {saving ? "保存中..." : "保存する"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
