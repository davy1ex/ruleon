import type { StoreApi } from "zustand";
import { schedulePersist, syncNavigationFromLeaf } from "./workspaceHelpers";
import type { WorkspaceStore } from "./workspaceTypes";

type WorkspaceSet = StoreApi<WorkspaceStore>["setState"];
type WorkspaceGet = StoreApi<WorkspaceStore>["getState"];

function applyCloseLeaves(
  get: WorkspaceGet,
  set: WorkspaceSet,
  idsToClose: string[],
  preferredActiveId?: string,
): void {
  if (idsToClose.length === 0) {
    return;
  }

  const { leaves, leafOrder, activeLeafId } = get();
  const closeSet = new Set(idsToClose);
  const newOrder = leafOrder.filter((id) => !closeSet.has(id));

  if (newOrder.length === 0 || newOrder.length === leafOrder.length) {
    return;
  }

  const remainingLeaves = Object.fromEntries(
    Object.entries(leaves).filter(([id]) => !closeSet.has(id)),
  );

  let newActiveId = activeLeafId;
  if (preferredActiveId && newOrder.includes(preferredActiveId)) {
    newActiveId = preferredActiveId;
  } else if (!newActiveId || closeSet.has(newActiveId)) {
    const closedIndex = activeLeafId ? leafOrder.indexOf(activeLeafId) : 0;
    const fallbackIndex = Math.min(
      Math.max(closedIndex, 0),
      newOrder.length - 1,
    );
    newActiveId = newOrder[fallbackIndex] ?? newOrder[0];
  }

  set({
    leaves: remainingLeaves,
    leafOrder: newOrder,
    activeLeafId: newActiveId,
  });

  if (newActiveId) {
    const activeLeaf = remainingLeaves[newActiveId];
    if (activeLeaf) {
      syncNavigationFromLeaf(activeLeaf);
    }
  }

  schedulePersist(get);
}

function closableLeafIds(
  leafOrder: string[],
  leaves: WorkspaceStore["leaves"],
  leafId: string,
  side: "other" | "left" | "right",
): string[] {
  const index = leafOrder.indexOf(leafId);
  if (index === -1) {
    return [];
  }

  return leafOrder.filter((id, i) => {
    if (id === leafId || leaves[id]?.pinned) {
      return false;
    }
    if (side === "other") {
      return true;
    }
    if (side === "left") {
      return i < index;
    }
    return i > index;
  });
}

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

    closeOtherLeaves: (id: string) => {
      const { leafOrder, leaves } = get();
      applyCloseLeaves(
        get,
        set,
        closableLeafIds(leafOrder, leaves, id, "other"),
        id,
      );
    },

    closeLeavesToLeft: (id: string) => {
      const { leafOrder, leaves } = get();
      applyCloseLeaves(
        get,
        set,
        closableLeafIds(leafOrder, leaves, id, "left"),
      );
    },

    closeLeavesToRight: (id: string) => {
      const { leafOrder, leaves } = get();
      applyCloseLeaves(
        get,
        set,
        closableLeafIds(leafOrder, leaves, id, "right"),
      );
    },
  };
}
