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

export function createWebsocketAuthenticator(apiKey) {
  return (_req, token, cb) => {
    if (token === apiKey) {
      cb(null);
      return;
    }
    cb(new Error("Unauthorized"));
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
