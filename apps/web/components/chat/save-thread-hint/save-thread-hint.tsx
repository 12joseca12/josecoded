import { ArrowLink } from '@/components/ui/arrow-link';

import styles from './save-thread-hint.module.css';

import type { Href } from '@josecoded/types';

/** The optional login: the chat works without an account, this only offers to keep the thread. */
export function SaveThreadHint({ text, action, href }: { text: string; action: string; href: Href }) {
  return (
    <p className={styles.hint}>
      <span>{text}</span>
      <ArrowLink href={href} emphasis="strong" size="sm">
        {action}
      </ArrowLink>
    </p>
  );
}
