"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DEFAULT_PASSWORD = "Fujita_4423";
const DEFAULT_SALT = "saltは必ず8バイト以上";

type ImportResult = {
  ok: boolean;
  source?: string;
  sourceDir?: string;
  dryRun: boolean;
  overwrite: boolean;
  files: number;
  imported: number;
  skipped: number;
  failed: number;
  skippedDates: string[];
  failedFiles: { file: string; error: string }[];
  note?: string;
};

export default function LegacyImportPage() {
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [salt, setSalt] = useState(DEFAULT_SALT);
  const [dryRun, setDryRun] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    if (files.length === 0) {
      setError("インポート対象のフォルダを選択してください");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("password", password);
    formData.append("salt", salt);
    formData.append("dryRun", String(dryRun));
    formData.append("overwrite", String(overwrite));

    const res = await fetch("/api/settings/legacy-import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (res.ok) {
      setResult(data as ImportResult);
    } else {
      setError(data?.error ?? "インポートに失敗しました");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-0 pb-4 flex items-center justify-between">
          <Link href="/settings" className="text-sm text-zinc-400 hover:text-zinc-100">
            ← 設定
          </Link>
          <span className="text-zinc-100 font-medium">旧システムインポート</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-base">暗号化ファイルの取り込み</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">ソースフォルダ</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    // @ts-expect-error - webkitdirectory is non-standard but supported by Chromium.
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 file:text-zinc-100 file:bg-zinc-700 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  フォルダを選択すると中の .txt をまとめて読み込みます
                </p>
                {files.length > 0 && (
                  <p className="text-xs text-zinc-400">選択済み: {files.length} 件</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">パスワード</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">ソルト</Label>
                <Input
                  type="text"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="accent-zinc-200"
                  />
                  まずはドライラン（DBへ書き込みなし）
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="accent-zinc-200"
                  />
                  既存日付を上書きする
                </label>
                <p className="text-xs text-zinc-500">本番環境では実行できません</p>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button type="submit" disabled={loading} size="sm" className="w-full">
                {loading ? "インポート中..." : "インポートを実行"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-base">結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-zinc-300">
              {result.note && <p className="text-zinc-500">{result.note}</p>}
              <p>対象ファイル: {result.files}</p>
              <p>インポート: {result.imported}</p>
              <p>スキップ: {result.skipped}</p>
              <p>失敗: {result.failed}</p>
              <p>ドライラン: {result.dryRun ? "はい" : "いいえ"}</p>
              <p>上書き: {result.overwrite ? "はい" : "いいえ"}</p>

              {result.skippedDates.length > 0 && (
                <div className="text-zinc-500">
                  <p>スキップ日付（既存）</p>
                  <div className="mt-1 max-h-32 overflow-auto rounded bg-zinc-950/40 p-2 whitespace-pre-wrap">
                    {result.skippedDates.join("\n")}
                  </div>
                </div>
              )}

              {result.failedFiles.length > 0 && (
                <div className="text-red-300">
                  <p>失敗ファイル（最大20件）</p>
                  <div className="mt-1 max-h-32 overflow-auto rounded bg-zinc-950/40 p-2">
                    {result.failedFiles.map((item) => (
                      <div key={item.file}>
                        {item.file}: {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
