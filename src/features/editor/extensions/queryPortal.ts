import { Node, mergeAttributes } from "@tiptap/core";
import { queryPortalInputRule } from "./queryPortalInputRule";
import { queryPortalPasteRule } from "./queryPortalPasteRule";
import {
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import type { ComponentType } from "react";

export interface QueryPortalOptions {
  QueryPortalView: ComponentType<ReactNodeViewProps>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    queryPortal: {
      insertQueryPortal: (target: string, filter?: "todo" | "all") => ReturnType;
    };
  }
}

/** Block atom for `{{query: Target}}` DSL — see `queryPortalSyntax.ts`. */
export const QueryPortal = Node.create<QueryPortalOptions>({
  name: "queryPortal",
  group: "block",
  atom: true,
  selectable: false,
  draggable: false,

  addOptions() {
    return {
      QueryPortalView: () => null,
    };
  },

  addAttributes() {
    return {
      target: { default: "" },
      filter: { default: "todo" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-query-portal]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-query-portal": "true",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(this.options.QueryPortalView, {
      as: "div",
    });
  },

  addInputRules() {
    return [queryPortalInputRule];
  },

  addPasteRules() {
    return [queryPortalPasteRule];
  },

  addCommands() {
    return {
      insertQueryPortal:
        (target: string, filter: "todo" | "all" = "todo") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { target, filter },
          }),
    };
  },
});
