import { create } from "zustand";

interface ToastState {
  message: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,

  showToast: (message) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    set({ message });
    hideTimer = setTimeout(() => {
      hideTimer = null;
      set({ message: null });
    }, 2500);
  },

  clearToast: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ message: null });
  },
}));

export function showXpToast(amount: number): void {
  const label = amount > 0 ? `+${amount} XP` : `${amount} XP`;
  useToastStore.getState().showToast(label);
}

export function showPurchaseToast(title: string): void {
  useToastStore.getState().showToast(`Purchased: ${title}! Enjoy.`);
}
