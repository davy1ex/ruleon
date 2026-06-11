import crypto from "crypto";
import Database from "better-sqlite3";
import { extensionPath } from "@vlcn.io/crsqlite";
import { ensureRoomDatabase } from "../migrateDbs.mjs";

const INBOX_PAGE_ID = "00000000-0000-4000-8000-000000000002";
const INBOX_PAGE_TITLE = "Inbox";
const DEFAULT_ROOM = "ruleon.db";

function textToStoredContent(text) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  });
}

function openRoomDatabase(dbFolder, schemaFolder, room = DEFAULT_ROOM) {
  const dbPath = ensureRoomDatabase(dbFolder, schemaFolder, room);
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.loadExtension(extensionPath);
  return db;
}

function ensureInboxPage(db) {
  const existing = db
    .prepare(`SELECT id FROM outline_nodes WHERE id = ?`)
    .get(INBOX_PAGE_ID);
  if (existing) {
    return INBOX_PAGE_ID;
  }

  const byTitle = db
    .prepare(
      `SELECT id
       FROM outline_nodes
       WHERE parent_id IS NULL AND content = ?
       LIMIT 1`,
    )
    .get(INBOX_PAGE_TITLE);
  if (byTitle) {
    return byTitle.id;
  }

  const timestamp = Date.now();
  const metadata = JSON.stringify({
    tags: ["inbox"],
    created_at: new Date(timestamp).toISOString(),
    updated_at: new Date(timestamp).toISOString(),
  });

  db.prepare(
    `INSERT INTO outline_nodes
      (id, parent_id, content, sort_order, collapsed, metadata, created_at, updated_at)
     VALUES (?, NULL, ?, 0, 0, ?, ?, ?)`,
  ).run(INBOX_PAGE_ID, INBOX_PAGE_TITLE, metadata, timestamp, timestamp);

  return INBOX_PAGE_ID;
}

function nextChildSortOrder(db, parentId) {
  const maxOrder = db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order
       FROM outline_nodes
       WHERE parent_id = ?`,
    )
    .pluck()
    .get(parentId);
  return Number(maxOrder) + 1;
}

export function createInboxHandler(dbFolder, schemaFolder) {
  return (req, res) => {
    const text = req.body?.text;
    if (typeof text !== "string" || text.trim() === "") {
      res.status(400).json({ error: "Bad Request: body.text must be a non-empty string" });
      return;
    }

    const nodeId = crypto.randomUUID();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const metadata = JSON.stringify({
      tags: ["inbox"],
      created_at: nowIso,
      updated_at: nowIso,
    });
    const content = textToStoredContent(text.trim());

    let db;
    try {
      db = openRoomDatabase(dbFolder, schemaFolder);
      const inboxPageId = ensureInboxPage(db);
      const sortOrder = nextChildSortOrder(db, inboxPageId);

      db.prepare(
        `INSERT INTO outline_nodes
          (id, parent_id, content, sort_order, collapsed, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      ).run(
        nodeId,
        inboxPageId,
        content,
        sortOrder,
        metadata,
        now,
        now,
      );

      res.status(201).json({ success: true, nodeId, pageId: inboxPageId });
    } catch (error) {
      console.error("Inbox insert failed:", error);
      res.status(500).json({ error: "Failed to queue inbox item" });
    } finally {
      db?.close();
    }
  };
}
