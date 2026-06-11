import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  useWorkspaceStore,
  type WorkspaceLeaf,
} from "../../store/workspaceStore";
import { TabLeafIcon } from "./tabLeafIcon";

interface TabItemProps {
  leaf: WorkspaceLeaf;
  isActive: boolean;
  canClose: boolean;
}

export function TabItem({ leaf, isActive, canClose }: TabItemProps) {
  const activateLeaf = useWorkspaceStore((s) => s.activateLeaf);
  const closeLeaf = useWorkspaceStore((s) => s.closeLeaf);
  const closeOtherLeaves = useWorkspaceStore((s) => s.closeOtherLeaves);
  const closeLeavesToLeft = useWorkspaceStore((s) => s.closeLeavesToLeft);
  const closeLeavesToRight = useWorkspaceStore((s) => s.closeLeavesToRight);
  const toggleLeafPin = useWorkspaceStore((s) => s.toggleLeafPin);
  const leafOrder = useWorkspaceStore((s) => s.leafOrder);
  const leaves = useWorkspaceStore((s) => s.leaves);

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const leafIndex = leafOrder.indexOf(leaf.id);
  const canCloseOthers = leafOrder.some(
    (id) => id !== leaf.id && !leaves[id]?.pinned,
  );
  const canCloseLeft = leafOrder
    .slice(0, leafIndex)
    .some((id) => !leaves[id]?.pinned);
  const canCloseRight = leafOrder
    .slice(leafIndex + 1)
    .some((id) => !leaves[id]?.pinned);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: leaf.id });

  const closeMenu = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu, closeMenu]);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  };

  const handlePinToggle = () => {
    toggleLeafPin(leaf.id);
    closeMenu();
  };

  const handleCloseOthers = () => {
    closeOtherLeaves(leaf.id);
    closeMenu();
  };

  const handleCloseLeft = () => {
    closeLeavesToLeft(leaf.id);
    closeMenu();
  };

  const handleCloseRight = () => {
    closeLeavesToRight(leaf.id);
    closeMenu();
  };

  const contextMenu = menu ? (
    <TabContextMenu
      ref={menuRef}
      x={menu.x}
      y={menu.y}
      pinned={Boolean(leaf.pinned)}
      canCloseOthers={canCloseOthers}
      canCloseLeft={canCloseLeft}
      canCloseRight={canCloseRight}
      onToggle={handlePinToggle}
      onCloseOthers={handleCloseOthers}
      onCloseLeft={handleCloseLeft}
      onCloseRight={handleCloseRight}
    />
  ) : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const surfaceClass = isActive
    ? "bg-surface-tab-active text-text-emphasis"
    : "bg-surface-tab-inactive text-text-muted hover:bg-interactive-hover";

  if (leaf.pinned) {
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          className={`group flex h-tab-bar w-10 shrink-0 items-center justify-center border-r border-border ${surfaceClass}`}
          onContextMenu={handleContextMenu}
          {...attributes}
          {...listeners}
        >
          <button
            type="button"
            onClick={() => activateLeaf(leaf.id)}
            className="flex h-full w-full items-center justify-center"
            title={leaf.title}
            aria-label={leaf.title}
          >
            <TabLeafIcon type={leaf.type} />
          </button>
        </div>
        {contextMenu}
      </>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex h-tab-bar max-w-[200px] shrink-0 items-center border-r border-border ${surfaceClass}`}
        onContextMenu={handleContextMenu}
        {...attributes}
        {...listeners}
      >
        <button
          type="button"
          onClick={() => activateLeaf(leaf.id)}
          className="flex min-w-0 flex-1 items-center gap-2 truncate px-2 py-2 text-left text-sm"
          title={leaf.title}
        >
          <TabLeafIcon type={leaf.type} />
          <span className="truncate">{leaf.title}</span>
        </button>
        {canClose && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeLeaf(leaf.id);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="mr-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-interactive-active"
            aria-label={`Close ${leaf.title}`}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {contextMenu}
    </>
  );
}

const TabContextMenu = forwardRef<
  HTMLDivElement,
  {
    x: number;
    y: number;
    pinned: boolean;
    canCloseOthers: boolean;
    canCloseLeft: boolean;
    canCloseRight: boolean;
    onToggle: () => void;
    onCloseOthers: () => void;
    onCloseLeft: () => void;
    onCloseRight: () => void;
  }
>(function TabContextMenu(
  {
    x,
    y,
    pinned,
    canCloseOthers,
    canCloseLeft,
    canCloseRight,
    onToggle,
    onCloseOthers,
    onCloseLeft,
    onCloseRight,
  },
  ref,
) {
  const itemClass =
    "w-full px-3 py-1.5 text-left text-sm text-text-normal hover:bg-interactive-hover disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-[180px] rounded border border-border bg-surface-modal py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onToggle}
        className={itemClass}
      >
        {pinned ? "Unpin tab" : "Pin tab"}
      </button>
      <div className="my-1 border-t border-border" role="separator" />
      <button
        type="button"
        role="menuitem"
        disabled={!canCloseOthers}
        onClick={onCloseOthers}
        className={itemClass}
      >
        Close other tabs
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={!canCloseLeft}
        onClick={onCloseLeft}
        className={itemClass}
      >
        Close tabs to the left
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={!canCloseRight}
        onClick={onCloseRight}
        className={itemClass}
      >
        Close tabs to the right
      </button>
    </div>
  );
});
