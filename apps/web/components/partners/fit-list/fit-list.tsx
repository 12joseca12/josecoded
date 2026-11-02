import { CheckList } from '@/components/shared/check-list';

import styles from './fit-list.module.css';

import type { ReactNode } from 'react';

export interface FitItem {
  id: string;
  text: ReactNode;
}

/**
 * «Cuándo encajo y cuándo no»: two short lists side by side, one for the cases that fit and one for
 * those that do not. Saying no honestly is part of the pitch to an agency.
 *
 * A11y: two named groups, each with its own `h3`; the lists are plain `ul`s.
 */
export function FitList({
  yes,
  no,
  labels,
}: {
  yes: readonly FitItem[];
  no: readonly FitItem[];
  labels: { yes: string; no: string };
}) {
  return (
    <div className={styles.grid}>
      <section className={styles.col} aria-labelledby="fit-yes">
        <h3 id="fit-yes" className={styles.title}>
          {labels.yes}
        </h3>
        <CheckList items={yes} />
      </section>
      <section className={styles.col} aria-labelledby="fit-no" data-tone="no">
        <h3 id="fit-no" className={styles.title}>
          {labels.no}
        </h3>
        <ul className={styles.no}>
          {no.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
