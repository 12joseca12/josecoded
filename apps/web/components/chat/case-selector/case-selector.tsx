'use client';

import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';

import styles from './case-selector.module.css';

import type { ChatCase, ChatCaseSelectorVariant, Href, IconName } from '@josecoded/types';

const CASES: readonly { id: ChatCase; icon: IconName }[] = [
  { id: 'client', icon: 'store' },
  { id: 'partner', icon: 'building-2' },
  { id: 'recruiter', icon: 'user-check' },
  { id: 'curious', icon: 'sparkles' },
];

/**
 * «¿Quién eres?»: the four ways into the chat. Each one is a link to the same page with its `?case`,
 * so it works before any script and the choice is shareable; the current one carries `aria-current`.
 * `full` is the first screen (icon above the text), `compact` is the row that stays above a running
 * thread. It is always available: the case can change at any time.
 *
 * A11y: a named group (the visible question names it), a list of real links, current one marked
 * with `aria-current="true"` and a border (not colour alone); targets are at least 2.75 rem.
 * With `onSelect` (the live chat, where changing the case must not reload the thread) each option is a
 * button with the same look and the same `aria-current`.
 */
export function CaseSelector({
  label,
  labels,
  current,
  hrefFor,
  variant = 'full',
  onSelect,
}: {
  label: string;
  labels: Record<ChatCase, string>;
  current: ChatCase;
  hrefFor: (id: ChatCase) => Href;
  variant?: ChatCaseSelectorVariant;
  onSelect?: (id: ChatCase) => void;
}) {
  return (
    <div className={styles.box} role="group" aria-labelledby="chat-case-label" data-variant={variant}>
      <p id="chat-case-label" className={styles.label}>
        {label}
      </p>
      <ul className={styles.list} data-variant={variant}>
        {CASES.map(({ id, icon }) => (
          <li key={id}>
            <Action
              {...(onSelect ? { onClick: () => onSelect(id) } : { href: hrefFor(id) })}
              className={styles.option}
              aria-current={id === current ? 'true' : undefined}
            >
              <Icon name={icon} />
              <span>{labels[id]}</span>
            </Action>
          </li>
        ))}
      </ul>
    </div>
  );
}
