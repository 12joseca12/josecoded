import styles from './area-empty.module.css';

import type { ReactNode } from 'react';

/** Empty list of the area: says what is missing and what makes it appear; never a blank space. */
export function AreaEmpty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{children}</p>
    </div>
  );
}
