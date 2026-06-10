import { formatDatePageTitle } from "../domain/pages/PageRegistry";
import {
  clearPomodoroSessionMeta,
  ensureDefaultPomodoroState,
  getPomodoroState,
  setPomodoroState,
  type PomodoroDbState,
} from "../domain/kv/pomodoroKv";
import { createNodeId } from "../domain/outliner/seed";
import { getDbContext } from "./dbContext";

let hydrating = false;
let syncListener: ((state: PomodoroDbState) => void) | null = null;

export function setPomodoroSyncListener(
  listener: (state: PomodoroDbState) => void,
): void {
  syncListener = listener;
}

export async function hydratePomodoroFromDb(): Promise<void> {
  const context = getDbContext();
  if (!context || hydrating) {
    return;
  }

  hydrating = true;
  try {
    const dbState = await getPomodoroState(context.db);
    syncListener?.(dbState);
  } finally {
    hydrating = false;
  }
}

export async function initPomodoroPersistence(): Promise<() => void> {
  const context = getDbContext();
  if (!context) {
    return () => {};
  }

  await ensureDefaultPomodoroState(context.db);
  await hydratePomodoroFromDb();

  return context.rx.onRange(["kv_state"], () => {
    void hydratePomodoroFromDb();
  });
}

export async function persistIdleDraft(
  patch: Partial<Pick<PomodoroDbState, "durationMs" | "description">>,
): Promise<void> {
  const context = getDbContext();
  if (!context) {
    return;
  }

  const current = await getPomodoroState(context.db);
  if (current.status !== "idle") {
    return;
  }

  await setPomodoroState(context.db, { ...current, ...patch });
}

export async function persistPomodoroStart(
  durationMs: number,
  description: string,
): Promise<void> {
  const context = getDbContext();
  if (!context || durationMs <= 0) {
    return;
  }

  const current = await getPomodoroState(context.db);
  if (current.status !== "idle") {
    return;
  }

  const sessionId = createNodeId();
  const startTimestamp = Date.now();
  const targetTimestamp = startTimestamp + durationMs;

  await setPomodoroState(context.db, {
    ...current,
    status: "running",
    durationMs,
    description,
    startTimestamp,
    targetTimestamp,
    sessionId,
    sessionDayPageTitle: formatDatePageTitle(),
    sessionDurationMs: durationMs,
    sessionDescription: description,
    lastEndReason: null,
  });
}

export async function persistPomodoroCancel(): Promise<void> {
  const context = getDbContext();
  if (!context) {
    return;
  }

  const current = await getPomodoroState(context.db);
  if (current.status !== "running") {
    return;
  }

  await setPomodoroState(context.db, {
    ...current,
    status: "idle",
    lastEndReason: "cancelled",
  });
}

export async function persistPomodoroCompleteIfExpired(): Promise<void> {
  const context = getDbContext();
  if (!context) {
    return;
  }

  const current = await getPomodoroState(context.db);
  if (
    current.status !== "running" ||
    current.targetTimestamp === null ||
    Date.now() < current.targetTimestamp
  ) {
    return;
  }

  await setPomodoroState(context.db, {
    ...current,
    status: "idle",
    lastEndReason: "completed",
  });
}

export async function persistClearPomodoroSessionMeta(): Promise<void> {
  const context = getDbContext();
  if (!context) {
    return;
  }
  await clearPomodoroSessionMeta(context.db);
}
