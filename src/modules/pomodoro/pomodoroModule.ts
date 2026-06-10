import { subscribePomodoroLogger } from "../../features/pomodoro/pomodoroLogger";
import {
  hydratePomodoroFromDb,
  initPomodoroPersistence,
} from "../../store/pomodoroPersistence";

let disposeRx: (() => void) | null = null;
let disposeLogger: (() => void) | null = null;

export async function initPomodoroModule(): Promise<void> {
  if (disposeRx || disposeLogger) {
    return;
  }

  disposeRx = await initPomodoroPersistence();
  disposeLogger = subscribePomodoroLogger();
}

export function disposePomodoroModule(): void {
  disposeLogger?.();
  disposeLogger = null;
  disposeRx?.();
  disposeRx = null;
}

export { hydratePomodoroFromDb };
