import styles from './chip.module.css';

import type { ChipSize } from '@josecoded/types';
import type { ReactNode } from 'react';

/** Stack pill. DESIGN.md reserves it for the marquee of «Con qué trabajo» and tags (of a project, of a contact). */
export function Chip({ size = 'md', children }: { size?: ChipSize; children: ReactNode }) {
  return (
    <span className={styles.chip} data-size={size}>
      {children}
    </span>
  );
}
