import type { ReactNode } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { ResizeHandle } from "./layout/ResizeHandle";
import { RightSidebar } from "./layout/RightSidebar";
import { VerticalRibbon } from "./layout/VerticalRibbon";
import { WorkspacePane } from "./layout/WorkspacePane";

interface AppShellProps {
  sidebar: ReactNode;
}

export function AppShell({ sidebar }: AppShellProps) {
  const layout = useWorkspaceStore((s) => s.layout);
  const setLeftSidebarWidth = useWorkspaceStore((s) => s.setLeftSidebarWidth);
  const setRightSidebarWidth = useWorkspaceStore((s) => s.setRightSidebarWidth);

  const rightColumn = layout.rightSidebarOpen
    ? "var(--layout-right-sidebar-width)"
    : "0px";

  return (
    <div
      className="grid h-screen overflow-hidden bg-surface-primary text-text-normal"
      style={{
        gridTemplateColumns: `var(--size-ribbon-width) var(--layout-left-sidebar-width) 1fr ${rightColumn}`,
        gridTemplateAreas: '"ribbon left workspace right"',
      }}
    >
      <VerticalRibbon />

      <div
        style={{ gridArea: "left" }}
        className="relative flex min-h-0 min-w-0 flex-col overflow-hidden"
      >
        {sidebar}
        <ResizeHandle
          side="left"
          getWidth={() => useWorkspaceStore.getState().layout.leftSidebarWidth}
          onResize={setLeftSidebarWidth}
        />
      </div>

      <WorkspacePane />

      {layout.rightSidebarOpen && (
        <div
          style={{ gridArea: "right" }}
          className="relative min-h-0 min-w-0 overflow-hidden"
        >
          <RightSidebar />
          <ResizeHandle
            side="right"
            getWidth={() =>
              useWorkspaceStore.getState().layout.rightSidebarWidth
            }
            onResize={setRightSidebarWidth}
          />
        </div>
      )}
    </div>
  );
}
