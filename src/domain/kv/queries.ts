import type { RuleonDb as DB } from "../db/types";

export async function getKvValue(db: DB, key: string): Promise<string | null> {
  const stmt = await db.prepare(`SELECT value FROM kv_state WHERE key = ?`);
  const row = (await stmt.get(null, key)) as { value: string } | undefined;
  await stmt.finalize(null);
  return row?.value ?? null;
}
