import { env } from '@/lib/env';

import styles from './pending.module.css';

import type { ReactNode } from 'react';

/**
 * Marker for a text Jose still has to supply (`{{DATO: …}}`, working-agreements §10). Visible in
 * development and in previews (`NEXT_PUBLIC_DEV_UI=1`); in production it renders nothing, and the
 * block that holds it is not rendered at all (`hasDato`).
 */
export function Pending({ children }: { children: ReactNode }) {
  const visible = process.env.NODE_ENV !== 'production' || env.client.NEXT_PUBLIC_DEV_UI === '1';
  if (!visible) return null;
  return (
    <span className={styles.pending} data-pending="">
      {children}
    </span>
  );
}
