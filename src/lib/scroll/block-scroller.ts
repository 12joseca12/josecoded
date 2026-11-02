import {
  computeStops,
  ease,
  glideDuration,
  isActive,
  isEligible,
  planTarget,
  type Section,
  type Stop,
  type Viewport,
} from "./blocks";

const blockSelector = "[data-block]";
const quietMs = 220;
const inertiaWindowMs = 500;
const lineHeightPx = 16;
const arrowStepPx = 40;
const pageStepRatio = 0.875;
const ignoredKeyTargets =
  'input, textarea, select, button, summary, label, [contenteditable=""], [contenteditable="true"], [role="listbox"], [role="radiogroup"], [role="slider"]';
const pageSteps: Record<string, 1 | -1> = {
  PageDown: 1,
  PageUp: -1,
  ArrowDown: 1,
  ArrowUp: -1,
};

const finePointer = "(hover: hover) and (pointer: fine)";
const reducedMotion = "(prefers-reduced-motion: reduce)";

function readViewport(): Viewport {
  return {
    width: innerWidth,
    height: innerHeight,
    finePointer: matchMedia(finePointer).matches,
    reducedMotion: matchMedia(reducedMotion).matches,
    dialogOpen: document.querySelector("dialog[open]") !== null,
  };
}

function documentTop(element: Element): number {
  return element.getBoundingClientRect().top + scrollY;
}

function scrollsInside(element: EventTarget | null, delta: number): boolean {
  const root = document.documentElement;
  let node = element instanceof Element ? element : null;
  while (node && node !== document.body && node !== root) {
    if (/auto|scroll/.test(getComputedStyle(node).overflowY)) {
      const room = node.scrollHeight - node.clientHeight;
      if (room > 1) {
        const canMove =
          delta > 0
            ? node.scrollTop + node.clientHeight < node.scrollHeight - 1
            : node.scrollTop > 0;
        if (canMove) return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

export function startBlockScroller(): () => void {
  const root = document.documentElement;
  let stops: Stop[] = [];
  let frame = 0;
  let measureFrame = 0;
  let moving = false;
  let settling = false;
  let lockedUntil = 0;
  let lastTime = 0;
  let lastAbs = 0;

  const maxScroll = () => Math.max(0, root.scrollHeight - innerHeight);

  const measure = () => {
    const found = [...document.querySelectorAll(blockSelector)].filter(
      (element) => element.getClientRects().length > 0,
    );
    const sections: Section[] = found.map((element, index) => {
      const next = found[index + 1];
      return {
        top: documentTop(element),
        end: next ? documentTop(next) : root.scrollHeight,
      };
    });
    stops = computeStops(sections, innerHeight, root.scrollHeight);
  };

  const scheduleMeasure = () => {
    cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measure);
  };

  const halt = () => {
    if (!moving) return;
    cancelAnimationFrame(frame);
    moving = false;
  };

  const glide = (to: number) => {
    cancelAnimationFrame(frame);
    const from = scrollY;
    const target = Math.round(Math.max(0, Math.min(to, maxScroll())));
    const distance = Math.abs(target - from);
    if (!isEligible(readViewport()) || distance < 2) {
      scrollTo({ top: target, behavior: "instant" });
      moving = false;
      return;
    }
    const duration = glideDuration(distance, innerHeight);
    const start = performance.now();
    moving = true;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      scrollTo({ top: from + (target - from) * ease(t), behavior: "instant" });
      if (t < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      moving = false;
      settling = true;
      lockedUntil = performance.now() + quietMs;
    };
    frame = requestAnimationFrame(tick);
  };

  const onWheel = (event: WheelEvent) => {
    if (!isActive(readViewport()) || event.ctrlKey || event.defaultPrevented) return;
    const delta =
      event.deltaMode === 1
        ? event.deltaY * lineHeightPx
        : event.deltaMode === 2
          ? event.deltaY * innerHeight
          : event.deltaY;
    if (delta === 0 || Math.abs(event.deltaX) > Math.abs(delta)) return;
    if (scrollsInside(event.target, delta)) return;
    const now = performance.now();
    const abs = Math.abs(delta);
    const inertia = settling && now - lastTime < inertiaWindowMs && abs <= lastAbs * 1.05;
    lastTime = now;
    lastAbs = abs;
    if (moving || now < lockedUntil || inertia) {
      event.preventDefault();
      if (!moving) lockedUntil = now + quietMs;
      return;
    }
    settling = false;
    const target = planTarget(stops, scrollY, delta > 0 ? 1 : -1, delta);
    if (target === null) return;
    event.preventDefault();
    glide(target);
  };

  const onKey = (event: KeyboardEvent) => {
    if (!isActive(readViewport()) || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest(ignoredKeyTargets)) return;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      glide(event.key === "Home" ? 0 : maxScroll());
      return;
    }
    const direction = event.key === " " ? (event.shiftKey ? -1 : 1) : pageSteps[event.key];
    if (direction === undefined) return;
    if (moving) {
      event.preventDefault();
      return;
    }
    const step = event.key.startsWith("Arrow") ? arrowStepPx : innerHeight * pageStepRatio;
    const target = planTarget(stops, scrollY, direction, direction * step);
    if (target === null) return;
    event.preventDefault();
    glide(target);
  };

  const resizeObserver = new ResizeObserver(scheduleMeasure);
  const pointerQuery = matchMedia(finePointer);
  resizeObserver.observe(document.body);
  addEventListener("wheel", onWheel, { passive: false });
  addEventListener("keydown", onKey);
  addEventListener("pointerdown", halt, { passive: true });
  addEventListener("resize", scheduleMeasure);
  pointerQuery.addEventListener("change", scheduleMeasure);
  measure();

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    resizeObserver.disconnect();
    removeEventListener("wheel", onWheel);
    removeEventListener("keydown", onKey);
    removeEventListener("pointerdown", halt);
    removeEventListener("resize", scheduleMeasure);
    pointerQuery.removeEventListener("change", scheduleMeasure);
  };
}
