import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalIcon,
  Check,
  ChevronUp,
  Gamepad2,
  RefreshCw,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { CalendarWidget } from "../../features/calendar/CalendarWidget";
import { useOutlinerStore, type SyncStatus } from "../../store/outlinerStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { PomodoroWidget } from "../pomodoro/PomodoroWidget";
import { SyncStatusDot } from "../SyncStatusDot";
import { SyncStatusPanel } from "./SyncStatusPanel";
import { ProfileWidget } from "./widgets/ProfileWidget";

export type MobileWidgetId =
  | "calendar"
  | "gamification"
  | "pomodoro"
  | "sync";

interface WidgetConfig {
  id: MobileWidgetId;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
}

const SHORT_SYNC_LABELS: Record<SyncStatus, string> = {
  connecting: "Connecting",
  connected: "Synced",
  syncing: "Syncing",
  disconnected: "Offline",
  error: "Sync error",
};

interface RightMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialWidgetId?: MobileWidgetId;
}

function MobileWidgetContent({ widgetId }: { widgetId: MobileWidgetId }) {
  switch (widgetId) {
    case "calendar":
      return <CalendarWidget compact />;
    case "gamification":
      return <ProfileWidget compact />;
    case "pomodoro":
      return <PomodoroWidget compact />;
    case "sync":
      return <SyncStatusPanel standalone />;
  }
}

export function RightMobileDrawer({
  isOpen,
  onClose,
  initialWidgetId,
}: RightMobileDrawerProps) {
  const workspacePlugins = useWorkspaceStore((s) => s.plugins);
  const settingsPlugins = useSettingsStore((s) => s.settings.plugins);
  const syncStatus = useOutlinerStore((s) => s.syncStatus);
  const headerTitle = useWorkspaceStore((s) => {
    const leaf = s.activeLeafId ? s.leaves[s.activeLeafId] : null;
    return leaf?.title ?? "Active";
  });

  const [activeWidgetId, setActiveWidgetId] =
    useState<MobileWidgetId>("calendar");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const availableWidgets = useMemo<WidgetConfig[]>(
    () =>
      [
        {
          id: "calendar",
          label: "Calendar",
          icon: CalIcon,
          enabled: workspacePlugins.calendar,
        },
        {
          id: "gamification",
          label: "Profile & XP",
          icon: Gamepad2,
          enabled: workspacePlugins.gamification,
        },
        {
          id: "pomodoro",
          label: "Pomodoro Timer",
          icon: Timer,
          enabled: settingsPlugins.pomodoro?.enabled !== false,
        },
        {
          id: "sync",
          label: "Sync Status",
          icon: RefreshCw,
          enabled: true,
        },
      ].filter((widget) => widget.enabled),
    [workspacePlugins.calendar, workspacePlugins.gamification, settingsPlugins.pomodoro?.enabled],
  );

  const activeWidget =
    availableWidgets.find((widget) => widget.id === activeWidgetId) ??
    availableWidgets[0];

  useEffect(() => {
    if (!isOpen) {
      setIsMenuOpen(false);
      return;
    }
    if (
      initialWidgetId &&
      availableWidgets.some((widget) => widget.id === initialWidgetId)
    ) {
      setActiveWidgetId(initialWidgetId);
    }
  }, [isOpen, initialWidgetId, availableWidgets]);

  useEffect(() => {
    if (availableWidgets.some((widget) => widget.id === activeWidgetId)) {
      return;
    }
    const fallback = availableWidgets[0]?.id;
    if (fallback) {
      setActiveWidgetId(fallback);
    }
  }, [availableWidgets, activeWidgetId]);

  if (!activeWidget) {
    return null;
  }

  const ActiveIcon = activeWidget.icon;

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-4/5 max-w-sm transform flex-col bg-surface-primary shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="relative min-h-0 flex-1 overflow-y-auto p-4"
          onClick={() => setIsMenuOpen(false)}
        >
          <MobileWidgetContent widgetId={activeWidget.id} />
        </div>

        <div className="relative flex flex-col gap-2 border-t border-border bg-surface-primary p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          {isMenuOpen ? (
            <div className="absolute bottom-full left-3 right-3 mb-2 flex flex-col overflow-hidden rounded-xl border border-border bg-surface-secondary py-1 shadow-xl">
              {availableWidgets.map((widget) => {
                const Icon = widget.icon;
                const isActive = widget.id === activeWidget.id;
                return (
                  <button
                    key={widget.id}
                    type="button"
                    onClick={() => {
                      setActiveWidgetId(widget.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-interactive-hover"
                  >
                    <Icon
                      size={18}
                      className={
                        isActive ? "text-accent" : "text-text-muted"
                      }
                    />
                    <span
                      className={`flex-1 ${
                        isActive
                          ? "font-medium text-text-normal"
                          : "text-text-muted"
                      }`}
                    >
                      {widget.label}
                    </span>
                    {isActive ? (
                      <Check size={16} className="text-accent" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex items-center justify-between rounded-xl border border-transparent bg-surface-secondary px-4 py-3 transition-colors hover:bg-interactive-hover focus:border-border"
          >
            <div className="flex items-center gap-3 font-medium text-text-normal">
              <ActiveIcon size={20} />
              <span>{activeWidget.label}</span>
            </div>
            <ChevronUp
              size={20}
              className={`text-text-muted transition-transform ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div className="flex items-center justify-between px-2 text-[11px] font-medium tracking-wide text-text-muted">
            <div className="flex items-center gap-1.5">
              <SyncStatusDot className="h-2 w-2" />
              <span>{SHORT_SYNC_LABELS[syncStatus]}</span>
            </div>
            <span className="max-w-[45%] truncate">{headerTitle}</span>
          </div>
        </div>
      </div>
    </>
  );
}
