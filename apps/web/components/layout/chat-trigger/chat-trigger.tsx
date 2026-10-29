import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';
import { LiveDot } from '@/components/ui/live-dot';

import styles from './chat-trigger.module.css';

import type { PrimitiveActionProps } from '@/components/ui/action';

export type ChatTriggerProps = PrimitiveActionProps & {
  /** Visible text («Chat»); under 900 px only the dot and the icon stay. */
  label: string;
};

/**
 * Pill that opens the assistant. In the header it is a link to `/chat` (no `?case`: the selector
 * there decides); same polymorphism as `Button`, so without `href` it is a button. The green dot
 * is the «alive» signal and is decorative.
 *
 * A11y: native role; the name is the `aria-label` passed by the caller («Abrir el chat»), which
 * contains the visible «Chat»; hit area 2.75 rem when compact; focus ring from `:focus-visible`.
 */
export function ChatTrigger({ label, ...rest }: ChatTriggerProps) {
  return (
    <Action {...rest} className={styles.trigger}>
      <LiveDot />
      <Icon name="message-square" />
      <span className={styles.label}>{label}</span>
    </Action>
  );
}
