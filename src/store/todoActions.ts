import { handleTaskCompletion } from "../features/gamification/xpEngine";
import {
  cycleTaskStatus as cycleTaskStatusMutation,
  setTaskStatus as setTaskStatusMutation,
  toggleTaskCompletion as toggleTaskCompletionMutation,
} from "../domain/outliner/mutations/taskStatus";
import { applyTaskLifecycleMetadata } from "../domain/outliner/metadata";
import type {
  FlatOutlineNode,
  NodeMetadataPatch,
  TaskStatus,
} from "../domain/outliner/types";
import {
  nextTaskCompletion,
  nextTaskStatusCycle,
  taskStatusFromMetadata,
} from "../domain/outliner/types";
import { getDbContext } from "./dbContext";
import { patchPortalResultsTaskStatus } from "./portalActions";

type StoreGet = () => {
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
  portalResultsCache: Record<string, FlatOutlineNode[] | undefined>;
  focusedId: string | null;
  selectedIds: string[];
};

type StoreSet = (partial: {
  nodesByRootId?: Record<string, FlatOutlineNode[]>;
  linkedReferenceNodesById?: Record<string, FlatOutlineNode[]>;
  portalResultsCache?: Record<string, FlatOutlineNode[] | undefined>;
}) => void;

function patchTaskStatusInTrees(
  nodesByRootId: Record<string, FlatOutlineNode[]>,
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>,
  ids: string[],
  resolveNext: (current: TaskStatus | null) => TaskStatus | null,
): {
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
} {
  const idSet = new Set(ids);

  const patchNodes = (nodes: FlatOutlineNode[]): FlatOutlineNode[] =>
    nodes.map((node) => {
      if (!idSet.has(node.id)) {
        return node;
      }
      const nextStatus = resolveNext(node.task_status);
      return {
        ...node,
        task_status: nextStatus,
        metadata: applyTaskLifecycleMetadata(node.metadata, nextStatus),
      };
    });

  const nextNodesByRootId: Record<string, FlatOutlineNode[]> = {};
  for (const [rootId, nodes] of Object.entries(nodesByRootId)) {
    nextNodesByRootId[rootId] = patchNodes(nodes);
  }

  const nextLinkedReferenceNodesById: Record<string, FlatOutlineNode[]> = {};
  for (const [rootId, nodes] of Object.entries(linkedReferenceNodesById)) {
    nextLinkedReferenceNodesById[rootId] = patchNodes(nodes);
  }

  return {
    nodesByRootId: nextNodesByRootId,
    linkedReferenceNodesById: nextLinkedReferenceNodesById,
  };
}

function notifyTaskCompletions(
  changes: Array<{
    id: string;
    prevStatus: TaskStatus | null;
    nextStatus: TaskStatus | null;
  }>,
): void {
  for (const change of changes) {
    void handleTaskCompletion(change.id, change.nextStatus, change.prevStatus);
  }
}

export function resolveToggleTargets(
  state: { focusedId: string | null; selectedIds: string[] },
  nodeIdSet: Set<string>,
  explicitId?: string,
): string[] {
  const selectedInTree = state.selectedIds.filter((id) => nodeIdSet.has(id));
  if (selectedInTree.length > 0) {
    return selectedInTree;
  }

  if (explicitId && nodeIdSet.has(explicitId)) {
    return [explicitId];
  }

  if (state.focusedId && nodeIdSet.has(state.focusedId)) {
    return [state.focusedId];
  }

  return [];
}

async function runTaskStatusUpdate(
  ids: string | string[],
  get: StoreGet,
  set: StoreSet,
  resolveNext: (current: TaskStatus | null) => TaskStatus | null,
  persist: (
    db: NonNullable<ReturnType<typeof getDbContext>>["db"],
    idList: string[],
  ) => Promise<
    Array<{
      id: string;
      prevStatus: TaskStatus | null;
      nextStatus: TaskStatus | null;
    }>
  >,
): Promise<void> {
  const idList = Array.isArray(ids) ? ids : [ids];
  if (idList.length === 0) {
    return;
  }

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const state = get();
  const treePatch = patchTaskStatusInTrees(
    state.nodesByRootId,
    state.linkedReferenceNodesById,
    idList,
    resolveNext,
  );

  const sampleNode = Object.values(state.nodesByRootId)
    .flat()
    .find((node) => idList.includes(node.id));
  const nextStatus = sampleNode ? resolveNext(sampleNode.task_status) : null;

  set({
    ...treePatch,
    portalResultsCache: patchPortalResultsTaskStatus(
      state.portalResultsCache,
      idList,
      nextStatus,
    ),
  });

  const changes = await persist(db, idList);
  notifyTaskCompletions(changes);
}

export async function runCycleTaskStatus(
  ids: string | string[],
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  await runTaskStatusUpdate(
    ids,
    get,
    set,
    nextTaskStatusCycle,
    cycleTaskStatusMutation,
  );
}

/** @deprecated Use runCycleTaskStatus. */
export async function runToggleBlockTodoType(
  ids: string | string[],
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  await runCycleTaskStatus(ids, get, set);
}

export async function runToggleTaskCompletion(
  ids: string | string[],
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  await runTaskStatusUpdate(
    ids,
    get,
    set,
    nextTaskCompletion,
    toggleTaskCompletionMutation,
  );
}

export async function runUpdateNodeMetadata(
  ids: string | string[],
  patch: NodeMetadataPatch,
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  const idList = Array.isArray(ids) ? ids : [ids];
  if (idList.length === 0) {
    return;
  }

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const state = get();
  const resolveNext = (current: TaskStatus | null) =>
    taskStatusFromMetadata(current, patch);

  const treePatch = patchTaskStatusInTrees(
    state.nodesByRootId,
    state.linkedReferenceNodesById,
    idList,
    resolveNext,
  );

  const updatesByStatus = new Map<TaskStatus | null, string[]>();
  for (const rootNodes of Object.values(state.nodesByRootId)) {
    for (const node of rootNodes) {
      if (!idList.includes(node.id)) {
        continue;
      }
      const next = resolveNext(node.task_status);
      const bucket = updatesByStatus.get(next) ?? [];
      bucket.push(node.id);
      updatesByStatus.set(next, bucket);
    }
  }

  set({
    ...treePatch,
    portalResultsCache: Object.fromEntries(
      Object.entries(state.portalResultsCache).map(([key, rows]) => {
        if (!rows) {
          return [key, rows];
        }
        return [
          key,
          rows.map((row) =>
            idList.includes(row.id)
              ? {
                  ...row,
                  task_status: resolveNext(row.task_status),
                  metadata: applyTaskLifecycleMetadata(
                    row.metadata,
                    resolveNext(row.task_status),
                  ),
                }
              : row,
          ),
        ];
      }),
    ),
  });

  const changes: Array<{
    id: string;
    prevStatus: TaskStatus | null;
    nextStatus: TaskStatus | null;
  }> = [];

  for (const [status, groupedIds] of updatesByStatus) {
    const batchChanges = await setTaskStatusMutation(db, groupedIds, status);
    changes.push(...batchChanges);
  }

  notifyTaskCompletions(changes);
}

/** @deprecated Use runCycleTaskStatus or runToggleTaskCompletion. */
export async function runToggleTaskStatus(
  ids: string | string[],
  get: StoreGet,
  set: StoreSet,
): Promise<void> {
  await runCycleTaskStatus(ids, get, set);
}
