import { PanelResizeHandle } from "react-resizable-panels";

export function LayoutPanelHandle() {
  return (
    <PanelResizeHandle className="group relative w-1.5 shrink-0 cursor-col-resize bg-border-strong transition-colors hover:bg-accent data-[resize-handle-state=drag]:bg-accent">
      <div className="absolute inset-y-0 -left-0.5 -right-0.5" />
      <div className="absolute inset-y-1/4 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-surface-primary opacity-0 transition-opacity group-hover:opacity-100 group-data-[resize-handle-state=drag]:opacity-100" />
    </PanelResizeHandle>
  );
}
