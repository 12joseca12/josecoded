import styles from './empty-state.module.css';

import type { ReactNode } from 'react';

/**
 * What a list shows when there is nothing to list (a filter without results, a section without
 * content): a title, a sentence and, if there is a way on, an action. Never a blank area.
 *
 * A11y: the group is a polite `role="status"` only when `live` (a filter that just emptied the list);
 * a static empty page is plain text.
 */
export function EmptyState({
  title,
  text,
  action,
  live = false,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
  live?: boolean;
}) {
  return (
    <div className={styles.box} role={live ? 'status' : undefined}>
      <p className={styles.title}>{title}</p>
      {text ? <p className={styles.text}>{text}</p> : null}
      {action}
    </div>
  );
}
