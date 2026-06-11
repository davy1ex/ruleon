import { useEffect } from "react";
import type { PortalFilter } from "../domain/outliner/portalTypes";
import {
  portalCacheKey,
  resolveEffectivePortalFilter,
} from "../domain/outliner/portalTypes";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { getDbContext } from "../store/dbContext";
import { useOutlinerStore } from "../store/outlinerStore";

export function useQueryPortalResults(
  target: string,
  filter: PortalFilter,
): { rows: FlatOutlineNode[]; loading: boolean; effectiveFilter: PortalFilter } {
  const pageTitle = useOutlinerStore((state) => state.currentPageTitle);
  const effectiveFilter = resolveEffectivePortalFilter(target, filter, pageTitle);
  const key = portalCacheKey(target, effectiveFilter);
  const loadPortalResults = useOutlinerStore((state) => state.loadPortalResults);
  const rows = useOutlinerStore((state) => state.portalResultsCache[key]);

  useEffect(() => {
    const trimmed = target.trim();
    if (trimmed === "") {
      return;
    }

    const context = getDbContext();
    if (!context) {
      return;
    }

    const reload = () => {
      void loadPortalResults(trimmed, effectiveFilter);
    };

    reload();
    return context.rx.onRange(["outline_nodes", "block_links"], reload);
  }, [target, effectiveFilter, loadPortalResults]);

  return {
    rows: rows ?? [],
    loading: rows === undefined,
    effectiveFilter,
  };
}
