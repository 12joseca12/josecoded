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
  actions,
}: {
  title: string;
  tone: string;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.head}>
      <div className={styles.text}>
        <TwoToneHeading level="h1" size="crm" lead={title} tail={tone} />
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
