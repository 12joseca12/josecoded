import "@/lib/security/zod-jitless";

import { z } from "zod";

import { locales } from "@/i18n/config";

export const profileInputSchema = z.strictObject({
  fullName: z.string().trim().min(1, "name_required").max(200, "name_too_long"),
  locale: z.enum(locales, "locale_invalid"),
});

export const profileFieldErrors = ["name_required", "name_too_long", "locale_invalid"] as const;
export type ProfileFieldError = (typeof profileFieldErrors)[number];

export type AccountFailure = "forbidden" | "unavailable" | "error";

export type ProfileResult =
  | { status: "done"; fullName: string; locale: string }
  | { status: "invalid"; error: ProfileFieldError }
  | { status: "error"; code: AccountFailure };

export type AccountSource<T> =
  { status: "ok"; data: T } | { status: "unavailable" } | { status: "error" };

export interface AccountProfile {
  fullName: string;
  locale: string;
  createdAt: string;
}

export const profileRowSchema = z.object({
  full_name: z.string(),
  locale: z.enum(locales),
  created_at: z.string(),
});

export type DeletionResult =
  { status: "done"; requestedAt: string | null } | { status: "error"; code: AccountFailure };

export const sessionScopes = ["others", "global"] as const;
export type SessionScope = (typeof sessionScopes)[number];
export const sessionScopeSchema = z.enum(sessionScopes);

export type SessionScopeResult = { status: "done" } | { status: "error" };

export const totpChangeSchema = z.strictObject({
  factorId: z.uuid("factor_invalid"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "code_invalid"),
});

export type TotpChangeResult =
  | { status: "done" }
  | { status: "invalid"; error: "code_invalid" | "factor_invalid" }
  | { status: "wrong_code" }
  | { status: "rate_limited" }
  | { status: "unauthenticated" }
  | { status: "error" };

export interface AccountSignIn {
  google: boolean;
}

export interface ConfirmLabels {
  question: string;
  yes: string;
  no: string;
}

export interface ProfileFormLabels {
  title: string;
  lead: string;
  emailLabel: string;
  emailHint: string;
  nameLabel: string;
  localeLabel: string;
  localeHint: string;
  localeOptions: Record<string, string>;
  save: string;
  saving: string;
  saved: string;
  errors: Record<ProfileFieldError | AccountFailure, string>;
}

export interface SessionsLabels {
  title: string;
  lead: string;
  methodsTitle: string;
  email: string;
  google: string;
  googleLinked: string;
  googleNotLinked: string;
  others: string;
  othersLoading: string;
  othersDone: string;
  everywhere: string;
  everywhereLoading: string;
  everywhereConfirm: ConfirmLabels;
  error: string;
}

export interface TotpManageLabels {
  title: string;
  lead: string;
  status: string;
  statusOn: string;
  statusOff: string;
  change: string;
  starting: string;
  scanLabel: string;
  qrAlt: string;
  secretLabel: string;
  codeLabel: string;
  codeHint: string;
  confirm: string;
  confirming: string;
  cancel: string;
  done: string;
  errors: Record<string, string>;
  failed: string;
  wrongCode: string;
  rateLimited: string;
}

export interface DeletionLabels {
  title: string;
  lead: string;
  request: string;
  requestLoading: string;
  confirm: ConfirmLabels;
  pendingTitle: string;
  pendingText: string;
  withdraw: string;
  withdrawLoading: string;
  done: string;
  withdrawn: string;
  errors: Record<AccountFailure, string>;
}
