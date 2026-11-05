export const timelineKeys = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
] as const;

export type TimelineKey = (typeof timelineKeys)[number];

export function isTimelineKey(key: string): key is TimelineKey {
  return (timelineKeys as readonly string[]).includes(key);
}

export function nextPhaseIndex(key: TimelineKey, current: number, count: number): number {
  const last = count - 1;
  if (key === "Home") return 0;
  if (key === "End") return last;
  const step = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
  return (current + step + count) % count;
}

export function progressOf(current: number, count: number): number {
  return count <= 1 ? 0 : current / (count - 1);
}
