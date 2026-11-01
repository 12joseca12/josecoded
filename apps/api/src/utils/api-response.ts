export type ApiErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'upstream_error'
  | 'worker_not_configured'
  | 'moderation_unavailable'
  | 'content_rejected'
  | 'bot_check_failed'
  | 'quota_exceeded'
  | 'payload_too_large'
  | 'unsupported_media_type'
  | 'service_unavailable'
  | 'invalid_proposal'
  | 'internal_error';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiFail = {
  ok: false;
  error: ApiError;
};

export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

export function fail(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): ApiFail {
  return { ok: false, error: { code, message, details } };
}

