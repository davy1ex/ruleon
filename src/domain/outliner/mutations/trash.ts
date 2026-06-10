import type { RuleonDb as DB } from "../../db/types";
import { currentTimestamp } from "../seed";

export async function moveToTrash(db: DB, nodeId: string): Promise<void> {
  const timestamp = currentTimestamp();

  await db.exec("BEGIN");
  try {
    await db.exec(
      `INSERT INTO trashed_nodes (node_id, trashed_at) VALUES (?, ?)
       ON CONFLICT(node_id) DO UPDATE SET trashed_at = excluded.trashed_at`,
      [nodeId, timestamp],
    );
    await db.exec(`DELETE FROM favorites WHERE node_id = ?`, [nodeId]);
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function restoreFromTrash(db: DB, nodeId: string): Promise<void> {
  await db.exec(`DELETE FROM trashed_nodes WHERE node_id = ?`, [nodeId]);
}
