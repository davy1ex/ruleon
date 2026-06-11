import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { MouseEvent } from "react";
import type { FlatOutlineNode } from "../domain/outliner/types";
import { getBlockType } from "../domain/outliner/types";
import { TaskCheckbox } from "./TaskCheckbox";

interface OutlinerRowLeadingProps {
  node: FlatOutlineNode;
  readOnly?: boolean;
  isFocused: boolean;
  isDragging: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  onToggleCollapse: (id: string) => void;
  onToggleTaskCompletion: (id: string) => void;
}

export function OutlinerRowLeading({
  node,
  readOnly = false,
  isFocused,
  isDragging,
  dragAttributes,
  dragListeners,
  onToggleCollapse,
  onToggleTaskCompletion,
}: OutlinerRowLeadingProps) {
  const isTodo = getBlockType(node.task_status) === "todo";

  const bullet = (
    <span
      className={`block h-2.5 w-2.5 shrink-0 rounded-full bg-bullet transition-colors group-hover:bg-bullet-hover ${
        isFocused
          ? "ring-2 ring-accent ring-offset-1 ring-offset-surface-primary"
          : "group-focus-within:ring-2 group-focus-within:ring-accent group-focus-within:ring-offset-1 group-focus-within:ring-offset-surface-primary"
      }`}
      aria-hidden
    />
  );

  const handleBulletClick = (event: MouseEvent) => {
    if (!node.hasChildren) {
      return;
    }
    event.stopPropagation();
    onToggleCollapse(node.id);
  };

  const handleCheckboxClick = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onToggleTaskCompletion(node.id);
  };

  return (
    <>
      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center">
        {isTodo ? (
          <TaskCheckbox
            status={node.task_status ?? "TODO"}
            readOnly={readOnly}
            onClick={handleCheckboxClick}
          />
        ) : readOnly ? (
          bullet
        ) : (
          <span
            {...dragAttributes}
            {...dragListeners}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleBulletClick}
            className={`flex h-7 w-7 items-center justify-center ${
              node.hasChildren ? "cursor-pointer" : ""
            } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            aria-label={
              node.hasChildren
                ? node.collapsed
                  ? "Expand block"
                  : "Collapse block"
                : "Drag to reorder"
            }
          >
            {bullet}
          </span>
        )}
      </div>
    </>
  );
}
