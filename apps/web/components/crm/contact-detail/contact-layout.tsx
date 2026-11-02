import styles from './contact-detail.module.css';

import type { ReactNode } from 'react';

/** The body of the contact: the history and tabs on the left, the cards on the right from 60rem of the page. */
export function ContactLayout({ main, side, sideLabel }: { main: ReactNode; side: ReactNode; sideLabel: string }) {
  return (
    <div className={styles.page}>
      <div className={styles.split}>
        <div className={styles.panel}>{main}</div>
        <aside className={styles.side} aria-label={sideLabel}>
          {side}
        </aside>
      </div>
    </div>
  );
}
