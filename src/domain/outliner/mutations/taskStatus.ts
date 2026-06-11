import type { RuleonDb as DB } from "../../db/types";
import {
  applyTaskLifecycleMetadata,
  parseMetadata,
  serializeMetadata,
} from "../metadata";
import {
  nextTaskStatusCycle,
  type TaskStatus,
} from "../types";
import { currentTimestamp } from "../seed";

function parseTaskStatus(raw: string | null | undefined): TaskStatus | null {
  if (raw === "TODO" || raw === "DONE" || raw === "FAILED") {
    return raw;
  }
  return null;
}

interface NodeTaskRow {
  id: string;
  task_status: string | null;
  metadata: string;
}

export interface TaskStatusChange {
  id: string;
  prevStatus: TaskStatus | null;
  nextStatus: TaskStatus | null;
}

async function fetchNodeTaskRows(
  db: DB,
  ids: string[],
): Promise<NodeTaskRow[]> {
  const placeholders = ids.map(() => "?").join(", ");
  const stmt = await db.prepare(
    `SELECT id, task_status, metadata
     FROM outline_nodes
     WHERE id IN (${placeholders})`,
  );
  const rows = (await stmt.all(null, ...ids)) as NodeTaskRow[];
  await stmt.finalize(null);
  return rows;
}

async function writeNodeTaskState(
  db: DB,
  id: string,
  status: TaskStatus | null,
  metadataJson: string,
): Promise<void> {
  await db.exec(
    `UPDATE outline_nodes
     SET task_status = ?, metadata = ?, updated_at = ?
     WHERE id = ?`,
    [status, metadataJson, currentTimestamp(), id],
  );
}

async function applyTaskStatusChanges(
  db: DB,
  ids: string[],
  resolveNext: (current: TaskStatus | null) => TaskStatus | null,
): Promise<TaskStatusChange[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await fetchNodeTaskRows(db, ids);
  const changes: TaskStatusChange[] = [];

  for (const row of rows) {
    const prevStatus = parseTaskStatus(row.task_status);
    const nextStatus = resolveNext(prevStatus);
    const metadata = applyTaskLifecycleMetadata(
      parseMetadata(row.metadata),
      nextStatus,
    );
    await writeNodeTaskState(
      db,
      row.id,
      nextStatus,
      serializeMetadata(metadata),
    );
    changes.push({ id: row.id, prevStatus, nextStatus });
  }

  return changes;
}

/** @deprecated Use nextTaskStatusCycle instead. */
export function nextTaskStatus(current: TaskStatus | null): TaskStatus | null {
  return nextTaskStatusCycle(current);
}

export async function setTaskStatus(
  db: DB,
  ids: string[],
  status: TaskStatus | null,
): Promise<TaskStatusChange[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await fetchNodeTaskRows(db, ids);
  const changes: TaskStatusChange[] = [];

  for (const row of rows) {
    const prevStatus = parseTaskStatus(row.task_status);
    const metadata = applyTaskLifecycleMetadata(
      parseMetadata(row.metadata),
      status,
    );
    await writeNodeTaskState(
      db,
      row.id,
      status,
      serializeMetadata(metadata),
    );
    changes.push({ id: row.id, prevStatus, nextStatus: status });
  }

  return changes;
}

export async function cycleTaskStatus(
  db: DB,
  ids: string[],
): Promise<TaskStatusChange[]> {
  return applyTaskStatusChanges(db, ids, nextTaskStatusCycle);
}

/** @deprecated Use cycleTaskStatus instead. */
export async function toggleBlockTodoType(
  db: DB,
  ids: string[],
): Promise<TaskStatusChange[]> {
  return cycleTaskStatus(db, ids);
}

export async function toggleTaskCompletion(
  db: DB,
  ids: string[],
): Promise<TaskStatusChange[]> {
  return applyTaskStatusChanges(db, ids, (current) => {
    if (current === "TODO") {
      return "DONE";
    }
    if (current === "DONE") {
      return "TODO";
    }
    return "TODO";
  });
}

/** @deprecated Use cycleTaskStatus or toggleTaskCompletion instead. */
export async function toggleTaskStatus(
  db: DB,
  ids: string[],
): Promise<TaskStatusChange[]> {
  return cycleTaskStatus(db, ids);
}
