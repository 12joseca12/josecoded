import type { MessageKey } from "@/i18n/keys.generated";
import type { AuthFormLabels, TotpFormLabels } from "@/types/auth";

type Translate = (key: MessageKey) => string;

export function buildAuthFormLabels(t: Translate): AuthFormLabels {
  const p = "auth.login" as const;
  return {
    title: t(`${p}.title`),
    lead: t(`${p}.lead`),
    emailLabel: t(`${p}.emailLabel`),
    emailHint: t(`${p}.emailHint`),
    send: t(`${p}.send`),
    sending: t(`${p}.sending`),
    verificationLabel: t(`${p}.verificationLabel`),
    verificationLoading: t(`${p}.verificationLoading`),
    verificationLoadFailed: t(`${p}.verificationLoadFailed`),
    verificationRetry: t(`${p}.verificationRetry`),
    codeTitle: t(`${p}.codeTitle`),
    codeLead: t(`${p}.codeLead`),
    codeLabel: t(`${p}.codeLabel`),
    codeHint: t(`${p}.codeHint`),
    verify: t(`${p}.verify`),
    verifying: t(`${p}.verifying`),
    resend: t(`${p}.resend`),
    resendIn: t(`${p}.resendIn`),
    resent: t(`${p}.resent`),
    changeEmail: t(`${p}.changeEmail`),
    genericError: t(`${p}.genericError`),
    errors: {
      email_required: t(`${p}.errors.email_required`),
      email_invalid: t(`${p}.errors.email_invalid`),
      code_invalid: t(`${p}.errors.code_invalid`),
      verification_required: t(`${p}.errors.verification_required`),
    },
    wrongCode: { title: t(`${p}.wrongCode.title`), text: t(`${p}.wrongCode.text`) },
    rateLimited: { title: t(`${p}.rateLimited.title`), text: t(`${p}.rateLimited.text`) },
    verificationFailed: {
      title: t(`${p}.verificationFailed.title`),
      text: t(`${p}.verificationFailed.text`),
    },
    failed: { title: t(`${p}.failed.title`), text: t(`${p}.failed.text`) },
    unavailable: { title: t(`${p}.unavailable.title`), text: t(`${p}.unavailable.text`) },
    google: t(`${p}.google`),
    googleDivider: t(`${p}.googleDivider`),
  };
}

export function buildTotpFormLabels(t: Translate): TotpFormLabels {
  const p = "auth.totp" as const;
  return {
    enrollTitle: t(`${p}.enrollTitle`),
    enrollLead: t(`${p}.enrollLead`),
    enrollStart: t(`${p}.enrollStart`),
    enrollStarting: t(`${p}.enrollStarting`),
    scanLabel: t(`${p}.scanLabel`),
    qrAlt: t(`${p}.qrAlt`),
    secretLabel: t(`${p}.secretLabel`),
    challengeTitle: t(`${p}.challengeTitle`),
    challengeLead: t(`${p}.challengeLead`),
    codeLabel: t(`${p}.codeLabel`),
    codeHint: t(`${p}.codeHint`),
    verify: t(`${p}.verify`),
    verifying: t(`${p}.verifying`),
    lostDevice: t(`${p}.lostDevice`),
    lostDeviceLink: t(`${p}.lostDeviceLink`),
    genericError: t(`${p}.genericError`),
    errors: {
      code_invalid: t(`${p}.errors.code_invalid`),
      factor_invalid: t(`${p}.errors.factor_invalid`),
    },
    wrongCode: { title: t(`${p}.wrongCode.title`), text: t(`${p}.wrongCode.text`) },
    rateLimited: { title: t(`${p}.rateLimited.title`), text: t(`${p}.rateLimited.text`) },
    failed: { title: t(`${p}.failed.title`), text: t(`${p}.failed.text`) },
    unavailable: { title: t(`${p}.unavailable.title`), text: t(`${p}.unavailable.text`) },
  };
}
