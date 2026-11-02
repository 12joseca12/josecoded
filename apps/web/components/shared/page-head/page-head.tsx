import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './page-head.module.css';

import type { ReactNode } from 'react';

/**
 * Head of an interior page (pantallas v2.0 §2, «PageHead»): the single `h1` in two tones, the citable
 * paragraph right under it (two or three sentences that stand on their own, SEO/GEO analysis §2.0.4)
 * and the page's actions. `aside` is the optional second column (a portrait). Every piece may be
 * `null`: a pending `{{DATO}}` text is simply left out by the page that builds it.
 *
 * A11y: the `h1` is the page's first heading; the paragraph is plain text (what is citable is the
 * text, not a box); the actions keep their order solid, then ghost.
 */
export function PageHead({
  lead,
  tail,
  citable,
  actions,
  aside,
  id = 'page-title',
}: {
  lead: ReactNode;
  tail: ReactNode;
  citable?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <header className={styles.head} data-aside={aside ? 'true' : undefined}>
      <div className={styles.text}>
        <TwoToneHeading lead={lead} tail={tail} level="h1" id={id} />
        {citable ? <p className={styles.citable}>{citable}</p> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </header>
  );
}
