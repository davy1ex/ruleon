import type { StoreApi } from "zustand";
import {
  applyLayoutCss,
  clampRightSidebarWidth,
  clampSidebarWidth,
  defaultLayout,
  findLeafByType,
  loadPersisted,
  persistWorkspace,
  schedulePersist,
  syncNavigationFromLeaf,
} from "./workspaceHelpers";
import type { EditorLeafState, SidebarWidget, WorkspaceStore } from "./workspaceTypes";

type WorkspaceSet = StoreApi<WorkspaceStore>["setState"];
type WorkspaceGet = StoreApi<WorkspaceStore>["getState"];

export function createOpenActions(get: WorkspaceGet) {
  return {
    openPage: (rootId: string, title: string) => {
      const existing = Object.values(get().leaves).find(
        (leaf) =>
          leaf.type === "editor" &&
          (leaf.state as EditorLeafState).rootId === rootId,
      );
      if (existing) {
        get().activateLeaf(existing.id);
        return;
      }
      get().addLeaf("editor", { rootId }, { title, activate: true });
    },

    openJournal: () => {
      const existing = findLeafByType(get().leaves, "journal");
      if (existing) {
        get().activateLeaf(existing.id);
        return;
      }
      get().addLeaf("journal", {}, { activate: true });
    },

    openTrash: () => {
      const existing = findLeafByType(get().leaves, "trash");
      if (existing) {
        get().activateLeaf(existing.id);
        return;
      }
      get().addLeaf("trash", {}, { activate: true });
    },

    openSearchTab: (query = "") => {
      get().addLeaf("search", { query }, { activate: true });
    },

    openSettings: (section?: "theme" | "sync" | "plugins") => {
      const existing = findLeafByType(get().leaves, "settings");
      if (existing) {
        if (section) {
          get().updateLeafState(existing.id, { section });
        }
        get().activateLeaf(existing.id);
        return;
      }
      get().addLeaf("settings", section ? { section } : {}, {
        activate: true,
      });
    },
  };
}

export function createWidgetActions(get: WorkspaceGet, set: WorkspaceSet) {
  return {
    pinWidget: (type: SidebarWidget["type"]) => {
      const widgets = get().sidebarWidgets;
      if (widgets.some((w) => w.type === type)) {
        return;
      }
      const widget: SidebarWidget = {
        id: `widget-${type}`,
        type,
        pinned: true,
        order: widgets.length,
        collapsed: false,
      };
      set({
        sidebarWidgets: [...widgets, widget],
        layout: { ...get().layout, rightSidebarOpen: true },
      });
      schedulePersist(get);
    },

    unpinWidget: (id: string) => {
      set({
        sidebarWidgets: get().sidebarWidgets.filter((w) => w.id !== id),
      });
      schedulePersist(get);
    },

    toggleWidgetCollapsed: (id: string) => {
      set({
        sidebarWidgets: get().sidebarWidgets.map((w) =>
          w.id === id ? { ...w, collapsed: !w.collapsed } : w,
        ),
      });
      schedulePersist(get);
    },

    reorderWidgets: (fromIndex: number, toIndex: number) => {
      const widgets = [...get().sidebarWidgets];
      const [moved] = widgets.splice(fromIndex, 1);
      widgets.splice(toIndex, 0, moved);
      set({
        sidebarWidgets: widgets.map((w, i) => ({ ...w, order: i })),
      });
      schedulePersist(get);
    },
  };
}

export function createLayoutActions(get: WorkspaceGet, set: WorkspaceSet) {
  return {
    setLeftSidebarWidth: (width: number) => {
      const layout = {
        ...get().layout,
        leftSidebarWidth: clampSidebarWidth(width),
      };
      set({ layout });
      applyLayoutCss(layout);
      schedulePersist(get);
    },

    setRightSidebarOpen: (open: boolean) => {
      set({ layout: { ...get().layout, rightSidebarOpen: open } });
      schedulePersist(get);
    },

    setRightSidebarWidth: (width: number) => {
      const layout = {
        ...get().layout,
        rightSidebarWidth: clampRightSidebarWidth(width),
      };
      set({ layout });
      applyLayoutCss(layout);
      schedulePersist(get);
    },

    toggleRightSidebar: () => {
      get().setRightSidebarOpen(!get().layout.rightSidebarOpen);
    },
  };
}

export function createPersistenceActions(get: WorkspaceGet, set: WorkspaceSet) {
  return {
    hydrate: () => {
      const saved = loadPersisted();
      if (saved?.leaves && saved.leafOrder?.length) {
        const layout = saved.layout ?? defaultLayout();
        set({
          leaves: saved.leaves,
          leafOrder: saved.leafOrder,
          activeLeafId: saved.activeLeafId,
          sidebarWidgets: saved.sidebarWidgets ?? [],
          layout,
        });
        applyLayoutCss(layout);
        return;
      }
      applyLayoutCss(defaultLayout());
    },

    syncActiveLeafNavigation: () => {
      const { activeLeafId, leaves } = get();
      const activeLeaf = activeLeafId ? leaves[activeLeafId] : null;
      if (activeLeaf) {
        syncNavigationFromLeaf(activeLeaf);
      }
    },

    persist: () => persistWorkspace(get),
  };
}
