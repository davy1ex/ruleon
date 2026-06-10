import { describe, expect, it } from "vitest";
import type { BlockContentJSON } from "../contentTypes";
import { syncBlockLinks } from "./blockLinks";

type ExecCall = { sql: string; params: unknown[] };

function createMockDb(): {
  db: { exec: (sql: string, params?: unknown[]) => Promise<void> };
  calls: ExecCall[];
} {
  const calls: ExecCall[] = [];
  return {
    db: {
      exec: async (sql: string, params: unknown[] = []) => {
        calls.push({ sql, params });
      },
    },
    calls,
  };
}

const linkedDoc: BlockContentJSON = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "wikiLink", attrs: { pageName: "Target" } }],
    },
  ],
};

describe("syncBlockLinks", () => {
  it("replaces block_links rows for the source block", async () => {
    const { db, calls } = createMockDb();

    await syncBlockLinks(db, "block-1", linkedDoc);

    expect(calls[0]?.sql).toContain("DELETE FROM block_links");
    expect(calls[0]?.params).toEqual(["block-1"]);
    expect(calls[1]?.sql).toContain("INSERT OR IGNORE INTO block_links");
    expect(calls[1]?.params).toEqual(["block-1", "target"]);
  });

  it("clears links when doc has no wiki links", async () => {
    const { db, calls } = createMockDb();

    await syncBlockLinks(db, "block-2", { type: "doc", content: [] });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.sql).toContain("DELETE FROM block_links");
  });
});
