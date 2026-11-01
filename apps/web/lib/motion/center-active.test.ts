import { expect, it, vi } from 'vitest';

import { observeCenterActive, pickCenterActive } from './center-active';

it('picks the card whose center is closest to the viewport center', () => {
  const cards = [{ left: 0, width: 400 }, { left: 500, width: 400 }, { left: 1000, width: 400 }];
  expect(pickCenterActive(cards, 720)).toBe(1);
  expect(pickCenterActive(cards, 100)).toBe(0);
  expect(pickCenterActive(cards, 5000)).toBe(2);
  expect(pickCenterActive([], 0)).toBe(0);
});

it('reports the first card at once and again only when the focus moves', () => {
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => {
    fn();
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  const make = (left: number) => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left, width: 400 }) as DOMRect;
    return el;
  };
  vi.stubGlobal('innerWidth', 1000);
  const cards = [make(300), make(800)];
  const seen: number[] = [];
  const stop = observeCenterActive(() => cards, (index) => seen.push(index));
  expect(seen).toEqual([0]);
  cards[0]!.getBoundingClientRect = () => ({ left: -200, width: 400 }) as DOMRect;
  cards[1]!.getBoundingClientRect = () => ({ left: 300, width: 400 }) as DOMRect;
  dispatchEvent(new Event('scroll'));
  dispatchEvent(new Event('scroll'));
  expect(seen).toEqual([0, 1]);
  stop();
  vi.unstubAllGlobals();
});
