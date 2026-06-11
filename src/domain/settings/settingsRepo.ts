import type { RuleonDb as DB } from "../db/types";

export async function getSetting(db: DB, key: string): Promise<unknown | null> {
  const stmt = await db.prepare(`SELECT value FROM app_settings WHERE key = ?`);
  const row = (await stmt.get(null, key)) as { value: string } | undefined;
  await stmt.finalize(null);
  if (!row?.value) {
    return null;
  }
  try {
    return JSON.parse(row.value) as unknown;
  } catch {
    return null;
  }
}

export async function setSetting(
  db: DB,
  key: string,
  value: unknown,
): Promise<void> {
  await db.exec(`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`, [
    key,
    JSON.stringify(value),
  ]);
}

export async function deleteSetting(db: DB, key: string): Promise<void> {
  await db.exec(`DELETE FROM app_settings WHERE key = ?`, [key]);
}
