import type { BlockContentJSON } from "../../../domain/outliner/contentTypes";
import { getQueryPortalAttrs } from "../serialization/queryPortalContent";
import { extractPlainText } from "../serialization/extractPlainText";

export function isDocumentEmpty(doc: BlockContentJSON): boolean {
  if (getQueryPortalAttrs(doc)) {
    return false;
  }
  return extractPlainText(doc).trim() === "";
}
