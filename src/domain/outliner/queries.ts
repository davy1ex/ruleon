import type { RuleonDb as DB } from "../db/types";
import { mapPageListItems, normalizeRow, pageTitleFromStored, OUTLINE_NODE_COLUMNS } from "./pageQueries";
import type { OutlineNodeDbRow, OutlineNodeRow, PageListItem, TrashedPageItem } from "./types";

export type { PortalFilter } from "./portalTypes";
export { getPortalBlocks } from "./portalQueries";

export {
  contentToDbValue,
  findPageRootByName,
  pageTitleFromStored,
} from "./pageQueries";

export async function getAllNodes(db: DB): Promise<OutlineNodeRow[]> {
  const stmt = await db.prepare(
    `SELECT ${OUTLINE_NODE_COLUMNS}
     FROM outline_nodes
     ORDER BY sort_order ASC, created_at ASC`,
  );
  const rows = (await stmt.all(null)) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows.map(normalizeRow);
}

export async function getNodeById(
  db: DB,
  id: string,
): Promise<OutlineNodeRow | null> {
  const stmt = await db.prepare(
    `SELECT ${OUTLINE_NODE_COLUMNS}
     FROM outline_nodes
     WHERE id = ?`,
  );
  const row = (await stmt.get(null, id)) as OutlineNodeDbRow | undefined;
  await stmt.finalize(null);
  return row ? normalizeRow(row) : null;
}

export async function getSiblings(
  db: DB,
  parentId: string | null,
): Promise<OutlineNodeRow[]> {
  const stmt =
    parentId === null
      ? await db.prepare(
          `SELECT ${OUTLINE_NODE_COLUMNS}
           FROM outline_nodes
           WHERE parent_id IS NULL
           ORDER BY sort_order ASC, created_at ASC`,
        )
      : await db.prepare(
          `SELECT ${OUTLINE_NODE_COLUMNS}
           FROM outline_nodes
           WHERE parent_id = ?
           ORDER BY sort_order ASC, created_at ASC`,
        );

  const rows = (
    parentId === null
      ? await stmt.all(null)
      : await stmt.all(null, parentId)
  ) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows.map(normalizeRow);
}

export async function countNodes(db: DB): Promise<number> {
  const stmt = await db.prepare(`SELECT COUNT(*) AS count FROM outline_nodes`);
  const row = (await stmt.get(null)) as { count: number | bigint } | undefined;
  await stmt.finalize(null);
  return Number(row?.count ?? 0);
}

export async function getBlocksLinkingTo(
  db: DB,
  targetText: string,
): Promise<OutlineNodeRow[]> {
  const normalized = targetText.trim().toLowerCase();
  const stmt = await db.prepare(
    `SELECT n.id, n.parent_id, n.content, n.sort_order, n.collapsed,
            n.task_status, n.metadata, n.created_at, n.updated_at
     FROM outline_nodes n
     JOIN block_links bl ON n.id = bl.source_block_id
     WHERE bl.target_text = ?
     ORDER BY n.updated_at DESC`,
  );
  const rows = (await stmt.all(null, normalized)) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows.map(normalizeRow);
}

export async function getLinkedReferences(
  db: DB,
  pageName: string,
): Promise<OutlineNodeRow[]> {
  return getBlocksLinkingTo(db, pageName);
}

export async function getFavorites(db: DB): Promise<PageListItem[]> {
  const stmt = await db.prepare(
    `SELECT n.id, n.content
     FROM outline_nodes n
     JOIN favorites f ON n.id = f.node_id
     ORDER BY f.added_at ASC`,
  );
  const rows = (await stmt.all(null)) as { id: string; content: string }[];
  await stmt.finalize(null);
  return mapPageListItems(rows);
}

export async function getTrashedPages(db: DB): Promise<TrashedPageItem[]> {
  const stmt = await db.prepare(
    `SELECT n.id, n.content, t.trashed_at
     FROM outline_nodes n
     JOIN trashed_nodes t ON n.id = t.node_id
     ORDER BY t.trashed_at DESC`,
  );
  const rows = (await stmt.all(null)) as {
    id: string;
    content: string;
    trashed_at: number | bigint;
  }[];
  await stmt.finalize(null);
  return rows.map((row) => ({
    id: row.id,
    content: pageTitleFromStored(row.content),
    trashed_at: Number(row.trashed_at),
  }));
}

export async function getAllPages(db: DB): Promise<PageListItem[]> {
  const stmt = await db.prepare(
    `SELECT id, content
     FROM outline_nodes
     WHERE parent_id IS NULL
       AND id NOT IN (SELECT node_id FROM trashed_nodes)
     ORDER BY updated_at DESC, content ASC`,
  );
  const rows = (await stmt.all(null)) as { id: string; content: string }[];
  await stmt.finalize(null);
  return mapPageListItems(rows);
}

export async function getPastJournalRootIds(
  db: DB,
  excludeJournalId: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  const stmt = await db.prepare(
    `SELECT DISTINCT parent_id
     FROM outline_nodes
     WHERE parent_id LIKE 'journal-%'
       AND parent_id != ?
     ORDER BY parent_id DESC
     LIMIT ? OFFSET ?`,
  );
  const rows = (await stmt.all(
    null,
    excludeJournalId,
    limit,
    offset,
  )) as { parent_id: string }[];
  await stmt.finalize(null);
  return rows.map((row) => row.parent_id);
}
