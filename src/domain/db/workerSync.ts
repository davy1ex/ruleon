import { createSyncedDB } from "@vlcn.io/ws-client";
import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";
import {
  dedupeWelcomePages,
  ensureWelcomePage,
} from "../outliner/welcomePage";
import type { SyncStatus } from "./syncStatus";
import { createStatusTransportProvider } from "./statusTransport";
import { wrapExistingWasmDb } from "./wrapWasmDbForSync";

const DB_NAME = "ruleon.db";

let syncedDb: Awaited<ReturnType<typeof createSyncedDB>> | null = null;

export async function startSyncInWorker(
  db: WasmDB,
  url: string,
  apiKey: string,
  onStatus: (status: SyncStatus) => void,
): Promise<void> {
  const endpoint = url.trim();
  if (!endpoint) {
    onStatus("disconnected");
    return;
  }

  if (syncedDb) {
    return;
  }

  onStatus("connecting");

  try {
    syncedDb = await createSyncedDB(
      {
        dbProvider: async () => wrapExistingWasmDb(db),
        transportProvider: createStatusTransportProvider(onStatus),
      },
      DB_NAME,
      {
        url: endpoint,
        room: DB_NAME,
        authToken: apiKey.trim() === "" ? undefined : apiKey.trim(),
      },
    );
    await syncedDb.start();
    await dedupeWelcomePages(db as never);
    await ensureWelcomePage(db as never);
    onStatus("connected");
  } catch (error) {
    console.error("Failed to start sync:", error);
    syncedDb = null;
    onStatus("error");
  }
}

export function stopSyncInWorker(): void {
  if (!syncedDb) {
    return;
  }
  syncedDb.stop();
  syncedDb = null;
}
