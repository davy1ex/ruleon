import type { ReactNode } from "react";
import type { BlockContentJSON, BlockContentNode } from "../../../domain/outliner/contentTypes";

interface RenderInactiveDocOptions {
  onNavigateWikiLink?: (pageName: string) => void;
}

function renderNode(
  node: BlockContentNode,
  index: number,
  options: RenderInactiveDocOptions,
): ReactNode {
  if (node.type === "text") {
    return <span key={index}>{node.text ?? ""}</span>;
  }

  if (node.type === "hardBreak") {
    return <br key={index} />;
  }

  if (node.type === "queryPortal") {
    const target = String(node.attrs?.target ?? "");
    return (
      <span key={index} className="text-text-muted">
        {`{{query: ${target}}}`}
      </span>
    );
  }

  if (node.type === "wikiLink") {
    const pageName = String(node.attrs?.pageName ?? "");
    return (
      <span
        key={index}
        data-wiki-link
        role="link"
        tabIndex={-1}
        className="cursor-pointer text-link hover:underline"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (pageName) {
            options.onNavigateWikiLink?.(pageName);
          }
        }}
      >
        [[{pageName}]]
      </span>
    );
  }

  if ("content" in node && node.content) {
    return (
      <span key={index}>
        {node.content.map((child: BlockContentNode, childIndex: number) =>
          renderNode(child, childIndex, options),
        )}
      </span>
    );
  }

  return null;
}

export function renderInactiveDoc(
  doc: BlockContentJSON,
  options: RenderInactiveDocOptions = {},
): ReactNode {
  if (!doc?.content || doc.content.length === 0) {
    return null;
  }

  return (
    <>
      {doc.content.map((node, index) => renderNode(node, index, options))}
    </>
  );
}
