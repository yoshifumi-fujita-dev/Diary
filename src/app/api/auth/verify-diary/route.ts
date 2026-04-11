import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyDiaryPassword } from "@/lib/passwords";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await request.json();
  const valid = await verifyDiaryPassword(password);

  if (valid) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("diary_access", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
