import { runDualBackupChain } from "../db/backupClient";
import type { RuleonDb } from "../db/types";
import type { RxBridge } from "../db/rxBridge";

const BACKUP_INTERVAL_MS = 15 * 60 * 1000;
const RX_DEBOUNCE_MS = 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let rxDispose: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

async function runDualBackup(): Promise<void> {
  if (!window.electronAPI?.saveDualBackup || running) {
    return;
  }
  running = true;
  try {
    await runDualBackupChain();
  } catch (error) {
    console.error("Dual backup failed:", error);
  } finally {
    running = false;
  }
}

function scheduleDebouncedBackup(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runDualBackup();
  }, RX_DEBOUNCE_MS);
}

export function startBackupScheduler(_db: RuleonDb, rx: RxBridge): () => void {
  if (!window.electronAPI?.saveDualBackup) {
    return () => {};
  }

  intervalId = setInterval(() => {
    void runDualBackup();
  }, BACKUP_INTERVAL_MS);

  rxDispose = rx.onRange(["outline_nodes", "block_links", "kv_state"], () => {
    scheduleDebouncedBackup();
  });

  return stopBackupScheduler;
}

export function stopBackupScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  rxDispose?.();
  rxDispose = null;
}

export { runDualBackup };
