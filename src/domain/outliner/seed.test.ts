import { describe, expect, it, vi } from "vitest";
import { INBOX_PAGE_ID, INBOX_PAGE_TITLE } from "./inboxPage";
import { seedIfEmpty } from "./seed";
import { WELCOME_PAGE_ID, WELCOME_PAGE_TITLE } from "./welcomePage";

function createStmtMock(handlers: {
  get?: (sql: string, args?: unknown[]) => unknown;
  all?: (sql: string, args?: unknown[]) => unknown[];
}) {
  return {
    get: vi.fn(async (_null: unknown, ...args: unknown[]) =>
      handlers.get?.("", args),
    ),
    all: vi.fn(async (_null: unknown, ...args: unknown[]) =>
      handlers.all?.("", args) ?? [],
    ),
    finalize: vi.fn().mockResolvedValue(undefined),
  };
}

function createDb(opts: { nodeCount?: number; welcomeExists?: boolean; inboxExists?: boolean }) {
  const exec = vi.fn().mockResolvedValue(undefined);
  const db = {
    exec,
    prepare: vi.fn(async (sql: string) => {
      if (sql.includes("COUNT(*)")) {
        return createStmtMock({
          get: () => ({ count: opts.nodeCount ?? 0 }),
        });
      }
      if (sql.includes("WHERE id = ?")) {
        return createStmtMock({
          get: (_s, args) => {
            const id = args?.[0];
            if (id === WELCOME_PAGE_ID && opts.welcomeExists) {
              return { id: WELCOME_PAGE_ID };
            }
            if (id === INBOX_PAGE_ID && opts.inboxExists) {
              return { id: INBOX_PAGE_ID };
            }
            return undefined;
          },
        });
      }
      if (sql.includes("ORDER BY")) {
        return createStmtMock({ all: () => [] });
      }
      return createStmtMock({});
    }),
  };
  return { db, exec };
}

describe("seedIfEmpty", () => {
  it("inserts welcome and inbox pages on an empty database", async () => {
    const { db, exec } = createDb({ nodeCount: 0 });

    await seedIfEmpty(db as never);

    expect(exec).toHaveBeenCalledTimes(2);
    expect(exec.mock.calls[0]?.[1]).toEqual([
      WELCOME_PAGE_ID,
      WELCOME_PAGE_TITLE,
      expect.any(Number),
      expect.any(Number),
    ]);
    expect(exec.mock.calls[1]?.[1]?.[0]).toBe(INBOX_PAGE_ID);
    expect(exec.mock.calls[1]?.[1]?.[1]).toBe(INBOX_PAGE_TITLE);
  });

  it("skips welcome insert when nodes already exist", async () => {
    const { db, exec } = createDb({ nodeCount: 3 });

    await seedIfEmpty(db as never);

    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec.mock.calls[0]?.[1]?.[0]).toBe(INBOX_PAGE_ID);
  });
});
