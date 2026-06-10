import type { BlockContentJSON } from "../../domain/outliner/contentTypes";

export interface OutlinerEditorCallbacks {
  onSplitBlock: (payload: {
    left: BlockContentJSON;
    right: BlockContentJSON;
  }) => void | Promise<void>;
  onIndent: () => void | Promise<void>;
  onOutdent: () => void | Promise<void>;
  onMergeWithPrevious: (payload: {
    remainder: BlockContentJSON;
  }) => void | Promise<void>;
  onToggleTaskStatus?: () => void | Promise<void>;
  onNavigateWikiLink?: (pageName: string) => void;
}

export type { BlockContentJSON };
