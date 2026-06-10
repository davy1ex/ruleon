import type { RuleonDb as DB } from "../db/types";

/** Stable ID so CR-SQLite merges welcome pages across peers instead of duplicating. */
export const WELCOME_PAGE_ID = "00000000-0000-4000-8000-000000000001";
export const WELCOME_PAGE_TITLE = "Welcome to Ruleon";

export async function ensureWelcomePage(db: DB): Promise<void> {
  const byId = await db.prepare(`SELECT id FROM outline_nodes WHERE id = ?`);
  const existing = await byId.get(null, WELCOME_PAGE_ID);
  await byId.finalize(null);
  if (existing) {
    return;
  }

  const countStmt = await db.prepare(`SELECT COUNT(*) as count FROM outline_nodes`);
  const row = (await countStmt.get(null)) as { count: number };
  await countStmt.finalize(null);
  if (row.count > 0) {
    return;
  }

  const timestamp = Date.now();
  await db.exec(
    `INSERT OR IGNORE INTO outline_nodes
      (id, parent_id, content, sort_order, collapsed, created_at, updated_at)
     VALUES (?, NULL, ?, 0, 0, ?, ?)`,
    [WELCOME_PAGE_ID, WELCOME_PAGE_TITLE, timestamp, timestamp],
  );
}

export async function dedupeWelcomePages(db: DB): Promise<void> {
  const stmt = await db.prepare(
    `SELECT id, created_at
     FROM outline_nodes
     WHERE parent_id IS NULL AND content = ?
     ORDER BY
       CASE WHEN id = ? THEN 0 ELSE 1 END,
       created_at ASC`,
  );
  const rows = (await stmt.all(null, WELCOME_PAGE_TITLE, WELCOME_PAGE_ID)) as {
    id: string;
    created_at: number;
  }[];
  await stmt.finalize(null);

  for (let i = 1; i < rows.length; i++) {
    await db.exec(`DELETE FROM outline_nodes WHERE id = ?`, [rows[i]!.id]);
  }
}
