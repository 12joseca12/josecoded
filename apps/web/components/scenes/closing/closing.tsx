import { CtaRow } from '@/components/scenes/cta-row';
import reveal from '@/components/scenes/scene/reveal.module.css';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './closing.module.css';

import type { ReactNode } from 'react';

/**
 * The last scene: the closing question and the two ways to start (a solid and a ghost action), and
 * the hint to the palette with its key caps. Each piece enters on its own, like the cells of the
 * other scenes. `hint` is already composed (text with `KeyCap`s) and may be null: without a fine
 * pointer there is no keyboard shortcut, and the CSS hides it.
 *
 * A11y: a `section` named by its `h2`; the two actions are real links in the order solid, ghost; the
 * hint is plain text with `kbd` keys.
 */
export function Closing({
  id,
  lead,
  tail,
  actions,
  hint,
}: {
  id: string;
  lead: ReactNode;
  tail: ReactNode;
  actions: ReactNode;
  hint: ReactNode;
}) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className={styles.close} aria-labelledby={titleId} data-snap="">
      <div className={reveal.item}>
        <TwoToneHeading id={titleId} lead={lead} tail={tail} size="display-closing" />
      </div>
      <div className={`${styles.ctas} ${reveal.item}`}>
        <CtaRow align="center">{actions}</CtaRow>
      </div>
      {hint ? <p className={`${styles.hint} ${reveal.item}`}>{hint}</p> : null}
    </section>
  );
}
