import type { RuleonDb as DB } from "../db/types";
import type { PortalFilter } from "./portalTypes";
import { findPageRootByName } from "./pageQueries";
import type { OutlineNodeDbRow, OutlineNodeRow } from "./types";
import { normalizeRow } from "./pageQueries";

const NODE_COLUMNS = `n.id, n.parent_id, n.content, n.sort_order, n.collapsed,
  n.task_status, n.created_at, n.updated_at`;

async function getLinkedPortalBlocks(
  db: DB,
  normalizedTarget: string,
  filter: PortalFilter,
): Promise<OutlineNodeRow[]> {
  const stmt = await db.prepare(
    filter === "todo"
      ? `SELECT ${NODE_COLUMNS}
         FROM outline_nodes n
         JOIN block_links bl ON n.id = bl.source_block_id
         WHERE bl.target_text = ?
           AND n.task_status = 'TODO'
         ORDER BY n.updated_at DESC`
      : `SELECT ${NODE_COLUMNS}
         FROM outline_nodes n
         JOIN block_links bl ON n.id = bl.source_block_id
         WHERE bl.target_text = ?
         ORDER BY n.updated_at DESC`,
  );
  const rows = (await stmt.all(null, normalizedTarget)) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows.map(normalizeRow);
}

async function getPageTodoPortalBlocks(
  db: DB,
  normalizedTarget: string,
  filter: PortalFilter,
): Promise<OutlineNodeRow[]> {
  const page = await findPageRootByName(db, normalizedTarget);
  if (!page) {
    return [];
  }

  const stmt = await db.prepare(
    filter === "todo"
      ? `WITH RECURSIVE page_subtree(id) AS (
           SELECT ?
           UNION ALL
           SELECT child.id
           FROM outline_nodes child
           JOIN page_subtree parent ON child.parent_id = parent.id
         )
         SELECT ${NODE_COLUMNS}
         FROM outline_nodes n
         JOIN page_subtree ps ON n.id = ps.id
         WHERE n.id != ?
           AND n.task_status = 'TODO'
         ORDER BY n.updated_at DESC`
      : `WITH RECURSIVE page_subtree(id) AS (
           SELECT ?
           UNION ALL
           SELECT child.id
           FROM outline_nodes child
           JOIN page_subtree parent ON child.parent_id = parent.id
         )
         SELECT ${NODE_COLUMNS}
         FROM outline_nodes n
         JOIN page_subtree ps ON n.id = ps.id
         WHERE n.id != ?
         ORDER BY n.updated_at DESC`,
  );
  const rows = (await stmt.all(null, page.id, page.id)) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows.map(normalizeRow);
}

function mergePortalResults(
  linked: OutlineNodeRow[],
  onPage: OutlineNodeRow[],
): OutlineNodeRow[] {
  const seen = new Set<string>();
  const merged: OutlineNodeRow[] = [];

  for (const row of [...linked, ...onPage]) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    merged.push(row);
  }

  return merged.sort((left, right) => right.updated_at - left.updated_at);
}

export async function getPortalBlocks(
  db: DB,
  targetText: string,
  filter: PortalFilter = "todo",
): Promise<OutlineNodeRow[]> {
  const normalized = targetText.trim().toLowerCase();
  if (normalized === "") {
    return [];
  }

  const [linked, onPage] = await Promise.all([
    getLinkedPortalBlocks(db, normalized, filter),
    getPageTodoPortalBlocks(db, normalized, filter),
  ]);

  return mergePortalResults(linked, onPage);
}
