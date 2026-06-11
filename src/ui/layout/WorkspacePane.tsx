import { LeafRenderer } from "./LeafRenderer";
import { TabBar } from "./TabBar";

export function WorkspacePane() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-workspace">
      <TabBar />
      <main className="flex-1 overflow-y-auto">
        <LeafRenderer />
      </main>
    </div>
  );
}
