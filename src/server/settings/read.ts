import { db } from "@/server/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

export async function getAutosaveSettings() {
  const raw = await getSettingValue("autosave");
  if (!raw) return { enabled: true, intervalMs: 1500 };
  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      intervalMs: Number(parsed.intervalMs) || 1500,
    };
  } catch {
    return { enabled: true, intervalMs: 1500 };
  }
}

export async function getAutoLockSettings() {
  const raw = await getSettingValue("auto_lock");
  if (!raw) return { idleTimeoutMs: 180000 };
  try {
    const parsed = JSON.parse(raw);
    const nextIdle = Number(parsed.idleTimeoutMs);
    return { idleTimeoutMs: Number.isFinite(nextIdle) ? nextIdle : 180000 };
  } catch {
    return { idleTimeoutMs: 180000 };
  }
}
