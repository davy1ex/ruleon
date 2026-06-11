import fs from "fs";
import { cryb64 } from "@vlcn.io/ws-common";

export const SCHEMA_NAME = "ruleon";

export function loadExpectedSchemaVersion(schemaPath) {
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  return cryb64(schemaSql).toString();
}

export function schemaVersionBigInt(value) {
  const normalized = String(value).split("\0")[0]?.trim() ?? "0";
  return BigInt(normalized === "" ? "0" : normalized);
}

export function schemaVersionsMatch(stored, target) {
  return schemaVersionBigInt(stored) === schemaVersionBigInt(target);
}

export function extractClientSchemaVersion(request) {
  const url = new URL(request.url || "/", "http://localhost");
  const fromQuery = url.searchParams.get("schema_version");
  if (fromQuery != null && fromQuery !== "") {
    return fromQuery;
  }

  const headerVersion = request.headers["x-schema-version"];
  if (typeof headerVersion === "string" && headerVersion.trim() !== "") {
    return headerVersion.trim();
  }

  const proto = request.headers["sec-websocket-protocol"];
  if (typeof proto === "string" && proto !== "") {
    try {
      const entries = Buffer.from(proto, "base64").toString("utf8").split(",");
      for (const entry of entries) {
        const [key, value] = entry.split("=");
        if (key === "schema_version" && value != null && value !== "") {
          return value;
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}
