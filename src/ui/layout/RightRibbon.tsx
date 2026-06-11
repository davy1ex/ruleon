import { Calendar, ListTree, PanelRight, Timer, User } from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import type { RightWidgetType } from "../../store/workspaceTypes";
import { RibbonButton } from "./RibbonButton";

function toggleWidget(
  current: RightWidgetType | null,
  next: RightWidgetType,
  setRightWidget: (widget: RightWidgetType | null) => void,
): void {
  setRightWidget(current === next ? null : next);
}

export function RightRibbon() {
  const rightWidget = useWorkspaceStore((s) => s.layout.rightWidget);
  const toggleRightPanel = useWorkspaceStore((s) => s.toggleRightPanel);
  const setRightWidget = useWorkspaceStore((s) => s.setRightWidget);
  const gamificationEnabled = useWorkspaceStore((s) => s.plugins.gamification);
  const calendarEnabled = useWorkspaceStore((s) => s.plugins.calendar);

  return (
    <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border bg-surface-ribbon pb-4 pt-4">
      <RibbonButton
        label={rightWidget ? "Hide right panel" : "Show right panel"}
        onClick={() => toggleRightPanel()}
        isActive={rightWidget != null}
      >
        <PanelRight size={20} />
      </RibbonButton>
      {gamificationEnabled ? (
        <RibbonButton
          label="Profile"
          onClick={() => toggleWidget(rightWidget, "profile", setRightWidget)}
          isActive={rightWidget === "profile"}
        >
          <User size={20} />
        </RibbonButton>
      ) : null}
      {calendarEnabled ? (
        <RibbonButton
          label="Calendar"
          onClick={() => toggleWidget(rightWidget, "calendar", setRightWidget)}
          isActive={rightWidget === "calendar"}
        >
          <Calendar size={20} />
        </RibbonButton>
      ) : null}
      <RibbonButton
        label="Pomodoro"
        onClick={() => toggleWidget(rightWidget, "pomodoro", setRightWidget)}
        isActive={rightWidget === "pomodoro"}
      >
        <Timer size={20} />
      </RibbonButton>
      <RibbonButton
        label="Outline"
        onClick={() => toggleWidget(rightWidget, "outline", setRightWidget)}
        isActive={rightWidget === "outline"}
      >
        <ListTree size={20} />
      </RibbonButton>
    </nav>
  );
}
