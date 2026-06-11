import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";

export function MobileSettingsShell({
  title,
  onClose,
  onBack,
  children,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-secondary">
      <header className="relative flex h-12 shrink-0 items-center justify-center border-b border-border/60 px-12">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-primary text-text-normal shadow-sm"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}
        <h2 className="text-base font-semibold text-text-emphasis">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-primary text-text-normal shadow-sm"
          aria-label="Close settings"
        >
          <X size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}

export function MobileSettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 px-1 text-xs font-semibold text-text-muted">
        {title}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface-primary shadow-sm">
        {children}
      </div>
    </section>
  );
}

export function MobileSettingsNavRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3.5 text-left last:border-b-0 hover:bg-interactive-hover"
    >
      <Icon size={20} className="shrink-0 text-text-muted" />
      <span className="min-w-0 flex-1 text-sm font-medium text-text-normal">
        {label}
      </span>
      <ChevronRight size={18} className="shrink-0 text-text-muted" />
    </button>
  );
}

export function MobileSettingsToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-normal">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-interactive-active"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface-primary shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function MobileSettingsField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border/50 px-4 py-3.5 last:border-b-0">
      <p className="text-sm font-medium text-text-normal">{label}</p>
      {description ? (
        <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}
