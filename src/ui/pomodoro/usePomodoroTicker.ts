import { useEffect, useState } from "react";
import {
  pomodoroRemainingMs,
  usePomodoroStore,
} from "../../store/pomodoroStore";

export function usePomodoroTicker(): number {
  const status = usePomodoroStore((s) => s.status);
  const targetTimestamp = usePomodoroStore((s) => s.targetTimestamp);
  const syncClock = usePomodoroStore((s) => s.syncClock);
  const [remainingMs, setRemainingMs] = useState(() =>
    pomodoroRemainingMs(status, targetTimestamp),
  );

  useEffect(() => {
    if (status !== "running" || targetTimestamp === null) {
      setRemainingMs(0);
      return;
    }

    let frameId = 0;

    const tick = () => {
      syncClock();
      const current = usePomodoroStore.getState();
      setRemainingMs(
        pomodoroRemainingMs(current.status, current.targetTimestamp),
      );
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [status, targetTimestamp, syncClock]);

  return remainingMs;
}
