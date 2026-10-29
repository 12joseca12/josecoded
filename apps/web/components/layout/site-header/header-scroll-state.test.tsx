import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HeaderScrollState } from './header-scroll-state';

let callback: (entries: Partial<IntersectionObserverEntry>[]) => void;
const disconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: typeof callback) {
        callback = cb;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('HeaderScrollState', () => {
  it('flags the header once the 80 px sentinel leaves the viewport', () => {
    const { container } = render(<HeaderScrollState>content</HeaderScrollState>);
    const header = container.querySelector('header')!;
    expect(header.hasAttribute('data-scrolled')).toBe(false);
    act(() => callback([{ isIntersecting: false }]));
    expect(header.getAttribute('data-scrolled')).toBe('true');
    act(() => callback([{ isIntersecting: true }]));
    expect(header.hasAttribute('data-scrolled')).toBe(false);
  });

  it('hides the sentinel from assistive technology and disconnects on unmount', () => {
    const { container, unmount } = render(<HeaderScrollState>content</HeaderScrollState>);
    expect(container.querySelector('div[aria-hidden="true"]')).toBeTruthy();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
