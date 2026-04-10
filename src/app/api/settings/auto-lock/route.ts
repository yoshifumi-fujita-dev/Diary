import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const KEY = "auto_lock";

function parseValue(value: string | null) {
  if (!value) return { idleTimeoutMs: 180000 };
  try {
    const parsed = JSON.parse(value);
    const nextIdle = Number(parsed.idleTimeoutMs);
    return { idleTimeoutMs: Number.isFinite(nextIdle) ? nextIdle : 180000 };
  } catch {
    return { idleTimeoutMs: 180000 };
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db.select().from(settings).where(eq(settings.key, KEY));
  const data = parseValue(row?.value ?? null);
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const rawIdleTimeout = Number(body.idleTimeoutMs);
  const idleTimeoutMs = rawIdleTimeout === 0 ? 0 : Math.max(60000, rawIdleTimeout || 180000);
  const value = JSON.stringify({ idleTimeoutMs });

  await db
    .insert(settings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });

  return NextResponse.json({ ok: true });
}
