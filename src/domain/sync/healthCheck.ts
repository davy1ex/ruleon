import { getHealthApiUrl, getSyncUrlValidationError } from "../../config/sync";
import { getLocalSchemaVersion } from "../db";

export type SyncHealthResult =
  | { ok: true; message: string; serverSchemaVersion: string }
  | { ok: false; message: string; serverSchemaVersion?: string };

function schemaVersionsMatch(local: string, server: string): boolean {
  const normalize = (value: string) => value.split("\0")[0]?.trim() ?? "0";
  try {
    return BigInt(normalize(local)) === BigInt(normalize(server));
  } catch {
    return normalize(local) === normalize(server);
  }
}

export async function checkSyncServerHealth(
  syncUrl: string,
  apiKey: string,
): Promise<SyncHealthResult> {
  const urlError = getSyncUrlValidationError(syncUrl);
  if (urlError) {
    return { ok: false, message: urlError };
  }

  const endpoint = getHealthApiUrl(syncUrl);
  if (!endpoint) {
    return { ok: false, message: "Invalid WebSocket URL (use ws:// or wss://)" };
  }
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    return { ok: false, message: "API key is required" };
  }

  let status: number;
  let body: { ok?: boolean; schemaVersion?: string };
  try {
    if (window.electronAPI?.fetchHealth) {
      const result = await window.electronAPI.fetchHealth(endpoint);
      status = result.status;
      body = (result.body ?? {}) as { ok?: boolean; schemaVersion?: string };
      if (!result.ok) {
        if (status === 401) {
          return { ok: false, message: "Invalid API key" };
        }
        return {
          ok: false,
          message: `Server returned ${status}`,
        };
      }
    } else {
      const response = await fetch(endpoint);
      status = response.status;
      if (status === 401) {
        return { ok: false, message: "Invalid API key" };
      }
      if (!response.ok) {
        return {
          ok: false,
          message: `Server returned ${status} ${response.statusText}`,
        };
      }
      try {
        body = (await response.json()) as { ok?: boolean; schemaVersion?: string };
      } catch {
        return { ok: false, message: "Invalid health response from server" };
      }
    }
  } catch {
    return {
      ok: false,
      message: `Cannot reach server at ${endpoint}`,
    };
  }

  const serverSchemaVersion = body.schemaVersion ?? "";
  const localSchemaVersion = await getLocalSchemaVersion();

  if (
    serverSchemaVersion &&
    localSchemaVersion &&
    !schemaVersionsMatch(localSchemaVersion, serverSchemaVersion)
  ) {
    return {
      ok: false,
      message: "Schema mismatch — re-run ./setup.sh on the sync server",
      serverSchemaVersion,
    };
  }

  return {
    ok: true,
    message: "Server reachable, schema versions match",
    serverSchemaVersion,
  };
}
