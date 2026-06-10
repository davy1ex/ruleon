import type { FlatOutlineNode } from "../domain/outliner/types";
import type { BlockTreeHandlers } from "./BlockTree";
import { BlockTree } from "./BlockTree";

interface OutlinerTreeProps extends BlockTreeHandlers {
  rootId: string;
  nodes: FlatOutlineNode[];
}

export function OutlinerTree(props: OutlinerTreeProps) {
  return <BlockTree {...props} />;
}
