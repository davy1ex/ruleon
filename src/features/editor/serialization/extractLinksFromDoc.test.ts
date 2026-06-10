import { describe, expect, it } from "vitest";
import type { BlockContentJSON } from "../../../domain/outliner/contentTypes";
import {
  extractLinksAndTagsFromDoc,
  extractLinksFromAST,
} from "./extractLinksFromDoc";

function wikiLinkDoc(pageName: string): BlockContentJSON {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "wikiLink", attrs: { pageName } }],
      },
    ],
  };
}

describe("extractLinksFromAST", () => {
  it("returns empty array for null doc", () => {
    expect(extractLinksFromAST(null)).toEqual([]);
  });

  it("extracts a single wiki link", () => {
    expect(extractLinksFromAST(wikiLinkDoc("Architecture"))).toEqual([
      "architecture",
    ]);
  });

  it("deduplicates repeated wiki links", () => {
    const doc: BlockContentJSON = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "wikiLink", attrs: { pageName: "Page" } },
            { type: "wikiLink", attrs: { pageName: "PAGE" } },
          ],
        },
      ],
    };
    expect(extractLinksFromAST(doc)).toEqual(["page"]);
  });

  it("walks nested paragraph content", () => {
    const doc: BlockContentJSON = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "See " },
            { type: "wikiLink", attrs: { pageName: "Nested" } },
          ],
        },
      ],
    };
    expect(extractLinksFromAST(doc)).toEqual(["nested"]);
  });

  it("keeps tag extraction in extractLinksAndTagsFromDoc", () => {
    const doc: BlockContentJSON = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "[[Wiki]] #tag" },
          ],
        },
      ],
    };
    expect(extractLinksAndTagsFromDoc(doc)).toEqual({
      links: [],
      tags: ["tag"],
    });
  });
});
