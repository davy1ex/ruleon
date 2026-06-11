import { describe, expect, it } from "vitest";
import { resolveToggleTargets } from "./todoActions";

describe("resolveToggleTargets", () => {
  const nodeIdSet = new Set(["a", "b", "c"]);

  it("prefers selected ids in the current tree", () => {
    expect(
      resolveToggleTargets(
        { focusedNodeId: "a", selectedIds: ["b", "c", "outside"] },
        nodeIdSet,
      ),
    ).toEqual(["b", "c"]);
  });

  it("uses explicit id when nothing is selected", () => {
    expect(
      resolveToggleTargets(
        { focusedNodeId: "a", selectedIds: [] },
        nodeIdSet,
        "b",
      ),
    ).toEqual(["b"]);
  });

  it("falls back to focused id", () => {
    expect(
      resolveToggleTargets({ focusedNodeId: "c", selectedIds: [] }, nodeIdSet),
    ).toEqual(["c"]);
  });

  it("returns empty when no valid targets exist", () => {
    expect(
      resolveToggleTargets({ focusedNodeId: null, selectedIds: [] }, nodeIdSet),
    ).toEqual([]);
  });
});
