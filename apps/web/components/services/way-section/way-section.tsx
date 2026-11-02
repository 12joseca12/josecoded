import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './way-section.module.css';

import type { ReactNode } from 'react';

/**
 * One of the four ways of `/servicios` (pantallas v2.0, «WaySection»): the two-tone `h2`, the
 * sentence that explains the way, its content and, last, the primary action followed by the
 * secondary ones. The `id` is the anchor of `WayNav` and of the links from other pages.
 *
 * A11y: a `section` labelled by its `h2`; `scroll-margin-top` clears the header and the sticky
 * index; the primary action comes first in the tab order of the actions.
 */
export function WaySection({
  id,
  lead,
  tail,
  text,
  actions,
  children,
}: {
  id: string;
  lead: ReactNode;
  tail: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className={styles.way} aria-labelledby={titleId}>
      <header className={styles.head}>
        <TwoToneHeading lead={lead} tail={tail} id={titleId} />
        {text ? <p className={styles.text}>{text}</p> : null}
      </header>
      {children}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}
