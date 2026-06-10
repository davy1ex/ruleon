import { describe, expect, it } from "vitest";
import { replaceWikiLinkInContent } from "./replaceWikiLink";

describe("replaceWikiLinkInContent", () => {
  it("replaces wiki links case-insensitively", () => {
    const content = "См. [[Тест]] и [[тест]]";

    expect(replaceWikiLinkInContent(content, "Тест", "Продакшн")).toBe(
      "См. [[Продакшн]] и [[Продакшн]]",
    );
  });

  it("leaves unrelated links unchanged", () => {
    const content = "[[Тест]] и [[Другое]]";

    expect(replaceWikiLinkInContent(content, "Тест", "Продакшн")).toBe(
      "[[Продакшн]] и [[Другое]]",
    );
  });
});
