import { getPortalBlocks } from "../domain/outliner/queries";
import type { PortalFilter } from "../domain/outliner/portalTypes";
import { portalCacheKey } from "../domain/outliner/portalTypes";
import type { FlatOutlineNode, OutlineNodeRow } from "../domain/outliner/types";
import { getDbContext } from "./dbContext";

function toFlatPortalRow(row: OutlineNodeRow): FlatOutlineNode {
  return {
    ...row,
    depth: 0,
    hasChildren: false,
  };
}

type StoreGet = () => {
  portalResultsCache?: Record<string, FlatOutlineNode[] | undefined>;
  refreshGeneration?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoreSet = (partial: any) => void;

export function invalidatePortalCache(set: StoreSet): void {
  set({ portalResultsCache: {} });
}

export function bumpRefreshGeneration(get: StoreGet, set: StoreSet): void {
  const current = get().refreshGeneration ?? 0;
  set({
    refreshGeneration: current + 1,
    portalResultsCache: {},
  });
}

export async function runLoadPortalResults(
  target: string,
  filter: PortalFilter,
  get: StoreGet,
  set: StoreSet,
): Promise<FlatOutlineNode[]> {
  const key = portalCacheKey(target, filter);
  const cache = get().portalResultsCache ?? {};
  const db = getDbContext()?.db;
  if (!db || target.trim() === "") {
    set({
      portalResultsCache: {
        ...cache,
        [key]: [],
      },
    });
    return [];
  }

  const rows = await getPortalBlocks(db, target, filter);
  const flat = rows.map(toFlatPortalRow);
  set({
    portalResultsCache: {
      ...cache,
      [key]: flat,
    },
  });
  return flat;
}

export function patchPortalResultsTaskStatus(
  cache: Record<string, FlatOutlineNode[] | undefined>,
  ids: string[],
  nextStatus: FlatOutlineNode["task_status"],
): Record<string, FlatOutlineNode[] | undefined> {
  const idSet = new Set(ids);
  const result: Record<string, FlatOutlineNode[] | undefined> = {};

  for (const [key, rows] of Object.entries(cache)) {
    if (!rows) {
      result[key] = rows;
      continue;
    }

    const filter = key.endsWith(":todo") ? "todo" : "all";
    result[key] = rows
      .map((row) =>
        idSet.has(row.id) ? { ...row, task_status: nextStatus } : row,
      )
      .filter((row) => {
        if (filter !== "todo") {
          return true;
        }
        return row.task_status === "TODO";
      });
  }

  return result;
}
