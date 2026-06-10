import { describe, expect, it } from "vitest";
import { normalizePortalSyntaxInDoc } from "./normalizePortalSyntax";

describe("normalizePortalSyntaxInDoc", () => {
  it("converts new portal syntax to queryPortal block", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: "{{query: todo}}" }],
        },
      ],
    };

    expect(normalizePortalSyntaxInDoc(doc)).toEqual({
      type: "doc",
      content: [
        {
          type: "queryPortal",
          attrs: { target: "todo", filter: "todo" },
        },
      ],
    });
  });

  it("migrates legacy nested-bracket syntax on load", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: "{{query: [[todo]]}}" }],
        },
      ],
    };

    expect(normalizePortalSyntaxInDoc(doc)).toEqual({
      type: "doc",
      content: [
        {
          type: "queryPortal",
          attrs: { target: "todo", filter: "todo" },
        },
      ],
    });
  });

  it("leaves non-portal paragraphs unchanged", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: "hello" }],
        },
      ],
    };

    expect(normalizePortalSyntaxInDoc(doc)).toEqual(doc);
  });
});
