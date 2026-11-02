import { Surface } from '@/components/ui/surface';

import styles from './quota-notice.module.css';

import type { ReactNode } from 'react';

/**
 * What replaces the composer when the day's limit is reached (the 21st message): a kind sentence, not an
 * error, and the direct ways to reach Jose (`children`, a `QuickContact`).
 *
 * A11y: the sentence is a polite `role="status"` (announced when the limit is hit); the contact
 * row after it is a normal named group.
 */
export function QuotaNotice({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <Surface as="section" aria-labelledby="chat-quota-title">
      <div className={styles.box}>
        <div className={styles.text} role="status">
          <h2 id="chat-quota-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.body}>{text}</p>
        </div>
        {children}
      </div>
    </Surface>
  );
}
