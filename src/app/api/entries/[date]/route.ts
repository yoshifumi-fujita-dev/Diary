import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

type Params = { params: Promise<{ date: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const [entry] = await db.select().from(entries).where(eq(entries.date, date));
  return NextResponse.json(entry ?? null);
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const { content } = await request.json();

  const [existing] = await db.select().from(entries).where(eq(entries.date, date));

  let entry;
  if (existing) {
    [entry] = await db
      .update(entries)
      .set({ content, updatedAt: sql`(datetime('now', 'localtime'))` })
      .where(eq(entries.date, date))
      .returning();
  } else {
    [entry] = await db
      .insert(entries)
      .values({ date, content })
      .returning();
  }

  return NextResponse.json(entry);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  await db.delete(entries).where(eq(entries.date, date));
  return new NextResponse(null, { status: 204 });
}
