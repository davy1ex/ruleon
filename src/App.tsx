import { useState, useEffect } from "react";
import { useOutlinerStore } from "./store/outlinerStore";
import { useSettingsStore } from "./store/settingsStore";
import { useWorkspaceStore } from "./store/workspaceStore";
import { useIsMobile } from "./hooks/useIsMobile";
import { AppLayout } from "./ui/layout/AppLayout";
import { MobileLayout } from "./ui/layout/MobileLayout";
import { MobileWorkspacePane } from "./ui/layout/MobileWorkspacePane";
import { CommandPalette } from "./ui/CommandPalette";
import { GlobalQuickAddModal } from "./ui/components/GlobalQuickAddModal";
import { MoveTargetPalette } from "./ui/MoveTargetPalette";
import { Sidebar } from "./ui/Sidebar";
import { ThemeInjector } from "./ui/ThemeInjector";
import { XpToast } from "./ui/XpToast";
import { useWorkspaceShortcuts } from "./ui/useWorkspaceShortcuts";

export default function App() {
  useWorkspaceShortcuts();
  const isMobile = useIsMobile();
  const [ready, setReady] = useState(false);
  const bootstrap = useOutlinerStore((state) => state.bootstrap);
  const theme = useSettingsStore((state) => state.settings.theme);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrate);
  const syncActiveLeafNavigation = useWorkspaceStore(
    (state) => state.syncActiveLeafNavigation,
  );

  useEffect(() => {
    useSettingsStore.getState().hydrate();
    hydrateWorkspace();
    const settings = useSettingsStore.getState().settings;
    void bootstrap(settings).then(() => {
      syncActiveLeafNavigation();
      setReady(true);
    });
  }, [bootstrap, hydrateWorkspace, syncActiveLeafNavigation]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (!ready) {
    return null;
  }

  return (
    <>
      {isMobile ? (
        <MobileLayout>
          <MobileWorkspacePane />
        </MobileLayout>
      ) : (
        <AppLayout sidebar={<Sidebar />} />
      )}
      <CommandPalette />
      <MoveTargetPalette />
      <GlobalQuickAddModal />
      <ThemeInjector />
      <XpToast />
    </>
  );
}
