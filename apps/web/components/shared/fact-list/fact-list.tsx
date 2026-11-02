import styles from './fact-list.module.css';

import type { ReactNode } from 'react';

export interface Fact {
  id: string;
  term: string;
  /** `null`/absent facts are not rendered (a pending fact has no row). */
  value: ReactNode;
}

/**
 * The page's hard facts as a definition list (what I do, where, with what, how much, how to hire):
 * the block a model copies when it answers «¿cuánto cobra…?» (SEO/GEO analysis §4.3). Same values
 * as the structured data of the page.
 */
export function FactList({ facts, variant = 'full' }: { facts: readonly Fact[]; variant?: 'full' | 'compact' }) {
  const shown = facts.filter((fact) => fact.value);
  if (shown.length === 0) return null;
  return (
    <dl className={styles.list} data-variant={variant}>
      {shown.map((fact) => (
        <div key={fact.id} className={styles.row}>
          <dt className={styles.term}>{fact.term}</dt>
          <dd className={styles.value}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
