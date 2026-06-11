import { Calendar, Inbox, PanelLeft, Plus, Search, Settings } from "lucide-react";
import { INBOX_PAGE_ID } from "../../domain/outliner/inboxPage";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { RibbonButton } from "./RibbonButton";

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

export function LeftRibbon() {
  const leftSidebarOpen = useWorkspaceStore((s) => s.layout.leftSidebarOpen);
  const toggleLeftSidebar = useWorkspaceStore((s) => s.toggleLeftSidebar);
  const toggleCommandPalette = useWorkspaceStore((s) => s.toggleCommandPalette);
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen);
  const openSettings = useWorkspaceStore((s) => s.openSettings);
  const openJournal = useWorkspaceStore((s) => s.openJournal);
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const leaves = useWorkspaceStore((s) => s.leaves);
  const pagesList = useOutlinerStore((s) => s.pagesList);
  const inboxItemCount = useOutlinerStore((s) => s.inboxItemCount);
  const navigateToPage = useOutlinerStore((s) => s.navigateToPage);
  const navigateToInbox = useOutlinerStore((s) => s.navigateToInbox);
  const openPage = useWorkspaceStore((s) => s.openPage);

  const activeType = activeLeafId ? leaves[activeLeafId]?.type : null;
  const activeEditorRootId =
    activeType === "editor" && activeLeafId
      ? (leaves[activeLeafId]?.state as { rootId?: string }).rootId
      : null;

  const handleCreate = () => {
    const name = createUntitledPageName(pagesList);
    void navigateToPage(name).then(() => {
      const rootId = useOutlinerStore.getState().currentRootId;
      const title = useOutlinerStore.getState().currentPageTitle ?? name;
      openPage(rootId, title);
    });
  };

  return (
    <nav className="z-10 flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface-ribbon pb-4 pt-4">
      <RibbonButton
        label={leftSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={() => toggleLeftSidebar()}
        isActive={leftSidebarOpen}
      >
        <PanelLeft size={20} />
      </RibbonButton>
      <RibbonButton
        label="Search (Cmd+K)"
        onClick={() => toggleCommandPalette(true)}
        isActive={activeType === "search" || commandPaletteOpen}
      >
        <Search size={20} />
      </RibbonButton>
      <RibbonButton
        label="Daily Journal"
        onClick={() => openJournal()}
        isActive={activeType === "journal"}
      >
        <Calendar size={20} />
      </RibbonButton>
      <RibbonButton
        label="Inbox"
        onClick={() => void navigateToInbox()}
        isActive={activeEditorRootId === INBOX_PAGE_ID}
        badge={inboxItemCount}
      >
        <Inbox size={20} />
      </RibbonButton>
      <RibbonButton label="Create Node" onClick={handleCreate}>
        <Plus size={20} />
      </RibbonButton>
      <div className="flex-1" />
      <RibbonButton
        label="Settings"
        onClick={() => openSettings()}
        isActive={activeType === "settings"}
      >
        <Settings size={20} />
      </RibbonButton>
    </nav>
  );
}
