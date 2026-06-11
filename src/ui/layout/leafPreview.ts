import type { FlatOutlineNode } from "../../domain/outliner/types";
import { extractPlainText } from "../../features/editor/serialization/extractPlainText";
import type {
  EditorLeafState,
  SearchLeafState,
  WorkspaceLeaf,
} from "../../store/workspaceStore";

const PREVIEW_MAX_LENGTH = 140;

function truncatePreview(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= PREVIEW_MAX_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, PREVIEW_MAX_LENGTH - 1)}…`;
}

function previewFromNodes(nodes: FlatOutlineNode[]): string {
  const parts: string[] = [];
  for (const node of nodes) {
    if (!node.content) {
      continue;
    }
    const text = extractPlainText(node.content).trim();
    if (text) {
      parts.push(text);
    }
  }
  return truncatePreview(parts.join(" · "));
}

export function getLeafPreview(
  leaf: WorkspaceLeaf,
  nodesByRootId: Record<string, FlatOutlineNode[]>,
): string {
  switch (leaf.type) {
    case "editor": {
      const { rootId } = leaf.state as EditorLeafState;
      if (!rootId) {
        return "";
      }
      const nodes = nodesByRootId[rootId];
      return nodes?.length ? previewFromNodes(nodes) : "";
    }
    case "journal":
      return "Daily journal and history";
    case "search": {
      const { query } = leaf.state as SearchLeafState;
      return query.trim() ? `Search: ${query.trim()}` : "Search all pages";
    }
    case "settings":
      return "App preferences and sync";
    case "trash":
      return "Deleted pages";
    default:
      return "";
  }
}
