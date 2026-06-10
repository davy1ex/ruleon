interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

export function Button({
  label,
  onClick,
  variant = "ghost",
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-accent text-text-on-accent hover:bg-accent-hover"
      : "text-text-muted hover:bg-interactive-hover";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm ${styles}`}
    >
      {label}
    </button>
  );
}
