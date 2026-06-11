import type { RuleonDb as DB } from "../../db/types";
import {
  parseMetadata,
  serializeMetadata,
  type NodeMetadata,
} from "../metadata";
import { currentTimestamp } from "../seed";

async function fetchMetadataRaw(
  db: DB,
  id: string,
): Promise<{ metadata: string; task_status: string | null } | null> {
  const stmt = await db.prepare(
    `SELECT metadata, task_status FROM outline_nodes WHERE id = ?`,
  );
  const row = (await stmt.get(null, id)) as
    | { metadata: string; task_status: string | null }
    | undefined;
  await stmt.finalize(null);
  return row ?? null;
}

export async function patchNodeMetadataFields(
  db: DB,
  id: string,
  updater: (current: NodeMetadata) => NodeMetadata,
): Promise<NodeMetadata | null> {
  const row = await fetchMetadataRaw(db, id);
  if (!row) {
    return null;
  }

  const next = updater(parseMetadata(row.metadata));
  await db.exec(
    `UPDATE outline_nodes SET metadata = ?, updated_at = ? WHERE id = ?`,
    [serializeMetadata(next), currentTimestamp(), id],
  );
  return next;
}
