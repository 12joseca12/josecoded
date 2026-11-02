'use client';

import { subscribeToGuides } from '@/app/[locale]/(public)/blog/actions';
import { IdempotencyField } from '@/components/contact/lead-form/idempotency-field';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';
import { Turnstile } from '@/components/forms/turnstile';
import { Surface } from '@/components/ui/surface';

import styles from './notify-block.module.css';

import type { NotifyState } from '@/app/[locale]/(public)/blog/actions';
import type { Locale } from '@josecoded/types';

export interface NotifyBlockLabels {
  title: string;
  text: string;
  email: string;
  submit: string;
  sent: string;
}

/**
 * «Avísame de nuevas guías»: one email field and its (ghost: the page's one violet action is the closing) button, at the foot of a guide.
 * Server Action (`subscribeToGuides`) with `Form`/`Field`: it works without JavaScript, Turnstile guards it and the email
 * arrives at the CRM as a contact tagged `newsletter_interest` (`POST /leads`, `source: 'web_notify'`).
 *
 * A11y: a `section` named by its `h2`; the field has a real label and `autocomplete="email"`; errors and the
 * confirmation come from `Form` (alert summary and polite status).
 */
export function NotifyBlock({ labels, locale, siteKey }: { labels: NotifyBlockLabels; locale: Locale; siteKey: string }) {
  return (
    <Surface as="section" radius="tcard" aria-labelledby="notify-title">
      <div className={styles.inner}>
        <h2 id="notify-title" className={styles.title}>
          {labels.title}
        </h2>
        <p className={styles.text}>{labels.text}</p>
        <Form<NotifyState> action={subscribeToGuides} submitLabel={labels.submit} submitVariant="ghost" label={labels.title} successMessage={labels.sent} resetOnSuccess>
          <Field kind="hidden" name="locale" value={locale} />
          <IdempotencyField />
          <Field kind="email" name="email" label={labels.email} autoComplete="email" inputMode="email" spellCheck={false} required />
          <Turnstile siteKey={siteKey} action="notify" locale={locale} />
        </Form>
      </div>
    </Surface>
  );
}
