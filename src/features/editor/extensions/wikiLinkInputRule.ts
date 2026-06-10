import { InputRule } from "@tiptap/core";
import { WikiLink } from "./wikiLink";

export const wikiLinkInputRule = new InputRule({
  find: /\[\[([^\]]+)\]\]$/,
  handler: ({ range, match, chain }) => {
    const pageName = match[1]?.trim();
    if (!pageName) {
      return null;
    }

    chain()
      .deleteRange(range)
      .insertContent({
        type: WikiLink.name,
        attrs: { pageName },
      })
      .run();
  },
});
