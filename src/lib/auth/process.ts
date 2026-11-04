import { isKnownIp, normaliseIp } from "@/lib/contact/ip";
import {
  type AuthFieldError,
  type EnrollmentResult,
  type RequestCodeResult,
  requestCodeSchema,
  type VerifyCodeResult,
  verifyCodeSchema,
  type VerifyTotpResult,
  verifyTotpSchema,
} from "@/types/auth";

import type { AuthOutcome } from "./outcome";

export interface RequestCodeDeps {
  rateLimit: (key: string) => Promise<boolean>;
  sendCode: (email: string, captchaToken: string) => Promise<AuthOutcome>;
  reportFailure: (code: string) => void;
}

export interface VerifyCodeDeps {
  rateLimit: (key: string) => Promise<boolean>;
  rateLimitWide: (key: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<AuthOutcome>;
  destination: (locale: string, next: string | undefined) => Promise<string>;
}

export interface TotpDeps {
  identify: () => Promise<string | null>;
  rateLimit: (key: string) => Promise<boolean>;
  verifyTotp: (factorId: string, code: string) => Promise<AuthOutcome>;
  destination: (locale: string, next: string | undefined) => Promise<string>;
}

export type EnrollStart =
  | { ok: true; factorId: string; qrCode: string; secret: string }
  | { ok: false; failure: "unauthenticated" | "already_enrolled" | "rate_limited" | "error" };

function firstError(error: {
  issues: readonly { message: string }[];
}): AuthFieldError | "verification_required" {
  const message = error.issues[0]?.message;
  if (message === "email_required" || message === "code_invalid") return message;
  if (message === "verification_required") return message;
  return "email_invalid";
}

export function emailKey(prefix: string, email: string): string {
  return `${prefix}:${email.trim().toLowerCase()}`;
}

export function totpUserKey(userId: string): string {
  return `totp-user:${userId}`;
}

export function ipKey(prefix: string, ip: string | null): string {
  return `${prefix}:${normaliseIp(ip)}`;
}

export async function processRequestCode(
  raw: unknown,
  context: { ip: string | null; deps: RequestCodeDeps | null },
): Promise<RequestCodeResult> {
  const { ip, deps } = context;
  if (!deps) return { status: "unavailable" };

  const parsed = requestCodeSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", error: firstError(parsed.error) };
  const { email, turnstileToken } = parsed.data;

  if (!isKnownIp(ip)) deps.reportFailure("ip_missing");
  const allowed =
    (await deps.rateLimit(ipKey("otp-ip", ip))) &&
    (await deps.rateLimit(emailKey("otp-email", email)));
  if (!allowed) return { status: "rate_limited" };

  const outcome = await deps.sendCode(email, turnstileToken);
  if (outcome.ok) return { status: "sent" };
  if (outcome.failure === "unknown_user") {
    deps.reportFailure("otp_unknown_user");
    return { status: "sent" };
  }
  if (outcome.failure === "captcha_failed") return { status: "verification_failed" };
  if (outcome.failure === "rate_limited") return { status: "rate_limited" };
  deps.reportFailure("otp_send_failed");
  return { status: "error" };
}

export async function processVerifyCode(
  raw: unknown,
  context: { ip: string | null; deps: VerifyCodeDeps | null },
): Promise<VerifyCodeResult> {
  const { ip, deps } = context;
  if (!deps) return { status: "unavailable" };

  const parsed = verifyCodeSchema.safeParse(raw);
  if (!parsed.success) {
    const error = firstError(parsed.error);
    return { status: "invalid", error: error === "verification_required" ? "code_invalid" : error };
  }
  const { email, code, locale, next } = parsed.data;

  const pairKey = `verify:${email.trim().toLowerCase()}|${normaliseIp(ip)}`;
  const allowed =
    (await deps.rateLimit(pairKey)) && (await deps.rateLimitWide(emailKey("verify-email", email)));
  if (!allowed) return { status: "rate_limited" };

  const outcome = await deps.verifyCode(email, code);
  if (outcome.ok) return { status: "ok", destination: await deps.destination(locale, next) };
  if (outcome.failure === "rate_limited") return { status: "rate_limited" };
  if (outcome.failure === "wrong_code" || outcome.failure === "unknown_user") {
    return { status: "wrong_code" };
  }
  return { status: "error" };
}

export async function processVerifyTotp(
  raw: unknown,
  context: { ip: string | null; deps: TotpDeps | null },
): Promise<VerifyTotpResult> {
  const { ip, deps } = context;
  if (!deps) return { status: "unavailable" };

  const parsed = verifyTotpSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message;
    return {
      status: "invalid",
      error: message === "factor_invalid" ? "factor_invalid" : "code_invalid",
    };
  }
  const { factorId, code, locale, next } = parsed.data;

  const userId = await deps.identify();
  if (userId === null) return { status: "unauthenticated" };
  const allowed =
    (await deps.rateLimit(ipKey("totp-ip", ip))) && (await deps.rateLimit(totpUserKey(userId)));
  if (!allowed) return { status: "rate_limited" };

  const outcome = await deps.verifyTotp(factorId, code);
  if (outcome.ok) return { status: "ok", destination: await deps.destination(locale, next) };
  if (outcome.failure === "rate_limited") return { status: "rate_limited" };
  if (outcome.failure === "unauthenticated") return { status: "unauthenticated" };
  if (outcome.failure === "wrong_code" || outcome.failure === "unknown_user") {
    return { status: "wrong_code" };
  }
  return { status: "error" };
}

export function mapEnrollment(result: EnrollStart | null): EnrollmentResult {
  if (result === null) return { status: "unavailable" };
  if (result.ok) {
    return {
      status: "ready",
      factorId: result.factorId,
      qrCode: result.qrCode,
      secret: result.secret,
    };
  }
  if (result.failure === "unauthenticated" || result.failure === "already_enrolled") {
    return { status: "unauthenticated" };
  }
  if (result.failure === "rate_limited") return { status: "rate_limited" };
  return { status: "error" };
}
