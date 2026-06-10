import { Calendar, PanelRight, Plus, Search, Settings, Timer } from "lucide-react";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";

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

interface RibbonButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}

function RibbonButton({ label, onClick, children, isActive }: RibbonButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        isActive
          ? "bg-accent-muted text-accent"
          : "text-text-muted hover:bg-interactive-hover hover:text-text-normal"
      }`}
    >
      {children}
    </button>
  );
}

export function VerticalRibbon() {
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen);
  const openSettings = useWorkspaceStore((s) => s.openSettings);
  const openJournal = useWorkspaceStore((s) => s.openJournal);
  const toggleRightSidebar = useWorkspaceStore((s) => s.toggleRightSidebar);
  const pinWidget = useWorkspaceStore((s) => s.pinWidget);
  const sidebarWidgets = useWorkspaceStore((s) => s.sidebarWidgets);
  const rightSidebarOpen = useWorkspaceStore((s) => s.layout.rightSidebarOpen);
  const pomodoroPinned = sidebarWidgets.some((w) => w.type === "pomodoro");
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const leaves = useWorkspaceStore((s) => s.leaves);
  const pagesList = useOutlinerStore((s) => s.pagesList);
  const navigateToPage = useOutlinerStore((s) => s.navigateToPage);
  const openPage = useWorkspaceStore((s) => s.openPage);

  const activeType = activeLeafId ? leaves[activeLeafId]?.type : null;

  const handleCreate = () => {
    const name = createUntitledPageName(pagesList);
    void navigateToPage(name).then(() => {
      const rootId = useOutlinerStore.getState().currentRootId;
      const title = useOutlinerStore.getState().currentPageTitle ?? name;
      openPage(rootId, title);
    });
  };

  return (
    <nav
      style={{ gridArea: "ribbon" }}
      className="flex flex-col items-center gap-1 border-r border-border bg-surface-ribbon py-2"
    >
      <RibbonButton label="Journal" onClick={() => openJournal()} isActive={activeType === "journal"}>
        <Calendar size={18} />
      </RibbonButton>
      <RibbonButton
        label="Search"
        onClick={() => openCommandPalette()}
        isActive={activeType === "search" || commandPaletteOpen}
      >
        <Search size={18} />
      </RibbonButton>
      <RibbonButton label="Create page" onClick={handleCreate}>
        <Plus size={18} />
      </RibbonButton>
      <div className="flex-1" />
      <RibbonButton
        label="Pomodoro"
        onClick={() => {
          pinWidget("pomodoro");
          if (!rightSidebarOpen) {
            toggleRightSidebar();
          }
        }}
        isActive={pomodoroPinned && rightSidebarOpen}
      >
        <Timer size={18} />
      </RibbonButton>
      <RibbonButton
        label="Toggle right panel"
        onClick={toggleRightSidebar}
        isActive={rightSidebarOpen}
      >
        <PanelRight size={18} />
      </RibbonButton>
      <RibbonButton
        label="Settings"
        onClick={() => openSettings()}
        isActive={activeType === "settings"}
      >
        <Settings size={18} />
      </RibbonButton>
    </nav>
  );
}
