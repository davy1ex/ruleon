import type { FlatOutlineNode } from "../domain/outliner/types";
import { renderInactiveDoc } from "../features/editor/render/renderInactiveDoc";
import { OutlinerGuides } from "../ui/OutlinerGuides";
import { OutlinerRowLeading } from "../ui/OutlinerRowLeading";

interface ReadOnlyBlockTreeProps {
  rootId: string;
  nodes: FlatOutlineNode[];
}

function ReadOnlyOutlinerRow({ node }: { node: FlatOutlineNode }) {
  return (
    <div
      data-testid="outliner-row"
      data-block-id={node.id}
      data-depth={node.depth}
      className="group flex w-full items-start py-1"
    >
      <OutlinerGuides depth={node.depth} />
      <OutlinerRowLeading
        node={node}
        readOnly
        isFocused={false}
        isDragging={false}
        onToggleCollapse={() => {}}
        onToggleTaskStatus={() => {}}
      />
      <div
        className={`min-w-0 flex-1 pt-px ${
          node.task_status === "DONE"
            ? "text-text-muted line-through decoration-text-muted"
            : ""
        }`}
      >
        <div className="m-0 min-h-[28px] w-full select-none whitespace-pre-wrap break-words bg-transparent px-0 py-0 text-[15px] leading-7 text-text-emphasis">
          {renderInactiveDoc(node.content)}
        </div>
      </div>
    </div>
  );
}

export function ReadOnlyBlockTree({ rootId, nodes }: ReadOnlyBlockTreeProps) {
  return (
    <div
      data-testid="block-tree"
      data-root-id={rootId}
      className="outline-none"
    >
      {nodes.map((node) => (
        <ReadOnlyOutlinerRow key={node.id} node={node} />
      ))}
    </div>
  );
}
