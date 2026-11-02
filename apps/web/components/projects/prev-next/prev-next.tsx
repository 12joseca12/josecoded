import { Action } from '@/components/ui/action';

import styles from './prev-next.module.css';

import type { Href } from '@josecoded/types';

export interface PagerLink {
  name: string;
  href: Href;
}

/**
 * Previous and next project of the index order. Either may be missing at the ends (the list does not wrap:
 * a case study is not a carousel).
 *
 * A11y: a `nav` with its own name; each link says «Anterior» or «Siguiente» and the project's name.
 */
export function PrevNext({
  label,
  prev,
  next,
  labels,
}: {
  label: string;
  prev?: PagerLink;
  next?: PagerLink;
  labels: { prev: string; next: string };
}) {
  if (!prev && !next) return null;
  return (
    <nav aria-label={label} className={styles.nav}>
      {prev ? (
        <Action href={prev.href} className={styles.link} data-side="prev">
          <span className={styles.hint}>{labels.prev}</span>
          <span className={styles.name}>{prev.name}</span>
        </Action>
      ) : (
        <span />
      )}
      {next ? (
        <Action href={next.href} className={styles.link} data-side="next">
          <span className={styles.hint}>{labels.next}</span>
          <span className={styles.name}>{next.name}</span>
        </Action>
      ) : null}
    </nav>
  );
}
