import styles from './about-summary.module.css';

import type { ReactNode } from 'react';

/**
 * Body of the «Sobre mí» cell: the photo (or its placeholder), name, role and city, the lead and
 * the exits. Everything arrives translated; a missing piece is simply not given (`photo` null in
 * production while the real photo is pending, `lead` null while its text is). The photo is
 * a real image with its own alt text (or the pending marker).
 */
export function AboutSummary({
  photo,
  name,
  role,
  lead,
  links,
}: {
  photo: ReactNode;
  name: ReactNode;
  role: ReactNode;
  lead: ReactNode;
  links: ReactNode;
}) {
  // two children of the cell body: a tall cell spreads them (the exits sit at the bottom)
  return (
    <>
      <div className={styles.about} data-photo={photo ? undefined : 'none'}>
        {photo ? (
          <div className={styles.photo}>{photo}</div>
        ) : null}
        <div className={styles.text}>
          <p className={styles.name}>{name}</p>
          <p className={styles.role}>{role}</p>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </div>
      </div>
      <div className={styles.links}>{links}</div>
    </>
  );
}
