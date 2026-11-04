export interface Signal {
  emit: () => boolean;
  subscribe: (listener: () => void) => () => void;
  hasListeners: () => boolean;
}

export function createSignal(): Signal {
  const listeners = new Set<() => void>();
  return {
    emit() {
      if (listeners.size === 0) return false;
      for (const listener of [...listeners]) listener();
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hasListeners: () => listeners.size > 0,
  };
}
