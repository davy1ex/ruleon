import type { BlockContentJSON, BlockDocumentJSON } from "../../../domain/outliner/contentTypes";
import { EMPTY_DOCUMENT } from "../../../domain/outliner/contentTypes";
import { normalizePortalSyntaxInDoc } from "./normalizePortalSyntax";

function isBlockDocument(value: unknown): value is BlockDocumentJSON {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as BlockDocumentJSON).type === "doc"
  );
}

function plainTextToDocument(text: string): BlockDocumentJSON {
  if (text === "") {
    return { ...EMPTY_DOCUMENT, content: [{ type: "paragraph" }] };
  }

  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export function parseStoredContent(raw: string | null | undefined): BlockContentJSON {
  if (raw == null || raw === "") {
    return { ...EMPTY_DOCUMENT, content: [{ type: "paragraph" }] };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isBlockDocument(parsed)) {
      return normalizePortalSyntaxInDoc(parsed);
    }
  } catch {
    // Legacy plain-text row
  }

  return normalizePortalSyntaxInDoc(plainTextToDocument(raw));
}
