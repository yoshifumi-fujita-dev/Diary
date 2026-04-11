import { db } from "@/server/db";
import { settings } from "@/db/schema";

async function setSettingValue(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });
}

export async function setAutosaveSettings(input: { enabled: boolean; intervalMs: number }) {
  const enabled = Boolean(input.enabled);
  const intervalMs = Math.max(500, Number(input.intervalMs) || 1500);
  await setSettingValue("autosave", JSON.stringify({ enabled, intervalMs }));
}

export async function setAutoLockSettings(input: { idleTimeoutMs: number }) {
  const rawIdleTimeout = Number(input.idleTimeoutMs);
  const idleTimeoutMs = rawIdleTimeout === 0 ? 0 : Math.max(60000, rawIdleTimeout || 180000);
  await setSettingValue("auto_lock", JSON.stringify({ idleTimeoutMs }));
}
