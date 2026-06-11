import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
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
  placeholder?: string;
  footerHint?: string;
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
  placeholder = "Search pages or type a command...",
  footerHint = "↵ open",
}: PageSearchPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface-modal shadow-2xl ${className}`}
    >
      <div className="flex items-center border-b border-border px-4 py-3">
        <Search size={18} className="mr-3 shrink-0 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onInputKeyDown}
          className="flex-1 bg-transparent text-[15px] text-text-emphasis outline-none placeholder:text-text-muted"
        />
      </div>
      <ul className="max-h-96 overflow-y-auto py-2">
        {paletteItems.length === 0 ? (
          <li className="px-4 py-2 text-sm text-text-muted">No pages found</li>
        ) : (
          paletteItems.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => onHighlightIndexChange(index)}
                onClick={() => void onSelectItem(item)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  index === highlightIndex
                    ? "border-l-2 border-accent bg-interactive-selected pl-[14px] text-text-emphasis"
                    : "border-l-2 border-transparent text-text-normal hover:bg-interactive-hover"
                }`}
              >
                {item.kind === "jump" && "↗ "}
                {item.kind === "create" && "+ "}
                {item.label}
                {item.kind === "create" ? (
                  <span className="ml-2 rounded bg-surface-secondary px-1 text-xs text-text-muted">
                    Enter
                  </span>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-border px-4 py-2 text-xs text-text-muted">
        <span className="mr-3">↑↓ navigate</span>
        <span className="mr-3">{footerHint}</span>
        <span>esc close</span>
      </div>
    </div>
  );
}
