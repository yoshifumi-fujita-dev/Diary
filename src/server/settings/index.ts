import { db } from "@/server/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

async function setSettingValue(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });
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

export async function setAutosaveSettings(input: { enabled: boolean; intervalMs: number }) {
  const enabled = Boolean(input.enabled);
  const intervalMs = Math.max(500, Number(input.intervalMs) || 1500);
  await setSettingValue("autosave", JSON.stringify({ enabled, intervalMs }));
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

export async function setAutoLockSettings(input: { idleTimeoutMs: number }) {
  const rawIdleTimeout = Number(input.idleTimeoutMs);
  const idleTimeoutMs = rawIdleTimeout === 0 ? 0 : Math.max(60000, rawIdleTimeout || 180000);
  await setSettingValue("auto_lock", JSON.stringify({ idleTimeoutMs }));
}
