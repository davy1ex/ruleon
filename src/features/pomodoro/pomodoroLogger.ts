import type { PomodoroEndReason } from "../../domain/kv/pomodoroState";
import { getDbContext } from "../../store/dbContext";
import { useOutlinerStore } from "../../store/outlinerStore";
import { usePomodoroStore } from "../../store/pomodoroStore";
import {
  formatPomodoroCancelLine,
  formatPomodoroFinishLine,
  formatPomodoroStartLine,
  pomoSessionBlockId,
} from "./formatPomodoroLogLine";
import {
  createPomoLogBlockIfAbsent,
  ensurePomoSectionId,
  resolveDayRootId,
  updatePomoLogBlock,
} from "./pomoSectionResolver";

interface PomodoroSessionLogSnapshot {
  dayPageTitle: string;
  startTimestamp: number;
  targetTimestamp: number;
  durationMs: number;
  description: string | null;
}

function toSessionSnapshot(state: {
  sessionDayPageTitle: string | null;
  startTimestamp: number | null;
  targetTimestamp: number | null;
  sessionDurationMs: number | null;
  sessionDescription: string | null;
}): PomodoroSessionLogSnapshot | null {
  if (
    !state.sessionDayPageTitle ||
    state.startTimestamp === null ||
    state.targetTimestamp === null ||
    state.sessionDurationMs === null
  ) {
    return null;
  }

  return {
    dayPageTitle: state.sessionDayPageTitle,
    startTimestamp: state.startTimestamp,
    targetTimestamp: state.targetTimestamp,
    durationMs: state.sessionDurationMs,
    description: state.sessionDescription,
  };
}

async function refreshOutlinerIfChanged(changed: boolean): Promise<void> {
  if (changed) {
    await useOutlinerStore.getState().refresh();
  }
}

export async function logPomodoroStart(
  snapshot: PomodoroSessionLogSnapshot,
): Promise<boolean> {
  const context = getDbContext();
  if (!context) {
    console.error("[pomodoroLogger] DB not ready");
    return false;
  }

  const { db } = context;
  const dayRootId = await resolveDayRootId(db, snapshot.dayPageTitle);
  const sectionId = await ensurePomoSectionId(db, dayRootId);
  const blockId = pomoSessionBlockId(snapshot.startTimestamp);
  const logLine = formatPomodoroStartLine(
    snapshot.startTimestamp,
    snapshot.durationMs,
    snapshot.description ?? undefined,
  );

  return createPomoLogBlockIfAbsent(db, sectionId, logLine, blockId);
}

export async function logPomodoroFinish(
  snapshot: PomodoroSessionLogSnapshot,
): Promise<boolean> {
  const context = getDbContext();
  if (!context) {
    console.error("[pomodoroLogger] DB not ready");
    return false;
  }

  const blockId = pomoSessionBlockId(snapshot.startTimestamp);
  const logLine = formatPomodoroFinishLine(
    snapshot.startTimestamp,
    snapshot.targetTimestamp,
    snapshot.durationMs,
    snapshot.description ?? undefined,
  );

  return updatePomoLogBlock(context.db, blockId, logLine);
}

export async function logPomodoroCancel(
  snapshot: PomodoroSessionLogSnapshot,
  cancelTimestamp: number,
): Promise<boolean> {
  const context = getDbContext();
  if (!context) {
    console.error("[pomodoroLogger] DB not ready");
    return false;
  }

  const blockId = pomoSessionBlockId(snapshot.startTimestamp);
  const logLine = formatPomodoroCancelLine(
    snapshot.startTimestamp,
    cancelTimestamp,
    snapshot.description ?? undefined,
  );

  return updatePomoLogBlock(context.db, blockId, logLine);
}

function handleSessionEnd(
  snapshot: PomodoroSessionLogSnapshot,
  reason: PomodoroEndReason,
): void {
  const writeLog =
    reason === "completed"
      ? logPomodoroFinish(snapshot)
      : logPomodoroCancel(snapshot, Date.now());

  void writeLog
    .then((changed) => refreshOutlinerIfChanged(changed))
    .catch((error) => {
      console.error("[pomodoroLogger] session end failed:", error);
    })
    .finally(() => {
      usePomodoroStore.getState().clearSessionLogMeta();
    });
}

export function subscribePomodoroLogger(): () => void {
  return usePomodoroStore.subscribe((state, prev) => {
    if (prev.status === "idle" && state.status === "running") {
      const snapshot = toSessionSnapshot(state);
      if (!snapshot) {
        return;
      }

      void logPomodoroStart(snapshot)
        .then((changed) => refreshOutlinerIfChanged(changed))
        .catch((error) => {
          console.error("[pomodoroLogger] start failed:", error);
        });
      return;
    }

    if (
      prev.status === "running" &&
      state.status === "idle" &&
      state.lastEndReason
    ) {
      const snapshot = toSessionSnapshot(state);
      if (!snapshot) {
        return;
      }

      handleSessionEnd(snapshot, state.lastEndReason);
    }
  });
}
