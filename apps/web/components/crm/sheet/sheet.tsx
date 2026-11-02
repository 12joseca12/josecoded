'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';

import { SheetContext } from './sheet-context';
import styles from './sheet.module.css';

import type { SheetVariant } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * A modal over the screen, the way the CRM asks for something: a side sheet from 48rem and a bottom sheet below
 * it (`side`), or a small centred dialog for a decision (`dialog`). It is a native `<dialog>`: the browser traps
 * focus, Esc closes it and the focus returns to what opened it. Its body is remounted every time it opens, so a
 * form inside starts from the fresh data of the page and forgets the last answer.
 *
 * Closing: Esc, the backdrop, the close button, or `useSheet().saved()` when a form inside is done (the sheet
 * closes and `savedMessage` is announced in a polite status that lives outside the dialog, so it survives it).
 *
 * A11y: named by its title; `aria-describedby` points at the description when there is one; the status region is
 * always in the DOM; with reduced motion nothing slides.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  variant = 'side',
  closeLabel,
  savedMessage,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: SheetVariant;
  /** Already translated: the accessible name of the close button. */
  closeLabel: string;
  /** Already translated: announced when a form inside is saved. */
  savedMessage: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [message, setMessage] = useState('');
  const [wasOpen, setWasOpen] = useState(open);
  const [session, setSession] = useState(0);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((value) => value + 1);
  }
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // the `open` prop is the source of truth; the dialog follows it
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function saved() {
    clearTimeout(timer.current);
    setMessage('');
    timer.current = setTimeout(() => setMessage(savedMessage), 60);
    onClose();
  }

  return (
    <>
      <dialog
        ref={dialog}
        className={styles.sheet}
        data-variant={variant}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClose={onClose}
        onClick={(event) => {
          // a click on the dialog itself is a click on its backdrop (the content fills the box)
          if (event.target === dialog.current) onClose();
        }}
      >
        <span className={styles.grabber} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} aria-label={closeLabel} onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <SheetContext value={{ saved, close: onClose }} key={session}>
          <div className={styles.body}>
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
            {children}
          </div>
        </SheetContext>
      </dialog>
      <span className="sr-only" role="status">
        {message}
      </span>
    </>
  );
}
