import { Action } from '@/components/ui/action';

import styles from './tab-nav.module.css';

export interface TabItem {
  id: string;
  label: string;
  href: `/${string}`;
  /** A small number next to the label (stories to decide, drafts…). */
  count?: number;
}

/**
 * The sections of a page as links that keep the state in the URL (`?tab=`): the server renders the panel that is
 * asked for, and the page works without JavaScript. The current one carries `aria-current`.
 */
export function TabNav({ label, items, current }: { label: string; items: readonly TabItem[]; current: string }) {
  return (
    <nav aria-label={label} className={styles.tabs}>
      <ul role="list" className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <Action href={item.href} className={styles.tab} aria-current={item.id === current ? 'page' : undefined}>
              {item.label}
              {item.count ? <span className={styles.count}>{item.count}</span> : null}
            </Action>
          </li>
        ))}
      </ul>
    </nav>
  );
}
