import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { indicatorVisibility, observeActiveSection } from './active-section';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let callback: Callback;
const observed: string[] = [];
const disconnect = vi.fn();

beforeEach(() => {
  observed.length = 0;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: Callback) {
        callback = cb;
      }
      observe(el: Element) {
        observed.push(el.id);
      }
      disconnect = disconnect;
    },
  );
  document.body.innerHTML = '<section id="a"></section><section id="b"></section>';
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('observeActiveSection', () => {
  it('observes the sections that exist and reports the one that enters the band', () => {
    const onChange = vi.fn();
    observeActiveSection(['a', 'b', 'missing', 'a'], onChange);
    expect(observed).toEqual(['a', 'b']);
    callback([
      { isIntersecting: false, target: document.getElementById('a')! },
      { isIntersecting: true, target: document.getElementById('b')! },
    ]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('stops observing on cleanup', () => {
    observeActiveSection(['a'], vi.fn())();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe('indicatorVisibility', () => {
  it('is hidden in the hero, in the tour, with an open cell, and when the margin is too narrow', () => {
    expect(indicatorVisibility({ inHero: true, inTour: false, cellOpen: false, marginRem: 4 })).toBe(false);
    expect(indicatorVisibility({ inHero: false, inTour: true, cellOpen: false, marginRem: 4 })).toBe(false);
    expect(indicatorVisibility({ inHero: false, inTour: false, cellOpen: true, marginRem: 4 })).toBe(false);
    expect(indicatorVisibility({ inHero: false, inTour: false, cellOpen: false, marginRem: 2 })).toBe(false);
    expect(indicatorVisibility({ inHero: false, inTour: false, cellOpen: false, marginRem: 4 })).toBe(true);
    expect(indicatorVisibility({ inHero: false, inTour: false, cellOpen: false, marginRem: 2.25 })).toBe(true);
  });
});
