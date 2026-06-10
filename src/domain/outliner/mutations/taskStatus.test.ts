import { describe, expect, it } from "vitest";
import { nextTaskStatus } from "./taskStatus";

describe("nextTaskStatus", () => {
  it("cycles NULL -> TODO -> DONE -> NULL", () => {
    expect(nextTaskStatus(null)).toBe("TODO");
    expect(nextTaskStatus("TODO")).toBe("DONE");
    expect(nextTaskStatus("DONE")).toBe(null);
  });
});
