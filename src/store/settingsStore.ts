import { create } from "zustand";
import { getDefaultSyncUrl } from "../config/sync";
import { APP_CONFIG_KEY } from "../domain/settings/settingKeys";
import { setSetting } from "../domain/settings/settingsRepo";
import { getDbContext } from "./dbContext";

export type ThemeId =
  | "default"
  | "solarized-light"
  | "solarized-dark"
  | "dracula"
  | "custom";

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "default", label: "Default Light" },
  { id: "solarized-light", label: "Solarized Light" },
  { id: "solarized-dark", label: "Solarized Dark" },
  { id: "dracula", label: "Dracula" },
  { id: "custom", label: "Custom CSS" },
];

const VALID_THEMES = new Set<string>(THEME_OPTIONS.map((option) => option.id));

export interface AppSettings {
  theme: ThemeId;
  customCss: string;
  sync: { enabled: boolean; url: string; apiKey: string };
  plugins: Record<string, { enabled: boolean }>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "solarized-dark",
  customCss: "",
  sync: { enabled: false, url: getDefaultSyncUrl(), apiKey: "" },
  plugins: {
    sync: { enabled: false },
    pomodoro: { enabled: true },
  },
};

export const CORE_MODULES = [
  { id: "sync", label: "Sync", description: "WebSocket synchronization" },
  { id: "pomodoro", label: "Pomodoro", description: "Focus timer with journal logging" },
] as const;

export const WORKSPACE_PLUGINS = [
  {
    id: "calendar",
    label: "Calendar",
    description: "Obsidian-style daily note calendar in the right panel",
  },
  {
    id: "gamification",
    label: "Gamification",
    description: "Earn XP and coins when completing tasks",
  },
] as const;

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function mergeWithDefaults(parsed: Partial<AppSettings>): AppSettings {
  const theme =
    parsed.theme && VALID_THEMES.has(parsed.theme)
      ? parsed.theme
      : DEFAULT_SETTINGS.theme;

  return {
    theme,
    customCss: parsed["customCss"] ?? DEFAULT_SETTINGS["customCss"],
    sync: { ...DEFAULT_SETTINGS.sync, ...parsed.sync },
    plugins: { ...DEFAULT_SETTINGS.plugins, ...parsed.plugins },
  };
}

export function normalizeAppSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    plugins: {
      ...settings.plugins,
      sync: { enabled: settings.sync.enabled },
    },
  };
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
  saveAndRestart: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isPanelOpen: false,

  hydrate: () => {
    const settings = DEFAULT_SETTINGS;
    applyTheme(settings.theme);
    set({ settings });
    return settings;
  },

  setSettings: (settings) => {
    const merged = mergeWithDefaults(settings);
    applyTheme(merged.theme);
    set({ settings: merged });
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

  saveAndRestart: async () => {
    const normalized = normalizeAppSettings(get().settings);
    const db = getDbContext()?.db;
    if (db) {
      await setSetting(db, APP_CONFIG_KEY, normalized);
    }
    window.location.reload();
  },
}));
