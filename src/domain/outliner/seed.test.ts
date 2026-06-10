import { describe, expect, it, vi } from "vitest";
import { seedIfEmpty } from "./seed";
import { WELCOME_PAGE_ID, WELCOME_PAGE_TITLE } from "./welcomePage";

describe("seedIfEmpty", () => {
  it("inserts welcome page only when outline_nodes is empty", async () => {
    const exec = vi.fn().mockResolvedValue(undefined);
    const db = {
      exec,
      prepare: vi.fn(async (sql: string) => {
        if (sql.includes("WHERE id = ?")) {
          return {
            get: vi.fn().mockResolvedValue(undefined),
            finalize: vi.fn().mockResolvedValue(undefined),
          };
        }
        return {
          get: vi.fn().mockResolvedValue({ count: 0 }),
          finalize: vi.fn().mockResolvedValue(undefined),
        };
      }),
    };

    await seedIfEmpty(db as never);

    expect(exec).toHaveBeenCalledOnce();
    expect(exec.mock.calls[0]?.[1]).toEqual([
      WELCOME_PAGE_ID,
      WELCOME_PAGE_TITLE,
      expect.any(Number),
      expect.any(Number),
    ]);
  });

  it("skips insert when nodes already exist", async () => {
    const exec = vi.fn();
    const db = {
      exec,
      prepare: vi.fn(async (sql: string) => {
        if (sql.includes("WHERE id = ?")) {
          return {
            get: vi.fn().mockResolvedValue(undefined),
            finalize: vi.fn().mockResolvedValue(undefined),
          };
        }
        return {
          get: vi.fn().mockResolvedValue({ count: 3 }),
          finalize: vi.fn().mockResolvedValue(undefined),
        };
      }),
    };

    await seedIfEmpty(db as never);

    expect(exec).not.toHaveBeenCalled();
  });
});
