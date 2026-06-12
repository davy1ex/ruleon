import { createSibling } from "../domain/outliner/mutations/create";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import { EMPTY_DOCUMENT } from "../domain/outliner/contentTypes";
import {
  deleteNode as deleteOutlineNode,
  deleteNodes as deleteOutlineNodes,
} from "../domain/outliner/mutations/delete";
import { mergeNodes } from "../domain/outliner/mutations/merge";
import {
  indentUnderParent,
  moveNode,
  moveNodeToPageRoot,
  outdentNode,
} from "../domain/outliner/mutations/move";
import { splitNode } from "../domain/outliner/mutations/split";
import {
  toggleCollapsed,
  updateContent as updateOutlineContent,
} from "../domain/outliner/mutations/update";
import { computeFractionalSortOrder } from "../domain/outliner/sortOrder";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { mergeDocuments } from "../features/editor/document/mergeDocuments";
import { isDocumentEmpty } from "../features/editor/document/isDocumentEmpty";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import { serializeForDb } from "../features/editor/serialization/serializeForDb";
import { shareSameTreeRoot } from "../features/outliner/treeOps";
import { createNodeId } from "../domain/outliner/seed";
import { initialNodeMetadata } from "../domain/outliner/metadata";
import { getDbContext } from "./dbContext";
type StoreGet = () => {
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
  focusedNodeId: string | null;
  selectedIds: string[];
};

type StoreSet = (partial: {
  focusedNodeId?: string | null;
  selectedIds?: string[];
  moveTargetNodeId?: string | null;
  nodesByRootId?: Record<string, FlatOutlineNode[]>;
  linkedReferenceNodesById?: Record<string, FlatOutlineNode[]>;
}) => void;

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

function contentEquals(
  left: BlockContentJSON,
  right: BlockContentJSON,
): boolean {
  return serializeForDb(left) === serializeForDb(right);
}

function applyOptimisticContentUpdate(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  nodeId: string,
  content: BlockContentJSON,
): Record<string, FlatOutlineNode[]> {
  let updated = false;
  const result: Record<string, FlatOutlineNode[]> = {};

  for (const [rootId, nodes] of Object.entries(nodesByRootId)) {
    const hasNode = nodes.some((node) => node.id === nodeId);
    if (!hasNode) {
      result[rootId] = nodes;
      continue;
    }

    result[rootId] = nodes.map((node) =>
      node.id === nodeId ? { ...node, content } : node,
    );
    updated = true;
  }

  return updated ? result : nodesByRootId;
}

function applyOptimisticMerge(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  sourceId: string,
  targetId: string,
  newContent: BlockContentJSON,
): Record<string, FlatOutlineNode[]> {
  const rootKey = Object.keys(nodesByRootId).find((key) =>
    nodesByRootId[key].some((node) => node.id === sourceId),
  );
  if (!rootKey) {
    return nodesByRootId;
  }

  const nodes = nodesByRootId[rootKey];
  const sourceNode = nodes.find((node) => node.id === sourceId);
  if (!sourceNode) {
    return nodesByRootId;
  }

  const updatedNodes = nodes
    .filter((node) => node.id !== sourceId)
    .map((node) => {
      if (node.id === targetId) {
        return {
          ...node,
          content: newContent,
          hasChildren: node.hasChildren || sourceNode.hasChildren,
        };
      }
      if (node.parent_id === sourceId) {
        return { ...node, parent_id: targetId };
      }
      return node;
    });

  return { ...nodesByRootId, [rootKey]: updatedNodes };
}

function findInsertIndexAfterSubtree(
  nodes: FlatOutlineNode[],
  index: number,
): number {
  const currentDepth = nodes[index]?.depth;
  if (currentDepth === undefined) {
    return index + 1;
  }

  let insertAt = index + 1;
  while (insertAt < nodes.length && nodes[insertAt].depth > currentDepth) {
    insertAt += 1;
  }
  return insertAt;
}

function computeOptimisticSplitSortOrder(
  nodes: FlatOutlineNode[],
  index: number,
): number {
  const current = nodes[index];
  if (!current) {
    return 0;
  }

  for (let i = index + 1; i < nodes.length; i += 1) {
    const candidate = nodes[i];
    if (candidate.depth < current.depth) {
      break;
    }
    if (
      candidate.depth === current.depth &&
      candidate.parent_id === current.parent_id
    ) {
      return (current.sort_order + candidate.sort_order) / 2;
    }
  }

  return current.sort_order + 100;
}

