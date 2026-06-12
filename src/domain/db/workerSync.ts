import { createSyncedDB } from "@vlcn.io/ws-client";
import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";
import { dedupeDateJournalPages } from "../pages/dateJournalPage";
import {
  dedupeInboxPages,
  ensureInboxPage,
} from "../outliner/inboxPage";
import {
  dedupeWelcomePages,
  ensureWelcomePage,
} from "../outliner/welcomePage";
import type { SyncStatus } from "./syncStatus";
import { createStatusTransportProvider } from "./statusTransport";
import { wrapExistingWasmDb } from "./wrapWasmDbForSync";

const DB_NAME = "ruleon.db";

let syncedDb: Awaited<ReturnType<typeof createSyncedDB>> | null = null;

export async function readSchemaVersion(db: WasmDB): Promise<string> {
  const rows = await db.execA<[number | bigint]>(
    `SELECT value FROM crsql_master WHERE key = 'schema_version'`,
  );
  const value = rows[0]?.[0];
  return value == null ? "0" : String(value);
}

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
    const schemaVersion = await readSchemaVersion(db);
    const transportProvider = createStatusTransportProvider(onStatus);
    syncedDb = await createSyncedDB(
      {
        dbProvider: async () => wrapExistingWasmDb(db),
        transportProvider: (opts) =>
          transportProvider({ ...opts, schemaVersion }),
      },
      DB_NAME,
      {
        url: endpoint,
        room: DB_NAME,
        authToken: apiKey.trim() === "" ? undefined : apiKey.trim(),
      },
    );
    await syncedDb.start();
    await dedupeDateJournalPages(db as never);
    await ensureInboxPage(db as never);
    await dedupeInboxPages(db as never);
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
