import type { FlatOutlineNode } from "../../domain/outliner/types";

export function getPreviousBlockInFlat(
  nodes: FlatOutlineNode[],
  nodeId: string,
): FlatOutlineNode | null {
  const index = nodes.findIndex((node) => node.id === nodeId);
  return index > 0 ? (nodes[index - 1] ?? null) : null;
}

export function getNextBlockInFlat(
  nodes: FlatOutlineNode[],
  nodeId: string,
): FlatOutlineNode | null {
  const index = nodes.findIndex((node) => node.id === nodeId);
  return index >= 0 && index < nodes.length - 1
    ? (nodes[index + 1] ?? null)
    : null;
}

export function getParentBlockInFlat(
  nodes: FlatOutlineNode[],
  nodeId: string,
): FlatOutlineNode | null {
  const node = nodes.find((entry) => entry.id === nodeId);
  if (!node?.parent_id) {
    return null;
  }
  return nodes.find((entry) => entry.id === node.parent_id) ?? null;
}

export function getFirstChildBlockInFlat(
  nodes: FlatOutlineNode[],
  nodeId: string,
): FlatOutlineNode | null {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index === -1) {
    return null;
  }

  const parent = nodes[index];
  for (let childIndex = index + 1; childIndex < nodes.length; childIndex += 1) {
    const candidate = nodes[childIndex];
    if (!candidate || candidate.depth <= parent.depth) {
      break;
    }
    if (candidate.parent_id === parent.id) {
      return candidate;
    }
  }

  return null;
}

export function resolveShiftArrowTarget(
  nodes: FlatOutlineNode[],
  headId: string,
  key: string,
): FlatOutlineNode | null {
  switch (key) {
    case "ArrowUp":
      return getPreviousBlockInFlat(nodes, headId);
    case "ArrowDown":
      return getNextBlockInFlat(nodes, headId);
    case "ArrowLeft":
      return getParentBlockInFlat(nodes, headId);
    case "ArrowRight":
      return getFirstChildBlockInFlat(nodes, headId);
    default:
      return null;
  }
}
