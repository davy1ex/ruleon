import type { FlatOutlineNode } from "../../domain/outliner/types";
import { INDENTATION_WIDTH_PX } from "./indentation";

export interface DragProjection {
  activeId: string;
  overId: string;
  depth: number;
  parentId: string;
  prevSiblingOrder: number | null;
  nextSiblingOrder: number | null;
  indicatorAnchorId: string;
  indicatorBelow: boolean;
}

export function isDescendantOf(
  nodes: FlatOutlineNode[],
  ancestorId: string,
  descendantId: string,
): boolean {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let current = byId.get(descendantId);
  while (current) {
    if (current.parent_id === ancestorId) {
      return true;
    }
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return false;
}

export function getDepthLimits(
  nodes: FlatOutlineNode[],
  insertIndex: number,
): { minDepth: number; maxDepth: number } {
  const previousItem = insertIndex > 0 ? nodes[insertIndex - 1] : null;
  const nextItem = insertIndex < nodes.length ? nodes[insertIndex] : null;

  return {
    maxDepth: previousItem ? previousItem.depth + 1 : 0,
    minDepth: nextItem ? nextItem.depth : 0,
  };
}

export function getProjectedDepth(
  activeDepth: number,
  dragOffsetX: number,
  minDepth: number,
  maxDepth: number,
  indentationWidth = INDENTATION_WIDTH_PX,
): number {
  const dragDepth = Math.round(dragOffsetX / indentationWidth);
  const projectedDepth = activeDepth + dragDepth;
  return Math.max(minDepth, Math.min(maxDepth, projectedDepth));
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

export function computeInsertIndex(
  nodes: FlatOutlineNode[],
  activeId: string,
  overId: string,
  depth: number,
): { items: FlatOutlineNode[]; insertIndex: number; overIndexInItems: number } {
  const activeIndex = nodes.findIndex((node) => node.id === activeId);
  const overIndex = nodes.findIndex((node) => node.id === overId);
  const overNode = nodes[overIndex];
  if (!overNode) {
    return { items: nodes, insertIndex: 0, overIndexInItems: 0 };
  }

  const items = nodes.filter((node) => node.id !== activeId);
  const overIndexInItems = items.findIndex((node) => node.id === overId);

  let insertIndex: number;
  if (depth > overNode.depth) {
    // Nest under over: first child slot
    insertIndex = overIndexInItems + 1;
  } else if (activeIndex < overIndex) {
    // Dragging down: place after over's entire subtree
    insertIndex = findInsertIndexAfterSubtree(items, overIndexInItems);
  } else {
    // Dragging up: place before over
    insertIndex = overIndexInItems;
  }

  return { items, insertIndex, overIndexInItems };
}

export function getParentIdAtDepth(
  nodes: FlatOutlineNode[],
  insertIndex: number,
  depth: number,
): string | null {
  if (depth === 0) {
    for (let index = insertIndex - 1; index >= 0; index -= 1) {
      const node = nodes[index];
      if (node && node.depth === 0) {
        return node.parent_id;
      }
    }
    for (let index = insertIndex; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (node && node.depth === 0) {
        return node.parent_id;
      }
    }
    return nodes[0]?.parent_id ?? null;
  }

  for (let index = insertIndex - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (node && node.depth === depth - 1) {
      return node.id;
    }
  }

  return null;
}

export function getSiblingSortOrders(
  nodes: FlatOutlineNode[],
  insertIndex: number,
  parentId: string,
): {
  prevSiblingOrder: number | null;
  nextSiblingOrder: number | null;
} {
  let prevSiblingOrder: number | null = null;
  for (let index = insertIndex - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (!node) {
      break;
    }
    if (node.parent_id === parentId) {
      prevSiblingOrder = node.sort_order;
      break;
    }
  }

  let nextSiblingOrder: number | null = null;
  for (let index = insertIndex; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node) {
      break;
    }
    if (node.parent_id === parentId) {
      nextSiblingOrder = node.sort_order;
      break;
    }
  }

  return { prevSiblingOrder, nextSiblingOrder };
}

export function computeDragProjection(
  nodes: FlatOutlineNode[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
): DragProjection | null {
  const activeNode = nodes.find((node) => node.id === activeId);
  const overNode = nodes.find((node) => node.id === overId);
  if (!activeNode || !overNode) {
    return null;
  }

  if (
    activeId === overId ||
    isDescendantOf(nodes, activeId, overId)
  ) {
    return null;
  }

  const depthHint = getProjectedDepth(
    activeNode.depth,
    dragOffsetX,
    0,
    overNode.depth + 1,
  );

  const { items, insertIndex: hintInsertIndex, overIndexInItems } =
    computeInsertIndex(nodes, activeId, overId, depthHint);
  const hintLimits = getDepthLimits(items, hintInsertIndex);
  const depth = getProjectedDepth(
    activeNode.depth,
    dragOffsetX,
    hintLimits.minDepth,
    hintLimits.maxDepth,
  );

  const {
    items: finalItems,
    insertIndex,
  } = computeInsertIndex(nodes, activeId, overId, depth);
  const finalLimits = getDepthLimits(finalItems, insertIndex);
  const finalDepth = getProjectedDepth(
    activeNode.depth,
    dragOffsetX,
    finalLimits.minDepth,
    finalLimits.maxDepth,
  );

  const {
    items: resolvedItems,
    insertIndex: finalInsertIndex,
  } = computeInsertIndex(nodes, activeId, overId, finalDepth);

  const parentId = getParentIdAtDepth(resolvedItems, finalInsertIndex, finalDepth);
  if (!parentId) {
    return null;
  }

  const { prevSiblingOrder, nextSiblingOrder } = getSiblingSortOrders(
    resolvedItems,
    finalInsertIndex,
    parentId,
  );

  const indicatorBelow =
    finalInsertIndex > overIndexInItems || finalDepth > overNode.depth;
  const indicatorAnchorId =
    indicatorBelow && finalInsertIndex > overIndexInItems + 1
      ? (resolvedItems[finalInsertIndex - 1]?.id ?? overId)
      : overId;

  return {
    activeId,
    overId,
    depth: finalDepth,
    parentId,
    prevSiblingOrder,
    nextSiblingOrder,
    indicatorAnchorId,
    indicatorBelow,
  };
}
