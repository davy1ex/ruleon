import type { RuleonDb as DB } from "../db/types";
import { describe, expect, it } from "vitest";
import type { OutlineNodeDbRow } from "./types";
import { getPortalBlocks } from "./portalQueries";

type PrepareCall = { sql: string; target: string };

function createPortalMockDb(rows: OutlineNodeDbRow[]) {
  const calls: PrepareCall[] = [];
  return {
    db: {
      prepare: async (sql: string) => ({
        all: async (_null: null, target: string) => {
          calls.push({ sql, target });
          return rows;
        },
        finalize: async () => {},
      }),
    },
    calls,
  };
}

const sampleRow: OutlineNodeDbRow = {
  id: "block-1",
  parent_id: "page-1",
  content: '{"type":"doc","content":[]}',
  sort_order: 1,
  collapsed: 0,
  task_status: "TODO",
  created_at: 1,
  updated_at: 2,
};

describe("getPortalBlocks", () => {
  it("returns empty array for blank target", async () => {
    const { db } = createPortalMockDb([sampleRow]);
    await expect(getPortalBlocks(db as unknown as DB, "   ", "todo")).resolves.toEqual([]);
  });

  it("normalizes target text for lookup", async () => {
    const { db, calls } = createPortalMockDb([sampleRow]);
    await getPortalBlocks(db as unknown as DB, "  Target Page  ", "all");
    expect(calls[0]?.target).toBe("target page");
  });

  it("filters open tasks when filter is todo", async () => {
    const { db, calls } = createPortalMockDb([]);
    await getPortalBlocks(db as unknown as DB, "Target", "todo");
    expect(calls[0]?.sql).toContain("task_status = 'TODO'");
  });

  it("omits task filter when filter is all", async () => {
    const { db, calls } = createPortalMockDb([]);
    await getPortalBlocks(db as unknown as DB, "Target", "all");
    expect(calls[0]?.sql).not.toContain("task_status = 'TODO'");
  });

  it("queries page subtree for open tasks on the target page", async () => {
    const calls: PrepareCall[] = [];
    const db = {
      prepare: async (sql: string) => {
        calls.push({ sql, target: "" });
        if (sql.includes("parent_id IS NULL")) {
          return {
            all: async () => [
              {
                id: "page-todo",
                parent_id: null,
                content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"todo"}]}]}',
                sort_order: 1,
                collapsed: 0,
                task_status: null,
                created_at: 1,
                updated_at: 1,
              },
            ],
            finalize: async () => {},
          };
        }
        return {
          all: async () => [],
          finalize: async () => {},
        };
      },
    };

    await getPortalBlocks(db as unknown as DB, "todo", "todo");
    expect(calls.some((call) => call.sql.includes("page_subtree"))).toBe(true);
  });
});
