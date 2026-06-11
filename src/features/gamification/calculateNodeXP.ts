import type { FlatOutlineNode } from "../../domain/outliner/types";

export const BASE_XP = 10;
export const ROUTINE_XP = 3;
export const PENALTY_XP = -15;
/** @deprecated Use BASE_XP */
export const XP_PER_TASK = BASE_XP;

function isRoutine(tags: string[]): boolean {
  return (
    tags.includes("daily") ||
    tags.includes("routine") ||
    tags.includes("habit")
  );
}

export function calculateNodeXP(
  nodeId: string,
  flatNodes: FlatOutlineNode[] = [],
): number {
  const node = flatNodes.find((entry) => entry.id === nodeId);
  if (!node) {
    return 0;
  }

  if (node.task_status === "FAILED") {
    return PENALTY_XP;
  }

  const tags = node.metadata?.tags ?? [];
  const routine = isRoutine(tags);

  const children = flatNodes.filter(
    (entry) => entry.parent_id === nodeId && entry.task_status !== null,
  );

  if (children.length === 0) {
    return routine ? ROUTINE_XP : BASE_XP;
  }

  return children.reduce(
    (sum, child) => sum + calculateNodeXP(child.id, flatNodes),
    0,
  );
}

export function applyPomodoroBonus(
  baseXp: number,
  isPomodoroActive: boolean,
): number {
  if (!isPomodoroActive) {
    return baseXp;
  }
  return Math.floor(baseXp * 1.5);
}
