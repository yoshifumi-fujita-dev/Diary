import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const KEY = "autosave";

function parseValue(value: string | null) {
  if (!value) return { enabled: true, intervalMs: 1500 };
  try {
    const parsed = JSON.parse(value);
    return {
      enabled: Boolean(parsed.enabled),
      intervalMs: Number(parsed.intervalMs) || 1500,
    };
  } catch {
    return { enabled: true, intervalMs: 1500 };
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
  const enabled = Boolean(body.enabled);
  const intervalMs = Math.max(500, Number(body.intervalMs) || 1500);
  const value = JSON.stringify({ enabled, intervalMs });

  await db
    .insert(settings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });

  return NextResponse.json({ ok: true });
}
