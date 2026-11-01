import styles from './cta-row.module.css';

import type { ReactNode } from 'react';

/**
 * The actions of a panel or a closing: one solid `Button`, then its ghost sibling or `ArrowLink`s.
 * They wrap on narrow screens; inside a narrow cell the buttons take the full width. `center` is
 * the closing scene's row.
 */
export function CtaRow({ align = 'start', children }: { align?: 'start' | 'center'; children: ReactNode }) {
  return (
    <div className={styles.row} data-align={align}>
      {children}
    </div>
  );
}
