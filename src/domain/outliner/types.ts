import type { BlockContentJSON } from "./contentTypes";
import type { NodeMetadata } from "./metadata";

export type { BlockContentJSON, BlockDocumentJSON, BlockContentNode } from "./contentTypes";

export type TaskStatus = "TODO" | "DONE" | "FAILED";

/** Semantic block type derived from `task_status`. */
export type BlockType = "text" | "todo";

/** Todo completion state when `type === "todo"`. */
export type BlockTodoStatus = "todo" | "done";

export interface NodeMetadataPatch {
  type?: BlockType;
  status?: BlockTodoStatus;
}

export function getBlockType(taskStatus: TaskStatus | null): BlockType {
  return taskStatus === null ? "text" : "todo";
}

export function getBlockTodoStatus(
  taskStatus: TaskStatus | null,
): BlockTodoStatus | undefined {
  if (taskStatus === "TODO") {
    return "todo";
  }
  if (taskStatus === "DONE") {
    return "done";
  }
  return undefined;
}

export function taskStatusFromMetadata(
  current: TaskStatus | null,
  patch: NodeMetadataPatch,
): TaskStatus | null {
  if (patch.type === "text") {
    return null;
  }
  if (patch.type === "todo") {
    return patch.status === "done" ? "DONE" : "TODO";
  }
  if (patch.status === "done") {
    return "DONE";
  }
  if (patch.status === "todo") {
    return "TODO";
  }
  return current;
}

export function nextBlockTodoType(current: TaskStatus | null): TaskStatus | null {
  return current === null ? "TODO" : null;
}

/** Cmd+Enter cycle: text → todo → done → failed → text. */
export function nextTaskStatusCycle(current: TaskStatus | null): TaskStatus | null {
  if (current === null) {
    return "TODO";
  }
  if (current === "TODO") {
    return "DONE";
  }
  if (current === "DONE") {
    return "FAILED";
  }
  return null;
}

export function nextTaskCompletion(current: TaskStatus | null): TaskStatus | null {
  if (current === "TODO") {
    return "DONE";
  }
  if (current === "DONE") {
    return "TODO";
  }
  return "TODO";
}

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
  metadata: NodeMetadata;
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
  metadata: string;
  created_at: number;
  updated_at: number;
}
