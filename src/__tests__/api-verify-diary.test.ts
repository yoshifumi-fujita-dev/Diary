import { describe, it, expect, vi, beforeEach } from "vitest";

// next/server のモック
vi.mock("next/server", () => {
  const cookies: Record<string, string> = {};
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        body,
        cookies: {
          set: (key: string, value: string) => {
            cookies[key] = value;
          },
          _store: cookies,
        },
      }),
    },
  };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/passwords", () => ({
  verifyDiaryPassword: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { verifyDiaryPassword } from "@/lib/passwords";
import { POST } from "@/app/api/auth/verify-diary/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockVerify = verifyDiaryPassword as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/verify-diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/verify-diary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("セッションがない場合 401 を返す", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ password: "test" }));
    expect(res.status).toBe(401);
    expect((res as { body: { error: string } }).body.error).toBe("Unauthorized");
  });

  it("パスワードが間違っている場合 401 を返す", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockVerify.mockResolvedValue(false);
    const res = await POST(makeRequest({ password: "wrong" }));
    expect(res.status).toBe(401);
    expect((res as { body: { error: string } }).body.error).toBe("Invalid password");
  });

  it("正しいパスワードの場合 200 を返す", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockVerify.mockResolvedValue(true);
    const res = await POST(makeRequest({ password: "correct" }));
    expect(res.status).toBe(200);
    expect((res as { body: { ok: boolean } }).body.ok).toBe(true);
  });

  it("正しいパスワードの場合 diary_access クッキーをセットする", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    mockVerify.mockResolvedValue(true);
    const res = await POST(makeRequest({ password: "correct" })) as {
      cookies: { _store: Record<string, string> };
    };
    expect(res.cookies._store["diary_access"]).toBe("1");
  });
});
