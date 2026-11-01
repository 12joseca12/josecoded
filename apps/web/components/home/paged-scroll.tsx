'use client';

import { useEffect, useRef } from 'react';

import { useShell } from '@/components/layout/shell-provider';
import { createPagedScroll } from '@/lib/motion/paging';
import { readToken } from '@/styles/tokens';

import type { PagedScene } from '@/lib/motion/paging';

/** The scenes of the page as the pager measures them; the pinned tour contributes one stop per card. */
function readScenes(): PagedScene[] {
  return [...document.querySelectorAll<HTMLElement>('main > section')].map((section) => {
    const top = section.getBoundingClientRect().top + scrollY;
    const height = section.offsetHeight;
    const sticky = section.querySelector<HTMLElement>('[data-tour-sticky]');
    const cards = section.querySelectorAll('[data-tcard]').length;
    if (sticky && cards > 1 && getComputedStyle(sticky).position === 'sticky') {
      const run = height - innerHeight;
      return { top, height, cards: Array.from({ length: cards }, (_, i) => top + (run * i) / (cards - 1)) };
    }
    return { top, height };
  });
}

/**
 * Hook of the home's paging: while the device has a fine pointer and motion is welcome, one wheel
 * gesture or one press of ↑ ↓ PageUp PageDown Space, Home or End moves to the next scene (and, in the
 * pinned Projects tour, to the next card); a wheel gesture the other way during the glide takes over.
 * Otherwise nothing is touched: native scroll with the proximity snap of the CSS. It yields to the
 * open palette, the open cell and any open dialog, to fields, radios and links for Space, and
 * never reacts to Ctrl+wheel (zoom).
 */
export function usePagedScroll(): void {
  const { palette, openCell } = useShell();
  const layers = useRef({ palette, openCell });

  useEffect(() => {
    layers.current = { palette, openCell };
  }, [palette, openCell]);

  useEffect(() => {
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const step = Number.parseFloat(readToken('--page-stop-step'));
    let stop: (() => void) | undefined;
    const sync = () => {
      stop?.();
      stop = undefined;
      const on = fine.matches && !calm.matches;
      root.toggleAttribute('data-paging', on);
      if (!on) return;
      stop = createPagedScroll({
        scenes: readScenes,
        step,
        blocked: () => layers.current.palette || layers.current.openCell !== null || document.querySelector('dialog[open]') !== null,
      });
    };
    sync();
    fine.addEventListener('change', sync);
    calm.addEventListener('change', sync);
    return () => {
      stop?.();
      root.removeAttribute('data-paging');
      fine.removeEventListener('change', sync);
      calm.removeEventListener('change', sync);
    };
  }, []);
}

/** Island without markup that mounts the hook on the home, outside the page's own tree (it hydrates nothing of `main`). */
export function PagedScroll() {
  usePagedScroll();
  return null;
}
