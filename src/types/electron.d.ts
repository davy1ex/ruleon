import type { DualBackupPayload } from "../domain/backup/backupTypes";

export interface ElectronAPI {
  fetchHealth: (
    endpoint: string,
  ) => Promise<{ ok: boolean; status: number; body: unknown }>;
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
