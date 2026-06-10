export type OutlinerKeyboardAction =
  | "newSibling"
  | "indent"
  | "outdent"
  | "delete"
  | "toggleCollapse";

export interface OutlinerKeyboardContext {
  content: string;
  hasChildren: boolean;
}

export function mapKeyboardAction(
  key: string,
  shiftKey: boolean,
  context: OutlinerKeyboardContext,
): OutlinerKeyboardAction | null {
  if (key === "Tab" && shiftKey) {
    return "outdent";
  }

  if (key === "Tab") {
    return "indent";
  }

  if (key === "Backspace" && context.content.length === 0) {
    return "delete";
  }

  if (key === "ArrowLeft" && context.content.length === 0 && context.hasChildren) {
    return "toggleCollapse";
  }

  return null;
}
