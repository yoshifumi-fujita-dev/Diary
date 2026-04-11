import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getAutoLockSettings, setAutoLockSettings } from "@/server/settings";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getAutoLockSettings();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await setAutoLockSettings({ idleTimeoutMs: body.idleTimeoutMs });

  return NextResponse.json({ ok: true });
}
