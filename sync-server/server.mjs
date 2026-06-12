import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { attachWebsocketServer } from "@vlcn.io/ws-server";
import {
  createHttpAuthMiddleware,
  createWebsocketAuthenticator,
  loadApiKey,
} from "./auth.mjs";
import { migrateServerDatabases } from "./migrateDbs.mjs";
import { createInboxHandler } from "./routes/inbox.mjs";
import { loadExpectedSchemaVersion } from "./schemaVersion.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const API_KEY = loadApiKey();
const DB_FOLDER = path.join(__dirname, "dbs");
const SCHEMA_FOLDER = path.join(__dirname, "schemas");
const SCHEMA_PATH = path.join(SCHEMA_FOLDER, "ruleon");
const EXPECTED_SCHEMA_VERSION = loadExpectedSchemaVersion(SCHEMA_PATH);

fs.mkdirSync(DB_FOLDER, { recursive: true });
migrateServerDatabases(DB_FOLDER, SCHEMA_FOLDER);

const PORT = Number(process.env.PORT) || 8080;
const app = express();
const server = http.createServer(app);
const requireAuth = createHttpAuthMiddleware(API_KEY);

app.use(express.json({ limit: "256kb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, schemaVersion: EXPECTED_SCHEMA_VERSION });
});

app.use(requireAuth);

app.post("/api/inbox", createInboxHandler(DB_FOLDER, SCHEMA_FOLDER));

attachWebsocketServer(
  server,
  {
    dbFolder: DB_FOLDER,
    schemaFolder: SCHEMA_FOLDER,
    pathPattern: /\/sync/,
  },
  undefined,
  null,
  createWebsocketAuthenticator(API_KEY, EXPECTED_SCHEMA_VERSION),
);

server.listen(PORT, () => {
  console.log(
    `Sync server: ws://localhost:${PORT}/sync (API_KEY + schema_version required)`,
  );
  console.log(`Schema version: ${EXPECTED_SCHEMA_VERSION}`);
  console.log(`Inbox API: POST http://localhost:${PORT}/api/inbox`);
});
