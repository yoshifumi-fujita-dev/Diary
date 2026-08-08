"use client";

import { useState } from "react";
import { RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  date: string;
  initialSummary: string | null;
  initialIsStale: boolean;
  hasContent: boolean;
};

export default function EntrySummary({ date, initialSummary, initialIsStale, hasContent }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [isStale, setIsStale] = useState(initialIsStale);
  const [confirming, setConfirming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch(`/api/entries/${date}/summary`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "AI要約の生成に失敗しました");
        return;
      }
      setSummary(data.summary);
      setIsStale(false);
      setConfirming(false);
    } catch {
      setError("AI要約の生成に失敗しました。しばらくしてからお試しください");
    } finally {
      setIsGenerating(false);
    }
  }

  async function remove() {
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/entries/${date}/summary`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "要約の削除に失敗しました");
        return;
      }
      setSummary(null);
      setIsStale(false);
    } catch {
      setError("要約の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!hasContent) return null;

  return (
    <section className="mb-6 border border-zinc-800 bg-zinc-900/80 px-4 py-4 rounded-lg" aria-labelledby="ai-summary-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ai-summary-heading" className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          <Sparkles className="size-4 text-blue-400" aria-hidden="true" />
          AI要約
        </h2>
        {summary && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={generate}
              disabled={isGenerating || isDeleting}
              aria-label="要約を再生成"
              title="要約を再生成"
            >
              <RefreshCw className={isGenerating ? "animate-spin" : ""} aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={remove}
              disabled={isGenerating || isDeleting}
              aria-label="要約を削除"
              title="要約を削除"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {summary ? (
        <>
          <p className="mt-3 text-sm leading-7 text-zinc-300 whitespace-pre-wrap">{summary}</p>
          {isStale && <p className="mt-3 text-xs text-zinc-500">本文が更新されています</p>}
        </>
      ) : confirming ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-6 text-zinc-400">
            日記本文を外部AIサービスへ送信して要約します。機密情報を含む場合は送信しないでください。
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={generate} disabled={isGenerating}>
              {isGenerating ? "要約を生成中..." : "送信して要約する"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={isGenerating}
            >
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" className="mt-3" onClick={() => setConfirming(true)}>
          <Sparkles aria-hidden="true" />
          AIで要約する
        </Button>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}