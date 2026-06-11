import { useOutlinerStore, type SyncStatus } from "../store/outlinerStore";
import { STATUS_LABELS } from "./SyncStatusDot";
import { SyncStatusDot } from "./SyncStatusDot";

export function SyncIndicator() {
  const syncStatus = useOutlinerStore((state) => state.syncStatus);
  const label = STATUS_LABELS[syncStatus as SyncStatus];

  return (
    <div
      className="flex items-center gap-2 px-2 py-1"
      title={label}
      aria-label={label}
    >
      <SyncStatusDot className="h-2 w-2" />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
