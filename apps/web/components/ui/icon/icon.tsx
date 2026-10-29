import styles from './icon.module.css';
import { icons } from './icons';

import type { IconName } from '@josecoded/types';

/**
 * A Lucide glyph in `currentColor`, 1.05em, stroke 1.75. Decorative by default (`aria-hidden`);
 * pass `label` (translated) only when the icon is the whole content of something that has no text.
 */
export function Icon({ name, label }: { name: IconName; label?: string }) {
  const Glyph = icons[name];
  return label === undefined ? (
    <Glyph className={styles.icon} aria-hidden="true" />
  ) : (
    <Glyph className={styles.icon} role="img" aria-label={label} />
  );
}
