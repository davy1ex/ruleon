import type { RuleonDb as DB } from "../../db/types";
import { getNodeById, getSiblings } from "../queries";
import { sanitizeSortOrder } from "../sortOrder";
import { currentTimestamp } from "../seed";

export async function moveNodeToPageRoot(
  db: DB,
  nodeId: string,
  pageRootId: string,
): Promise<boolean> {
  const node = await getNodeById(db, nodeId);
  if (!node || node.id === pageRootId) {
    return false;
  }

  const pageRoot = await getNodeById(db, pageRootId);
  if (!pageRoot || pageRoot.parent_id !== null) {
    return false;
  }

  const newOrder = sanitizeSortOrder(await nextChildOrder(db, pageRootId));
  return moveNode(db, nodeId, pageRootId, newOrder);
}

export async function moveNode(
  db: DB,
  id: string,
  newParentId: string | null,
  newSortOrder: number,
): Promise<boolean> {
  const node = await getNodeById(db, id);
  if (!node || newParentId === null) {
    return false;
  }

  const safeSortOrder = sanitizeSortOrder(newSortOrder);

  await db.exec(
    `UPDATE outline_nodes
     SET parent_id = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    [newParentId, safeSortOrder, currentTimestamp(), id],
  );

  return true;
}

export async function indentUnderParent(
  db: DB,
  id: string,
  newParentId: string,
): Promise<boolean> {
  const node = await getNodeById(db, id);
  const newParent = await getNodeById(db, newParentId);
  if (!node || !newParent) {
    return false;
  }

  const newOrder = sanitizeSortOrder(await nextChildOrder(db, newParentId));
  const timestamp = currentTimestamp();

  await db.tx(async (tx) => {
    await tx.exec(
      `UPDATE outline_nodes
       SET parent_id = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
      [newParentId, newOrder, timestamp, id],
    );
  });
  return true;
}

/** @deprecated Use indentUnderParent with flat-list previous node instead */
export async function indentNode(
  db: DB,
  id: string,
): Promise<boolean> {
  const node = await getNodeById(db, id);
  if (!node) {
    return false;
  }

  const siblings = await getSiblings(db, node.parent_id);
  const index = siblings.findIndex((sibling) => sibling.id === id);
  if (index <= 0) {
    return false;
  }

  const previousSibling = siblings[index - 1];
  if (!previousSibling) {
    return false;
  }

  return indentUnderParent(db, id, previousSibling.id);
}

export async function outdentNode(
  db: DB,
  id: string,
): Promise<boolean> {
  const node = await getNodeById(db, id);
  if (!node || node.parent_id === null) {
    return false;
  }

  const parent = await getNodeById(db, node.parent_id);
  if (!parent || parent.parent_id === null || parent.id.startsWith("journal-")) {
    return false;
  }

  const newOrder = sanitizeSortOrder(parent.sort_order + 1);
  const timestamp = currentTimestamp();

  await db.tx(async (tx) => {
    await shiftOrdersAfter(tx, parent.parent_id, newOrder);
    await tx.exec(
      `UPDATE outline_nodes
       SET parent_id = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
      [parent.parent_id, newOrder, timestamp, id],
    );
  });
  return true;
}

async function nextChildOrder(db: DB, parentId: string): Promise<number> {
  const children = await getSiblings(db, parentId);
  if (children.length === 0) {
    return sanitizeSortOrder(0);
  }
  const maxOrder = Math.max(
    ...children.map((child) => sanitizeSortOrder(child.sort_order, 0)),
  );
  return sanitizeSortOrder(maxOrder + 1);
}

async function shiftOrdersAfter(
  db: Pick<DB, "exec">,
  parentId: string | null,
  fromOrder: number,
): Promise<void> {
  if (parentId === null) {
    await db.exec(
      `UPDATE outline_nodes
       SET sort_order = sort_order + 1, updated_at = ?
       WHERE parent_id IS NULL AND sort_order >= ?`,
      [currentTimestamp(), fromOrder],
    );
    return;
  }

  await db.exec(
    `UPDATE outline_nodes
     SET sort_order = sort_order + 1, updated_at = ?
     WHERE parent_id = ? AND sort_order >= ?`,
    [currentTimestamp(), parentId, fromOrder],
  );
}
