"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function CalendarHeaderLeft() {
  return (
    <Link href="/entries">
      <Button
        variant="ghost"
        size="xs"
        className="text-zinc-400 hover:text-zinc-100 whitespace-nowrap"
      >
        日記一覧
      </Button>
    </Link>
  );
}

export function CalendarHeaderRight() {
  return (
    <div className="flex items-center gap-1 flex-nowrap">
      <Link href="/settings">
        <Button
          variant="ghost"
          size="xs"
          className="text-zinc-400 hover:text-zinc-100 whitespace-nowrap"
        >
          設定
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="xs"
        type="button"
        className="text-zinc-400 hover:text-zinc-100 whitespace-nowrap"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        ログアウト
      </Button>
    </div>
  );
}
