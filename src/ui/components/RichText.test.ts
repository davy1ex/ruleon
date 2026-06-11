import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichText, RichTextInline } from "./RichText";

describe("RichTextInline", () => {
  it("renders bold, italic, code, and tags", () => {
    const markup = renderToStaticMarkup(
      createElement(RichTextInline, {
        content: "**bold** *italic* `code` #tag",
      }),
    );

    expect(markup).toContain("<strong");
    expect(markup).toContain("bold");
    expect(markup).toContain("<em");
    expect(markup).toContain("italic");
    expect(markup).toContain("<code");
    expect(markup).toContain("code");
    expect(markup).toContain("#tag");
  });
});

describe("RichText", () => {
  it("applies done styling wrapper", () => {
    const markup = renderToStaticMarkup(
      createElement(RichText, { content: "done task", isDone: true }),
    );
    expect(markup).toContain("line-through");
    expect(markup).toContain("opacity-40");
  });

  it("renders semantic heading levels with inline tokens", () => {
    const h1 = renderToStaticMarkup(
      createElement(RichText, { content: "# **Title**" }),
    );
    const h2 = renderToStaticMarkup(
      createElement(RichText, { content: "## Subtitle" }),
    );
    const h3 = renderToStaticMarkup(
      createElement(RichText, { content: "### Section" }),
    );

    expect(h1).toContain("<h1");
    expect(h1).toContain("text-2xl");
    expect(h1).toContain("<strong");
    expect(h1).toContain("Title");
    expect(h2).toContain("<h2");
    expect(h2).toContain("text-xl");
    expect(h2).toContain("Subtitle");
    expect(h3).toContain("<h3");
    expect(h3).toContain("text-lg");
    expect(h3).toContain("Section");
  });

  it("parses line-start headers before inline tag rules", () => {
    const markup = renderToStaticMarkup(
      createElement(RichText, { content: "# Заголовок" }),
    );

    expect(markup).toContain("<h1");
    expect(markup).toContain("text-2xl");
    expect(markup).toContain("Заголовок");
    expect(markup).not.toContain("bg-accent/15");
  });
});
