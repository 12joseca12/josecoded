import { z } from "zod";

import { locales } from "@/i18n/config";

export const userRoles = ["admin", "closer", "freelance", "client"] as const;
export type UserRole = (typeof userRoles)[number];

export const zones = ["admin", "crm", "freelance", "area"] as const;
export type Zone = (typeof zones)[number];

export const assuranceLevels = ["aal1", "aal2"] as const;
export type AssuranceLevel = (typeof assuranceLevels)[number];

export const otpLength = 6;
export const otpPattern = /^\d{6}$/;
export const resendCooldownSeconds = 60;

const nextPath = z.string().max(300).optional();

export const requestCodeSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .min(1, "email_required")
    .max(320, "email_invalid")
    .pipe(z.email("email_invalid")),
  turnstileToken: z.string().min(1, "verification_required").max(2048, "verification_required"),
  locale: z.enum(locales),
});
export type RequestCodeInput = z.infer<typeof requestCodeSchema>;

export const verifyCodeSchema = z.strictObject({
  email: z.string().trim().max(320).pipe(z.email("email_invalid")),
  code: z.string().trim().regex(otpPattern, "code_invalid"),
  locale: z.enum(locales),
  next: nextPath,
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const verifyTotpSchema = z.strictObject({
  factorId: z.uuid("factor_invalid"),
  code: z.string().trim().regex(otpPattern, "code_invalid"),
  locale: z.enum(locales),
  next: nextPath,
});
export type VerifyTotpInput = z.infer<typeof verifyTotpSchema>;

export const googleStartSchema = z.strictObject({ locale: z.enum(locales), next: nextPath });
export type GoogleStartInput = z.infer<typeof googleStartSchema>;

export type GoogleStartResult =
  { status: "redirect"; url: string } | { status: "unavailable" } | { status: "error" };

export type AuthFieldError = "email_required" | "email_invalid" | "code_invalid";

export type RequestCodeResult =
  | { status: "sent" }
  | { status: "invalid"; error: AuthFieldError | "verification_required" }
  | { status: "verification_failed" }
  | { status: "rate_limited" }
  | { status: "unavailable" }
  | { status: "error" };

export type VerifyCodeResult =
  | { status: "ok"; destination: string }
  | { status: "invalid"; error: AuthFieldError }
  | { status: "wrong_code" }
  | { status: "rate_limited" }
  | { status: "unavailable" }
  | { status: "error" };

export type EnrollmentResult =
  | { status: "ready"; factorId: string; qrCode: string; secret: string }
  | { status: "unauthenticated" }
  | { status: "unavailable" }
  | { status: "rate_limited" }
  | { status: "error" };

export type VerifyTotpResult =
  | { status: "ok"; destination: string }
  | { status: "invalid"; error: AuthFieldError | "factor_invalid" }
  | { status: "wrong_code" }
  | { status: "unauthenticated" }
  | { status: "rate_limited" }
  | { status: "unavailable" }
  | { status: "error" };

export interface NoticeLabels {
  title: string;
  text: string;
}

export interface AuthFormLabels {
  title: string;
  lead: string;
  emailLabel: string;
  emailHint: string;
  send: string;
  sending: string;
  verificationLabel: string;
  verificationLoading: string;
  verificationLoadFailed: string;
  verificationRetry: string;
  codeTitle: string;
  codeLead: string;
  codeLabel: string;
  codeHint: string;
  verify: string;
  verifying: string;
  resend: string;
  resendIn: string;
  resent: string;
  changeEmail: string;
  errors: Record<string, string>;
  genericError: string;
  wrongCode: NoticeLabels;
  rateLimited: NoticeLabels;
  verificationFailed: NoticeLabels;
  failed: NoticeLabels;
  unavailable: NoticeLabels;
  google: string;
  googleDivider: string;
}

export interface TotpFormLabels {
  enrollTitle: string;
  enrollLead: string;
  enrollStart: string;
  enrollStarting: string;
  scanLabel: string;
  qrAlt: string;
  secretLabel: string;
  challengeTitle: string;
  challengeLead: string;
  codeLabel: string;
  codeHint: string;
  verify: string;
  verifying: string;
  lostDevice: string;
  lostDeviceLink: string;
  errors: Record<string, string>;
  genericError: string;
  wrongCode: NoticeLabels;
  rateLimited: NoticeLabels;
  failed: NoticeLabels;
  unavailable: NoticeLabels;
}
