import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { useOutlinerStore } from "../store/outlinerStore";
import { isWikiLinkTarget } from "../features/outliner/findWikiLink";
import { getQueryPortalAttrs } from "../features/editor/serialization/queryPortalContent";
import { BlockRowEditor, BlockRowEditorPortal } from "./BlockRowEditor";
import { OutlinerGuides } from "./OutlinerGuides";
import { OutlinerRowLeading } from "./OutlinerRowLeading";

interface OutlinerRowProps {
  node: FlatOutlineNode;
  readOnly?: boolean;
  isFocused: boolean;
  isSelected: boolean;
  projectedDepth?: number;
  onFocus: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onAddSibling: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onToggleTaskCompletion: (id: string) => void;
}

function outlinerRowPropsAreEqual(
  prev: OutlinerRowProps,
  next: OutlinerRowProps,
): boolean {
  return (
    prev.node.content === next.node.content &&
    prev.isFocused === next.isFocused &&
    prev.isSelected === next.isSelected &&
    prev.node.collapsed === next.node.collapsed &&
    prev.node.task_status === next.node.task_status &&
    prev.node.hasChildren === next.node.hasChildren &&
    prev.node.depth === next.node.depth &&
    prev.projectedDepth === next.projectedDepth &&
    prev.readOnly === next.readOnly
  );
}

export const OutlinerRow = memo(function OutlinerRow(props: OutlinerRowProps) {
  if (props.readOnly) {
    return <StaticOutlinerRow {...props} />;
  }
  return <SortableOutlinerRow {...props} />;
}, outlinerRowPropsAreEqual);

function StaticOutlinerRow(props: OutlinerRowProps) {
  return (
    <OutlinerRowShell
      {...props}
      setNodeRef={undefined}
      rowStyle={undefined}
      isDragging={false}
      dragAttributes={undefined}
      dragListeners={undefined}
    />
  );
}

function SortableOutlinerRow(props: OutlinerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.node.id });

  return (
    <OutlinerRowShell
      {...props}
      setNodeRef={setNodeRef}
      rowStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragAttributes={attributes}
      dragListeners={listeners}
    />
  );
}

function OutlinerRowShell({
  node,
  readOnly = false,
  isFocused,
  isSelected,
  projectedDepth,
  onFocus,
  onToggleSelect,
  onClearSelection,
  onToggleCollapse,
  onToggleTaskCompletion,
  setNodeRef,
  rowStyle,
  isDragging,
  dragAttributes,
  dragListeners,
}: OutlinerRowProps & {
  setNodeRef?: (element: HTMLElement | null) => void;
  rowStyle?: CSSProperties;
  isDragging: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}) {
  const openMoveTarget = useOutlinerStore((state) => state.openMoveTarget);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [contextMenu]);

  const handleContextMenu = (event: MouseEvent) => {
    if (readOnly) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const handleSelectPointer = (event: MouseEvent) => {
    if (isWikiLinkTarget(event.target)) {
      return;
    }
    if ((event.target as HTMLElement).closest("[data-task-checkbox]")) {
      return;
    }
    if ((event.target as HTMLElement).closest("textarea")) {
      return;
    }
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      onToggleSelect(node.id);
      return;
    }
    onClearSelection();
    onFocus(node.id);
    const textarea = (event.currentTarget as HTMLElement).querySelector("textarea");
    textarea?.focus({ preventScroll: true });
  };

  const displayDepth =
    isDragging && projectedDepth !== undefined
      ? projectedDepth
      : node.depth;

  return (
    <>
    <div
      ref={setNodeRef}
      data-testid="outliner-row"
      data-block-id={node.id}
      data-depth={displayDepth}
      data-parent-id={node.parent_id ?? ""}
      style={rowStyle}
      className={`group flex w-full items-start py-outliner-row-y ${
        isSelected ? "rounded-md bg-interactive-selected" : ""
      } ${isDragging ? "z-10 opacity-90 shadow-sm" : ""}`}
      onMouseDown={handleSelectPointer}
      onContextMenu={handleContextMenu}
    >
      <OutlinerGuides depth={displayDepth} />
      <OutlinerRowLeading
        node={node}
        readOnly={readOnly}
        isFocused={isFocused}
        isDragging={isDragging}
        dragAttributes={dragAttributes}
        dragListeners={dragListeners}
        onToggleCollapse={onToggleCollapse}
        onToggleTaskCompletion={onToggleTaskCompletion}
      />
      <div
        className="min-w-0 flex-1"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {getQueryPortalAttrs(node.content) ? (
          <BlockRowEditorPortal nodeContent={node.content} />
        ) : (
          <BlockRowEditor nodeId={node.id} readOnly={readOnly} />
        )}
      </div>
    </div>
    {contextMenu ? (
      <div
        className="fixed z-[120] min-w-[180px] overflow-hidden rounded-lg border border-border bg-surface-modal py-1 shadow-xl"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        role="menu"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          role="menuitem"
          className="w-full px-3 py-2 text-left text-sm text-text-normal hover:bg-interactive-hover"
          onClick={() => {
            setContextMenu(null);
            openMoveTarget(node.id);
          }}
        >
          Move to…
          <span className="ml-2 text-xs text-text-muted">⌘⇧M</span>
        </button>
      </div>
    ) : null}
    </>
  );
}
