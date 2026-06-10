import type { OutlineNodeRow, OutlineTreeNode } from "../../domain/outliner/types";

export function buildTree(rows: OutlineNodeRow[]): OutlineTreeNode[] {
  const byParent = new Map<string | null, OutlineNodeRow[]>();

  for (const row of rows) {
    const siblings = byParent.get(row.parent_id) ?? [];
    siblings.push(row);
    byParent.set(row.parent_id, siblings);
  }

  for (const siblings of byParent.values()) {
    siblings.sort(compareRows);
  }

  return buildLevel(byParent, null, 0);
}

function buildLevel(
  byParent: Map<string | null, OutlineNodeRow[]>,
  parentId: string | null,
  depth: number,
): OutlineTreeNode[] {
  const rows = byParent.get(parentId) ?? [];
  return rows.map((row) => ({
    ...row,
    depth,
    children: buildLevel(byParent, row.id, depth + 1),
  }));
}

function compareRows(a: OutlineNodeRow, b: OutlineNodeRow): number {
  if (a.sort_order !== b.sort_order) {
    return a.sort_order - b.sort_order;
  }
  return a.created_at - b.created_at;
}
