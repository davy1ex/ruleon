import type { DbContext } from "./types";
import { initWorkerDatabase } from "./initWorker";

export async function initDatabase(): Promise<DbContext> {
  return initWorkerDatabase();
}
