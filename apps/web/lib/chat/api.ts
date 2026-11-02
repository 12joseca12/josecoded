import {
  claimResponseSchema,
  createThreadResponseSchema,
  currentThreadResponseSchema,
  postMessageResponseSchema,
  quickContactResponseSchema,
  switchCaseResponseSchema,
} from '@josecoded/types';

import type {
  ChatCase,
  ChatFailure,
  ChatResult,
  CreateThreadResponse,
  CurrentThreadResponse,
  Locale,
  PostMessageResponse,
  QuickContactRequest,
  SwitchCaseResponse,
} from '@josecoded/types';
import type { z } from 'zod';

/** Length cap of a message, mirrored from the gateway (`MAX_CHAT_MESSAGE_CHARS`): the box stops there, the gateway checks again. */
export const CHAT_MESSAGE_MAX = 1000;

export interface ChatApiOptions {
  /** `NEXT_PUBLIC_JOSECODED_API_URL`. */
  apiUrl: string;
  /** The signed-in user's access token, only to read or claim a saved thread; absent for a visitor. */
  getToken?: () => Promise<string | undefined>;
  fetchImpl?: typeof fetch;
}

function failureOf(status: number, code: string | undefined): ChatFailure {
  if (status === 429) return code === 'quota_exceeded' ? 'quota' : 'rate';
  if (status === 403) return code === 'bot_check_failed' ? 'captcha' : 'forbidden';
  if (status === 404) return 'missing';
  if (status === 409) return 'closed';
  if (status === 400 || status === 413 || status === 415) return 'invalid';
  return 'down';
}

/**
 * Calls `/api/v1/assistant/*` straight from the browser. `credentials: 'include'` carries the HttpOnly `__Host-chat_sid`
 * cookie the gateway sets (the origin is on its CORS allow-list with credentials). Every answer is parsed with the zod
 * schema of `@josecoded/types`; anything else is `down`. Neither the message text nor the Turnstile token is logged.
 */
export function createChatApi({ apiUrl, getToken, fetchImpl }: ChatApiOptions) {
  const base = `${apiUrl.replace(/\/$/, '')}/api/v1/assistant`;

  async function call<S extends z.ZodType>(path: string, schema: S, init?: { body?: unknown }): Promise<ChatResult<z.infer<S>>> {
    try {
      const token = await getToken?.();
      const response = await (fetchImpl ?? fetch)(`${base}${path}`, {
        method: init ? 'POST' : 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { ...(init ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
        ...(init ? { body: JSON.stringify(init.body ?? {}) } : {}),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
        return { status: 'error', reason: failureOf(response.status, body?.error?.code) };
      }
      const parsed = schema.safeParse(((await response.json()) as { data?: unknown }).data);
      return parsed.success ? { status: 'ok', data: parsed.data } : { status: 'error', reason: 'down' };
    } catch {
      return { status: 'error', reason: 'down' };
    }
  }

  return {
    createThread: (input: { case: ChatCase; locale: Locale; originPath: string; turnstileToken: string }): Promise<ChatResult<CreateThreadResponse>> =>
      call('/threads', createThreadResponseSchema, { body: input }),
    current: (after?: string): Promise<ChatResult<CurrentThreadResponse>> =>
      call(`/threads/current${after ? `?after=${encodeURIComponent(after)}` : ''}`, currentThreadResponseSchema),
    send: (threadId: string, content: string): Promise<ChatResult<PostMessageResponse>> =>
      call(`/threads/${threadId}/messages`, postMessageResponseSchema, { body: { content } }),
    switchCase: (threadId: string, chatCase: ChatCase): Promise<ChatResult<SwitchCaseResponse>> =>
      call(`/threads/${threadId}/case`, switchCaseResponseSchema, { body: { case: chatCase } }),
    claim: (threadId: string) => call(`/threads/${threadId}/claim`, claimResponseSchema, { body: {} }),
    quickContact: (threadId: string, contact: QuickContactRequest) =>
      call(`/threads/${threadId}/quick-contact`, quickContactResponseSchema, { body: contact }),
  };
}

export type ChatApi = ReturnType<typeof createChatApi>;
