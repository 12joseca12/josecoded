'use client';

import { useEffect, useRef, useState } from 'react';

import { observeCenterActive } from '@/lib/motion/center-active';

import styles from './projects-tour.module.css';

import type { ReactNode } from 'react';

/**
 * Scene 4 of the home: the projects as a pinned horizontal tour. The section is tall (`--tour-height`)
 * and its content `sticky`; scrolling down slides the track sideways (a scroll-driven animation) and
 * the card that crosses the middle is the one in focus. Only where the browser can do that, the
 * screen is landscape and motion is welcome; everywhere else (Safari today, a portrait phone,
 * reduced motion) the cards are simply stacked in a column, never a sideways scroll.
 *
 * The heading, the cards and the link arrive from the server as nodes; this island only watches
 * which card is in the middle: it marks it `data-active` (the card is not ours to re-render) and
 * lights its name in the rail, a decorative aid under the track that also shows the progress.
 *
 * A11y: a `section` named by its heading; the rail is `aria-hidden` (the cards already say it all);
 * every card is reachable by keyboard in the stacked and in the pinned layout, because the page
 * scroll is what moves the track and focus brings a card into view.
 */
export function ProjectsTour({
  titleId,
  head,
  names,
  children,
}: {
  titleId: string;
  head: ReactNode;
  /** Names of the projects, in card order, for the rail. */
  names: readonly string[];
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const cards = () => [...element.querySelectorAll<HTMLElement>('[data-tcard]')];
    return observeCenterActive(cards, (index) => {
      cards().forEach((card, i) => {
        if (i === index) card.setAttribute('data-active', 'true');
        else card.removeAttribute('data-active');
      });
      setActive(index);
    });
  }, []);

  return (
    <section id="proyectos" className={styles.tour} aria-labelledby={titleId} data-snap="" data-tour="">
      <div className={styles.sticky} data-tour-sticky="">
        <header className={styles.head}>{head}</header>
        <div ref={track} className={styles.track}>
          {children}
        </div>
        <div className={styles.rail} aria-hidden="true">
          <div className={styles.names}>
            {names.map((name, i) => (
              <span key={name} data-on={i === active ? 'true' : undefined}>
                {name}
              </span>
            ))}
          </div>
          <div className={styles.bar}>
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
