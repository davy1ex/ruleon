import { emptyNodeMetadata } from "../../domain/outliner/metadata";
import type { OutlineNodeRow } from "../../domain/outliner/types";
import { parseStoredContent } from "../../features/editor/serialization/parseStoredContent";

export function row(
  id: string,
  parentId: string | null,
  sortOrder: number,
  collapsed: 0 | 1 = 0,
  taskStatus: OutlineNodeRow["task_status"] = null,
): OutlineNodeRow {
  return {
    id,
    parent_id: parentId,
    content: parseStoredContent(id),
    sort_order: sortOrder,
    collapsed,
    task_status: taskStatus,
    metadata: emptyNodeMetadata(),
    created_at: sortOrder,
    updated_at: sortOrder,
  };
}
