import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";

export function useMobileHeaderTitle(): string {
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const leaves = useWorkspaceStore((s) => s.leaves);
  const currentPageTitle = useOutlinerStore((s) => s.currentPageTitle);

  const leaf = activeLeafId ? leaves[activeLeafId] : null;
  if (!leaf) {
    return "Ruleon";
  }

  if (leaf.type === "editor") {
    return currentPageTitle ?? leaf.title;
  }

  return leaf.title;
}
