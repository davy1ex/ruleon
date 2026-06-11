import { useEffect, useState } from "react";
import {
  Blocks,
  Palette,
  Puzzle,
  RefreshCw,
} from "lucide-react";
import {
  applyTheme,
  CORE_MODULES,
  THEME_OPTIONS,
  WORKSPACE_PLUGINS,
  type AppSettings,
  type ThemeId,
  useSettingsStore,
} from "../../../store/settingsStore";
import { useWorkspaceStore } from "../../../store/workspaceStore";
import { Button } from "../../Button";
import { SyncStatusPanel } from "../SyncStatusPanel";
import {
  MobileSettingsField,
  MobileSettingsNavRow,
  MobileSettingsSection,
  MobileSettingsShell,
  MobileSettingsToggleRow,
} from "./MobileSettingsPrimitives";

type SettingsView = "root" | "appearance" | "sync" | "core" | "workspace";

interface MobileSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

function isPluginEnabled(settings: AppSettings, id: string): boolean {
  if (id === "sync") {
    return settings.sync.enabled;
  }
  return settings.plugins[id]?.enabled ?? false;
}

export function MobileSettingsSheet({ open, onClose }: MobileSettingsSheetProps) {
  const saveAndRestart = useSettingsStore((s) => s.saveAndRestart);
  const storedSettings = useSettingsStore((s) => s.settings);
  const workspacePlugins = useWorkspaceStore((s) => s.plugins);
  const togglePlugin = useWorkspaceStore((s) => s.togglePlugin);
  const [view, setView] = useState<SettingsView>("root");
  const [draft, setDraft] = useState<AppSettings>(storedSettings);

  useEffect(() => {
    if (open) {
      setDraft(storedSettings);
      setView("root");
    }
  }, [open, storedSettings]);

  useEffect(() => {
    if (open) {
      applyTheme(draft.theme);
    }
  }, [open, draft.theme]);

  if (!open) {
    return null;
  }

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

  const handleSave = () => {
    useSettingsStore.getState().setSettings(draft);
    void saveAndRestart();
    onClose();
  };

  const saveBar = (
    <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border/60 bg-surface-secondary px-4 py-3">
      <Button label="Save & Restart" onClick={handleSave} variant="primary" />
    </div>
  );

  if (view === "appearance") {
    return (
      <>
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={onClose}
          aria-hidden
        />
        <div className="fixed inset-0 z-[61] flex flex-col bg-surface-secondary">
          <MobileSettingsShell
            title="Appearance"
            onClose={onClose}
            onBack={() => setView("root")}
          >
            {draft.theme === "custom" && draft.customCss.trim() ? (
              <style>{`:root[data-theme='custom'] {\n${draft.customCss}\n}`}</style>
            ) : null}
            <MobileSettingsSection title="Appearance">
              <MobileSettingsField
                label="Theme"
                description="Choose Ruleon's color scheme."
              >
                <select
                  value={draft.theme}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      theme: event.target.value as ThemeId,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-surface-input px-3 py-2.5 text-sm text-text-normal"
                >
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </MobileSettingsField>
              {draft.theme === "custom" ? (
                <MobileSettingsField
                  label="Custom CSS"
                  description="Override theme variables for this device."
                >
                  <textarea
                    value={draft.customCss}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        customCss: event.target.value,
                      }))
                    }
                    className="h-48 w-full rounded-xl border border-border bg-surface-input p-3 font-mono text-xs text-text-normal"
                    placeholder="--color-bg-primary: #1e1e2e;"
                    spellCheck={false}
                  />
                </MobileSettingsField>
              ) : null}
            </MobileSettingsSection>
            {saveBar}
          </MobileSettingsShell>
        </div>
      </>
    );
  }

  if (view === "sync") {
    return (
      <>
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={onClose}
          aria-hidden
        />
        <div className="fixed inset-0 z-[61] flex flex-col bg-surface-secondary">
          <MobileSettingsShell
            title="Sync"
            onClose={onClose}
            onBack={() => setView("root")}
          >
            <MobileSettingsSection title="Synchronization">
              <div className="p-4">
                <SyncStatusPanel sync={draft.sync} onSyncChange={updateSync} />
              </div>
            </MobileSettingsSection>
            {saveBar}
          </MobileSettingsShell>
        </div>
      </>
    );
  }

  if (view === "core") {
    return (
      <>
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={onClose}
          aria-hidden
        />
        <div className="fixed inset-0 z-[61] flex flex-col bg-surface-secondary">
          <MobileSettingsShell
            title="Core plugins"
            onClose={onClose}
            onBack={() => setView("root")}
          >
            <MobileSettingsSection title="Core plugins">
              {CORE_MODULES.map((module) => (
                <MobileSettingsToggleRow
                  key={module.id}
                  label={module.label}
                  description={module.description}
                  checked={isPluginEnabled(draft, module.id)}
                  onChange={(enabled) => setPluginEnabled(module.id, enabled)}
                />
              ))}
            </MobileSettingsSection>
            {saveBar}
          </MobileSettingsShell>
        </div>
      </>
    );
  }

  if (view === "workspace") {
    return (
      <>
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={onClose}
          aria-hidden
        />
        <div className="fixed inset-0 z-[61] flex flex-col bg-surface-secondary">
          <MobileSettingsShell
            title="Workspace plugins"
            onClose={onClose}
            onBack={() => setView("root")}
          >
            <MobileSettingsSection title="Workspace plugins">
              {WORKSPACE_PLUGINS.map((plugin) => (
                <MobileSettingsToggleRow
                  key={plugin.id}
                  label={plugin.label}
                  description={plugin.description}
                  checked={workspacePlugins[plugin.id]}
                  onChange={() => togglePlugin(plugin.id)}
                />
              ))}
            </MobileSettingsSection>
            {saveBar}
          </MobileSettingsShell>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-[61] flex flex-col bg-surface-secondary">
        <MobileSettingsShell title="Settings" onClose={onClose}>
          <MobileSettingsSection title="Options">
            <MobileSettingsNavRow
              icon={Palette}
              label="Appearance"
              onClick={() => setView("appearance")}
            />
            <MobileSettingsNavRow
              icon={RefreshCw}
              label="Sync"
              onClick={() => setView("sync")}
            />
            <MobileSettingsNavRow
              icon={Blocks}
              label="Core plugins"
              onClick={() => setView("core")}
            />
            <MobileSettingsNavRow
              icon={Puzzle}
              label="Workspace plugins"
              onClick={() => setView("workspace")}
            />
          </MobileSettingsSection>
          {saveBar}
        </MobileSettingsShell>
      </div>
    </>
  );
}
