import type { StoreApi } from "zustand";
import { schedulePersist } from "./workspaceHelpers";
import type { WorkspaceStore } from "./workspaceTypes";

type WorkspaceSet = StoreApi<WorkspaceStore>["setState"];
type WorkspaceGet = StoreApi<WorkspaceStore>["getState"];

export function createLeafTabActions(get: WorkspaceGet, set: WorkspaceSet) {
  return {
    reorderLeaves: (fromIndex: number, toIndex: number) => {
      const { leafOrder, leaves } = get();
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= leafOrder.length ||
        toIndex >= leafOrder.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const movedId = leafOrder[fromIndex];
      const movedLeaf = leaves[movedId];
      if (!movedLeaf) {
        return;
      }

      const pinnedCount = leafOrder.filter(
        (id) => leaves[id]?.pinned,
      ).length;

      let clampedTo = toIndex;
      if (movedLeaf.pinned) {
        clampedTo = Math.min(clampedTo, Math.max(0, pinnedCount - 1));
      } else {
        clampedTo = Math.max(clampedTo, pinnedCount);
      }

      const order = [...leafOrder];
      const [moved] = order.splice(fromIndex, 1);
      order.splice(clampedTo, 0, moved);
      set({ leafOrder: order });
      schedulePersist(get);
    },

    toggleLeafPin: (id: string) => {
      const { leaves, leafOrder } = get();
      const leaf = leaves[id];
      if (!leaf) {
        return;
      }

      const nextPinned = !leaf.pinned;
      let nextOrder = leafOrder;

      if (nextPinned) {
        nextOrder = leafOrder.filter((leafId) => leafId !== id);
        nextOrder.unshift(id);
      }

      set({
        leaves: {
          ...leaves,
          [id]: { ...leaf, pinned: nextPinned },
        },
        leafOrder: nextOrder,
      });
      schedulePersist(get);
    },
  };
}
