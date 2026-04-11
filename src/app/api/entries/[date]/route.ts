import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getEntryByDate, upsertEntry, deleteEntryByDate } from "@/server/entries";

type Params = { params: Promise<{ date: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const entry = await getEntryByDate(date);
  return NextResponse.json(entry);
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const { content } = await request.json();

  const entry = await upsertEntry(date, content);

  return NextResponse.json(entry);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  await deleteEntryByDate(date);
  return new NextResponse(null, { status: 204 });
}
