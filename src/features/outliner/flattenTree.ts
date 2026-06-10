import type {
  FlatOutlineNode,
  OutlineTreeNode,
} from "../../domain/outliner/types";

export function flattenNodeSubtree(node: OutlineTreeNode): FlatOutlineNode[] {
  const flat: FlatOutlineNode[] = [
    {
      ...node,
      depth: node.depth,
      hasChildren: node.children.length > 0,
    },
  ];

  if (node.collapsed === 0) {
    flat.push(...flattenTree(node.children));
  }

  return flat;
}

export function flattenTree(nodes: OutlineTreeNode[]): FlatOutlineNode[] {
  const flat: FlatOutlineNode[] = [];

  for (const node of nodes) {
    flat.push({
      ...node,
      depth: node.depth,
      hasChildren: node.children.length > 0,
    });

    if (node.collapsed === 0) {
      flat.push(...flattenTree(node.children));
    }
  }

  return flat;
}

export function toDisplayDepth(
  nodes: FlatOutlineNode[],
  baseDepth: number,
): FlatOutlineNode[] {
  return nodes.map((node) => ({
    ...node,
    depth: Math.max(0, node.depth - baseDepth),
  }));
}

export function flattenTreeForRoot(root: OutlineTreeNode): FlatOutlineNode[] {
  return toDisplayDepth(flattenTree(root.children), root.depth + 1);
}

export function flattenNodeSubtreeForAnchor(
  anchor: OutlineTreeNode,
): FlatOutlineNode[] {
  return toDisplayDepth(flattenNodeSubtree(anchor), anchor.depth);
}
