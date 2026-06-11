import type { RuleonDb as DB } from "../../db/types";
import type { BlockContentJSON } from "../contentTypes";
import { serializeForDb } from "../../../features/editor/serialization/serializeForDb";
import { createNodeId, currentTimestamp } from "../seed";
import {
  initialNodeMetadata,
  serializeMetadata,
} from "../metadata";
import { getNodeById, getSiblings } from "../queries";
import { indexBlockLinksForNewNode } from "./blockLinks";

export async function createNode(
  db: DB,
  parentId: string | null,
  content: BlockContentJSON | string = "",
  sortOrder?: number,
  id?: string,
): Promise<string> {
  const nodeId = id ?? createNodeId();
  const timestamp = currentTimestamp();
  const order =
    sortOrder ??
    (await nextSortOrder(db, parentId));
  const stored =
    typeof content === "string" ? content : serializeForDb(content);
  const metadata = serializeMetadata(initialNodeMetadata());

  await db.exec(
    `INSERT INTO outline_nodes
      (id, parent_id, content, sort_order, collapsed, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
    [nodeId, parentId, stored, order, metadata, timestamp, timestamp],
  );
  await indexBlockLinksForNewNode(db, nodeId, content);

  return nodeId;
}

export async function createSibling(
  db: DB,
  afterNodeId: string,
  content: BlockContentJSON | string = "",
  newId?: string,
): Promise<string | null> {
  const node = await getNodeById(db, afterNodeId);
  if (!node) {
    return null;
  }

  const siblings = await getSiblings(db, node.parent_id);
  const index = siblings.findIndex((sibling) => sibling.id === afterNodeId);
  const nextOrder =
    index === -1
      ? siblings.length
      : (siblings[index]?.sort_order ?? 0) + 1;

  const timestamp = currentTimestamp();
  const stored =
    typeof content === "string" ? content : serializeForDb(content);
  const metadata = serializeMetadata(initialNodeMetadata());

  await db.exec("BEGIN");
  try {
    await shiftSortOrders(db, node.parent_id, nextOrder);
    const nodeId = newId ?? createNodeId();
    await db.exec(
      `INSERT INTO outline_nodes
        (id, parent_id, content, sort_order, collapsed, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [nodeId, node.parent_id, stored, nextOrder, metadata, timestamp, timestamp],
    );
    await indexBlockLinksForNewNode(db, nodeId, content);
    await db.exec("COMMIT");
    return nodeId;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function nextSortOrder(
  db: DB,
  parentId: string | null,
): Promise<number> {
  const siblings = await getSiblings(db, parentId);
  if (siblings.length === 0) {
    return 0;
  }
  return Math.max(...siblings.map((sibling) => sibling.sort_order)) + 1;
}

async function shiftSortOrders(
  db: DB,
  parentId: string | null,
  fromOrder: number,
): Promise<void> {
  if (parentId === null) {
    await db.exec(
      `UPDATE outline_nodes
       SET sort_order = sort_order + 1
       WHERE parent_id IS NULL AND sort_order >= ?`,
      [fromOrder],
    );
    return;
  }

  await db.exec(
    `UPDATE outline_nodes
     SET sort_order = sort_order + 1
     WHERE parent_id = ? AND sort_order >= ?`,
    [parentId, fromOrder],
  );
}
