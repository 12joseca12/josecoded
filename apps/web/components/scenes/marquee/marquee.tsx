import { Chip } from '@/components/ui/chip';

import styles from './marquee.module.css';

/**
 * A band of stack chips that drifts sideways, CSS only. The list is written twice so the loop has no
 * seam; the copy is `aria-hidden`. `label` makes it a named list for assistive technology (use it
 * on the first band only); the decorative band is hidden entirely, it repeats the same items.
 */
export function Marquee({
  items,
  label,
  reverse = false,
}: {
  items: readonly string[];
  /** Translated name of the list. Omit it for a decorative band. */
  label?: string;
  reverse?: boolean;
}) {
  return (
    <div className={styles.marquee} data-reverse={reverse ? 'true' : undefined} aria-hidden={label ? undefined : 'true'}>
      <ul className={styles.track} aria-label={label}>
        {items.map((item) => (
          <li key={item}>
            <Chip>{item}</Chip>
          </li>
        ))}
        {items.map((item) => (
          <li key={`copy-${item}`} aria-hidden="true">
            <Chip>{item}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}
