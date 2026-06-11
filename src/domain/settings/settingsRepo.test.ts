import { describe, expect, it, vi } from "vitest";
import { deleteSetting, getSetting, setSetting } from "./settingsRepo";

function createMockDb() {
  const rows = new Map<string, string>();
  return {
    rows,
    prepare: vi.fn(async (sql: string) => ({
      get: vi.fn(async (_ctx: unknown, key: string) => {
        if (sql.includes("SELECT value FROM app_settings")) {
          const value = rows.get(key);
          return value !== undefined ? { value } : undefined;
        }
        return undefined;
      }),
      finalize: vi.fn(async () => undefined),
    })),
    exec: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes("INSERT OR REPLACE INTO app_settings")) {
        const [key, value] = params as [string, string];
        rows.set(key, value);
      }
      if (sql.includes("DELETE FROM app_settings")) {
        const [key] = params as [string];
        rows.delete(key);
      }
    }),
  };
}

describe("settingsRepo", () => {
  it("round-trips JSON values", async () => {
    const db = createMockDb();
    const payload = { theme: "dracula", sync: { enabled: true } };

    await setSetting(db as never, "app_config", payload);
    const loaded = await getSetting(db as never, "app_config");

    expect(loaded).toEqual(payload);
  });

  it("returns null for missing keys", async () => {
    const db = createMockDb();
    expect(await getSetting(db as never, "missing")).toBeNull();
  });

  it("deletes stored keys", async () => {
    const db = createMockDb();
    await setSetting(db as never, "temp", { ok: true });
    await deleteSetting(db as never, "temp");
    expect(await getSetting(db as never, "temp")).toBeNull();
  });
});
