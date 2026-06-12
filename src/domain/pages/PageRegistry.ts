import type { RuleonDb as DB } from "../db/types";
import { extractPlainText } from "../../features/editor/serialization/extractPlainText";
import { createNode } from "../outliner/mutations/create";
import { findPageRootByName, getNodeById } from "../outliner/queries";
import { createNodeId } from "../outliner/seed";

export interface PageRecord {
  id: string;
  title: string;
}

const DATE_PAGE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDatePageTitle(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDatePage(title: string): boolean {
  return DATE_PAGE_PATTERN.test(title);
}

export function legacyJournalIdForDateTitle(title: string): string {
  return `journal-${title}`;
}

export function normalizePageTitle(content: string, id: string): string {
  if (isDatePage(content)) {
    return content;
  }

  const legacyMatch = id.match(/^journal-(\d{4}-\d{2}-\d{2})$/);
  if (legacyMatch) {
    return legacyMatch[1];
  }

  return content;
}

export function formatDatePageDisplay(title: string): string | null {
  if (!isDatePage(title)) {
    return null;
  }

  const [year, month, day] = title.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  return `${months[date.getMonth()]} ${day}${suffix}, ${year}`;
}

async function isNodeTrashed(db: DB, nodeId: string): Promise<boolean> {
  const stmt = await db.prepare(
    `SELECT 1 FROM trashed_nodes WHERE node_id = ? LIMIT 1`,
  );
  const row = await stmt.get(null, nodeId);
  await stmt.finalize(null);
  return row !== undefined;
}

export async function getPageByTitle(
  db: DB,
  title: string,
): Promise<PageRecord | null> {
  const trimmedTitle = title.trim();
  if (trimmedTitle === "") {
    return null;
  }

  const byContent = await findPageRootByName(db, trimmedTitle);
  if (byContent) {
    return {
      id: byContent.id,
      title: normalizePageTitle(extractPlainText(byContent.content), byContent.id),
    };
  }

  if (isDatePage(trimmedTitle)) {
    const legacyId = legacyJournalIdForDateTitle(trimmedTitle);
    const legacy = await getNodeById(db, legacyId);
    if (legacy?.parent_id === null && !(await isNodeTrashed(db, legacyId))) {
      return { id: legacy.id, title: trimmedTitle };
    }
  }

  return null;
}

export async function getOrCreatePage(
  db: DB,
  title: string,
): Promise<PageRecord> {
  const existing = await getPageByTitle(db, title);
  if (existing) {
    return existing;
  }

  const trimmedTitle = title.trim();
  const id = isDatePage(trimmedTitle)
    ? legacyJournalIdForDateTitle(trimmedTitle)
    : createNodeId();
  await createNode(db, null, trimmedTitle, undefined, id);
  return { id, title: trimmedTitle };
}
