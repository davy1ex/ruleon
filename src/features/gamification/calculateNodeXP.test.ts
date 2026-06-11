import { describe, expect, it } from "vitest";
import type { FlatOutlineNode } from "../../domain/outliner/types";
import {
  BASE_XP,
  calculateNodeXP,
  PENALTY_XP,
  ROUTINE_XP,
} from "./calculateNodeXP";

function makeNode(
  id: string,
  overrides: Partial<FlatOutlineNode> = {},
): FlatOutlineNode {
  return {
    id,
    parent_id: null,
    content: { type: "doc", content: [] },
    sort_order: 0,
    collapsed: 0,
    task_status: null,
    metadata: { tags: [], created_at: "", updated_at: "" },
    created_at: 0,
    updated_at: 0,
    depth: 0,
    hasChildren: false,
    ...overrides,
  };
}

describe("calculateNodeXP", () => {
  it("returns base xp for a simple completed task", () => {
    const nodes = [
      makeNode("a", { task_status: "DONE" }),
    ];

    expect(calculateNodeXP("a", nodes)).toBe(BASE_XP);
  });

  it("returns routine xp when daily tag is present", () => {
    const nodes = [
      makeNode("a", {
        task_status: "DONE",
        metadata: {
          tags: ["daily"],
          created_at: "",
          updated_at: "",
        },
      }),
    ];

    expect(calculateNodeXP("a", nodes)).toBe(ROUTINE_XP);
  });

  it("returns penalty xp for failed tasks without cascading children", () => {
    const nodes = [
      makeNode("parent", { task_status: "FAILED" }),
      makeNode("child", {
        parent_id: "parent",
        task_status: "DONE",
      }),
    ];

    expect(calculateNodeXP("parent", nodes)).toBe(PENALTY_XP);
  });

  it("sums child xp for project nodes with task children", () => {
    const nodes = [
      makeNode("project", { task_status: "DONE" }),
      makeNode("child-a", {
        parent_id: "project",
        task_status: "TODO",
      }),
      makeNode("child-b", {
        parent_id: "project",
        task_status: "DONE",
        metadata: {
          tags: ["habit"],
          created_at: "",
          updated_at: "",
        },
      }),
    ];

    expect(calculateNodeXP("project", nodes)).toBe(BASE_XP + ROUTINE_XP);
  });
});
