import type { MessageKey } from "@/i18n/keys.generated";
import {
  type DeletionLabels,
  profileFieldErrors,
  type ProfileFormLabels,
  type SessionsLabels,
  type TotpManageLabels,
} from "@/types/account";

type Translate = (key: MessageKey) => string;

export function buildProfileLabels(t: Translate): ProfileFormLabels {
  const errors = Object.fromEntries(
    [...profileFieldErrors, "forbidden", "unavailable", "error"].map((code) => [
      code,
      t(`account.profile.errors.${code}` as MessageKey),
    ]),
  ) as ProfileFormLabels["errors"];
  return {
    title: t("account.profile.title"),
    lead: t("account.profile.lead"),
    emailLabel: t("account.profile.emailLabel"),
    emailHint: t("account.profile.emailHint"),
    nameLabel: t("account.profile.nameLabel"),
    localeLabel: t("account.profile.localeLabel"),
    localeHint: t("account.profile.localeHint"),
    localeOptions: { es: t("account.profile.locales.es"), en: t("account.profile.locales.en") },
    save: t("account.profile.save"),
    saving: t("account.profile.saving"),
    saved: t("account.profile.saved"),
    errors,
  };
}

export function buildSessionsLabels(t: Translate): SessionsLabels {
  return {
    title: t("account.access.title"),
    lead: t("account.access.lead"),
    methodsTitle: t("account.access.methodsTitle"),
    email: t("account.access.email"),
    google: t("account.access.google"),
    googleLinked: t("account.access.googleLinked"),
    googleNotLinked: t("account.access.googleNotLinked"),
    others: t("account.access.others"),
    othersLoading: t("account.access.othersLoading"),
    othersDone: t("account.access.othersDone"),
    everywhere: t("account.access.everywhere"),
    everywhereLoading: t("account.access.everywhereLoading"),
    everywhereConfirm: {
      question: t("account.access.everywhereConfirm.question"),
      yes: t("account.access.everywhereConfirm.yes"),
      no: t("account.access.everywhereConfirm.no"),
    },
    error: t("account.access.error"),
  };
}

export function buildTotpLabels(t: Translate): TotpManageLabels {
  return {
    title: t("account.security.title"),
    lead: t("account.security.lead"),
    status: t("account.security.status"),
    statusOn: t("account.security.statusOn"),
    statusOff: t("account.security.statusOff"),
    change: t("account.security.change"),
    starting: t("account.security.starting"),
    scanLabel: t("account.security.scanLabel"),
    qrAlt: t("account.security.qrAlt"),
    secretLabel: t("account.security.secretLabel"),
    codeLabel: t("account.security.codeLabel"),
    codeHint: t("account.security.codeHint"),
    confirm: t("account.security.confirm"),
    confirming: t("account.security.confirming"),
    cancel: t("account.security.cancel"),
    done: t("account.security.done"),
    errors: {
      code_invalid: t("account.security.errors.code_invalid"),
      factor_invalid: t("account.security.errors.factor_invalid"),
    },
    failed: t("account.security.failed"),
    wrongCode: t("account.security.wrongCode"),
    rateLimited: t("account.security.rateLimited"),
  };
}

export function buildDeletionLabels(t: Translate): DeletionLabels {
  return {
    title: t("account.privacy.deletion.title"),
    lead: t("account.privacy.deletion.lead"),
    request: t("account.privacy.deletion.request"),
    requestLoading: t("account.privacy.deletion.requestLoading"),
    confirm: {
      question: t("account.privacy.deletion.confirm.question"),
      yes: t("account.privacy.deletion.confirm.yes"),
      no: t("account.privacy.deletion.confirm.no"),
    },
    pendingTitle: t("account.privacy.deletion.pendingTitle"),
    pendingText: t("account.privacy.deletion.pendingText"),
    withdraw: t("account.privacy.deletion.withdraw"),
    withdrawLoading: t("account.privacy.deletion.withdrawLoading"),
    done: t("account.privacy.deletion.done"),
    withdrawn: t("account.privacy.deletion.withdrawn"),
    errors: {
      forbidden: t("account.privacy.deletion.errors.forbidden"),
      unavailable: t("account.privacy.deletion.errors.unavailable"),
      error: t("account.privacy.deletion.errors.error"),
    },
  };
}
