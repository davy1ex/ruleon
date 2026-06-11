import type { FlatOutlineNode } from "../domain/outliner/types";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import type { useOutlinerStore } from "../store/outlinerStore";

type OutlinerState = ReturnType<typeof useOutlinerStore.getState>;

export function findFlatNode(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  nodeId: string,
): FlatOutlineNode | null {
  for (const nodes of Object.values(nodesByRootId)) {
    const node = nodes.find((entry) => entry.id === nodeId);
    if (node) {
      return node;
    }
  }
  return null;
}

export function getNodePlainTextFromState(
  state: OutlinerState,
  nodeId: string,
): string {
  const node = findFlatNode(state.nodesByRootId, nodeId);
  return node ? extractPlainText(node.content) : "";
}
