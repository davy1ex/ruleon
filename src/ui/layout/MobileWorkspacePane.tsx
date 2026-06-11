import { LeafRenderer } from "./LeafRenderer";

export function MobileWorkspacePane() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-workspace">
      <main className="flex-1 overflow-y-auto">
        <LeafRenderer />
      </main>
    </div>
  );
}
