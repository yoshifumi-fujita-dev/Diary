import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function verify(key: string, value: string): Promise<boolean> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  if (!row) return false;
  return bcrypt.compare(value, row.value);
}

async function setHash(key: string, value: string): Promise<void> {
  const hash = await bcrypt.hash(value, 10);
  await db
    .insert(settings)
    .values({ key, value: hash })
    .onConflictDoUpdate({ target: settings.key, set: { value: hash } });
}

export const verifyLoginPassword = (p: string) => verify("login_password_hash", p);
export const verifyDiaryPassword  = (p: string) => verify("diary_password_hash", p);
export const verifyResetPin       = (p: string) => verify("reset_pin_hash", p);

export const setLoginPassword = (p: string) => setHash("login_password_hash", p);
export const setDiaryPassword = (p: string) => setHash("diary_password_hash", p);
export const setResetPin      = (p: string) => setHash("reset_pin_hash", p);
