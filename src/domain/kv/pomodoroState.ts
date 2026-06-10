export type PomodoroStatus = "idle" | "running";
export type PomodoroEndReason = "completed" | "cancelled";

export interface PomodoroDbState {
  status: PomodoroStatus;
  startTimestamp: number | null;
  targetTimestamp: number | null;
  durationMs: number;
  description: string;
  sessionId: string | null;
  sessionDayPageTitle: string | null;
  sessionDurationMs: number | null;
  sessionDescription: string | null;
  lastEndReason: PomodoroEndReason | null;
}

export const POMODORO_KV_KEY = "pomodoro";

export const DEFAULT_DURATION_MS = 25 * 60 * 1000;

export const DEFAULT_POMODORO_DB_STATE: PomodoroDbState = {
  status: "idle",
  startTimestamp: null,
  targetTimestamp: null,
  durationMs: DEFAULT_DURATION_MS,
  description: "",
  sessionId: null,
  sessionDayPageTitle: null,
  sessionDurationMs: null,
  sessionDescription: null,
  lastEndReason: null,
};

export function parsePomodoroDbState(raw: string | null): PomodoroDbState {
  if (!raw) {
    return { ...DEFAULT_POMODORO_DB_STATE };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PomodoroDbState>;
    return {
      status: parsed.status === "running" ? "running" : "idle",
      startTimestamp:
        typeof parsed.startTimestamp === "number" ? parsed.startTimestamp : null,
      targetTimestamp:
        typeof parsed.targetTimestamp === "number"
          ? parsed.targetTimestamp
          : null,
      durationMs:
        typeof parsed.durationMs === "number" && parsed.durationMs > 0
          ? parsed.durationMs
          : DEFAULT_DURATION_MS,
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      sessionId:
        typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      sessionDayPageTitle:
        typeof parsed.sessionDayPageTitle === "string"
          ? parsed.sessionDayPageTitle
          : null,
      sessionDurationMs:
        typeof parsed.sessionDurationMs === "number"
          ? parsed.sessionDurationMs
          : null,
      sessionDescription:
        typeof parsed.sessionDescription === "string"
          ? parsed.sessionDescription
          : null,
      lastEndReason:
        parsed.lastEndReason === "completed" ||
        parsed.lastEndReason === "cancelled"
          ? parsed.lastEndReason
          : null,
    };
  } catch {
    return { ...DEFAULT_POMODORO_DB_STATE };
  }
}

export function serializePomodoroDbState(state: PomodoroDbState): string {
  return JSON.stringify(state);
}
