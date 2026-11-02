import type { ToastInput, ToastItem } from "@/types/ui";

export interface ToastStoreOptions {
  maxVisible?: number;
  duration?: number;
  errorDuration?: number;
}

interface Timer {
  handle: ReturnType<typeof setTimeout> | null;
  startedAt: number;
  remaining: number;
}

export function createToastStore(options: ToastStoreOptions = {}) {
  const { maxVisible = 3, duration = 5000, errorDuration = 8000 } = options;
  let items: ToastItem[] = [];
  let nextId = 1;
  const timers = new Map<number, Timer>();
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const clear = (id: number) => {
    const timer = timers.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    timers.delete(id);
  };

  const dismiss = (id: number) => {
    if (!items.some((item) => item.id === id)) return;
    clear(id);
    items = items.filter((item) => item.id !== id);
    emit();
  };

  const arm = (id: number, remaining: number) => {
    timers.set(id, {
      handle: setTimeout(() => {
        dismiss(id);
      }, remaining),
      startedAt: Date.now(),
      remaining,
    });
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => items,
    push: (input: ToastInput) => {
      const id = nextId++;
      items = [...items, { id, ...input }];
      while (items.length > maxVisible) {
        const [oldest, ...rest] = items;
        if (oldest) clear(oldest.id);
        items = rest;
      }
      arm(id, input.tone === "error" ? errorDuration : duration);
      emit();
      return id;
    },
    dismiss,
    pause: (id: number) => {
      const timer = timers.get(id);
      if (!timer?.handle) return;
      clearTimeout(timer.handle);
      timers.set(id, {
        handle: null,
        startedAt: timer.startedAt,
        remaining: timer.remaining - (Date.now() - timer.startedAt),
      });
    },
    resume: (id: number) => {
      const timer = timers.get(id);
      if (!timer || timer.handle) return;
      arm(id, Math.max(timer.remaining, 0));
    },
  };
}

export type ToastStore = ReturnType<typeof createToastStore>;
