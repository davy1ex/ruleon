import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRef } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import {
  computeDragProjection,
  type DragProjection,
} from "../features/outliner/dragProjection";
import { useOutlinerStore } from "../store/outlinerStore";
import { DropIndicator } from "./DropIndicator";
import { OutlinerRow } from "./OutlinerRow";
import { useBlockTreeKeyboard } from "./useBlockTreeKeyboard";

export interface BlockTreeHandlers {
  focusedNodeId: string | null;
  selectedIds: string[];
  onFocus: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
  onAddSibling: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onToggleTaskCompletion: (id: string) => void;
}

interface BlockTreeProps extends BlockTreeHandlers {
  rootId: string;
  nodes: FlatOutlineNode[];
  readOnly?: boolean;
  dragProjection?: DragProjection | null;
}

function BlockTreeRows({
  rootId,
  nodes,
  readOnly = false,
  focusedNodeId,
  selectedIds,
  dragProjection = null,
  ...handlers
}: BlockTreeProps) {
  useBlockTreeKeyboard(nodes, rootId);

  return (
    <div
      data-testid="block-tree"
      data-root-id={rootId}
      tabIndex={-1}
      className="outline-none"
    >
      {nodes.map((node) => (
        <div key={node.id}>
          <OutlinerRow
            node={node}
            readOnly={readOnly}
            isFocused={node.id === focusedNodeId}
            isSelected={selectedIds.includes(node.id)}
            projectedDepth={
              dragProjection?.activeId === node.id
                ? dragProjection.depth
                : undefined
            }
            {...handlers}
          />
          {!readOnly ? (
            <div
              className="h-2 cursor-text"
              data-testid="block-after-gap"
              onMouseDown={(event) => {
                if (event.button !== 0) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                handlers.onClearSelection();
                handlers.onFocus(node.id);
                void handlers.onAddSibling(node.id);
              }}
            />
          ) : null}
        </div>
      ))}
      {!readOnly && nodes.length > 0 ? (
        <div
          className="min-h-16 cursor-text"
          data-testid="block-tree-tail"
          onMouseDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            const lastNode = nodes[nodes.length - 1];
            if (!lastNode) {
              return;
            }
            handlers.onClearSelection();
            handlers.onFocus(lastNode.id);
            void handlers.onAddSibling(lastNode.id);
          }}
        />
      ) : null}
    </div>
  );
}

export function BlockTree(props: BlockTreeProps) {
  const { readOnly = false, nodes, rootId } = props;
  const moveBlock = useOutlinerStore((state) => state.moveBlock);
  const dragProjection = useOutlinerStore((state) => state.dragProjection);
  const setDragProjection = useOutlinerStore((state) => state.setDragProjection);
  const clearDragState = useOutlinerStore((state) => state.clearDragState);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  if (readOnly) {
    return <BlockTreeRows {...props} />;
  }

  const updateProjection = (
    activeId: string,
    overId: string | undefined,
    dragOffsetX: number,
  ) => {
    if (!overId) {
      setDragProjection(null);
      return;
    }

    const projection = computeDragProjection(
      nodes,
      activeId,
      overId,
      dragOffsetX,
    );
    setDragProjection(projection);
  };

  const handleDragStart = () => {
    dragOffsetRef.current = { x: 0, y: 0 };
  };

  const handleDragMove = (event: DragMoveEvent) => {
    dragOffsetRef.current.x += event.delta.x;
    dragOffsetRef.current.y += event.delta.y;
    updateProjection(
      String(event.active.id),
      event.over ? String(event.over.id) : undefined,
      dragOffsetRef.current.x,
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    updateProjection(
      String(event.active.id),
      event.over ? String(event.over.id) : undefined,
      dragOffsetRef.current.x,
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const finalProjection = useOutlinerStore.getState().dragProjection;

    clearDragState();
    dragOffsetRef.current = { x: 0, y: 0 };

    if (!over || active.id === over.id || !finalProjection) {
      return;
    }

    void moveBlock(
      String(active.id),
      finalProjection.parentId,
      finalProjection.prevSiblingOrder,
      finalProjection.nextSiblingOrder,
    );
  };

  const handleDragCancel = () => {
    clearDragState();
    dragOffsetRef.current = { x: 0, y: 0 };
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={nodes.map((node) => node.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="relative"
          data-drop-container={rootId}
        >
          <BlockTreeRows {...props} dragProjection={dragProjection} />
          <DropIndicator projection={dragProjection} containerId={rootId} />
        </div>
      </SortableContext>
    </DndContext>
  );
}
