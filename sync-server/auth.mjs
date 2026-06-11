import { extractClientSchemaVersion, schemaVersionsMatch } from "./schemaVersion.mjs";

/**
 * Static API token auth for sync-server HTTP and WebSocket upgrade paths.
 * Set API_KEY in sync-server/.env (see .env.example).
 */
export function loadApiKey() {
  const apiKey = process.env.API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "API_KEY is required. Copy sync-server/.env.example to sync-server/.env and set a secret token.",
    );
  }
  return apiKey;
}

export function createHttpAuthMiddleware(apiKey) {
  return (req, res, next) => {
    if (isAuthorizedRequest(req, apiKey)) {
      next();
      return;
    }
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
  };
}

export function createWebsocketAuthenticator(apiKey, expectedSchemaVersion) {
  return (req, token, cb) => {
    if (token !== apiKey) {
      cb(new Error("Unauthorized: Invalid API Key"));
      return;
    }

    const clientSchemaVersion = extractClientSchemaVersion(req);
    if (clientSchemaVersion == null) {
      cb(new Error("Schema Mismatch: schema_version is required"));
      return;
    }

    if (!schemaVersionsMatch(clientSchemaVersion, expectedSchemaVersion)) {
      cb(
        new Error(
          `Schema Mismatch. Server: ${expectedSchemaVersion}, Client: ${clientSchemaVersion}`,
        ),
      );
      return;
    }

    cb(null);
  };
}

function isAuthorizedRequest(req, apiKey) {
  const headerToken = extractBearerOrApiKey(req);
  return headerToken === apiKey;
}

function extractBearerOrApiKey(req) {
  const authorization = req.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string") {
    return apiKeyHeader.trim();
  }

  return null;
}
