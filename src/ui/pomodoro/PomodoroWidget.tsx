import { Button } from "../Button";
import { Input } from "../Input";
import {
  formatRemainingTime,
  usePomodoroStore,
} from "../../store/pomodoroStore";
import { usePomodoroTicker } from "./usePomodoroTicker";

interface PomodoroWidgetProps {
  compact?: boolean;
}

export function PomodoroWidget({ compact = false }: PomodoroWidgetProps) {
  const status = usePomodoroStore((s) => s.status);
  const description = usePomodoroStore((s) => s.description);
  const durationMs = usePomodoroStore((s) => s.durationMs);
  const setDescription = usePomodoroStore((s) => s.setDescription);
  const setDurationMs = usePomodoroStore((s) => s.setDurationMs);
  const start = usePomodoroStore((s) => s.start);
  const cancel = usePomodoroStore((s) => s.cancel);
  const remainingMs = usePomodoroTicker();

  const isRunning = status === "running";
  const durationMinutes = Math.round(durationMs / 60_000);

  const handleDurationChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setDurationMs(parsed * 60_000);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${compact ? "px-2 py-2" : "px-3 py-2"}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Pomodoro
      </h3>

      <div
        className={`font-mono tabular-nums text-text-normal ${
          compact ? "text-2xl" : "text-3xl"
        }`}
        aria-live="polite"
      >
        {isRunning ? formatRemainingTime(remainingMs) : formatRemainingTime(durationMs)}
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Duration (min)</span>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            disabled={isRunning}
            onChange={(event) => handleDurationChange(event.target.value)}
            className="w-full rounded border border-border bg-transparent px-2 py-1 font-mono text-sm outline-none focus:border-accent disabled:opacity-50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Description</span>
          <div
            className={`rounded border border-border px-2 ${
              isRunning ? "opacity-50" : ""
            }`}
          >
            <Input
              value={description}
              placeholder="Optional focus task"
              onChange={(value) => {
                if (!isRunning) {
                  setDescription(value);
                }
              }}
            />
          </div>
        </label>
      </div>

      <div className="flex gap-2">
        {isRunning ? (
          <Button label="Cancel" onClick={cancel} variant="primary" />
        ) : (
          <Button label="Start" onClick={start} variant="primary" />
        )}
      </div>
    </div>
  );
}