function applyOptimisticSplit(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  id: string,
  leftPart: BlockContentJSON,
  rightPart: BlockContentJSON,
  newId: string,
): Record<string, FlatOutlineNode[]> | null {
  const rootKey = Object.keys(nodesByRootId).find((key) =>
    nodesByRootId[key].some((node) => node.id === id),
  );
  if (!rootKey) {
    return null;
  }

  const nodes = nodesByRootId[rootKey];
  const index = nodes.findIndex((node) => node.id === id);
  if (index < 0) {
    return null;
  }

  const current = nodes[index];
  const timestamp = Date.now();
  const newNode: FlatOutlineNode = {
    id: newId,
    parent_id: current.parent_id,
    content: rightPart,
    sort_order: computeOptimisticSplitSortOrder(nodes, index),
    collapsed: 0,
    task_status: null,
    metadata: initialNodeMetadata(new Date(timestamp).toISOString()),
    created_at: timestamp,
    updated_at: timestamp,
    depth: current.depth,
    hasChildren: false,
  };

  const updated = [...nodes];
  updated[index] = { ...current, content: leftPart };
  updated.splice(findInsertIndexAfterSubtree(nodes, index), 0, newNode);

  return { ...nodesByRootId, [rootKey]: updated };
}

function applyOptimisticIndent(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  id: string,
): { nodesByRootId: Record<string, FlatOutlineNode[]>; parentId: string } | null {
  const rootKey = Object.keys(nodesByRootId).find((key) =>
    nodesByRootId[key].some((node) => node.id === id),
  );
  if (!rootKey) {
    return null;
  }

  const nodes = nodesByRootId[rootKey];
  const index = nodes.findIndex((node) => node.id === id);
  if (index <= 0) {
    return null;
  }

  const previous = nodes[index - 1];
  if (previous.id.startsWith("journal-")) {
    return null;
  }

  const subtreeEnd = findInsertIndexAfterSubtree(nodes, index);
  const subtree = nodes.slice(index, subtreeEnd).map((node, offset) => ({
    ...node,
    ...(offset === 0 ? { parent_id: previous.id } : {}),
    depth: node.depth + 1,
  }));

  const withoutSubtree = [
    ...nodes.slice(0, index),
    ...nodes.slice(subtreeEnd),
  ];
  const previousIndex = withoutSubtree.findIndex((node) => node.id === previous.id);
  const updated = [...withoutSubtree];
  updated.splice(previousIndex + 1, 0, ...subtree);

  return {
    nodesByRootId: { ...nodesByRootId, [rootKey]: updated },
    parentId: previous.id,
  };
}

function applyOptimisticOutdent(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  id: string,
): Record<string, FlatOutlineNode[]> | null {
  const rootKey = Object.keys(nodesByRootId).find((key) =>
    nodesByRootId[key].some((node) => node.id === id),
  );
  if (!rootKey) {
    return null;
  }

  const nodes = nodesByRootId[rootKey];
  const index = nodes.findIndex((node) => node.id === id);
  if (index < 0) {
    return null;
  }

  const node = nodes[index];
  const parent = nodes.find((entry) => entry.id === node.parent_id);
  if (!parent || parent.parent_id === null || parent.id.startsWith("journal-")) {
    return null;
  }

  const subtreeEnd = findInsertIndexAfterSubtree(nodes, index);
  const subtree = nodes.slice(index, subtreeEnd).map((entry, offset) => ({
    ...entry,
    ...(offset === 0 ? { parent_id: parent.parent_id, depth: parent.depth } : {}),
    depth: entry.depth - 1,
  }));

  const withoutSubtree = [
    ...nodes.slice(0, index),
    ...nodes.slice(subtreeEnd),
  ];
  const parentIndex = withoutSubtree.findIndex((entry) => entry.id === parent.id);
  const insertAt = findInsertIndexAfterSubtree(withoutSubtree, parentIndex);
  const updated = [...withoutSubtree];
  updated.splice(insertAt, 0, ...subtree);

  return { ...nodesByRootId, [rootKey]: updated };
}

