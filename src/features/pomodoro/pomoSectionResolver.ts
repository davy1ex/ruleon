import type { RuleonDb as DB } from "../../domain/db/types";
import { getOrCreatePage } from "../../domain/pages/PageRegistry";
import { createNode } from "../../domain/outliner/mutations/create";
import { updateContent } from "../../domain/outliner/mutations/update";
import { computeFractionalSortOrder } from "../../domain/outliner/sortOrder";
import { getNodeById, getSiblings } from "../../domain/outliner/queries";
import { parseStoredContent } from "../editor/serialization/parseStoredContent";
import { extractPlainText } from "../editor/serialization/extractPlainText";

export const POMO_SECTION_TITLE = "# Pomo todays";

export async function resolveDayRootId(
  db: DB,
  dayPageTitle: string,
): Promise<string> {
  const page = await getOrCreatePage(db, dayPageTitle);
  return page.id;
}

export async function findPomoSectionId(
  db: DB,
  dayRootId: string,
): Promise<string | null> {
  const children = await getSiblings(db, dayRootId);

  for (const child of children) {
    const plain = extractPlainText(child.content).trim();
    if (plain === POMO_SECTION_TITLE) {
      return child.id;
    }
  }

  return null;
}

export async function ensurePomoSectionId(
  db: DB,
  dayRootId: string,
): Promise<string> {
  const existing = await findPomoSectionId(db, dayRootId);
  if (existing) {
    return existing;
  }

  const siblings = await getSiblings(db, dayRootId);
  const lastOrder =
    siblings.length > 0 ? siblings[siblings.length - 1]!.sort_order : null;
  const newOrder = computeFractionalSortOrder(lastOrder, null);
  const headerDoc = parseStoredContent(POMO_SECTION_TITLE);

  return createNode(db, dayRootId, headerDoc, newOrder);
}

export async function createPomoLogBlockIfAbsent(
  db: DB,
  sectionId: string,
  logLine: string,
  blockId: string,
): Promise<boolean> {
  const existing = await getNodeById(db, blockId);
  if (existing) {
    return false;
  }

  const logDoc = parseStoredContent(logLine);
  const sectionChildren = await getSiblings(db, sectionId);
  const lastChild = sectionChildren[sectionChildren.length - 1] ?? null;
  const prevOrder = lastChild?.sort_order ?? null;
  const newOrder = computeFractionalSortOrder(prevOrder, null);

  await createNode(db, sectionId, logDoc, newOrder, blockId);
  return true;
}

export async function updatePomoLogBlock(
  db: DB,
  blockId: string,
  logLine: string,
): Promise<boolean> {
  const existing = await getNodeById(db, blockId);
  if (!existing) {
    return false;
  }

  const logDoc = parseStoredContent(logLine);
  await updateContent(db, blockId, logDoc);
  return true;
}

/** @deprecated Use createPomoLogBlockIfAbsent */
export async function appendLogLineToSection(
  db: DB,
  sectionId: string,
  logLine: string,
  nodeId: string,
): Promise<boolean> {
  return createPomoLogBlockIfAbsent(db, sectionId, logLine, nodeId);
}
