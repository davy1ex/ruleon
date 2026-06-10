import type { BlockContentJSON, BlockContentNode } from "../../../domain/outliner/contentTypes";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function walkReplace(
  node: BlockContentNode,
  oldNormalized: string,
  newName: string,
): BlockContentNode {
  if (node.type === "wikiLink") {
    const pageName = String(node.attrs?.pageName ?? "");
    if (normalize(pageName) === oldNormalized) {
      return {
        ...node,
        attrs: { ...node.attrs, pageName: newName },
      };
    }
    return node;
  }

  if ("content" in node && node.content) {
    return {
      ...node,
      content: node.content.map((child: BlockContentNode) =>
        walkReplace(child, oldNormalized, newName),
      ),
    };
  }

  return node;
}

export function replaceWikiLinkInDoc(
  doc: BlockContentJSON,
  oldName: string,
  newName: string,
): BlockContentJSON {
  if (!doc?.content) {
    return doc;
  }

  const oldNormalized = normalize(oldName);
  return {
    ...doc,
    content: doc.content.map((node) =>
      walkReplace(node, oldNormalized, newName),
    ),
  };
}
