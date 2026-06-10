import { PasteRule } from "@tiptap/core";
import { QueryPortal } from "./queryPortal";
import { QUERY_PORTAL_PASTE_PATTERN } from "./queryPortalSyntax";

export const queryPortalPasteRule = new PasteRule({
  find: QUERY_PORTAL_PASTE_PATTERN,
  handler: ({ state, range, match }) => {
    const target = match[1]?.trim();
    if (!target) {
      return null;
    }

    const portalType = state.schema.nodes[QueryPortal.name];
    if (!portalType) {
      return null;
    }

    const $from = state.doc.resolve(range.from);
    const blockPos = $from.before();
    const blockNode = $from.parent;

    if (!blockNode.type.isTextblock) {
      return null;
    }

    const portal = portalType.create({ target, filter: "todo" });
    state.tr.replaceWith(blockPos, blockPos + blockNode.nodeSize, portal);
  },
});
