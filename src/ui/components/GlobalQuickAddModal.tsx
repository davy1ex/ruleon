import { useEffect, useRef, useState } from "react";
import { INBOX_PAGE_TITLE } from "../../domain/outliner/inboxPage";
import { useOutlinerStore } from "../../store/outlinerStore";
import { useWorkspaceStore } from "../../store/workspaceStore";

export function GlobalQuickAddModal() {
  const globalQuickAddOpen = useWorkspaceStore((s) => s.globalQuickAddOpen);
  const toggleGlobalQuickAdd = useWorkspaceStore((s) => s.toggleGlobalQuickAdd);
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickAddToInbox = useOutlinerStore((state) => state.quickAddToInbox);

  const isOpen = globalQuickAddOpen;

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onGlobalQuickAdd) {
      return;
    }

    const unsubscribe = api.onGlobalQuickAdd(() => {
      toggleGlobalQuickAdd(true);
    });

    return unsubscribe;
  }, [toggleGlobalQuickAdd]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const close = () => {
    toggleGlobalQuickAdd(false);
    setInputValue("");
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    const text = inputValue.trim();
    if (!text || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await quickAddToInbox(text);
      close();
    } catch (error) {
      console.error("[GlobalQuickAdd] failed:", error);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-surface-modal p-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Quick add to Inbox"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={submitting}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture a thought to Inbox..."
          className="w-full bg-transparent text-lg text-text-normal outline-none placeholder:text-text-muted"
        />
        <div className="mt-3 flex justify-between border-t border-border/50 pt-2 text-[11px] text-text-muted">
          <span>
            Destination:{" "}
            <span className="font-medium text-accent">{INBOX_PAGE_TITLE}</span>
          </span>
          <span>↵ save • Esc close</span>
        </div>
      </div>
    </div>
  );
}
