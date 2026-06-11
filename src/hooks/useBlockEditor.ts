import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import type { BlockTextareaElement } from "../ui/useAutoResize";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { plainTextToBlockContent } from "../features/editor/serialization/parseStoredContent";
import {
  clearLiveEditorContent,
  registerActiveEditor,
  syncLiveEditorContent,
  unregisterActiveEditor,
} from "../store/blockActions";
import { useOutlinerStore } from "../store/outlinerStore";

const AUTO_SAVE_MS = 1000;

interface UseBlockEditorOptions {
  nodeId: string;
  nodeContent: BlockContentJSON;
  isFocused: boolean;
  isEditing: boolean;
  textareaRef?: RefObject<BlockTextareaElement | null>;
}

export function useBlockEditor({
  nodeId,
  nodeContent,
  isFocused,
  isEditing,
  textareaRef,
}: UseBlockEditorOptions) {
  const isComposing = () => textareaRef?.current?.isComposing === true;
  const initialText = extractPlainText(nodeContent);
  const [localText, setLocalText] = useState(initialText);
  const flushUpdateContent = useOutlinerStore((state) => state.flushUpdateContent);
  const flushRef = useRef(flushUpdateContent);
  flushRef.current = flushUpdateContent;

  const textRef = useRef(localText);
  const originalRef = useRef(initialText);
  textRef.current = localText;

  const persistText = useCallback(
    (text: string, options?: { syncStore?: boolean }) => {
      try {
        const doc = plainTextToBlockContent(text);
        syncLiveEditorContent(nodeId, doc);
        void flushRef.current(nodeId, doc, options).catch((error: unknown) => {
          console.error("CRITICAL: Flush failed:", { nodeId, error });
        });
        originalRef.current = text;
      } catch (error) {
        console.error("CRITICAL: plainTextToBlockContent failed:", {
          nodeId,
          error,
        });
      }
    },
    [nodeId],
  );

  useEffect(() => {
    const text = extractPlainText(nodeContent);
    setLocalText(text);
    textRef.current = text;
    originalRef.current = text;
    // Reset when block identity changes; nodeContent is read at switch time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  useEffect(() => {
    if (localText === originalRef.current || isComposing()) {
      return;
    }

    const timer = setTimeout(() => {
      if (isComposing()) {
        return;
      }
      persistText(localText, { syncStore: false });
    }, AUTO_SAVE_MS);

    return () => clearTimeout(timer);
  }, [localText, nodeId, persistText, textareaRef]);

  useEffect(() => {
    if (!isFocused && textRef.current !== originalRef.current) {
      persistText(textRef.current);
    }
  }, [isFocused, nodeId, persistText]);

  useEffect(() => {
    return () => {
      if (textRef.current === originalRef.current) {
        return;
      }
      try {
        const doc = plainTextToBlockContent(textRef.current);
        void flushRef.current(nodeId, doc).catch((error: unknown) => {
          console.error("CRITICAL: Unmount flush failed:", { nodeId, error });
        });
      } catch (error) {
        console.error("CRITICAL: Unmount plainTextToBlockContent failed:", {
          nodeId,
          error,
        });
      }
    };
  }, [nodeId]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    registerActiveEditor(nodeId, () => plainTextToBlockContent(textRef.current));
    syncLiveEditorContent(nodeId, plainTextToBlockContent(textRef.current));

    return () => {
      unregisterActiveEditor(nodeId);
      clearLiveEditorContent(nodeId);
    };
  }, [isEditing, nodeId]);

  const handleBlur = useCallback(() => {
    // Persist text only — never clear focusedId here (breaks focus handoff).
    if (textRef.current !== originalRef.current) {
      persistText(textRef.current);
    }
  }, [persistText]);

  const handleChange = useCallback(
    (text: string) => {
      setLocalText(text);
      textRef.current = text;
      if (isComposing()) {
        return;
      }
      syncLiveEditorContent(nodeId, plainTextToBlockContent(text));
    },
    [nodeId, textareaRef],
  );

  return {
    localText,
    setLocalText: handleChange,
    handleBlur,
    persistText,
    textRef,
  };
}
