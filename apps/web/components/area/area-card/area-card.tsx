import { Surface } from '@/components/ui/surface';

import styles from './area-card.module.css';

import type { ReactNode } from 'react';

/**
 * A block of the area: glass sheet with its own heading. One concept for every card of the area
 * (project phase, tasks, proposal, packs, contact): the variants are `tone` and the optional `aside`.
 *
 * A11y: a `section` named by its `h2` (the page's `h1` is the screen's title); decoration-free.
 */
export function AreaCard({
  id,
  title,
  tone = 'default',
  span = 'half',
  children,
}: {
  /** Unique within the page: links the heading to its section. */
  id: string;
  title: string;
  /** `quiet` drops the card to the background (secondary blocks such as contact). */
  tone?: 'default' | 'quiet';
  /** `full` takes the whole row of an `AreaGrid`. */
  span?: 'half' | 'full';
  children: ReactNode;
}) {
  return (
    <Surface radius="cell" data-span={span === 'full' ? 'full' : undefined}>
      <section className={styles.card} data-tone={tone} aria-labelledby={id}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {children}
      </section>
    </Surface>
  );
}
