import styles from './two-tone-heading.module.css';

import type { TwoToneHeadingLevel, TwoToneHeadingSize } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * Scene title in two phrases: the first says what it is (text colour), the second for whom or with
 * what (highlight amber, home v7). Both come from `messages` and are passed in already translated.
 * `h2` for a scene, `h1` when it is the title of a page; `size` picks the type role. A pending
 * `{{DATO}}` marker may sit in either phrase (it inherits the colour with a dotted underline).
 *
 * A11y: one heading with the full sentence as its name (the tail is a span, not a separate
 * element); `text-wrap: balance` and at most 22ch; contrast `text` 16.9:1 and `highlight` 8.65:1.
 */
export function TwoToneHeading({
  lead,
  tail,
  level = 'h2',
  size = 'headline',
  id,
}: {
  lead: ReactNode;
  tail: ReactNode;
  level?: TwoToneHeadingLevel;
  size?: TwoToneHeadingSize;
  id?: string;
}) {
  const Heading = level;
  return (
    <Heading id={id} className={styles.heading} data-size={size}>
      {lead} <span className={styles.tail}>{tail}</span>
    </Heading>
  );
}
