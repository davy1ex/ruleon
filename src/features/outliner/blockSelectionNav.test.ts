import { describe, expect, it } from "vitest";
import { emptyNodeMetadata } from "../../domain/outliner/metadata";
import type { FlatOutlineNode } from "../../domain/outliner/types";
import { parseStoredContent } from "../../features/editor/serialization/parseStoredContent";
import {
  getFirstChildBlockInFlat,
  getNextBlockInFlat,
  getParentBlockInFlat,
  getPreviousBlockInFlat,
  resolveShiftArrowTarget,
} from "./blockSelectionNav";

function node(
  id: string,
  parentId: string | null,
  depth: number,
): FlatOutlineNode {
  return {
    id,
    parent_id: parentId,
    content: parseStoredContent(id),
    sort_order: 0,
    collapsed: 0,
    task_status: null,
    metadata: emptyNodeMetadata(),
    created_at: 0,
    updated_at: 0,
    depth,
    hasChildren: false,
  };
}

describe("blockSelectionNav", () => {
  const nodes = [
    node("a", null, 0),
    node("b", "a", 1),
    node("c", "a", 1),
    node("d", null, 0),
  ];

  it("walks flat siblings with arrow up and down", () => {
    expect(getPreviousBlockInFlat(nodes, "c")?.id).toBe("b");
    expect(getNextBlockInFlat(nodes, "b")?.id).toBe("c");
  });

  it("walks hierarchy with arrow left and right", () => {
    expect(getParentBlockInFlat(nodes, "b")?.id).toBe("a");
    expect(getFirstChildBlockInFlat(nodes, "a")?.id).toBe("b");
  });

  it("resolves shift arrow targets", () => {
    expect(resolveShiftArrowTarget(nodes, "b", "ArrowLeft")?.id).toBe("a");
    expect(resolveShiftArrowTarget(nodes, "a", "ArrowRight")?.id).toBe("b");
  });
});
