export interface DragSample {
  y: number;
  t: number;
}

export const sheetDismissVelocity = 0.11;
export const sheetDismissRatio = 0.25;
export const sheetFlickSlop = 12;
export const sheetStretchLimit = 14;
export const sheetExitMinVelocity = 1.2;
const velocityWindowMs = 100;

export function sheetOffset(start: number, originY: number, y: number): number {
  const raw = start + y - originY;
  if (raw >= 0) return raw;
  return -sheetStretchLimit * (1 - Math.exp(raw / (sheetStretchLimit * 2)));
}

export function releaseVelocity(samples: readonly DragSample[]): number {
  const last = samples.at(-1);
  if (!last) return 0;
  const first = samples.find((sample) => sample.t >= last.t - velocityWindowMs) ?? last;
  const elapsed = last.t - first.t;
  return elapsed > 0 ? (last.y - first.y) / elapsed : 0;
}

export function shouldDismissSheet(travel: number, velocity: number, height: number): boolean {
  if (velocity < -sheetDismissVelocity) return false;
  if (travel > height * sheetDismissRatio) return true;
  return travel >= sheetFlickSlop && velocity > sheetDismissVelocity;
}

export interface ExitBounds {
  min: number;
  max: number;
}

export function sheetExitDuration(
  remaining: number,
  velocity: number,
  { min, max }: ExitBounds,
): number {
  const speed = Math.max(Math.abs(velocity), sheetExitMinVelocity);
  return Math.min(max, Math.max(min, Math.max(0, remaining) / speed));
}
