import type { RuleonDb as DB } from "../../db/types";
import { countNodes, getAllNodes } from "../queries";
import type { OutlineNodeRow } from "../types";
import { deleteBlockLinksForIds } from "./blockLinks";

export async function deleteNode(db: DB, id: string): Promise<boolean> {
  return deleteNodes(db, [id]);
}

export async function deleteNodes(db: DB, ids: string[]): Promise<boolean> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return false;
  }

  const total = await countNodes(db);
  const rows = await getAllNodes(db);
  const idsToDelete = new Set<string>();

  for (const id of uniqueIds) {
    idsToDelete.add(id);
    for (const descendantId of collectDescendantIds(rows, id)) {
      idsToDelete.add(descendantId);
    }
  }

  if (total - idsToDelete.size < 1) {
    return false;
  }

  const idList = [...idsToDelete];
  const placeholders = idList.map(() => "?").join(",");

  await db.exec("BEGIN");
  try {
    await deleteBlockLinksForIds(db, idList);
    await db.exec(
      `DELETE FROM outline_nodes WHERE id IN (${placeholders})`,
      idList,
    );
    await db.exec("COMMIT");
    return true;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

function collectDescendantIds(
  rows: OutlineNodeRow[],
  parentId: string,
): string[] {
  const ids: string[] = [];

  for (const row of rows) {
    if (row.parent_id !== parentId) {
      continue;
    }
    ids.push(row.id, ...collectDescendantIds(rows, row.id));
  }

  return ids;
}
