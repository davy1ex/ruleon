import { startSync } from "../../domain/db";
import { setSyncDataChangedHandler } from "../../domain/db/initWorker";
import { useOutlinerStore } from "../../store/outlinerStore";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSyncRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void useOutlinerStore.getState().refresh();
  }, 150);
}

function flushContentOnBackground(): void {
  if (document.visibilityState === "hidden") {
    void useOutlinerStore.getState().flushPendingContent();
  }
}

export async function init(url: string, apiKey: string): Promise<void> {
  setSyncDataChangedHandler(scheduleSyncRefresh);
  document.addEventListener("visibilitychange", flushContentOnBackground);
  await startSync(url, apiKey, (status) => {
    useOutlinerStore.getState().setSyncStatus(status);
    if (status === "syncing") {
      scheduleSyncRefresh();
    }
  });
}
