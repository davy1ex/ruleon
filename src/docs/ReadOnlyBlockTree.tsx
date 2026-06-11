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
      className="group flex w-full items-start py-outliner-row-y"
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
        <div className="editor-text m-0 min-h-editor-row w-full select-none bg-transparent px-0 py-0 font-ui text-editor text-text-emphasis">
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
