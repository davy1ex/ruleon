import type { BlockContentJSON } from "../../../domain/outliner/contentTypes";
import { EMPTY_DOCUMENT } from "../../../domain/outliner/contentTypes";

export function serializeForDb(doc: BlockContentJSON): string {
  const payload = doc ?? EMPTY_DOCUMENT;
  return JSON.stringify(payload);
}
