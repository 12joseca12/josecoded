export interface Stop {
  y: number;
  inside: boolean;
}

export interface Section {
  top: number;
  end: number;
}

export interface Viewport {
  width: number;
  height: number;
  finePointer: boolean;
  reducedMotion: boolean;
  dialogOpen: boolean;
}

export const minWidth = 1024;
export const minHeight = 600;
const mergeRatio = 0.12;
const tallRatio = 1.08;

export function isEligible(viewport: Viewport): boolean {
  return (
    viewport.finePointer &&
    !viewport.reducedMotion &&
    viewport.width >= minWidth &&
    viewport.height >= minHeight
  );
}

export function isActive(viewport: Viewport): boolean {
  return isEligible(viewport) && !viewport.dialogOpen;
}

export function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function glideDuration(distance: number, viewportHeight: number): number {
  if (distance < viewportHeight * 0.35) return 300;
  return Math.min(1100, 640 + 160 * (distance / viewportHeight));
}

export function computeStops(
  sections: readonly Section[],
  viewportHeight: number,
  documentHeight: number,
): Stop[] {
  const max = Math.max(0, documentHeight - viewportHeight);
  const raw: Stop[] = [];
  for (const { top, end } of sections) {
    if (end - top > viewportHeight * tallRatio) {
      raw.push({ y: Math.min(top, max), inside: true });
      raw.push({ y: Math.min(end - viewportHeight, max), inside: false });
    } else {
      raw.push({ y: Math.min(top, max), inside: false });
    }
  }
  raw.push({ y: max, inside: false });
  raw.sort((a, b) => a.y - b.y);

  const stops: Stop[] = [];
  for (const stop of raw) {
    const last = stops.at(-1);
    if (last && stop.y - last.y < viewportHeight * mergeRatio) {
      if (last.y > 0) stops[stops.length - 1] = { y: stop.y, inside: stop.inside };
    } else {
      stops.push({ y: Math.round(stop.y), inside: stop.inside });
    }
  }
  return stops;
}

export function planTarget(
  stops: readonly Stop[],
  scrollY: number,
  direction: 1 | -1,
  delta: number,
): number | null {
  if (direction > 0) {
    const index = stops.findLastIndex((stop) => stop.y <= scrollY + 1);
    const next = stops[index + 1];
    if (!next) return null;
    if (stops[index]?.inside) return scrollY + delta >= next.y - 1 ? next.y : null;
    return next.y;
  }
  const index = stops.findLastIndex((stop) => stop.y < scrollY - 1);
  const above = stops[index];
  if (!above) return null;
  if (above.inside) return scrollY + delta <= above.y + 1 ? above.y : null;
  return above.y;
}

export function scrollProgress(scrollY: number, viewportHeight: number, documentHeight: number) {
  const max = documentHeight - viewportHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / max));
}
