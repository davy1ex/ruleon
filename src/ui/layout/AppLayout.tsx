import { useEffect, useMemo, type ReactNode } from "react";
import {
  Panel,
  PanelGroup,
} from "react-resizable-panels";
import { useWorkspaceStore } from "../../store/workspaceStore";
import type { RightWidgetType } from "../../store/workspaceTypes";
import { LeftRibbon } from "./LeftRibbon";
import { LayoutPanelHandle } from "./LayoutPanelHandle";
import { RightRibbon } from "./RightRibbon";
import { WidgetPanel } from "./WidgetPanel";
import { WorkspacePane } from "./WorkspacePane";

interface AppLayoutProps {
  sidebar: ReactNode;
}

interface PanelSetup {
  panelKey: string;
  autoSaveId: string;
  showLeft: boolean;
  showRight: boolean;
  leftSize: number;
  workspaceSize: number;
  widgetSize: number;
}

function getPanelSetup(
  leftSidebarOpen: boolean,
  rightWidget: RightWidgetType | null,
): PanelSetup {
  if (leftSidebarOpen && rightWidget) {
    return {
      panelKey: "left-workspace-widget",
      autoSaveId: "ruleon-left-workspace-widget",
      showLeft: true,
      showRight: true,
      leftSize: 20,
      workspaceSize: 60,
      widgetSize: 20,
    };
  }

  if (leftSidebarOpen) {
    return {
      panelKey: "left-workspace",
      autoSaveId: "ruleon-left-workspace",
      showLeft: true,
      showRight: false,
      leftSize: 25,
      workspaceSize: 75,
      widgetSize: 0,
    };
  }

  if (rightWidget) {
    return {
      panelKey: "workspace-widget",
      autoSaveId: "ruleon-workspace-widget",
      showLeft: false,
      showRight: true,
      leftSize: 0,
      workspaceSize: 75,
      widgetSize: 25,
    };
  }

  return {
    panelKey: "workspace",
    autoSaveId: "ruleon-workspace",
    showLeft: false,
    showRight: false,
    leftSize: 0,
    workspaceSize: 100,
    widgetSize: 0,
  };
}

function clearLegacyPanelStorage(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (
      key?.startsWith("react-resizable-panels:ruleon-panels") ||
      key === "react-resizable-panels:ruleon-panels-v2" ||
      key === "react-resizable-panels:ruleon-panels-v3"
    ) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

export function AppLayout({ sidebar }: AppLayoutProps) {
  const leftSidebarOpen = useWorkspaceStore(
    (s) => s.layout.leftSidebarOpen,
  );
  const rightWidget = useWorkspaceStore((s) => s.layout.rightWidget);

  const setup = useMemo(
    () => getPanelSetup(leftSidebarOpen, rightWidget),
    [leftSidebarOpen, rightWidget],
  );

  useEffect(() => {
    clearLegacyPanelStorage();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-primary text-text-normal">
      <LeftRibbon />

      <PanelGroup
        key={setup.panelKey}
        direction="horizontal"
        autoSaveId={setup.autoSaveId}
        className="h-full min-w-0 flex-1"
      >
        {setup.showLeft && (
          <>
            <Panel
              id="left-sidebar"
              defaultSize={setup.leftSize}
              minSize={15}
              maxSize={35}
              className="overflow-hidden bg-surface-sidebar"
            >
              <div className="h-full min-h-0 overflow-hidden">{sidebar}</div>
            </Panel>
            <LayoutPanelHandle />
          </>
        )}

        <Panel
          id="workspace"
          minSize={30}
          defaultSize={setup.workspaceSize}
          className="min-w-0 overflow-hidden"
        >
          <WorkspacePane />
        </Panel>

        {setup.showRight && rightWidget && (
          <>
            <LayoutPanelHandle />
            <Panel
              id="widget-panel"
              defaultSize={setup.widgetSize}
              minSize={15}
              maxSize={35}
              className="overflow-hidden bg-surface-sidebar"
            >
              <div className="h-full min-h-0 overflow-hidden">
                <WidgetPanel widget={rightWidget} />
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>

      <RightRibbon />
    </div>
  );
}
