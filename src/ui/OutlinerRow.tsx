import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, type CSSProperties, type MouseEvent } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { isWikiLinkTarget } from "../features/outliner/findWikiLink";
import { BlockRowEditor } from "./BlockRowEditor";
import { OutlinerGuides } from "./OutlinerGuides";
import { OutlinerRowLeading } from "./OutlinerRowLeading";
import type { BlockPointerDownOptions } from "./useBlockRangeSelection";

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
  onToggleTaskStatus: (id: string) => void;
  onBlockPointerDown?: (
    nodeId: string,
    event: MouseEvent,
    options?: BlockPointerDownOptions,
  ) => boolean;
  onBlockPointerEnter?: (nodeId: string, event: MouseEvent) => void;
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
  onToggleTaskStatus,
  onBlockPointerDown,
  onBlockPointerEnter,
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
    if (onBlockPointerDown?.(node.id, event)) {
      return;
    }
    onClearSelection();
    onFocus(node.id);
  };

  const displayDepth =
    isDragging && projectedDepth !== undefined
      ? projectedDepth
      : node.depth;

  return (
    <div
      ref={setNodeRef}
      data-testid="outliner-row"
      data-block-id={node.id}
      data-depth={displayDepth}
      data-parent-id={node.parent_id ?? ""}
      style={rowStyle}
      className={`group flex w-full items-start py-1 ${
        isSelected ? "rounded-md bg-interactive-selected" : ""
      } ${isDragging ? "z-10 opacity-90 shadow-sm" : ""}`}
      onMouseDown={handleSelectPointer}
      onMouseEnter={(event) => onBlockPointerEnter?.(node.id, event)}
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
        onToggleTaskStatus={onToggleTaskStatus}
      />
      <div
        className={`min-w-0 flex-1 pt-px ${
          node.task_status === "DONE"
            ? "text-text-muted line-through decoration-text-muted"
            : ""
        }`}
      >
        <BlockRowEditor
          nodeId={node.id}
          nodeContent={node.content}
          hasChildren={node.hasChildren}
          readOnly={readOnly}
          isFocused={isFocused}
          onFocus={onFocus}
          onToggleSelect={onToggleSelect}
          onClearSelection={onClearSelection}
          onBlockPointerDown={onBlockPointerDown}
        />
      </div>
    </div>
  );
}
