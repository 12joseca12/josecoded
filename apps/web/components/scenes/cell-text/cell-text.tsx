import styles from './cell-text.module.css';

import type { ReactNode } from 'react';

export type CellTextVariant = 'lead' | 'muted' | 'title' | 'title-sm';

/**
 * A paragraph of a bento cell. `lead` is the sentence that explains the cell, `muted` a small note
 * (a date, a caption), `title` and `title-sm` the headline of an article or a demo, which draws an
 * underline while the cell is under the pointer. A pending `{{DATO}}` marker may sit inside.
 */
export function CellText({ variant = 'lead', children }: { variant?: CellTextVariant; children: ReactNode }) {
  return (
    <p className={styles.text} data-variant={variant}>
      {children}
    </p>
  );
}
