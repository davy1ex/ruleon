import {
  CheckSquare,
  Hash,
  Indent,
  Link,
  Outdent,
  Redo,
  Undo,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useMobileToolbarLayout } from "../../hooks/useVisualViewport";
import { useOutlinerStore } from "../../store/outlinerStore";

const GHOST_CLICK_LOCK_MS = 300;
const NON_PASSIVE = { passive: false } as const;

interface ToolbarBtnProps {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onAction?: () => void;
}

function ToolbarBtn({
  icon,
  label,
  disabled = false,
  onAction,
}: ToolbarBtnProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const isProcessing = useRef(false);
  const actionRef = useRef(onAction);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    actionRef.current = onAction;
  }, [onAction]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) {
      return;
    }

    const handleInteraction = (event: TouchEvent | MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabledRef.current) {
        return;
      }

      if (isProcessing.current) {
        return;
      }

      isProcessing.current = true;
      actionRef.current?.();

      window.setTimeout(() => {
        isProcessing.current = false;
      }, GHOST_CLICK_LOCK_MS);
    };

    const swallowClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    btn.addEventListener("touchstart", handleInteraction, NON_PASSIVE);
    btn.addEventListener("mousedown", handleInteraction, NON_PASSIVE);
    btn.addEventListener("click", swallowClick, NON_PASSIVE);

    return () => {
      btn.removeEventListener("touchstart", handleInteraction);
      btn.removeEventListener("mousedown", handleInteraction);
      btn.removeEventListener("click", swallowClick);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      type="button"
      tabIndex={-1}
      disabled={disabled}
      aria-label={label}
      aria-disabled={disabled}
      className="flex shrink-0 touch-none select-none items-center justify-center rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-surface-hover hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
    >
      {icon}
    </button>
  );
}

export function MobileToolbar() {
  const focusedId = useOutlinerStore((state) => state.focusedNodeId);
  const { toolbarStyle } = useMobileToolbarLayout(focusedId !== null);

  if (!focusedId) {
    return null;
  }

  const insertText = (prefix: string, suffix = "") => {
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) {
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText =
      text.slice(0, start) +
      prefix +
      text.slice(start, end) +
      suffix +
      text.slice(end);

    el.value = newText;

    const caret = start + prefix.length;
    el.setSelectionRange(caret, caret);

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;

    useOutlinerStore.getState().updateNodeContent(focusedId, newText);
  };

  return (
    <div
      className="no-scrollbar fixed left-0 z-50 flex h-12 w-full items-center gap-1 overflow-x-auto border-t border-border bg-surface-secondary px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
      style={toolbarStyle}
    >
      <ToolbarBtn
        icon={<Outdent size={20} />}
        label="Outdent"
        onAction={() => void useOutlinerStore.getState().outdent(focusedId)}
      />
      <ToolbarBtn
        icon={<Indent size={20} />}
        label="Indent"
        onAction={() => void useOutlinerStore.getState().indent(focusedId)}
      />

      <div className="mx-1 h-6 w-px shrink-0 bg-border" />

      <ToolbarBtn icon={<Undo size={20} />} label="Undo" disabled />
      <ToolbarBtn icon={<Redo size={20} />} label="Redo" disabled />

      <div className="mx-1 h-6 w-px shrink-0 bg-border" />

      <ToolbarBtn
        icon={<CheckSquare size={20} />}
        label="Cycle task status"
        onAction={() =>
          void useOutlinerStore.getState().cycleTaskStatus(focusedId)
        }
      />
      <ToolbarBtn
        icon={<Hash size={20} />}
        label="Insert tag"
        onAction={() => insertText("#")}
      />
      <ToolbarBtn
        icon={<Link size={20} />}
        label="Insert wiki link"
        onAction={() => insertText("[[", "]]")}
      />
    </div>
  );
}
