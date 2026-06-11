import { describe, expect, it } from "vitest";
import {
  buildTodayActivity,
  enrichTaskTitlesFromMemory,
  isCompletedOnDate,
} from "./todayActivity";
import type { OutlineNodeRow } from "./types";

function makeNode(
  id: string,
  overrides: Partial<OutlineNodeRow> = {},
): OutlineNodeRow {
  return {
    id,
    parent_id: null,
    content: { type: "doc", content: [{ type: "paragraph", content: [] }] },
    sort_order: 0,
    collapsed: 0,
    task_status: null,
    metadata: { tags: [], created_at: "", updated_at: "" },
    created_at: 0,
    updated_at: 0,
    ...overrides,
  };
}

function textContent(text: string) {
  return {
    type: "doc" as const,
    content: [
      {
        type: "paragraph" as const,
        content: [{ type: "text" as const, text }],
      },
    ],
  };
}

describe("isCompletedOnDate", () => {
  it("matches local calendar day", () => {
    expect(
      isCompletedOnDate(
        "2026-06-11T18:30:00.000Z",
        "2026-06-11",
        new Date("2026-06-11T12:00:00"),
      ),
    ).toBe(true);
    expect(
      isCompletedOnDate(
        "2026-06-09T12:00:00.000Z",
        "2026-06-11",
        new Date("2026-06-11T12:00:00"),
      ),
    ).toBe(false);
  });
});

describe("buildTodayActivity", () => {
  it("collects tasks and unique project pages completed today", () => {
    const allNodes = [
      makeNode("project-a", {
        content: textContent("Marketing"),
      }),
      makeNode("task-1", {
        parent_id: "project-a",
        content: textContent("Write brief"),
        task_status: "DONE",
        metadata: {
          tags: [],
          created_at: "",
          updated_at: "",
          completed_at: "2026-06-11T10:00:00.000Z",
        },
      }),
      makeNode("task-2", {
        parent_id: "project-a",
        content: textContent("Review ads"),
        task_status: "DONE",
        metadata: {
          tags: [],
          created_at: "",
          updated_at: "",
          completed_at: "2026-06-11T11:00:00.000Z",
        },
      }),
      makeNode("journal", {
        content: textContent("2026-06-10"),
      }),
      makeNode("task-old", {
        parent_id: "journal",
        content: textContent("Old task"),
        task_status: "DONE",
        metadata: {
          tags: [],
          created_at: "",
          updated_at: "",
          completed_at: "2026-06-10T12:00:00.000Z",
        },
      }),
    ];

    const activity = buildTodayActivity(
      allNodes
        .filter((node) => node.task_status === "DONE")
        .map((node) => ({
          node,
          rawContent: JSON.stringify(node.content),
        })),
      allNodes,
      "2026-06-11",
      new Date("2026-06-11T12:00:00"),
    );

    expect(activity.tasks).toEqual([
      {
        id: "task-2",
        title: "Review ads",
        pageTitle: "Marketing",
        pageRootId: "project-a",
        pageName: "Marketing",
        completedAt: "2026-06-11T11:00:00.000Z",
      },
      {
        id: "task-1",
        title: "Write brief",
        pageTitle: "Marketing",
        pageRootId: "project-a",
        pageName: "Marketing",
        completedAt: "2026-06-11T10:00:00.000Z",
      },
    ]);
    expect(activity.projects).toEqual([
      {
        rootId: "project-a",
        title: "Marketing",
        pageName: "Marketing",
      },
    ]);
  });

  it("reads legacy plain-text content from raw db value", () => {
    const activity = buildTodayActivity(
      [
        {
          node: makeNode("task-legacy", {
            parent_id: "page",
            content: textContent(""),
            task_status: "DONE",
            metadata: {
              tags: [],
              created_at: "",
              updated_at: "",
              completed_at: "2026-06-11T12:00:00.000Z",
            },
          }),
          rawContent: "аывавава",
        },
      ],
      [makeNode("page", { content: textContent("2026") })],
      "2026-06-11",
      new Date("2026-06-11T12:00:00"),
    );

    expect(activity.tasks[0]?.title).toBe("аывавава");
  });
});

describe("enrichTaskTitlesFromMemory", () => {
  it("replaces raw JSON titles with in-memory content", () => {
    const tasks = enrichTaskTitlesFromMemory(
      [
        {
          id: "task-1",
          title: '{"type":"doc","content":[{"type":"paragraph"}]}',
          pageTitle: "2026",
          pageRootId: "page",
          pageName: "2026",
          completedAt: "2026-06-11T12:00:00.000Z",
        },
      ],
      {
        page: [
          {
            ...makeNode("task-1", { content: textContent("аывавава") }),
            depth: 0,
            hasChildren: false,
          },
        ],
      },
    );

    expect(tasks[0]?.title).toBe("аывавава");
  });

  it("replaces Untitled task with in-memory content", () => {
    const tasks = enrichTaskTitlesFromMemory(
      [
        {
          id: "task-1",
          title: "Untitled task",
          pageTitle: "2026",
          pageRootId: "page",
          pageName: "2026",
          completedAt: "2026-06-11T12:00:00.000Z",
        },
      ],
      {
        page: [
          {
            ...makeNode("task-1", { content: textContent("аывавава") }),
            depth: 0,
            hasChildren: false,
          },
        ],
      },
    );

    expect(tasks[0]?.title).toBe("аывавава");
  });
});
