import type { Editor } from "@tiptap/react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from "react";
import { useOutlinerStore } from "../store/outlinerStore";

interface UseBlockEditorNavigationOptions {
  nodeId: string;
  editor: Editor | null;
  hasChildren: boolean;
  readOnly: boolean;
  onToggleSelect: (id: string) => void;
  setInputFocused: (value: boolean) => void;
}

export function useBlockEditorNavigation({
  nodeId,
  editor,
  hasChildren,
  readOnly,
  onToggleSelect,
  setInputFocused,
}: UseBlockEditorNavigationOptions) {
  const deleteSelectedNodes = useOutlinerStore(
    (state) => state.deleteSelectedNodes,
  );
  const selectedIds = useOutlinerStore((state) => state.selectedIds);
  const focusPreviousNode = useOutlinerStore((state) => state.focusPreviousNode);
  const focusNextNode = useOutlinerStore((state) => state.focusNextNode);
  const getPreviousNode = useOutlinerStore((state) => state.getPreviousNode);
  const getNextNode = useOutlinerStore((state) => state.getNextNode);
  const extendBlockSelection = useOutlinerStore(
    (state) => state.extendBlockSelection,
  );
  const toggleCollapse = useOutlinerStore((state) => state.toggleCollapse);

  const handleModifierMouseDown = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      onToggleSelect(nodeId);
      return true;
    }
    return false;
  };

  const handleEditorKeyDown = (event: ReactKeyboardEvent) => {
    if (readOnly || !editor) {
      return;
    }

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      selectedIds.length > 1
    ) {
      event.preventDefault();
      void deleteSelectedNodes();
      return;
    }

    const { from, to, empty } = editor.state.selection;
    const text = editor.state.doc.textContent;
    const isOnFirstLine = from <= 1;
    const isOnLastLine = to >= editor.state.doc.content.size - 1;

    const extendSelectionToBlock = (targetId: string) => {
      event.preventDefault();
      setInputFocused(false);
      editor.commands.blur();
      extendBlockSelection(nodeId, targetId);
      const treeRoot = editor.view.dom.closest("[data-root-id]");
      if (treeRoot instanceof HTMLElement) {
        treeRoot.focus({ preventScroll: true });
      }
    };

    if (event.shiftKey) {
      if (event.key === "ArrowLeft" && from === 1) {
        const previous = getPreviousNode(nodeId);
        if (previous) {
          extendSelectionToBlock(previous.id);
        }
        return;
      }

      if (event.key === "ArrowRight" && to >= text.length + 1) {
        const next = getNextNode(nodeId);
        if (next) {
          extendSelectionToBlock(next.id);
        }
        return;
      }

      if (event.key === "ArrowUp" && isOnFirstLine && from === 1) {
        const previous = getPreviousNode(nodeId);
        if (previous) {
          extendSelectionToBlock(previous.id);
        }
        return;
      }

      if (event.key === "ArrowDown" && isOnLastLine && empty) {
        const next = getNextNode(nodeId);
        if (next) {
          extendSelectionToBlock(next.id);
        }
      }
      return;
    }

    if (event.key === "ArrowUp" && empty && isOnFirstLine && from === 1) {
      event.preventDefault();
      focusPreviousNode(nodeId);
      return;
    }

    if (event.key === "ArrowDown" && empty && isOnLastLine) {
      event.preventDefault();
      focusNextNode(nodeId);
      return;
    }

    if (
      event.key === "ArrowLeft" &&
      text.length === 0 &&
      hasChildren &&
      empty &&
      from === 1
    ) {
      event.preventDefault();
      void toggleCollapse(nodeId);
    }
  };

  return {
    handleModifierMouseDown,
    handleEditorKeyDown,
  };
}
