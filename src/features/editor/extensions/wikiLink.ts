import { Node, mergeAttributes } from "@tiptap/core";

export interface WikiLinkOptions {
  onNavigate?: (pageName: string) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (pageName: string) => ReturnType;
    };
  }
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return {
      onNavigate: undefined,
    };
  },

  addAttributes() {
    return {
      pageName: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const pageName = HTMLAttributes.pageName ?? "";
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-wiki-link": "true",
        class: "cursor-pointer text-link hover:underline",
      }),
      `[[${pageName}]]`,
    ];
  },

  addCommands() {
    return {
      setWikiLink:
        (pageName: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { pageName },
          }),
    };
  },
});
