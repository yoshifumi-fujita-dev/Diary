import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => {
  class MockNextResponse {
    status: number;
    body: unknown;

    constructor(body: unknown, init?: { status?: number }) {
      this.status = init?.status ?? 200;
      this.body = body;
    }

    static json(body: unknown, init?: { status?: number }) {
      return new MockNextResponse(body, init);
    }
  }

  return { NextResponse: MockNextResponse };
});

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/auth/diary-access", () => ({ hasDiaryAccess: vi.fn() }));
vi.mock("@/server/entries", () => ({
  deleteEntrySummary: vi.fn(),
  getEntryByDate: vi.fn(),
  saveEntrySummary: vi.fn(),
}));
vi.mock("@/server/ai/diary-summary", () => ({
  DiarySummaryError: class DiarySummaryError extends Error {},
  generateDiarySummary: vi.fn(),
}));

import { auth } from "@/server/auth";
import { hasDiaryAccess } from "@/server/auth/diary-access";
import {
  deleteEntrySummary,
  getEntryByDate,
  saveEntrySummary,
} from "@/server/entries";
import { generateDiarySummary } from "@/server/ai/diary-summary";
import { DELETE, POST } from "@/app/api/entries/[date]/summary/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockHasDiaryAccess = hasDiaryAccess as ReturnType<typeof vi.fn>;
const mockGetEntryByDate = getEntryByDate as ReturnType<typeof vi.fn>;
const mockSaveEntrySummary = saveEntrySummary as ReturnType<typeof vi.fn>;
const mockDeleteEntrySummary = deleteEntrySummary as ReturnType<typeof vi.fn>;
const mockGenerateDiarySummary = generateDiarySummary as ReturnType<typeof vi.fn>;
const params = { params: Promise.resolve({ date: "2026-08-08" }) };

describe("日記要約API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: {} });
    mockHasDiaryAccess.mockResolvedValue(true);
  });

  it("ログインしていない場合は要約を生成しない", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/entries/2026-08-08/summary"), params);

    expect(response.status).toBe(401);
    expect(mockGetEntryByDate).not.toHaveBeenCalled();
  });

  it("日記ロックが解除されていない場合は要約を生成しない", async () => {
    mockHasDiaryAccess.mockResolvedValue(false);

    const response = await POST(new Request("http://localhost/api/entries/2026-08-08/summary"), params);

    expect(response.status).toBe(401);
    expect(mockGetEntryByDate).not.toHaveBeenCalled();
  });

  it("サーバーで取得した日記本文を要約して保存する", async () => {
    mockGetEntryByDate.mockResolvedValue({ id: 12, content: "<p>今日の日記</p>" });
    mockGenerateDiarySummary.mockResolvedValue({
      summary: "今日の出来事を記録した。",
      model: "test-model",
      promptVersion: "test-version",
    });
    mockSaveEntrySummary.mockResolvedValue({
      summary: "今日の出来事を記録した。",
      updatedAt: "2026-08-08 12:00:00",
    });

    const response = (await POST(new Request("http://localhost/api/entries/2026-08-08/summary"), params)) as unknown as {
      status: number;
      body: { summary: string };
    };

    expect(response.status).toBe(200);
    expect(response.body.summary).toBe("今日の出来事を記録した。");
    expect(mockGenerateDiarySummary).toHaveBeenCalledWith({ date: "2026-08-08", source: "今日の日記" });
    expect(mockSaveEntrySummary).toHaveBeenCalledWith(expect.objectContaining({ entryId: 12 }));
  });

  it("要約の削除は対象の日記に紐付く要約だけを削除する", async () => {
    mockGetEntryByDate.mockResolvedValue({ id: 12, content: "<p>今日の日記</p>" });

    const response = await DELETE(new Request("http://localhost/api/entries/2026-08-08/summary"), params);

    expect(response.status).toBe(204);
    expect(mockDeleteEntrySummary).toHaveBeenCalledWith(12);
  });
});