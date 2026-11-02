import { ChatBubble } from '@/components/scenes/chat-bubble';

import styles from './chat-thread.module.css';

import type { ChatCase, ChatThreadItem } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * The conversation. Messages are plain text; a `quick_contact` item draws `quickContact` (the row of
 * ways to reach Jose) and a `case_switch` item is a small centred note.
 *
 * A11y: `role="log"` with polite additions only: what is already there when the page loads is not
 * read, and each new message is announced once (never assertive, never the whole list again). The
 * sender is read before each text (`ChatBubble`). Nothing inside takes focus.
 */
export function ChatThread({
  items,
  label,
  senders,
  caseSwitch,
  quickContact,
}: {
  items: readonly ChatThreadItem[];
  label: string;
  senders: { visitor: string; assistant: string; jose: string };
  caseSwitch: (to: ChatCase) => string;
  quickContact: ReactNode;
}) {
  return (
    <div className={styles.thread} role="log" aria-label={label} aria-relevant="additions">
      {items.map((item) => {
        if (item.kind === 'quick_contact') return <div key={item.id}>{quickContact}</div>;
        if (item.kind === 'case_switch') {
          return (
            <p key={item.id} className={styles.note}>
              {caseSwitch(item.to)}
            </p>
          );
        }
        return <ChatBubble key={item.id} plain from={item.from} text={item.text} sender={senders[item.from]} />;
      })}
    </div>
  );
}
