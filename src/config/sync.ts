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

function httpBaseFromSyncUrl(syncUrl?: string): string {
  const ws = getSyncServerUrl(syncUrl);
  const parsed = new URL(ws);
  const scheme = parsed.protocol === "wss:" ? "https:" : "http:";
  return `${scheme}//${parsed.host}`;
}

/** Derive inbox HTTP URL from a WebSocket sync URL */
export function getInboxApiUrl(syncUrl?: string): string {
  return `${httpBaseFromSyncUrl(syncUrl)}/api/inbox`;
}

/** Derive health check HTTP URL from a WebSocket sync URL */
export function getHealthApiUrl(syncUrl?: string): string {
  return `${httpBaseFromSyncUrl(syncUrl)}/health`;
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

export function parseSyncDeepLink(href: string): SyncDeepLinkPayload | null {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "ruleon:" || parsed.host !== "sync") {
      return null;
    }
    const url = parsed.searchParams.get("url")?.trim();
    const apiKey = parsed.searchParams.get("key")?.trim();
    if (!url || !apiKey) {
      return null;
    }
    return { url, apiKey };
  } catch {
    return null;
  }
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
