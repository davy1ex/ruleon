import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  storageKey: string;
  icon?: ReactNode;
}

function readStoredOpen(storageKey: string, defaultOpen: boolean): boolean {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) {
      return defaultOpen;
    }
    return stored === "true";
  } catch {
    return defaultOpen;
  }
}

export function SidebarSection({
  title,
  children,
  defaultOpen = true,
  storageKey,
  icon,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(() =>
    readStoredOpen(storageKey, defaultOpen),
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(isOpen));
    } catch {
      // Ignore storage failures in private browsing or restricted contexts.
    }
  }, [isOpen, storageKey]);

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-text-normal"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {isOpen && <div className="mt-1 flex flex-col space-y-0.5">{children}</div>}
    </section>
  );
}
