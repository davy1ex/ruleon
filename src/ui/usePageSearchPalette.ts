import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { inferDateTitleFromQuery } from "../domain/pages/dateQuery";
import { partitionPages } from "../domain/pages/Indexer";
import { formatDatePageDisplay } from "../domain/pages/PageRegistry";
import { useOutlinerStore } from "../store/outlinerStore";
import { useWorkspaceStore } from "../store/workspaceStore";

export interface PaletteItem {
  id: string;
  label: string;
  kind: "page" | "jump" | "create";
  targetTitle?: string;
}

interface UsePageSearchPaletteOptions {
  initialQuery?: string;
  onAfterSelect?: () => void;
}

export function usePageSearchPalette(options: UsePageSearchPaletteOptions = {}) {
  const [query, setQuery] = useState(options.initialQuery ?? "");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const onAfterSelectRef = useRef(options.onAfterSelect);
  onAfterSelectRef.current = options.onAfterSelect;
  const pagesList = useOutlinerStore((s) => s.pagesList);
  const openPage = useWorkspaceStore((s) => s.openPage);
  const navigateToPage = useOutlinerStore((s) => s.navigateToPage);

  const paletteItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const { dailyNotes, regularPages } = partitionPages(pagesList);
    const allPages = [...dailyNotes, ...regularPages];

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
      if (
        (item.kind === "jump" || item.kind === "create") &&
        item.targetTitle
      ) {
        await navigateToPage(item.targetTitle);
        const rootId = useOutlinerStore.getState().currentRootId;
        const title =
          useOutlinerStore.getState().currentPageTitle ?? item.targetTitle;
        openPage(rootId, title);
        onAfterSelectRef.current?.();
        return;
      }
      openPage(item.id, item.label);
      onAfterSelectRef.current?.();
    },
    [navigateToPage, openPage],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
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
