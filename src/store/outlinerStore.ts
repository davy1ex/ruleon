import { create } from "zustand";
import { initDatabase, type SyncStatus } from "../domain/db";
import { seedIfEmpty } from "../domain/outliner/seed";
import { dedupeWelcomePages } from "../domain/outliner/welcomePage";
import { initModules } from "../modules";
import type { AppSettings } from "./settingsStore";
import type {
  FlatOutlineNode,
  OutlineNodeRow,
  PageListItem,
  TrashedPageItem,
} from "../domain/outliner/types";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import type { DragProjection } from "../features/outliner/dragProjection";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import {
  debouncedUpdateContent,
  flushUpdateContent,
  type CursorRestore,
  runAddSibling,
  runDeleteNode,
  runDeleteSelectedNodes,
  runIndent,
  runOutdent,
  runMergeBlockWithPrevious,
  runMoveBlock,
  runPruneEmptyBlock,
  runSplitBlock,
  runToggleCollapse,
  runUpdateContent,
} from "./blockActions";
import type { PortalFilter } from "../domain/outliner/portalTypes";
import { runLoadPortalResults } from "./portalActions";
import { runToggleTaskStatus } from "./todoActions";
import {
  getDbContext,
  setDbContext,
  setDisposeRx,
} from "./dbContext";
import {
  buildNodesByRootIds,
  fetchInitialJournalHistory,
  fetchNextJournalHistory,
  prepareRootForEditing,
  runFeedRefresh,
} from "./feedHelpers";
import { emptyLinkedReferenceState } from "./backlinkActions";
import {
  DAILY_FEED_ROOT_ID,
  isDailyFeedRootId,
  isSystemTrashRootId,
} from "./journal";
import {
  formatDatePageTitle,
  getOrCreatePage,
} from "../domain/pages/PageRegistry";
import { toggleFavorite } from "../domain/outliner/mutations/favorite";
import { isDatePage } from "../domain/pages/PageRegistry";
import {
  runNavigateToPage,
  runRenameCurrentPage,
  runRestorePage,
  runTrashCurrentPage,
  resolvePageTitle,
} from "./pageActions";

let bootstrapPromise: Promise<void> | null = null;

function findFlatNodesForId(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  nodeId: string,
): FlatOutlineNode[] {
  for (const nodes of Object.values(nodesByRootId)) {
    if (nodes.some((node) => node.id === nodeId)) {
      return nodes;
    }
  }
  return [];
}

export type { SyncStatus, CursorRestore };

