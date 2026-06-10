import type { RuleonDb as DB } from "../../db/types";
import type { BlockContentJSON } from "../contentTypes";
import { currentTimestamp } from "../seed";
import { persistBlockContent } from "./blockLinks";

export async function updateContent(
  db: DB,
  id: string,
  content: BlockContentJSON,
  options?: { inTransaction?: boolean },
): Promise<void> {
  if (options?.inTransaction) {
    await persistBlockContent(db, id, content);
    return;
  }

  await db.tx(async (tx) => {
    await persistBlockContent(tx, id, content);
  });
}

export async function toggleCollapsed(db: DB, id: string): Promise<void> {
  await db.exec(
    `UPDATE outline_nodes
     SET collapsed = CASE collapsed WHEN 1 THEN 0 ELSE 1 END,
         updated_at = ?
     WHERE id = ?`,
    [currentTimestamp(), id],
  );
}
