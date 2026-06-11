import type { PortalFilter } from "../domain/outliner/portalTypes";
import { useOutlinerStore } from "../store/outlinerStore";
import { PortalBlockRow } from "./PortalBlockRow";
import { useQueryPortalResults } from "./useQueryPortalResults";

interface QueryPortalPanelProps {
  target: string;
  filter: PortalFilter;
  selected?: boolean;
}

export function QueryPortalPanel({
  target,
  filter,
  selected = false,
}: QueryPortalPanelProps) {
  const { rows, loading, effectiveFilter } = useQueryPortalResults(target, filter);
  const toggleTaskCompletion = useOutlinerStore((state) => state.toggleTaskCompletion);
  const navigateToPage = useOutlinerStore((state) => state.navigateToPage);

  return (
    <div
      className={`query-portal my-1 rounded-md border border-border-subtle bg-surface-secondary px-2 py-1.5 ${
        selected ? "ring-1 ring-accent" : ""
      }`}
      data-query-portal
      contentEditable={false}
    >
      <header className="mb-1 text-xs text-text-muted">
        Query: {target}
        {effectiveFilter === "todo"
          ? " (open tasks)"
          : effectiveFilter === "done"
            ? " (completed tasks)"
            : ""}
      </header>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : null}
      {!loading && rows.length === 0 ? (
        <p className="text-sm text-text-muted">No matching blocks</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {rows.map((row) => (
            <PortalBlockRow
              key={row.id}
              node={row}
              onToggleTaskCompletion={() => {
                void toggleTaskCompletion(row.id);
              }}
              onNavigateWikiLink={(pageName) => {
                void navigateToPage(pageName);
              }}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
