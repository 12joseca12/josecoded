import styles from './prose.module.css';

import type { ReactNode } from 'react';

/**
 * Long-form text in a reading column (legal pages, case studies, guides): headings, paragraphs,
 * lists and links share one rhythm. The caller supplies real `h2`/`h3` (with ids for `Toc`).
 *
 * A11y: line length capped at the prose measure; links are underlined (not by colour alone); no
 * heading level is skipped by this component.
 */
export function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}
