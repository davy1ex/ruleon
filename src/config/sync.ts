import { Capacitor } from "@capacitor/core";

const DEFAULT_PORT = 8080;

/** Platform-aware default when no URL is stored yet */
export function getDefaultSyncUrl(): string {
  return `ws://localhost:${DEFAULT_PORT}/sync`;
}

/** Resolve the WebSocket endpoint from persisted settings */
export function getSyncServerUrl(storedUrl?: string): string {
  const trimmed = storedUrl?.trim();
  return trimmed || getDefaultSyncUrl();
}

/** Derive inbox HTTP URL from a WebSocket sync URL */
export function getInboxApiUrl(syncUrl?: string): string {
  const ws = getSyncServerUrl(syncUrl);
  const parsed = new URL(ws);
  const scheme = parsed.protocol === "wss:" ? "https:" : "http:";
  return `${scheme}//${parsed.host}/api/inbox`;
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
