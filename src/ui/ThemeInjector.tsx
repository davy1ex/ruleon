import { useSettingsStore } from "../store/settingsStore";

export function ThemeInjector() {
  const theme = useSettingsStore((state) => state.settings.theme);
  const customCss = useSettingsStore((state) => state.settings.customCss);

  if (theme !== "custom" || !customCss.trim()) {
    return null;
  }

  return <style>{`:root[data-theme='custom'] {\n${customCss}\n}`}</style>;
}
