import styles from './owner-badge.module.css';

import type { OwnerBadgeState } from '@josecoded/types';

/** Two letters for the avatar: the initials of the first two words. */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase('es'))
    .join('');
  return letters || '?';
}

/**
 * Who owns a contact. Only the admin ever sees it: a closer's page carries no owner at all. `unassigned` is a
 * contact nobody owns yet (the avatar is an empty circle with a question mark), `off` a deactivated closer.
 * The name is always written; the avatar is decoration.
 */
export function OwnerBadge({
  state = 'assigned',
  name,
  suffix,
}: {
  state?: OwnerBadgeState;
  /** Already translated for `unassigned`. */
  name: string;
  /** «(desactivado)» for `off`, already translated. */
  suffix?: string;
}) {
  return (
    <span className={styles.owner} data-state={state}>
      <span className={styles.avatar} aria-hidden="true">
        {state === 'unassigned' ? '?' : initials(name)}
      </span>
      {name}
      {suffix ? <small>{suffix}</small> : null}
    </span>
  );
}
