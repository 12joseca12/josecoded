import styles from './area-card.module.css';

import type { ReactNode } from 'react';

/**
 * Grid of `AreaCard`s: one column on a phone, two once the screen has room. The wrapper is the
 * container its columns query, so the layout follows the width of the content area, not the window.
 */
export function AreaGrid({ children }: { children: ReactNode }) {
  return (
    <div className={styles.gridBox}>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}
