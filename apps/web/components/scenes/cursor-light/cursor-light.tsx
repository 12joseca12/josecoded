'use client';

import { useEffect, useRef } from 'react';

import { attachCursorLight } from '@/lib/motion/cursor-light';

/**
 * Island without markup of a `Bento`: with a fine pointer and motion welcome, it attaches the one
 * delegated listener of the bento (its parent) that writes the pointer position into the cell under
 * it. The sentinel is `hidden`, so it takes no place in the grid. Decorative: nothing is announced.
 */
export function CursorLight() {
  const sentinel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bento = sentinel.current?.parentElement;
    if (!bento) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    let detach: (() => void) | undefined;
    const sync = () => {
      detach?.();
      detach = fine.matches && !calm.matches ? attachCursorLight(bento) : undefined;
    };
    sync();
    fine.addEventListener('change', sync);
    calm.addEventListener('change', sync);
    return () => {
      detach?.();
      fine.removeEventListener('change', sync);
      calm.removeEventListener('change', sync);
    };
  }, []);

  return <span ref={sentinel} hidden />;
}
