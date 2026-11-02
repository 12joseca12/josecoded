import styles from './page-head.module.css';

import type { ReactNode } from 'react';

/**
 * Head of a staff screen: the `h1` in two tones (the second one is amber, README §4 C; `lavender` is the
 * alternative of the v6 headlines), an optional lead and the actions of the view. The one violet action of
 * the view belongs in `actions`.
 */
export function PageHead({
  title,
  tone,
  tint = 'amber',
  lead,
  actions,
}: {
  title: string;
  tone: string;
  tint?: 'amber' | 'lavender';
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.head}>
      <div className={styles.text}>
        <h1 className={styles.title}>
          {title} <span className={styles.tone} data-tint={tint}>{tone}</span>
        </h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
