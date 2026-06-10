import type { DbContext } from "../domain/db/types";
import { partitionPages } from "../domain/pages/Indexer";
import {
  formatDatePageTitle,
  getOrCreatePage,
} from "../domain/pages/PageRegistry";
import {
  getAllNodes,
  getAllPages,
  getFavorites,
  getTrashedPages,
} from "../domain/outliner/queries";
import type {
  FlatOutlineNode,
  OutlineNodeRow,
  PageListItem,
  TrashedPageItem,
} from "../domain/outliner/types";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import { serializeForDb } from "../features/editor/serialization/serializeForDb";
import { buildTree } from "../features/outliner/buildTree";
import { flattenTreeForRoot } from "../features/outliner/flattenTree";
import {
  emptyLinkedReferenceState,
  resolveLinkedReferenceState,
} from "./backlinkActions";
import { bumpRefreshGeneration } from "./portalActions";
import {
  ensureEmptyBlock,
  ensureJournalRoot,
  findTreeNode,
  isDailyFeedRootId,
  isSystemTrashRootId,
} from "./journal";

export const HISTORY_PAGE_SIZE = 10;

export async function getPastDailyNoteRootIds(
  db: DbContext["db"],
  excludeRootId: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  const todayTitle = formatDatePageTitle();
  const pages = await getAllPages(db);
  const { dailyNotes } = partitionPages(pages);

  return dailyNotes
    .filter((page) => page.id !== excludeRootId && page.title !== todayTitle)
    .slice(offset, offset + limit)
    .map((page) => page.id);
}

export async function fetchInitialJournalHistory(
  db: DbContext["db"],
  todayRootId: string,
): Promise<{ historyJournalIds: string[]; offset: number }> {
  const historyJournalIds = await getPastDailyNoteRootIds(
    db,
    todayRootId,
    HISTORY_PAGE_SIZE,
    0,
  );
  return { historyJournalIds, offset: historyJournalIds.length };
}

export async function fetchNextJournalHistory(
  db: DbContext["db"],
  todayRootId: string,
  offset: number,
): Promise<string[]> {
  return getPastDailyNoteRootIds(db, todayRootId, HISTORY_PAGE_SIZE, offset);
}

export async function buildNodesByRootIds(
  db: DbContext["db"],
  rootIds: readonly string[],
): Promise<Record<string, FlatOutlineNode[]>> {
  const rows = await getAllNodes(db);
  const tree = buildTree(rows);
  const nodesByRootId: Record<string, FlatOutlineNode[]> = {};

  for (const rootId of rootIds) {
    const root = findTreeNode(tree, rootId);
    nodesByRootId[rootId] = root ? flattenTreeForRoot(root) : [];
  }

  return nodesByRootId;
}

export async function prepareRootForEditing(
  db: DbContext["db"],
  rootId: string,
): Promise<string | null> {
  if (rootId.startsWith("journal-")) {
    await ensureJournalRoot(db, rootId);
  }
  return ensureEmptyBlock(db, rootId);
}

type FeedRefreshGet = () => {
  currentRootId: string;
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  focusedId: string | null;
  selectedIds: string[];
  journalHistoryIds: string[];
};

function findNodeContent(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  nodeId: string,
): BlockContentJSON | undefined {
  for (const nodes of Object.values(nodesByRootId)) {
    const node = nodes.find((entry) => entry.id === nodeId);
    if (node) {
      return node.content;
    }
  }
  return undefined;
}

function preserveFocusedNodeContent(
  freshNodesByRootId: Record<string, FlatOutlineNode[]>,
  currentNodesByRootId: Record<string, FlatOutlineNode[]>,
  focusedId: string | null,
): Record<string, FlatOutlineNode[]> {
  if (!focusedId) {
    return freshNodesByRootId;
  }

  const preservedContent = findNodeContent(currentNodesByRootId, focusedId);
  if (preservedContent === undefined) {
    return freshNodesByRootId;
  }

  const incomingContent = findNodeContent(freshNodesByRootId, focusedId);
  if (
    incomingContent !== undefined &&
    serializeForDb(incomingContent) === serializeForDb(preservedContent)
  ) {
    return freshNodesByRootId;
  }

  const result: Record<string, FlatOutlineNode[]> = {};
  for (const [rootId, nodes] of Object.entries(freshNodesByRootId)) {
    result[rootId] = nodes.map((node) =>
      node.id === focusedId ? { ...node, content: preservedContent } : node,
    );
  }
  return result;
}

