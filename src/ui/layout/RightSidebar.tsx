import { extractPlainText } from "../../features/editor/serialization/contentCodec";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { PomodoroWidget } from "../pomodoro/PomodoroWidget";
import { SyncIndicator } from "../SyncIndicator";

function BacklinksWidget() {
  const linkedReferences = useOutlinerStore((s) => s.linkedReferences);

  return (
    <div className="px-3 py-2">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Backlinks
      </h3>
      {linkedReferences.length === 0 ? (
        <p className="text-sm text-text-muted">No backlinks</p>
      ) : (
        <ul className="space-y-1">
          {linkedReferences.map((ref) => (
            <li key={ref.id} className="truncate text-sm text-text-normal">
              {extractPlainText(ref.content) || ref.id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WidgetContent({ type }: { type: string }) {
  switch (type) {
    case "backlinks":
      return <BacklinksWidget />;
    case "sync-status":
      return (
        <div className="px-3 py-2">
          <SyncIndicator />
        </div>
      );
    case "outline":
      return (
        <p className="px-3 py-2 text-sm text-text-muted">Outline (coming soon)</p>
      );
    case "pomodoro":
      return <PomodoroWidget compact />;
    default:
      return null;
  }
}

export function RightSidebar() {
  const widgets = useWorkspaceStore((s) => s.sidebarWidgets);
  const toggleCollapsed = useWorkspaceStore((s) => s.toggleWidgetCollapsed);
  const unpinWidget = useWorkspaceStore((s) => s.unpinWidget);

  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <aside
      style={{ gridArea: "right" }}
      className="flex h-full min-w-0 flex-col overflow-hidden border-l border-border bg-surface-sidebar"
    >
      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-sm text-text-muted">No pinned widgets</p>
          <p className="text-xs text-text-muted">
            Pin widgets from the ribbon menu (coming soon)
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {sorted.map((widget) => (
            <div key={widget.id} className="border-b border-border">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(widget.id)}
                  className="text-xs font-semibold uppercase tracking-wide text-text-muted"
                >
                  {widget.type}
                </button>
                <button
                  type="button"
                  onClick={() => unpinWidget(widget.id)}
                  className="text-xs text-text-muted hover:text-text-danger"
                >
                  Unpin
                </button>
              </div>
              {!widget.collapsed && <WidgetContent type={widget.type} />}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
