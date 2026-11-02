import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './page-head.module.css';

import type { ReactNode } from 'react';

/**
 * Head of a staff screen: the `h1` in two tones (`TwoToneHeading` at the `crm` size; the second one is amber,
 * README §4 C), an optional lead and the actions of the view. The one violet action of the view belongs in
 * `actions`.
 */
export function PageHead({
  title,
  tone,
  lead,
  meta,
  align = 'end',
  flush = false,
  actions,
}: {
  title: string;
  tone: string;
  lead?: ReactNode;
  /** A row under the title (the kind, status and owner of a contact): it belongs to the title, not to the page. */
  meta?: ReactNode;
  /** Where the actions sit against the text: at its foot (a list) or at its top (a record with a meta row). */
  align?: 'end' | 'start';
  /** No space below: the head is part of a larger one (a contact's head also holds how to reach them). */
  flush?: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.head} data-align={align} data-flush={flush || undefined}>
      <div className={styles.text}>
        <TwoToneHeading level="h1" size="crm" lead={title} tail={tone} />
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {meta}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