type FeedRefreshSet = (partial: {
  loading: boolean;
  error: string | null;
  nodesByRootId?: Record<string, FlatOutlineNode[]>;
  linkedReferences?: OutlineNodeRow[];
  linkedReferenceNodesById?: Record<string, FlatOutlineNode[]>;
  currentPageTitle?: string | null;
  dailyFeedTodayRootId?: string | null;
  pagesList?: PageListItem[];
  favoritesList?: PageListItem[];
  trashedPages?: TrashedPageItem[];
  focusedId?: string | null;
  selectedIds?: string[];
  portalResultsCache?: Record<string, FlatOutlineNode[] | undefined>;
  refreshGeneration?: number;
}) => void;

export async function runFeedRefresh(
  db: DbContext["db"],
  get: FeedRefreshGet,
  set: FeedRefreshSet,
): Promise<void> {
  bumpRefreshGeneration(
    get as () => {
      refreshGeneration?: number;
      portalResultsCache?: Record<string, FlatOutlineNode[] | undefined>;
    },
    set,
  );

  try {
    const state = get();
    const { currentRootId } = state;
    const [pagesList, favoritesList, trashedPages] = await Promise.all([
      getAllPages(db),
      getFavorites(db),
      getTrashedPages(db),
    ]);

    if (isDailyFeedRootId(currentRootId)) {
      const todayPage = await getOrCreatePage(db, formatDatePageTitle());
      const newBlockId = await prepareRootForEditing(db, todayPage.id);
      const rootIds = [todayPage.id, ...state.journalHistoryIds];
      const freshNodesByRootId = await buildNodesByRootIds(db, rootIds);
      const nodesByRootId = preserveFocusedNodeContent(
        freshNodesByRootId,
        state.nodesByRootId,
        state.focusedId,
      );
      const visibleIds = new Set(
        Object.values(nodesByRootId).flatMap((nodes) =>
          nodes.map((node) => node.id),
        ),
      );

      set({
        loading: false,
        error: null,
        nodesByRootId,
        dailyFeedTodayRootId: todayPage.id,
        ...emptyLinkedReferenceState(),
        pagesList,
        favoritesList,
        trashedPages,
        focusedId:
          state.focusedId && visibleIds.has(state.focusedId)
            ? state.focusedId
            : newBlockId ?? nodesByRootId[todayPage.id]?.[0]?.id ?? null,
        selectedIds: state.selectedIds.filter((id) => visibleIds.has(id)),
      });
      return;
    }

    if (!isSystemTrashRootId(currentRootId)) {
      await prepareRootForEditing(db, currentRootId);
    }

    const rootIds = isSystemTrashRootId(currentRootId) ? [] : [currentRootId];
    const freshNodesByRootId = await buildNodesByRootIds(db, rootIds);
    const nodesByRootId = preserveFocusedNodeContent(
      freshNodesByRootId,
      state.nodesByRootId,
      state.focusedId,
    );
    const linkedState = await resolveLinkedReferenceState(db, currentRootId);
    const visibleIds = new Set(
      Object.values(nodesByRootId).flatMap((nodes) => nodes.map((node) => node.id)),
    );

    const fallbackFocus = isSystemTrashRootId(currentRootId)
      ? null
      : nodesByRootId[currentRootId]?.[0]?.id ?? null;

    set({
      loading: false,
      error: null,
      nodesByRootId,
      ...linkedState,
      pagesList,
      favoritesList,
      trashedPages,
      focusedId:
        state.focusedId && visibleIds.has(state.focusedId)
          ? state.focusedId
          : fallbackFocus,
      selectedIds: state.selectedIds.filter((id) => visibleIds.has(id)),
    });
  } catch (error) {
    set({
      loading: false,
      error: error instanceof Error ? error.message : "Failed to load nodes",
    });
  }
}
