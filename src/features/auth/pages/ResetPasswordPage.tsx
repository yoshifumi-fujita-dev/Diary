"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "pin" | "newPassword" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // PINの形式確認だけここでやり、実際の検証はパスワード変更時にまとめて行う
    if (!pin.trim()) {
      setError("PINを入力してください");
      setLoading(false);
      return;
    }

    setStep("newPassword");
    setLoading(false);
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, newPassword }),
    });
    const data = await res.json();

    if (res.ok) {
      setStep("done");
    } else {
      if (data.error === "PINが違います") {
        setStep("pin");
        setPin("");
      }
      setError(data.error ?? "エラーが発生しました");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-center text-xl text-zinc-100">
            パスワードのリセット
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <p className="text-zinc-400 text-sm">
                リセット用PINを入力してください。
              </p>
              <div className="space-y-2">
                <Label className="text-zinc-400">PIN</Label>
                <Input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 tracking-widest text-center text-lg"
                  placeholder="------"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                次へ
              </Button>
              <Link href="/login" className="block text-center text-sm text-zinc-500 hover:text-zinc-300">
                ログインに戻る
              </Link>
            </form>
          )}

          {step === "newPassword" && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <p className="text-zinc-400 text-sm">
                新しいログインパスワードを設定してください。
              </p>
              <div className="space-y-2">
                <Label className="text-zinc-400">新しいパスワード</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">確認</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "変更中..." : "パスワードを変更する"}
              </Button>
              <button
                type="button"
                onClick={() => { setStep("pin"); setError(""); }}
                className="block w-full text-center text-sm text-zinc-500 hover:text-zinc-300"
              >
                ← PINを入力し直す
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <p className="text-green-400 text-sm">パスワードを変更しました。</p>
              <Button className="w-full" onClick={() => router.push("/login")}>
                ログインへ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
