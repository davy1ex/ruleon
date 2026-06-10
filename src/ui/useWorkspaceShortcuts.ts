import { useEffect } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";

function closeTabOrPalette(): void {
  const state = useWorkspaceStore.getState();
  if (state.commandPaletteOpen) {
    state.setCommandPaletteOpen(false);
    return;
  }
  if (state.leafOrder.length > 1 && state.activeLeafId) {
    state.closeLeaf(state.activeLeafId);
  }
}

function activateAdjacentLeaf(direction: 1 | -1): void {
  const { leafOrder, activeLeafId, activateLeaf } = useWorkspaceStore.getState();
  if (leafOrder.length <= 1 || !activeLeafId) {
    return;
  }

  const currentIndex = leafOrder.indexOf(activeLeafId);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex =
    (currentIndex + direction + leafOrder.length) % leafOrder.length;
  const nextId = leafOrder[nextIndex];
  if (nextId) {
    activateLeaf(nextId);
  }
}

export function useWorkspaceShortcuts(): void {
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const openSearchTab = useWorkspaceStore((s) => s.openSearchTab);
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    const disposeElectron = window.electronAPI?.onCloseTabShortcut(() => {
      closeTabOrPalette();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && commandPaletteOpen) {
        event.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }

      if (event.ctrlKey && !event.altKey && event.code === "Tab") {
        event.preventDefault();
        activateAdjacentLeaf(event.shiftKey ? -1 : 1);
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.shiftKey || event.altKey) {
        return;
      }

      if (event.code === "KeyK") {
        event.preventDefault();
        openCommandPalette();
        return;
      }

      if (event.code === "KeyT") {
        event.preventDefault();
        openSearchTab();
        return;
      }

      if (event.code === "KeyW") {
        event.preventDefault();
        closeTabOrPalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      disposeElectron?.();
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [
    commandPaletteOpen,
    openCommandPalette,
    openSearchTab,
    setCommandPaletteOpen,
  ]);
}
