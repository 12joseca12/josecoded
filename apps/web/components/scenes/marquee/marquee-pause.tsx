'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import styles from './marquee.module.css';

/**
 * The pause control of the marquee bands (WCAG 2.2.2: moving content that lasts more than five
 * seconds can be stopped). It flags the cell it sits in with `data-paused` (`true` or `false`), which the bands'
 * stylesheet turns into `animation-play-state: paused`; the cell is a server node, so the flag is
 * set on the DOM and never rendered by React. Hidden without motion, where the bands are static.
 *
 * A11y: a native toggle button; `aria-pressed` is true while the bands are paused.
 */
export function MarqueePause({ pauseLabel, resumeLabel }: { pauseLabel: string; resumeLabel: string }) {
  const [paused, setPaused] = useState(false);
  return (
    <span className={styles.pause}>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={paused}
        onClick={(event) => {
          const next = !paused;
          event.currentTarget.closest('[data-cell]')?.setAttribute('data-paused', String(next));
          setPaused(next);
        }}
      >
        {paused ? resumeLabel : pauseLabel}
      </Button>
    </span>
  );
}
