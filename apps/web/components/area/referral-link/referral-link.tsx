'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';

import styles from './referral-link.module.css';

/**
 * The referral link with its copy button. The link is shown as selectable text (not only inside a
 * button), copying uses the Clipboard API and says so in a polite status; if the browser refuses, the
 * text is selected so the visitor can copy it by hand.
 *
 * A11y: the URL is plain text in a labelled element; the button is a real `<button>` whose name
 * does not change; the result («Copied») is a `role="status"`.
 */
export function ReferralLink({
  url,
  labels,
}: {
  url: string;
  labels: { link: string; copy: string; copied: string; failed: string };
}) {
  const [message, setMessage] = useState('');
  const text = useRef<HTMLElement>(null);

  async function copy() {
    track('referral_copy');
    try {
      await navigator.clipboard.writeText(url);
      setMessage(labels.copied);
    } catch {
      const selection = window.getSelection();
      if (text.current && selection) {
        selection.selectAllChildren(text.current);
      }
      setMessage(labels.failed);
    }
  }

  return (
    <div className={styles.box}>
      <p className={styles.label} id="referral-link-label">
        {labels.link}
      </p>
      <code ref={text} className={styles.url} aria-labelledby="referral-link-label">
        {url}
      </code>
      <div className={styles.actions}>
        <Button onClick={() => void copy()} variant="ghost" size="sm">
          {labels.copy}
        </Button>
        <p className={styles.status} role="status">
          {message}
        </p>
      </div>
    </div>
  );
}
