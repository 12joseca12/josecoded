import styles from './chip.module.css';

import type { ReactNode } from 'react';

/** Stack pill. DESIGN.md reserves it for the marquee of «Con qué trabajo» and tags of a project. */
export function Chip({ children }: { children: ReactNode }) {
  return <span className={styles.chip}>{children}</span>;
}
