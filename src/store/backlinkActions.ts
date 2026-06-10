import type { RuleonDb as DB } from "../domain/db/types";
import {
  getAllNodes,
  getLinkedReferences,
  getNodeById,
} from "../domain/outliner/queries";
import type { FlatOutlineNode, OutlineNodeRow } from "../domain/outliner/types";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { buildFlatSubtreeForAnchor } from "../features/outliner/subtreeFlat";
import { isSystemTrashRootId } from "./journal";

export interface LinkedReferenceState {
  linkedReferences: OutlineNodeRow[];
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
  currentPageTitle: string | null;
}

export function emptyLinkedReferenceState(): LinkedReferenceState {
  return {
    linkedReferences: [],
    linkedReferenceNodesById: {},
    currentPageTitle: null,
  };
}

export async function runLoadLinkedReferences(
  db: DB,
  pageName: string,
): Promise<LinkedReferenceState> {
  const refs = await getLinkedReferences(db, pageName);
  const allRows = await getAllNodes(db);
  const linkedReferenceNodesById: Record<string, FlatOutlineNode[]> = {};

  for (const ref of refs) {
    linkedReferenceNodesById[ref.id] = buildFlatSubtreeForAnchor(ref.id, allRows);
  }

  return {
    linkedReferences: refs,
    linkedReferenceNodesById,
    currentPageTitle: pageName,
  };
}

export async function resolveLinkedReferenceState(
  db: DB,
  rootId: string,
): Promise<LinkedReferenceState> {
  if (isSystemTrashRootId(rootId)) {
    return emptyLinkedReferenceState();
  }

  const root = await getNodeById(db, rootId);
  if (!root) {
    return emptyLinkedReferenceState();
  }

  return runLoadLinkedReferences(db, extractPlainText(root.content));
}
