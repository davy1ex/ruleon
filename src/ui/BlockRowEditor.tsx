import { memo, useEffect, useRef } from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import { getQueryPortalAttrs } from "../features/editor/serialization/queryPortalContent";
import { sliceTextForSplit } from "../features/outliner/smartSplit";
import type { TaskStatus } from "../domain/outliner/types";
import { useOutlinerStore } from "../store/outlinerStore";
import { QueryPortalPanel } from "./QueryPortalPanel";

const TEXTAREA_BASE_CLASS =
  "editor-text m-0 min-h-editor-row w-full resize-none overflow-hidden break-words bg-transparent px-1 py-0 font-ui text-editor outline-none";

const USE_MANUAL_TEXTAREA_HEIGHT =
  typeof CSS !== "undefined" && !CSS.supports("field-sizing", "content");

function taskStatusTextClass(taskStatus: TaskStatus | null): string {
  if (taskStatus === "DONE") {
    return "line-through text-gray-500";
  }
  if (taskStatus === "FAILED") {
    return "text-red-400 line-through opacity-70";
  }
  return "text-text-normal";
}

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
    if (!USE_MANUAL_TEXTAREA_HEIGHT) {
      return;
    }

    const el = textareaRef.current;
    if (!el) {
      return;
    }

    el.style.height = "auto";
    const nextHeight = el.scrollHeight;
    if (nextHeight > 0) {
      el.style.height = `${nextHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
    textareaRef.current?.setAttribute("importantForAutofill", "no");
  }, [nodeId]);

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

      const nextClass = `${TEXTAREA_BASE_CLASS} ${taskStatusTextClass(currentNode.task_status)}`;
      if (el.className !== nextClass) {
        el.className = nextClass;
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

  const doneClass = taskStatusTextClass(node.task_status);

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

        if (event.key === "Tab") {
          event.preventDefault();
          const { indent, outdent } = useOutlinerStore.getState();
          if (event.shiftKey) {
            void outdent(nodeId);
          } else {
            void indent(nodeId);
          }
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
      className={`${TEXTAREA_BASE_CLASS} ${doneClass}`}
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
