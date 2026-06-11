import type { RightWidgetType } from "../../store/workspaceTypes";
import { CalendarWidget } from "../../features/calendar/CalendarWidget";
import { PomodoroWidget } from "../pomodoro/PomodoroWidget";
import { SyncIndicator } from "../SyncIndicator";
import { ProfileWidget } from "./widgets/ProfileWidget";

interface WidgetPanelProps {
  widget: RightWidgetType;
}

function WidgetContent({ widget }: WidgetPanelProps) {
  switch (widget) {
    case "profile":
      return <ProfileWidget compact />;
    case "pomodoro":
      return <PomodoroWidget compact />;
    case "outline":
      return <p className="text-sm text-text-muted">Outline (coming soon)</p>;
    case "calendar":
      return <CalendarWidget compact />;
  }
}

export function WidgetPanel({ widget }: WidgetPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <WidgetContent widget={widget} />
      </div>
      <div className="shrink-0 border-t border-border px-2 py-2">
        <SyncIndicator />
      </div>
    </div>
  );
}
