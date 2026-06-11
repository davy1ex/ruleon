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

export type RightWidgetType = "calendar" | "pomodoro" | "outline" | "profile";

export interface WorkspacePlugins {
  gamification: boolean;
  calendar: boolean;
}

export function defaultPlugins(): WorkspacePlugins {
  return { gamification: false, calendar: false };
}

export interface WorkspaceLayout {
  leftSidebarOpen: boolean;
  rightWidget: RightWidgetType | null;
  lastRightWidget: RightWidgetType;
}

export interface PersistedWorkspace {
  leaves: Record<string, WorkspaceLeaf>;
  leafOrder: string[];
  activeLeafId: string | null;
  layout: WorkspaceLayout;
  plugins?: WorkspacePlugins;
}

export interface WorkspaceStore extends PersistedWorkspace {
  plugins: WorkspacePlugins;
  togglePlugin: (pluginId: keyof WorkspacePlugins) => void;
  commandPaletteOpen: boolean;
  toggleCommandPalette: (force?: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  globalQuickAddOpen: boolean;
  toggleGlobalQuickAdd: (force?: boolean) => void;
  addLeaf: (
    type: WorkspaceLeafType,
    state?: Partial<WorkspaceLeafState>,
    opts?: { activate?: boolean; title?: string },
  ) => string;
  closeLeaf: (id: string) => void;
  closeOtherLeaves: (id: string) => void;
  closeLeavesToLeft: (id: string) => void;
  closeLeavesToRight: (id: string) => void;
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
  toggleLeftSidebar: () => void;
  toggleRightPanel: () => void;
  setRightWidget: (widget: RightWidgetType | null) => void;
  hydrate: () => void;
  syncActiveLeafNavigation: () => void;
  persist: () => void;
}
