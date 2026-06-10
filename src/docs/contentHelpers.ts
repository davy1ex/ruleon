import type { BlockContentJSON } from "../domain/outliner/contentTypes";

export function paragraph(text: string): BlockContentJSON {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}
