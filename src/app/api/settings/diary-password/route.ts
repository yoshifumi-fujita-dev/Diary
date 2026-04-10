import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyDiaryPassword, setDiaryPassword } from "@/lib/passwords";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  const valid = await verifyDiaryPassword(currentPassword);
  if (!valid) return NextResponse.json({ error: "現在のパスワードが違います" }, { status: 400 });

  await setDiaryPassword(newPassword);
  return NextResponse.json({ ok: true });
}
