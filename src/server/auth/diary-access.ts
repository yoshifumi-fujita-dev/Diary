import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "diary_access";
const MAX_AGE_SECONDS = 60 * 10;

export async function hasDiaryAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export function attachDiaryAccessCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
