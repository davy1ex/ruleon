import { contextBridge, ipcRenderer } from "electron";
import type { DualBackupPayload } from "./backupTypes.js";

contextBridge.exposeInMainWorld("electronAPI", {
  fetchHealth: (endpoint: string) =>
    ipcRenderer.invoke("sync:healthCheck", endpoint) as Promise<{
      ok: boolean;
      status: number;
      body: unknown;
    }>,
  saveDualBackup: (payload: DualBackupPayload) =>
    ipcRenderer.invoke("backup:save", payload),
  platform: process.platform,
  onCloseTabShortcut: (handler: () => void) => {
    const listener = () => {
      handler();
    };
    ipcRenderer.on("workspace:close-tab", listener);
    return () => {
      ipcRenderer.removeListener("workspace:close-tab", listener);
    };
  },
  onGlobalQuickAdd: (handler: () => void) => {
    const listener = () => {
      handler();
    };
    ipcRenderer.on("trigger-global-quick-add", listener);
    return () => {
      ipcRenderer.removeListener("trigger-global-quick-add", listener);
    };
  },
});
