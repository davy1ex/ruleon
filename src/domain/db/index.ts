export { initDatabase } from "./init";
export type { SyncStatus } from "./syncStatus";
export type { RuleonDb, DbContext } from "./types";

import type { SyncStatus } from "./syncStatus";
import {
  getWorkerRpc,
  setSyncDataChangedHandler,
  setWorkerSyncStatusHandler,
} from "./initWorker";

export async function startSync(
  url: string,
  apiKey: string,
  onStatusChange: (status: SyncStatus) => void,
): Promise<void> {
  const rpc = getWorkerRpc();
  if (!rpc) {
    onStatusChange("disconnected");
    return;
  }

  setWorkerSyncStatusHandler(onStatusChange);
  await rpc.request("syncStart", { url, apiKey });
}

export function stopSync(): void {
  const rpc = getWorkerRpc();
  if (!rpc) {
    return;
  }
  void rpc.request("syncStop", {});
  setWorkerSyncStatusHandler(null);
  setSyncDataChangedHandler(null);
}

export async function getLocalSchemaVersion(): Promise<string> {
  const rpc = getWorkerRpc();
  if (!rpc) {
    return "0";
  }
  const version = (await rpc.request("getSchemaVersion", {})) as string;
  return version ?? "0";
}
