import type { PortalFilter } from "../../../domain/outliner/portalTypes";
import type { BlockContentJSON } from "../../../domain/outliner/contentTypes";
import { normalizePortalSyntaxInDoc } from "./normalizePortalSyntax";

export interface QueryPortalAttrs {
  target: string;
  filter: PortalFilter;
}

export function getQueryPortalAttrs(
  doc: BlockContentJSON,
): QueryPortalAttrs | null {
  const normalized = normalizePortalSyntaxInDoc(doc);
  const top = normalized?.content?.[0];
  if (top?.type !== "queryPortal") {
    return null;
  }

  const target = String(top.attrs?.target ?? "").trim();
  if (target === "") {
    return null;
  }

  return {
    target,
    filter: (top.attrs?.filter ?? "todo") as PortalFilter,
  };
}
