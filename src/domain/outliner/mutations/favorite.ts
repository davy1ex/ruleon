import type { RuleonDb as DB } from "../../db/types";
import { currentTimestamp } from "../seed";

export async function toggleFavorite(db: DB, nodeId: string): Promise<void> {
  const stmt = await db.prepare(
    `SELECT node_id FROM favorites WHERE node_id = ?`,
  );
  const existing = (await stmt.get(null, nodeId)) as
    | { node_id: string }
    | undefined;
  await stmt.finalize(null);

  if (existing) {
    await db.exec(`DELETE FROM favorites WHERE node_id = ?`, [nodeId]);
    return;
  }

  await db.exec(
    `INSERT INTO favorites (node_id, added_at) VALUES (?, ?)`,
    [nodeId, currentTimestamp()],
  );
}
