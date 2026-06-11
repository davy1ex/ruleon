import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { FlatOutlineNode } from "../../domain/outliner/types";
import { buildNodesByRootIds } from "../../store/feedHelpers";
import { getDbContext } from "../../store/dbContext";
import { isDailyFeedRootId, isSystemTrashRootId } from "../../store/journal";
import { useOutlinerStore } from "../../store/outlinerStore";
import {
  useWorkspaceStore,
  type EditorLeafState,
} from "../../store/workspaceStore";
import { getLeafPreview } from "./leafPreview";
import { TabLeafIcon } from "./tabLeafIcon";

function mergePreviewNodes(
  cached: Record<string, FlatOutlineNode[]>,
  live: Record<string, FlatOutlineNode[]>,
): Record<string, FlatOutlineNode[]> {
  return { ...cached, ...live };
}

export function MobileTabList() {
  const leafOrder = useWorkspaceStore((s) => s.leafOrder);
  const leaves = useWorkspaceStore((s) => s.leaves);
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const activateLeaf = useWorkspaceStore((s) => s.activateLeaf);
  const closeLeaf = useWorkspaceStore((s) => s.closeLeaf);
  const nodesByRootId = useOutlinerStore((s) => s.nodesByRootId);
  const [fetchedNodesByRootId, setFetchedNodesByRootId] = useState<
    Record<string, FlatOutlineNode[]>
  >({});

  const editorRootIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of leafOrder) {
      const leaf = leaves[id];
      if (leaf?.type !== "editor") {
        continue;
      }
      const rootId = (leaf.state as EditorLeafState).rootId;
      if (
        rootId &&
        !isSystemTrashRootId(rootId) &&
        !isDailyFeedRootId(rootId)
      ) {
        ids.add(rootId);
      }
    }
    return [...ids];
  }, [leafOrder, leaves]);

  const editorRootIdsKey = editorRootIds.join("|");

  useEffect(() => {
    const db = getDbContext()?.db;
    if (!db || editorRootIds.length === 0) {
      setFetchedNodesByRootId({});
      return;
    }

    let cancelled = false;
    void buildNodesByRootIds(db, editorRootIds).then((nodes) => {
      if (!cancelled) {
        setFetchedNodesByRootId(nodes);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [editorRootIdsKey, editorRootIds]);

  const previewNodesByRootId = useMemo(
    () => mergePreviewNodes(fetchedNodesByRootId, nodesByRootId),
    [fetchedNodesByRootId, nodesByRootId],
  );

  const canClose = leafOrder.length > 1;

  return (
    <div className="flex flex-col">
      {leafOrder.map((id) => {
        const leaf = leaves[id];
        if (!leaf) {
          return null;
        }

        const isActive = id === activeLeafId;
        const preview = getLeafPreview(leaf, previewNodesByRootId);

        return (
          <div
            key={id}
            className={`flex items-start gap-1 border-b border-border ${
              isActive ? "bg-accent-muted/40" : "bg-surface-primary"
            }`}
          >
            <button
              type="button"
              onClick={() => activateLeaf(id)}
              className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 text-left"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 opacity-70">
                  <TabLeafIcon type={leaf.type} size={16} />
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${
                    isActive ? "text-accent" : "text-text-normal"
                  }`}
                >
                  {leaf.title}
                </span>
              </div>
              {preview ? (
                <p className="line-clamp-2 pl-6 text-xs leading-relaxed text-text-muted">
                  {preview}
                </p>
              ) : null}
            </button>
            {canClose ? (
              <button
                type="button"
                onClick={() => closeLeaf(id)}
                className="mr-2 mt-3 shrink-0 rounded p-1 text-text-muted hover:bg-interactive-hover hover:text-text-normal"
                aria-label={`Close ${leaf.title}`}
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
