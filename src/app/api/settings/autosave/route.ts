import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getAutosaveSettings, setAutosaveSettings } from "@/server/settings";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getAutosaveSettings();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await setAutosaveSettings({ enabled: body.enabled, intervalMs: body.intervalMs });

  return NextResponse.json({ ok: true });
}
