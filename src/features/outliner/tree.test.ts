import { describe, expect, it } from "vitest";
import { buildTree } from "./buildTree";
import { flattenTree, flattenTreeForRoot } from "./flattenTree";
import { row } from "./testHelpers";
import { canIndent } from "./treeOps";

describe("buildTree", () => {
  it("nests rows by parent_id and sorts siblings by sort_order", () => {
    const rows = [
      row("b", "root", 1),
      row("a", "root", 0),
      row("root", null, 0),
      row("c", "a", 0),
    ];

    const tree = buildTree(rows);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("root");
    expect(tree[0]?.children.map((node) => node.id)).toEqual(["a", "b"]);
    expect(tree[0]?.children[0]?.children[0]?.id).toBe("c");
  });

  it("assigns depth while nesting", () => {
    const tree = buildTree([
      row("root", null, 0),
      row("a", "root", 0),
      row("c", "a", 0),
    ]);

    expect(tree[0]?.depth).toBe(0);
    expect(tree[0]?.children[0]?.depth).toBe(1);
    expect(tree[0]?.children[0]?.children[0]?.depth).toBe(2);
  });
});

describe("flattenTree", () => {
  it("returns depth-first flat list with depth and hasChildren", () => {
    const tree = buildTree([
      row("root", null, 0),
      row("a", "root", 0),
      row("b", "root", 1),
      row("c", "a", 0),
    ]);

    const root = tree[0];
    expect(root).toBeDefined();

    expect(flattenTree(root?.children ?? []).map((node) => [node.id, node.depth])).toEqual([
      ["a", 1],
      ["c", 2],
      ["b", 1],
    ]);

    const displayFlat = flattenTreeForRoot(root!);

    expect(displayFlat.map((node) => [node.id, node.depth])).toEqual([
      ["a", 0],
      ["c", 1],
      ["b", 0],
    ]);
    expect(displayFlat[0]?.hasChildren).toBe(true);
    expect(displayFlat[2]?.hasChildren).toBe(false);
  });

  it("skips collapsed subtrees", () => {
    const tree = buildTree([
      row("root", null, 0),
      row("a", "root", 0, 1),
      row("b", "a", 0),
    ]);

    const flat = flattenTreeForRoot(tree[0]!);

    expect(flat.map((node) => node.id)).toEqual(["a"]);
  });
});

describe("canIndent", () => {
  it("returns false for the first sibling in a list", () => {
    const rows = [row("a", "root", 0), row("b", "root", 1)];

    expect(canIndent("a", rows)).toBe(false);
  });

  it("returns true when a prior sibling exists", () => {
    const rows = [row("a", "root", 0), row("b", "root", 1)];

    expect(canIndent("b", rows)).toBe(true);
  });
});