function applyOptimisticAddSibling(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  afterId: string,
  newId: string,
  initialContent: BlockContentJSON = EMPTY_DOCUMENT,
): Record<string, FlatOutlineNode[]> | null {
  const rootKey = Object.keys(nodesByRootId).find((key) =>
    nodesByRootId[key].some((node) => node.id === afterId),
  );
  if (!rootKey) {
    return null;
  }

  const nodes = nodesByRootId[rootKey];
  const index = nodes.findIndex((node) => node.id === afterId);
  if (index < 0) {
    return null;
  }

  const current = nodes[index];
  const timestamp = Date.now();
  const newNode: FlatOutlineNode = {
    id: newId,
    parent_id: current.parent_id,
    content: initialContent,
    sort_order: computeOptimisticSplitSortOrder(nodes, index),
    collapsed: 0,
    task_status: null,
    metadata: initialNodeMetadata(new Date(timestamp).toISOString()),
    created_at: timestamp,
    updated_at: timestamp,
    depth: current.depth,
    hasChildren: false,
  };

  const updated = [...nodes];
  updated.splice(findInsertIndexAfterSubtree(nodes, index), 0, newNode);

  return { ...nodesByRootId, [rootKey]: updated };
}

const CONTENT_DEBOUNCE_MS = 500;

const pendingContentUpdates = new Map<
  string,
  { timeout: ReturnType<typeof setTimeout>; content: BlockContentJSON }
>();

export function cancelDebouncedUpdateContent(id: string): void {
  const pending = pendingContentUpdates.get(id);
  if (!pending) {
    return;
  }
  clearTimeout(pending.timeout);
  pendingContentUpdates.delete(id);
}

export function debouncedUpdateContent(
  id: string,
  content: BlockContentJSON,
  get: StoreGet,
  set: StoreSet,
): void {
  const pending = pendingContentUpdates.get(id);
  if (pending) {
    clearTimeout(pending.timeout);
  }

  const timeout = setTimeout(() => {
    const entry = pendingContentUpdates.get(id);
    pendingContentUpdates.delete(id);
    if (entry) {
      void persistContentUpdate(id, entry.content, get, set);
    }
  }, CONTENT_DEBOUNCE_MS);

  pendingContentUpdates.set(id, { timeout, content });
}

async function persistContentUpdate(
  id: string,
  content: BlockContentJSON,
  get: StoreGet,
  set: StoreSet,
  options?: { syncStore?: boolean },
): Promise<void> {
  const syncStore = options?.syncStore ?? true;
  const { nodesByRootId, linkedReferenceNodesById } = get();
  const current = findNodeContent(nodesByRootId, id);
  if (isDocumentEmpty(content)) {
    if (!current || !isDocumentEmpty(current)) {
      return;
    }
  }
  if (syncStore && (!current || !contentEquals(current, content))) {
    set({
      nodesByRootId: applyOptimisticContentUpdate(nodesByRootId, id, content),
      linkedReferenceNodesById: applyOptimisticContentUpdate(
        linkedReferenceNodesById,
        id,
        content,
      ),
    });
  }

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }
  try {
    await updateOutlineContent(db, id, content);
  } catch (error) {
    console.error("CRITICAL: persistContentUpdate failed:", { id, error });
    throw error;
  }
}

async function safePersistContentUpdate(
  id: string,
  content: BlockContentJSON,
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  try {
    await persistContentUpdate(id, content, get, set);
  } catch (error) {
    console.error("CRITICAL: Flush failed:", { id, error });
  }
}

export async function flushUpdateContent(
  id: string,
  content: BlockContentJSON,
  get: StoreGet,
  set: StoreSet,
  options?: { syncStore?: boolean },
): Promise<void> {
  cancelDebouncedUpdateContent(id);
  await persistContentUpdate(id, content, get, set, options);
}

export async function flushAllPendingContentUpdates(
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  const pending = [...pendingContentUpdates.entries()];
  for (const [id] of pending) {
    cancelDebouncedUpdateContent(id);
  }

  await Promise.all(
    pending.map(([id, entry]) =>
      safePersistContentUpdate(id, entry.content, get, set),
    ),
  );
}

