import { useCallback } from "react";
import { isDailyFeedRootId, isSystemTrashRootId } from "../../store/journal";
import { useOutlinerStore } from "../../store/outlinerStore";
import {
  useWorkspaceStore,
  type EditorLeafState,
  type SearchLeafState,
  type WorkspaceLeaf,
} from "../../store/workspaceStore";
import { JournalFeed } from "../JournalFeed";
import { PageFeed } from "../PageFeed";
import { TrashFeed } from "../TrashFeed";
import { SearchLeaf } from "./SearchLeaf";
import { SettingsLeaf } from "./SettingsLeaf";

function EditorContent({ leaf }: { leaf: WorkspaceLeaf }) {
  const { rootId } = leaf.state as EditorLeafState;
  const loading = useOutlinerStore((s) => s.loading);
  const error = useOutlinerStore((s) => s.error);
  const nodesByRootId = useOutlinerStore((s) => s.nodesByRootId);
  const linkedReferences = useOutlinerStore((s) => s.linkedReferences);
  const linkedReferenceNodesById = useOutlinerStore(
    (s) => s.linkedReferenceNodesById,
  );
  const currentPageTitle = useOutlinerStore((s) => s.currentPageTitle);
  const dailyFeedTodayRootId = useOutlinerStore(
    (s) => s.dailyFeedTodayRootId,
  );
  const journalHistoryIds = useOutlinerStore((s) => s.journalHistoryIds);
  const focusedId = useOutlinerStore((s) => s.focusedId);
  const selectedIds = useOutlinerStore((s) => s.selectedIds);
  const setFocus = useOutlinerStore((s) => s.setFocus);
  const toggleSelect = useOutlinerStore((s) => s.toggleSelect);
  const clearSelection = useOutlinerStore((s) => s.clearSelection);
  const addSibling = useOutlinerStore((s) => s.addSibling);
  const toggleCollapse = useOutlinerStore((s) => s.toggleCollapse);
  const toggleTaskCompletion = useOutlinerStore((s) => s.toggleTaskCompletion);
  const renameCurrentPage = useOutlinerStore((s) => s.renameCurrentPage);
  const loadMoreJournalHistory = useOutlinerStore(
    (s) => s.loadMoreJournalHistory,
  );

  const treeHandlers = {
    focusedId,
    selectedIds,
    onFocus: setFocus,
    onToggleSelect: toggleSelect,
    onClearSelection: clearSelection,
    onAddSibling: (id: string) => void addSibling(id),
    onToggleCollapse: (id: string) => void toggleCollapse(id),
    onToggleTaskCompletion: (id: string) => void toggleTaskCompletion(id),
  };

  const handleLoadMore = useCallback(() => {
    void loadMoreJournalHistory();
  }, [loadMoreJournalHistory]);

  if (loading) {
    return (
      <p className="px-8 py-12 font-mono text-sm text-text-muted">
        Loading database…
      </p>
    );
  }

  if (error) {
    return (
      <p className="px-8 py-12 font-mono text-sm text-danger">{error}</p>
    );
  }

  if (isSystemTrashRootId(rootId)) {
    return <TrashFeed />;
  }

  if (isDailyFeedRootId(rootId) && dailyFeedTodayRootId) {
    return (
      <JournalFeed
        todayRootId={dailyFeedTodayRootId}
        nodesByRootId={nodesByRootId}
        historyJournalIds={journalHistoryIds}
        onLoadMore={handleLoadMore}
        {...treeHandlers}
      />
    );
  }

  return (
    <PageFeed
      pageTitle={currentPageTitle ?? rootId}
      pageRootId={rootId}
      pageNodes={nodesByRootId[rootId] ?? []}
      linkedReferences={linkedReferences}
      linkedReferenceNodesById={linkedReferenceNodesById}
      onRenamePage={(newTitle) => void renameCurrentPage(newTitle)}
      {...treeHandlers}
    />
  );
}

function JournalContent() {
  const loading = useOutlinerStore((s) => s.loading);
  const error = useOutlinerStore((s) => s.error);
  const dailyFeedTodayRootId = useOutlinerStore(
    (s) => s.dailyFeedTodayRootId,
  );
  const nodesByRootId = useOutlinerStore((s) => s.nodesByRootId);
  const journalHistoryIds = useOutlinerStore((s) => s.journalHistoryIds);
  const focusedId = useOutlinerStore((s) => s.focusedId);
  const selectedIds = useOutlinerStore((s) => s.selectedIds);
  const setFocus = useOutlinerStore((s) => s.setFocus);
  const toggleSelect = useOutlinerStore((s) => s.toggleSelect);
  const clearSelection = useOutlinerStore((s) => s.clearSelection);
  const addSibling = useOutlinerStore((s) => s.addSibling);
  const toggleCollapse = useOutlinerStore((s) => s.toggleCollapse);
  const toggleTaskCompletion = useOutlinerStore((s) => s.toggleTaskCompletion);
  const loadMoreJournalHistory = useOutlinerStore(
    (s) => s.loadMoreJournalHistory,
  );

  const treeHandlers = {
    focusedId,
    selectedIds,
    onFocus: setFocus,
    onToggleSelect: toggleSelect,
    onClearSelection: clearSelection,
    onAddSibling: (id: string) => void addSibling(id),
    onToggleCollapse: (id: string) => void toggleCollapse(id),
    onToggleTaskCompletion: (id: string) => void toggleTaskCompletion(id),
  };

  const handleLoadMore = useCallback(() => {
    void loadMoreJournalHistory();
  }, [loadMoreJournalHistory]);

  if (loading) {
    return (
      <p className="px-8 py-12 font-mono text-sm text-text-muted">
        Loading database…
      </p>
    );
  }

  if (error) {
    return (
      <p className="px-8 py-12 font-mono text-sm text-danger">{error}</p>
    );
  }

  if (!dailyFeedTodayRootId) {
    return (
      <p className="px-8 py-12 text-sm text-text-muted">Loading journal…</p>
    );
  }

  return (
    <JournalFeed
      todayRootId={dailyFeedTodayRootId}
      nodesByRootId={nodesByRootId}
      historyJournalIds={journalHistoryIds}
      onLoadMore={handleLoadMore}
      {...treeHandlers}
    />
  );
}

export function LeafRenderer() {
  const activeLeafId = useWorkspaceStore((s) => s.activeLeafId);
  const leaves = useWorkspaceStore((s) => s.leaves);

  const leaf = activeLeafId ? leaves[activeLeafId] : null;

  if (!leaf) {
    return (
      <p className="px-8 py-12 text-sm text-text-muted">No active tab</p>
    );
  }

  switch (leaf.type) {
    case "editor":
      return <EditorContent leaf={leaf} />;
    case "journal":
      return <JournalContent />;
    case "trash":
      return <TrashFeed />;
    case "search":
      return (
        <SearchLeaf
          leafId={leaf.id}
          state={leaf.state as SearchLeafState}
        />
      );
    case "settings":
      return <SettingsLeaf />;
    default:
      return null;
  }
}