interface OutlinerState {
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  currentRootId: string;
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  focusedId: string | null;
  selectedIds: string[];
  selectionAnchorId: string | null;
  pendingCursorRestore: CursorRestore | null;
  linkedReferences: OutlineNodeRow[];
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
  currentPageTitle: string | null;
  dailyFeedTodayRootId: string | null;
  journalHistoryIds: string[];
  journalHistoryOffset: number;
  historyLoading: boolean;
  pagesList: PageListItem[];
  favoritesList: PageListItem[];
  trashedPages: TrashedPageItem[];
  dragProjection: DragProjection | null;
  portalResultsCache: Record<string, FlatOutlineNode[] | undefined>;
  refreshGeneration: number;
  bootstrap: (settings: AppSettings) => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
  refresh: () => Promise<void>;
  navigateToRoot: (rootId: string) => Promise<void>;
  navigateToPage: (pageName: string) => Promise<void>;
  navigateToToday: () => Promise<void>;
  navigateToDailyFeed: () => Promise<void>;
  loadMoreJournalHistory: () => Promise<void>;
  renameCurrentPage: (newName: string) => Promise<void>;
  toggleCurrentPageFavorite: () => Promise<void>;
  trashCurrentPage: () => Promise<void>;
  restorePage: (nodeId: string) => Promise<void>;
  setFocus: (id: string | null) => void;
  focusBlock: (id: string) => void;
  selectRange: (anchorId: string, targetId: string) => void;
  setPendingCursorRestore: (pos: CursorRestore | null) => void;
  getPreviousNode: (nodeId: string) => FlatOutlineNode | null;
  getNextNode: (nodeId: string) => FlatOutlineNode | null;
  focusPreviousNode: (currentId: string) => void;
  focusNextNode: (currentId: string) => void;
  toggleSelect: (id: string) => void;
  selectAllInCurrentTree: (nodeId: string) => void;
  selectAllBlocks: (nodeIds: string[]) => void;
  extendBlockSelection: (anchorId: string, targetId: string) => void;
  clearSelection: () => void;
  updateContent: (id: string, content: BlockContentJSON) => void;
  debouncedUpdateContent: (id: string, content: BlockContentJSON) => void;
  flushUpdateContent: (id: string, content: BlockContentJSON) => Promise<void>;
  addSibling: (afterId: string, initialContent?: BlockContentJSON) => Promise<void>;
  splitBlock: (
    id: string,
    left: BlockContentJSON,
    right: BlockContentJSON,
  ) => Promise<void>;
  mergeBlockWithPrevious: (
    id: string,
    remainder?: BlockContentJSON,
  ) => Promise<void>;
  indent: (id: string) => Promise<void>;
  outdent: (id: string) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  deleteSelectedNodes: () => Promise<void>;
  pruneEmptyBlock: (id: string, content: BlockContentJSON) => Promise<void>;
  toggleCollapse: (id: string) => Promise<void>;
  toggleTaskStatus: (ids: string | string[]) => Promise<void>;
  moveBlock: (
    id: string,
    newParentId: string | null,
    prevSiblingOrder: number | null,
    nextSiblingOrder: number | null,
  ) => Promise<void>;
  setDragProjection: (projection: DragProjection | null) => void;
  clearDragState: () => void;
  loadPortalResults: (target: string, filter: PortalFilter) => Promise<FlatOutlineNode[]>;
}

