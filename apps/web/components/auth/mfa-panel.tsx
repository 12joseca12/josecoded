'use client';

import { useState } from 'react';

import { enrolTotp, removeTotp, verifyTotp } from '@/app/[locale]/(area)/perfil/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import styles from './mfa-panel.module.css';

import type { TotpState } from '@/app/[locale]/(area)/perfil/actions';
import type { Locale } from '@josecoded/types';


export interface MfaPanelProps {
  locale: Locale;
  /** Verified TOTP factor of the user, if any. */
  factorId: string | null;
  /** The session already passed the second factor. */
  verified: boolean;
  labels: {
    lede: string;
    enrolled: string;
    enrol: string;
    scan: string;
    qrAlt: string;
    secret: string;
    codeLabel: string;
    codeHelp: string;
    verify: string;
    challenge: string;
    challengeSubmit: string;
    remove: string;
    removeHelp: string;
    verified: string;
    removed: string;
    form: string;
  };
}

/**
 * TOTP as second factor (DATOS §8.1): enrol (QR + manual key + first code), verify the current code
 * to reach `aal2`, remove. The QR is an SVG data URI built by Supabase for this user; it is shown in
 * an `<img>` (never injected as markup) next to the manual key for people who cannot scan.
 */
export function MfaPanel({ locale, factorId, verified, labels }: MfaPanelProps) {
  const [enrollment, setEnrollment] = useState<TotpState['enrollment']>();

  async function startEnrol(previous: TotpState, data: FormData): Promise<TotpState> {
    const next = await enrolTotp(previous, data);
    setEnrollment(next.enrollment);
    return next;
  }

  if (factorId) {
    return (
      <div className={styles.panel}>
        <p className={styles.status}>{verified ? labels.enrolled : labels.challenge}</p>
        {verified ? null : (
          <Form
            action={verifyTotp}
            submitLabel={labels.challengeSubmit}
            label={labels.challengeSubmit}
          >
            <Field kind="hidden" name="currentLocale" value={locale} />
            <Field kind="hidden" name="factorId" value={factorId} />
            <CodeField labels={labels} />
          </Form>
        )}
        {verified ? (
          <Form action={removeTotp} submitLabel={labels.remove} submitVariant="ghost" label={labels.remove} successMessage={labels.removed}>
            <Field kind="hidden" name="currentLocale" value={locale} />
            <Field kind="hidden" name="factorId" value={factorId} />
            <p className={styles.help}>{labels.removeHelp}</p>
          </Form>
        ) : null}
      </div>
    );
  }

  if (enrollment) {
    return (
      <div className={styles.panel}>
        <p>{labels.scan}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- an SVG data URI generated for this user */}
        <img className={styles.qr} src={enrollment.qrCode} alt={labels.qrAlt} />
        <p className={styles.secret}>
          <span className={styles.help}>{labels.secret}</span>
          <code>{enrollment.secret}</code>
        </p>
        <Form action={verifyTotp} submitLabel={labels.verify} label={labels.verify}>
          <Field kind="hidden" name="currentLocale" value={locale} />
          <Field kind="hidden" name="factorId" value={enrollment.factorId} />
          <CodeField labels={labels} />
        </Form>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <p>{labels.lede}</p>
      <Form action={startEnrol} submitLabel={labels.enrol} label={labels.enrol}>
        <Field kind="hidden" name="currentLocale" value={locale} />
      </Form>
    </div>
  );
}

function CodeField({ labels }: { labels: Pick<MfaPanelProps['labels'], 'codeLabel' | 'codeHelp'> }) {
  return (
    <Field
      kind="text"
      name="code"
      size="code"
      label={labels.codeLabel}
      help={labels.codeHelp}
      autoComplete="one-time-code"
      inputMode="numeric"
      pattern="[0-9]{6}"
      maxLength={6}
      minLength={6}
      spellCheck={false}
      required
    />
  );
}
