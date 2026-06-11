import { describe, expect, it, vi } from "vitest";
import {
  extractPlainText,
  parseStoredContent,
  plainTextToBlockContent,
  serializeForDb,
} from "../../../features/editor/serialization/contentCodec";
import { persistBlockContent } from "./blockLinks";

type StoredRow = {
  content: string;
  metadata: string;
  updated_at: number;
};

function createContentStoreDb(initial: StoredRow): {
  db: {
    exec: (sql: string, params?: unknown[]) => Promise<void>;
    prepare: (sql: string) => Promise<{
      get: (bind: null, id: string) => Promise<{ metadata: string } | undefined>;
      finalize: (bind: null) => Promise<void>;
    }>;
  };
  row: StoredRow;
} {
  const row = { ...initial };

  return {
    row,
    db: {
      exec: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes("UPDATE outline_nodes SET content = ?")) {
          row.content = String(params[0]);
          row.metadata = String(params[1]);
          row.updated_at = Number(params[2]);
        }
      }),
      prepare: vi.fn(async (sql: string) => ({
        get: vi.fn(async (_bind: null, _id: string) => {
          if (sql.includes("SELECT metadata")) {
            return { metadata: row.metadata };
          }
          return undefined;
        }),
        finalize: vi.fn(async () => undefined),
      })),
    },
  };
}

describe("persistBlockContent", () => {
  it("writes JSON-stringified doc content and metadata to outline_nodes", async () => {
    const { db, row } = createContentStoreDb({
      content: serializeForDb(plainTextToBlockContent("")),
      metadata: JSON.stringify({
        tags: [],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
      updated_at: 0,
    });

    const doc = plainTextToBlockContent("hello #tag [[Page]]");
    await persistBlockContent(db as never, "node-1", doc);

    expect(() => JSON.parse(row.content)).not.toThrow();
    expect(JSON.parse(row.content).type).toBe("doc");
    expect(extractPlainText(parseStoredContent(row.content))).toBe(
      "hello #tag [[Page]]",
    );

    const metadata = JSON.parse(row.metadata) as { tags: string[] };
    expect(metadata.tags).toContain("tag");
    expect(row.updated_at).toBeGreaterThan(0);
  });

  it("round-trips plain text through write and simulated reload", async () => {
    const { db, row } = createContentStoreDb({
      content: serializeForDb(plainTextToBlockContent("")),
      metadata: JSON.stringify({
        tags: [],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
      updated_at: 0,
    });

    const sourceText = "persist me after reload";
    await persistBlockContent(db as never, "node-2", plainTextToBlockContent(sourceText));

    const reloaded = parseStoredContent(row.content);
    expect(extractPlainText(reloaded)).toBe(sourceText);
  });
});
