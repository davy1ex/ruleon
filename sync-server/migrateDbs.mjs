import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extensionPath } from "@vlcn.io/crsqlite";
import { cryb64 } from "@vlcn.io/ws-common";

const SCHEMA_NAME = "ruleon";
const WELCOME_PAGE_ID = "00000000-0000-4000-8000-000000000001";
const WELCOME_PAGE_TITLE = "Welcome to Ruleon";

const REQUIRED_TABLES = {
  outline_nodes: [
    "id",
    "parent_id",
    "content",
    "sort_order",
    "collapsed",
    "task_status",
    "metadata",
    "created_at",
    "updated_at",
  ],
  block_links: ["source_block_id", "target_text"],
  kv_state: ["key", "value"],
  node_links: ["source_id", "target_name_normalized", "type"],
  favorites: ["node_id", "added_at"],
  trashed_nodes: ["node_id", "trashed_at"],
};

const REQUIRED_CRR_TABLES = ["outline_nodes", "block_links", "kv_state"];

export function migrateServerDatabases(dbFolder, schemaFolder) {
  const { schemaSql, targetVersion } = loadSchemaArtifacts(schemaFolder);

  if (!fs.existsSync(dbFolder)) {
    return;
  }

  for (const entry of fs.readdirSync(dbFolder)) {
    if (!entry.endsWith(".db")) {
      continue;
    }

    const dbPath = path.join(dbFolder, entry);
    migrateDatabaseFile(dbPath, schemaSql, targetVersion);
  }
}

export function ensureRoomDatabase(dbFolder, schemaFolder, roomName) {
  const { schemaSql, targetVersion } = loadSchemaArtifacts(schemaFolder);
  fs.mkdirSync(dbFolder, { recursive: true });
  const dbPath = path.join(dbFolder, roomName);
  migrateDatabaseFile(dbPath, schemaSql, targetVersion);
  return dbPath;
}

function loadSchemaArtifacts(schemaFolder) {
  const schemaPath = path.join(schemaFolder, SCHEMA_NAME);
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  const targetVersion = cryb64(schemaSql).toString();
  return { schemaSql, targetVersion };
}

function migrateDatabaseFile(dbPath, schemaSql, targetVersion) {
  const db = new Database(dbPath);
  const basename = path.basename(dbPath);

  try {
    db.pragma("journal_mode = WAL");
    db.loadExtension(extensionPath);

    const schemaName = db
      .prepare(`SELECT value FROM crsql_master WHERE key = 'schema_name'`)
      .pluck()
      .get();

    if (schemaName == null) {
      db.transaction(() => {
        db.exec(schemaSql);
        writeSchemaVersion(db, targetVersion);
        db.prepare(
          `INSERT OR REPLACE INTO crsql_master (key, value) VALUES (?, ?)`,
        ).run("schema_name", SCHEMA_NAME);
      })();
      finalizePostSchemaSteps(db);
      console.log(`Applied schema to ${basename}`);
      return;
    }

    if (schemaName !== SCHEMA_NAME) {
      console.warn(
        `Skipping ${basename}: schema "${schemaName}" != "${SCHEMA_NAME}"`,
      );
      return;
    }

    const schemaVersion = db
      .prepare(`SELECT value FROM crsql_master WHERE key = 'schema_version'`)
      .pluck()
      .get();

    if (schemaVersion == null) {
      throw new Error(`Schema present in ${dbPath} but version is missing`);
    }

    if (matchesTargetSchemaStructure(db)) {
      migrateNodeLinksToBlockLinks(db);
      dedupeWelcomePages(db);
      return;
    }

    if (schemaVersionsMatch(schemaVersion, targetVersion)) {
      migrateNodeLinksToBlockLinks(db);
      dedupeWelcomePages(db);
      return;
    }

    db.transaction(() => {
      db.prepare(`SELECT crsql_automigrate(?, 'SELECT crsql_finalize();')`).run(
        schemaSql,
      );
      writeSchemaVersion(db, targetVersion);
    })();

    finalizePostSchemaSteps(db);
    console.log(`Migrated ${basename} to schema version ${targetVersion}`);
  } finally {
    db.close();
  }
}

