import type { RuleonDb as DB } from "../domain/db/types";
import { getNodeById, getSiblings } from "../domain/outliner/queries";
import { createNode } from "../domain/outliner/mutations/create";
import { currentTimestamp } from "../domain/outliner/seed";
import type { OutlineTreeNode } from "../domain/outliner/types";

export function todayJournalId(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `journal-${y}-${m}-${d}`;
}

export const SYSTEM_TRASH_ROOT_ID = "system-trash";
export const DAILY_FEED_ROOT_ID = "__daily_feed__";

export function isDailyFeedRootId(rootId: string): boolean {
  return rootId === DAILY_FEED_ROOT_ID;
}

export function isJournalRootId(rootId: string): boolean {
  return rootId.startsWith("journal-");
}

export function isSystemTrashRootId(rootId: string): boolean {
  return rootId === SYSTEM_TRASH_ROOT_ID;
}

export function journalLabel(journalId: string): string {
  const match = journalId.match(/^journal-(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return journalId;
  }
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
}

export async function ensureJournalRoot(
  db: DB,
  journalId: string,
): Promise<void> {
  const existing = await getNodeById(db, journalId);
  if (existing) {
    return;
  }

  const timestamp = currentTimestamp();
  await db.exec(
    `INSERT INTO outline_nodes
      (id, parent_id, content, sort_order, collapsed, created_at, updated_at)
     VALUES (?, NULL, ?, 0, 0, ?, ?)`,
    [journalId, journalLabel(journalId), timestamp, timestamp],
  );
}

export async function ensureEmptyBlock(
  db: DB,
  rootId: string,
): Promise<string | null> {
  const root = await getNodeById(db, rootId);
  if (!root) {
    return null;
  }

  const children = await getSiblings(db, rootId);
  if (children.length > 0) {
    return null;
  }

  return createNode(db, rootId, "");
}

export function findTreeNode(
  nodes: OutlineTreeNode[],
  id: string,
): OutlineTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const nested = findTreeNode(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return null;
}
