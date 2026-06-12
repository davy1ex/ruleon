import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useRef } from "react";
import { parseSyncDeepLink } from "../config/sync";
import { useSettingsStore } from "../store/settingsStore";
import { useToastStore } from "../store/toastStore";

async function applySyncDeepLink(href: string): Promise<boolean> {
  const payload = parseSyncDeepLink(href);
  if (!payload) {
    console.warn("Unrecognized sync deep link:", href);
    return false;
  }

  const settings = useSettingsStore.getState().settings;
  useSettingsStore.getState().setSettings({
    ...settings,
    sync: {
      enabled: true,
      url: payload.url,
      apiKey: payload.apiKey,
    },
    plugins: {
      ...settings.plugins,
      sync: { enabled: true },
    },
  });
  useToastStore.getState().showToast("Sync settings applied — restarting…");
  await useSettingsStore.getState().saveAndRestart();
  return true;
}

export function useSyncDeepLink(ready: boolean): void {
  const pendingHref = useRef<string | null>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  const processHref = useCallback(async (href: string | undefined) => {
    if (!href) {
      return;
    }
    if (!readyRef.current) {
      pendingHref.current = href;
      return;
    }
    await applySyncDeepLink(href);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    void App.getLaunchUrl().then((result) => {
      void processHref(result?.url);
    });

    const listenerPromise = App.addListener("appUrlOpen", (event) => {
      void processHref(event.url);
    });

    return () => {
      void listenerPromise.then((handle) => handle.remove());
    };
  }, [processHref]);

  useEffect(() => {
    if (!ready || !pendingHref.current) {
      return;
    }
    const href = pendingHref.current;
    pendingHref.current = null;
    void applySyncDeepLink(href);
  }, [ready]);
}
