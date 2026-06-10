import { Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { ComponentType } from "react";
import type { ReactNodeViewProps } from "@tiptap/react";
import type { OutlinerEditorCallbacks } from "./types";
import { OutlinerKeyboardShortcuts } from "./extensions/outlinerKeyboardShortcuts";
import { QueryPortal } from "./extensions/queryPortal";
import { WikiLink } from "./extensions/wikiLink";
import { wikiLinkInputRule } from "./extensions/wikiLinkInputRule";

interface CreateBlockExtensionsOptions extends OutlinerEditorCallbacks {
  placeholder?: string;
  readOnly?: boolean;
  QueryPortalView: ComponentType<ReactNodeViewProps>;
}

const WikiLinkInputRules = Extension.create({
  name: "wikiLinkInputRules",
  addInputRules() {
    return [wikiLinkInputRule];
  },
});

export function createBlockExtensions(options: CreateBlockExtensionsOptions) {
  const {
    placeholder = "Type something…",
    readOnly = false,
    onSplitBlock,
    onIndent,
    onOutdent,
    onMergeWithPrevious,
    onToggleTaskStatus,
    onNavigateWikiLink,
    QueryPortalView,
  } = options;

  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      horizontalRule: false,
    }),
    Placeholder.configure({ placeholder }),
    // QueryPortal (with input/paste rules) before WikiLink so `{{query: T}}` is not split by [[...]].
    QueryPortal.configure({ QueryPortalView }),
    WikiLink.configure({
      onNavigate: onNavigateWikiLink,
    }),
    WikiLinkInputRules,
    OutlinerKeyboardShortcuts.configure({
      onSplitBlock,
      onIndent,
      onOutdent,
      onMergeWithPrevious,
      onToggleTaskStatus,
      readOnly,
    }),
  ];
}
