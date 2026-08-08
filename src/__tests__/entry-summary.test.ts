import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSummarySource,
  getSummarySourceHash,
  MAX_SUMMARY_SOURCE_LENGTH,
} from "@/features/entries/lib/summary";
import { DiarySummaryError, generateDiarySummary } from "@/server/ai/diary-summary";

const originalApiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_MODEL;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = originalModel;
});

describe("日記要約の本文処理", () => {
  it("AIへ送る本文はHTMLを除去して上限文字数に収める", () => {
    const content = `<p>${"あ".repeat(MAX_SUMMARY_SOURCE_LENGTH + 1)}</p>`;

    expect(getSummarySource(content)).toHaveLength(MAX_SUMMARY_SOURCE_LENGTH);
  });

  it("送信上限より後ろの本文更新でも要約を失効させる", () => {
    const prefix = "あ".repeat(MAX_SUMMARY_SOURCE_LENGTH);
    const before = `<p>${prefix}最初の末尾</p>`;
    const after = `<p>${prefix}変更した末尾</p>`;

    expect(getSummarySource(before)).toBe(getSummarySource(after));
    expect(getSummarySourceHash(before)).not.toBe(getSummarySourceHash(after));
  });
});

describe("generateDiarySummary", () => {
  it("OpenAI互換APIの要約を正規化して返す", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "test-model";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "  要約の\n本文  " } }] }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateDiarySummary({ date: "2026-08-08", source: "本文" });

    expect(result).toMatchObject({ summary: "要約の 本文", model: "test-model" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("APIキー未設定時は設定エラーを返す", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(generateDiarySummary({ date: "2026-08-08", source: "本文" })).rejects.toEqual(
      expect.objectContaining<Partial<DiarySummaryError>>({ status: 503 })
    );
  });
});