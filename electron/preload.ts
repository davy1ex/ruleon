import { contextBridge, ipcRenderer } from "electron";
import type { DualBackupPayload } from "./backupTypes.js";

contextBridge.exposeInMainWorld("electronAPI", {
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
});
