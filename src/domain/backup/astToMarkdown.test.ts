import { describe, expect, it } from "vitest";
import { emptyNodeMetadata } from "../outliner/metadata";
import { appendBlocksAsMarkdown, blockDocToLine } from "./astToMarkdown";
import type { OutlineTreeNode } from "../outliner/types";

describe("blockDocToLine", () => {
  it("renders wiki links and task checkboxes", () => {
    const line = blockDocToLine(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "See " },
              { type: "wikiLink", attrs: { pageName: "Home" } },
            ],
          },
        ],
      },
      "TODO",
    );
    expect(line).toBe("- [ ] See [[Home]]");
  });

  it("renders query portals", () => {
    const line = blockDocToLine(
      {
        type: "doc",
        content: [
          {
            type: "queryPortal",
            attrs: { target: "Tasks", filter: "todo" },
          },
        ],
      },
      null,
    );
    expect(line).toBe("- {{query: Tasks}}");
  });
});

describe("appendBlocksAsMarkdown", () => {
  it("indents nested bullets with tabs", () => {
    const nodes: OutlineTreeNode[] = [
      {
        id: "a",
        parent_id: null,
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Root" }] }],
        },
        sort_order: 0,
        collapsed: 0,
        task_status: null,
        metadata: emptyNodeMetadata(),
        created_at: 0,
        updated_at: 0,
        depth: 0,
        children: [
          {
            id: "b",
            parent_id: "a",
            content: {
              type: "doc",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Child" }] }],
            },
            sort_order: 0,
            collapsed: 0,
            task_status: "DONE",
            metadata: emptyNodeMetadata(),
            created_at: 0,
            updated_at: 0,
            depth: 1,
            children: [],
          },
        ],
      },
    ];

    const lines: string[] = [];
    appendBlocksAsMarkdown(nodes, lines, 0);
    expect(lines).toEqual(["- Root", "\t- [x] Child"]);
  });
});
