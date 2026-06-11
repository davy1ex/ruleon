import type { DualBackupPayload } from "../domain/backup/backupTypes";

export interface ElectronAPI {
  saveDualBackup(payload: DualBackupPayload): Promise<string>;
  platform: NodeJS.Platform;
  onCloseTabShortcut: (handler: () => void) => () => void;
  onGlobalQuickAdd: (handler: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
