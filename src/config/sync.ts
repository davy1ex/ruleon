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

/** Parse a sync WebSocket URL without throwing. */
export function parseSyncWebSocketUrl(url: string): URL | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Returns a user-facing validation error, or null when the URL is valid. */
export function getSyncUrlValidationError(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "WebSocket URL is required";
  }
  if (!parseSyncWebSocketUrl(trimmed)) {
    return "Invalid WebSocket URL (use ws:// or wss://)";
  }
  return null;
}

function httpBaseFromSyncUrl(syncUrl?: string): string | null {
  const parsed = parseSyncWebSocketUrl(getSyncServerUrl(syncUrl));
  if (!parsed) {
    return null;
  }
  const scheme = parsed.protocol === "wss:" ? "https:" : "http:";
  return `${scheme}//${parsed.host}`;
}

/** Derive inbox HTTP URL from a WebSocket sync URL */
export function getInboxApiUrl(syncUrl?: string): string | null {
  const base = httpBaseFromSyncUrl(syncUrl);
  return base ? `${base}/api/inbox` : null;
}

/** Derive health check HTTP URL from a WebSocket sync URL */
export function getHealthApiUrl(syncUrl?: string): string | null {
  const base = httpBaseFromSyncUrl(syncUrl);
  return base ? `${base}/health` : null;
}

export function buildSyncDeepLink(url: string, apiKey: string): string {
  const params = new URLSearchParams({
    url: url.trim(),
    key: apiKey.trim(),
  });
  return `ruleon://sync?${params.toString()}`;
}

export interface SyncDeepLinkPayload {
  url: string;
  apiKey: string;
}

function parseSyncDeepLinkParams(
  queryString: string,
): SyncDeepLinkPayload | null {
  const params = new URLSearchParams(queryString);
  const url = params.get("url")?.trim();
  const apiKey = params.get("key")?.trim();
  if (!url || !apiKey) {
    return null;
  }
  return { url, apiKey };
}

export function parseSyncDeepLink(href: string): SyncDeepLinkPayload | null {
  const trimmed = href.trim();
  const ruleonMatch = trimmed.match(/^ruleon:\/\/(?:\/*)sync\/?\?(.+)$/i);
  if (ruleonMatch) {
    return parseSyncDeepLinkParams(ruleonMatch[1]);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "ruleon:") {
      return null;
    }
    const isSyncTarget =
      parsed.host === "sync" ||
      parsed.pathname === "/sync" ||
      parsed.pathname.startsWith("/sync/");
    if (!isSyncTarget) {
      return null;
    }
    return parseSyncDeepLinkParams(parsed.search);
  } catch {
    return null;
  }
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
