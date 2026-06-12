import type { RuleonDb as DB } from "../db/types";
import { pageTitleFromStored } from "../outliner/pageQueries";
import {
  isDatePage,
  legacyJournalIdForDateTitle,
  normalizePageTitle,
} from "./PageRegistry";

async function moveChildrenToCanonical(
  db: DB,
  fromPageId: string,
  toPageId: string,
): Promise<void> {
  const children = await db.prepare(
    `SELECT id FROM outline_nodes WHERE parent_id = ?`,
  );
  const childRows = (await children.all(null, fromPageId)) as { id: string }[];
  await children.finalize(null);

  for (const child of childRows) {
    await db.exec(`UPDATE outline_nodes SET parent_id = ? WHERE id = ?`, [
      toPageId,
      child.id,
    ]);
  }
}

/** Merge duplicate daily journal roots (same YYYY-MM-DD title) into one canonical page. */
export async function dedupeDateJournalPages(db: DB): Promise<void> {
  const stmt = await db.prepare(
    `SELECT id, content, created_at
     FROM outline_nodes
     WHERE parent_id IS NULL
       AND id NOT IN (SELECT node_id FROM trashed_nodes)
     ORDER BY created_at ASC`,
  );
  const rows = (await stmt.all(null)) as {
    id: string;
    content: string;
    created_at: number;
  }[];
  await stmt.finalize(null);

  const byTitle = new Map<string, typeof rows>();
  for (const row of rows) {
    const title = normalizePageTitle(
      pageTitleFromStored(row.content),
      row.id,
    );
    if (!isDatePage(title)) {
      continue;
    }
    const group = byTitle.get(title) ?? [];
    group.push(row);
    byTitle.set(title, group);
  }

  for (const [title, group] of byTitle) {
    if (group.length <= 1) {
      continue;
    }

    const canonicalId = legacyJournalIdForDateTitle(title);
    const sorted = [...group].sort((a, b) => {
      if (a.id === canonicalId) {
        return -1;
      }
      if (b.id === canonicalId) {
        return 1;
      }
      return a.created_at - b.created_at;
    });
    const canonical = sorted[0]!;

    for (let i = 1; i < sorted.length; i++) {
      const duplicate = sorted[i]!;
      await moveChildrenToCanonical(db, duplicate.id, canonical.id);
      await db.exec(`DELETE FROM outline_nodes WHERE id = ?`, [duplicate.id]);
    }
  }
}
