"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function CalendarHeaderLeft() {
  return (
    <Link href="/entries">
      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
        日記一覧
      </Button>
    </Link>
  );
}

export function CalendarHeaderRight() {
  return (
    <div className="flex items-center gap-1">
      <Link href="/settings">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
          設定
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="text-zinc-400 hover:text-zinc-100"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        ログアウト
      </Button>
    </div>
  );
}
