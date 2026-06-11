import { useToastStore } from "../store/toastStore";

export function XpToast() {
  const message = useToastStore((s) => s.message);

  if (!message) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50"
      style={{ transform: "translateX(-50%)" }}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full border border-border bg-surface-ribbon px-4 py-2 text-sm font-semibold text-accent shadow-lg">
        {message}
      </div>
    </div>
  );
}
