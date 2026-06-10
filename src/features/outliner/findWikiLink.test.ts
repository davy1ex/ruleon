import { describe, expect, it } from "vitest";
import { findWikiLinkAtPosition } from "./findWikiLink";

describe("findWikiLinkAtPosition", () => {
  it("returns page name when cursor is inside a wiki link", () => {
    const content = "См. [[Тест]] дальше";

    expect(findWikiLinkAtPosition(content, 6)).toBe("Тест");
  });

  it("returns null when cursor is outside wiki links", () => {
    const content = "См. [[Тест]] дальше";

    expect(findWikiLinkAtPosition(content, 2)).toBeNull();
  });
});
