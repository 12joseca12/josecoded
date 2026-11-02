import styles from './check-list.module.css';

import type { ReactNode } from 'react';

/**
 * A list of things that are included or done: a drawn check before each item. Decoration only; the
 * markup is a plain `ul`.
 */
export function CheckList({ items }: { items: readonly { id: string; text: ReactNode }[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
