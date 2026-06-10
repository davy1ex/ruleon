/** Horizontal width of one nesting level in the outliner UI. */
export const INDENTATION_WIDTH_PX = 24;

/** Width of the drag-handle / bullet column (`w-7`). */
export const BULLET_COLUMN_WIDTH_PX = 28;

export function depthToIndentPx(depth: number): number {
  return depth * INDENTATION_WIDTH_PX;
}
