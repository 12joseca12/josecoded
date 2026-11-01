'use client';

import { requestOtp } from '@/app/[locale]/(auth)/auth/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Turnstile } from '@/components/forms/turnstile';

import { AudienceField } from './audience-field';

import type { Locale } from '@josecoded/types';


export interface EmailFormProps {
  locale: Locale;
  siteKey: string;
  next?: string;
  audience?: string;
  defaultEmail?: string;
  /** Translated strings (the page owns the copy). */
  labels: { email: string; help: string; submit: string; form: string };
}

/** Email step: asks for the 6-digit code. CAPTCHA first, then Supabase sends the email. */
export function EmailForm({ locale, siteKey, next, audience, defaultEmail, labels }: EmailFormProps) {
  return (
    <Form action={requestOtp} submitLabel={labels.submit} label={labels.form}>
      <Field kind="hidden" name="locale" value={locale} />
      <Field kind="hidden" name="next" value={next ?? ''} />
      <AudienceField initial={audience} />
      <Field
        kind="email"
        name="email"
        label={labels.email}
        help={labels.help}
        autoComplete="email"
        inputMode="email"
        defaultValue={defaultEmail}
        spellCheck={false}
        required
      />
      <Turnstile siteKey={siteKey} action="login" locale={locale} />
    </Form>
  );
}
