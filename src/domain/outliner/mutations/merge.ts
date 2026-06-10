import type { RuleonDb as DB } from "../../db/types";
import type { BlockContentJSON } from "../contentTypes";
import { getNodeById } from "../queries";
import { currentTimestamp } from "../seed";
import { deleteBlockLinksForIds, persistBlockContent } from "./blockLinks";

export async function mergeNodes(
  db: DB,
  targetId: string,
  targetNewContent: BlockContentJSON,
  sourceId: string,
): Promise<boolean> {
  const target = await getNodeById(db, targetId);
  const source = await getNodeById(db, sourceId);
  if (!target || !source) {
    return false;
  }

  const timestamp = currentTimestamp();

  await db.exec("BEGIN");
  try {
    await persistBlockContent(db, targetId, targetNewContent);
    await db.exec(
      `UPDATE outline_nodes SET parent_id = ?, updated_at = ? WHERE parent_id = ?`,
      [targetId, timestamp, sourceId],
    );
    await deleteBlockLinksForIds(db, [sourceId]);
    await db.exec(`DELETE FROM outline_nodes WHERE id = ?`, [sourceId]);
    await db.exec("COMMIT");
    return true;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}
