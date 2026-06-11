import { migrateLocalStorageSettings } from "../domain/settings/migrateLocalStorageSettings";
import { APP_CONFIG_KEY, PLUGINS_CONFIG_KEY } from "../domain/settings/settingKeys";
import { getSetting, setSetting } from "../domain/settings/settingsRepo";
import { hydrateGamificationFromDB } from "../features/gamification/xpEngine";
import { getDbContext } from "./dbContext";
import type { AppSettings } from "./settingsStore";
import { useSettingsStore } from "./settingsStore";
import type { WorkspacePlugins } from "./workspaceTypes";
import { defaultPlugins } from "./workspaceTypes";
import { useWorkspaceStore } from "./workspaceStore";

export async function loadSettingsFromDB(): Promise<void> {
  const db = getDbContext()?.db;
  if (!db) {
    return;
  }

  await migrateLocalStorageSettings(db);

  const appConfig = await getSetting(db, APP_CONFIG_KEY);
  if (appConfig) {
    const settings = appConfig as AppSettings;
    if (settings.theme === "dracula") {
      const migrated = { ...settings, theme: "solarized-dark" as const };
      await setSetting(db, APP_CONFIG_KEY, migrated);
      useSettingsStore.getState().setSettings(migrated);
    } else {
      useSettingsStore.getState().setSettings(settings);
    }
  }

  const pluginsConfig = await getSetting(db, PLUGINS_CONFIG_KEY);
  if (pluginsConfig) {
    useWorkspaceStore.setState({
      plugins: { ...defaultPlugins(), ...(pluginsConfig as WorkspacePlugins) },
    });
  }

  await hydrateGamificationFromDB();
}
