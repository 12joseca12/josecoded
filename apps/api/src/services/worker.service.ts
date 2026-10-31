import { fail, type ApiErrorCode } from '../utils/api-response';

import type { Env } from '../types/env.types';

type WorkerMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type CallWorkerOptions = {
  method?: WorkerMethod;
  body?: unknown;
  /** Overrides the default timeout (10 s) for this call. */
  timeoutMs?: number;
};

export class UpstreamError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** Omen is optional (task 1.8d): the backend integration exists only when both values are set. */
export function isWorkerConfigured(env: Env): env is Env & { WORKER_URL: string; WORKER_INTERNAL_TOKEN: string } {
  return Boolean(env.WORKER_URL && env.WORKER_INTERNAL_TOKEN);
}

/** Thrown instead of calling out when the gateway runs without Omen. Routes answer 503 `worker_not_configured`. */
export class WorkerNotConfiguredError extends UpstreamError {
  constructor() {
    super('Worker backend is not configured', 503, { code: 'worker_not_configured' });
    this.name = 'WorkerNotConfiguredError';
  }
}

export async function callWorker<T>(
  env: Env,
  path: string,
  options: CallWorkerOptions = {},
): Promise<T> {
  if (!isWorkerConfigured(env)) throw new WorkerNotConfiguredError();
  const url = `${env.WORKER_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const hasBody = options.body !== undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    body: hasBody ? JSON.stringify(options.body) : undefined,
    headers: {
      Authorization: `Bearer ${env.WORKER_INTERNAL_TOKEN}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  const rawText = await response.text();
  let data: unknown = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    const preview = rawText.slice(0, 120).replace(/\s+/g, ' ');
    throw new UpstreamError(
      `Worker returned non-JSON (status ${response.status}): ${preview}`,
      response.status,
      { preview },
    );
  }

  if (!response.ok) {
    throw new UpstreamError('Worker request failed', response.status, data);
  }

  return data as T;
}

function upstreamErrorMessage(error: UpstreamError): string {
  const payload = error.data;
  if (payload && typeof payload === 'object') {
    const row = payload as Record<string, unknown>;
    if (typeof row.error === 'string' && row.error.trim()) {
      return row.error;
    }
  }
  return error.message;
}

function upstreamErrorCode(error: UpstreamError): ApiErrorCode {
  if (error instanceof WorkerNotConfiguredError) return 'worker_not_configured';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 409) return 'conflict';
  if (error.status === 504) return 'upstream_error';
  return 'upstream_error';
}

/** HTTP status for the client: 503 when Omen is not configured, otherwise 502 (the upstream failed). */
export function workerFailStatus(error: unknown): 502 | 503 {
  return error instanceof WorkerNotConfiguredError ? 503 : 502;
}

/** El Fastify worker responde `{ ok: true, data: T }`; extrae `data`. */
export function unwrapBackendPayload<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'ok' in raw) {
    const row = raw as { ok?: boolean; data?: T };
    if (row.ok === true && row.data !== undefined) {
      return row.data;
    }
  }
  return raw as T;
}

export function toUpstreamFail(error: unknown) {
  if (error instanceof UpstreamError) {
    const payload = error.data;
    let backendCode: string | undefined;
    if (payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).code === 'string') {
      backendCode = (payload as Record<string, string>).code;
    }
    return fail(upstreamErrorCode(error), upstreamErrorMessage(error), {
      status: error.status,
      backendCode,
      data: payload,
    });
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return fail('upstream_error', 'Gateway timed out waiting for the upstream worker', {
      backendCode: 'GATEWAY_TIMEOUT',
    });
  }
  if (error instanceof Error) {
    return fail('upstream_error', error.message);
  }
  return fail('upstream_error', 'Unknown upstream error');
}
