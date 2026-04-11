import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { verifyResetPin, setResetPin } from "@/server/auth/passwords";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPin, newPin } = await request.json();

  const valid = await verifyResetPin(currentPin);
  if (!valid) return NextResponse.json({ error: "現在のPINが違います" }, { status: 400 });

  await setResetPin(newPin);
  return NextResponse.json({ ok: true });
}
