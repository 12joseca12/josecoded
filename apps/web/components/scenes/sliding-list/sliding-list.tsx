'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { IconTile } from '@/components/ui/icon-tile';
import { markerFor } from '@/lib/motion/slide-marker';
import { readToken } from '@/styles/tokens';

import styles from './sliding-list.module.css';

import type { IconName } from '@josecoded/types';
import type { ReactNode } from 'react';

export interface SlidingOption {
  id: string;
  icon: IconName;
  name: string;
  /** The figure of the row («40 €/h», «CV y entrevista»), already formatted. */
  figure: string;
}

/**
 * The routes of «Cómo trabajar conmigo»: a group of radios, each row an icon, a name and its figure,
 * and next to it the panel of the chosen row. The tinted highlight slides to the chosen row
 * (`markerFor`, `--dur-slide`); hovering only tints a row, it never moves the highlight, so two rows
 * never look chosen. The panels share one grid cell, so the cell keeps the height of the tallest
 * and nothing jumps when the choice changes. `panels[i]` belongs to `options[i]`.
 *
 * A11y: a `fieldset` with a `legend` and native radios (arrow keys, one tab stop); each radio names
 * its panel with `aria-controls`; panels that are not chosen are `visibility: hidden`, so they are
 * out of reach for focus and for screen readers. On touch the page scrolls just enough to show the
 * panel the person chose (smooth, instant with reduced motion). The highlight is decorative.
 */
export function SlidingList({
  legend,
  options,
  panels,
  defaultId,
}: {
  legend: string;
  options: readonly SlidingOption[];
  panels: readonly ReactNode[];
  defaultId?: string;
}) {
  const group = useId();
  const [index, setIndex] = useState(() => Math.max(0, options.findIndex((option) => option.id === defaultId)));
  const [ready, setReady] = useState(false);
  const list = useRef<HTMLFieldSetElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const panelBox = useRef<HTMLDivElement>(null);
  const placed = useRef(false);

  // the highlight follows the chosen row, and its size when the row wraps
  useEffect(() => {
    const element = list.current;
    const marker = highlight.current;
    if (!element || !marker) return;
    const place = () => {
      const row = element.querySelectorAll<HTMLElement>('label')[index];
      if (!row) return;
      const box = { left: 0, top: 0, width: element.offsetWidth, height: element.offsetHeight };
      const { offset, size } = markerFor(box, { left: 0, top: row.offsetTop, width: row.offsetWidth, height: row.offsetHeight }, 'y', 0);
      marker.style.setProperty('--y', `${offset}px`);
      marker.style.setProperty('--h', `${size}px`);
    };
    place();
    const frame = requestAnimationFrame(() => {
      if (!placed.current) {
        placed.current = true;
        setReady(true); // no slide on the first placement
      }
    });
    const observer = new ResizeObserver(place);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [index, options.length]);

  function choose(next: number) {
    setIndex(next);
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    revealPanel(list.current?.querySelectorAll<HTMLElement>('label')[next], panelBox.current);
  }

  return (
    <div className={styles.vias} data-ready={ready ? 'true' : undefined}>
      <fieldset ref={list} className={styles.list}>
        <legend className="sr-only">{legend}</legend>
        <span ref={highlight} className={styles.highlight} aria-hidden="true" />
        {options.map((option, i) => (
          <label key={option.id} className={styles.row} data-checked={i === index ? 'true' : undefined}>
            <input
              className="sr-only"
              type="radio"
              name={group}
              value={option.id}
              checked={i === index}
              aria-controls={`${group}-${option.id}`}
              onChange={() => choose(i)}
            />
            <IconTile icon={option.icon} size="sm" tone={i === index ? 'solid' : 'soft'} />
            <span className={styles.name}>{option.name}</span>
            <span className={styles.figure}>{option.figure}</span>
          </label>
        ))}
      </fieldset>
      <div ref={panelBox} className={styles.panels}>
        {options.map((option, i) => (
          <div key={option.id} id={`${group}-${option.id}`} className={styles.panel} data-selected={i === index ? 'true' : undefined}>
            {panels[i]}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * On a phone the panel sits under the list: if the chosen route leaves it off screen, the page
 * rises just enough to show it whole without hiding the chosen row under the header. Scroll snap
 * would pull the view back to the start of the scene, so it is suspended until the next gesture.
 */
function revealPanel(row: HTMLElement | undefined, panel: HTMLElement | null) {
  if (!row || !panel) return;
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const header = Number.parseFloat(readToken('--header-height')) * rem;
  const gap = Number.parseFloat(getComputedStyle(row).paddingTop) || 0;
  const need = panel.getBoundingClientRect().bottom - innerHeight + gap;
  const room = row.getBoundingClientRect().top - header - gap;
  const dy = Math.min(need, room);
  if (dy <= 0) return;
  const root = document.documentElement;
  root.style.scrollSnapType = 'none';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollBy({ top: dy, behavior: calm ? 'instant' : 'smooth' });
  const restore = () => {
    root.style.scrollSnapType = '';
  };
  addEventListener('touchstart', restore, { once: true, passive: true });
  addEventListener('wheel', restore, { once: true, passive: true });
}
