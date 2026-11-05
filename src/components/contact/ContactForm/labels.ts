import type { MessageKey } from "@/i18n/keys.generated";
import type { ContactFormLabels } from "@/types/contact-form";

type Translate = (key: MessageKey) => string;

export function buildContactFormLabels(t: Translate): ContactFormLabels {
  const p = "contactPage.form" as const;
  return {
    wayLegend: t(`${p}.wayLegend`),
    ways: {
      contratacion: {
        label: t(`${p}.ways.contratacion.label`),
        hint: t(`${p}.ways.contratacion.hint`),
      },
      freelance: { label: t(`${p}.ways.freelance.label`), hint: t(`${p}.ways.freelance.hint`) },
      project: { label: t(`${p}.ways.project.label`), hint: t(`${p}.ways.project.hint`) },
    },
    nameLabel: t(`${p}.nameLabel`),
    emailLabel: t(`${p}.emailLabel`),
    companyLabel: t(`${p}.companyLabel`),
    optional: t(`${p}.optional`),
    messageLabel: t(`${p}.messageLabel`),
    messageHint: t(`${p}.messageHint`),
    consentBefore: t(`${p}.consentBefore`),
    consentLink: t(`${p}.consentLink`),
    consentAfter: t(`${p}.consentAfter`),
    submit: t(`${p}.submit`),
    submitting: t(`${p}.submitting`),
    verificationLabel: t(`${p}.verificationLabel`),
    verificationLoading: t(`${p}.verificationLoading`),
    verificationLoadFailed: t(`${p}.verificationLoadFailed`),
    verificationRetry: t(`${p}.verificationRetry`),
    selection: {
      title: t(`${p}.selection.title`),
      from: t(`${p}.selection.from`),
      review: t(`${p}.selection.review`),
      perMonth: t(`${p}.selection.perMonth`),
      change: t(`${p}.selection.change`),
    },
    summaryOne: t(`${p}.summaryOne`),
    summaryMany: t(`${p}.summaryMany`),
    genericError: t(`${p}.genericError`),
    errors: {
      way_required: t(`${p}.errors.way_required`),
      name_required: t(`${p}.errors.name_required`),
      name_invalid: t(`${p}.errors.name_invalid`),
      name_too_long: t(`${p}.errors.name_too_long`),
      email_required: t(`${p}.errors.email_required`),
      email_invalid: t(`${p}.errors.email_invalid`),
      company_invalid: t(`${p}.errors.company_invalid`),
      company_too_long: t(`${p}.errors.company_too_long`),
      message_required: t(`${p}.errors.message_required`),
      message_too_long: t(`${p}.errors.message_too_long`),
      consent_required: t(`${p}.errors.consent_required`),
      verification_required: t(`${p}.errors.verification_required`),
    },
    sent: {
      title: t(`${p}.sent.title`),
      text: t(`${p}.sent.text`),
      alternative: t(`${p}.sent.alternative`),
      again: t(`${p}.sent.again`),
    },
    quota: {
      title: t(`${p}.quota.title`),
      text: t(`${p}.quota.text`),
      alternative: t(`${p}.quota.alternative`),
    },
    verificationFailed: {
      title: t(`${p}.verificationFailed.title`),
      text: t(`${p}.verificationFailed.text`),
    },
    failed: {
      title: t(`${p}.failed.title`),
      text: t(`${p}.failed.text`),
      alternative: t(`${p}.failed.alternative`),
    },
    unavailable: { title: t(`${p}.unavailable.title`), text: t(`${p}.unavailable.text`) },
    honeypotLabel: t(`${p}.honeypotLabel`),
  };
}
