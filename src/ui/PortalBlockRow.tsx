import type { MouseEvent } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { renderInactiveDoc } from "../features/editor/render/renderInactiveDoc";
import { TaskCheckbox } from "./TaskCheckbox";

interface PortalBlockRowProps {
  node: FlatOutlineNode;
  onToggleTaskCompletion: () => void;
  onNavigateWikiLink: (pageName: string) => void;
}

export function PortalBlockRow({
  node,
  onToggleTaskCompletion,
  onNavigateWikiLink,
}: PortalBlockRowProps) {
  const taskStatus = node.task_status;
  const isDone = taskStatus === "DONE";
  const isFailed = taskStatus === "FAILED";
  const showCheckbox = taskStatus != null;

  const handleCheckboxClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleTaskCompletion();
  };

  return (
    <li
      className="flex items-start gap-1.5 py-0.5 text-sm"
      data-testid="portal-block-row"
    >
      {showCheckbox ? (
        <TaskCheckbox
          status={taskStatus}
          onClick={handleCheckboxClick}
        />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <span
        className={`min-w-0 flex-1 ${
          isFailed
            ? "text-red-400 line-through opacity-70"
            : isDone
              ? "text-text-muted line-through"
              : ""
        }`}
      >
        {renderInactiveDoc(node.content, { onNavigateWikiLink })}
      </span>
    </li>
  );
}
