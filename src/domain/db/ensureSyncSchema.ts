import type { DBAsync } from "@vlcn.io/xplat-api";

export const SYNC_SCHEMA_NAME = "ruleon";

export async function ensureSchemaApplied(
  db: DBAsync,
  schemaSql: string,
): Promise<void> {
  await db.automigrateTo(SYNC_SCHEMA_NAME, schemaSql);
}

/** @deprecated Use ensureSchemaApplied */
export async function ensureSyncSchemaMetadata(
  db: DBAsync,
  schemaSql: string,
): Promise<void> {
  await ensureSchemaApplied(db, schemaSql);
}
