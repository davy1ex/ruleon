import type { FlatOutlineNode, OutlineNodeRow } from "../../domain/outliner/types";
import { findTreeNode } from "../../store/journal";
import { buildTree } from "./buildTree";
import { flattenNodeSubtreeForAnchor } from "./flattenTree";

export function buildFlatSubtreeForAnchor(
  anchorId: string,
  rows: OutlineNodeRow[],
): FlatOutlineNode[] {
  const tree = buildTree(rows);
  const anchor = findTreeNode(tree, anchorId);
  if (!anchor) {
    return [];
  }
  return flattenNodeSubtreeForAnchor(anchor);
}
