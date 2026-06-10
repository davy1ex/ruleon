import { describe, expect, it } from "vitest";
import {
  isInsideWikiLink,
  repairWikiLinkSplit,
  sliceTextForSplit,
} from "./smartSplit";

describe("isInsideWikiLink", () => {
  it("detects cursor inside a wiki link", () => {
    const text = "See [[Page Name]] here";
    const linkStart = text.indexOf("Page");

    expect(isInsideWikiLink(text, linkStart)).toBe(true);
  });

  it("returns false when cursor is outside wiki links", () => {
    const text = "See [[Page Name]] here";

    expect(isInsideWikiLink(text, 2)).toBe(false);
    expect(isInsideWikiLink(text, text.length)).toBe(false);
  });

  it("returns false when cursor is before an opening wiki link", () => {
    const text = "See [[Page Name]] here";
    const beforeLink = text.indexOf("[[");

    expect(isInsideWikiLink(text, beforeLink)).toBe(false);
  });

  it("detects cursor inside an unclosed wiki link", () => {
    const text = "See [[Page Name";

    expect(isInsideWikiLink(text, text.length)).toBe(true);
  });
});

describe("repairWikiLinkSplit", () => {
  it("closes a wiki link on the left when split breaks it", () => {
    expect(repairWikiLinkSplit("Before [[Page", " Name]] after")).toEqual({
      leftPart: "Before [[Page Name]]",
      rightPart: " after",
    });
  });

  it("leaves intact parts unchanged", () => {
    expect(repairWikiLinkSplit("Before [[Page]]", " after")).toEqual({
      leftPart: "Before [[Page]]",
      rightPart: " after",
    });
  });
});

describe("sliceTextForSplit", () => {
  it("repairs wiki links when split index breaks them", () => {
    const text = "Before [[Page Name]] after";
    const splitIndex = text.indexOf(" Name");

    expect(sliceTextForSplit(text, splitIndex)).toEqual({
      leftPart: "Before [[Page Name]]",
      rightPart: "after",
    });
  });

  it("closes the link on the left when splitting inside the link name", () => {
    const text = "[[Page Name]]";
    const splitIndex = text.indexOf(" Name");

    expect(sliceTextForSplit(text, splitIndex)).toEqual({
      leftPart: "[[Page Name]]",
      rightPart: "",
    });
  });

  it("splits plain text normally", () => {
    expect(sliceTextForSplit("hello world", 5)).toEqual({
      leftPart: "hello",
      rightPart: "world",
    });
  });

  it("returns null for an empty split", () => {
    expect(sliceTextForSplit("   ", 1)).toBeNull();
  });
});
