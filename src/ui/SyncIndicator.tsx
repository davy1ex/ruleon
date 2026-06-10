import { useOutlinerStore, type SyncStatus } from "../store/outlinerStore";

const STATUS_LABELS: Record<SyncStatus, string> = {
  connecting: "Connecting to sync server…",
  connected: "Synced — all changes saved",
  syncing: "Syncing changes…",
  disconnected: "Offline — changes saved locally",
  error: "Sync error — check connection",
};

const STATUS_COLORS: Record<SyncStatus, string> = {
  connecting: "bg-status-warning",
  connected: "bg-status-success",
  syncing: "bg-status-warning animate-pulse",
  disconnected: "bg-status-error",
  error: "bg-status-error",
};

export function SyncIndicator() {
  const syncStatus = useOutlinerStore((state) => state.syncStatus);
  const label = STATUS_LABELS[syncStatus];

  return (
    <div
      className="flex items-center gap-2 px-2 py-1"
      title={label}
      aria-label={label}
    >
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[syncStatus]}`}
        aria-hidden
      />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
