'use client';

import { useState } from 'react';

import { Field } from '@/components/forms/field';
import { Button } from '@/components/ui/button';

import styles from './leave-contact.module.css';

import type { FormEvent } from 'react';

export interface LeaveContactLabels {
  label: string;
  placeholder: string;
  submit: string;
  saved: string;
  invalid: string;
  failed: string;
}

export type LeaveContactResult = 'saved' | 'invalid' | 'failed';

/**
 * «Déjame un correo o un teléfono»: one box, the gateway creates the lead. `onSubmit` gets the raw text (the screen
 * decides email or phone) and answers with the outcome; the text is never kept after it is saved.
 *
 * A11y: a labelled field and a named button; the outcome is a polite `role="status"` line, an error is `role="alert"`.
 */
export function LeaveContact({ labels, onSubmit }: { labels: LeaveContactLabels; onSubmit: (value: string) => Promise<LeaveContactResult> }) {
  const [result, setResult] = useState<LeaveContactResult | 'idle'>('idle');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get('contact') ?? '').trim();
    if (!value || busy) return;
    setBusy(true);
    const outcome = await onSubmit(value);
    setBusy(false);
    setResult(outcome);
    if (outcome === 'saved') form.reset();
  };

  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)} noValidate>
      <div className={styles.row}>
        <Field name="contact" label={labels.label} placeholder={labels.placeholder} autoComplete="email" maxLength={320} size="compact" />
        <Button type="submit" variant="ghost" disabled={busy}>
          {labels.submit}
        </Button>
      </div>
      {result === 'saved' ? <p role="status" className={styles.line}>{labels.saved}</p> : null}
      {result === 'invalid' || result === 'failed' ? (
        <p role="alert" className={styles.line}>
          {result === 'invalid' ? labels.invalid : labels.failed}
        </p>
      ) : null}
    </form>
  );
}
