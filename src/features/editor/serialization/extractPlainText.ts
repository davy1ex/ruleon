import type { BlockContentJSON, BlockContentNode } from "../../../domain/outliner/contentTypes";

function walkNode(node: BlockContentNode, parts: string[]): void {
  if (node.type === "text") {
    if (node.text) {
      parts.push(node.text);
    }
    return;
  }

  if (node.type === "wikiLink") {
    const pageName = String(node.attrs?.pageName ?? "");
    if (pageName) {
      parts.push(`[[${pageName}]]`);
    }
    return;
  }

  if (node.type === "hardBreak") {
    parts.push("\n");
    return;
  }

  if ("content" in node && node.content) {
    for (const child of node.content) {
      walkNode(child, parts);
    }
  }
}

export function extractPlainText(doc: BlockContentJSON): string {
  if (!doc?.content) {
    return "";
  }

  const parts: string[] = [];
  for (const node of doc.content) {
    walkNode(node, parts);
  }
  return parts.join("");
}
