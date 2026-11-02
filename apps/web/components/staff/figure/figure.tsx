import styles from './figure.module.css';

import type { ReactNode } from 'react';

/** A number in a cell, without a chart: `overdue` paints it with the urgency colour (README §4 A). */
export function Figure({
  children,
  size = 'lg',
  tone = 'default',
}: {
  children: ReactNode;
  size?: 'lg' | 'sm';
  tone?: 'default' | 'overdue';
}) {
  return (
    <p className={styles.figure} data-size={size} data-tone={tone}>
      {children}
    </p>
  );
}
