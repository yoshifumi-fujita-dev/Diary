"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PinPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/settings/reset-pin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin: current, newPin: next }),
    });
    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
      setCurrent("");
      setNext("");
    } else {
      setError(data.error ?? "エラーが発生しました");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← 設定
          </Link>
          <span className="text-zinc-100 font-medium">リセットPIN</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">リセットPINの変更</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">現在のPIN</Label>
                <Input
                  type="text"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 tracking-widest"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">新しいPIN</Label>
                <Input
                  type="text"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 tracking-widest"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">変更しました</p>}
              <Button type="submit" disabled={loading} size="sm" className="w-full">
                {loading ? "変更中..." : "変更する"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
