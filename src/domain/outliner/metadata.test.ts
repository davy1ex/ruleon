import { describe, expect, it } from "vitest";
import {
  applyContentMetadata,
  applyTaskLifecycleMetadata,
  initialNodeMetadata,
  parseMetadata,
  serializeMetadata,
} from "./metadata";

describe("initialNodeMetadata", () => {
  it("sets tags and ISO timestamps once at creation", () => {
    const metadata = initialNodeMetadata("2026-06-11T10:00:00.000Z");
    expect(metadata).toEqual({
      tags: [],
      created_at: "2026-06-11T10:00:00.000Z",
      updated_at: "2026-06-11T10:00:00.000Z",
    });
  });
});

describe("applyContentMetadata", () => {
  it("updates tags and updated_at on content save", () => {
    const current = initialNodeMetadata("2026-06-11T10:00:00.000Z");
    const next = applyContentMetadata(current, ["project", "urgent"]);

    expect(next.tags).toEqual(["project", "urgent"]);
    expect(next.created_at).toBe("2026-06-11T10:00:00.000Z");
    expect(next.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe("applyTaskLifecycleMetadata", () => {
  it("sets completed_at when status becomes DONE", () => {
    const current = initialNodeMetadata("2026-06-11T10:00:00.000Z");
    const next = applyTaskLifecycleMetadata(current, "DONE");

    expect(next.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(next.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("removes completed_at when status is cleared or TODO", () => {
    const current = {
      ...initialNodeMetadata("2026-06-11T10:00:00.000Z"),
      completed_at: "2026-06-11T11:00:00.000Z",
    };

    expect(applyTaskLifecycleMetadata(current, "TODO").completed_at).toBeUndefined();
    expect(applyTaskLifecycleMetadata(current, null).completed_at).toBeUndefined();
  });
});

describe("parseMetadata / serializeMetadata", () => {
  it("round-trips strict metadata JSON", () => {
    const metadata = {
      ...initialNodeMetadata("2026-06-11T10:00:00.000Z"),
      completed_at: "2026-06-11T11:00:00.000Z",
      awarded_xp: 10,
    };

    const parsed = parseMetadata(serializeMetadata(metadata));
    expect(parsed).toEqual(metadata);
  });
});
