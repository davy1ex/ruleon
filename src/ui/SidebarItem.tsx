interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const SidebarItem = ({
  icon,
  label,
  isActive,
  onClick,
}: SidebarItemProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    className={`
      group mx-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 transition-all
      ${isActive ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-interactive-hover hover:text-text-normal"}
    `}
  >
    <span className="opacity-70 group-hover:opacity-100">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </div>
);
