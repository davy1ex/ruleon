import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef } from "react";
import { parseSyncDeepLink } from "../config/sync";
import { useSettingsStore } from "../store/settingsStore";

async function applySyncDeepLink(href: string): Promise<boolean> {
  const payload = parseSyncDeepLink(href);
  if (!payload) {
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
  await useSettingsStore.getState().saveAndRestart();
  return true;
}

export function useSyncDeepLink(ready: boolean): void {
  const pendingHref = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const processHref = async (href: string | undefined) => {
      if (!href) {
        return;
      }
      if (!ready) {
        pendingHref.current = href;
        return;
      }
      await applySyncDeepLink(href);
    };

    void App.getLaunchUrl().then((result) => {
      void processHref(result?.url);
    });

    const listener = App.addListener("appUrlOpen", (event) => {
      void processHref(event.url);
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !pendingHref.current) {
      return;
    }
    const href = pendingHref.current;
    pendingHref.current = null;
    void applySyncDeepLink(href);
  }, [ready]);
}
