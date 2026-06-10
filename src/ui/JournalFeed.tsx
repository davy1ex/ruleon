import { useCallback, useEffect, useRef } from "react";
import {
  formatDatePageDisplay,
  normalizePageTitle,
} from "../domain/pages/PageRegistry";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { useOutlinerStore } from "../store/outlinerStore";
import { useWorkspaceStore } from "../store/workspaceStore";
import type { BlockTreeHandlers } from "./BlockTree";
import { BlockTree } from "./BlockTree";

interface JournalFeedProps extends BlockTreeHandlers {
  todayRootId: string;
  nodesByRootId: Record<string, FlatOutlineNode[]>;
  historyJournalIds: string[];
  onLoadMore: () => void;
}

function formatTodayHeader(date = new Date()): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  return `Today (${months[date.getMonth()]} ${day}${suffix})`;
}

function resolveDayPageTitle(
  rootId: string,
  pagesList: { id: string; content: string }[],
): string {
  const page = pagesList.find((entry) => entry.id === rootId);
  if (page) {
    return normalizePageTitle(page.content, page.id);
  }

  const match = rootId.match(/^journal-(\d{4}-\d{2}-\d{2})$/);
  return match ? match[1] : rootId;
}

function formatHistoryHeader(
  rootId: string,
  pagesList: { id: string; content: string }[],
): string {
  const title = resolveDayPageTitle(rootId, pagesList);
  return formatDatePageDisplay(title) ?? title;
}

export function JournalFeed({
  todayRootId,
  nodesByRootId,
  historyJournalIds,
  onLoadMore,
  ...handlers
}: JournalFeedProps) {
  const pagesList = useOutlinerStore((state) => state.pagesList);
  const navigateToPage = useOutlinerStore((state) => state.navigateToPage);
  const openPage = useWorkspaceStore((state) => state.openPage);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleOpenDayNote = useCallback(
    (rootId: string) => {
      const title = resolveDayPageTitle(rootId, pagesList);
      void navigateToPage(title).then(() => {
        const pageRootId = useOutlinerStore.getState().currentRootId;
        openPage(pageRootId, title);
      });
    },
    [navigateToPage, openPage, pagesList],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <button
        type="button"
        onClick={() => handleOpenDayNote(todayRootId)}
        className="mb-6 block text-left text-2xl font-bold text-text-emphasis transition-colors hover:text-accent"
      >
        {formatTodayHeader()}
      </button>
      <BlockTree
        rootId={todayRootId}
        nodes={nodesByRootId[todayRootId] ?? []}
        {...handlers}
      />

      {historyJournalIds.map((journalId) => (
        <section key={journalId}>
          <button
            type="button"
            onClick={() => handleOpenDayNote(journalId)}
            className="mb-4 mt-8 block text-left text-xl font-bold text-text-muted transition-colors hover:text-text-emphasis"
          >
            {formatHistoryHeader(journalId, pagesList)}
          </button>
          <BlockTree
            rootId={journalId}
            nodes={nodesByRootId[journalId] ?? []}
            {...handlers}
          />
        </section>
      ))}

      <div id="scroll-sentinel" ref={sentinelRef} className="h-8" />
    </div>
  );
}
