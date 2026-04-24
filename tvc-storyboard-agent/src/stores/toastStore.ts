import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  timeoutMs: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind, timeoutMs?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (message, kind = 'info', timeoutMs = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, kind, message, timeoutMs }] }));
    if (timeoutMs > 0) {
      setTimeout(() => {
        if (get().toasts.some((t) => t.id === id)) {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }
      }, timeoutMs);
    }
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** 便捷调用：不需要 hook 订阅的地方直接用。 */
export const toast = {
  info: (msg: string, ms?: number) =>
    useToastStore.getState().push(msg, 'info', ms),
  success: (msg: string, ms?: number) =>
    useToastStore.getState().push(msg, 'success', ms),
  error: (msg: string, ms = 6000) =>
    useToastStore.getState().push(msg, 'error', ms),
  warning: (msg: string, ms?: number) =>
    useToastStore.getState().push(msg, 'warning', ms),
};
