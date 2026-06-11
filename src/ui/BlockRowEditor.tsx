import { Capacitor } from "@capacitor/core";
import { useLayoutEffect, type MouseEvent } from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import { getQueryPortalAttrs } from "../features/editor/serialization/queryPortalContent";
import { useBlockEditor } from "../hooks/useBlockEditor";
import { QueryPortalPanel } from "./QueryPortalPanel";
import { RichText } from "./components/RichText";
import {
  clearFocusHandoff,
  getFocusHandoffTarget,
  shouldSuppressEditorBlur,
} from "../store/focusHandoff";
import { useOutlinerStore } from "../store/outlinerStore";
import { useAutoResize } from "./useAutoResize";
import { useBlockTextareaKeyboard } from "./useBlockTextareaKeyboard";
import type { BlockPointerDownOptions } from "./useBlockRangeSelection";

interface BlockRowEditorProps {
  nodeId: string;
  parentId: string | null;
  nodeContent: BlockContentJSON;
  hasChildren: boolean;
  readOnly?: boolean;
  isFocused: boolean;
  taskStatus?: FlatOutlineNode["task_status"];
  onFocus: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onBlockPointerDown?: (
    nodeId: string,
    event: MouseEvent,
    options?: BlockPointerDownOptions,
  ) => boolean;
}

export function BlockRowEditor({
  nodeId,
  parentId,
  nodeContent,
  hasChildren: _hasChildren,
  readOnly = false,
  isFocused,
  taskStatus,
  onFocus,
  onToggleSelect,
  onClearSelection,
  onBlockPointerDown,
}: BlockRowEditorProps) {
  const selectedIds = useOutlinerStore((state) => state.selectedIds);
  const pruneEmptyBlock = useOutlinerStore((state) => state.pruneEmptyBlock);
  const pendingCursorRestore = useOutlinerStore(
    (state) => state.pendingCursorRestore,
  );

  const isEditing = selectedIds.length === 0 && isFocused;
  const portalAttrs = getQueryPortalAttrs(nodeContent);
  const plainText = extractPlainText(nodeContent);
  const isDone = taskStatus === "DONE";
  const isFailed = taskStatus === "FAILED";
  const isEmpty = plainText.trim().length === 0 && !portalAttrs;
  const failedTextClass = isFailed
    ? "text-red-400 line-through opacity-70"
    : "";

  const { localText, setLocalText, handleBlur, persistText } = useBlockEditor({
    nodeId,
    nodeContent,
    isFocused,
    isEditing,
  });

  const textareaRef = useAutoResize(localText);

  const keyboard = useBlockTextareaKeyboard({
    nodeId,
    localText,
    textareaRef,
    readOnly,
    persistText,
    onToggleSelect,
  });

  useLayoutEffect(() => {
    if (!isEditing) {
      return;
    }

    const handoffTarget = getFocusHandoffTarget();
    if (handoffTarget && handoffTarget !== nodeId) {
      return;
    }

    const applyFocus = () => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      if (document.activeElement === textarea) {
        if (handoffTarget === nodeId) {
          clearFocusHandoff();
        }
        return;
      }

      textarea.focus();

      const restore = useOutlinerStore.getState().pendingCursorRestore;
      if (restore?.nodeId === nodeId) {
        const pos = Math.min(
          Math.max(restore.pos, 0),
          textarea.value.length,
        );
        textarea.setSelectionRange(pos, pos);
        useOutlinerStore.getState().setPendingCursorRestore(null);
      } else {
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }

      if (handoffTarget === nodeId) {
        clearFocusHandoff();
      }
    };

    if (Capacitor.isNativePlatform()) {
      requestAnimationFrame(() => requestAnimationFrame(applyFocus));
      return;
    }

    applyFocus();
  }, [isEditing, nodeId, parentId, pendingCursorRestore?.nodeId, textareaRef]);

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        data-testid="block-editor"
        readOnly={readOnly}
        value={localText}
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => setLocalText(event.target.value)}
        onBlur={() => {
          if (shouldSuppressEditorBlur()) {
            return;
          }
          handleBlur();
          void pruneEmptyBlock(nodeId, plainTextToBlockContent(localText));
        }}
        onFocus={() => onFocus(nodeId)}
        onKeyDown={keyboard.handleKeyDown}
        onMouseDown={(event) => {
          if (keyboard.handleModifierMouseDown(event)) {
            return;
          }
          if (
            onBlockPointerDown?.(nodeId, event, {
              allowTextCaret: true,
              onBeginBlockDrag: () => textareaRef.current?.blur(),
            })
          ) {
            event.stopPropagation();
          }
        }}
        rows={1}
        className={`m-0 min-h-[28px] w-full resize-none overflow-hidden bg-transparent px-1 py-0.5 text-[15px] leading-7 text-text-emphasis outline-none ${failedTextClass}`}
      />
    );
  }

  return (
    <div
      data-testid="block-editor"
      role="textbox"
      tabIndex={-1}
      onFocus={() => onFocus(nodeId)}
      onMouseDown={(event) => {
        if (keyboard.handleModifierMouseDown(event)) {
          return;
        }
        if (onBlockPointerDown?.(nodeId, event)) {
          event.stopPropagation();
          return;
        }
        onClearSelection();
        onFocus(nodeId);
      }}
      className={`m-0 min-h-[24px] w-full cursor-text select-none bg-transparent px-1 py-0.5 text-[15px] leading-7 text-text-emphasis outline-none ${failedTextClass}`}
    >
      {portalAttrs ? (
        <QueryPortalPanel
          target={portalAttrs.target}
          filter={portalAttrs.filter}
        />
      ) : isEmpty ? (
        <span className="italic text-text-muted">Empty block</span>
      ) : (
        <RichText content={plainText} isDone={isDone} isFailed={isFailed} />
      )}
    </div>
  );
}