export function runUpdateNodeContent(
  id: string,
  text: string,
  get: StoreGet,
  set: StoreSet,
): void {
  const content = plainTextToBlockContent(text);
  const { nodesByRootId, linkedReferenceNodesById } = get();
  set({
    nodesByRootId: applyOptimisticContentUpdate(nodesByRootId, id, content),
    linkedReferenceNodesById: applyOptimisticContentUpdate(
      linkedReferenceNodesById,
      id,
      content,
    ),
  });
  debouncedUpdateContent(id, content, get, set);
}

export function runUpdateContent(
  id: string,
  content: BlockContentJSON,
  get: StoreGet,
  set: StoreSet,
): void {
  void persistContentUpdate(id, content, get, set);
}

export async function runAddSibling(
  afterId: string,
  get: StoreGet,
  set: StoreSet,
  refresh: () => Promise<void>,
  initialContent: BlockContentJSON = EMPTY_DOCUMENT,
): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const newId = createNodeId();
  const { nodesByRootId, linkedReferenceNodesById } = get();
  const nextNodesByRootId = applyOptimisticAddSibling(
    nodesByRootId,
    afterId,
    newId,
    initialContent,
  );
  if (!nextNodesByRootId) {
    return;
  }

  const nextLinkedReferenceNodesById =
    applyOptimisticAddSibling(
      linkedReferenceNodesById,
      afterId,
      newId,
      initialContent,
    ) ?? linkedReferenceNodesById;

  set({
    nodesByRootId: nextNodesByRootId,
    linkedReferenceNodesById: nextLinkedReferenceNodesById,
    focusedNodeId: newId,
    selectedIds: [],
  });

  const createdId = await createSibling(db, afterId, initialContent, newId);
  if (!createdId) {
    await refresh();
    return;
  }

  await refresh();
  if (get().focusedNodeId !== createdId) {
    restoreFocusAfterMove(createdId, set);
  }
}

export async function runSplitBlock(
  id: string,
  leftPart: BlockContentJSON,
  rightPart: BlockContentJSON,
  get: StoreGet,
  set: StoreSet,
  refresh: () => Promise<void>,
): Promise<void> {
  if (isDocumentEmpty(rightPart)) {
    if (!isDocumentEmpty(leftPart)) {
      const rootKey = Object.keys(get().nodesByRootId).find((key) =>
        get().nodesByRootId[key].some((node) => node.id === id),
      );
      if (rootKey) {
        const nodes = get().nodesByRootId[rootKey];
        const index = nodes.findIndex((node) => node.id === id);
        if (index >= 0) {
          const updated = [...nodes];
          updated[index] = { ...nodes[index], content: leftPart };
          set({
            nodesByRootId: {
              ...get().nodesByRootId,
              [rootKey]: updated,
            },
          });
        }
      }

      const db = getDbContext()?.db;
      if (db) {
        cancelDebouncedUpdateContent(id);
        await updateOutlineContent(db, id, leftPart);
      }
    }

    await runAddSibling(id, get, set, refresh);
    return;
  }

  const newId = createNodeId();
  const { nodesByRootId, linkedReferenceNodesById } = get();

  const nextNodesByRootId = applyOptimisticSplit(
    nodesByRootId,
    id,
    leftPart,
    rightPart,
    newId,
  );
  if (!nextNodesByRootId) {
    return;
  }

  const nextLinkedReferenceNodesById =
    applyOptimisticSplit(
      linkedReferenceNodesById,
      id,
      leftPart,
      rightPart,
      newId,
    ) ?? linkedReferenceNodesById;

  cancelDebouncedUpdateContent(id);
  set({
    nodesByRootId: nextNodesByRootId,
    linkedReferenceNodesById: nextLinkedReferenceNodesById,
    focusedNodeId: newId,
    selectedIds: [],
  });

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  try {
    const createdId = await splitNode(db, id, leftPart, rightPart, newId);
    if (!createdId) {
      await refresh();
      return;
    }
    await refresh();
    if (get().focusedNodeId !== createdId) {
      restoreFocusAfterMove(createdId, set);
    }
  } catch (error) {
    console.error("[splitBlock] failed:", error);
    await refresh();
  }
}

function restoreFocusAfterMove(id: string, set: StoreSet): void {
  set({ focusedNodeId: id });
}

