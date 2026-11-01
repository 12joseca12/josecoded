'use client';

import { useEffect, useRef, useState } from 'react';

import { useShell } from '@/components/layout/shell-provider';
import { INDICATOR_MIN_MARGIN_REM, indicatorVisibility } from '@/lib/motion/active-section';
import { glideTo } from '@/lib/motion/paging';

import styles from './section-indicator.module.css';

export interface IndicatorSection {
  id: string;
  /** Translated name; the line has no visible text. */
  name: string;
}

const remPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * The lines in the right margin: one per scene after the hero, the current one longer and violet;
 * each takes you to its scene (a glide, or a jump with reduced motion). It is not drawn over the
 * hero, nor while the pinned tour fills the screen, nor with an open cell, nor when the margin is
 * narrower than 2.25 rem (measured against the page, not assumed).
 *
 * A11y: a `nav` with a name and real in-page links (`#id`), each named by its scene; the current
 * one is `aria-current`. When it is not drawn it is `inert`, so Tab never lands on an invisible
 * line. The browser's own jump to `#id` works without JavaScript.
 */
export function SectionIndicator({ label, sections }: { label: string; sections: readonly IndicatorSection[] }) {
  const { openCell } = useShell();
  const nav = useRef<HTMLElement>(null);
  const cellOpen = useRef(false);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(-1);

  useEffect(() => {
    cellOpen.current = openCell !== null;
  }, [openCell]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = innerHeight / 2;
      const hero = document.getElementById('top');
      const tour = document.querySelector<HTMLElement>('[data-tour]');
      const sticky = tour?.querySelector<HTMLElement>('[data-tour-sticky]');
      const tourBox = tour?.getBoundingClientRect();
      const pinned = sticky ? getComputedStyle(sticky).position === 'sticky' : false;
      const margin = nav.current ? (Number.parseFloat(getComputedStyle(nav.current).right) * 2) / remPx() : 0;
      setVisible(
        indicatorVisibility({
          inHero: hero ? hero.getBoundingClientRect().bottom > middle : false,
          inTour: pinned && tourBox !== undefined && tourBox.top <= middle && tourBox.bottom > middle,
          cellOpen: cellOpen.current,
          marginRem: margin,
        }),
      );
      setCurrent(
        sections.findIndex(({ id }) => {
          const box = document.getElementById(id)?.getBoundingClientRect();
          return box !== undefined && box.top <= middle && box.bottom > middle;
        }),
      );
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    return () => {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [sections, openCell]);

  return (
    <nav ref={nav} className={styles.pager} aria-label={label} data-on={visible ? 'true' : undefined} inert={!visible} data-min-margin={INDICATOR_MIN_MARGIN_REM}>
      {sections.map(({ id, name }, i) => (
        <a
          key={id}
          className={styles.link}
          href={`#${id}`}
          aria-label={name}
          aria-current={i === current ? 'true' : undefined}
          onClick={(event) => {
            const target = document.getElementById(id);
            if (!target || openCell !== null) return;
            event.preventDefault();
            glideTo(target.getBoundingClientRect().top + scrollY);
          }}
        >
          <i className={styles.line} />
        </a>
      ))}
    </nav>
  );
}
