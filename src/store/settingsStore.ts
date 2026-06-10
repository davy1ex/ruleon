import { create } from "zustand";

export type ThemeId = "default" | "solarized-light" | "dracula" | "custom";

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "default", label: "Default Light" },
  { id: "solarized-light", label: "Solarized Light" },
  { id: "dracula", label: "Dracula" },
  { id: "custom", label: "Custom CSS" },
];

export interface AppSettings {
  theme: ThemeId;
  customCss: string;
  sync: { enabled: boolean; url: string; apiKey: string };
  plugins: Record<string, { enabled: boolean }>;
}

const STORAGE_KEY = "ruleon-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "solarized-light",
  customCss: "",
  sync: { enabled: false, url: "ws://localhost:8080/sync", apiKey: "" },
  plugins: {
    sync: { enabled: false },
    calendar: { enabled: false },
    pomodoro: { enabled: true },
  },
};

export const CORE_MODULES = [
  { id: "sync", label: "Sync", description: "WebSocket synchronization" },
  { id: "calendar", label: "Calendar", description: "Calendar views and scheduling" },
  { id: "pomodoro", label: "Pomodoro", description: "Focus timer with journal logging" },
] as const;

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function mergeWithDefaults(parsed: Partial<AppSettings>): AppSettings {
  return {
    theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
    customCss: parsed.customCss ?? DEFAULT_SETTINGS.customCss,
    sync: { ...DEFAULT_SETTINGS.sync, ...parsed.sync },
    plugins: { ...DEFAULT_SETTINGS.plugins, ...parsed.plugins },
  };
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    return mergeWithDefaults(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsState {
  settings: AppSettings;
  isPanelOpen: boolean;
  hydrate: () => AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateTheme: (theme: ThemeId) => void;
  updateCustomCss: (customCss: string) => void;
  updateSync: (patch: Partial<AppSettings["sync"]>) => void;
  setPluginEnabled: (id: string, enabled: boolean) => void;
  openPanel: () => void;
  closePanel: () => void;
  saveAndRestart: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isPanelOpen: false,

  hydrate: () => {
    const settings = loadSettings();
    applyTheme(settings.theme);
    set({ settings });
    return settings;
  },

  setSettings: (settings) => {
    applyTheme(settings.theme);
    set({ settings });
  },

  updateTheme: (theme) =>
    set((state) => ({
      settings: { ...state.settings, theme },
    })),

  updateCustomCss: (customCss) =>
    set((state) => ({
      settings: { ...state.settings, customCss },
    })),

  updateSync: (patch) =>
    set((state) => ({
      settings: {
        ...state.settings,
        sync: { ...state.settings.sync, ...patch },
        plugins: {
          ...state.settings.plugins,
          sync: { enabled: patch.enabled ?? state.settings.sync.enabled },
        },
      },
    })),

  setPluginEnabled: (id, enabled) => {
    if (id === "sync") {
      get().updateSync({ enabled });
      return;
    }

    set((state) => ({
      settings: {
        ...state.settings,
        plugins: {
          ...state.settings.plugins,
          [id]: { enabled },
        },
      },
    }));
  },

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),

  saveAndRestart: () => {
    const { settings } = get();
    const normalized: AppSettings = {
      ...settings,
      plugins: {
        ...settings.plugins,
        sync: { enabled: settings.sync.enabled },
      },
    };
    saveSettings(normalized);
    window.location.reload();
  },
}));
