import { Extension, type Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { isAtBlockStart } from "../document/isAtBlockStart";
import { splitDocumentAtCursor } from "../document/splitDocumentAtCursor";
import type { OutlinerEditorCallbacks } from "../types";

function isQueryPortalSelected(editor: Editor): boolean {
  const { selection } = editor.state;
  return (
    selection instanceof NodeSelection &&
    selection.node.type.name === "queryPortal"
  );
}

export const OutlinerKeyboardShortcuts = Extension.create<
  OutlinerEditorCallbacks & { readOnly?: boolean }
>({
  name: "outlinerKeyboardShortcuts",

  addOptions() {
    return {
      onSplitBlock: async () => {},
      onIndent: async () => {},
      onOutdent: async () => {},
      onMergeWithPrevious: async () => {},
      onToggleTaskStatus: async () => {},
      readOnly: false,
    };
  },

  addKeyboardShortcuts() {
    const readOnly = this.options.readOnly;

    return {
      Enter: ({ editor }) => {
        if (readOnly || editor.view.composing) {
          return false;
        }

        if (isQueryPortalSelected(editor)) {
          return true;
        }

        const { left, right } = splitDocumentAtCursor(editor);
        void this.options.onSplitBlock({ left, right });
        return true;
      },

      "Shift-Enter": () => false,

      Tab: () => {
        if (readOnly) {
          return false;
        }
        void this.options.onIndent();
        return true;
      },

      "Shift-Tab": () => {
        if (readOnly) {
          return false;
        }
        void this.options.onOutdent();
        return true;
      },

      Backspace: ({ editor }) => {
        if (readOnly || isQueryPortalSelected(editor)) {
          return isQueryPortalSelected(editor);
        }

        if (!isAtBlockStart(editor)) {
          return false;
        }

        const { right } = splitDocumentAtCursor(editor);
        void this.options.onMergeWithPrevious({ remainder: right });
        return true;
      },

      "Mod-Enter": ({ editor }) => {
        if (readOnly || isQueryPortalSelected(editor)) {
          return isQueryPortalSelected(editor);
        }
        void this.options.onToggleTaskStatus?.();
        return true;
      },
    };
  },
});
