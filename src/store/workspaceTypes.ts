export type WorkspaceLeafType =
  | "editor"
  | "journal"
  | "trash"
  | "search"
  | "settings";

export interface EditorLeafState {
  rootId: string;
  scrollTop?: number;
}

export interface JournalLeafState {
  _?: never;
}

export interface TrashLeafState {
  _?: never;
}

export interface SearchLeafState {
  query: string;
  resultIndex?: number;
}

export interface SettingsLeafState {
  section?: "theme" | "sync" | "plugins";
}

export type WorkspaceLeafState =
  | EditorLeafState
  | JournalLeafState
  | TrashLeafState
  | SearchLeafState
  | SettingsLeafState;

export interface WorkspaceLeaf {
  id: string;
  type: WorkspaceLeafType;
  title: string;
  state: WorkspaceLeafState;
  createdAt: number;
  lastFocusedAt: number;
  pinned?: boolean;
}

export type SidebarWidgetType =
  | "backlinks"
  | "outline"
  | "sync-status"
  | "pomodoro";

export interface SidebarWidget {
  id: string;
  type: SidebarWidgetType;
  pinned: boolean;
  order: number;
  collapsed: boolean;
}

export interface WorkspaceLayout {
  leftSidebarWidth: number;
  rightSidebarOpen: boolean;
  rightSidebarWidth: number;
}

export interface PersistedWorkspace {
  leaves: Record<string, WorkspaceLeaf>;
  leafOrder: string[];
  activeLeafId: string | null;
  sidebarWidgets: SidebarWidget[];
  layout: WorkspaceLayout;
}

export interface WorkspaceStore extends PersistedWorkspace {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  addLeaf: (
    type: WorkspaceLeafType,
    state?: Partial<WorkspaceLeafState>,
    opts?: { activate?: boolean; title?: string },
  ) => string;
  closeLeaf: (id: string) => void;
  activateLeaf: (id: string) => void;
  updateLeafState: (
    id: string,
    patch: Partial<WorkspaceLeafState>,
  ) => void;
  updateLeafTitle: (id: string, title: string) => void;
  reorderLeaves: (fromIndex: number, toIndex: number) => void;
  toggleLeafPin: (id: string) => void;
  openPage: (rootId: string, title: string) => void;
  openJournal: () => void;
  openTrash: () => void;
  openSearchTab: (query?: string) => void;
  openSettings: (section?: SettingsLeafState["section"]) => void;
  pinWidget: (type: SidebarWidgetType) => void;
  unpinWidget: (id: string) => void;
  toggleWidgetCollapsed: (id: string) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setRightSidebarWidth: (width: number) => void;
  toggleRightSidebar: () => void;
  hydrate: () => void;
  syncActiveLeafNavigation: () => void;
  persist: () => void;
}
