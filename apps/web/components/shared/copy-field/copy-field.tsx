'use client';

import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import styles from './copy-field.module.css';

/**
 * A value people copy (the email, a link) shown as selectable text with its copy button. Copying uses
 * the Clipboard API and says so in a polite status; if the browser refuses, the text is selected so
 * the visitor can copy it by hand. `onCopy` is the hook for the page's analytics event.
 *
 * A11y: the value is plain text in a labelled element (not only inside a button); the button is a real
 * `<button>` whose name does not change; the result is a `role="status"`.
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
  const labelId = useId();

  async function copy() {
    onCopy?.();
    try {
      await navigator.clipboard.writeText(value);
      setMessage(labels.copied);
    } catch {
      const selection = window.getSelection();
      if (text.current && selection) selection.selectAllChildren(text.current);
      setMessage(labels.failed);
    }
  }

  return (
    <div className={styles.box}>
      <p className={styles.label} id={labelId}>
        {label}
      </p>
      <div className={styles.row}>
        <code ref={text} className={styles.value} aria-labelledby={labelId}>
          {value}
        </code>
        <Button onClick={() => void copy()} variant="ghost" size="sm">
          {labels.copy}
        </Button>
      </div>
      <p className={styles.status} role="status">
        {message}
      </p>
    </div>
  );
}
