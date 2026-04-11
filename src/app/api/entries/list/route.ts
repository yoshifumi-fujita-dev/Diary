import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { listEntriesByYear } from "@/server/entries";
import { hasDiaryAccess } from "@/server/auth/diary-access";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const diaryAccess = await hasDiaryAccess();
  if (!diaryAccess) return NextResponse.json({ error: "Forbidden" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? "";
  const data = await listEntriesByYear(year);
  return NextResponse.json(data);
}
