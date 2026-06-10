import { describe, expect, it } from "vitest";
import { getQueryPortalAttrs } from "./queryPortalContent";

describe("getQueryPortalAttrs", () => {
  it("reads attrs from a queryPortal block", () => {
    expect(
      getQueryPortalAttrs({
        type: "doc",
        content: [
          {
            type: "queryPortal",
            attrs: { target: "todo", filter: "todo" },
          },
        ],
      }),
    ).toEqual({ target: "todo", filter: "todo" });
  });

  it("normalizes new portal syntax", () => {
    expect(
      getQueryPortalAttrs({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "{{query: todo}}" }],
          },
        ],
      }),
    ).toEqual({ target: "todo", filter: "todo" });
  });
});
