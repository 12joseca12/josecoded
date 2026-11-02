'use client';

import { useRef } from 'react';

import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

import styles from './chat-composer.module.css';

import type { FormEvent, KeyboardEvent } from 'react';

export interface ChatComposerLabels {
  /** Name of the text box (not drawn: the placeholder and the send button give the context). */
  label: string;
  placeholder: string;
  send: string;
  /** «envía» / «nueva línea», after the keys. */
  hintSend: string;
  hintBreak: string;
  keyEnter: string;
  keyShift: string;
  /** Who answers («Responde un asistente de IA…» or «Te contesta Jose»). */
  note: string;
}

/**
 * Where the visitor writes. Enter sends and Shift+Enter breaks the line; an empty message is not sent
 * and leaves the focus in the box; after sending the box is emptied and keeps the focus so the next
 * line can be typed at once. `onSend` is the screen's: without it (the screen with fixtures) the
 * message is discarded.
 *
 * A11y: a real `<form>` with a labelled textarea (`Field`), a submit button with a visible name, the
 * key hint is text (`Kbd`) and is hidden where there is no keyboard; the box and the button are at
 * least 2.75 rem; no autofocus on load (it would open the keyboard on a phone).
 */
export function ChatComposer({
  labels,
  onSend,
}: {
  labels: ChatComposerLabels;
  onSend?: (text: string) => void;
}) {
  const form = useRef<HTMLFormElement>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const box = form.current?.elements.namedItem('message') as HTMLTextAreaElement | null;
    const text = box?.value.trim() ?? '';
    box?.focus();
    if (!text) return;
    onSend?.(text);
    form.current?.reset();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    event.preventDefault();
    form.current?.requestSubmit();
  };

  return (
    <form ref={form} className={styles.form} onSubmit={submit} onKeyDown={onKeyDown} noValidate>
      <Field
        kind="textarea"
        name="message"
        label={labels.label}
        hideLabel
        placeholder={labels.placeholder}
        rows={2}
        size="compact"
      />
      <div className={styles.row}>
        <p className={styles.note}>{labels.note}</p>
        <p className={styles.hint}>
          <span>
            <Kbd>{labels.keyEnter}</Kbd> {labels.hintSend}
          </span>
          <span>
            <Kbd>{labels.keyShift}</Kbd> <Kbd>{labels.keyEnter}</Kbd> {labels.hintBreak}
          </span>
        </p>
        <Button type="submit" icon="send">
          {labels.send}
        </Button>
      </div>
    </form>
  );
}
