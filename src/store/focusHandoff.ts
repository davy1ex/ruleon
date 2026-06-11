/** Guards DOM focus during block split / sibling creation (Android IME). */
let handoffTargetId: string | null = null;
let handoffUntil = 0;
let handoffBlocking = false;

export function beginFocusHandoffBlocking(durationMs = 800): void {
  handoffBlocking = true;
  handoffTargetId = null;
  handoffUntil = Date.now() + durationMs;
}

export function beginFocusHandoff(targetId: string, durationMs = 800): void {
  handoffBlocking = false;
  handoffTargetId = targetId;
  handoffUntil = Date.now() + durationMs;
}

export function clearFocusHandoff(): void {
  handoffTargetId = null;
  handoffUntil = 0;
  handoffBlocking = false;
}

export function isFocusHandoffActive(): boolean {
  return (handoffBlocking || handoffTargetId !== null) && Date.now() < handoffUntil;
}

export function getFocusHandoffTarget(): string | null {
  return isFocusHandoffActive() ? handoffTargetId : null;
}

export function shouldAcceptBlockFocus(nodeId: string | null): boolean {
  if (!isFocusHandoffActive()) {
    return true;
  }
  if (handoffBlocking) {
    return false;
  }
  return nodeId === handoffTargetId;
}

export function shouldSuppressEditorBlur(): boolean {
  return isFocusHandoffActive();
}
