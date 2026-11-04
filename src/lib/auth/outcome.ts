export interface AuthErrorLike {
  status?: number | undefined;
  code?: string | undefined;
  name?: string | undefined;
}

export type AuthFailure =
  "rate_limited" | "unknown_user" | "wrong_code" | "unauthenticated" | "error";

export type AuthOutcome = { ok: true } | { ok: false; failure: AuthFailure };

const rateLimitCodes = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "over_sms_send_rate_limit",
]);

function isRateLimited(error: AuthErrorLike): boolean {
  return error.status === 429 || (error.code !== undefined && rateLimitCodes.has(error.code));
}

function isServerFault(error: AuthErrorLike): boolean {
  if (error.name === "AuthRetryableFetchError" || error.name === "AuthUnknownError") return true;
  const status = error.status ?? 0;
  return status === 0 || status >= 500;
}

export function classifySendError(error: AuthErrorLike): AuthFailure {
  if (isRateLimited(error)) return "rate_limited";
  if (isServerFault(error)) return "error";
  return "unknown_user";
}

export function classifyCodeError(error: AuthErrorLike): AuthFailure {
  if (isRateLimited(error)) return "rate_limited";
  if (isServerFault(error)) return "error";
  if (error.status === 401 && error.code === "session_not_found") return "unauthenticated";
  if (error.code === "not_authenticated" || error.code === "session_expired") {
    return "unauthenticated";
  }
  return "wrong_code";
}
