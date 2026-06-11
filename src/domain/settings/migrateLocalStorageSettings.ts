import type { RuleonDb as DB } from "../db/types";
import type { AppSettings } from "../../store/settingsStore";
import type { WorkspacePlugins } from "../../store/workspaceTypes";
import {
  APP_CONFIG_KEY,
  LEGACY_SETTINGS_KEY,
  LEGACY_WORKSPACE_KEY,
  PLUGINS_CONFIG_KEY,
} from "./settingKeys";
import { getSetting, setSetting } from "./settingsRepo";

function readLegacyAppConfig(): AppSettings | null {
  try {
    const raw = localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AppSettings;
  } catch {
    return null;
  }
}

function readLegacyPluginsConfig(): WorkspacePlugins | null {
  try {
    const raw = localStorage.getItem(LEGACY_WORKSPACE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { plugins?: Partial<WorkspacePlugins> };
    if (parsed.plugins === undefined) {
      return null;
    }
    return {
      gamification: parsed.plugins.gamification ?? false,
      calendar: parsed.plugins.calendar ?? false,
    };
  } catch {
    return null;
  }
}

export async function migrateLocalStorageSettings(db: DB): Promise<void> {
  const existingAppConfig = await getSetting(db, APP_CONFIG_KEY);
  if (existingAppConfig === null) {
    const legacyAppConfig = readLegacyAppConfig();
    if (legacyAppConfig) {
      await setSetting(db, APP_CONFIG_KEY, legacyAppConfig);
      localStorage.removeItem(LEGACY_SETTINGS_KEY);
    }
  }

  const existingPluginsConfig = await getSetting(db, PLUGINS_CONFIG_KEY);
  if (existingPluginsConfig === null) {
    const legacyPlugins = readLegacyPluginsConfig();
    if (legacyPlugins) {
      await setSetting(db, PLUGINS_CONFIG_KEY, legacyPlugins);
      const raw = localStorage.getItem(LEGACY_WORKSPACE_KEY);
      if (raw) {
        try {
          const workspace = JSON.parse(raw) as Record<string, unknown>;
          delete workspace.plugins;
          localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify(workspace));
        } catch {
          // Keep workspace blob as-is if parse fails.
        }
      }
    }
  }
}
