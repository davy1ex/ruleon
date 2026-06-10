import { InputRule } from "@tiptap/core";
import { QueryPortal } from "./queryPortal";
import { QUERY_PORTAL_PATTERN } from "./queryPortalSyntax";

function replaceTextblockWithPortal(
  state: Parameters<InputRule["handler"]>[0]["state"],
  range: { from: number; to: number },
  target: string,
): boolean {
  const portalType = state.schema.nodes[QueryPortal.name];
  if (!portalType) {
    return false;
  }

  const $from = state.doc.resolve(range.from);
  const blockPos = $from.before();
  const blockNode = $from.parent;

  if (!blockNode.type.isTextblock) {
    return false;
  }

  const portal = portalType.create({ target, filter: "todo" });
  state.tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, portal);
  return true;
}

export const queryPortalInputRule = new InputRule({
  find: QUERY_PORTAL_PATTERN,
  handler: ({ state, range, match }) => {
    const target = match[1]?.trim();
    if (!target) {
      return null;
    }

    if (!replaceTextblockWithPortal(state, range, target)) {
      return null;
    }
  },
});
