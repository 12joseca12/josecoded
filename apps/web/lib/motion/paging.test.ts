import { describe, expect, it, vi } from 'vitest';

import { createPagedScroll, ease, keyDirection, nextStop, shouldHandleKey, stops } from './paging';

describe('stops', () => {
  it('adds intermediate stops every 85 % of viewport in tall scenes and one per card in the tour', () => {
    const s = stops(
      [{ top: 0, height: 800 }, { top: 800, height: 2000 }, { top: 2800, height: 3360, cards: [2800, 3560, 4320, 5080] }],
      800,
      0.85,
    );
    expect(s.slice(0, 4)).toEqual([0, 800, 1480, 2160]);
    expect(s).toContain(3560);
    expect(s).not.toContain(2800 + 680); // the tour has its cards, not intermediate stops
  });

  it('does not split a scene that fits the viewport', () => {
    expect(stops([{ top: 0, height: 800 }, { top: 800, height: 804 }], 800, 0.85)).toEqual([0, 800]);
  });
});

describe('nextStop and keys', () => {
  it('goes to the next/previous stop and ignores keys inside controls', () => {
    expect(nextStop([0, 800, 1600], 850, 1)).toBe(1600);
    expect(nextStop([0, 800, 1600], 850, -1)).toBe(800);
    expect(nextStop([0, 800, 1600], 1600, 1)).toBeUndefined();
    expect(nextStop([0, 800, 1600], 802, -1)).toBe(0); // within 4 px counts as being there
    const input = document.createElement('input');
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: ' ' }), input)).toBe(false);
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }), input)).toBe(false);
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'PageDown' }), document.body)).toBe(true);
  });

  it('leaves Space to links and buttons, modified keys to the browser and other keys alone', () => {
    const button = document.createElement('button');
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: ' ' }), button)).toBe(false);
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }), button)).toBe(true);
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'ArrowDown', metaKey: true }), document.body)).toBe(false);
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'a' }), document.body)).toBe(false);
    const tab = document.createElement('div');
    tab.setAttribute('role', 'tab');
    expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }), tab)).toBe(false);
  });

  it('maps keys to directions', () => {
    expect(keyDirection(new KeyboardEvent('keydown', { key: ' ' }))).toBe(1);
    expect(keyDirection(new KeyboardEvent('keydown', { key: ' ', shiftKey: true }))).toBe(-1);
    expect(keyDirection(new KeyboardEvent('keydown', { key: 'PageUp' }))).toBe(-1);
    expect(keyDirection(new KeyboardEvent('keydown', { key: 'Home' }))).toBe('home');
    expect(keyDirection(new KeyboardEvent('keydown', { key: 'End' }))).toBe('end');
  });
});

it('eases from 0 to 1 and is symmetric around the middle', () => {
  expect(ease(0)).toBe(0);
  expect(ease(1)).toBe(1);
  expect(ease(0.5)).toBeCloseTo(0.5);
  expect(ease(0.25) + ease(0.75)).toBeCloseTo(1);
});

describe('internal links', () => {
  it('slides to a scene but leaves the skip link and other anchors to the browser', () => {
    document.body.innerHTML = '<a id="skip" href="#main">skip</a><a id="go" href="#two">two</a><main id="main"><section id="one"></section><section id="two"></section></main>';
    vi.stubGlobal('scrollTo', vi.fn());
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const stop = createPagedScroll({ blocked: () => false, scenes: () => [], step: 0.85 });
    const click = (id: string) => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      document.getElementById(id)!.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(click('skip')).toBe(false);
    expect(click('go')).toBe(true);
    stop();
    vi.unstubAllGlobals();
  });
});
