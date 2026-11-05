const preloadDelayMs = 3000;

export function preloadLater(load: () => Promise<unknown>) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    void load().catch(() => undefined);
  }, preloadDelayMs);
}
