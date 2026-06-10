import { describe, expect, it } from "vitest";
import { buildFlatSubtreeForAnchor } from "./subtreeFlat";
import { row } from "./testHelpers";

describe("buildFlatSubtreeForAnchor", () => {
  it("returns anchor node and descendants in depth-first order", () => {
    const rows = [
      row("root", null, 0),
      row("a", "root", 0),
      row("b", "a", 0),
      row("c", "root", 1),
    ];

    const flat = buildFlatSubtreeForAnchor("a", rows);

    expect(flat.map((node) => [node.id, node.depth])).toEqual([
      ["a", 0],
      ["b", 1],
    ]);
  });
});
