import { describe, expect, it } from "vitest";
import { parsePortalTarget } from "../extensions/queryPortalSyntax";

describe("parsePortalTarget", () => {
  it("matches new portal syntax", () => {
    expect(parsePortalTarget("{{query: todo}}")).toBe("todo");
  });

  it("matches portal syntax without colon", () => {
    expect(parsePortalTarget("{{query todo}}")).toBe("todo");
  });

  it("migrates legacy nested-bracket syntax", () => {
    expect(parsePortalTarget("{{query: [[todo]]}}")).toBe("todo");
  });

  it("rejects incomplete portal syntax", () => {
    expect(parsePortalTarget("{{query: todo")).toBeNull();
  });
});
