"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Notebook, Shield, Timer, Lock } from "lucide-react";

const items = [
  {
    href: "/settings/login-password",
    title: "ログインパスワードの変更",
    desc: "ログイン用パスワードを変更します",
    Icon: KeyRound,
  },
  {
    href: "/settings/diary-password",
    title: "日記パスワードの変更",
    desc: "日記を開くときのパスワードを変更します",
    Icon: Notebook,
  },
  {
    href: "/settings/pin",
    title: "リセットPINの変更",
    desc: "パスワードリセット用PINを変更します",
    Icon: Shield,
  },
  {
    href: "/settings/autosave",
    title: "自動保存の設定",
    desc: "自動保存のON/OFFや間隔を設定します",
    Icon: Timer,
  },
  {
    href: "/settings/auto-lock",
    title: "自動ロックの設定",
    desc: "無操作でカレンダーへ戻す時間を設定します",
    Icon: Lock,
  },
];

export default function SettingsMenuPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← カレンダー
          </Link>
          <span className="text-zinc-100 font-medium">設定</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader>
                <CardTitle className="text-zinc-100 text-base flex items-center gap-2">
                  <item.Icon className="w-4 h-4 text-zinc-400" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-500">{item.desc}</CardContent>
            </Card>
          </Link>
        ))}
      </main>
    </div>
  );
}
