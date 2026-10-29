import styles from './kbd.module.css';

import type { ReactNode } from 'react';

/**
 * A real keyboard shortcut (⌘K, ↑, ↓, ↵, esc), never decoration. Geist Mono is used here by rule.
 * Read as text by assistive technology, so give it a text a person can make sense of.
 */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}
