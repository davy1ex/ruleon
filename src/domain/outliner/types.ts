import type { BlockContentJSON } from "./contentTypes";

export type { BlockContentJSON, BlockDocumentJSON, BlockContentNode } from "./contentTypes";

export type TaskStatus = "TODO" | "DONE";

export interface BlockLinkRow {
  source_block_id: string;
  target_text: string;
}

export interface OutlineNodeRow {
  id: string;
  parent_id: string | null;
  content: BlockContentJSON;
  sort_order: number;
  collapsed: 0 | 1;
  task_status: TaskStatus | null;
  created_at: number;
  updated_at: number;
}

export interface OutlineTreeNode extends OutlineNodeRow {
  depth: number;
  children: OutlineTreeNode[];
}

export interface FlatOutlineNode extends OutlineNodeRow {
  depth: number;
  hasChildren: boolean;
}

export interface PageListItem {
  id: string;
  content: string;
}

export interface TrashedPageItem {
  id: string;
  content: string;
  trashed_at: number;
}

/** Raw DB row before content parsing. */
export interface OutlineNodeDbRow {
  id: string;
  parent_id: string | null;
  content: string;
  sort_order: number;
  collapsed: 0 | 1;
  task_status: string | null;
  created_at: number;
  updated_at: number;
}
