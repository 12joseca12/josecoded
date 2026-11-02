import { LiveDot } from '@/components/ui/live-dot';

import styles from './status-badge.module.css';

import type { ReactNode } from 'react';

export type StatusTone = 'live' | 'neutral';

/**
 * A short state label: `live` carries the green dot (the only use of green besides checks and the
 * intro flash), `neutral` is plain. The text always says the state; colour is not the only signal.
 */
export function StatusBadge({ tone = 'neutral', children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {tone === 'live' ? <LiveDot /> : null}
      {children}
    </span>
  );
}
