import { useOutlinerStore } from "../store/outlinerStore";

export function TrashFeed() {
  const trashedPages = useOutlinerStore((state) => state.trashedPages);
  const restorePage = useOutlinerStore((state) => state.restorePage);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-12">
      <h1 className="mb-6 font-ui text-page-title font-bold text-text-emphasis">
        Trash Bin
      </h1>
      {trashedPages.length === 0 ? (
        <p className="text-sm text-text-muted">No trashed pages.</p>
      ) : (
        <ul className="space-y-2">
          {trashedPages.map((page) => (
            <li
              key={page.id}
              className="flex items-center justify-between rounded border border-border bg-surface-sidebar px-3 py-2"
            >
              <span className="text-sm text-text-emphasis">{page.content}</span>
              <button
                type="button"
                aria-label={`Restore ${page.content}`}
                onClick={() => void restorePage(page.id)}
                className="shrink-0 rounded px-2 py-1 text-sm text-text-muted hover:bg-interactive-hover hover:text-text-emphasis"
              >
                ↩️ Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
