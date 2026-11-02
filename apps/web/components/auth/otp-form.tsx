'use client';

import { verifyOtp } from '@/app/[locale]/(auth)/auth/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { Locale } from '@josecoded/types';


export interface OtpFormProps {
  locale: Locale;
  next?: string;
  audience?: string;
  labels: { code: string; help: string; submit: string; form: string };
  /** Link back to the email step (another address, or another code). */
  actions?: React.ReactNode;
}

/**
 * One field for the six digits, not six boxes: `autocomplete="one-time-code"` lets the phone fill it
 * from the email or SMS, pasting works, and a screen reader meets a single labelled input.
 */
export function OtpForm({ locale, next, audience, labels, actions }: OtpFormProps) {
  return (
    <Form action={verifyOtp} submitLabel={labels.submit} label={labels.form} actions={actions}>
      <Field kind="hidden" name="locale" value={locale} />
      <Field kind="hidden" name="next" value={next ?? ''} />
      <Field kind="hidden" name="audience" value={audience ?? ''} />
      <Field
        kind="text"
        name="token"
        size="code"
        label={labels.code}
        help={labels.help}
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        minLength={6}
        spellCheck={false}
        autoFocus
        required
      />
    </Form>
  );
}
