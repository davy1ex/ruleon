import { useLayoutEffect, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { useOutlinerStore } from "../store/outlinerStore";

interface UseBlockRowFocusOptions {
  nodeId: string;
  isFocused: boolean;
  editorRef: RefObject<Editor | null>;
}

export function useBlockRowFocus({
  nodeId,
  isFocused,
  editorRef,
}: UseBlockRowFocusOptions): void {
  const pendingCursorRestore = useOutlinerStore(
    (state) => state.pendingCursorRestore,
  );
  const focusedId = useOutlinerStore((state) => state.focusedId);
  const selectedIds = useOutlinerStore((state) => state.selectedIds);

  useLayoutEffect(() => {
    if (!isFocused || focusedId !== nodeId) {
      return;
    }
    if (selectedIds.length > 0) {
      return;
    }

    const tryFocusEditor = () => {
      const editor = editorRef.current;
      if (!editor) {
        return false;
      }

      const restore = useOutlinerStore.getState().pendingCursorRestore;
      if (restore?.nodeId === nodeId) {
        const maxPos = editor.state.doc.content.size;
        const pos = Math.min(Math.max(restore.pos, 1), maxPos);
        editor.chain().focus().setTextSelection(pos).run();
        useOutlinerStore.getState().setPendingCursorRestore(null);
        return true;
      }

      if (!editor.isFocused) {
        editor.chain().focus("end").run();
      }
      return true;
    };

    if (!tryFocusEditor()) {
      requestAnimationFrame(() => {
        tryFocusEditor();
      });
    }
  }, [
    pendingCursorRestore,
    focusedId,
    isFocused,
    nodeId,
    editorRef,
    selectedIds.length,
  ]);
}
