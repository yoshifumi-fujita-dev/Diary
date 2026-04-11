"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteButton({ date }: { date: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/entries/${date}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          削除する
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-zinc-400 hover:text-red-500"
    >
      削除
    </Button>
  );
}
