import { useEffect } from "react";
import { PageSearchPalette } from "../PageSearchPalette";
import { usePageSearchPalette } from "../usePageSearchPalette";
import {
  useWorkspaceStore,
  type SearchLeafState,
} from "../../store/workspaceStore";

interface SearchLeafProps {
  leafId: string;
  state: SearchLeafState;
}

export function SearchLeaf({ leafId, state }: SearchLeafProps) {
  const updateLeafState = useWorkspaceStore((s) => s.updateLeafState);
  const palette = usePageSearchPalette({ initialQuery: state.query });

  useEffect(() => {
    updateLeafState(leafId, {
      query: palette.query,
      resultIndex: palette.highlightIndex,
    });
  }, [
    leafId,
    palette.highlightIndex,
    palette.query,
    updateLeafState,
  ]);

  return (
    <div className="mx-auto max-w-lg px-8 py-8">
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
  );
}
