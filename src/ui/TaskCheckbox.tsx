import { Check, X } from "lucide-react";
import type { ChangeEvent, MouseEvent } from "react";
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
  const failed = status === "FAILED";

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onClick(event as unknown as MouseEvent);
  };

  if (failed) {
    return (
      <div
        data-task-checkbox
        data-testid="task-checkbox"
        data-failed
        role="checkbox"
        aria-checked="mixed"
        aria-label="Mark failed task as to-do"
        className="relative mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-red-400/70 bg-red-400/10"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          if (!readOnly) {
            onClick(event);
          }
        }}
      >
        <X
          size={12}
          strokeWidth={3}
          className="text-red-400"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      data-task-checkbox
      data-testid="task-checkbox"
      className="relative mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={readOnly}
        tabIndex={-1}
        onChange={handleChange}
        aria-label={checked ? "Mark task as to-do" : "Mark task as done"}
        className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-text-muted transition-colors checked:border-accent checked:bg-accent hover:border-accent disabled:cursor-default disabled:opacity-70"
      />
      <Check
        size={12}
        strokeWidth={3}
        className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
        aria-hidden
      />
    </div>
  );
}