export async function runIndent(
  id: string,
  get: StoreGet,
  set: StoreSet,
  refresh: () => Promise<void>,
): Promise<void> {
  const optimistic = applyOptimisticIndent(get().nodesByRootId, id);
  if (!optimistic) {
    return;
  }

  const nextLinkedReferenceNodesById =
    applyOptimisticIndent(get().linkedReferenceNodesById, id)?.nodesByRootId ??
    get().linkedReferenceNodesById;

  set({
    nodesByRootId: optimistic.nodesByRootId,
    linkedReferenceNodesById: nextLinkedReferenceNodesById,
  });

  const db = getDbContext()?.db;
  if (!db) {
    await refresh();
    return;
  }

  try {
    const moved = await indentUnderParent(db, id, optimistic.parentId);
    if (!moved) {
      await refresh();
      return;
    }
    restoreFocusAfterMove(id, set);
  } catch (error) {
    console.error("[indent] failed:", error);
    await refresh();
  }
}

export async function runOutdent(
  id: string,
  get: StoreGet,
  set: StoreSet,
  refresh: () => Promise<void>,
): Promise<void> {
  const optimistic = applyOptimisticOutdent(get().nodesByRootId, id);
  if (!optimistic) {
    return;
  }

  const nextLinkedReferenceNodesById =
    applyOptimisticOutdent(get().linkedReferenceNodesById, id) ??
    get().linkedReferenceNodesById;

  set({
    nodesByRootId: optimistic,
    linkedReferenceNodesById: nextLinkedReferenceNodesById,
  });

  const db = getDbContext()?.db;
  if (!db) {
    await refresh();
    return;
  }

  try {
    const moved = await outdentNode(db, id);
    if (!moved) {
      await refresh();
      return;
    }
    restoreFocusAfterMove(id, set);
  } catch (error) {
    console.error("[outdent] failed:", error);
    await refresh();
  }
}

export async function runMoveNodeToPage(
  nodeId: string,
  targetPageRootId: string,
  _get: StoreGet,
  set: StoreSet,
  refresh: () => Promise<void>,
): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  try {
    const moved = await moveNodeToPageRoot(db, nodeId, targetPageRootId);
    if (!moved) {
      return;
    }
    set({ moveTargetNodeId: null });
    restoreFocusAfterMove(nodeId, set);
    await refresh();
  } catch (error) {
    console.error("[moveNodeToPage] failed:", error);
    await refresh();
  }
}

export async function runMoveBlock(
  id: string,
  newParentId: string | null,
  prevSiblingOrder: number | null,
  nextSiblingOrder: number | null,
  refresh: () => Promise<void>,
): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  if (newParentId === null) {
    return;
  }

  const newOrder = computeFractionalSortOrder(
    prevSiblingOrder,
    nextSiblingOrder,
  );

  const moved = await moveNode(db, id, newParentId, newOrder);
  if (moved) {
    await refresh();
  }
}

function applyOptimisticBulkDelete(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  deletedIds: Set<string>,
): Record<string, FlatOutlineNode[]> {
  const next: Record<string, FlatOutlineNode[]> = {};

  for (const [rootKey, nodes] of Object.entries(nodesByRootId)) {
    const filtered = nodes.filter((node) => !deletedIds.has(node.id));
    if (filtered.length > 0) {
      next[rootKey] = filtered;
    }
  }

  return next;
}

function resolveFocusAfterBulkDelete(
  flatNodes: FlatOutlineNode[],
  deletedIds: Set<string>,
  currentFocus: string | null,
): string | null {
  if (currentFocus && !deletedIds.has(currentFocus)) {
    const focusedNode = flatNodes.find((node) => node.id === currentFocus);
    if (focusedNode) {
      return currentFocus;
    }
  }

  const firstDeletedIndex = flatNodes.findIndex((node) => deletedIds.has(node.id));
  if (firstDeletedIndex === -1) {
    return null;
  }

  for (let index = firstDeletedIndex - 1; index >= 0; index -= 1) {
    const candidate = flatNodes[index];
    if (candidate && !deletedIds.has(candidate.id)) {
      return candidate.id;
    }
  }

  for (let index = firstDeletedIndex + 1; index < flatNodes.length; index += 1) {
    const candidate = flatNodes[index];
    if (candidate && !deletedIds.has(candidate.id)) {
      return candidate.id;
    }
  }

  return null;
}

