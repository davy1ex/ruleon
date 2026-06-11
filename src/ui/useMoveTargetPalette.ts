import { useCallback, useEffect, useMemo, useState } from "react";
import { inferDateTitleFromQuery } from "../domain/pages/dateQuery";
import { partitionPages } from "../domain/pages/Indexer";
import { formatDatePageDisplay } from "../domain/pages/PageRegistry";
import { isInboxPageId } from "../domain/outliner/inboxPage";
import { useOutlinerStore } from "../store/outlinerStore";
import type { PaletteItem } from "./usePageSearchPalette";

export function useMoveTargetPalette(nodeId: string | null) {
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const pagesList = useOutlinerStore((s) => s.pagesList);
  const moveNodeToPage = useOutlinerStore((s) => s.moveNodeToPage);
  const closeMoveTarget = useOutlinerStore((s) => s.closeMoveTarget);
  const navigateToPage = useOutlinerStore((s) => s.navigateToPage);

  const paletteItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const { dailyNotes, regularPages } = partitionPages(pagesList);
    const allPages = [...dailyNotes, ...regularPages].filter(
      (page) => !isInboxPageId(page.id),
    );

    const matchedPages = normalizedQuery
      ? allPages.filter((page) =>
          page.title.toLowerCase().includes(normalizedQuery),
        )
      : allPages;

    const items: PaletteItem[] = matchedPages.map((page) => ({
      id: page.id,
      label: page.title,
      kind: "page",
    }));

    const dateJump = inferDateTitleFromQuery(query);
    if (
      dateJump &&
      !items.some((item) => item.kind === "page" && item.label === dateJump)
    ) {
      const display = formatDatePageDisplay(dateJump) ?? dateJump;
      items.unshift({
        id: `jump-${dateJump}`,
        label: `Jump to ${display}`,
        kind: "jump",
        targetTitle: dateJump,
      });
    }

    const trimmedQuery = query.trim();
    if (
      trimmedQuery &&
      !items.some(
        (item) =>
          item.kind === "page" &&
          item.label.toLowerCase() === trimmedQuery.toLowerCase(),
      )
    ) {
      items.push({
        id: `create-${trimmedQuery}`,
        label: `Create new page: "${trimmedQuery}"`,
        kind: "create",
        targetTitle: trimmedQuery,
      });
    }

    return items;
  }, [pagesList, query]);

  const selectItem = useCallback(
    async (item: PaletteItem) => {
      if (!nodeId) {
        return;
      }

      if (
        (item.kind === "jump" || item.kind === "create") &&
        item.targetTitle
      ) {
        await navigateToPage(item.targetTitle);
        const rootId = useOutlinerStore.getState().currentRootId;
        await moveNodeToPage(nodeId, rootId);
        closeMoveTarget();
        return;
      }

      await moveNodeToPage(nodeId, item.id);
      closeMoveTarget();
    },
    [closeMoveTarget, moveNodeToPage, navigateToPage, nodeId],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (nodeId == null) {
      setQuery("");
      setHighlightIndex(0);
    }
  }, [nodeId]);

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMoveTarget();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) =>
        paletteItems.length === 0 ? 0 : (index + 1) % paletteItems.length,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) =>
        paletteItems.length === 0
          ? 0
          : (index - 1 + paletteItems.length) % paletteItems.length,
      );
      return;
    }
    if (event.key === "Enter" && paletteItems[highlightIndex]) {
      event.preventDefault();
      void selectItem(paletteItems[highlightIndex]);
    }
  };

  return {
    query,
    setQuery,
    highlightIndex,
    setHighlightIndex,
    paletteItems,
    selectItem,
    handleInputKeyDown,
  };
}
