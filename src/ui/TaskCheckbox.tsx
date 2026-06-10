import type { MouseEvent } from "react";
import type { TaskStatus } from "../domain/outliner/types";

interface TaskCheckboxProps {
  status: TaskStatus;
  readOnly?: boolean;
  onClick: (event: MouseEvent) => void;
}

export function TaskCheckbox({
  status,
  readOnly = false,
  onClick,
}: TaskCheckboxProps) {
  const checked = status === "DONE";

  return (
    <button
      type="button"
      data-task-checkbox
      data-testid="task-checkbox"
      aria-checked={checked}
      aria-label={checked ? "Mark task as to-do" : "Mark task as done"}
      disabled={readOnly}
      onClick={onClick}
      onMouseDown={(event) => event.stopPropagation()}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-accent bg-accent text-surface-primary"
          : "border-text-muted bg-transparent hover:border-accent"
      } ${readOnly ? "cursor-default opacity-70" : "cursor-pointer"}`}
    >
      {checked ? (
        <svg
          viewBox="0 0 12 12"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M2 6l3 3 5-5" />
        </svg>
      ) : null}
    </button>
  );
}
