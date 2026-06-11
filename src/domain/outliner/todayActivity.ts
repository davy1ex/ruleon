import type { RuleonDb as DB } from "../db/types";
import { extractPlainText } from "../../features/editor/serialization/extractPlainText";
import {
  formatDatePageDisplay,
  isDatePage,
  normalizePageTitle,
} from "../pages/PageRegistry";
import { todayDateKey } from "../../features/gamification/types";
import { parseStoredContent } from "../../features/editor/serialization/parseStoredContent";
import { OUTLINE_NODE_COLUMNS, normalizeRow } from "./pageQueries";
import type { FlatOutlineNode, OutlineNodeDbRow, OutlineNodeRow } from "./types";

export interface TodayCompletedTask {
  id: string;
  title: string;
  pageTitle: string;
  pageRootId: string;
  pageName: string;
  completedAt: string;
}

export interface TodayProject {
  rootId: string;
  title: string;
  pageName: string;
}

export interface TodayActivity {
  tasks: TodayCompletedTask[];
  projects: TodayProject[];
}

export function isCompletedOnDate(
  completedAt: string,
  dateKey: string,
  referenceDate = new Date(),
): boolean {
  if (!completedAt) {
    return false;
  }
  const parsed = new Date(completedAt);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return todayDateKey(parsed) === dateKey;
}

function findRootId(
  nodeId: string,
  parentById: Map<string, string | null>,
): string {
  let current = nodeId;
  while (true) {
    const parentId = parentById.get(current);
    if (parentId === null || parentId === undefined) {
      return current;
    }
    current = parentId;
  }
}

function formatPageLabel(title: string, rootId: string): string {
  const normalized = normalizePageTitle(title, rootId);
  if (isDatePage(normalized)) {
    return formatDatePageDisplay(normalized) ?? normalized;
  }
  return normalized;
}

function looksLikeStoredDocJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") && trimmed.includes('"type"');
}

function taskTitleFromRow(node: OutlineNodeRow, rawContent: string): string {
  const fromNode = extractPlainText(node.content).trim();
  if (fromNode) {
    return fromNode;
  }

  const fromParsed = extractPlainText(parseStoredContent(rawContent)).trim();
  if (fromParsed) {
    return fromParsed;
  }

  if (!looksLikeStoredDocJson(rawContent)) {
    const legacy = rawContent.trim();
    if (legacy) {
      return legacy;
    }
  }

  return "Untitled task";
}

function isBrokenTaskTitle(title: string): boolean {
  return (
    title.length === 0 ||
    title === "Untitled task" ||
    looksLikeStoredDocJson(title)
  );
}

export function enrichTaskTitlesFromMemory(
  tasks: TodayCompletedTask[],
  nodesByRootId: Record<string, FlatOutlineNode[]>,
): TodayCompletedTask[] {
  const memoryById = new Map(
    Object.values(nodesByRootId)
      .flat()
      .map((node) => [node.id, node]),
  );

  return tasks.map((task) => {
    const memory = memoryById.get(task.id);
    if (!memory) {
      return task;
    }
    const memoryTitle = extractPlainText(memory.content).trim();
    if (!memoryTitle) {
      return task;
    }
    if (isBrokenTaskTitle(task.title)) {
      return { ...task, title: memoryTitle };
    }
    return task;
  });
}

export function buildTodayActivity(
  doneNodes: Array<{ node: OutlineNodeRow; rawContent: string }>,
  allNodes: OutlineNodeRow[],
  dateKey = todayDateKey(),
  referenceDate = new Date(),
): TodayActivity {
  const parentById = new Map(allNodes.map((node) => [node.id, node.parent_id]));
  const nodeById = new Map(allNodes.map((node) => [node.id, node]));

  const tasks = doneNodes
    .filter(
      ({ node }) =>
        node.task_status === "DONE" &&
        isCompletedOnDate(
          node.metadata.completed_at ?? "",
          dateKey,
          referenceDate,
        ),
    )
    .map(({ node, rawContent }) => {
      const rootId = findRootId(node.id, parentById);
      const root = nodeById.get(rootId);
      const rawPageTitle = root ? extractPlainText(root.content) : "";
      const pageName = normalizePageTitle(rawPageTitle, rootId);
      return {
        id: node.id,
        title: taskTitleFromRow(node, rawContent),
        pageTitle: formatPageLabel(rawPageTitle, rootId),
        pageRootId: rootId,
        pageName,
        completedAt: node.metadata.completed_at ?? "",
      };
    })
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt));

  const projects: TodayProject[] = [];
  const seenRootIds = new Set<string>();
  for (const task of tasks) {
    if (seenRootIds.has(task.pageRootId) || task.pageName.length === 0) {
      continue;
    }
    seenRootIds.add(task.pageRootId);
    projects.push({
      rootId: task.pageRootId,
      title: task.pageTitle,
      pageName: task.pageName,
    });
  }

  return { tasks, projects };
}

export async function getTodayActivity(
  db: DB,
  dateKey = todayDateKey(),
  referenceDate = new Date(),
): Promise<TodayActivity> {
  const [doneStmt, allStmt] = await Promise.all([
    db.prepare(
      `SELECT ${OUTLINE_NODE_COLUMNS}
       FROM outline_nodes
       WHERE task_status = 'DONE'
         AND json_extract(metadata, '$.completed_at') IS NOT NULL`,
    ),
    db.prepare(`SELECT id, parent_id, content FROM outline_nodes`),
  ]);

  const [doneRows, allRows] = await Promise.all([
    doneStmt.all(null) as Promise<OutlineNodeDbRow[]>,
    allStmt.all(null) as Promise<
      Pick<OutlineNodeDbRow, "id" | "parent_id" | "content">[]
    >,
  ]);

  await Promise.all([doneStmt.finalize(null), allStmt.finalize(null)]);

  const doneNodes = doneRows.map((row) => ({
    node: normalizeRow(row),
    rawContent: row.content,
  }));
  const allNodes = allRows.map((row) =>
    normalizeRow({
      ...row,
      sort_order: 0,
      collapsed: 0,
      task_status: null,
      metadata: "{}",
      created_at: 0,
      updated_at: 0,
    }),
  );

  return buildTodayActivity(doneNodes, allNodes, dateKey, referenceDate);
}
