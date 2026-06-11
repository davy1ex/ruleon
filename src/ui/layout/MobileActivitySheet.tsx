import { useEffect, useMemo, useRef } from "react";
import { BookOpen } from "lucide-react";
import { partitionPages } from "../../domain/pages/Indexer";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { openPageFromSidebar } from "../sidebarNavigation";
import { SidebarItem } from "../SidebarItem";
import { MobileTabList } from "./MobileTabList";

const RECENT_PAGE_LIMIT = 12;

interface MobileActivitySheetProps {
  open: boolean;
  onClose: () => void;
}

export function MobileActivitySheet({ open, onClose }: MobileActivitySheetProps) {
  const pagesList = useOutlinerStore((state) => state.pagesList);
  const currentRootId = useOutlinerStore((state) => state.currentRootId);
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const openedWithLeafId = useRef(activeLeafId);
  const prevOpen = useRef(false);

  const recentPages = useMemo(() => {
    const { regularPages: pages } = partitionPages(pagesList);
    return pages.slice(0, RECENT_PAGE_LIMIT);
  }, [pagesList]);

  useEffect(() => {
    if (open && !prevOpen.current) {
      openedWithLeafId.current = activeLeafId;
    }
    prevOpen.current = open;
  }, [open, activeLeafId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (activeLeafId !== openedWithLeafId.current) {
      onClose();
    }
  }, [activeLeafId, open, onClose]);

  if (!open) {
    return null;
  }

  const handleOpenPage = (rootId: string, title: string) => {
    void openPageFromSidebar(rootId, title).then(onClose);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-xl border-t border-border bg-surface-primary pb-[env(safe-area-inset-bottom)]">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Tabs & Recent
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MobileTabList />
          <div className="px-2 py-2">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Recent
            </p>
            {recentPages.length === 0 ? (
              <p className="px-6 py-1.5 text-sm text-text-muted">No recent pages</p>
            ) : (
              recentPages.map((page) => (
                <SidebarItem
                  key={page.id}
                  label={page.title}
                  icon={<BookOpen size={16} />}
                  isActive={page.id === currentRootId}
                  onClick={() => handleOpenPage(page.id, page.title)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
