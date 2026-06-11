import { useEffect, useMemo } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { resolveShiftArrowTarget } from "../features/outliner/blockSelectionNav";
import { useOutlinerStore } from "../store/outlinerStore";
import { resolveToggleTargets } from "../store/todoActions";

function blurActiveElement(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function isTreeActive(
  rootId: string,
  nodeIdSet: Set<string>,
): boolean {
  const activeRoot = document.activeElement
    ?.closest("[data-root-id]")
    ?.getAttribute("data-root-id");
  if (activeRoot === rootId) {
    return true;
  }

  const state = useOutlinerStore.getState();
  if (state.focusedNodeId !== null && nodeIdSet.has(state.focusedNodeId)) {
    return true;
  }
  return state.selectedIds.some((id) => nodeIdSet.has(id));
}

export function useBlockTreeKeyboard(
  nodes: FlatOutlineNode[],
  rootId: string,
): void {
  const nodeIds = useMemo(() => nodes.map((node) => node.id), [nodes]);
  const nodeIdSet = useMemo(() => new Set(nodeIds), [nodeIds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTreeActive(rootId, nodeIdSet)) {
        return;
      }

      const state = useOutlinerStore.getState();

      if ((event.ctrlKey || event.metaKey) && event.code === "KeyA") {
        event.preventDefault();
        event.stopPropagation();
        blurActiveElement();
        if (nodeIds.length > 0) {
          state.selectAllBlocks(nodeIds);
        }
        return;
      }

      if (event.key === "Escape") {
        if (state.moveTargetNodeId != null) {
          event.preventDefault();
          event.stopPropagation();
          state.closeMoveTarget();
          return;
        }
        if (state.selectedIds.length === 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        state.clearSelection();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === "KeyM"
      ) {
        const targetId =
          state.focusedNodeId && nodeIdSet.has(state.focusedNodeId)
            ? state.focusedNodeId
            : state.selectedIds.find((id) => nodeIdSet.has(id));
        if (!targetId) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        blurActiveElement();
        state.openMoveTarget(targetId);
        return;
      }

      const isEditingInTextarea =
        document.activeElement instanceof HTMLTextAreaElement &&
        state.selectedIds.length === 0;

      if (event.key === "Enter" && !event.shiftKey) {
        if (isEditingInTextarea) {
          if (event.ctrlKey || event.metaKey) {
            return;
          }
        } else if (state.focusedNodeId && nodeIdSet.has(state.focusedNodeId)) {
          event.preventDefault();
          event.stopPropagation();
          if (event.ctrlKey || event.metaKey) {
            void state.cycleTaskStatus(resolveToggleTargets(state, nodeIdSet));
          } else {
            void state.addSibling(state.focusedNodeId);
          }
          return;
        } else if (event.ctrlKey || event.metaKey) {
          const targets = resolveToggleTargets(state, nodeIdSet);
          if (targets.length === 0) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          void state.cycleTaskStatus(targets);
          return;
        }
      }

      if (
        (event.key === "Backspace" || event.key === "Delete") &&
        state.selectedIds.length > 1 &&
        state.selectedIds.every((id) => nodeIdSet.has(id))
      ) {
        event.preventDefault();
        event.stopPropagation();
        void state.deleteSelectedNodes();
        return;
      }

      if (!event.shiftKey || isEditingInTextarea) {
        return;
      }

      const arrowKeys = new Set([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ]);
      if (!arrowKeys.has(event.key)) {
        return;
      }

      const headId =
        state.focusedNodeId && nodeIdSet.has(state.focusedNodeId)
          ? state.focusedNodeId
          : (state.selectedIds.find((id) => nodeIdSet.has(id)) ??
            nodes[0]?.id ??
            null);
      if (!headId) {
        return;
      }

      const target = resolveShiftArrowTarget(nodes, headId, event.key);
      event.preventDefault();
      event.stopPropagation();
      if (!target) {
        return;
      }

      blurActiveElement();

      const anchor =
        state.selectionAnchorId && nodeIdSet.has(state.selectionAnchorId)
          ? state.selectionAnchorId
          : headId;

      state.extendBlockSelection(anchor, target.id);
      const treeRoot = document.querySelector(`[data-root-id="${rootId}"]`);
      if (treeRoot instanceof HTMLElement) {
        treeRoot.focus({ preventScroll: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [nodeIds, nodeIdSet, nodes, rootId]);
}
