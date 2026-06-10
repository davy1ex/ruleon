import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";
import type { DualBackupPayload } from "./backupTypes";
import { exportDbBinary } from "./exportDbBinary";
import { exportAllPagesAsMarkdown } from "./exportPageTree";

export async function generateDualBackup(
  db: WasmDB,
  dbFileName: string,
): Promise<DualBackupPayload> {
  const [dbBuffer, mdFiles] = await Promise.all([
    exportDbBinary(db, dbFileName),
    exportAllPagesAsMarkdown(db),
  ]);
  return { dbBuffer, mdFiles };
}
