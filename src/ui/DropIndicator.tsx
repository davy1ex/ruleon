import { useLayoutEffect, useState, type CSSProperties } from "react";
import type { DragProjection } from "../features/outliner/dragProjection";
import {
  BULLET_COLUMN_WIDTH_PX,
  depthToIndentPx,
} from "../features/outliner/indentation";

interface DropIndicatorProps {
  projection: DragProjection | null;
  containerId: string;
}

export function DropIndicator({ projection, containerId }: DropIndicatorProps) {
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    if (!projection) {
      setStyle({ opacity: 0 });
      return;
    }

    const container = document.querySelector(
      `[data-drop-container="${containerId}"]`,
    );
    const overRow = container?.querySelector(
      `[data-block-id="${projection.indicatorAnchorId}"]`,
    ) as HTMLElement | null;

    if (!container || !overRow) {
      setStyle({ opacity: 0 });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const rowRect = overRow.getBoundingClientRect();
    const top = projection.indicatorBelow
      ? rowRect.bottom - containerRect.top
      : rowRect.top - containerRect.top;

    setStyle({
      opacity: 1,
      top,
      left: depthToIndentPx(projection.depth) + BULLET_COLUMN_WIDTH_PX,
      right: 0,
    });
  }, [projection, containerId]);

  if (!projection) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center"
      style={style}
      aria-hidden
    >
      <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />
      <div className="h-0.5 flex-1 bg-accent" />
    </div>
  );
}
