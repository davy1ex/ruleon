import { useEffect } from "react";
import { useOutlinerStore } from "../store/outlinerStore";
import { useWorkspaceStore } from "../store/workspaceStore";

function closeTabOrPalette(): void {
  const state = useWorkspaceStore.getState();
  const outliner = useOutlinerStore.getState();
  if (outliner.moveTargetNodeId != null) {
    outliner.closeMoveTarget();
    return;
  }
  if (state.commandPaletteOpen) {
    state.toggleCommandPalette(false);
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
  const toggleCommandPalette = useWorkspaceStore((s) => s.toggleCommandPalette);
  const openSearchTab = useWorkspaceStore((s) => s.openSearchTab);
  const commandPaletteOpen = useWorkspaceStore((s) => s.commandPaletteOpen);
  const moveTargetNodeId = useOutlinerStore((s) => s.moveTargetNodeId);
  const closeMoveTarget = useOutlinerStore((s) => s.closeMoveTarget);

  useEffect(() => {
    const disposeElectron = window.electronAPI?.onCloseTabShortcut(() => {
      closeTabOrPalette();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (moveTargetNodeId != null) {
          event.preventDefault();
          closeMoveTarget();
          return;
        }
        if (commandPaletteOpen) {
          event.preventDefault();
          toggleCommandPalette(false);
          return;
        }
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
        toggleCommandPalette(true);
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
    closeMoveTarget,
    commandPaletteOpen,
    moveTargetNodeId,
    openSearchTab,
    toggleCommandPalette,
  ]);
}
