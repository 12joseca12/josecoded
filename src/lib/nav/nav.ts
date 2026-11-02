export const homeSlug = "";

const scrolledAfter = 8;
const condensedRatio = 0.3;
const probeRatio = 0.45;
const bottomTolerance = 4;
const ringInset = 1;

export interface BlockBounds {
  id: string;
  top: number;
  bottom: number;
}

export function stripLocale(pathname: string): string {
  return pathname.split("/").filter(Boolean).slice(1).join("/");
}

export function resolveActive(
  slugs: readonly string[],
  pathname: string,
  sectionId: string | null,
): string | null {
  const rest = stripLocale(pathname);
  if (rest === "") return sectionId !== null && slugs.includes(sectionId) ? sectionId : homeSlug;
  const first = rest.split("/")[0] ?? "";
  return slugs.includes(first) ? first : null;
}

export function navFlags(scrollY: number, viewportHeight: number) {
  return {
    scrolled: scrollY > scrolledAfter,
    condensed: scrollY > viewportHeight * condensedRatio,
  };
}

export function probeLine(viewportHeight: number): number {
  return viewportHeight * probeRatio;
}

export function atBottom(scrollY: number, viewportHeight: number, documentHeight: number): boolean {
  const max = documentHeight - viewportHeight;
  return max > 0 && max - scrollY < bottomTolerance;
}

export function activeBlockId(
  blocks: readonly BlockBounds[],
  line: number,
  bottomReached: boolean,
): string | null {
  if (blocks.length === 0) return null;
  if (bottomReached) return blocks[blocks.length - 1]?.id ?? null;
  return blocks.find((block) => block.top <= line && line < block.bottom)?.id ?? null;
}

export function ringPath(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "";
  const radius = height / 2 - ringInset;
  const left = ringInset;
  const right = width - ringInset;
  const top = ringInset;
  const bottom = height - ringInset;
  const f = (value: number) => value.toFixed(2);
  const arc = (x: number, y: number) => `A${f(radius)} ${f(radius)} 0 0 1 ${f(x)} ${f(y)}`;
  return [
    `M${f(width / 2)} ${f(top)}`,
    `H${f(right - radius)}`,
    arc(right, top + radius),
    arc(right - radius, bottom),
    `H${f(left + radius)}`,
    arc(left, top + radius),
    arc(left + radius, top),
    "Z",
  ].join("");
}

export function ringDashOffset(progress: number): number {
  return 1 - Math.min(1, Math.max(0, progress));
}
