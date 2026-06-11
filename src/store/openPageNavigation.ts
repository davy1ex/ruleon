import { getDbContext } from "./dbContext";
import { useOutlinerStore } from "./outlinerStore";
import { useWorkspaceStore } from "./workspaceStore";

export async function navigateToPageAndOpen(
  pageName: string,
  options?: { rootId?: string; blockId?: string },
): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const outliner = useOutlinerStore.getState();
  await outliner.navigateToPage(pageName);

  const rootId = options?.rootId ?? useOutlinerStore.getState().currentRootId;
  if (!rootId) {
    return;
  }

  useWorkspaceStore.getState().openPage(rootId, pageName);

  if (options?.blockId) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        useOutlinerStore.getState().focusBlock(options.blockId!);
      });
    });
  }
}
