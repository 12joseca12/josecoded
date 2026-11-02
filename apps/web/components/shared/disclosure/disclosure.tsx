import styles from './disclosure.module.css';

import type { ReactNode } from 'react';

/**
 * A native `<details>` for content that starts folded («Prefiero dejar mis datos»). `open` makes it
 * start unfolded. No script: the browser owns keyboard, state and the accessible role.
 *
 * A11y: `summary` is the control (Enter/Space), 2.75 rem tall, with a visible focus ring.
 */
export function Disclosure({
  summary,
  open = false,
  children,
}: {
  summary: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className={styles.details} open={open}>
      <summary className={styles.summary}>{summary}</summary>
      <div className={styles.panel}>{children}</div>
    </details>
  );
}
