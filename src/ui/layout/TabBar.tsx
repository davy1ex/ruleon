import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { TabItem } from "./TabItem";

export function TabBar() {
  const leafOrder = useWorkspaceStore((s) => s.leafOrder);
  const leaves = useWorkspaceStore((s) => s.leaves);
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const order = useWorkspaceStore.getState().leafOrder;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    useWorkspaceStore.getState().reorderLeaves(oldIndex, newIndex);
  };

  const canClose = leafOrder.length > 1;

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={leafOrder}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex h-tab-bar shrink-0 items-stretch overflow-x-auto border-b border-border bg-surface-tab-bar">
          {leafOrder.map((id) => {
            const leaf = leaves[id];
            if (!leaf) {
              return null;
            }

            return (
              <TabItem
                key={id}
                leaf={leaf}
                isActive={id === activeLeafId}
                canClose={canClose}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
