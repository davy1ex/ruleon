import {
  nextTaskStatus,
  toggleTaskStatus as toggleTaskStatusMutation,
} from "../domain/outliner/mutations/taskStatus";
import type { FlatOutlineNode } from "../domain/outliner/types";
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
): {
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
} {
  const idSet = new Set(ids);

  const patchNodes = (nodes: FlatOutlineNode[]): FlatOutlineNode[] =>
    nodes.map((node) =>
      idSet.has(node.id)
        ? { ...node, task_status: nextTaskStatus(node.task_status) }
        : node,
    );

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

export async function runToggleTaskStatus(
  ids: string | string[],
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
  const treePatch = patchTaskStatusInTrees(
    state.nodesByRootId,
    state.linkedReferenceNodesById,
    idList,
  );

  const sampleNode = Object.values(state.nodesByRootId)
    .flat()
    .find((node) => idList.includes(node.id));
  const nextStatus = sampleNode
    ? nextTaskStatus(sampleNode.task_status)
    : null;

  set({
    ...treePatch,
    portalResultsCache: patchPortalResultsTaskStatus(
      state.portalResultsCache,
      idList,
      nextStatus,
    ),
  });

  await toggleTaskStatusMutation(db, idList);
}
