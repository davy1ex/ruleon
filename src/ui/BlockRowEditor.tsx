import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import { getQueryPortalAttrs } from "../features/editor/serialization/queryPortalContent";
import { useBlockEditor } from "../hooks/useBlockEditor";
import { QueryPortalPanel } from "./QueryPortalPanel";
import { RichText } from "./components/RichText";
import { shouldSuppressEditorBlur } from "../store/focusHandoff";
import { useOutlinerStore } from "../store/outlinerStore";
import { useAutoResize, type BlockTextareaElement } from "./useAutoResize";
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
  parentId: _parentId,
  nodeContent,
  hasChildren: _hasChildren,
  readOnly = false,
  isFocused,
  taskStatus,
  onFocus: _onFocus,
  onToggleSelect,
  onClearSelection,
  onBlockPointerDown,
}: BlockRowEditorProps) {
  const selectedIds = useOutlinerStore((state) => state.selectedIds);
  const pruneEmptyBlock = useOutlinerStore((state) => state.pruneEmptyBlock);
  const setFocus = useOutlinerStore((state) => state.setFocus);

  const isEditing = selectedIds.length === 0 && isFocused;
  const portalAttrs = getQueryPortalAttrs(nodeContent);
  const plainText = extractPlainText(nodeContent);
  const isDone = taskStatus === "DONE";
  const isFailed = taskStatus === "FAILED";
  const isEmpty = plainText.trim().length === 0 && !portalAttrs;
  const failedTextClass = isFailed
    ? "text-red-400 line-through opacity-70"
    : "";

  const textareaRef = useRef<BlockTextareaElement>(null);

  const { localText, setLocalText, handleBlur, persistText } = useBlockEditor({
    nodeId,
    nodeContent,
    isFocused,
    isEditing,
    textareaRef,
  });

  useAutoResize(localText, textareaRef);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current?.isComposing) {
      return;
    }
    setLocalText(event.target.value);
  };

  const keyboard = useBlockTextareaKeyboard({
    nodeId,
    localText,
    textareaRef,
    readOnly,
    persistText,
    onToggleSelect,
  });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.setAttribute("importantForAutofill", "no");

    if (isFocused && isEditing) {
      if (document.activeElement !== textarea) {
        textarea.focus({ preventScroll: true });
        try {
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        } catch {
          // Safari/Android may throw when the element is not yet visible.
        }
      }
      textarea.setAttribute("importantForAccessibility", "auto");
      return;
    }

    textarea.setAttribute("importantForAccessibility", "no-hide-descendants");
    if (document.activeElement === textarea) {
      textarea.blur();
    }
  }, [isFocused]);

  const handleReadOnlyClick = (event: MouseEvent<HTMLDivElement>) => {
    if (keyboard.handleModifierMouseDown(event)) {
      return;
    }
    if (event.shiftKey) {
      if (onBlockPointerDown?.(nodeId, event)) {
        event.stopPropagation();
      }
      return;
    }
    event.stopPropagation();
    onClearSelection();
    setFocus(nodeId);
  };

  const handleTextareaBlur = () => {
    if (shouldSuppressEditorBlur()) {
      return;
    }
    handleBlur();
    void pruneEmptyBlock(nodeId, plainTextToBlockContent(localText));
  };

  return (
    <div className="relative w-full">
      <div
        data-testid={isEditing ? undefined : "block-editor"}
        role="textbox"
        tabIndex={-1}
        onClick={handleReadOnlyClick}
        className={`m-0 min-h-[24px] w-full cursor-text select-none bg-transparent px-1 py-0.5 text-[15px] leading-7 text-text-emphasis outline-none ${failedTextClass} ${isEditing ? "hidden" : "block"}`}
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

      <textarea
        ref={textareaRef}
        id={`block-editor-${nodeId}`}
        name={`block-${nodeId}`}
        data-testid={isEditing ? "block-editor" : undefined}
        readOnly={readOnly}
        value={localText}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        onChange={handleChange}
        onCompositionStart={() => {
          if (textareaRef.current) {
            textareaRef.current.isComposing = true;
          }
        }}
        onCompositionEnd={(event) => {
          if (textareaRef.current) {
            textareaRef.current.isComposing = false;
          }
          setLocalText(event.currentTarget.value);
        }}
        onBlur={handleTextareaBlur}
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
        className={`m-0 min-h-[28px] w-full resize-none overflow-hidden bg-transparent px-1 py-0.5 text-[15px] leading-7 text-text-emphasis outline-none ${failedTextClass} ${isEditing ? "block" : "hidden"}`}
      />
    </div>
  );
}
