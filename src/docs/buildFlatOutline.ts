import { emptyNodeMetadata } from "../domain/outliner/metadata";
import type { FlatOutlineNode, TaskStatus } from "../domain/outliner/types";
import { paragraph } from "./contentHelpers";

export interface OutlineContentItem {
  id: string;
  text: string;
  taskStatus?: TaskStatus | null;
  children?: OutlineContentItem[];
}

export function buildFlatOutline(
  items: OutlineContentItem[],
  parentId: string | null = null,
  depth = 0,
  sortBase = 0,
): FlatOutlineNode[] {
  const result: FlatOutlineNode[] = [];

  items.forEach((item, index) => {
    const hasChildren = (item.children?.length ?? 0) > 0;
    result.push({
      id: item.id,
      parent_id: parentId,
      content: paragraph(item.text),
      sort_order: sortBase + index,
      collapsed: 0,
      task_status: item.taskStatus ?? null,
      metadata: emptyNodeMetadata(),
      created_at: 0,
      updated_at: 0,
      depth,
      hasChildren,
    });

    if (item.children?.length) {
      result.push(...buildFlatOutline(item.children, item.id, depth + 1));
    }
  });

  return result;
}