function collectDeletedIdsFromSelection(
  flatNodes: FlatOutlineNode[],
  selectedIds: string[],
): Set<string> {
  const deletedIds = new Set<string>();

  for (const id of selectedIds) {
    deletedIds.add(id);
    const startIndex = flatNodes.findIndex((node) => node.id === id);
    if (startIndex === -1) {
      continue;
    }

    const parentDepth = flatNodes[startIndex]?.depth ?? 0;
    for (let index = startIndex + 1; index < flatNodes.length; index += 1) {
      const node = flatNodes[index];
      if (!node || node.depth <= parentDepth) {
        break;
      }
      deletedIds.add(node.id);
    }
  }

  return deletedIds;
}

export async function runDeleteSelectedNodes(
  get: StoreGet,
  set: StoreSet,
  refresh: () => Promise<void>,
): Promise<void> {
  const { selectedIds, nodesByRootId, linkedReferenceNodesById, focusedNodeId } =
    get();
  if (selectedIds.length <= 1) {
    return;
  }

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const flatNodes = Object.values(nodesByRootId).flat();
  const deletedIds = collectDeletedIdsFromSelection(flatNodes, selectedIds);
  if (deletedIds.size === 0) {
    return;
  }

  const nextFocus = resolveFocusAfterBulkDelete(
    flatNodes,
    deletedIds,
    focusedNodeId,
  );

  for (const id of deletedIds) {
    cancelDebouncedUpdateContent(id);
  }

  set({
    nodesByRootId: applyOptimisticBulkDelete(nodesByRootId, deletedIds),
    linkedReferenceNodesById: applyOptimisticBulkDelete(
      linkedReferenceNodesById,
      deletedIds,
    ),
    focusedNodeId: nextFocus,
    selectedIds: [],
  });

  try {
    const deleted = await deleteOutlineNodes(db, selectedIds);
    if (!deleted) {
      await refresh();
      return;
    }
    await refresh();
    if (nextFocus) {
      set({ focusedNodeId: nextFocus });
    }
  } catch (error) {
    console.error("[deleteSelectedNodes] failed:", error);
    await refresh();
  }
}

export async function runDeleteNode(
  id: string,
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }
  const deleted = await deleteOutlineNode(db, id);
  if (!deleted) {
    return;
  }

  const { nodesByRootId, focusedNodeId, selectedIds } = get();
  const flatNodes = Object.values(nodesByRootId).flat();
  const nextSelected = selectedIds.filter((selectedId) => selectedId !== id);
  let nextFocus = focusedNodeId;

  if (focusedNodeId === id) {
    const index = flatNodes.findIndex((node) => node.id === id);
    const fallback = flatNodes[index - 1] ?? flatNodes[index + 1];
    nextFocus = fallback?.id ?? null;
  }

  set({ focusedNodeId: nextFocus, selectedIds: nextSelected });
}

export async function runToggleCollapse(id: string): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }
  await toggleCollapsed(db, id);
}

/** Disabled — deleting nodes on blur crashes Android IME. */
export async function runPruneEmptyBlock(
  _id: string,
  _content: BlockContentJSON,
  _get: StoreGet,
  _set: StoreSet,
): Promise<void> {}

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

export async function runMergeBlockWithPrevious(
  sourceId: string,
  get: StoreGet,
  set: StoreSet,
  remainder?: BlockContentJSON,
): Promise<void> {
  const { nodesByRootId } = get();
  const flatNodes = findFlatNodesForId(nodesByRootId, sourceId);
  const index = flatNodes.findIndex((node) => node.id === sourceId);
  if (index <= 0) {
    return;
  }

  const sourceNode = flatNodes[index];
  const targetNode = flatNodes[index - 1];
  if (
    !sourceNode ||
    !targetNode ||
    targetNode.id.startsWith("journal-") ||
    !shareSameTreeRoot(sourceNode, targetNode, flatNodes)
  ) {
    return;
  }

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const liveRemainder = remainder ?? sourceNode.content;
  const { merged } = mergeDocuments(targetNode.content, liveRemainder);

  set({
    nodesByRootId: applyOptimisticMerge(
      nodesByRootId,
      sourceId,
      targetNode.id,
      merged,
    ),
    focusedNodeId: targetNode.id,
    selectedIds: [],
  });

  void mergeNodes(db, targetNode.id, merged, sourceId);
}
