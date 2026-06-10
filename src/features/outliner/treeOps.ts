import type { FlatOutlineNode, OutlineNodeRow } from "../../domain/outliner/types";

export function findPreviousFlatNode(
  flatNodes: FlatOutlineNode[],
  nodeId: string,
): FlatOutlineNode | null {
  const index = flatNodes.findIndex((node) => node.id === nodeId);
  if (index <= 0) {
    return null;
  }
  return flatNodes[index - 1] ?? null;
}

export function canIndent(
  nodeId: string,
  rows: OutlineNodeRow[],
): boolean {
  const node = rows.find((row) => row.id === nodeId);
  if (!node) {
    return false;
  }

  const siblings = rows.filter((row) => row.parent_id === node.parent_id);
  siblings.sort((a, b) => a.sort_order - b.sort_order);
  const index = siblings.findIndex((row) => row.id === nodeId);
  return index > 0;
}

export function canOutdent(
  nodeId: string,
  rows: OutlineNodeRow[],
): boolean {
  const node = rows.find((row) => row.id === nodeId);
  if (!node || node.parent_id === null) {
    return false;
  }

  const parent = rows.find((row) => row.id === node.parent_id);
  if (!parent || parent.parent_id === null || parent.id.startsWith("journal-")) {
    return false;
  }

  return true;
}

export function resolveTreeRootId(
  node: Pick<OutlineNodeRow, "id" | "parent_id">,
  rows: OutlineNodeRow[],
): string | null {
  const byId = new Map(rows.map((row) => [row.id, row]));
  let currentParentId: string | null = node.parent_id;

  while (currentParentId) {
    if (currentParentId.startsWith("journal-")) {
      return currentParentId;
    }
    const parent = byId.get(currentParentId);
    if (!parent) {
      return currentParentId;
    }
    currentParentId = parent.parent_id;
  }

  return null;
}

export function shareSameTreeRoot(
  a: Pick<OutlineNodeRow, "id" | "parent_id">,
  b: Pick<OutlineNodeRow, "id" | "parent_id">,
  rows: OutlineNodeRow[],
): boolean {
  const rootA = resolveTreeRootId(a, rows);
  const rootB = resolveTreeRootId(b, rows);
  return rootA !== null && rootA === rootB;
}

export function canDelete(rows: OutlineNodeRow[]): boolean {
  return rows.length > 1;
}
