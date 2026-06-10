import type {
  BlockContentJSON,
  BlockContentNode,
  BlockDocumentJSON,
} from "../../../domain/outliner/contentTypes";
import { parsePortalTarget } from "../extensions/queryPortalSyntax";

function paragraphText(node: BlockContentNode): string {
  if (node.type !== "paragraph" || !node.content) {
    return "";
  }

  return node.content
    .map((child) => (child.type === "text" ? (child.text ?? "") : ""))
    .join("");
}

function portalNodeFromText(text: string): BlockContentNode | null {
  const target = parsePortalTarget(text);
  if (!target) {
    return null;
  }

  return {
    type: "queryPortal",
    attrs: { target, filter: "todo" },
  };
}

export function normalizePortalSyntaxInDoc(
  doc: BlockContentJSON,
): BlockContentJSON {
  if (!doc?.content) {
    return doc;
  }

  const content = doc.content.flatMap((node) => {
    if (node.type !== "paragraph") {
      return [node];
    }

    const portal = portalNodeFromText(paragraphText(node));
    return portal ? [portal] : [node];
  });

  return { ...(doc as BlockDocumentJSON), content };
}
