import type { MouseEvent } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { renderInactiveDoc } from "../features/editor/render/renderInactiveDoc";
import { TaskCheckbox } from "./TaskCheckbox";

interface PortalBlockRowProps {
  node: FlatOutlineNode;
  onToggleTaskStatus: () => void;
  onNavigateWikiLink: (pageName: string) => void;
}

export function PortalBlockRow({
  node,
  onToggleTaskStatus,
  onNavigateWikiLink,
}: PortalBlockRowProps) {
  const taskStatus = node.task_status;
  const isDone = taskStatus === "DONE";
  const showCheckbox = taskStatus != null;

  const handleCheckboxClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleTaskStatus();
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
        className={`min-w-0 flex-1 ${isDone ? "text-text-muted line-through" : ""}`}
      >
        {renderInactiveDoc(node.content, { onNavigateWikiLink })}
      </span>
    </li>
  );
}
