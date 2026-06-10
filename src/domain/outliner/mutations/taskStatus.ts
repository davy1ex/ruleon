import type { RuleonDb as DB } from "../../db/types";
import type { TaskStatus } from "../types";
import { currentTimestamp } from "../seed";

export function nextTaskStatus(current: TaskStatus | null): TaskStatus | null {
  if (current === null) {
    return "TODO";
  }
  if (current === "TODO") {
    return "DONE";
  }
  return null;
}

export async function toggleTaskStatus(db: DB, ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const placeholders = ids.map(() => "?").join(", ");
  await db.exec(
    `UPDATE outline_nodes
     SET task_status = CASE
       WHEN task_status IS NULL THEN 'TODO'
       WHEN task_status = 'TODO' THEN 'DONE'
       ELSE NULL
     END,
     updated_at = ?
     WHERE id IN (${placeholders})`,
    [currentTimestamp(), ...ids],
  );
}
