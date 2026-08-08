import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/entries/pages/EditEntryPage", () => ({ default: () => null }));
vi.mock("@/server/entries", () => ({ getEntryByDate: vi.fn() }));

import { redirect } from "next/navigation";
import { getEntryByDate } from "@/server/entries";
import EditEntryRoute from "@/app/entries/[date]/edit/page";

const mockRedirect = redirect as ReturnType<typeof vi.fn>;
const mockGetEntryByDate = getEntryByDate as ReturnType<typeof vi.fn>;

function makeProps(searchParams: { from?: string; mode?: string } = {}) {
  return {
    params: Promise.resolve({ date: "2026-08-07" }),
    searchParams: Promise.resolve(searchParams),
  };
}

describe("日記編集ルート", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("日記一覧から開いた既存日記は閲覧画面へ転送する", async () => {
    mockGetEntryByDate.mockResolvedValue({ id: 1 });

    await EditEntryRoute(makeProps({ from: "list" }));

    expect(mockRedirect).toHaveBeenCalledWith("/entries/2026-08-07?from=list");
  });

  it("カレンダーから開いた既存日記は編集画面を表示する", async () => {
    mockGetEntryByDate.mockResolvedValue({ id: 1 });

    await EditEntryRoute(makeProps());

    expect(mockGetEntryByDate).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("mode=editなら既存確認をせず編集画面を表示する", async () => {
    await EditEntryRoute(makeProps({ mode: "edit" }));

    expect(mockGetEntryByDate).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});