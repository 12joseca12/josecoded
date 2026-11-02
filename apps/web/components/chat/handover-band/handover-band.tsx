import { LiveDot } from '@/components/ui/live-dot';

import styles from './handover-band.module.css';

/**
 * «Jose ha entrado en la conversación»: shown when the assistant is switched off and a person
 * answers. The green dot is the «alive» signal (a real person is there now).
 *
 * A11y: a polite `role="status"`, so it is announced once when it appears and not read again; the dot
 * is decoration.
 */
export function HandoverBand({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.band} role="status">
      <LiveDot />
      <p className={styles.text}>
        <strong className={styles.title}>{title}</strong> {text}
      </p>
    </div>
  );
}
