import { SYSTEM_TRASH_ROOT_ID } from "./journal";
import { useOutlinerStore } from "./outlinerStore";
import type {
  EditorLeafState,
  JournalLeafState,
  PersistedWorkspace,
  SearchLeafState,
  SettingsLeafState,
  TrashLeafState,
  WorkspaceLayout,
  WorkspaceLeaf,
  WorkspaceLeafState,
  WorkspaceLeafType,
  WorkspaceStore,
} from "./workspaceTypes";

export const STORAGE_KEY = "ruleon.workspace";
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;
const RIGHT_SIDEBAR_MIN = 200;
const RIGHT_SIDEBAR_MAX = 480;

export const DEFAULT_TITLES: Record<WorkspaceLeafType, string> = {
  editor: "Page",
  journal: "Journal",
  trash: "Trash",
  search: "Search",
  settings: "Settings",
};

export function generateId(): string {
  return `leaf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultLayout(): WorkspaceLayout {
  return {
    leftSidebarWidth: 256,
    rightSidebarOpen: false,
    rightSidebarWidth: 280,
  };
}

export function defaultStateForType(
  type: WorkspaceLeafType,
  partial?: Partial<WorkspaceLeafState>,
): WorkspaceLeafState {
  switch (type) {
    case "editor":
      return { rootId: "", ...partial } as EditorLeafState;
    case "journal":
      return { ...(partial as JournalLeafState) };
    case "trash":
      return { ...(partial as TrashLeafState) };
    case "search":
      return { query: "", ...partial } as SearchLeafState;
    case "settings":
      return { ...(partial as SettingsLeafState) };
  }
}

export function syncNavigationFromLeaf(leaf: WorkspaceLeaf): void {
  const outliner = useOutlinerStore.getState();
  switch (leaf.type) {
    case "editor":
      void outliner.navigateToRoot((leaf.state as EditorLeafState).rootId);
      break;
    case "journal":
      void outliner.navigateToDailyFeed();
      break;
    case "trash":
      void outliner.navigateToRoot(SYSTEM_TRASH_ROOT_ID);
      break;
    case "search":
    case "settings":
      break;
  }
}

export function applyLayoutCss(layout: WorkspaceLayout): void {
  document.documentElement.style.setProperty(
    "--layout-left-sidebar-width",
    `${layout.leftSidebarWidth}px`,
  );
  document.documentElement.style.setProperty(
    "--layout-right-sidebar-width",
    `${layout.rightSidebarWidth}px`,
  );
}

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, width));
}

export function clampRightSidebarWidth(width: number): number {
  return Math.min(RIGHT_SIDEBAR_MAX, Math.max(RIGHT_SIDEBAR_MIN, width));
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function schedulePersist(getState: () => WorkspaceStore): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistWorkspace(getState);
  }, 300);
}

export function createJournalLeaf(): WorkspaceLeaf {
  const now = Date.now();
  const id = generateId();
  return {
    id,
    type: "journal",
    title: DEFAULT_TITLES.journal,
    state: {},
    createdAt: now,
    lastFocusedAt: now,
  };
}

export function loadPersisted(): Partial<PersistedWorkspace> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedWorkspace;
  } catch {
    return null;
  }
}

export function findLeafByType(
  leaves: Record<string, WorkspaceLeaf>,
  type: WorkspaceLeafType,
): WorkspaceLeaf | undefined {
  return Object.values(leaves).find((leaf) => leaf.type === type);
}

export function persistWorkspace(get: () => WorkspaceStore): void {
  const { leaves, leafOrder, activeLeafId, sidebarWidgets, layout } =
    get();
  const data: PersistedWorkspace = {
    leaves,
    leafOrder,
    activeLeafId,
    sidebarWidgets,
    layout,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
