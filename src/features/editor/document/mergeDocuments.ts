import type {
  BlockContentJSON,
  BlockContentNode,
  BlockDocumentJSON,
} from "../../../domain/outliner/contentTypes";
import { EMPTY_DOCUMENT } from "../../../domain/outliner/contentTypes";
import { extractPlainText } from "../serialization/extractPlainText";

function cloneDoc(doc: BlockContentJSON): BlockDocumentJSON {
  if (!doc) {
    return { ...EMPTY_DOCUMENT, content: [{ type: "paragraph" }] };
  }
  return JSON.parse(JSON.stringify(doc)) as BlockDocumentJSON;
}

function ensureParagraphs(content: BlockContentNode[] | undefined): BlockContentNode[] {
  if (!content || content.length === 0) {
    return [{ type: "paragraph" }];
  }
  return content;
}

function appendParagraphContent(
  target: BlockContentNode[],
  source: BlockContentNode[],
): BlockContentNode[] {
  if (source.length === 0) {
    return target;
  }

  const next = [...target];
  const lastIndex = next.length - 1;
  const last = next[lastIndex];

  if (last?.type === "paragraph" && source[0]?.type === "paragraph") {
    next[lastIndex] = {
      type: "paragraph",
      content: [...(last.content ?? []), ...(source[0].content ?? [])],
    };
    return [...next, ...source.slice(1)];
  }

  return [...next, ...source];
}

export function mergeDocuments(
  target: BlockContentJSON,
  source: BlockContentJSON,
): { merged: BlockContentJSON; cursorPos: number } {
  const left = cloneDoc(target);
  const right = cloneDoc(source);

  const cursorPos = extractPlainText(left).length;

  left.content = appendParagraphContent(
    ensureParagraphs(left.content),
    ensureParagraphs(right.content),
  );

  return { merged: left, cursorPos };
}
