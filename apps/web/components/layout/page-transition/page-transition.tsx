import { ViewTransition } from 'react';

import styles from './page-transition.module.css';

import type { ReactNode } from 'react';

/**
 * Cross-fade between pages on client navigation (React `ViewTransition`, native View Transitions).
 * It wraps only the page, never the header or the footer, so those stay put. The old page leaves in
 * 120 ms and the new one enters in 160 ms rising a few pixels (`ease-out`); both are tokens. Without
 * `document.startViewTransition` the navigation simply swaps (working-agreements §6), and with
 * reduced motion the CSS removes every animation.
 *
 * Mounted from `app/[locale]/template.tsx`, which Next re-creates on each navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter={styles.enter} exit={styles.exit}>
      {children}
    </ViewTransition>
  );
}
