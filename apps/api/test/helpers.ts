import { app } from '../src/index';

import type { Deps } from '../src/deps';
import type { Env } from '../src/types/env.types';

/** Bindings of a test request: production mode (no error detail), a site origin allow-list and the given fakes. */
export const baseEnv = {
  API_MODE: 'production',
  CORS_ORIGINS: 'https://josecoded.com,http://localhost:3000',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
  SERVER_KEY: 'server-key-test-0123456789abcdef',
  CHAT_SID_SECRET: 'chat-sid-secret-test-0123456789abcdef0123456789',
} satisfies Env;

export function call(
  method: string,
  path: string,
  options: { body?: unknown; raw?: BodyInit; headers?: Record<string, string>; deps?: Partial<Deps>; env?: Partial<Env> & Record<string, unknown> } = {},
) {
  const headers: Record<string, string> = { 'cf-connecting-ip': '1.1.1.1', ...options.headers };
  let body: BodyInit | undefined = options.raw;
  if (options.body !== undefined) {
    headers['content-type'] ??= 'application/json';
    body = JSON.stringify(options.body);
  }
  return app.request(
    `http://api.test${path}`,
    { method, headers, body },
    { ...baseEnv, TEST: '1', __deps: options.deps ?? {}, ...options.env },
  );
}

/** Parsed JSON of a response; tests read it loosely on purpose. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function json(res: Response): Promise<any> {
  return await res.json();
}
