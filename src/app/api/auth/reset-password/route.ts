import { NextResponse } from "next/server";
import { verifyResetPin, setLoginPassword } from "@/server/auth/passwords";
import { initializeDb } from "@/server/auth/init-db";

export async function POST(request: Request) {
  await initializeDb();

  const { pin, newPassword } = await request.json();

  if (!pin || !newPassword) {
    return NextResponse.json({ error: "入力が不足しています" }, { status: 400 });
  }

  const valid = await verifyResetPin(pin);
  if (!valid) {
    return NextResponse.json({ error: "PINが違います" }, { status: 401 });
  }

  await setLoginPassword(newPassword);
  return NextResponse.json({ ok: true });
}
