import type { MessageKey } from "@/i18n/keys.generated";
import { withResponseTime } from "@/lib/common/response-time";
import type { ContactCopyKey, ContactFormLabels } from "@/types/contact-form";
import type { WayId } from "@/types/services";

type Translate = (key: MessageKey) => string;

function steps(t: Translate, key: ContactCopyKey): string[] {
  const base = `contactPage.form.next.steps.${key}` as const;
  return [t(`${base}.s1`), t(`${base}.s2`), t(`${base}.s3`)].map((step) =>
    withResponseTime(t, step),
  );
}

function sentCopy(t: Translate, way: WayId) {
  const base = `contactPage.form.sent.byWay.${way}` as const;
  return {
    text: t(`${base}.text`),
    next: t(`${base}.next`),
  };
}

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
      provisional: t(`${p}.selection.provisional`),
      perMonth: t(`${p}.selection.perMonth`),
      change: t(`${p}.selection.change`),
      warranty: t(`${p}.selection.warranty`),
      proposal: t(`${p}.selection.proposal`),
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
    next: {
      title: t(`${p}.next.title`),
      noCommitment: t(`${p}.next.noCommitment`),
      steps: {
        any: steps(t, "any"),
        contratacion: steps(t, "contratacion"),
        freelance: steps(t, "freelance"),
        project: steps(t, "project"),
      },
    },
    example: {
      summary: t(`${p}.example.summary`),
      byWay: {
        any: t(`${p}.example.any`),
        contratacion: t(`${p}.example.contratacion`),
        freelance: t(`${p}.example.freelance`),
        project: t(`${p}.example.project`),
      },
    },
    sent: {
      title: t(`${p}.sent.title`),
      nextTitle: t(`${p}.sent.nextTitle`),
      alternative: t(`${p}.sent.alternative`),
      again: t(`${p}.sent.again`),
      byWay: {
        contratacion: sentCopy(t, "contratacion"),
        freelance: sentCopy(t, "freelance"),
        project: sentCopy(t, "project"),
      },
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
