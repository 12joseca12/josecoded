'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import styles from './copy-field.module.css';

/**
 * A value people copy (the email, a link) shown as selectable text with its copy button. Copying uses
 * the Clipboard API and says so in a polite status; if the browser refuses, the text is selected so
 * the visitor can copy it by hand. `onCopy` is the hook for the page's analytics event.
 *
 * A11y: the value is plain text next to its visible label (not only inside a button); the button is a real
 * `<button>` whose name starts with its visible text and names the object («Copiar: Email»); the result
 * is a `role="status"` that is cleared and filled again on every copy, so a repeat copy is announced too.
 */
export function CopyField({
  label,
  value,
  labels,
  onCopy,
}: {
  label: string;
  value: string;
  labels: { copy: string; copied: string; failed: string };
  onCopy?: () => void;
}) {
  const [message, setMessage] = useState('');
  const text = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  /** An identical text does not make a screen reader speak again: empty the region first, then fill it. */
  function announce(next: string) {
    clearTimeout(timer.current);
    setMessage('');
    timer.current = setTimeout(() => setMessage(next), 60);
  }

  async function copy() {
    onCopy?.();
    try {
      await navigator.clipboard.writeText(value);
      announce(labels.copied);
    } catch {
      const selection = window.getSelection();
      if (text.current && selection) selection.selectAllChildren(text.current);
      announce(labels.failed);
    }
  }

  return (
    <div className={styles.box}>
      <p className={styles.label}>
        {label}
      </p>
      <div className={styles.row}>
        <code ref={text} className={styles.value}>
          {value}
        </code>
        <Button onClick={() => void copy()} variant="ghost" size="sm" aria-label={`${labels.copy}: ${label}`}>
          {labels.copy}
        </Button>
      </div>
      <p className={styles.status} role="status">
        {message}
      </p>
    </div>
  );
}
