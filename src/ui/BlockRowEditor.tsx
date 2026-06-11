import { memo, useEffect, useRef } from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import { getQueryPortalAttrs } from "../features/editor/serialization/queryPortalContent";
import { sliceTextForSplit } from "../features/outliner/smartSplit";
import { useOutlinerStore } from "../store/outlinerStore";
import { QueryPortalPanel } from "./QueryPortalPanel";

interface BlockRowEditorProps {
  nodeId: string;
  readOnly?: boolean;
}

const BlockRowEditorInner = memo(function BlockRowEditorInner({
  nodeId,
  readOnly = false,
}: BlockRowEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const node = useOutlinerStore.getState().getNode(nodeId);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    el.style.height = "auto";
    const newHeight = el.scrollHeight;
    el.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
    textareaRef.current?.setAttribute("importantForAutofill", "no");
  }, []);

  useEffect(() => {
    const syncFromStore = () => {
      const el = textareaRef.current;
      if (!el) {
        return;
      }

      const currentNode = useOutlinerStore.getState().getNode(nodeId);
      if (!currentNode) {
        return;
      }

      const plainText = extractPlainText(currentNode.content);
      if (document.activeElement !== el && el.value !== plainText) {
        el.value = plainText;
        adjustHeight();
      }
    };

    syncFromStore();
    return useOutlinerStore.subscribe(syncFromStore);
  }, [nodeId]);

  useEffect(() => {
    const tryFocus = () => {
      if (readOnly) {
        return;
      }
      if (useOutlinerStore.getState().focusedNodeId !== nodeId) {
        return;
      }

      const el = textareaRef.current;
      if (!el || document.activeElement === el) {
        return;
      }

      el.focus({ preventScroll: true });
      try {
        el.setSelectionRange(0, 0);
      } catch {
        // Android may throw while the IME is settling.
      }
    };

    tryFocus();
    return useOutlinerStore.subscribe((state, prevState) => {
      if (
        state.focusedNodeId === nodeId &&
        prevState.focusedNodeId !== nodeId
      ) {
        tryFocus();
      }
    });
  }, [nodeId, readOnly]);

  if (!node) {
    return null;
  }

  const doneClass =
    node.task_status === "DONE"
      ? "line-through text-gray-500"
      : node.task_status === "FAILED"
        ? "text-red-400 line-through opacity-70"
        : "text-text-normal";

  return (
    <textarea
      ref={textareaRef}
      data-testid="block-editor"
      defaultValue={extractPlainText(node.content)}
      readOnly={readOnly}
      disabled={readOnly}
      onChange={(event) => {
        useOutlinerStore.getState().updateNodeContent(nodeId, event.target.value);
        adjustHeight();
      }}
      onFocus={() => {
        const { focusedNodeId, setFocusedNode } = useOutlinerStore.getState();
        if (focusedNodeId !== nodeId) {
          setFocusedNode(nodeId);
        }
      }}
      onKeyDown={(event) => {
        if (readOnly) {
          return;
        }

        const el = event.currentTarget;

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();

          const split = sliceTextForSplit(el.value, el.selectionStart);
          const { splitBlock } = useOutlinerStore.getState();
          if (!split) {
            void splitBlock(
              nodeId,
              plainTextToBlockContent(""),
              plainTextToBlockContent(""),
            );
            return;
          }

          void splitBlock(
            nodeId,
            plainTextToBlockContent(split.leftPart),
            plainTextToBlockContent(split.rightPart),
          );
          return;
        }

        if (event.key === "Backspace" && el.value === "") {
          const { getPreviousNode, deleteNode } = useOutlinerStore.getState();
          if (!getPreviousNode(nodeId)) {
            return;
          }
          event.preventDefault();
          void deleteNode(nodeId);
        }
      }}
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      autoComplete="off"
      data-lpignore="true"
      data-form-type="other"
      rows={1}
      className={`m-0 w-full resize-none overflow-hidden break-words bg-transparent px-1 py-0 outline-none ${doneClass}`}
      style={{ minHeight: "24px" }}
    />
  );
}, (prev, next) => prev.nodeId === next.nodeId && prev.readOnly === next.readOnly);

export const BlockRowEditor = BlockRowEditorInner;

interface BlockRowEditorPortalProps {
  nodeContent: BlockContentJSON;
}

export function BlockRowEditorPortal({
  nodeContent,
}: BlockRowEditorPortalProps) {
  const portalAttrs = getQueryPortalAttrs(nodeContent);
  if (!portalAttrs) {
    return null;
  }
  return (
    <div className="relative min-h-[24px] w-full px-1 py-0.5">
      <QueryPortalPanel
        target={portalAttrs.target}
        filter={portalAttrs.filter}
      />
    </div>
  );
}
