import { db } from "./db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setLoginPassword, setDiaryPassword, setResetPin } from "./passwords";

let initialized = false;

export async function initializeDb(): Promise<void> {
  if (initialized) return;

  const existing = await db.select().from(settings);
  const keys = new Set(existing.map((r) => r.key));

  if (!keys.has("login_password_hash"))
    await setLoginPassword(process.env.AUTH_PASSWORD ?? "password");
  if (!keys.has("diary_password_hash"))
    await setDiaryPassword(process.env.DIARY_PASSWORD ?? "diary123");
  if (!keys.has("reset_pin_hash"))
    await setResetPin(process.env.RESET_PIN ?? "000000");

  initialized = true;
}
