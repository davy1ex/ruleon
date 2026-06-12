import { describe, expect, it, vi } from "vitest";
import { dedupeDateJournalPages } from "./dateJournalPage";
import { legacyJournalIdForDateTitle } from "./PageRegistry";

describe("dedupeDateJournalPages", () => {
  it("moves children from duplicate date pages onto the canonical journal id", async () => {
    const canonicalId = legacyJournalIdForDateTitle("2026-06-12");
    const duplicateId = "dup-page-id";
    const childId = "child-block";

    const exec = vi.fn().mockResolvedValue(undefined);
    const db = {
      exec,
      prepare: vi.fn(async (sql: string) => {
        if (sql.includes("parent_id IS NULL")) {
          return {
            all: vi.fn().mockResolvedValue([
              { id: canonicalId, content: "2026-06-12", created_at: 1 },
              { id: duplicateId, content: "2026-06-12", created_at: 2 },
            ]),
            finalize: vi.fn().mockResolvedValue(undefined),
          };
        }
        if (sql.includes("WHERE parent_id = ?")) {
          return {
            all: vi.fn().mockResolvedValue([{ id: childId }]),
            finalize: vi.fn().mockResolvedValue(undefined),
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    };

    await dedupeDateJournalPages(db as never);

    expect(exec).toHaveBeenCalledWith(
      `UPDATE outline_nodes SET parent_id = ? WHERE id = ?`,
      [canonicalId, childId],
    );
    expect(exec).toHaveBeenCalledWith(`DELETE FROM outline_nodes WHERE id = ?`, [
      duplicateId,
    ]);
  });
});
