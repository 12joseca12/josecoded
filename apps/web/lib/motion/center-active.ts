export interface CardBox {
  left: number;
  width: number;
}

/** Index of the card whose centre is closest to `center` (the middle of the viewport). */
export function pickCenterActive(cards: readonly CardBox[], center: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    const distance = Math.abs(card.left + card.width / 2 - center);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/**
 * Tells which card of the projects tour is in focus: on every scroll frame (one `rAF` at most) and
 * on resize it measures the cards, which move with the pinned track, and reports the index when it
 * changes. `cards()` is read each time so a card that mounts later is counted. Returns the function
 * that stops listening. Port of the `IntersectionObserver` band of `v7.js`, without the band.
 */
export function observeCenterActive(cards: () => readonly HTMLElement[], onChange: (index: number) => void): () => void {
  let frame = 0;
  let last = -1;
  const measure = () => {
    frame = 0;
    const boxes = cards().map((card) => {
      const { left, width } = card.getBoundingClientRect();
      return { left, width };
    });
    if (boxes.length === 0) return;
    const index = pickCenterActive(boxes, innerWidth / 2);
    if (index !== last) {
      last = index;
      onChange(index);
    }
  };
  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(measure);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  measure();
  return () => {
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    cancelAnimationFrame(frame);
  };
}
