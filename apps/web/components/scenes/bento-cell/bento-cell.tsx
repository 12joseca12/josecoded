import { useId } from 'react';

import { CellExpander } from '@/components/scenes/expanded-cell';
import { IconTile } from '@/components/ui/icon-tile';
import { Surface } from '@/components/ui/surface';

import styles from './bento-cell.module.css';

import type { IconName } from '@josecoded/types';
import type { ReactNode } from 'react';

/** Columns of the twelve that a cell takes in the wide bento. */
export type BentoSpan = 3 | 4 | 5 | 6 | 7 | 8 | 12;

export interface BentoCellProps {
  /** Anchor and key of the cell; needed by `expandable`. */
  id?: string;
  span?: BentoSpan;
  /** Two rows tall in the wide bento; full width in the two-column one. */
  tall?: boolean;
  /** Full width in the two-column bento. */
  wide?: boolean;
  /** The featured cell of a scene: stronger wash and a solid icon. */
  hero?: boolean;
  tone?: 'plain' | 'tint';
  icon?: IconName;
  /** Already translated. */
  title: ReactNode;
  /** A short note next to the title («Sin IVA.»); it comes before any price. */
  note?: ReactNode;
  /** Extra control at the end of the head. */
  action?: ReactNode;
  /** Slot `more`: what the expanded cell shows below the body. Hidden until it opens. */
  more?: ReactNode;
  /** Adds the ⤢ control. Needs `id` and `labels`. Off in the home-v7 scenes (README §16.2). */
  expandable?: boolean;
  labels?: { open: string; close: string };
  /** Slot `body`. */
  children: ReactNode;
}

/**
 * A bento cell: glass surface, an icon tile and a title, a body and, if given, the `more` slot of
 * the expanded cell. Placement is by props (`span`, `tall`, `wide`, `hero`), turned into `data-*`
 * for the grid to read. `expandable` is the only reason the cell has a client island.
 *
 * A11y: an `article` named by its `h3`. When expanded it becomes `role="dialog"` + `aria-modal`
 * (see `lib/motion/expand-cell.ts`), takes focus (`tabindex="-1"`) and returns it to ⤢ on close.
 */
export function BentoCell({
  id,
  span = 6,
  tall = false,
  wide = false,
  hero = false,
  tone = 'plain',
  icon,
  title,
  note,
  action,
  more,
  expandable = false,
  labels,
  children,
}: BentoCellProps) {
  const generated = useId();
  const key = id ?? generated;
  const titleId = `${key}-title`;
  const flags = {
    'data-tall': tall ? 'true' : undefined,
    'data-wide': wide ? 'true' : undefined,
    'data-hero': hero ? 'true' : undefined,
  };

  return (
    <Surface
      as="article"
      id={id}
      aria-labelledby={titleId}
      tabIndex={expandable ? -1 : undefined}
      interactive={expandable}
      data-cell=""
      data-span={span}
      data-tone={tone}
      {...flags}
    >
      <div className={styles.inner} data-tone={tone} {...flags}>
        <header className={styles.head}>
          {icon ? <IconTile icon={icon} tone={hero ? 'solid' : 'soft'} /> : null}
          <h3 id={titleId} className={styles.title}>
            {title}
          </h3>
          {note ? <p className={styles.note}>{note}</p> : null}
          {action}
          {expandable && id && labels ? (
            <CellExpander cellId={id} openLabel={labels.open} closeLabel={labels.close} controlClass={styles.control} />
          ) : null}
        </header>
        <div className={styles.body}>{children}</div>
        {more ? (
          <div className={styles.more}>
            {more}
          </div>
        ) : null}
      </div>
    </Surface>
  );
}
