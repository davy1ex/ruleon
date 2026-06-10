import type { RuleonDb as DB } from "../../db/types";
import type { BlockContentJSON } from "../contentTypes";
import { serializeForDb } from "../../../features/editor/serialization/serializeForDb";
import { getNodeById } from "../queries";
import { createNodeId, currentTimestamp } from "../seed";
import { sanitizeSortOrder } from "../sortOrder";
import { syncBlockLinks, syncNodeTags } from "./blockLinks";
import { updateContent } from "./update";

async function computeSplitSortOrder(
  db: DB,
  parentId: string | null,
  currentOrder: number,
): Promise<number> {
  const stmt = await db.prepare(
    `SELECT sort_order FROM outline_nodes
     WHERE parent_id IS ? AND sort_order > ?
     ORDER BY sort_order ASC
     LIMIT 1`,
  );

  const row = (await stmt.get(null, parentId, currentOrder)) as
    | { sort_order: number | null }
    | null
    | undefined;

  await stmt.finalize(null);

  if (row != null && row.sort_order != null) {
    const nextOrder = Number(row.sort_order);
    if (!Number.isNaN(nextOrder)) {
      return sanitizeSortOrder((currentOrder + nextOrder) / 2.0);
    }
  }

  return sanitizeSortOrder(currentOrder + 100.0);
}

export async function splitNode(
  db: DB,
  id: string,
  leftPart: BlockContentJSON,
  rightPart: BlockContentJSON,
  newId: string = createNodeId(),
): Promise<string | null> {
  const node = await getNodeById(db, id);
  if (!node) {
    return null;
  }

  const newSortOrder = await computeSplitSortOrder(
    db,
    node.parent_id,
    node.sort_order,
  );
  const timestamp = currentTimestamp();
  const rightStored = serializeForDb(rightPart);

  await db.exec("BEGIN");
  try {
    await updateContent(db, id, leftPart, { inTransaction: true });
    await db.exec(
      `INSERT INTO outline_nodes
        (id, parent_id, content, sort_order, collapsed, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [newId, node.parent_id, rightStored, newSortOrder, timestamp, timestamp],
    );
    await syncBlockLinks(db, newId, rightPart);
    await syncNodeTags(db, newId, rightPart);
    await db.exec("COMMIT");
    return newId;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}
