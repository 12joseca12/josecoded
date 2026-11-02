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

/**
 * The video is decorative and 0.5 MB: on a phone it must not compete with the poster, and once it paints
 * its first frame it would replace the poster as the LCP candidate. So it waits for the page `load` and then
 * for the first input (a candidate stops at the first input anyway) or this long, whichever comes first.
 */
export const VIDEO_START_DELAY_MS = 4000;

const INTENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;

/** Resolves after `load` plus the first input or `delayMs`; `signal` ends the wait early (the caller checks it). */
export function afterLoadAndIntent(
  signal: AbortSignal,
  delayMs: number = VIDEO_START_DELAY_MS,
): Promise<void> {
  return new Promise((resolve) => {
    const stop = new AbortController();
    const done = () => {
      stop.abort();
      resolve();
    };
    signal.addEventListener('abort', done, { once: true, signal: stop.signal });
    const armed = () => {
      const timer = setTimeout(done, delayMs);
      stop.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
      for (const type of INTENT_EVENTS) {
        window.addEventListener(type, done, { once: true, passive: true, signal: stop.signal });
      }
    };
    if (document.readyState === 'complete') armed();
    else window.addEventListener('load', armed, { once: true, signal: stop.signal });
  });
}
