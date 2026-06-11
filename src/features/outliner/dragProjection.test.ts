import { describe, expect, it } from "vitest";
import type { FlatOutlineNode } from "../../domain/outliner/types";
import { parseStoredContent } from "../../features/editor/serialization/parseStoredContent";
import {
  computeDragProjection,
  getDepthLimits,
  getProjectedDepth,
  isDescendantOf,
} from "./dragProjection";

function flatNode(
  id: string,
  parentId: string | null,
  depth: number,
  sortOrder: number,
  hasChildren = false,
): FlatOutlineNode {
  return {
    id,
    parent_id: parentId,
    content: parseStoredContent(id),
    sort_order: sortOrder,
    collapsed: 0,
    task_status: null,
    metadata: {},
    created_at: sortOrder,
    updated_at: sortOrder,
    depth,
    hasChildren,
  };
}

describe("dragProjection", () => {
  const nodes = [
    flatNode("a", "root", 0, 0),
    flatNode("b", "root", 0, 100),
    flatNode("c", "b", 1, 0),
    flatNode("d", "b", 1, 100),
  ];

  it("detects descendants", () => {
    expect(isDescendantOf(nodes, "b", "c")).toBe(true);
    expect(isDescendantOf(nodes, "b", "d")).toBe(true);
    expect(isDescendantOf(nodes, "a", "b")).toBe(false);
  });

  it("clamps projected depth between neighbors", () => {
    expect(getProjectedDepth(0, 48, 0, 1)).toBe(1);
    expect(getProjectedDepth(0, -48, 0, 1)).toBe(0);
    expect(getProjectedDepth(1, 48, 1, 2)).toBe(2);
  });

  it("derives depth limits from insertion neighbors", () => {
    expect(getDepthLimits(nodes, 2)).toEqual({ minDepth: 1, maxDepth: 1 });
    expect(getDepthLimits(nodes, 0)).toEqual({ minDepth: 0, maxDepth: 0 });
    expect(getDepthLimits(nodes, 1)).toEqual({ minDepth: 0, maxDepth: 1 });
  });

  it("projects nesting under over when dragged right", () => {
    const projection = computeDragProjection(nodes, "a", "b", 24);
    expect(projection).toMatchObject({
      parentId: "b",
      depth: 1,
      indicatorBelow: true,
    });
  });

  it("reorders siblings at the same depth", () => {
    const projection = computeDragProjection(nodes, "a", "b", 0);
    expect(projection).toMatchObject({
      parentId: "root",
      depth: 0,
      prevSiblingOrder: 100,
      nextSiblingOrder: null,
      indicatorBelow: true,
    });
  });

  it("rejects dropping onto own descendants", () => {
    expect(computeDragProjection(nodes, "b", "c", 0)).toBeNull();
  });

  it("nests a lower sibling under the block above when dragged right", () => {
    const journalNodes = [
      flatNode("prosnulsya", "root", 0, 0),
      flatNode("chto-delayu", "root", 0, 100),
    ];

    const projection = computeDragProjection(
      journalNodes,
      "chto-delayu",
      "prosnulsya",
      24,
    );

    expect(projection).toMatchObject({
      parentId: "prosnulsya",
      depth: 1,
      prevSiblingOrder: null,
      nextSiblingOrder: null,
      indicatorBelow: true,
      indicatorAnchorId: "prosnulsya",
    });
  });

  it("nests under an earlier block even when another sibling sits between them", () => {
    const journalNodes = [
      flatNode("prosnulsya", "root", 0, 0),
      flatNode("zavtrak", "root", 0, 50),
      flatNode("chto-delayu", "root", 0, 100),
    ];

    const projection = computeDragProjection(
      journalNodes,
      "chto-delayu",
      "prosnulsya",
      24,
    );

    expect(projection).toMatchObject({
      parentId: "prosnulsya",
      depth: 1,
      indicatorBelow: true,
    });
  });

  it("moves a block above its target when dragged up", () => {
    const journalNodes = [
      flatNode("prosnulsya", "root", 0, 0),
      flatNode("zavtrak", "root", 0, 50),
      flatNode("chto-delayu", "root", 0, 100),
    ];

    const projection = computeDragProjection(
      journalNodes,
      "chto-delayu",
      "prosnulsya",
      0,
    );

    expect(projection).toMatchObject({
      parentId: "root",
      depth: 0,
      prevSiblingOrder: null,
      nextSiblingOrder: 0,
      indicatorBelow: false,
      indicatorAnchorId: "prosnulsya",
    });
  });

  it("moves a block above an intermediate sibling when dragged up", () => {
    const journalNodes = [
      flatNode("prosnulsya", "root", 0, 0),
      flatNode("zavtrak", "root", 0, 50),
      flatNode("chto-delayu", "root", 0, 100),
    ];

    const projection = computeDragProjection(
      journalNodes,
      "chto-delayu",
      "zavtrak",
      0,
    );

    expect(projection).toMatchObject({
      parentId: "root",
      depth: 0,
      prevSiblingOrder: 0,
      nextSiblingOrder: 50,
      indicatorBelow: false,
    });
  });

  it("moves a lower block down past a sibling when dragged down", () => {
    const journalNodes = [
      flatNode("prosnulsya", "root", 0, 0),
      flatNode("zavtrak", "root", 0, 50),
      flatNode("chto-delayu", "root", 0, 100),
    ];

    const projection = computeDragProjection(
      journalNodes,
      "prosnulsya",
      "zavtrak",
      0,
    );

    expect(projection).toMatchObject({
      parentId: "root",
      depth: 0,
      prevSiblingOrder: 50,
      nextSiblingOrder: 100,
      indicatorBelow: true,
    });
  });
});