export const useOutlinerStore = create<OutlinerState>((set, get) => ({
  loading: true,
  error: null,
  syncStatus: "disconnected",
  currentRootId: "",
  nodesByRootId: {},
  focusedId: null,
  selectedIds: [],
  selectionAnchorId: null,
  pendingCursorRestore: null,
  linkedReferences: [],
  linkedReferenceNodesById: {},
  currentPageTitle: null,
  dailyFeedTodayRootId: null,
  journalHistoryIds: [],
  journalHistoryOffset: 0,
  historyLoading: false,
  pagesList: [],
  favoritesList: [],
  trashedPages: [],
  dragProjection: null,
  portalResultsCache: {},
  refreshGeneration: 0,

  bootstrap: async (settings) => {
    if (getDbContext()) {
      return;
    }
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      try {
        const context = await initDatabase();
        setDbContext(context);

        if (!settings.sync.enabled) {
          await seedIfEmpty(context.db);
          await dedupeWelcomePages(context.db);
        }

        let refreshTimer: ReturnType<typeof setTimeout> | null = null;
        setDisposeRx(
          context.rx.onRange(["outline_nodes", "block_links"], () => {
            if (refreshTimer) {
              clearTimeout(refreshTimer);
            }
            refreshTimer = setTimeout(() => {
              refreshTimer = null;
              void get().refresh();
            }, 100);
          }),
        );
        await initModules(settings, context);
        await get().navigateToDailyFeed();
      } catch (error) {
        bootstrapPromise = null;
        set({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to init database",
        });
      }
    })();

    return bootstrapPromise;
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  refresh: async () => {
    const context = getDbContext();
    if (!context) {
      return;
    }
    await runFeedRefresh(context.db, get, set);
  },

  navigateToRoot: async (rootId) => {
    const context = getDbContext();
    if (!context) {
      return;
    }

    if (isSystemTrashRootId(rootId)) {
      set({
        currentRootId: rootId,
        selectedIds: [],
        focusedId: null,
        ...emptyLinkedReferenceState(),
      });
      await get().refresh();
      return;
    }

    const newBlockId = await prepareRootForEditing(context.db, rootId);
    set({
      currentRootId: rootId,
      selectedIds: [],
      focusedId: newBlockId,
    });
    await get().refresh();
  },

  navigateToToday: async () => {
    await get().navigateToDailyFeed();
  },

  navigateToDailyFeed: async () => {
    const context = getDbContext();
    if (!context) {
      return;
    }

    const todayPage = await getOrCreatePage(
      context.db,
      formatDatePageTitle(),
    );
    const newBlockId = await prepareRootForEditing(context.db, todayPage.id);
    const { historyJournalIds, offset } = await fetchInitialJournalHistory(
      context.db,
      todayPage.id,
    );

    set({
      currentRootId: DAILY_FEED_ROOT_ID,
      dailyFeedTodayRootId: todayPage.id,
      journalHistoryIds: historyJournalIds,
      journalHistoryOffset: offset,
      selectedIds: [],
      focusedId: newBlockId,
      ...emptyLinkedReferenceState(),
    });
    await get().refresh();
  },

  loadMoreJournalHistory: async () => {
    const state = get();
    if (
      state.historyLoading ||
      !isDailyFeedRootId(state.currentRootId) ||
      !state.dailyFeedTodayRootId
    ) {
      return;
    }

    set({ historyLoading: true });
    const context = getDbContext();
    if (!context) {
      set({ historyLoading: false });
      return;
    }

    try {
      const nextIds = await fetchNextJournalHistory(
        context.db,
        state.dailyFeedTodayRootId,
        state.journalHistoryOffset,
      );
      if (nextIds.length === 0) {
        set({ historyLoading: false });
        return;
      }

      const nextNodes = await buildNodesByRootIds(context.db, nextIds);
      set({
        journalHistoryIds: [...state.journalHistoryIds, ...nextIds],
        journalHistoryOffset: state.journalHistoryOffset + nextIds.length,
        historyLoading: false,
        nodesByRootId: { ...state.nodesByRootId, ...nextNodes },
      });
    } catch {
      set({ historyLoading: false });
    }
  },

  navigateToPage: async (pageName) => {
    const context = getDbContext();
    if (!context) {
      return;
    }

    const rootId = await runNavigateToPage(context.db, pageName, set);
    if (rootId) {
      await get().refresh();
    }
  },

  renameCurrentPage: async (newName) => {
    const context = getDbContext();
    if (!context) {
      return;
    }

    const oldName =
      get().currentPageTitle ??
      (await resolvePageTitle(context.db, get().currentRootId));
    if (!oldName || isDatePage(oldName)) {
      return;
    }

    const renamed = await runRenameCurrentPage(
      context.db,
      get().currentRootId,
      oldName,
      newName,
    );
    if (renamed) {
      await get().refresh();
    }
  },

  toggleCurrentPageFavorite: async () => {
    const context = getDbContext();
    if (!context || isSystemTrashRootId(get().currentRootId)) {
      return;
    }

    await toggleFavorite(context.db, get().currentRootId);
    await get().refresh();
  },

  trashCurrentPage: async () => {
    const context = getDbContext();
    if (!context || isSystemTrashRootId(get().currentRootId)) {
      return;
    }

    const trashed = await runTrashCurrentPage(context.db, get().currentRootId);
    if (!trashed) {
      return;
    }

    await get().refresh();
    await get().navigateToToday();
  },

  restorePage: async (nodeId) => {
    const context = getDbContext();
    if (!context) {
      return;
    }

    await runRestorePage(context.db, nodeId);
    await get().refresh();
  },

  setFocus: (id) =>
    set({
      focusedId: id,
      selectionAnchorId: id,
    }),

  focusBlock: (id) =>
    set({
      focusedId: id,
      selectedIds: [],
      selectionAnchorId: id,
    }),

  selectRange: (anchorId, targetId) => {
    const nodes = findFlatNodesForId(get().nodesByRootId, anchorId);
    const anchorIndex = nodes.findIndex((node) => node.id === anchorId);
    const targetIndex = nodes.findIndex((node) => node.id === targetId);
    if (anchorIndex === -1 || targetIndex === -1) {
      return;
    }

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);

    set({
      selectedIds: nodes.slice(start, end + 1).map((node) => node.id),
      selectionAnchorId: anchorId,
    });
  },

  setPendingCursorRestore: (pos) => set({ pendingCursorRestore: pos }),

  getPreviousNode: (nodeId) => {
    const flatNodes = findFlatNodesForId(get().nodesByRootId, nodeId);
    const index = flatNodes.findIndex((node) => node.id === nodeId);
    return index > 0 ? (flatNodes[index - 1] ?? null) : null;
  },

  getNextNode: (nodeId) => {
    const flatNodes = findFlatNodesForId(get().nodesByRootId, nodeId);
    const index = flatNodes.findIndex((node) => node.id === nodeId);
    return index >= 0 && index < flatNodes.length - 1
      ? (flatNodes[index + 1] ?? null)
      : null;
  },

  focusPreviousNode: (currentId) => {
    const target = get().getPreviousNode(currentId);
    if (!target) {
      return;
    }

    set({
      focusedId: target.id,
      pendingCursorRestore: {
        nodeId: target.id,
        pos: Math.max(1, extractPlainText(target.content).length + 1),
      },
    });
  },

  focusNextNode: (currentId) => {
    const target = get().getNextNode(currentId);
    if (!target) {
      return;
    }

    set({
      focusedId: target.id,
      pendingCursorRestore: { nodeId: target.id, pos: 1 },
    });
  },

  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id],
      selectionAnchorId: id,
    })),

  selectAllInCurrentTree: (nodeId) => {
    const nodes = findFlatNodesForId(get().nodesByRootId, nodeId);
    if (nodes.length === 0) {
      return;
    }
    get().selectAllBlocks(nodes.map((node) => node.id));
  },

  selectAllBlocks: (nodeIds) => {
    if (nodeIds.length === 0) {
      return;
    }
    set({
      selectedIds: [...nodeIds],
      selectionAnchorId: nodeIds[0] ?? null,
    });
  },

  extendBlockSelection: (anchorId, targetId) => {
    get().selectRange(anchorId, targetId);
    set({
      focusedId: targetId,
      pendingCursorRestore: { nodeId: targetId, pos: 1 },
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  updateContent: (id, content) => runUpdateContent(id, content, get, set),

  debouncedUpdateContent: (id, content) =>
    debouncedUpdateContent(id, content, get, set),

  flushUpdateContent: (id, content) =>
    flushUpdateContent(id, content, get, set),

  addSibling: (afterId, initialContent) =>
    runAddSibling(afterId, get, set, () => get().refresh(), initialContent),

  splitBlock: (id, left, right) =>
    runSplitBlock(id, left, right, get, set, () => get().refresh()),

  mergeBlockWithPrevious: (sourceId, remainder) =>
    runMergeBlockWithPrevious(sourceId, get, set, remainder),

  indent: (id) => runIndent(id, get, set, () => get().refresh()),

  outdent: (id) => runOutdent(id, get, set, () => get().refresh()),

  deleteNode: (id) => runDeleteNode(id, get, set),

  deleteSelectedNodes: () =>
    runDeleteSelectedNodes(get, set, () => get().refresh()),

  pruneEmptyBlock: (id, content) => runPruneEmptyBlock(id, content, get, set),

  toggleCollapse: (id) => runToggleCollapse(id),

  toggleTaskStatus: (ids) => runToggleTaskStatus(ids, get, set),

  moveBlock: (id, newParentId, prevSiblingOrder, nextSiblingOrder) =>
    runMoveBlock(
      id,
      newParentId,
      prevSiblingOrder,
      nextSiblingOrder,
      () => get().refresh(),
    ),

  setDragProjection: (projection) => set({ dragProjection: projection }),

  clearDragState: () => set({ dragProjection: null }),

  loadPortalResults: (target, filter) =>
    runLoadPortalResults(target, filter, get, set),
}));

export { disposeOutlinerStore } from "./dbContext";
