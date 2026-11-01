'use client';

import { useEffect, useRef, useState } from 'react';

import { Action } from '@/components/ui/action';
import { markerFor } from '@/lib/motion/slide-marker';

import styles from './pack-strip.module.css';

import type { Href } from '@josecoded/types';

export interface PackItem {
  code: string;
  /** Name of the pack («Web básica»). */
  name: string;
  /** The price as shown («900 €»), from `@josecoded/pricing`. */
  price: string;
  /** Full sentence for assistive technology («desde 900 € sin IVA. Ver qué incluye»). */
  description: string;
  href: Href;
}

/** Space between a pack and the bar under it. */
const BAR_GAP = 6;

/**
 * The packs of the Services scene: the web ones (P1–P4) and, after a hairline, the app (P5). Each
 * one is a link to its place in the comparison (`/servicios?pack=Px#packs`). The bar under the row
 * slides to the pack that is pointed at or focused and goes back to the featured one (P2) when the
 * pointer or focus leaves. In a narrow cell the packs stack as a list and there is no bar.
 *
 * A11y: real links; the name is the visible pack name plus a visually hidden sentence with the
 * price and «sin IVA», so the visible text is contained in the accessible name (WCAG 2.5.3); the
 * visible price is `aria-hidden` to avoid reading it twice. The bar is decorative.
 */
export function PackStrip({ web, app, featured }: { web: readonly PackItem[]; app: readonly PackItem[]; featured: string }) {
  const [active, setActive] = useState(featured);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  // the bar sits under the active pack and follows the strip when it resizes
  useEffect(() => {
    const strip = root.current;
    const marker = bar.current;
    if (!strip || !marker) return;
    const place = () => {
      // `.packs` is the offset parent of every pack, so offsets are measured from it
      const pack = strip.querySelector<HTMLElement>(`[data-code="${active}"]`);
      if (!pack) return;
      const { offset, size, gap } = markerFor(
        { left: 0, top: 0, width: strip.offsetWidth, height: strip.offsetHeight },
        { left: pack.offsetLeft, top: pack.offsetTop, width: pack.offsetWidth, height: pack.offsetHeight },
        'x',
        BAR_GAP,
      );
      marker.style.setProperty('--x', `${offset}px`);
      marker.style.setProperty('--w', `${size}px`);
      marker.style.top = `${pack.offsetTop + pack.offsetHeight + gap}px`;
    };
    place();
    const frame = requestAnimationFrame(() => setReady(true));
    const observer = new ResizeObserver(place);
    observer.observe(strip);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active]);

  // delegated: the links are `Action`s, which take no pointer handlers of their own
  const pick = (event: { target: EventTarget }) => {
    const code = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-code]')?.dataset.code : undefined;
    if (code) setActive(code);
  };

  const link = (pack: PackItem) => (
    <Action
      key={pack.code}
      href={pack.href}
      className={styles.pack}
      data-code={pack.code}
      data-active={pack.code === active ? 'true' : undefined}
    >
      <small className={styles.name}>{pack.name}</small>
      <b className={styles.price}>
        <span aria-hidden="true">{pack.price}</span>
        <span className="sr-only">{pack.description}</span>
      </b>
    </Action>
  );

  return (
    <div
      ref={root}
      className={styles.packs}
      data-ready={ready ? 'true' : undefined}
      onPointerOver={pick}
      onFocus={pick}
      onPointerLeave={() => setActive(featured)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(featured);
      }}
    >
      <span ref={bar} className={styles.bar} aria-hidden="true" />
      <div className={styles.group} data-group="web">
        {web.map(link)}
      </div>
      <div className={styles.group} data-group="app">
        {app.map(link)}
      </div>
    </div>
  );
}
