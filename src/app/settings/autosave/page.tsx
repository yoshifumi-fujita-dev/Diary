"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const intervals = [
  { label: "1秒", value: 1000 },
  { label: "1.5秒", value: 1500 },
  { label: "2秒", value: 2000 },
  { label: "3秒", value: 3000 },
  { label: "5秒", value: 5000 },
];

export default function AutosavePage() {
  const [enabled, setEnabled] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/autosave")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setEnabled(Boolean(data.enabled));
          setIntervalMs(Number(data.intervalMs) || 1500);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/settings/autosave", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, intervalMs }),
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
          <span className="text-zinc-100 font-medium">自動保存</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">自動保存の設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-100 text-sm font-medium">自動保存</div>
                <div className="text-zinc-500 text-xs">入力停止後に自動で保存します</div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setEnabled((v) => !v)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  enabled ? "bg-green-500" : "bg-zinc-700"
                } ${loading ? "opacity-50" : ""}`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-zinc-100 text-sm font-medium">保存間隔</div>
              <div className="grid grid-cols-3 gap-2">
                {intervals.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!enabled || loading}
                    onClick={() => setIntervalMs(item.value)}
                    className={`py-2 rounded-lg text-xs transition-colors ${
                      intervalMs === item.value
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                    } ${!enabled || loading ? "opacity-50" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
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
