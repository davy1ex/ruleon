import { describe, expect, it } from "vitest";
import { extractTags } from "../metadata";
import {
  nextBlockTodoType,
  nextTaskCompletion,
  nextTaskStatusCycle,
  taskStatusFromMetadata,
} from "../types";

describe("extractTags", () => {
  it("parses hashtags from plain text", () => {
    expect(extractTags("Hello #Project and #urgent")).toEqual([
      "project",
      "urgent",
    ]);
  });

  it("supports cyrillic tags", () => {
    expect(extractTags("#важно")).toEqual(["важно"]);
  });

  it("returns empty array when no tags", () => {
    expect(extractTags("plain text")).toEqual([]);
  });
});

describe("nextTaskStatusCycle", () => {
  it("cycles NULL -> TODO -> DONE -> FAILED -> NULL", () => {
    expect(nextTaskStatusCycle(null)).toBe("TODO");
    expect(nextTaskStatusCycle("TODO")).toBe("DONE");
    expect(nextTaskStatusCycle("DONE")).toBe("FAILED");
    expect(nextTaskStatusCycle("FAILED")).toBe(null);
  });
});

describe("nextBlockTodoType", () => {
  it("toggles text <-> open todo", () => {
    expect(nextBlockTodoType(null)).toBe("TODO");
    expect(nextBlockTodoType("TODO")).toBe(null);
    expect(nextBlockTodoType("DONE")).toBe(null);
  });
});

describe("nextTaskCompletion", () => {
  it("toggles todo <-> done", () => {
    expect(nextTaskCompletion("TODO")).toBe("DONE");
    expect(nextTaskCompletion("DONE")).toBe("TODO");
    expect(nextTaskCompletion(null)).toBe("TODO");
  });
});

describe("taskStatusFromMetadata", () => {
  it("maps semantic metadata to task_status", () => {
    expect(taskStatusFromMetadata("TODO", { type: "text" })).toBe(null);
    expect(taskStatusFromMetadata(null, { type: "todo" })).toBe("TODO");
    expect(
      taskStatusFromMetadata(null, { type: "todo", status: "done" }),
    ).toBe("DONE");
    expect(taskStatusFromMetadata("TODO", { status: "done" })).toBe("DONE");
  });
});
