import type { BlockContentJSON, BlockContentNode } from "../outliner/contentTypes";
import type { OutlineTreeNode, TaskStatus } from "../outliner/types";

function inlineNodesToText(nodes: BlockContentNode[]): string {
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      parts.push(node.text ?? "");
      continue;
    }
    if (node.type === "wikiLink") {
      parts.push(`[[${String(node.attrs?.pageName ?? "")}]]`);
      continue;
    }
    if (node.type === "hardBreak") {
      parts.push("\n");
      continue;
    }
    if (node.type === "queryPortal") {
      const target = String(node.attrs?.target ?? "");
      parts.push(`{{query: ${target}}}`);
      continue;
    }
    if ("content" in node && node.content) {
      parts.push(inlineNodesToText(node.content));
    }
  }

  return parts.join("");
}

function bulletPrefix(taskStatus: TaskStatus | null): string {
  if (taskStatus === "TODO") {
    return "- [ ] ";
  }
  if (taskStatus === "DONE") {
    return "- [x] ";
  }
  return "- ";
}

export function blockDocToLine(
  doc: BlockContentJSON,
  taskStatus: TaskStatus | null,
): string {
  const top = doc?.content?.[0];
  if (top?.type === "queryPortal") {
    const target = String(top.attrs?.target ?? "");
    return `${bulletPrefix(taskStatus)}{{query: ${target}}}`;
  }

  const inline =
    top && "content" in top && top.content ? top.content : [];
  const text = inlineNodesToText(inline);
  return `${bulletPrefix(taskStatus)}${text}`;
}

export function appendBlocksAsMarkdown(
  nodes: OutlineTreeNode[],
  lines: string[],
  depth: number,
): void {
  for (const node of nodes) {
    const indent = "\t".repeat(depth);
    lines.push(`${indent}${blockDocToLine(node.content, node.task_status)}`);
    if (node.children.length > 0) {
      appendBlocksAsMarkdown(node.children, lines, depth + 1);
    }
  }
}
