import { Action } from '@/components/ui/action';

import styles from './privacy-notice.module.css';

/**
 * First layer of the privacy information (RGPD art. 13), shown next to the submit button of every form
 * that collects personal data: who uses the data and why in a few lines, and a link to the full policy.
 * Both texts arrive translated from the page.
 *
 * A11y: plain paragraph, read in order before the button; the link has its own visible name.
 */
export function PrivacyNotice({ text, linkLabel }: { text: string; linkLabel: string }) {
  return (
    <p className={styles.notice}>
      {text}{' '}
      <Action href="/legal/privacidad" className={styles.link}>
        {linkLabel}
      </Action>
    </p>
  );
}
