import { useId } from 'react';

import { IconTile } from '@/components/ui/icon-tile';

import styles from './summary-card.module.css';

import type { IconName } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * A cell of a summary: icon tile, heading (`h2`) and content. `hero` is the featured cell with the violet tile.
 * `cols` and `rows` are the cell's place in the twelve columns of K1 from 60rem; below that every cell stacks.
 */
export function SummaryCard({
  icon,
  title,
  tone = 'default',
  cols = 4,
  rows = 1,
  aside,
  children,
}: {
  icon: IconName;
  title: string;
  tone?: 'default' | 'hero';
  cols?: 4 | 5 | 7 | 12;
  rows?: 1 | 2;
  /** Next to the heading, on the right: a «Ver» link or a status. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className={styles.card} data-tone={tone} data-cols={cols} data-rows={rows} aria-labelledby={id}>
      <div className={styles.head}>
        <IconTile icon={icon} tone={tone === 'hero' ? 'solid' : 'soft'} size="sm" />
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
