import {
  applyPomodoroBonus,
  calculateNodeXP,
} from "./calculateNodeXP";
import { patchNodeMetadataFields } from "../../domain/outliner/mutations/patchNodeMetadata";
import type { FlatOutlineNode, TaskStatus } from "../../domain/outliner/types";
import { getDbContext } from "../../store/dbContext";
import { useGamificationStore } from "../../store/gamificationStore";
import { useOutlinerStore } from "../../store/outlinerStore";
import { isPomodoroRunning } from "../../store/pomodoroStore";
import { showXpToast } from "../../store/toastStore";
import { useWorkspaceStore } from "../../store/workspaceStore";

function findFlatNode(nodeId: string): FlatOutlineNode | null {
  const state = useOutlinerStore.getState();
  for (const nodes of Object.values(state.nodesByRootId)) {
    const node = nodes.find((entry) => entry.id === nodeId);
    if (node) {
      return node;
    }
  }
  for (const nodes of Object.values(state.linkedReferenceNodesById)) {
    const node = nodes.find((entry) => entry.id === nodeId);
    if (node) {
      return node;
    }
  }
  return null;
}

function patchNodeMetadataInStore(
  nodeId: string,
  metadata: FlatOutlineNode["metadata"],
): void {
  const patchNodes = (nodes: FlatOutlineNode[]) =>
    nodes.map((node) =>
      node.id === nodeId ? { ...node, metadata } : node,
    );

  useOutlinerStore.setState((state) => ({
    nodesByRootId: Object.fromEntries(
      Object.entries(state.nodesByRootId).map(([rootId, nodes]) => [
        rootId,
        patchNodes(nodes),
      ]),
    ),
    linkedReferenceNodesById: Object.fromEntries(
      Object.entries(state.linkedReferenceNodesById).map(([rootId, nodes]) => [
        rootId,
        patchNodes(nodes),
      ]),
    ),
  }));
}

function isTerminalStatus(status: TaskStatus | null): boolean {
  return status === "DONE" || status === "FAILED";
}

export async function handleTaskCompletion(
  nodeId: string,
  newStatus: TaskStatus | null,
  oldStatus: TaskStatus | null,
): Promise<void> {
  const { plugins } = useWorkspaceStore.getState();
  if (!plugins.gamification) {
    return;
  }

  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  const node = findFlatNode(nodeId);
  if (!node || oldStatus === newStatus) {
    return;
  }

  const wasTerminal = isTerminalStatus(oldStatus);
  const isTerminal = isTerminalStatus(newStatus);

  if (wasTerminal) {
    const xpToRevoke = node.metadata.awarded_xp ?? 0;
    if (xpToRevoke !== 0) {
      await useGamificationStore.getState().addXp(-xpToRevoke);
      showXpToast(-xpToRevoke);
    }

    const nextMetadata = await patchNodeMetadataFields(db, nodeId, (metadata) => {
      const next = { ...metadata };
      delete next.awarded_xp;
      return next;
    });
    if (nextMetadata) {
      patchNodeMetadataInStore(nodeId, nextMetadata);
    }
  }

  if (isTerminal) {
    const flatNodes = Object.values(
      useOutlinerStore.getState().nodesByRootId,
    ).flat();
    const baseEarned = calculateNodeXP(nodeId, flatNodes);
    const finalXp =
      newStatus === "DONE"
        ? applyPomodoroBonus(baseEarned, isPomodoroRunning())
        : baseEarned;

    await useGamificationStore.getState().addXp(finalXp);
    showXpToast(finalXp);

    const nextMetadata = await patchNodeMetadataFields(db, nodeId, (metadata) => ({
      ...metadata,
      awarded_xp: finalXp,
    }));
    if (nextMetadata) {
      patchNodeMetadataInStore(nodeId, nextMetadata);
    }
  }
}

export { hydrateGamificationFromDB } from "../../store/gamificationStore";
