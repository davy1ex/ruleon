import {
  formatDatePageDisplay,
  isDatePage,
} from "../domain/pages/PageRegistry";
import type { FlatOutlineNode, OutlineNodeRow } from "../domain/outliner/types";
import { useOutlinerStore } from "../store/outlinerStore";
import type { BlockTreeHandlers } from "./BlockTree";
import { BlockTree } from "./BlockTree";
import { PageTitleInput } from "./PageTitleInput";

interface PageFeedProps extends BlockTreeHandlers {
  pageTitle: string;
  pageRootId: string;
  pageNodes: FlatOutlineNode[];
  linkedReferences: OutlineNodeRow[];
  linkedReferenceNodesById: Record<string, FlatOutlineNode[]>;
  onRenamePage: (newTitle: string) => void;
}

export function PageFeed({
  pageTitle,
  pageRootId,
  pageNodes,
  linkedReferences,
  linkedReferenceNodesById,
  onRenamePage,
  ...handlers
}: PageFeedProps) {
  const favoritesList = useOutlinerStore((state) => state.favoritesList);
  const toggleCurrentPageFavorite = useOutlinerStore(
    (state) => state.toggleCurrentPageFavorite,
  );
  const trashCurrentPage = useOutlinerStore((state) => state.trashCurrentPage);
  const isFavorite = favoritesList.some((favorite) => favorite.id === pageRootId);
  const isDailyNote = isDatePage(pageTitle);
  const displayTitle = formatDatePageDisplay(pageTitle) ?? pageTitle;

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <div className="mb-6 flex items-center gap-2">
        {isDailyNote ? (
          <h1 className="w-full text-2xl font-bold text-text-emphasis">
            {displayTitle}
          </h1>
        ) : (
          <PageTitleInput title={pageTitle} onRename={onRenamePage} />
        )}
        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => void toggleCurrentPageFavorite()}
          className="shrink-0 text-2xl leading-none text-warning hover:text-accent"
        >
          {isFavorite ? "★" : "☆"}
        </button>
        <button
          type="button"
          aria-label="Move page to trash"
          onClick={() => {
            if (window.confirm("Move page to trash?")) {
              void trashCurrentPage();
            }
          }}
          className="shrink-0 text-xl leading-none text-text-muted hover:text-danger"
        >
          🗑️
        </button>
      </div>
      <BlockTree rootId={pageRootId} nodes={pageNodes} {...handlers} />

      {linkedReferences.length > 0 && (
        <section className="mt-10">
          <hr className="mb-6 border-border" />
          <h2 className="mb-4 text-lg font-semibold text-text-muted">
            Linked References
          </h2>
          {linkedReferences.map((ref) => (
            <div key={ref.id} className="mb-6">
              <BlockTree
                rootId={ref.id}
                nodes={linkedReferenceNodesById[ref.id] ?? []}
                readOnly
                {...handlers}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
