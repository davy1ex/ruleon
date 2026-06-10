export interface BlockTextNode {
  type: "text";
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface BlockWikiLinkNode {
  type: "wikiLink";
  attrs?: { pageName?: string };
}

export interface BlockQueryPortalNode {
  type: "queryPortal";
  attrs?: { target?: string; filter?: "todo" | "all" };
}

export interface BlockParagraphNode {
  type: "paragraph";
  content?: BlockContentNode[];
}

export interface BlockHardBreakNode {
  type: "hardBreak";
}

export type BlockContentNode =
  | BlockTextNode
  | BlockWikiLinkNode
  | BlockQueryPortalNode
  | BlockParagraphNode
  | BlockHardBreakNode
  | {
      type: string;
      content?: BlockContentNode[];
      attrs?: Record<string, unknown>;
      text?: string;
      marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
    };

export interface BlockDocumentJSON {
  type: "doc";
  content?: BlockContentNode[];
}

export type BlockContentJSON = BlockDocumentJSON | null;

export const EMPTY_DOCUMENT: BlockDocumentJSON = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
