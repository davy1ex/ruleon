import { useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  HardDriveDownload,
  Layers,
  Plus,
  Search,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { runDualBackupChain } from "../domain/db/backupClient";
import { partitionPages } from "../domain/pages/Indexer";
import {
  formatDatePageTitle,
  isDatePage,
} from "../domain/pages/PageRegistry";
import {
  isDailyFeedRootId,
  SYSTEM_TRASH_ROOT_ID,
} from "../store/journal";
import { useOutlinerStore } from "../store/outlinerStore";
import { useWorkspaceStore } from "../store/workspaceStore";
import { SidebarItem } from "./SidebarItem";
import { SidebarSection } from "./SidebarSection";
import { SyncIndicator } from "./SyncIndicator";

const RECENT_PAGE_LIMIT = 12;

function createUntitledPageName(
  pages: { content: string; id: string }[],
): string {
  const taken = new Set(
    pages.map((page) => page.content.trim().toLowerCase()),
  );
  if (!taken.has("untitled")) {
    return "Untitled";
  }

  let index = 2;
  while (taken.has(`untitled ${index}`)) {
    index += 1;
  }
  return `Untitled ${index}`;
}

export function Sidebar() {
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const currentRootId = useOutlinerStore((state) => state.currentRootId);
  const currentPageTitle = useOutlinerStore((state) => state.currentPageTitle);
  const pagesList = useOutlinerStore((state) => state.pagesList);
  const favoritesList = useOutlinerStore((state) => state.favoritesList);
  const navigateToPage = useOutlinerStore((state) => state.navigateToPage);
  const openPage = useWorkspaceStore((s) => s.openPage);
  const openJournal = useWorkspaceStore((s) => s.openJournal);
  const openTrash = useWorkspaceStore((s) => s.openTrash);
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const leaves = useWorkspaceStore((s) => s.leaves);

  const activeLeaf = activeLeafId ? leaves[activeLeafId] : null;

  const isJournalsActive =
    activeLeaf?.type === "journal" || isDailyFeedRootId(currentRootId);
  const isTodayActive =
    currentPageTitle !== null &&
    isDatePage(currentPageTitle) &&
    currentPageTitle === formatDatePageTitle() &&
    !isDailyFeedRootId(currentRootId);
  const isTrashActive =
    activeLeaf?.type === "trash" ||
    currentRootId === SYSTEM_TRASH_ROOT_ID;

  const { recentPages } = useMemo(() => {
    const { regularPages: pages } = partitionPages(pagesList);
    return {
      recentPages: pages.slice(0, RECENT_PAGE_LIMIT),
    };
  }, [pagesList]);

  const handleCreate = () => {
    const name = createUntitledPageName(pagesList);
    void navigateToPage(name).then(() => {
      const rootId = useOutlinerStore.getState().currentRootId;
      const title = useOutlinerStore.getState().currentPageTitle ?? name;
      openPage(rootId, title);
    });
  };

  const handleOpenToday = () => {
    const todayTitle = formatDatePageTitle();
    void navigateToPage(todayTitle).then(() => {
      const rootId = useOutlinerStore.getState().currentRootId;
      openPage(rootId, todayTitle);
    });
  };

  const handleForceBackup = () => {
    if (backupRunning || !window.electronAPI?.saveDualBackup) {
      return;
    }

    setBackupRunning(true);
    setBackupMessage(null);
    void runDualBackupChain()
      .then((backupRoot) => {
        setBackupMessage(backupRoot ? `Saved to ${backupRoot}` : "Backup unavailable");
      })
      .catch((error: unknown) => {
        setBackupMessage(
          error instanceof Error ? error.message : "Backup failed",
        );
      })
      .finally(() => {
        setBackupRunning(false);
      });
  };

  const canForceBackup = typeof window.electronAPI?.saveDualBackup === "function";

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-surface-sidebar">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-bold tracking-wide text-text-normal">RULEON</p>
        <div className="flex items-center gap-0.5">
          {canForceBackup ? (
            <button
              type="button"
              onClick={handleForceBackup}
              disabled={backupRunning}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-interactive-hover hover:text-text-normal disabled:opacity-50"
              aria-label="Force backup"
              title="Force Backup"
            >
              <HardDriveDownload size={18} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-interactive-hover hover:text-text-normal"
            aria-label="Search pages"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {backupMessage ? (
        <p className="border-b border-border px-4 py-2 text-xs text-text-muted">
          {backupMessage}
        </p>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarItem
          label="Today"
          icon={<Sun size={16} />}
          isActive={isTodayActive}
          onClick={handleOpenToday}
        />
        <SidebarItem
          label="Journals"
          icon={<Calendar size={16} />}
          isActive={isJournalsActive}
          onClick={() => openJournal()}
        />
        <SidebarItem
          label="All pages"
          icon={<Layers size={16} />}
          isActive={false}
          onClick={() => openCommandPalette()}
        />

        <SidebarSection
          title="Favorites"
          storageKey="ruleon.sidebar.favorites"
          icon={<Star size={14} className="opacity-70" />}
          defaultOpen
        >
          {favoritesList.length === 0 ? (
            <p className="px-6 py-1.5 text-sm text-text-muted">No favorites yet</p>
          ) : (
            favoritesList.map((page) => (
              <SidebarItem
                key={page.id}
                label={page.content}
                icon={<Star size={16} />}
                isActive={page.id === currentRootId}
                onClick={() => openPage(page.id, page.content)}
              />
            ))
          )}
        </SidebarSection>

        <SidebarSection
          title="Recent"
          storageKey="ruleon.sidebar.recent"
          icon={<Clock size={14} className="opacity-70" />}
          defaultOpen
        >
          {recentPages.length === 0 ? (
            <p className="px-6 py-1.5 text-sm text-text-muted">No recent pages</p>
          ) : (
            recentPages.map((page) => (
              <SidebarItem
                key={page.id}
                label={page.title}
                icon={<BookOpen size={16} />}
                isActive={page.id === currentRootId}
                onClick={() => openPage(page.id, page.title)}
              />
            ))
          )}
        </SidebarSection>
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={handleCreate}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2 font-medium text-text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Plus size={18} />
          Create
        </button>
        <SidebarItem
          label="Trash Bin"
          icon={<Trash2 size={16} />}
          isActive={isTrashActive}
          onClick={() => openTrash()}
        />
        <div className="mt-2 flex items-center justify-center px-2">
          <SyncIndicator />
        </div>
      </div>
    </aside>
  );
}
