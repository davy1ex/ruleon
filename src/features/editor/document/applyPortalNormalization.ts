import type { Editor } from "@tiptap/core";
import { QueryPortal } from "../extensions/queryPortal";
import { parsePortalTarget } from "../extensions/queryPortalSyntax";

export function applyPortalNormalization(editor: Editor): boolean {
  const portalType = editor.schema.nodes[QueryPortal.name];
  if (!portalType) {
    return false;
  }

  const { state, view } = editor;
  let tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (changed || node.type.name !== "paragraph") {
      return;
    }

    const target = parsePortalTarget(node.textContent);
    if (!target) {
      return;
    }

    const portalNode = portalType.create({ target, filter: "todo" });
    tr = tr.replaceWith(pos, pos + node.nodeSize, portalNode);
    changed = true;
  });

  if (!changed) {
    return false;
  }

  view.dispatch(tr);
  return true;
}
