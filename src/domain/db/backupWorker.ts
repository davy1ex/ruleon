/// <reference lib="webworker" />
import initWasm from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import { generateDualBackup } from "../backup/generateDualBackup";
import type { DualBackupPayload } from "../backup/backupTypes";

type BackupWorkerRequest = { type: "generate"; dbName: string };

type BackupWorkerResponse =
  | { type: "ready" }
  | ({ type: "result" } & DualBackupPayload)
  | { type: "error"; message: string };

self.addEventListener("message", (event: MessageEvent<BackupWorkerRequest>) => {
  if (event.data.type !== "generate") {
    return;
  }

  void (async () => {
    let db: Awaited<ReturnType<Awaited<ReturnType<typeof initWasm>>["open"]>> | null =
      null;
    try {
      const sqlite = await initWasm(() => wasmUrl);
      db = await sqlite.open(event.data.dbName);
      const payload = await generateDualBackup(db, db.filename);
      await db.close();
      db = null;

      const response: BackupWorkerResponse = {
        type: "result",
        dbBuffer: payload.dbBuffer,
        mdFiles: payload.mdFiles,
      };
      self.postMessage(response, [payload.dbBuffer.buffer]);
    } catch (error) {
      if (db) {
        await db.close().catch(() => {});
      }
      const response: BackupWorkerResponse = {
        type: "error",
        message: error instanceof Error ? error.message : "Backup worker failed",
      };
      self.postMessage(response);
    }
  })();
});

self.postMessage({ type: "ready" } satisfies BackupWorkerResponse);
