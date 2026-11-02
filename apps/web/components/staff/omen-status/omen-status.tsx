import { LiveDot } from '@/components/ui/live-dot';

import styles from './omen-status.module.css';

import type { OmenStatus as Reported } from '@/lib/admin/queries';

/** What is drawn: `unconfigured` is not a state of Omen, the row is not shown at all. */
type Status = Exclude<Reported, 'unconfigured'>;

/**
 * Whether the home server answers. Green is for what is alive, so «offline» gets a hollow dot; the sentence
 * carries the state (`role="status"` is not needed: it is read once, with the page).
 */
export function OmenStatus({ status, label }: { status: Status; label: string }) {
  return (
    <span className={styles.omen} data-state={status}>
      {status === 'online' ? <LiveDot /> : <span className={styles.off} aria-hidden="true" />}
      {label}
    </span>
  );
}
