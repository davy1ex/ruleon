import type { ReactNode } from "react";

interface RibbonButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  isActive?: boolean;
  badge?: number;
}

export function RibbonButton({
  label,
  onClick,
  children,
  isActive,
  badge,
}: RibbonButtonProps) {
  const showBadge = badge != null && badge > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={showBadge ? `${label} (${badge} items)` : label}
      className={`relative flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        isActive
          ? "bg-accent-muted text-accent"
          : "text-text-muted hover:bg-interactive-hover hover:text-text-normal"
      }`}
    >
      {children}
      {showBadge ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}
