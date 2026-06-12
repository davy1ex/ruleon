import { useOutlinerStore, type SyncStatus } from "../store/outlinerStore";

const STATUS_LABELS: Record<SyncStatus, string> = {
  connecting: "Connecting to sync server…",
  connected: "Connected to sync server",
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

interface SyncStatusDotProps {
  className?: string;
}

export function SyncStatusDot({ className = "h-3 w-3" }: SyncStatusDotProps) {
  const syncStatus = useOutlinerStore((state) => state.syncStatus);
  const label = STATUS_LABELS[syncStatus];

  return (
    <span
      className={`inline-block shrink-0 rounded-full ${STATUS_COLORS[syncStatus]} ${className}`}
      title={label}
      aria-label={label}
    />
  );
}

export { STATUS_COLORS, STATUS_LABELS };
