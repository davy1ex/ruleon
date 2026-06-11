import {
  formatDatePageTitle,
  getOrCreatePage,
  isDatePage,
  normalizePageTitle,
} from "../domain/pages/PageRegistry";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { renamePageGlobally } from "../domain/outliner/mutations/rename";
import { moveToTrash, restoreFromTrash } from "../domain/outliner/mutations/trash";
import { getNodeById } from "../domain/outliner/queries";
import type { RuleonDb as DB } from "../domain/db/types";
import { ensureEmptyBlock, isSystemTrashRootId } from "./journal";

type PageNavigateSet = (partial: {
  currentRootId: string;
  focusedNodeId: string | null;
  selectedIds: string[];
}) => void;

export async function runNavigateToPage(
  db: DB,
  pageName: string,
  set: PageNavigateSet,
): Promise<string | null> {
  const trimmedName = pageName.trim();
  if (trimmedName === "") {
    return null;
  }

  const page = await getOrCreatePage(db, trimmedName);
  const newBlockId = await ensureEmptyBlock(db, page.id);
  set({
    currentRootId: page.id,
    selectedIds: [],
    focusedNodeId: newBlockId,
  });
  return page.id;
}

export async function runNavigateToToday(
  db: DB,
  set: PageNavigateSet,
): Promise<string | null> {
  return runNavigateToPage(db, formatDatePageTitle(), set);
}

export async function runRenameCurrentPage(
  db: DB,
  pageId: string,
  oldName: string,
  newName: string,
): Promise<boolean> {
  const trimmedNewName = newName.trim();
  if (
    trimmedNewName === "" ||
    isDatePage(oldName.trim()) ||
    oldName.trim() === trimmedNewName
  ) {
    return false;
  }

  await renamePageGlobally(db, pageId, oldName, trimmedNewName);
  return true;
}

export async function runTrashCurrentPage(
  db: DB,
  pageId: string,
): Promise<boolean> {
  if (isSystemTrashRootId(pageId)) {
    return false;
  }

  await moveToTrash(db, pageId);
  return true;
}

export async function runRestorePage(db: DB, nodeId: string): Promise<void> {
  await restoreFromTrash(db, nodeId);
}

export async function resolvePageTitle(
  db: DB,
  pageId: string,
): Promise<string | null> {
  const node = await getNodeById(db, pageId);
  if (!node || node.parent_id !== null) {
    return null;
  }
  return normalizePageTitle(extractPlainText(node.content), node.id);
}
