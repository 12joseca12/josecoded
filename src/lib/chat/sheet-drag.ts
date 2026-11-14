export interface DragSample {
  y: number;
  t: number;
}

export const sheetDismissVelocity = 0.11;
export const sheetDismissRatio = 0.25;
export const sheetFlickSlop = 12;
const velocityWindowMs = 100;

export function sheetOffset(start: number, originY: number, y: number): number {
  return Math.max(0, start + y - originY);
}

export function releaseVelocity(samples: readonly DragSample[]): number {
  const last = samples.at(-1);
  if (!last) return 0;
  const first = samples.find((sample) => sample.t >= last.t - velocityWindowMs) ?? last;
  const elapsed = last.t - first.t;
  return elapsed > 0 ? (last.y - first.y) / elapsed : 0;
}

export function shouldDismissSheet(offset: number, velocity: number, height: number): boolean {
  if (velocity < -sheetDismissVelocity) return false;
  if (offset > height * sheetDismissRatio) return true;
  return offset >= sheetFlickSlop && velocity > sheetDismissVelocity;
}
