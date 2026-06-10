export function formatPomodoroClock(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateIdFromPrefix(prefix: string, seed: number): string {
  return `${prefix}-${seed}`;
}

export function pomoSessionBlockId(startTimestamp: number): string {
  return generateIdFromPrefix("pomo", startTimestamp);
}

function formatDurationLabel(durationMs: number): string {
  const minutes = Math.round(durationMs / 60_000);
  return `${minutes}m`;
}

function appendDescription(base: string, description?: string): string {
  const trimmed = description?.trim();
  if (trimmed) {
    return `${base}: ${trimmed}`;
  }
  return base;
}

export function formatPomodoroStartLine(
  startTimestamp: number,
  durationMs: number,
  description?: string,
): string {
  const start = formatPomodoroClock(startTimestamp);
  const duration = formatDurationLabel(durationMs);
  return appendDescription(`▶️ ${start} - ... (${duration})`, description);
}

export function formatPomodoroFinishLine(
  startTimestamp: number,
  targetTimestamp: number,
  durationMs: number,
  description?: string,
): string {
  const start = formatPomodoroClock(startTimestamp);
  const end = formatPomodoroClock(targetTimestamp);
  const duration = formatDurationLabel(durationMs);
  return appendDescription(`✅ ${start} - ${end} (${duration})`, description);
}

export function formatPomodoroCancelLine(
  startTimestamp: number,
  cancelTimestamp: number,
  description?: string,
): string {
  const start = formatPomodoroClock(startTimestamp);
  const end = formatPomodoroClock(cancelTimestamp);
  return appendDescription(`❌ ${start} - ${end} (Отменен)`, description);
}
