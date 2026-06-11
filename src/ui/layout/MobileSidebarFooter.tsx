import { Settings } from "lucide-react";
import { useOutlinerStore } from "../../store/outlinerStore";

interface MobileSidebarFooterProps {
  onOpenSettings: () => void;
}

export function MobileSidebarFooter({ onOpenSettings }: MobileSidebarFooterProps) {
  const pagesList = useOutlinerStore((s) => s.pagesList);
  const pageCount = pagesList.length;

  return (
    <div className="shrink-0 border-t border-border bg-surface-sidebar px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-normal">Ruleon</p>
          <p className="text-xs text-text-muted">
            {pageCount} {pageCount === 1 ? "page" : "pages"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-primary text-text-normal shadow-sm hover:bg-interactive-hover"
          aria-label="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </div>
  );
}
