import { ArrowLink } from '@/components/ui/arrow-link';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './closing-compact.module.css';

import type { ReactNode } from 'react';

/**
 * The short closing of every interior page (pantallas v2.0 §1.3): one sentence, the page's one
 * primary action and «Otras formas de hablar →» to `/contacto`. A compact `Closing`, with no
 * screen-tall height and no palette hint.
 *
 * A11y: a `section` named by its `h2`; the primary action comes first, the link to the contact page
 * second.
 */
export function ClosingCompact({
  id = 'cierre',
  lead,
  tail,
  primary,
  moreLabel,
}: {
  id?: string;
  lead: ReactNode;
  tail?: ReactNode;
  /** The page's primary action (a `Button`), already built by the page. */
  primary: ReactNode;
  /** «Otras formas de hablar». */
  moreLabel: string;
}) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className={styles.close} aria-labelledby={titleId}>
      <TwoToneHeading id={titleId} lead={lead} tail={tail} />
      <div className={styles.actions}>
        {primary}
        <ArrowLink href="/contacto" emphasis="strong">
          {moreLabel}
        </ArrowLink>
      </div>
    </section>
  );
}
