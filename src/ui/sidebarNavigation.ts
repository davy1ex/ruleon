import { useOutlinerStore } from "../store/outlinerStore";
import { useWorkspaceStore } from "../store/workspaceStore";

export async function openPageFromSidebar(
  rootId: string,
  title: string,
): Promise<void> {
  await useOutlinerStore.getState().flushPendingContent();
  await useOutlinerStore.getState().navigateToPage(title);
  const pageRootId = useOutlinerStore.getState().currentRootId;
  useWorkspaceStore.getState().openPage(pageRootId || rootId, title);
}
