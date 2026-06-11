import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import { flushSync } from "react-dom";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import { sliceTextForSplit } from "../features/outliner/smartSplit";
import { useOutlinerStore } from "../store/outlinerStore";

interface UseBlockTextareaKeyboardOptions {
  nodeId: string;
  localText: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  readOnly?: boolean;
  persistText: (text: string, options?: { syncStore?: boolean }) => void;
  onToggleSelect: (id: string) => void;
}

export function useBlockTextareaKeyboard({
  nodeId,
  localText,
  textareaRef,
  readOnly = false,
  persistText,
  onToggleSelect,
}: UseBlockTextareaKeyboardOptions) {
  const splitBlock = useOutlinerStore((state) => state.splitBlock);
  const mergeBlockWithPrevious = useOutlinerStore(
    (state) => state.mergeBlockWithPrevious,
  );
  const indent = useOutlinerStore((state) => state.indent);
  const outdent = useOutlinerStore((state) => state.outdent);
  const cycleTaskStatus = useOutlinerStore((state) => state.cycleTaskStatus);
  const deleteSelectedNodes = useOutlinerStore((state) => state.deleteSelectedNodes);
  const selectedIds = useOutlinerStore((state) => state.selectedIds);
  const focusPreviousNode = useOutlinerStore((state) => state.focusPreviousNode);
  const focusNextNode = useOutlinerStore((state) => state.focusNextNode);
  const getPreviousNode = useOutlinerStore((state) => state.getPreviousNode);
  const getNextNode = useOutlinerStore((state) => state.getNextNode);
  const extendBlockSelection = useOutlinerStore((state) => state.extendBlockSelection);
  const toggleCollapse = useOutlinerStore((state) => state.toggleCollapse);
  const hasChildren = useOutlinerStore((state) =>
    Object.values(state.nodesByRootId).some((nodes) =>
      nodes.some((node) => node.id === nodeId && node.hasChildren),
    ),
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) {
      return;
    }

    const textarea = textareaRef.current ?? event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      selectedIds.length > 1
    ) {
      event.preventDefault();
      void deleteSelectedNodes();
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      if (event.key === "Enter") {
        event.preventDefault();
        persistText(localText);
        void cycleTaskStatus(nodeId);
        return;
      }
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();

      const split = sliceTextForSplit(localText, start);
      if (!split) {
        flushSync(() => {
          void splitBlock(
            nodeId,
            plainTextToBlockContent(""),
            plainTextToBlockContent(""),
          );
        });
        return;
      }

      const left = plainTextToBlockContent(split.leftPart);
      const right = plainTextToBlockContent(split.rightPart);
      flushSync(() => {
        persistText(split.leftPart, { syncStore: true });
        void splitBlock(nodeId, left, right);
      });
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      persistText(localText);
      if (event.shiftKey) {
        void outdent(nodeId);
      } else {
        void indent(nodeId);
      }
      return;
    }

    if (event.key === "Backspace" && start === 0 && end === 0) {
      event.preventDefault();
      textarea.blur();
      persistText(localText);
      void mergeBlockWithPrevious(
        nodeId,
        plainTextToBlockContent(localText),
      );
      return;
    }

    if (event.key === "ArrowLeft" && !event.shiftKey && start === 0) {
      event.preventDefault();
      textarea.blur();
      void focusPreviousNode(nodeId);
      return;
    }

    if (event.key === "ArrowRight" && !event.shiftKey && end === localText.length) {
      event.preventDefault();
      textarea.blur();
      void focusNextNode(nodeId);
      return;
    }

    if (event.shiftKey) {
      if (event.key === "ArrowLeft" && start === 0) {
        const previous = getPreviousNode(nodeId);
        if (previous) {
          event.preventDefault();
          textarea.blur();
          extendBlockSelection(nodeId, previous.id);
        }
        return;
      }

      if (event.key === "ArrowRight" && end === localText.length) {
        const next = getNextNode(nodeId);
        if (next) {
          event.preventDefault();
          textarea.blur();
          extendBlockSelection(nodeId, next.id);
        }
        return;
      }

      if (event.key === "ArrowUp" && start === 0) {
        const previous = getPreviousNode(nodeId);
        if (previous) {
          event.preventDefault();
          textarea.blur();
          extendBlockSelection(nodeId, previous.id);
        }
        return;
      }

      if (event.key === "ArrowDown" && end === localText.length) {
        const next = getNextNode(nodeId);
        if (next) {
          event.preventDefault();
          textarea.blur();
          extendBlockSelection(nodeId, next.id);
        }
      }
      return;
    }

    if (event.altKey && event.key === "ArrowRight" && hasChildren) {
      event.preventDefault();
      void toggleCollapse(nodeId);
    }
  };

  const handleModifierMouseDown = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      onToggleSelect(nodeId);
      return true;
    }
    return false;
  };

  return {
    handleKeyDown,
    handleModifierMouseDown,
  };
}
