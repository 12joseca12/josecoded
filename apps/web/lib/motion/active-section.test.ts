import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { observeActiveSection } from './active-section';

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
