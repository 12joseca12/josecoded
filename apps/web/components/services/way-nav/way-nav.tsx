'use client';

import { useEffect, useState } from 'react';

import { observeActiveSection } from '@/lib/motion/active-section';

import styles from './way-nav.module.css';

export interface WayLink {
  id: string;
  label: string;
}

/**
 * Sticky index of the four ways, under the header: one anchor link per way, the one in the middle of
 * the viewport marked `aria-current` (the same observer the home's section indicator uses). Without
 * JavaScript the links still jump to their section.
 *
 * A11y: a `nav` with its own name; real in-page links; `aria-current="location"` on the current one;
 * 2.75 rem targets; the focus ring is the global one.
 */
export function WayNav({ label, ways }: { label: string; ways: readonly WayLink[] }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => observeActiveSection(ways.map((way) => way.id), setCurrent), [ways]);

  return (
    <nav aria-label={label} className={styles.nav}>
      <ul className={styles.list}>
        {ways.map((way) => (
          <li key={way.id}>
            <a href={`#${way.id}`} className={styles.link} aria-current={current === way.id ? 'location' : undefined}>
              {way.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
