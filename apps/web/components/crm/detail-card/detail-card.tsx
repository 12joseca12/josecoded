import { Icon } from '@/components/ui/icon';

import styles from './detail-card.module.css';

import type { IconName } from '@josecoded/types';
import type { ReactNode } from 'react';

/** A card of the side column of the contact: icon, title, an optional badge or icon button on the right and its content. */
export function DetailCard({
  icon,
  title,
  badge,
  action,
  children,
}: {
  icon: IconName;
  title: string;
  badge?: ReactNode;
  /** A small icon button at the end of the head (edit). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <span className={styles.tile} aria-hidden="true">
          <Icon name={icon} />
        </span>
        <h2 className={styles.title}>{title}</h2>
        {badge}
        {action}
      </header>
      {children}
    </section>
  );
}
