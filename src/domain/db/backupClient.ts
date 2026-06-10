import type { DualBackupPayload } from "../backup/backupTypes";
import { getWorkerRpc } from "./initWorker";

const DB_NAME = import.meta.env.VITE_E2E === "1" ? "ruleon-e2e.db" : "ruleon.db";

type BackupWorkerRequest = { type: "generate"; dbName: string };

type BackupWorkerResponse =
  | { type: "ready" }
  | ({ type: "result" } & DualBackupPayload)
  | { type: "error"; message: string };

let backupWorker: Worker | null = null;
let backupWorkerReady: Promise<void> | null = null;

function getBackupWorker(): Worker {
  if (!backupWorker) {
    backupWorker = new Worker(new URL("./backupWorker.ts", import.meta.url), {
      type: "module",
    });
    backupWorkerReady = new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent<BackupWorkerResponse>) => {
        if (event.data.type === "ready") {
          backupWorker?.removeEventListener("message", onMessage);
          resolve();
        }
      };
      backupWorker!.addEventListener("message", onMessage);
      backupWorker!.addEventListener("error", (error) => {
        backupWorker?.removeEventListener("message", onMessage);
        reject(error);
      });
    });
  }
  return backupWorker;
}

async function checkpointMainDatabase(): Promise<void> {
  const rpc = getWorkerRpc();
  if (!rpc) {
    return;
  }
  await rpc.request("exec", { sql: "PRAGMA wal_checkpoint(TRUNCATE);" });
}

export async function generateDualBackupInWorker(
  dbName: string = DB_NAME,
): Promise<DualBackupPayload> {
  await checkpointMainDatabase();
  const worker = getBackupWorker();
  await backupWorkerReady;

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<BackupWorkerResponse>) => {
      if (event.data.type === "result") {
        worker.removeEventListener("message", onMessage);
        resolve({
          dbBuffer: event.data.dbBuffer,
          mdFiles: event.data.mdFiles,
        });
        return;
      }
      if (event.data.type === "error") {
        worker.removeEventListener("message", onMessage);
        reject(new Error(event.data.message));
      }
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage({ type: "generate", dbName } satisfies BackupWorkerRequest);
  });
}

export async function runDualBackupChain(): Promise<string | null> {
  if (!window.electronAPI?.saveDualBackup) {
    return null;
  }

  const payload = await generateDualBackupInWorker();
  return window.electronAPI.saveDualBackup(payload);
}

export function disposeBackupWorker(): void {
  backupWorker?.terminate();
  backupWorker = null;
  backupWorkerReady = null;
}
