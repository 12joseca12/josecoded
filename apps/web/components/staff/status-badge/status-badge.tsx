import styles from './status-badge.module.css';

import type { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'active' | 'live' | 'attention' | 'overdue' | 'muted';

/**
 * A status as a pill. The state is never the colour alone: the text says it, the dot only reinforces it.
 * `attention` waits for a decision (amber), `live` is alive or done (green), `overdue` is the urgency.
 */
export function StatusBadge({ tone = 'neutral', children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}
