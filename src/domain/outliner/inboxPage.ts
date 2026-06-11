import type { RuleonDb as DB } from "../db/types";
import { initialNodeMetadata, serializeMetadata } from "./metadata";
import { pageTitleFromStored } from "./pageQueries";
import { currentTimestamp } from "./seed";

/** Stable ID — must match sync-server/routes/inbox.mjs for CR-SQLite merge. */
export const INBOX_PAGE_ID = "00000000-0000-4000-8000-000000000002";
export const INBOX_PAGE_TITLE = "Inbox";

export function isInboxPageId(pageId: string): boolean {
  return pageId === INBOX_PAGE_ID;
}

export function isSystemInboxPage(page: { id: string; content: string }): boolean {
  return (
    page.id === INBOX_PAGE_ID ||
    pageTitleFromStored(page.content).trim().toLowerCase() ===
      INBOX_PAGE_TITLE.toLowerCase()
  );
}

export async function ensureInboxPage(db: DB): Promise<void> {
  const byId = await db.prepare(`SELECT id FROM outline_nodes WHERE id = ?`);
  const existing = await byId.get(null, INBOX_PAGE_ID);
  await byId.finalize(null);
  if (existing) {
    return;
  }

  const timestamp = currentTimestamp();
  const metadata = serializeMetadata({
    ...initialNodeMetadata(),
    tags: ["inbox"],
  });

  await db.exec(
    `INSERT OR IGNORE INTO outline_nodes
      (id, parent_id, content, sort_order, collapsed, metadata, created_at, updated_at)
     VALUES (?, NULL, ?, 0, 0, ?, ?, ?)`,
    [INBOX_PAGE_ID, INBOX_PAGE_TITLE, metadata, timestamp, timestamp],
  );
}

export async function dedupeInboxPages(db: DB): Promise<void> {
  const stmt = await db.prepare(
    `SELECT id, created_at
     FROM outline_nodes
     WHERE parent_id IS NULL
       AND (
         id = ?
         OR content = ?
       )
     ORDER BY
       CASE WHEN id = ? THEN 0 ELSE 1 END,
       created_at ASC`,
  );
  const rows = (await stmt.all(
    null,
    INBOX_PAGE_ID,
    INBOX_PAGE_TITLE,
    INBOX_PAGE_ID,
  )) as { id: string; created_at: number }[];
  await stmt.finalize(null);

  const canonical = rows[0];
  if (!canonical) {
    return;
  }

  for (let i = 1; i < rows.length; i++) {
    const duplicate = rows[i]!;
    const children = await db.prepare(
      `SELECT id FROM outline_nodes WHERE parent_id = ?`,
    );
    const childRows = (await children.all(null, duplicate.id)) as { id: string }[];
    await children.finalize(null);

    for (const child of childRows) {
      await db.exec(`UPDATE outline_nodes SET parent_id = ? WHERE id = ?`, [
        canonical.id,
        child.id,
      ]);
    }

    await db.exec(`DELETE FROM outline_nodes WHERE id = ?`, [duplicate.id]);
  }
}

export async function countInboxItems(db: DB): Promise<number> {
  await ensureInboxPage(db);
  const stmt = await db.prepare(
    `SELECT COUNT(*) AS count
     FROM outline_nodes
     WHERE parent_id = ?
       AND id NOT IN (SELECT node_id FROM trashed_nodes)`,
  );
  const row = (await stmt.get(null, INBOX_PAGE_ID)) as
    | { count: number | bigint }
    | undefined;
  await stmt.finalize(null);
  return Number(row?.count ?? 0);
}