function writeSchemaVersion(db, targetVersion) {
  db.prepare(
    `INSERT OR REPLACE INTO crsql_master (key, value) VALUES (?, ?)`,
  ).run("schema_version", targetVersion);
}

function schemaVersionBigInt(value) {
  const normalized = String(value).split("\0")[0]?.trim() ?? "0";
  return BigInt(normalized === "" ? "0" : normalized);
}

function schemaVersionsMatch(stored, target) {
  return schemaVersionBigInt(stored) === schemaVersionBigInt(target);
}

function finalizePostSchemaSteps(db) {
  migrateNodeLinksToBlockLinks(db);
  seedWelcomeIfEmpty(db);
  dedupeWelcomePages(db);
}

function hasTable(db, tableName) {
  return Boolean(
    db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
      )
      .pluck()
      .get(tableName),
  );
}

function hasColumns(db, tableName, columns) {
  const existing = new Set(
    db.prepare(`PRAGMA table_info(${tableName})`).all().map((row) => row.name),
  );
  return columns.every((column) => existing.has(column));
}

function isCrrTable(db, tableName) {
  return hasTable(db, `${tableName}__crsql_clock`);
}

function matchesTargetSchemaStructure(db) {
  for (const [tableName, columns] of Object.entries(REQUIRED_TABLES)) {
    if (!hasTable(db, tableName) || !hasColumns(db, tableName, columns)) {
      return false;
    }
  }

  return REQUIRED_CRR_TABLES.every((tableName) => isCrrTable(db, tableName));
}

function seedWelcomeIfEmpty(db) {
  const existing = db
    .prepare(`SELECT id FROM outline_nodes WHERE id = ?`)
    .get(WELCOME_PAGE_ID);
  if (existing) {
    return;
  }

  const count = db
    .prepare(`SELECT COUNT(*) FROM outline_nodes`)
    .pluck()
    .get();
  if (count > 0) {
    return;
  }

  const timestamp = Date.now();
  db.prepare(
    `INSERT OR IGNORE INTO outline_nodes
      (id, parent_id, content, sort_order, collapsed, created_at, updated_at)
     VALUES (?, NULL, ?, 0, 0, ?, ?)`,
  ).run(WELCOME_PAGE_ID, WELCOME_PAGE_TITLE, timestamp, timestamp);
}

function dedupeWelcomePages(db) {
  const rows = db
    .prepare(
      `SELECT id
       FROM outline_nodes
       WHERE parent_id IS NULL AND content = ?
       ORDER BY
         CASE WHEN id = ? THEN 0 ELSE 1 END,
         created_at ASC`,
    )
    .all(WELCOME_PAGE_TITLE, WELCOME_PAGE_ID);

  for (let i = 1; i < rows.length; i++) {
    db.prepare(`DELETE FROM outline_nodes WHERE id = ?`).run(rows[i].id);
  }
}

function migrateNodeLinksToBlockLinks(db) {
  const migrated = db
    .prepare(`SELECT value FROM kv_state WHERE key = ?`)
    .pluck()
    .get("block_links_migrated_v1");

  if (migrated === "1") {
    return;
  }

  if (!hasTable(db, "block_links")) {
    return;
  }

  db.transaction(() => {
    db.exec(
      `INSERT OR IGNORE INTO block_links (source_block_id, target_text)
       SELECT source_id, target_name_normalized
       FROM node_links
       WHERE type = 'link'`,
    );
    db.exec(`DELETE FROM node_links WHERE type = 'link'`);
    db.prepare(`INSERT OR REPLACE INTO kv_state (key, value) VALUES (?, ?)`).run(
      "block_links_migrated_v1",
      "1",
    );
  })();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbFolder = path.join(__dirname, "dbs");
const defaultSchemaFolder = path.join(__dirname, "schemas");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateServerDatabases(defaultDbFolder, defaultSchemaFolder);
}
