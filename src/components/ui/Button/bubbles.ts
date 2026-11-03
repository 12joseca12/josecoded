export interface Bubble {
  dx: number;
  dy: number;
  size: number;
}

export const bubbleLimits = {
  countMin: 5,
  countMax: 7,
  sizeMin: 0.25,
  sizeMax: 0.375,
  distanceMin: 1,
  distanceMax: 1.75,
} as const;

const maxLiveBubbles = 24;
const cleanupFallbackMs = 1000;

const between = (min: number, max: number, amount: number) => min + (max - min) * amount;
const round = (value: number) => Math.round(value * 1000) / 1000;

export function bubbleGeometry(random: () => number = Math.random): Bubble[] {
  const { countMin, countMax, sizeMin, sizeMax, distanceMin, distanceMax } = bubbleLimits;
  const count =
    countMin + Math.min(countMax - countMin, Math.floor(random() * (countMax - countMin + 1)));
  const sector = (Math.PI * 2) / count;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index + random()) * sector;
    const distance = between(distanceMin, distanceMax, random());
    return {
      dx: round(Math.cos(angle) * distance),
      dy: round(Math.sin(angle) * distance),
      size: round(between(sizeMin, sizeMax, random())),
    };
  });
}

export interface BubbleOrigin {
  x: number;
  y: number;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function spawnBubbles(burst: HTMLElement, className: string, origin: BubbleOrigin) {
  if (prefersReducedMotion() || burst.childElementCount >= maxLiveBubbles) return;
  for (const { dx, dy, size } of bubbleGeometry()) {
    const bubble = document.createElement("span");
    bubble.className = className;
    bubble.setAttribute("aria-hidden", "true");
    bubble.style.setProperty("--ox", `${origin.x}%`);
    bubble.style.setProperty("--oy", `${origin.y}%`);
    bubble.style.setProperty("--dx", `${dx}rem`);
    bubble.style.setProperty("--dy", `${dy}rem`);
    bubble.style.setProperty("--size", `${size}rem`);
    const remove = () => {
      bubble.remove();
    };
    bubble.addEventListener("animationend", remove, { once: true });
    setTimeout(remove, cleanupFallbackMs);
    burst.append(bubble);
  }
}
