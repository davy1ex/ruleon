import type { RuleonDb as DB } from "../db/types";
import { setKvValue } from "./mutations";
import { getKvValue } from "./queries";
import {
  DEFAULT_POMODORO_DB_STATE,
  parsePomodoroDbState,
  POMODORO_KV_KEY,
  serializePomodoroDbState,
  type PomodoroDbState,
} from "./pomodoroState";

export type { PomodoroDbState, PomodoroEndReason, PomodoroStatus } from "./pomodoroState";
export {
  DEFAULT_DURATION_MS,
  DEFAULT_POMODORO_DB_STATE,
  POMODORO_KV_KEY,
} from "./pomodoroState";

export async function getPomodoroState(db: DB): Promise<PomodoroDbState> {
  const raw = await getKvValue(db, POMODORO_KV_KEY);
  return parsePomodoroDbState(raw);
}

export async function setPomodoroState(
  db: DB,
  state: PomodoroDbState,
): Promise<void> {
  await setKvValue(db, POMODORO_KV_KEY, serializePomodoroDbState(state));
}

export async function clearPomodoroSessionMeta(db: DB): Promise<void> {
  const current = await getPomodoroState(db);
  await setPomodoroState(db, {
    ...current,
    sessionId: null,
    sessionDayPageTitle: null,
    sessionDurationMs: null,
    sessionDescription: null,
    startTimestamp: null,
    targetTimestamp: null,
    lastEndReason: null,
  });
}

export async function ensureDefaultPomodoroState(db: DB): Promise<void> {
  const raw = await getKvValue(db, POMODORO_KV_KEY);
  if (raw === null) {
    await setPomodoroState(db, { ...DEFAULT_POMODORO_DB_STATE });
  }
}
