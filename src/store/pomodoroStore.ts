import { create } from "zustand";
import type { PomodoroDbState } from "../domain/kv/pomodoroKv";
import {
  DEFAULT_DURATION_MS,
  type PomodoroEndReason,
  type PomodoroStatus,
} from "../domain/kv/pomodoroState";
import {
  persistClearPomodoroSessionMeta,
  persistIdleDraft,
  persistPomodoroCancel,
  persistPomodoroCompleteIfExpired,
  persistPomodoroStart,
  setPomodoroSyncListener,
} from "./pomodoroPersistence";

export type { PomodoroEndReason, PomodoroStatus };

interface PomodoroState extends PomodoroDbState {
  setDurationMs: (ms: number) => void;
  setDescription: (text: string) => void;
  start: () => void;
  cancel: () => void;
  syncClock: () => void;
  syncFromDb: (dbState: PomodoroDbState) => void;
  clearSessionLogMeta: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  status: "idle",
  description: "",
  durationMs: DEFAULT_DURATION_MS,
  targetTimestamp: null,
  startTimestamp: null,
  sessionId: null,
  sessionDayPageTitle: null,
  sessionDurationMs: null,
  sessionDescription: null,
  lastEndReason: null,

  setDurationMs: (ms) => {
    if (get().status !== "idle" || ms <= 0) {
      return;
    }
    set({ durationMs: ms });
    void persistIdleDraft({ durationMs: ms });
  },

  setDescription: (text) => {
    if (get().status !== "idle") {
      return;
    }
    set({ description: text });
    void persistIdleDraft({ description: text });
  },

  start: () => {
    const { durationMs, description } = get();
    void persistPomodoroStart(durationMs, description);
  },

  cancel: () => {
    void persistPomodoroCancel();
  },

  syncClock: () => {
    void persistPomodoroCompleteIfExpired();
  },

  syncFromDb: (dbState) => {
    set(dbState);
  },

  clearSessionLogMeta: () => {
    void persistClearPomodoroSessionMeta();
  },
}));

export function pomodoroRemainingMs(
  status: PomodoroStatus,
  targetTimestamp: number | null,
): number {
  if (status !== "running" || targetTimestamp === null) {
    return 0;
  }
  return Math.max(0, targetTimestamp - Date.now());
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isPomodoroRunning(): boolean {
  return usePomodoroStore.getState().status === "running";
}

setPomodoroSyncListener((dbState) => {
  usePomodoroStore.getState().syncFromDb(dbState);
});
