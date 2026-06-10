import { buildTree } from "../../features/outliner/buildTree";
import { normalizeRow, pageTitleFromStored } from "../outliner/pageQueries";
import type { DBAsync } from "@vlcn.io/xplat-api";
import type { OutlineNodeDbRow, OutlineTreeNode } from "../outliner/types";
import type { MarkdownBackupFile } from "./backupTypes";
import { appendBlocksAsMarkdown } from "./astToMarkdown";

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

export function sanitizeFilename(title: string): string {
  const cleaned = title.replace(INVALID_FILENAME_CHARS, "-").trim();
  return cleaned === "" ? "untitled" : cleaned;
}

function findNodeInTree(
  nodes: OutlineTreeNode[],
  id: string,
): OutlineTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findNodeInTree(node.children, id);
    if (child) {
      return child;
    }
  }
  return null;
}

async function loadAllOutlineNodes(db: DBAsync): Promise<OutlineNodeDbRow[]> {
  const stmt = await db.prepare(
    `SELECT id, parent_id, content, sort_order, collapsed, task_status, created_at, updated_at
     FROM outline_nodes
     WHERE id NOT IN (SELECT node_id FROM trashed_nodes)`,
  );
  const rows = (await stmt.all(null)) as OutlineNodeDbRow[];
  await stmt.finalize(null);
  return rows;
}

export async function exportAllPagesAsMarkdown(
  db: DBAsync,
): Promise<MarkdownBackupFile[]> {
  const roots = await db.execA<[string, string]>(
    `SELECT id, content
     FROM outline_nodes
     WHERE parent_id IS NULL
       AND id NOT IN (SELECT node_id FROM trashed_nodes)
     ORDER BY sort_order, created_at`,
  );

  const allNodes = await loadAllOutlineNodes(db);
  const tree = buildTree(allNodes.map(normalizeRow));

  return roots.map(([rootId, rootContent]) => {
    const title = pageTitleFromStored(rootContent);
    const pageNode = findNodeInTree(tree, rootId);
    const lines: string[] = [`# ${title}`, ""];
    appendBlocksAsMarkdown(pageNode?.children ?? [], lines, 0);
    return {
      filename: `${sanitizeFilename(title)}.md`,
      content: lines.join("\n"),
    };
  });
}
