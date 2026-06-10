import type { RuleonDb as DB } from "../../db/types";
import {
  extractLinksAndTagsFromDoc,
  extractLinksFromAST,
} from "../../../features/editor/serialization/extractLinksFromDoc";
import { serializeForDb } from "../../../features/editor/serialization/serializeForDb";
import type { BlockContentJSON } from "../contentTypes";
import { currentTimestamp } from "../seed";

export type DbExecutor = Pick<DB, "exec">;

export async function syncBlockLinks(
  db: DbExecutor,
  sourceBlockId: string,
  content: BlockContentJSON,
): Promise<void> {
  const targets = extractLinksFromAST(content);

  await db.exec(`DELETE FROM block_links WHERE source_block_id = ?`, [
    sourceBlockId,
  ]);

  for (const target of targets) {
    await db.exec(
      `INSERT OR IGNORE INTO block_links (source_block_id, target_text)
       VALUES (?, ?)`,
      [sourceBlockId, target],
    );
  }
}

export async function syncNodeTags(
  db: DbExecutor,
  sourceId: string,
  content: BlockContentJSON,
): Promise<void> {
  const { tags } = extractLinksAndTagsFromDoc(content);

  await db.exec(
    `DELETE FROM node_links WHERE source_id = ? AND type = 'tag'`,
    [sourceId],
  );

  for (const tag of tags) {
    await db.exec(
      `INSERT INTO node_links (source_id, target_name_normalized, type)
       VALUES (?, ?, 'tag')`,
      [sourceId, tag],
    );
  }
}

export async function persistBlockContent(
  db: DbExecutor,
  id: string,
  content: BlockContentJSON,
): Promise<void> {
  const stored = serializeForDb(content);
  const timestamp = currentTimestamp();

  await db.exec(
    `UPDATE outline_nodes SET content = ?, updated_at = ? WHERE id = ?`,
    [stored, timestamp, id],
  );
  await syncBlockLinks(db, id, content);
  await syncNodeTags(db, id, content);
}

export async function indexBlockLinksForNewNode(
  db: DbExecutor,
  nodeId: string,
  content: BlockContentJSON | string,
): Promise<void> {
  if (typeof content === "string") {
    return;
  }
  await syncBlockLinks(db, nodeId, content);
  await syncNodeTags(db, nodeId, content);
}

export async function deleteBlockLinksForIds(
  db: DbExecutor,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const placeholders = ids.map(() => "?").join(", ");
  await db.exec(
    `DELETE FROM block_links WHERE source_block_id IN (${placeholders})`,
    ids,
  );
}
