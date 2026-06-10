import { useEffect } from "react";
import { useOutlinerStore } from "./store/outlinerStore";
import { useSettingsStore } from "./store/settingsStore";
import { useWorkspaceStore } from "./store/workspaceStore";
import { AppShell } from "./ui/AppShell";
import { CommandPalette } from "./ui/CommandPalette";
import { Sidebar } from "./ui/Sidebar";
import { ThemeInjector } from "./ui/ThemeInjector";
import { useWorkspaceShortcuts } from "./ui/useWorkspaceShortcuts";

export default function App() {
  useWorkspaceShortcuts();
  const bootstrap = useOutlinerStore((state) => state.bootstrap);
  const theme = useSettingsStore((state) => state.settings.theme);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrate);
  const syncActiveLeafNavigation = useWorkspaceStore(
    (state) => state.syncActiveLeafNavigation,
  );

  useEffect(() => {
    const settings = useSettingsStore.getState().hydrate();
    hydrateWorkspace();
    void bootstrap(settings).then(() => {
      syncActiveLeafNavigation();
    });
  }, [bootstrap, hydrateWorkspace, syncActiveLeafNavigation]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <AppShell sidebar={<Sidebar />} />
      <CommandPalette />
      <ThemeInjector />
    </>
  );
}
