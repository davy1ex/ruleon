import { useCallback } from "react";

interface ResizeHandleProps {
  side: "left" | "right";
  getWidth: () => number;
  onResize: (width: number) => void;
  min?: number;
  max?: number;
}

export function ResizeHandle({
  side,
  getWidth,
  onResize,
  min = 200,
  max = 480,
}: ResizeHandleProps) {
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = getWidth();

      const handleMove = (moveEvent: PointerEvent) => {
        const delta =
          side === "left"
            ? moveEvent.clientX - startX
            : startX - moveEvent.clientX;
        onResize(Math.min(max, Math.max(min, startWidth + delta)));
      };

      const handleUp = () => {
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [getWidth, max, min, onResize, side],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={`absolute top-0 bottom-0 z-20 w-1 cursor-col-resize transition-colors hover:bg-accent/40 ${
        side === "left" ? "right-0" : "left-0"
      }`}
      onPointerDown={handlePointerDown}
    />
  );
}
