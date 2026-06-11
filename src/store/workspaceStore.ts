import { create } from "zustand";
import { PLUGINS_CONFIG_KEY } from "../domain/settings/settingKeys";
import { setSetting } from "../domain/settings/settingsRepo";
import { getDbContext } from "./dbContext";
import { useOutlinerStore } from "./outlinerStore";
import {
  createLayoutActions,
  createOpenActions,
  createPersistenceActions,
} from "./workspaceActions";
import { createLeafTabActions } from "./workspaceLeafActions";
import {
  createJournalLeaf,
  DEFAULT_TITLES,
  defaultLayout,
  defaultStateForType,
  generateId,
  schedulePersist,
  syncNavigationFromLeaf,
} from "./workspaceHelpers";
import type { WorkspaceStore } from "./workspaceTypes";
import { defaultPlugins } from "./workspaceTypes";

export type {
  EditorLeafState,
  JournalLeafState,
  RightWidgetType,
  SearchLeafState,
  SettingsLeafState,
  TrashLeafState,
  WorkspaceLayout,
  WorkspaceLeaf,
  WorkspaceLeafState,
  WorkspaceLeafType,
} from "./workspaceTypes";

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => {
  const initialJournal = createJournalLeaf();
  const openActions = createOpenActions(get);
  const layoutActions = createLayoutActions(get, set);
  const persistenceActions = createPersistenceActions(get, set);
  const leafTabActions = createLeafTabActions(get, set);

  return {
    leaves: { [initialJournal.id]: initialJournal },
    leafOrder: [initialJournal.id],
    activeLeafId: initialJournal.id,
    layout: defaultLayout(),
    plugins: defaultPlugins(),
    togglePlugin: (pluginId) => {
      const wasEnabled = get().plugins[pluginId];
      set((state) => ({
        plugins: {
          ...state.plugins,
          [pluginId]: !state.plugins[pluginId],
        },
      }));

      if (pluginId === "gamification" && wasEnabled && get().layout.rightWidget === "profile") {
        set({
          layout: {
            ...get().layout,
            rightWidget: null,
          },
        });
        schedulePersist(get);
      }

      if (pluginId === "calendar" && wasEnabled && get().layout.rightWidget === "calendar") {
        set({
          layout: {
            ...get().layout,
            rightWidget: null,
          },
        });
        schedulePersist(get);
      }

      const updatedPlugins = get().plugins;
      const db = getDbContext()?.db;
      if (db) {
        void setSetting(db, PLUGINS_CONFIG_KEY, updatedPlugins);
      }
    },
    commandPaletteOpen: false,
    toggleCommandPalette: (force) =>
      set((state) => ({
        commandPaletteOpen:
          force !== undefined ? force : !state.commandPaletteOpen,
      })),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    openCommandPalette: () => set({ commandPaletteOpen: true }),
    globalQuickAddOpen: false,
    toggleGlobalQuickAdd: (force) =>
      set((state) => ({
        globalQuickAddOpen:
          force !== undefined ? force : !state.globalQuickAddOpen,
      })),

    addLeaf: (type, state, opts) => {
      const id = generateId();
      const now = Date.now();
      const leaf = {
        id,
        type,
        title: opts?.title ?? DEFAULT_TITLES[type],
        state: defaultStateForType(type, state),
        createdAt: now,
        lastFocusedAt: now,
      };

      set((prev) => ({
        leaves: { ...prev.leaves, [id]: leaf },
        leafOrder: [...prev.leafOrder, id],
        activeLeafId: opts?.activate !== false ? id : prev.activeLeafId,
      }));

      if (opts?.activate !== false) {
        syncNavigationFromLeaf(leaf);
      }

      schedulePersist(get);
      return id;
    },

    closeLeaf: (id) => {
      const { leaves, leafOrder, activeLeafId } = get();
      if (leafOrder.length <= 1) {
        return;
      }

      const newOrder = leafOrder.filter((leafId) => leafId !== id);
      const remainingLeaves = Object.fromEntries(
        Object.entries(leaves).filter(([leafId]) => leafId !== id),
      );

      let newActiveId = activeLeafId;
      if (activeLeafId === id) {
        const closedIndex = leafOrder.indexOf(id);
        const nextIndex = Math.min(closedIndex, newOrder.length - 1);
        newActiveId = newOrder[nextIndex] ?? newOrder[0];
      }

      set({
        leaves: remainingLeaves,
        leafOrder: newOrder,
        activeLeafId: newActiveId,
      });

      if (newActiveId && newActiveId !== activeLeafId) {
        const leaf = remainingLeaves[newActiveId];
        if (leaf) {
          syncNavigationFromLeaf(leaf);
        }
      }

      schedulePersist(get);
    },

    activateLeaf: (id) => {
      const leaf = get().leaves[id];
      if (!leaf) {
        return;
      }

      void (async () => {
        await useOutlinerStore.getState().flushPendingContent();
        set({
          activeLeafId: id,
          leaves: {
            ...get().leaves,
            [id]: { ...leaf, lastFocusedAt: Date.now() },
          },
        });
        syncNavigationFromLeaf(leaf);
        schedulePersist(get);
      })();
    },

    updateLeafState: (id, patch) => {
      const leaf = get().leaves[id];
      if (!leaf) {
        return;
      }

      set({
        leaves: {
          ...get().leaves,
          [id]: { ...leaf, state: { ...leaf.state, ...patch } },
        },
      });
      schedulePersist(get);
    },

    updateLeafTitle: (id, title) => {
      const leaf = get().leaves[id];
      if (!leaf) {
        return;
      }

      set({ leaves: { ...get().leaves, [id]: { ...leaf, title } } });
      schedulePersist(get);
    },

    ...leafTabActions,
    ...openActions,
    ...layoutActions,
    ...persistenceActions,
  };
});
