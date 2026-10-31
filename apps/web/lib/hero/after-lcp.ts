// Both live modes start after the LCP so the hero never competes with it (DT §1.6.2 step 3).

/** The LCP entry is already there by hydration; this cap covers a browser that never reports one. */
const LCP_CAP_MS = 1500;

/** Resolves once the page has a largest-contentful-paint entry, at the cap, or at once where the type is unsupported. */
export function afterLcp(capMs: number = LCP_CAP_MS): Promise<void> {
  return new Promise((resolve) => {
    let observer: PerformanceObserver | undefined;
    const timer = setTimeout(done, capMs);
    function done() {
      clearTimeout(timer);
      observer?.disconnect();
      resolve();
    }
    try {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries().length > 0) done();
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      done();
    }
  });
}

/** `requestIdleCallback` with a timer where it does not exist (Safari). */
export function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve());
    else setTimeout(resolve, 0);
  });
}
