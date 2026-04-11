import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

vi.mock("drizzle-orm", () => ({
  desc: vi.fn((x) => x),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.join("?") + values.join("")
  ),
}));

vi.mock("@/db/schema", () => ({
  entries: { date: "date", content: "content" },
}));

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { GET } from "@/app/api/entries/list/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockCookies = cookies as ReturnType<typeof vi.fn>;
const mockDb = db as { select: ReturnType<typeof vi.fn> };

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/entries/list");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

function mockDbChain(rows: unknown[]) {
  // thenable にすることで await chain.from() と chain.from().where().orderBy() の両方に対応
  const chain: Record<string, unknown> & { then: (r: (v: unknown) => void) => void } = {
    then: (resolve) => resolve(rows),
    from: vi.fn(function () { return chain; }),
    where: vi.fn(function () { return chain; }),
    orderBy: vi.fn(function () { return Promise.resolve(rows); }),
  };
  mockDb.select.mockReturnValue(chain);
  return chain;
}

describe("GET /api/entries/list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("セッションがない場合 401 を返す", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest({ year: "2026" })) as { status: number };
    expect(res.status).toBe(401);
  });

  it("diary_access クッキーがない場合 401 を返す", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockCookies.mockResolvedValue({ get: () => undefined });
    const res = await GET(makeRequest({ year: "2026" })) as { status: number };
    expect(res.status).toBe(401);
  });

  it("year 未指定の場合は items: [] と years を返す", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockCookies.mockResolvedValue({ get: () => ({ value: "1" }) });
    mockDbChain([
      { date: "2026-04-11" },
      { date: "2025-12-31" },
    ]);
    const res = await GET(makeRequest()) as { status: number; body: { items: unknown[]; years: string[] } };
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.years).toContain("2026");
    expect(res.body.years).toContain("2025");
  });

  it("year 指定時は指定年のエントリと years を返す", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockCookies.mockResolvedValue({ get: () => ({ value: "1" }) });

    // 1回目: 全日付取得、2回目: 指定年エントリ取得
    const allDatesChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockResolvedValue([
        { date: "2026-04-11" },
        { date: "2025-03-01" },
      ]),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };
    const yearRowsChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        { date: "2026-04-11", content: "<p>今日の日記</p>" },
      ]),
    };
    mockDb.select
      .mockReturnValueOnce(allDatesChain)
      .mockReturnValueOnce(yearRowsChain);

    const res = await GET(makeRequest({ year: "2026" })) as {
      status: number;
      body: { items: { date: string; preview: string }[]; years: string[] };
    };
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].date).toBe("2026-04-11");
    expect(res.body.items[0].preview).toBe("今日の日記");
    expect(res.body.years).toContain("2026");
    expect(res.body.years).toContain("2025");
    // 新しい年が先に来る
    expect(res.body.years.indexOf("2026")).toBeLessThan(res.body.years.indexOf("2025"));
  });

  it("不正な year パラメータは items: [] を返す", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockCookies.mockResolvedValue({ get: () => ({ value: "1" }) });
    mockDbChain([{ date: "2026-04-11" }]);
    const res = await GET(makeRequest({ year: "abc" })) as { status: number; body: { items: unknown[] } };
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });
});
