import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { INTRO_GATE } from '.';

function runGate(search = '') {
  window.history.replaceState(null, '', `/${search}`);
  new Function(INTRO_GATE)();
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.intro;
});

it('is small enough to inline in the head (under 400 bytes)', () => {
  expect(new TextEncoder().encode(INTRO_GATE).length).toBeLessThanOrEqual(400);
});

it('marks the first visit of the session as pending and remembers it', () => {
  runGate();
  expect(document.documentElement.dataset.intro).toBe('pending');
  expect(sessionStorage.getItem('intro_seen')).toBe('1');
});

it('does not mark the second visit', () => {
  runGate();
  delete document.documentElement.dataset.intro;
  runGate();
  expect(document.documentElement.dataset.intro).toBeUndefined();
});

it('?intro forces it again; ?nointro skips it even on a first visit', () => {
  sessionStorage.setItem('intro_seen', '1');
  runGate('?intro');
  expect(document.documentElement.dataset.intro).toBe('pending');
  delete document.documentElement.dataset.intro;
  sessionStorage.clear();
  runGate('?nointro');
  expect(document.documentElement.dataset.intro).toBeUndefined();
});

it('does not mark it under reduced motion, but still writes intro_seen', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
  runGate();
  expect(document.documentElement.dataset.intro).toBeUndefined();
  expect(sessionStorage.getItem('intro_seen')).toBe('1');
});

it('gives the letters back after 2.5 s if the page script never arrives, but not once armed', () => {
  runGate();
  vi.advanceTimersByTime(2500);
  expect(document.documentElement.dataset.intro).toBeUndefined();
  runGate('?intro');
  document.documentElement.dataset.intro = 'armed';
  vi.advanceTimersByTime(2500);
  expect(document.documentElement.dataset.intro).toBe('armed');
});

it('never throws when storage is blocked', () => {
  vi.stubGlobal('sessionStorage', {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });
  expect(() => runGate()).not.toThrow();
  expect(document.documentElement.dataset.intro).toBeUndefined();
});
