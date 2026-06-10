import { startBackupScheduler } from "../../domain/backup/backupScheduler";
import type { DbContext } from "../../domain/db/types";

let stopScheduler: (() => void) | null = null;

export function initBackupModule(context: DbContext): void {
  if (!window.electronAPI?.saveDualBackup) {
    return;
  }
  stopScheduler?.();
  stopScheduler = startBackupScheduler(context.db, context.rx);
}

export function disposeBackupModule(): void {
  stopScheduler?.();
  stopScheduler = null;
}
