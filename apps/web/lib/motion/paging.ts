import { readToken } from '@/styles/tokens';

/** A scene as the pager sees it: where it starts in the document and how tall it is. */
export interface PagedScene {
  top: number;
  height: number;
  /** The pinned tour: one scroll position per card, replacing the scene's own stops. */
  cards?: readonly number[];
}

/**
 * Every position the pager can stop at: the start of each scene, an extra stop every `step` of the
 * viewport height inside a scene taller than the viewport (so a tall scene is read in parts), and
 * one per card in the pinned tour. Sorted and without repeats; the caller clamps to the scroll range.
 */
export function stops(scenes: readonly PagedScene[], viewport: number, step: number): number[] {
  const out = new Set<number>();
  for (const scene of scenes) {
    if (scene.cards) {
      for (const y of scene.cards) out.add(y);
      continue;
    }
    out.add(scene.top);
    if (scene.height - viewport > 8) {
      for (let y = viewport * step; y < scene.height; y += viewport * step) out.add(scene.top + y);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** The next stop below (`dir` 1) or above (-1) `y`; `y` itself, within 4 px, does not count. */
export function nextStop(list: readonly number[], y: number, dir: 1 | -1): number | undefined {
  return dir > 0 ? list.find((value) => value > y + 4) : [...list].reverse().find((value) => value < y - 4);
}

const KEY_STEP: Record<string, 1 | -1> = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };

/**
 * Whether the pager takes a key press. Space and the arrows belong to the controls (a field, a
 * radio group, a tab, a link or button for Space); modified keys belong to the browser.
 */
export function shouldHandleKey(event: KeyboardEvent, target: Element | null): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (!(event.key in KEY_STEP) && event.key !== ' ' && event.key !== 'Home' && event.key !== 'End') return false;
  const element = target ?? document.body;
  if (element.closest('input, textarea, select, [contenteditable], [role=tab]')) return false;
  if (event.key === ' ' && element.closest('a, button, [tabindex]:not([tabindex="-1"])')) return false;
  return true;
}

/** Direction a handled key goes: Space goes down, Shift+Space up, Home and End are absolute. */
export function keyDirection(event: KeyboardEvent): 1 | -1 | 'home' | 'end' | null {
  if (event.key === 'Home') return 'home';
  if (event.key === 'End') return 'end';
  if (event.key === ' ') return event.shiftKey ? -1 : 1;
  return KEY_STEP[event.key] ?? null;
}

/** Strong ease-in-out (quartic): the deliberate move between scenes. */
export const ease = (t: number): number => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

function ms(name: '--glide-min' | '--glide-max' | '--wheel-lock'): number {
  const value = Number.parseFloat(readToken(name));
  return readToken(name).endsWith('ms') ? value : value * 1000;
}

let running: { raf: number; to: number } | null = null;

/** Where the running glide is heading, if any. */
export const glideTarget = (): number | null => running?.to ?? null;

/**
 * Scrolls to `to` in a deliberate glide (`--glide-min` to `--glide-max`, longer for longer
 * distances), interruptible: starting another one, or any `cancelGlide`, takes over from where it
 * is. With reduced motion it jumps.
 */
export function glideTo(to: number): void {
  cancelGlide();
  const from = scrollY;
  const distance = to - from;
  if (Math.abs(distance) < 2) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scrollTo(0, to);
    return;
  }
  const duration = Math.min(ms('--glide-max'), ms('--glide-min') + Math.abs(distance) * Number.parseFloat(readToken('--glide-rate')));
  const start = performance.now();
  const state = { raf: 0, to };
  running = state;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    scrollTo(0, from + distance * ease(t));
    if (t < 1) state.raf = requestAnimationFrame(step);
    else if (running === state) running = null;
  };
  state.raf = requestAnimationFrame(step);
}

export function cancelGlide(): void {
  if (running) cancelAnimationFrame(running.raf);
  running = null;
}

export interface PagedScrollOptions {
  /** Called on every gesture: true while a layer (menu, palette, cell) wants the wheel and keys. */
  blocked: () => boolean;
  /** Reads the scenes, fresh each time (their heights change with the viewport). */
  scenes: () => readonly PagedScene[];
  /** Stop spacing as a fraction of the viewport height (0.85). */
  step: number;
}

/**
 * One gesture is one scene (home-v7 README §10, base `v7.js`): the wheel with a threshold and a
 * lock against trackpad inertia, ↑ ↓ PageUp PageDown Space, Home and End. The wheel is only taken
 * where paging is on (fine pointer, no reduced motion); the caller decides that and calls the
 * returned function to stop. Esc, a field and an open layer keep their own keys and wheel.
 */
export function createPagedScroll({ blocked, scenes, step }: PagedScrollOptions): () => void {
  const threshold = Number.parseFloat(readToken('--wheel-threshold'));
  const lock = ms('--wheel-lock');
  let lockUntil = 0;
  let accumulated = 0;
  let lastWheel = 0;

  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  const stopList = () => stops(scenes(), innerHeight, step).map((y) => Math.round(Math.min(y, maxScroll())));
  const page = (dir: 1 | -1) => {
    const next = nextStop(stopList(), glideTarget() ?? scrollY, dir);
    if (next !== undefined) glideTo(next);
  };

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || blocked()) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 220) accumulated = 0; // a new gesture
    lastWheel = now;
    accumulated += event.deltaY;
    if (now < lockUntil) return; // trackpad inertia of the previous gesture
    if (Math.abs(accumulated) > threshold) {
      page(accumulated > 0 ? 1 : -1);
      accumulated = 0;
      lockUntil = now + lock;
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (blocked() || !shouldHandleKey(event, event.target instanceof Element ? event.target : null)) return;
    const direction = keyDirection(event);
    if (direction === null) return;
    event.preventDefault();
    if (direction === 'home') glideTo(0);
    else if (direction === 'end') glideTo(maxScroll());
    else page(direction);
  };
  // internal links slide too
  const onClick = (event: MouseEvent) => {
    if (blocked() || event.defaultPrevented || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = anchor?.getAttribute('href');
    if (!anchor || !hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    glideTo(target.getBoundingClientRect().top + scrollY);
  };

  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('keydown', onKeyDown);
  document.addEventListener('click', onClick);
  return () => {
    removeEventListener('wheel', onWheel);
    removeEventListener('keydown', onKeyDown);
    document.removeEventListener('click', onClick);
    cancelGlide();
  };
}
