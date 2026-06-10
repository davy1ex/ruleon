import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useOutlinerStore } from "../store/outlinerStore";

const DRAG_THRESHOLD_PX = 4;

export interface BlockPointerDownOptions {
  allowTextCaret?: boolean;
  onBeginBlockDrag?: () => void;
}

export function useBlockRangeSelection() {
  const selectRange = useOutlinerStore((state) => state.selectRange);
  const dragAnchorRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);

  const endDrag = useCallback(() => {
    document.body.style.removeProperty("user-select");
    dragAnchorRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const handleBlockPointerDown = useCallback(
    (
      nodeId: string,
      event: ReactMouseEvent,
      options?: BlockPointerDownOptions,
    ): boolean => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey) {
        return false;
      }

      const { selectionAnchorId, focusedId } = useOutlinerStore.getState();

      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        options?.onBeginBlockDrag?.();
        const anchor = selectionAnchorId ?? focusedId ?? nodeId;
        selectRange(anchor, nodeId);
        return true;
      }

      dragAnchorRef.current = nodeId;
      isDraggingRef.current = false;
      startYRef.current = event.clientY;

      const onMove = (moveEvent: MouseEvent) => {
        if (dragAnchorRef.current !== nodeId) {
          return;
        }
        if (
          !isDraggingRef.current &&
          Math.abs(moveEvent.clientY - startYRef.current) > DRAG_THRESHOLD_PX
        ) {
          isDraggingRef.current = true;
          document.body.style.userSelect = "none";
          options?.onBeginBlockDrag?.();
          selectRange(nodeId, nodeId);
        }
      };

      const onUp = () => {
        if (dragAnchorRef.current === nodeId && !isDraggingRef.current) {
          if (!options?.allowTextCaret) {
            const { setFocus, setPendingCursorRestore } =
              useOutlinerStore.getState();
            setFocus(nodeId);
            setPendingCursorRestore({ nodeId, pos: 1 });
          }
        }
        endDrag();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);

      if (options?.allowTextCaret) {
        return false;
      }

      event.preventDefault();
      return true;
    },
    [endDrag, selectRange],
  );

  const handleBlockPointerEnter = useCallback(
    (nodeId: string, event: ReactMouseEvent) => {
      if ((event.buttons & 1) === 0) {
        return;
      }
      if (!isDraggingRef.current || !dragAnchorRef.current) {
        return;
      }
      selectRange(dragAnchorRef.current, nodeId);
    },
    [selectRange],
  );

  useEffect(() => () => endDrag(), [endDrag]);

  return { handleBlockPointerDown, handleBlockPointerEnter };
}
