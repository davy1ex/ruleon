import { useEffect, useState } from "react";
import {
  applyTheme,
  CORE_MODULES,
  THEME_OPTIONS,
  type AppSettings,
  type ThemeId,
  useSettingsStore,
} from "../../store/settingsStore";
import { Button } from "../Button";
import { SettingsToggle } from "./SettingsToggle";

function isPluginEnabled(settings: AppSettings, id: string): boolean {
  if (id === "sync") {
    return settings.sync.enabled;
  }
  return settings.plugins[id]?.enabled ?? false;
}

export function SettingsLeaf() {
  const saveAndRestart = useSettingsStore((s) => s.saveAndRestart);
  const storedSettings = useSettingsStore((s) => s.settings);
  const [draft, setDraft] = useState<AppSettings>(storedSettings);

  useEffect(() => {
    setDraft(storedSettings);
    applyTheme(storedSettings.theme);
  }, [storedSettings]);

  useEffect(() => {
    applyTheme(draft.theme);
  }, [draft.theme]);

  const updateSync = (patch: Partial<AppSettings["sync"]>) => {
    setDraft((prev) => ({
      ...prev,
      sync: { ...prev.sync, ...patch },
      plugins: {
        ...prev.plugins,
        sync: { enabled: patch.enabled ?? prev.sync.enabled },
      },
    }));
  };

  const setPluginEnabled = (id: string, enabled: boolean) => {
    if (id === "sync") {
      updateSync({ enabled });
      return;
    }

    setDraft((prev) => ({
      ...prev,
      plugins: { ...prev.plugins, [id]: { enabled } },
    }));
  };

  const updateTheme = (theme: ThemeId) => {
    setDraft((prev) => ({ ...prev, theme }));
  };

  const updateCustomCss = (customCss: string) => {
    setDraft((prev) => ({ ...prev, customCss }));
  };

  const handleSave = () => {
    useSettingsStore.getState().setSettings(draft);
    saveAndRestart();
  };

  return (
    <div className="mx-auto max-w-lg px-8 py-8">
      {draft.theme === "custom" && draft.customCss.trim() ? (
        <style>{`:root[data-theme='custom'] {\n${draft.customCss}\n}`}</style>
      ) : null}
      <div className="rounded-lg border border-border bg-surface-secondary shadow-lg">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-text-emphasis">Settings</h2>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 py-4">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Appearance
            </h3>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-text-normal">Theme</span>
                <select
                  value={draft.theme}
                  onChange={(event) =>
                    updateTheme(event.target.value as ThemeId)
                  }
                  className="w-full rounded border border-border bg-surface-input p-2 text-sm text-text-normal"
                >
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {draft.theme === "custom" && (
                <label className="block">
                  <span className="mb-1 block text-sm text-text-normal">
                    Custom CSS
                  </span>
                  <textarea
                    value={draft.customCss}
                    onChange={(event) => updateCustomCss(event.target.value)}
                    className="h-64 w-full rounded border border-border bg-surface-input p-4 font-mono text-sm text-text-normal"
                    placeholder={`/* Override theme variables, e.g.:\n--color-bg-primary: #1e1e2e;\n--color-text-normal: #cdd6f4;\n--color-accent: #cba6f7;\n*/`}
                    spellCheck={false}
                  />
                </label>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Sync
            </h3>
            <div className="space-y-3">
              <SettingsToggle
                label="Enable Synchronization"
                checked={draft.sync.enabled}
                onChange={(enabled) => updateSync({ enabled })}
              />
              <label className="block">
                <span className="mb-1 block text-sm text-text-normal">
                  WebSocket URL
                </span>
                <input
                  type="url"
                  value={draft.sync.url}
                  onChange={(e) => updateSync({ url: e.target.value })}
                  disabled={!draft.sync.enabled}
                  className="w-full rounded border border-border bg-surface-input px-3 py-1.5 text-sm text-text-normal disabled:bg-surface-secondary disabled:text-text-muted"
                  placeholder="ws://localhost:8080/sync"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-text-normal">
                  API key
                </span>
                <input
                  type="password"
                  value={draft.sync.apiKey}
                  onChange={(e) => updateSync({ apiKey: e.target.value })}
                  disabled={!draft.sync.enabled}
                  className="w-full rounded border border-border bg-surface-input px-3 py-1.5 text-sm text-text-normal disabled:bg-surface-secondary disabled:text-text-muted"
                  placeholder="Same as sync-server API_KEY"
                  autoComplete="off"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Plugins
            </h3>
            <ul className="space-y-3">
              {CORE_MODULES.map((module) => (
                <li key={module.id}>
                  <SettingsToggle
                    label={module.label}
                    checked={isPluginEnabled(draft, module.id)}
                    onChange={(enabled) => setPluginEnabled(module.id, enabled)}
                  />
                  <p className="mt-0.5 text-xs text-text-muted">
                    {module.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button label="Save & Restart" onClick={handleSave} variant="primary" />
        </div>
      </div>
    </div>
  );
}
