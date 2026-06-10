import { disposeModules } from "../modules";
import type { DbContext } from "../domain/db/types";

let dbContext: DbContext | null = null;
let disposeRx: (() => void) | null = null;

export function getDbContext(): DbContext | null {
  return dbContext;
}

export function setDbContext(context: DbContext): void {
  dbContext = context;
}

export function setDisposeRx(dispose: () => void): void {
  disposeRx = dispose;
}

export function disposeOutlinerStore(): void {
  disposeRx?.();
  disposeRx = null;
  disposeModules();
  const context = dbContext;
  dbContext = null;
  void context?.dispose?.();
}
