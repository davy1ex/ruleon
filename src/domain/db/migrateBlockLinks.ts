import type { DBAsync } from "@vlcn.io/xplat-api";

const MIGRATION_KEY = "block_links_migrated_v1";

async function isMigrationApplied(db: DBAsync): Promise<boolean> {
  const rows = await db.execA<[string]>(
    `SELECT value FROM kv_state WHERE key = ?`,
    [MIGRATION_KEY],
  );
  return rows[0]?.[0] === "1";
}

export async function migrateNodeLinksToBlockLinks(db: DBAsync): Promise<void> {
  if (await isMigrationApplied(db)) {
    return;
  }

  const tableRows = await db.execA<[string]>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'block_links'`,
  );
  if (tableRows.length === 0) {
    return;
  }

  await db.tx(async (tx) => {
    await tx.exec(
      `INSERT OR IGNORE INTO block_links (source_block_id, target_text)
       SELECT source_id, target_name_normalized
       FROM node_links
       WHERE type = 'link'`,
    );
    await tx.exec(`DELETE FROM node_links WHERE type = 'link'`);
    await tx.exec(
      `INSERT OR REPLACE INTO kv_state (key, value) VALUES (?, ?)`,
      [MIGRATION_KEY, "1"],
    );
  });
}
