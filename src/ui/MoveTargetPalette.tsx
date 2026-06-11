import { useOutlinerStore } from "../store/outlinerStore";
import { PageSearchPalette } from "./PageSearchPalette";
import { useMoveTargetPalette } from "./useMoveTargetPalette";

export function MoveTargetPalette() {
  const moveTargetNodeId = useOutlinerStore((s) => s.moveTargetNodeId);
  const closeMoveTarget = useOutlinerStore((s) => s.closeMoveTarget);
  const palette = useMoveTargetPalette(moveTargetNodeId);

  if (moveTargetNodeId == null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[20vh] backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeMoveTarget();
        }
      }}
    >
      <div
        className="w-full max-w-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Move to page"
      >
        <PageSearchPalette
          query={palette.query}
          highlightIndex={palette.highlightIndex}
          paletteItems={palette.paletteItems}
          onQueryChange={palette.setQuery}
          onHighlightIndexChange={palette.setHighlightIndex}
          onSelectItem={palette.selectItem}
          onInputKeyDown={palette.handleInputKeyDown}
          placeholder="Search destination page..."
          footerHint="↵ move"
          autoFocus
        />
      </div>
    </div>
  );
}
