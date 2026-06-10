import type { MouseEvent } from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import { getQueryPortalAttrs } from "../features/editor/serialization/queryPortalContent";
import { renderInactiveDoc } from "../features/editor/render/renderInactiveDoc";
import { QueryPortalPanel } from "./QueryPortalPanel";
import { useOutlinerStore } from "../store/outlinerStore";
import { BlockEditorContent } from "./BlockEditorContent";
import { useBlockRowEditor } from "./useBlockRowEditor";
import type { BlockPointerDownOptions } from "./useBlockRangeSelection";

interface BlockRowEditorProps {
  nodeId: string;
  nodeContent: BlockContentJSON;
  hasChildren: boolean;
  readOnly?: boolean;
  isFocused: boolean;
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
  nodeContent,
  hasChildren,
  readOnly = false,
  isFocused,
  onFocus,
  onToggleSelect,
  onClearSelection,
  onBlockPointerDown,
}: BlockRowEditorProps) {
  const selectedIds = useOutlinerStore((state) => state.selectedIds);
  const editorState = useBlockRowEditor({
    nodeId,
    nodeContent,
    hasChildren,
    readOnly,
    isFocused,
    onToggleSelect,
  });

  const isEditing =
    selectedIds.length === 0 && (editorState.inputFocused || isFocused);
  const portalAttrs = getQueryPortalAttrs(nodeContent);

  const beginBlockDrag = () => {
    editorState.setInputFocused(false);
    editorState.editor?.commands.blur();
  };

  if (isEditing && editorState.editor) {
    return (
      <div
        data-testid="block-editor"
        role="textbox"
        tabIndex={-1}
        onBlur={editorState.handleBlur}
        onFocus={() => {
          onFocus(nodeId);
          editorState.setInputFocused(true);
        }}
        onMouseDown={(event) => {
          if (
            onBlockPointerDown?.(nodeId, event, {
              allowTextCaret: true,
              onBeginBlockDrag: beginBlockDrag,
            })
          ) {
            event.stopPropagation();
            return;
          }
          editorState.handleContainerMouseDown(event);
        }}
        onKeyDown={editorState.handleEditorKeyDown}
        className="min-h-[28px] w-full bg-transparent px-0 py-0 outline-none"
      >
        <BlockEditorContent editor={editorState.editor} />
      </div>
    );
  }

  return (
    <div
      data-testid="block-editor"
      role="textbox"
      tabIndex={0}
      onFocus={() => {
        editorState.setInputFocused(true);
        onFocus(nodeId);
      }}
      onMouseDown={(event) => {
        if (editorState.handleModifierMouseDown(event)) {
          return;
        }
        if (onBlockPointerDown?.(nodeId, event)) {
          event.stopPropagation();
          return;
        }
        onClearSelection();
        onFocus(nodeId);
        editorState.setInputFocused(true);
      }}
      className="m-0 min-h-[28px] w-full select-none whitespace-pre-wrap break-words bg-transparent px-0 py-0 text-[15px] leading-7 text-text-emphasis outline-none"
    >
      {portalAttrs ? (
        <QueryPortalPanel
          target={portalAttrs.target}
          filter={portalAttrs.filter}
        />
      ) : (
        renderInactiveDoc(nodeContent, {
          onNavigateWikiLink: (pageName) => {
            void editorState.navigateToPage(pageName);
          },
        })
      )}
    </div>
  );
}
