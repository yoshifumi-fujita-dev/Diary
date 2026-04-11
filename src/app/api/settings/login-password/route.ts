import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { verifyLoginPassword, setLoginPassword } from "@/server/auth/passwords";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  const valid = await verifyLoginPassword(currentPassword);
  if (!valid) return NextResponse.json({ error: "現在のパスワードが違います" }, { status: 400 });

  await setLoginPassword(newPassword);
  return NextResponse.json({ ok: true });
}
