import styles from './status-badge.module.css';

import type { StatusBadgeTone } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * A status as a pill. The state is never the colour alone: the text says it, the dot only reinforces it.
 * `attention` waits for a decision (amber), `live` is alive or done (green, the only use of green besides checks
 * and the intro flash), `overdue` is the urgency, `active` the current one, `muted` what is over, `neutral` plain.
 */
export function StatusBadge({ tone = 'neutral', children }: { tone?: StatusBadgeTone; children: ReactNode }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}
