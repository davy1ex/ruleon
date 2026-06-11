import { useEffect, useRef, type RefObject } from "react";

export type BlockTextareaElement = HTMLTextAreaElement & {
  isComposing?: boolean;
};

export function useAutoResize(
  value: string,
  externalRef?: RefObject<BlockTextareaElement | null>,
): RefObject<BlockTextareaElement | null> {
  const internalRef = useRef<BlockTextareaElement>(null);
  const textareaRef = externalRef ?? internalRef;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value, textareaRef]);

  return textareaRef;
}
