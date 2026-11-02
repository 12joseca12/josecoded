import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './page-section.module.css';

import type { ReactNode } from 'react';

/**
 * A block of an interior page: a `section` named by its two-tone `h2`, with room around it for the
 * page to scroll freely (the interior pages have no pinned screens). Same container and gutter as
 * `Scene`, without the screen-tall padding of the home. The `id` is the anchor other pages link to.
 *
 * A11y: a landmark `section` labelled by its own `h2`; `scroll-margin-top` clears the fixed header.
 */
export function PageSection({
  id,
  lead,
  tail,
  aside,
  children,
}: {
  id: string;
  lead: ReactNode;
  tail?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className={styles.section} aria-labelledby={titleId}>
      <header className={styles.head}>
        <TwoToneHeading lead={lead} tail={tail} id={titleId} />
        {aside}
      </header>
      {children}
    </section>
  );
}
