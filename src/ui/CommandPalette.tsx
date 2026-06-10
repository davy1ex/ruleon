import { useEffect } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { PageSearchPalette } from "./PageSearchPalette";
import { usePageSearchPalette } from "./usePageSearchPalette";

export function CommandPalette() {
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);

  const palette = usePageSearchPalette({
    onAfterSelect: () => setCommandPaletteOpen(false),
  });

  useEffect(() => {
    if (!commandPaletteOpen) {
      palette.setQuery("");
      palette.setHighlightIndex(0);
    }
    // Reset query when the popup closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setCommandPaletteOpen(false);
        }
      }}
    >
      <div className="w-full max-w-lg" role="dialog" aria-modal="true" aria-label="Command palette">
        <PageSearchPalette
          query={palette.query}
          highlightIndex={palette.highlightIndex}
          paletteItems={palette.paletteItems}
          onQueryChange={palette.setQuery}
          onHighlightIndexChange={palette.setHighlightIndex}
          onSelectItem={palette.selectItem}
          onInputKeyDown={palette.handleInputKeyDown}
        />
      </div>
    </div>
  );
}
