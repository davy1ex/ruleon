import type { BlockContentJSON, BlockContentNode } from "../../../domain/outliner/contentTypes";
import { extractPlainText } from "./extractPlainText";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function walkForWikiLinks(node: BlockContentNode, links: Set<string>): void {
  if (node.type === "wikiLink") {
    const pageName = String(node.attrs?.pageName ?? "");
    const normalized = normalize(pageName);
    if (normalized !== "") {
      links.add(normalized);
    }
    return;
  }

  if ("content" in node && node.content) {
    for (const child of node.content) {
      walkForWikiLinks(child, links);
    }
  }
}

const TAG_PATTERN = /#([\p{L}\p{N}_-]+)/gu;

export function extractLinksFromAST(doc: BlockContentJSON): string[] {
  const linkSet = new Set<string>();

  if (doc?.content) {
    for (const node of doc.content) {
      walkForWikiLinks(node, linkSet);
    }
  }

  return [...linkSet];
}

function extractTagsFromPlainText(doc: BlockContentJSON): string[] {
  const plainText = extractPlainText(doc);
  const tagSet = new Set<string>();
  for (const match of plainText.matchAll(TAG_PATTERN)) {
    const raw = match[1];
    if (!raw) {
      continue;
    }
    const normalized = normalize(raw);
    if (normalized !== "") {
      tagSet.add(normalized);
    }
  }
  return [...tagSet];
}

export function extractLinksAndTagsFromDoc(doc: BlockContentJSON): {
  links: string[];
  tags: string[];
} {
  return {
    links: extractLinksFromAST(doc),
    tags: extractTagsFromPlainText(doc),
  };
}
