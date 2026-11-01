import { fail, type ApiErrorCode } from './api-response';

/** Statuses a route may answer with on purpose (the rest is an unexpected error: 500). */
export type HttpErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 500 | 502 | 503;

/**
 * An expected failure of a request (bad input, bot check, quota...). `app.onError` turns it into the standard
 * `{ ok: false, error }` body with `message` as written here, so a message must never carry a cause, a stack, a
 * query or anything a caller sent.
 */
export class HttpError extends Error {
  readonly status: HttpErrorStatus;
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly headers?: Record<string, string>;

  constructor(
    status: HttpErrorStatus,
    code: ApiErrorCode,
    message: string,
    options: { details?: unknown; headers?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = options.details;
    this.headers = options.headers;
  }

  toBody() {
    return fail(this.code, this.message, this.details);
  }
}

/** One structured log line. Callers pass ids and codes only: never message text, emails, IPs or tokens. */
export function logEvent(scope: string, action: string, extra: Record<string, string | number | boolean> = {}): void {
  console.error(JSON.stringify({ scope, action, ...extra }));
}
