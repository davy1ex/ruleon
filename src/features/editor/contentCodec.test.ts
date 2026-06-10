import { describe, expect, it } from "vitest";
import { EMPTY_DOCUMENT } from "../../domain/outliner/contentTypes";
import { mergeDocuments } from "./document/mergeDocuments";
import { isDocumentEmpty } from "./document/isDocumentEmpty";
import {
  extractPlainText,
  parseStoredContent,
  serializeForDb,
} from "./serialization/contentCodec";

describe("contentCodec", () => {
  it("parses JSON documents", () => {
    const raw = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }],
    });
    expect(extractPlainText(parseStoredContent(raw))).toBe("hello");
  });

  it("migrates legacy plain text", () => {
    expect(extractPlainText(parseStoredContent("legacy note"))).toBe("legacy note");
  });

  it("serializes documents for db storage", () => {
    const doc = parseStoredContent("test");
    expect(JSON.parse(serializeForDb(doc)).type).toBe("doc");
  });
});

describe("mergeDocuments", () => {
  it("joins two documents and returns cursor position", () => {
    const left = parseStoredContent("hello");
    const right = parseStoredContent(" world");
    const { merged, cursorPos } = mergeDocuments(left, right);
    expect(extractPlainText(merged)).toBe("hello world");
    expect(cursorPos).toBe(5);
  });
});

describe("isDocumentEmpty", () => {
  it("treats empty paragraph as empty", () => {
    expect(isDocumentEmpty(EMPTY_DOCUMENT)).toBe(true);
  });
});
