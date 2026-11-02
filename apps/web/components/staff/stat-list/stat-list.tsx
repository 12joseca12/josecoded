import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';

import styles from './stat-list.module.css';

import type { Href } from '@josecoded/types';
import type { ReactNode } from 'react';

/** Rows of «label … value» inside a cell. `columns` lays them out in two columns from 40rem and three from 60rem. */
export function StatList({ children, columns = false }: { children: ReactNode; columns?: boolean }) {
  return (
    <ul role="list" className={styles.list} data-columns={columns ? 'true' : undefined}>
      {children}
    </ul>
  );
}

/**
 * One row. With `href` the whole row is a link (a chevron says so); without it, a plain row. The name of the
 * link is «label value», so the number is read with what it counts.
 */
export function StatRow({ label, value, href }: { label: string; value: ReactNode; href?: Href }) {
  const content = (
    <>
      <span>{label}</span>
      <b className={styles.value}>{value}</b>
    </>
  );
  return (
    <li>
      {href ? (
        <Action href={href} className={styles.row} data-link="true">
          {content}
          <Icon name="chevron-right" />
        </Action>
      ) : (
        <div className={styles.row}>{content}</div>
      )}
    </li>
  );
}
