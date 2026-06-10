import type { Editor } from "@tiptap/core";

export function isAtBlockStart(editor: Editor): boolean {
  const { empty, from } = editor.state.selection;
  if (!empty) {
    return false;
  }

  const $from = editor.state.doc.resolve(from);
  if ($from.parentOffset !== 0) {
    return false;
  }

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.index(depth) > 0) {
      return false;
    }
  }

  return true;
}
