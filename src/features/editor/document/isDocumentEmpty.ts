import type { BlockContentJSON } from "../../../domain/outliner/contentTypes";
import { extractPlainText } from "../serialization/extractPlainText";

export function isDocumentEmpty(doc: BlockContentJSON): boolean {
  return extractPlainText(doc).trim() === "";
}
