'use client';

import { sendProposal } from '@/app/[locale]/(public)/propuesta/actions';
import { IdempotencyField } from '@/components/contact/lead-form/idempotency-field';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Turnstile } from '@/components/forms/turnstile';

import { SendTracker } from './send-tracker';

import type { SendProposalState } from '@/app/[locale]/(public)/propuesta/actions';
import type { Href, Locale } from '@josecoded/types';

export interface SendFormLabels {
  title: string;
  text: string;
  label: string;
  name: string;
  email: string;
  phone: string;
  submit: string;
  sent: string;
  fallbackIntro: string;
  fallbackMail: string;
  fallbackWhatsapp: string;
}

/**
 * Last step: the visitor sends the proposal they were shown. Server Action with `Form`/`Field`;
 * the signed proposal token travels in a hidden field, Turnstile guards it (`proposal_send`) and a
 * gateway that is down gets an email and WhatsApp fallback.
 */
export function SendForm({
  locale,
  siteKey,
  proposalToken,
  pack,
  labels,
  email,
  whatsapp,
}: {
  locale: Locale;
  siteKey: string;
  proposalToken: string;
  pack: string;
  labels: SendFormLabels;
  email?: string;
  whatsapp?: Href;
}) {
  return (
    <section aria-labelledby="send-title">
      <h2 id="send-title">{labels.title}</h2>
      <p>{labels.text}</p>
      <Form<SendProposalState> action={sendProposal} submitLabel={labels.submit} label={labels.label} successMessage={labels.sent}>
        {(state) => (
          <>
            <Field kind="hidden" name="locale" value={locale} />
            <Field kind="hidden" name="proposalToken" value={proposalToken} />
            <Field kind="hidden" name="pack" value={pack} />
            <IdempotencyField />
            <SendTracker />
            <Field kind="text" name="name" label={labels.name} autoComplete="name" required />
            <Field kind="email" name="email" label={labels.email} autoComplete="email" inputMode="email" spellCheck={false} required />
            <Field kind="tel" name="phone" label={labels.phone} autoComplete="tel" inputMode="tel" />
            <Turnstile siteKey={siteKey} action="proposal_send" locale={locale} />
            {state.fallback && (email || whatsapp) ? (
              <p>
                {labels.fallbackIntro} {email ? <a href={`mailto:${email}`}>{labels.fallbackMail}</a> : null}
                {email && whatsapp ? ' · ' : null}
                {whatsapp ? <a href={whatsapp}>{labels.fallbackWhatsapp}</a> : null}
              </p>
            ) : null}
          </>
        )}
      </Form>
    </section>
  );
}
