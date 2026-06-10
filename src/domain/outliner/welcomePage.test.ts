import { describe, expect, it, vi } from "vitest";
import {
  WELCOME_PAGE_ID,
  WELCOME_PAGE_TITLE,
  dedupeWelcomePages,
  ensureWelcomePage,
} from "./welcomePage";

function mockDb(options: {
  byId?: unknown;
  count?: number;
  welcomeRows?: { id: string; created_at: number }[];
}) {
  const exec = vi.fn().mockResolvedValue(undefined);
  const db = {
    exec,
    prepare: vi.fn(async (sql: string) => {
      if (sql.includes("WHERE id = ?")) {
        return {
          get: vi.fn().mockResolvedValue(options.byId),
          finalize: vi.fn().mockResolvedValue(undefined),
        };
      }
      if (sql.includes("COUNT(*)")) {
        return {
          get: vi.fn().mockResolvedValue({ count: options.count ?? 0 }),
          finalize: vi.fn().mockResolvedValue(undefined),
        };
      }
      return {
        all: vi.fn().mockResolvedValue(options.welcomeRows ?? []),
        finalize: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
  return { db: db as never, exec };
}

describe("ensureWelcomePage", () => {
  it("inserts canonical welcome page when database is empty", async () => {
    const { db, exec } = mockDb({ byId: undefined, count: 0 });

    await ensureWelcomePage(db);

    expect(exec).toHaveBeenCalledOnce();
    expect(exec.mock.calls[0]?.[1]).toEqual([
      WELCOME_PAGE_ID,
      WELCOME_PAGE_TITLE,
      expect.any(Number),
      expect.any(Number),
    ]);
  });

  it("skips insert when canonical welcome page already exists", async () => {
    const { db, exec } = mockDb({ byId: { id: WELCOME_PAGE_ID } });

    await ensureWelcomePage(db);

    expect(exec).not.toHaveBeenCalled();
  });

  it("skips insert when other nodes already exist", async () => {
    const { db, exec } = mockDb({ byId: undefined, count: 2 });

    await ensureWelcomePage(db);

    expect(exec).not.toHaveBeenCalled();
  });
});

describe("dedupeWelcomePages", () => {
  it("deletes duplicate welcome root pages and keeps canonical id", async () => {
    const { db, exec } = mockDb({
      welcomeRows: [
        { id: WELCOME_PAGE_ID, created_at: 20 },
        { id: "other-1", created_at: 10 },
        { id: "other-2", created_at: 30 },
      ],
    });

    await dedupeWelcomePages(db);

    expect(exec).toHaveBeenCalledTimes(2);
    expect(exec.mock.calls[0]?.[1]).toEqual(["other-1"]);
    expect(exec.mock.calls[1]?.[1]).toEqual(["other-2"]);
  });
});
