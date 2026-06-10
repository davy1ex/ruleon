import type { RuleonDb as DB } from "../db/types";

export async function setKvValue(
  db: DB,
  key: string,
  value: string,
): Promise<void> {
  await db.exec(`INSERT OR REPLACE INTO kv_state (key, value) VALUES (?, ?)`, [
    key,
    value,
  ]);
}
