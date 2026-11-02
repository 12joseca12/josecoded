import { Icon } from '@/components/ui/icon';

import styles from './detail-card.module.css';

import type { IconName } from '@josecoded/types';
import type { ReactNode } from 'react';

/** A card of the side column of the contact: icon, title, an optional badge on the right and its content. */
export function DetailCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: IconName;
  title: string;
  badge?: ReactNode;
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
      </header>
      {children}
    </section>
  );
}
