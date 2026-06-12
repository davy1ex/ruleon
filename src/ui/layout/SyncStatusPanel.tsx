import { useEffect, useState } from "react";
import { getInboxApiUrl, getSyncUrlValidationError, isNativePlatform } from "../../config/sync";
import {
  type AppSettings,
  useSettingsStore,
} from "../../store/settingsStore";
import { Button } from "../Button";
import { SyncConnectionTest } from "../components/SyncConnectionTest";
import { SyncSetupQr } from "../components/SyncSetupQr";
import { SyncIndicator } from "../SyncIndicator";
import { SettingsToggle } from "./SettingsToggle";

interface SyncStatusPanelProps {
  sync?: AppSettings["sync"];
  onSyncChange?: (patch: Partial<AppSettings["sync"]>) => void;
  standalone?: boolean;
}

export function SyncStatusPanel({
  sync: controlledSync,
  onSyncChange,
  standalone = false,
}: SyncStatusPanelProps) {
  const saveAndRestart = useSettingsStore((s) => s.saveAndRestart);
  const storedSettings = useSettingsStore((s) => s.settings);
  const [draft, setDraft] = useState<AppSettings["sync"]>(
    controlledSync ?? storedSettings.sync,
  );

  useEffect(() => {
    if (controlledSync) {
      setDraft(controlledSync);
    }
  }, [controlledSync]);

  useEffect(() => {
    if (standalone) {
      setDraft(storedSettings.sync);
    }
  }, [standalone, storedSettings.sync]);

  const updateSync = (patch: Partial<AppSettings["sync"]>) => {
    if (onSyncChange) {
      onSyncChange(patch);
      return;
    }
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    if (!standalone) {
      return;
    }
    const settings = useSettingsStore.getState().settings;
    useSettingsStore.getState().setSettings({
      ...settings,
      sync: draft,
      plugins: {
        ...settings.plugins,
        sync: { enabled: draft.enabled },
      },
    });
    void saveAndRestart();
  };

  const sync = controlledSync ?? draft;
  const native = isNativePlatform();
  const syncUrlPlaceholder = native
    ? "ws://192.168.x.x:8080/sync"
    : "ws://localhost:8080/sync";
  const urlError =
    sync.enabled && sync.url.trim()
      ? getSyncUrlValidationError(sync.url)
      : null;
  const inboxApiUrl = sync.enabled ? getInboxApiUrl(sync.url) : null;

  return (
    <div className="space-y-4">
      <SyncIndicator />
      <div className="space-y-3">
        <SettingsToggle
          label="Enable Synchronization"
          checked={sync.enabled}
          onChange={(enabled) => updateSync({ enabled })}
        />
        <label className="block">
          <span className="mb-1 block text-sm text-text-normal">
            WebSocket URL
          </span>
          <input
            type="url"
            value={sync.url}
            onChange={(e) => updateSync({ url: e.target.value })}
            disabled={!sync.enabled}
            className={`w-full rounded border bg-surface-input px-3 py-1.5 text-sm text-text-normal disabled:bg-surface-secondary disabled:text-text-muted ${
              urlError ? "border-status-error" : "border-border"
            }`}
            placeholder={syncUrlPlaceholder}
          />
          {urlError ? (
            <p className="mt-1 text-xs text-status-error">{urlError}</p>
          ) : null}
          {native && sync.enabled ? (
            <p className="mt-1 text-xs text-text-muted">
              Enter your computer&apos;s LAN IPv4 (from OS network settings).
              Phone and computer must be on the same Wi-Fi.
            </p>
          ) : null}
        </label>
        {sync.enabled && inboxApiUrl ? (
          <p className="text-xs text-text-muted">
            Inbox API:{" "}
            <code className="rounded bg-surface-input px-1 py-0.5 font-mono text-[11px]">
              {inboxApiUrl}
            </code>
          </p>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-sm text-text-normal">API key</span>
          <input
            type="password"
            value={sync.apiKey}
            onChange={(e) => updateSync({ apiKey: e.target.value })}
            disabled={!sync.enabled}
            className="w-full rounded border border-border bg-surface-input px-3 py-1.5 text-sm text-text-normal disabled:bg-surface-secondary disabled:text-text-muted"
            placeholder="Same as sync-server API_KEY"
            autoComplete="off"
          />
        </label>
        <SyncConnectionTest
          url={sync.url}
          apiKey={sync.apiKey}
          enabled={sync.enabled && !urlError}
        />
        <SyncSetupQr
          url={sync.url}
          apiKey={sync.apiKey}
          enabled={sync.enabled && !urlError}
        />
      </div>
      {standalone ? (
        <Button label="Save & Restart" onClick={handleSave} variant="primary" />
      ) : null}
    </div>
  );
}
