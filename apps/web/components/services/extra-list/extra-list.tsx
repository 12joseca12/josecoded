import styles from './extra-list.module.css';

import type { ReactNode } from 'react';

export interface ExtraItem {
  code: string;
  label: ReactNode;
  description: ReactNode;
  /** «250 €» or «49 €/mes», from `@josecoded/pricing`. */
  price: string;
}

/**
 * The extras that add to any pack (maintenance, SEO, GEO, security): a name, one line about what it
 * is and its price. Prices are text, from the price list; the «sin IVA» note sits with the heading.
 */
export function ExtraList({ items }: { items: readonly ExtraItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.code} className={styles.item}>
          <div className={styles.copy}>
            <p className={styles.label}>{item.label}</p>
            {item.description ? <p className={styles.description}>{item.description}</p> : null}
          </div>
          <p className={styles.price}>{item.price}</p>
        </li>
      ))}
    </ul>
  );
}
