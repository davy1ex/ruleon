import { useEffect, useRef } from "react";
import type { PaletteItem } from "./usePageSearchPalette";

interface PageSearchPaletteProps {
  query: string;
  highlightIndex: number;
  paletteItems: PaletteItem[];
  onQueryChange: (query: string) => void;
  onHighlightIndexChange: (index: number) => void;
  onSelectItem: (item: PaletteItem) => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  className?: string;
}

export function PageSearchPalette({
  query,
  highlightIndex,
  paletteItems,
  onQueryChange,
  onHighlightIndexChange,
  onSelectItem,
  onInputKeyDown,
  autoFocus = true,
  className = "",
}: PageSearchPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface-modal shadow-lg ${className}`}
    >
      <div className="border-b border-border px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search pages or type a date (2026-06-09)…"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onInputKeyDown}
          className="w-full bg-surface-input text-[15px] text-text-emphasis outline-none placeholder:text-text-muted"
        />
      </div>
      <ul className="max-h-72 overflow-y-auto py-2">
        {paletteItems.length === 0 ? (
          <li className="px-4 py-2 text-sm text-text-muted">No pages found</li>
        ) : (
          paletteItems.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => onHighlightIndexChange(index)}
                onClick={() => void onSelectItem(item)}
                className={`w-full px-4 py-2 text-left text-[15px] transition-colors ${
                  index === highlightIndex
                    ? "border-l-2 border-accent bg-interactive-selected pl-[14px] text-text-emphasis"
                    : "border-l-2 border-transparent text-text-normal hover:bg-interactive-hover"
                }`}
              >
                {item.kind === "jump" ? `↗ ${item.label}` : item.label}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-border px-4 py-2 text-xs text-text-muted">
        <span className="mr-3">↑↓ navigate</span>
        <span className="mr-3">↵ open</span>
        <span>esc close</span>
      </div>
    </div>
  );
}
