import { useMemo } from "react";
import { BookOpen, Calendar, Clock, Layers, Star, Sun } from "lucide-react";
import { partitionPages } from "../domain/pages/Indexer";
import {
  formatDatePageTitle,
  isDatePage,
} from "../domain/pages/PageRegistry";
import { isDailyFeedRootId } from "../store/journal";
import { useOutlinerStore } from "../store/outlinerStore";
import { useWorkspaceStore } from "../store/workspaceStore";
import { openPageFromSidebar } from "./sidebarNavigation";
import { SidebarItem } from "./SidebarItem";
import { SidebarSection } from "./SidebarSection";

const RECENT_PAGE_LIMIT = 12;

export function Sidebar() {
  const currentRootId = useOutlinerStore((state) => state.currentRootId);
  const currentPageTitle = useOutlinerStore((state) => state.currentPageTitle);
  const pagesList = useOutlinerStore((state) => state.pagesList);
  const favoritesList = useOutlinerStore((state) => state.favoritesList);
  const flushPendingContent = useOutlinerStore((s) => s.flushPendingContent);
  const openJournal = useWorkspaceStore((s) => s.openJournal);
  const toggleCommandPalette = useWorkspaceStore((s) => s.toggleCommandPalette);
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

  const { recentPages } = useMemo(() => {
    const { regularPages: pages } = partitionPages(pagesList);
    return {
      recentPages: pages.slice(0, RECENT_PAGE_LIMIT),
    };
  }, [pagesList]);

  const preserveEditorFocus = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleOpenPage = (rootId: string, title: string) => {
    void openPageFromSidebar(rootId, title);
  };

  const handleOpenToday = () => {
    handleOpenPage("", formatDatePageTitle());
  };

  return (
    <aside className="flex h-full min-h-0 flex-col bg-surface-sidebar">
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <SidebarItem
          label="Today"
          icon={<Sun size={16} />}
          isActive={isTodayActive}
          onMouseDown={preserveEditorFocus}
          onClick={handleOpenToday}
        />
        <SidebarItem
          label="Journals"
          icon={<Calendar size={16} />}
          isActive={isJournalsActive}
          onMouseDown={preserveEditorFocus}
          onClick={() => {
            void (async () => {
              await flushPendingContent();
              openJournal();
            })();
          }}
        />
        <SidebarItem
          label="All pages"
          icon={<Layers size={16} />}
          isActive={false}
          onMouseDown={preserveEditorFocus}
          onClick={() => toggleCommandPalette(true)}
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
                onMouseDown={preserveEditorFocus}
                onClick={() => handleOpenPage(page.id, page.content)}
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
                onMouseDown={preserveEditorFocus}
                onClick={() => handleOpenPage(page.id, page.title)}
              />
            ))
          )}
        </SidebarSection>
      </nav>
    </aside>
  );
}
