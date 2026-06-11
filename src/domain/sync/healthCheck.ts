import { getHealthApiUrl } from "../../config/sync";
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
  const endpoint = getHealthApiUrl(syncUrl);
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    return { ok: false, message: "API key is required" };
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: { "X-API-Key": trimmedKey },
    });
  } catch {
    return {
      ok: false,
      message: `Cannot reach server at ${endpoint}`,
    };
  }

  if (response.status === 401) {
    return { ok: false, message: "Invalid API key" };
  }

  if (!response.ok) {
    return {
      ok: false,
      message: `Server returned ${response.status} ${response.statusText}`,
    };
  }

  let body: { ok?: boolean; schemaVersion?: string };
  try {
    body = (await response.json()) as { ok?: boolean; schemaVersion?: string };
  } catch {
    return { ok: false, message: "Invalid health response from server" };
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
