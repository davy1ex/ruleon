import type {
  BlockContentJSON,
  BlockContentNode,
  BlockDocumentJSON,
} from "../../../domain/outliner/contentTypes";
import { EMPTY_DOCUMENT } from "../../../domain/outliner/contentTypes";
import { parseBlockSegments } from "../../outliner/parseBlockSegments";
import { parsePortalTarget } from "../extensions/queryPortalSyntax";
import { normalizePortalSyntaxInDoc } from "./normalizePortalSyntax";

function isBlockDocument(value: unknown): value is BlockDocumentJSON {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as BlockDocumentJSON).type === "doc"
  );
}

const EMPTY_PARAGRAPH_DOC: BlockDocumentJSON = {
  ...EMPTY_DOCUMENT,
  content: [{ type: "paragraph" }],
};

function plainTextToDocument(text: string): BlockDocumentJSON {
  if (text === "") {
    return { ...EMPTY_PARAGRAPH_DOC };
  }

  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export function plainTextToBlockContent(text: string): BlockContentJSON {
  const trimmed = text.trim();
  const portalTarget = parsePortalTarget(trimmed);
  if (portalTarget && trimmed.startsWith("{{query")) {
    return normalizePortalSyntaxInDoc({
      type: "doc",
      content: [
        {
          type: "queryPortal",
          attrs: { target: portalTarget, filter: "todo" },
        },
      ],
    });
  }

  if (text === "") {
    return normalizePortalSyntaxInDoc({ ...EMPTY_PARAGRAPH_DOC });
  }

  const segments = parseBlockSegments(text);
  const inline: BlockContentNode[] = [];
  for (const segment of segments) {
    if (segment.type === "text") {
      if (segment.value) {
        inline.push({ type: "text", text: segment.value });
      }
    } else {
      inline.push({ type: "wikiLink", attrs: { pageName: segment.name } });
    }
  }

  if (inline.length === 0) {
    return normalizePortalSyntaxInDoc({ ...EMPTY_PARAGRAPH_DOC });
  }

  return normalizePortalSyntaxInDoc({
    type: "doc",
    content: [{ type: "paragraph", content: inline }],
  });
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
