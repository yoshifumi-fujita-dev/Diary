import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { verifyDiaryPassword } from "@/server/auth/passwords";
import { attachDiaryAccessCookie } from "@/server/auth/diary-access";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await request.json();
  const valid = await verifyDiaryPassword(password);

  if (valid) return attachDiaryAccessCookie(NextResponse.json({ ok: true }));
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
