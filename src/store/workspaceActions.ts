import type { StoreApi } from "zustand";
import {
  defaultLayout,
  findLeafByType,
  loadPersisted,
  migrateLayout,
  migratePlugins,
  persistWorkspace,
  schedulePersist,
  syncNavigationFromLeaf,
} from "./workspaceHelpers";
import { defaultPlugins } from "./workspaceTypes";
import type {
  EditorLeafState,
  RightWidgetType,
  WorkspaceStore,
} from "./workspaceTypes";

type WorkspaceSet = StoreApi<WorkspaceStore>["setState"];
type WorkspaceGet = StoreApi<WorkspaceStore>["getState"];

function resolveRightWidget(
  widget: RightWidgetType,
  plugins: WorkspaceStore["plugins"],
): RightWidgetType {
  if (widget === "profile" && !plugins.gamification) {
    return "outline";
  }
  if (widget === "calendar" && !plugins.calendar) {
    return "outline";
  }
  return widget;
}

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

export function createLayoutActions(get: WorkspaceGet, set: WorkspaceSet) {
  return {
    toggleLeftSidebar: () => {
      set({
        layout: {
          ...get().layout,
          leftSidebarOpen: !get().layout.leftSidebarOpen,
        },
      });
      schedulePersist(get);
    },

    toggleRightPanel: () => {
      const { rightWidget, lastRightWidget } = get().layout;
      set({
        layout: {
          ...get().layout,
          rightWidget: rightWidget
            ? null
            : resolveRightWidget(lastRightWidget, get().plugins),
        },
      });
      schedulePersist(get);
    },

    setRightWidget: (widget: WorkspaceStore["layout"]["rightWidget"]) => {
      set({
        layout: {
          ...get().layout,
          rightWidget: widget,
          ...(widget ? { lastRightWidget: widget } : {}),
        },
      });
      schedulePersist(get);
    },
  };
}

export function createPersistenceActions(get: WorkspaceGet, set: WorkspaceSet) {
  return {
    hydrate: () => {
      const saved = loadPersisted();
      if (saved?.leaves && saved.leafOrder?.length) {
        set({
          leaves: saved.leaves,
          leafOrder: saved.leafOrder,
          activeLeafId: saved.activeLeafId ?? null,
          layout: migrateLayout(saved),
          plugins: migratePlugins(saved),
        });
        return;
      }
      set({ layout: defaultLayout(), plugins: defaultPlugins() });
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
