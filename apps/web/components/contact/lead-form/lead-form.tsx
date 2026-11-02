'use client';

import { submitContact } from '@/app/[locale]/(public)/contacto/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Turnstile } from '@/components/forms/turnstile';

import { IdempotencyField } from './idempotency-field';
import styles from './lead-form.module.css';
import { SubmitTracker } from './submit-tracker';

import type { LeadFormState } from '@/app/[locale]/(public)/contacto/actions';
import type { ContactVia } from '@/lib/leads/schema';
import type { Href, Locale } from '@josecoded/types';

export interface LeadFormLabels {
  form: string;
  name: string;
  email: string;
  company: string;
  message: string;
  messageHelp: string;
  submit: string;
  sent: string;
  fallbackIntro: string;
  fallbackMail: string;
  fallbackWhatsapp: string;
}

/**
 * The one form for a visitor who writes: `contact` (name, email, message) for a client or anything
 * else, `partner` (adds the agency) for an agency. Server Action with `Form`/`Field`: it works without
 * JavaScript; Turnstile guards it; if the gateway is down the form says so and offers email and WhatsApp.
 *
 * A11y: real labels and `aria-describedby` from `Field`; the error summary is `role="alert"` and takes
 * focus; the confirmation is a polite status; fallback links are plain links in the error area.
 */
export function LeadForm({
  variant,
  locale,
  siteKey,
  via,
  labels,
  email,
  whatsapp,
}: {
  variant: 'contact' | 'partner';
  locale: Locale;
  siteKey: string;
  via?: ContactVia;
  labels: LeadFormLabels;
  email?: string;
  whatsapp?: Href;
}) {
  return (
    <Form<LeadFormState>
      action={submitContact}
      submitLabel={labels.submit}
      label={labels.form}
      successMessage={labels.sent}
      resetOnSuccess
    >
      {(state) => (
        <>
          <Field kind="hidden" name="kind" value={variant} />
          <Field kind="hidden" name="locale" value={locale} />
          {via ? <Field kind="hidden" name="via" value={via} /> : null}
          <IdempotencyField />
          <SubmitTracker via={variant === 'partner' ? 'partner' : (via ?? 'client')} />
          <Field kind="text" name="name" label={labels.name} autoComplete="name" required />
          {variant === 'partner' ? <Field kind="text" name="company" label={labels.company} autoComplete="organization" /> : null}
          <Field kind="email" name="email" label={labels.email} autoComplete="email" inputMode="email" spellCheck={false} required />
          <Field kind="textarea" name="message" label={labels.message} help={labels.messageHelp} maxLength={2000} required />
          <Turnstile siteKey={siteKey} action={variant === 'partner' ? 'partner' : 'contact'} locale={locale} />
          {state.fallback && (email || whatsapp) ? (
            <p className={styles.fallback}>
              {labels.fallbackIntro}{' '}
              {email ? <a href={`mailto:${email}`}>{labels.fallbackMail}</a> : null}
              {email && whatsapp ? ' · ' : null}
              {whatsapp ? <a href={whatsapp}>{labels.fallbackWhatsapp}</a> : null}
            </p>
          ) : null}
        </>
      )}
    </Form>
  );
}
