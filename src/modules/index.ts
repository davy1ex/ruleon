import { getSyncServerUrl } from "../config/sync";
import { stopSync } from "../domain/db";
import type { DbContext } from "../domain/db/types";
import type { AppSettings } from "../store/settingsStore";
import { disposeBackupModule, initBackupModule } from "./backup/backupModule";
import { disposePomodoroModule } from "./pomodoro/pomodoroModule";

export async function initModules(
  settings: AppSettings,
  context: DbContext,
): Promise<void> {
  if (settings.sync.enabled) {
    await import("./sync/syncModule").then((m) =>
      m.init(getSyncServerUrl(settings.sync.url), settings.sync.apiKey),
    );
  }

  if (settings.plugins.pomodoro?.enabled !== false) {
    await import("./pomodoro/pomodoroModule").then((m) => m.initPomodoroModule());
  }

  initBackupModule(context);
}

export function disposeModules(): void {
  stopSync();
  disposeBackupModule();
  disposePomodoroModule();
}
