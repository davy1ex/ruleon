import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { PortalFilter } from "../domain/outliner/portalTypes";
import { QueryPortalPanel } from "./QueryPortalPanel";

export function QueryPortalView({ node, selected }: NodeViewProps) {
  const target = String(node.attrs.target ?? "");
  const filter = (node.attrs.filter ?? "todo") as PortalFilter;

  return (
    <NodeViewWrapper
      as="div"
      className="w-full"
      data-query-portal
      contentEditable={false}
    >
      <QueryPortalPanel target={target} filter={filter} selected={selected} />
    </NodeViewWrapper>
  );
}
