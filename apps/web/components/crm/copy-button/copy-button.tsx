'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';

import styles from './copy-button.module.css';

/**
 * A value copied with one click (the email of the contact), written out in the button itself so it can also be
 * read and selected by hand. Copying says so in a polite status that is emptied and filled again on every copy,
 * so a second copy is announced too; if the browser refuses the clipboard, the status says it failed.
 */
export function CopyButton({
  value,
  label,
  labels,
}: {
  value: string;
  /** Names the action for assistive technology: «Copiar email». */
  label: string;
  labels: { copied: string; failed: string };
}) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function announce(next: string) {
    clearTimeout(timer.current);
    setMessage('');
    timer.current = setTimeout(() => setMessage(next), 60);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      announce(labels.copied);
    } catch {
      announce(labels.failed);
    }
  }

  return (
    <>
      <button type="button" className={styles.button} aria-label={`${label}: ${value}`} onClick={copy}>
        <Icon name="user-round" />
        <span className={styles.value}>{value}</span>
        <Icon name="copy" />
      </button>
      <span className="sr-only" role="status">
        {message}
      </span>
    </>
  );
}
