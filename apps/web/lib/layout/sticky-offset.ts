'use client';

import { useEffect } from 'react';

import type { RefObject } from 'react';

const VARIABLE = { top: '--page-sticky-top', bottom: '--page-sticky-bottom' } as const;

/**
 * Publishes the height of a sticky or fixed element as a CSS variable on `<html>`, so that
 * `scroll-padding-block-start|end` (styles/globals.css) keeps what an anchor or the keyboard focuses
 * out from under it. `active: false` (a bar that is hidden) publishes nothing. The variable is removed
 * when the element goes away. The size is measured, not written down, so it follows text zoom.
 */
export function useStickyOffset(ref: RefObject<HTMLElement | null>, edge: keyof typeof VARIABLE, active = true): void {
  useEffect(() => {
    const element = ref.current;
    const root = document.documentElement;
    const name = VARIABLE[edge];
    if (!element || !active) return;
    const publish = () => root.style.setProperty(name, `${element.getBoundingClientRect().height}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') return () => root.style.removeProperty(name);
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(name);
    };
  }, [ref, edge, active]);
}
