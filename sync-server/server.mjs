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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const API_KEY = loadApiKey();
const DB_FOLDER = path.join(__dirname, "dbs");
const SCHEMA_FOLDER = path.join(__dirname, "schemas");

fs.mkdirSync(DB_FOLDER, { recursive: true });
migrateServerDatabases(DB_FOLDER, SCHEMA_FOLDER);

const PORT = Number(process.env.PORT) || 8080;
const app = express();
const server = http.createServer(app);
const requireAuth = createHttpAuthMiddleware(API_KEY);

app.use(requireAuth);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

attachWebsocketServer(
  server,
  {
    dbFolder: DB_FOLDER,
    schemaFolder: SCHEMA_FOLDER,
    pathPattern: /\/sync/,
  },
  undefined,
  null,
  createWebsocketAuthenticator(API_KEY),
);

server.listen(PORT, () => {
  console.log(`Sync server: ws://localhost:${PORT}/sync (API_KEY required)`);
});
