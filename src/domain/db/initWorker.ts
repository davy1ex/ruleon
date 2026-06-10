import schemaSql from "./schema.sql?raw";
import { disposeBackupWorker } from "./backupClient";
import { DbRpc, RuleonDb } from "./dbClient";
import { RxBridge } from "./rxBridge";
import type { WorkerResponse } from "./rpcTypes";
import type { SyncStatus } from "./syncStatus";
import type { DbContext } from "./types";

const DB_NAME = import.meta.env.VITE_E2E === "1" ? "ruleon-e2e.db" : "ruleon.db";

let workerInstance: Worker | null = null;
let rpcInstance: DbRpc | null = null;
let syncStatusHandler: ((status: SyncStatus) => void) | null = null;

function waitForWorkerReady(worker: Worker): Promise<void> {
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === "ready") {
        worker.removeEventListener("message", onMessage);
        resolve();
      }
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", (error) => {
      worker.removeEventListener("message", onMessage);
      reject(error);
    });
  });
}

export function setWorkerSyncStatusHandler(
  handler: ((status: SyncStatus) => void) | null,
): void {
  syncStatusHandler = handler;
}

export async function initWorkerDatabase(): Promise<DbContext> {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
    if (event.data.type === "syncStatus") {
      syncStatusHandler?.(event.data.status);
    }
  });

  await waitForWorkerReady(worker);

  const rpc = new DbRpc(worker);
  const meta = (await rpc.request("init", {
    dbName: DB_NAME,
    schemaSql,
  })) as { filename: string; siteid: string };

  workerInstance = worker;
  rpcInstance = rpc;

  const db = new RuleonDb(rpc, meta);

  return {
    db,
    rx: new RxBridge(worker),
    dispose: disposeWorkerDatabase,
  };
}

export async function disposeWorkerDatabase(): Promise<void> {
  if (rpcInstance) {
    await rpcInstance.request("close", {});
  }
  workerInstance?.terminate();
  workerInstance = null;
  rpcInstance = null;
  disposeBackupWorker();
}

export function getWorkerRpc(): DbRpc | null {
  return rpcInstance;
}
