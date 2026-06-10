import type { Editor } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { BlockContentJSON } from "../../../domain/outliner/contentTypes";
import { EMPTY_DOCUMENT } from "../../../domain/outliner/contentTypes";

function nodeToJson(node: ProseMirrorNode): BlockContentJSON {
  return node.toJSON() as BlockContentJSON;
}

function emptyDoc(): BlockContentJSON {
  return { ...EMPTY_DOCUMENT, content: [{ type: "paragraph" }] };
}

export function splitDocumentAtCursor(editor: Editor): {
  left: BlockContentJSON;
  right: BlockContentJSON;
} {
  const { from } = editor.state.selection;
  const doc = editor.state.doc;

  if (from <= 0 || from >= doc.content.size) {
    const full = editor.getJSON() as BlockContentJSON;
    if (from <= 0) {
      return { left: emptyDoc(), right: full ?? emptyDoc() };
    }
    return { left: full ?? emptyDoc(), right: emptyDoc() };
  }

  const leftNode = doc.cut(0, from);
  const rightNode = doc.cut(from, doc.content.size);

  return {
    left: nodeToJson(leftNode) ?? emptyDoc(),
    right: nodeToJson(rightNode) ?? emptyDoc(),
  };
}
