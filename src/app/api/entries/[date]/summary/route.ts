import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hasDiaryAccess } from "@/server/auth/diary-access";
import {
  deleteEntrySummary,
  getEntryByDate,
  saveEntrySummary,
} from "@/server/entries";
import { getSummarySource } from "@/features/entries/lib/summary";
import { DiarySummaryError, generateDiarySummary } from "@/server/ai/diary-summary";

type Params = { params: Promise<{ date: string }> };

async function canAccessDiary() {
  const session = await auth();
  if (!session) return false;
  return hasDiaryAccess();
}

export async function POST(_request: Request, { params }: Params) {
  if (!(await canAccessDiary())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const entry = await getEntryByDate(date);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const source = getSummarySource(entry.content);
  if (!source) {
    return NextResponse.json({ error: "日記本文が空のため要約できません" }, { status: 422 });
  }

  try {
    const generated = await generateDiarySummary({ date, source });
    const summary = await saveEntrySummary({
      entryId: entry.id,
      content: entry.content,
      ...generated,
    });
    return NextResponse.json({ summary: summary.summary, updatedAt: summary.updatedAt });
  } catch (error) {
    if (error instanceof DiarySummaryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "AI要約の生成に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await canAccessDiary())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const entry = await getEntryByDate(date);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteEntrySummary(entry.id);
  return new NextResponse(null, { status: 204 });
}