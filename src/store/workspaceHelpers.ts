import { SYSTEM_TRASH_ROOT_ID } from "./journal";
import { useOutlinerStore } from "./outlinerStore";
import type {
  EditorLeafState,
  JournalLeafState,
  RightWidgetType,
  SearchLeafState,
  SettingsLeafState,
  TrashLeafState,
  WorkspaceLayout,
  WorkspaceLeaf,
  WorkspaceLeafState,
  WorkspaceLeafType,
  WorkspacePlugins,
  WorkspaceStore,
} from "./workspaceTypes";
import { defaultPlugins } from "./workspaceTypes";

export const STORAGE_KEY = "ruleon.workspace";

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
    leftSidebarOpen: true,
    rightWidget: null,
    lastRightWidget: "outline",
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

interface LegacySidebarWidget {
  type: string;
  order?: number;
}

interface LegacyPersistedWorkspace {
  leaves?: Record<string, WorkspaceLeaf>;
  leafOrder?: string[];
  activeLeafId?: string | null;
  plugins?: Partial<WorkspacePlugins>;
  sidebarWidgets?: LegacySidebarWidget[];
  layout?: Partial<WorkspaceLayout> & {
    leftSidebarWidth?: number;
    rightSidebarOpen?: boolean;
    rightSidebarWidth?: number;
  };
}

function mapLegacyWidgetType(type: string): RightWidgetType | null {
  if (
    type === "pomodoro" ||
    type === "outline" ||
    type === "calendar" ||
    type === "profile"
  ) {
    return type;
  }
  return null;
}

export function migrateLayout(raw: LegacyPersistedWorkspace): WorkspaceLayout {
  const layout = raw.layout;
  if (
    layout &&
    typeof layout.leftSidebarOpen === "boolean" &&
    "rightWidget" in layout
  ) {
    return {
      leftSidebarOpen: layout.leftSidebarOpen,
      rightWidget: layout.rightWidget ?? null,
      lastRightWidget: layout.lastRightWidget ?? "outline",
    };
  }

  const widgets = raw.sidebarWidgets ?? [];
  const sorted = [...widgets].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  let rightWidget: RightWidgetType | null = null;

  if (layout?.rightSidebarOpen && sorted.length > 0) {
    rightWidget = mapLegacyWidgetType(sorted[0].type);
  } else {
    for (const widget of sorted) {
      const mapped = mapLegacyWidgetType(widget.type);
      if (mapped) {
        rightWidget = mapped;
        break;
      }
    }
  }

  return {
    leftSidebarOpen: true,
    rightWidget,
    lastRightWidget: rightWidget ?? "outline",
  };
}

export function migratePlugins(_raw: LegacyPersistedWorkspace): WorkspacePlugins {
  return defaultPlugins();
}

export function loadPersisted(): LegacyPersistedWorkspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as LegacyPersistedWorkspace;
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
  const { leaves, leafOrder, activeLeafId, layout } = get();
  const data = {
    leaves,
    leafOrder,
    activeLeafId,
    layout,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
