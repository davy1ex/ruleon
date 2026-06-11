import type { RuleonDb as DB } from "../db/types";
import type { PortalFilter } from "./portalTypes";
import { resolvePortalFilter } from "./portalTypes";
import { findPageRootByName } from "./pageQueries";
import type { OutlineNodeDbRow, OutlineNodeRow } from "./types";
import { normalizeRow } from "./pageQueries";

const NODE_COLUMNS = `n.id, n.parent_id, n.content, n.sort_order, n.collapsed,
  n.task_status, n.metadata, n.created_at, n.updated_at`;

function taskStatusClause(filter: PortalFilter): string {
  if (filter === "todo") {
    return "AND n.task_status = 'TODO'";
  }
  if (filter === "done") {
    return "AND n.task_status = 'DONE'";
  }
  return "";
}

function orderClause(filter: PortalFilter): string {
  if (filter === "done") {
    return `ORDER BY json_extract(n.metadata, '$.completed_at') DESC, n.updated_at DESC`;
  }
  return "ORDER BY n.updated_at DESC";
}

async function getLinkedPortalBlocks(
  db: DB,
  normalizedTarget: string,
  filter: PortalFilter,
): Promise<OutlineNodeRow[]> {
  const stmt = await db.prepare(
    `SELECT ${NODE_COLUMNS}
     FROM outline_nodes n
     JOIN block_links bl ON n.id = bl.source_block_id
     WHERE bl.target_text = ?
       ${taskStatusClause(filter)}
     ${orderClause(filter)}`,
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
    `WITH RECURSIVE page_subtree(id) AS (
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
       ${taskStatusClause(filter)}
     ${orderClause(filter)}`,
  );
  const rows = (await stmt.all(null, page.id, page.id)) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows.map(normalizeRow);
}

function mergePortalResults(
  linked: OutlineNodeRow[],
  onPage: OutlineNodeRow[],
  filter: PortalFilter,
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

  if (filter === "done") {
    return merged.sort((left, right) => {
      const leftCompleted = left.metadata.completed_at ?? "";
      const rightCompleted = right.metadata.completed_at ?? "";
      if (leftCompleted !== rightCompleted) {
        return rightCompleted.localeCompare(leftCompleted);
      }
      return right.updated_at - left.updated_at;
    });
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

  const resolvedFilter = resolvePortalFilter(targetText, filter);

  const [linked, onPage] = await Promise.all([
    getLinkedPortalBlocks(db, normalized, resolvedFilter),
    getPageTodoPortalBlocks(db, normalized, resolvedFilter),
  ]);

  return mergePortalResults(linked, onPage, resolvedFilter);
}
