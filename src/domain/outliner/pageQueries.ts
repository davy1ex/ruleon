import type { RuleonDb as DB } from "../db/types";
import { extractPlainText, parseStoredContent } from "../../features/editor/serialization/contentCodec";
import { serializeForDb } from "../../features/editor/serialization/serializeForDb";
import type { BlockContentJSON } from "./contentTypes";
import type {
  OutlineNodeDbRow,
  OutlineNodeRow,
  PageListItem,
  TaskStatus,
} from "./types";
import { parseMetadata } from "./metadata";

export const OUTLINE_NODE_COLUMNS = `id, parent_id, content, sort_order, collapsed, task_status, metadata, created_at, updated_at`;

function parseTaskStatus(raw: string | null | undefined): TaskStatus | null {
  if (raw === "TODO" || raw === "DONE") {
    return raw;
  }
  return null;
}

export function pageTitleFromStored(raw: string): string {
  return extractPlainText(parseStoredContent(raw)) || raw.trim();
}

export function contentToDbValue(content: BlockContentJSON | string): string {
  if (typeof content === "string") {
    return content;
  }
  return serializeForDb(content);
}

export function normalizeRow(row: OutlineNodeDbRow): OutlineNodeRow {
  return {
    id: row.id,
    parent_id: row.parent_id,
    content: parseStoredContent(row.content),
    sort_order: Number(row.sort_order),
    collapsed: Number(row.collapsed) as 0 | 1,
    task_status: parseTaskStatus(row.task_status),
    metadata: parseMetadata(row.metadata),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  };
}

export async function findPageRootByName(
  db: DB,
  pageName: string,
): Promise<OutlineNodeRow | null> {
  const normalized = pageName.trim().toLowerCase();
  if (normalized === "") {
    return null;
  }

  const stmt = await db.prepare(
    `SELECT ${OUTLINE_NODE_COLUMNS}
     FROM outline_nodes
     WHERE parent_id IS NULL
       AND id NOT IN (SELECT node_id FROM trashed_nodes)
     ORDER BY created_at ASC`,
  );
  const rows = (await stmt.all(null)) as OutlineNodeDbRow[];
  await stmt.finalize(null);

  const match = rows.find((row) =>
    pageTitleFromStored(row.content).trim().toLowerCase() === normalized,
  );
  return match ? normalizeRow(match) : null;
}

export function mapPageListItems(
  rows: { id: string; content: string }[],
): PageListItem[] {
  return rows.map((row) => ({
    id: row.id,
    content: pageTitleFromStored(row.content),
  }));
}
