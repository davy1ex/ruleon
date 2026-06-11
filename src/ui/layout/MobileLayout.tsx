import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Menu,
  PanelRight,
  PlusCircle,
  Search,
} from "lucide-react";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { AppLogo } from "../AppLogo";
import { Sidebar } from "../Sidebar";
import { SyncStatusDot } from "../SyncStatusDot";
import { MobileActivitySheet } from "./MobileActivitySheet";
import { MobileSidebarFooter } from "./MobileSidebarFooter";
import { MobileSettingsSheet } from "./mobileSettings/MobileSettingsSheet";
import { useMobileHeaderTitle } from "./mobileHeaderTitle";
import {
  RightMobileDrawer,
  type MobileWidgetId,
} from "./RightMobileDrawer";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [rightInitialWidget, setRightInitialWidget] = useState<
    MobileWidgetId | undefined
  >();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const headerTitle = useMobileHeaderTitle();
  const currentRootId = useOutlinerStore((s) => s.currentRootId);
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const toggleCommandPalette = useWorkspaceStore((s) => s.toggleCommandPalette);
  const toggleGlobalQuickAdd = useWorkspaceStore((s) => s.toggleGlobalQuickAdd);

  useEffect(() => {
    setLeftOpen(false);
  }, [currentRootId, activeLeafId]);

  const openLeft = () => {
    setRightOpen(false);
    setActivityOpen(false);
    setSettingsOpen(false);
    setLeftOpen(true);
  };

  const openSettings = () => {
    setLeftOpen(false);
    setSettingsOpen(true);
  };

  const openRight = (widgetId?: MobileWidgetId) => {
    setLeftOpen(false);
    setActivityOpen(false);
    setRightInitialWidget(widgetId);
    setRightOpen(true);
  };

  const openActivity = () => {
    setLeftOpen(false);
    setRightOpen(false);
    setActivityOpen(true);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-surface-primary text-text-normal">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <AppLogo size={28} />
          <span className="truncate font-bold text-text-normal">{headerTitle}</span>
        </div>
        <button
          type="button"
          onClick={() => openRight("sync")}
          className="flex items-center justify-center p-1"
          aria-label="Sync status"
        >
          <SyncStatusDot />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">{children}</main>

      <nav className="fixed bottom-0 z-40 flex h-14 w-full items-center justify-around border-t border-border bg-surface-secondary px-2 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={openLeft}
          className="p-2 text-text-muted hover:text-text-normal"
          aria-label="Navigation"
        >
          <Menu size={24} />
        </button>
        <button
          type="button"
          onClick={() => toggleCommandPalette(true)}
          className="p-2 text-text-muted hover:text-text-normal"
          aria-label="Search"
        >
          <Search size={24} />
        </button>
        <button
          type="button"
          onClick={() => toggleGlobalQuickAdd(true)}
          className="p-2 text-accent"
          aria-label="Quick add"
        >
          <PlusCircle size={32} />
        </button>
        <button
          type="button"
          onClick={openActivity}
          className="p-2 text-text-muted hover:text-text-normal"
          aria-label="Tabs and recent"
        >
          <Activity size={24} />
        </button>
        <button
          type="button"
          onClick={() => openRight()}
          className="p-2 text-text-muted hover:text-text-normal"
          aria-label="Widgets"
        >
          <PanelRight size={24} />
        </button>
      </nav>

      {leftOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setLeftOpen(false)}
          aria-hidden
        />
      ) : null}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-sm transform flex-col bg-surface-sidebar transition-transform duration-300 ${
          leftOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border p-4 font-bold">
          <AppLogo size={24} />
          <span>Ruleon</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <MobileSidebarFooter onOpenSettings={openSettings} />
      </div>

      <RightMobileDrawer
        isOpen={rightOpen}
        onClose={() => setRightOpen(false)}
        initialWidgetId={rightInitialWidget}
      />

      <MobileActivitySheet
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
      />

      <MobileSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
