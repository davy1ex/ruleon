import type { FlatOutlineNode } from "../domain/outliner/types";
import { extractPlainText } from "../features/editor/serialization/extractPlainText";
import { OutlinerGuides } from "../ui/OutlinerGuides";
import { OutlinerRowLeading } from "../ui/OutlinerRowLeading";
import { RichText } from "../ui/components/RichText";

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
        onToggleTaskCompletion={() => {}}
      />
      <div className="min-w-0 flex-1 pt-px">
        <div className="m-0 min-h-[28px] w-full select-none bg-transparent px-0 py-0 text-[15px] leading-7 text-text-emphasis">
          <RichText
            content={extractPlainText(node.content)}
            isDone={node.task_status === "DONE"}
          />
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
