// /api/v1/assistant/*: case-based chat without an account (plan 4.4). The visitor is the holder of the signed HttpOnly
// `__Host-chat_sid` cookie (or the owner's JWT); every mutation checks `Origin` (the cookie is the credential, so a cross-site
// form post must not be able to use it) and the native limiter keyed by visitor. The admin side needs a staff admin
// with a second factor. Responses are never cached.
import { Hono } from 'hono';
import { z } from 'zod';

import {
  adminAiRequestSchema,
  adminReplyRequestSchema,
  createThreadRequestSchema,
  postMessageRequestSchema,
  quickContactRequestSchema,
  switchCaseRequestSchema,
} from '@josecoded/types';

import { requireAdmin, type AuthEnv } from '../middlewares/auth.middleware';
import { enforceNativeLimit } from '../middlewares/native-rate-limit.middleware';
import { createAssistantService, toMessageView, toThreadView, type Access } from '../services/assistant.service';
import { readVisitorSid, sidCookie, signVisitorSid } from '../services/chat-session';
import { intFromEnv } from '../services/quota.service';
import { ok } from '../utils/api-response';
import { HttpError, logEvent } from '../utils/http-error';
import { assertTrustedOrigin, clientIp, clientRateKey, parseWith, readJson } from '../utils/request';

import type { AppEnv } from '../deps';
import type { ChatThreadRow } from '../ports';
import type { Context } from 'hono';

const MAX_BODY_BYTES = 4 * 1024;
const uuidSchema = z.uuid();
const afterSchema = z.iso.datetime({ offset: true }).optional();

export const assistantRoutes = new Hono<AppEnv>();

assistantRoutes.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'private, no-store');
});

function secretOf(c: Context<AppEnv>): string {
  const secret = c.env.CHAT_SID_SECRET;
  if (!secret) throw new HttpError(503, 'service_unavailable', 'Chat is not available');
  return secret;
}

function service(c: Context<AppEnv>) {
  return createAssistantService(c.var.deps, {
    sidSecret: secretOf(c),
    limits: {
      threadsIp: intFromEnv(c.env.CHAT_DAILY_THREADS_IP, 20),
      threadsAll: intFromEnv(c.env.CHAT_DAILY_THREADS_ALL, 500),
      messagesIp: intFromEnv(c.env.CHAT_DAILY_MESSAGES_IP, 40),
      messagesAll: intFromEnv(c.env.CHAT_DAILY_MESSAGES_ALL, 2000),
      messagesVisitor: intFromEnv(c.env.CHAT_DAILY_MESSAGES_VISITOR, 60),
    },
  });
}

/** The unprefixed cookie name is read only in development (plain-http `wrangler dev`). */
function cookieOptions(c: Context<AppEnv>) {
  return { allowDevName: c.env.API_MODE === 'development' };
}

function bearer(c: Context<AppEnv>): string | undefined {
  const header = c.req.header('authorization');
  return header ? /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() : undefined;
}

/** The verified user of the optional bearer token. A stale or unverifiable token is just "no user". */
async function optionalUserId(c: Context<AppEnv>): Promise<string | undefined> {
  const token = bearer(c);
  if (!token) return undefined;
  try {
    return (await c.var.deps.supabase.verifyUser(token))?.id;
  } catch {
    logEvent('assistant', 'verify_user_failed');
    return undefined;
  }
}

async function accessOf(c: Context<AppEnv>): Promise<Access> {
  const visitorId = await readVisitorSid(c.env.CHAT_SID_SECRET, c.req.header('cookie'), cookieOptions(c));
  const userId = await optionalUserId(c);
  return { ...(visitorId ? { visitorId } : {}), ...(userId ? { userId } : {}) };
}

/** Same as `accessOf`, plus the per-visitor native limit (10/min) and the CSRF origin check, for mutations. */
async function mutationAccess(c: Context<AppEnv>): Promise<Access> {
  assertTrustedOrigin(c);
  const access = await accessOf(c);
  const who = access.visitorId ?? (access.userId ? `user:${access.userId}` : undefined);
  if (!who) throw new HttpError(403, 'forbidden', 'This conversation is not yours');
  await enforceNativeLimit(c.env.ASSISTANT_RATE_LIMITER, `assistant:${who}`);
  return access;
}

function threadId(c: Context<AppEnv>): string {
  return parseWith(uuidSchema, c.req.param('id'));
}

// --- Visitor ---

/** POST /threads: Turnstile `chat`, 20 threads per IP and 500 in total per day, sets the `__Host-chat_sid` cookie. */
assistantRoutes.post('/threads', async (c) => {
  assertTrustedOrigin(c);
  const ip = clientIp(c);
  const secret = secretOf(c);
  await enforceNativeLimit(c.env.ASSISTANT_RATE_LIMITER, `assistant-new:${clientRateKey(c)}`);
  const input = await readJson(c, createThreadRequestSchema, MAX_BODY_BYTES);
  const existing = await readVisitorSid(secret, c.req.header('cookie'), cookieOptions(c));
  const { thread, visitorId } = await service(c).createThread({
    case: input.case,
    locale: input.locale,
    originPath: input.originPath,
    turnstileToken: input.turnstileToken,
    ip,
    ...(existing ? { visitorId: existing } : {}),
  });
  const secure = c.env.API_MODE === 'production' || new URL(c.req.url).protocol === 'https:';
  c.header('Set-Cookie', sidCookie(await signVisitorSid(secret, visitorId), secure));
  return c.json(ok({ threadId: thread.id, case: thread.case, contextVersion: thread.context_version, aiEnabled: thread.ai_enabled }), 201);
});

/** GET /threads/current?after=<iso>: the visitor's (cookie) or user's (JWT) open thread with its messages. */
assistantRoutes.get('/threads/current', async (c) => {
  const after = parseWith(afterSchema, c.req.query('after'));
  const access = await accessOf(c);
  if (!access.visitorId && !access.userId) throw new HttpError(404, 'not_found', 'No conversation');
  const found = await service(c).current(access, after);
  if (!found) throw new HttpError(404, 'not_found', 'No conversation');
  return c.json(ok({ thread: toThreadView(found.thread), messages: found.messages.map(toMessageView) }));
});

/** POST /threads/:id/messages: owner only; 10/min per visitor, daily quota per IP and in total; the AI replies unless Jose took over. */
assistantRoutes.post('/threads/:id/messages', async (c) => {
  const id = threadId(c);
  const access = await mutationAccess(c);
  const { content } = await readJson(c, postMessageRequestSchema, MAX_BODY_BYTES);
  const result = await service(c).postMessage({ threadId: id, access, content, ip: clientIp(c) });
  return c.json(
    ok({
      visitor: toMessageView(result.visitor),
      assistant: result.assistant ? toMessageView(result.assistant) : null,
      aiEnabled: result.thread.ai_enabled,
    }),
    201,
  );
});

assistantRoutes.post('/threads/:id/case', async (c) => {
  const id = threadId(c);
  const access = await mutationAccess(c);
  const input = await readJson(c, switchCaseRequestSchema, MAX_BODY_BYTES);
  const result = await service(c).switchCase({ threadId: id, access, case: input.case });
  return c.json(ok({ thread: toThreadView(result.thread as ChatThreadRow), message: result.message ? toMessageView(result.message) : null }));
});

/** POST /threads/:id/claim: JWT required; the cookie of the thread's visitor must come with it. */
assistantRoutes.post('/threads/:id/claim', async (c) => {
  const id = threadId(c);
  assertTrustedOrigin(c);
  const userId = await optionalUserId(c);
  if (!userId) throw new HttpError(401, 'unauthorized', 'Sign in to save the conversation');
  const visitorId = await readVisitorSid(c.env.CHAT_SID_SECRET, c.req.header('cookie'), cookieOptions(c));
  await enforceNativeLimit(c.env.ASSISTANT_RATE_LIMITER, `assistant:${visitorId ?? `user:${userId}`}`);
  const thread = await service(c).claim({ threadId: id, visitorId: visitorId ?? undefined, userId });
  return c.json(ok({ thread: toThreadView(thread) }));
});

/** POST /threads/:id/quick-contact: leaves an email or phone; creates the lead through create_lead and tells Jose. */
assistantRoutes.post('/threads/:id/quick-contact', async (c) => {
  const id = threadId(c);
  const access = await mutationAccess(c);
  const contact = await readJson(c, quickContactRequestSchema, MAX_BODY_BYTES);
  const result = await service(c).quickContact({
    threadId: id,
    access,
    contact,
    ip: clientIp(c),
    waitUntil: (promise) => {
      try {
        c.executionCtx.waitUntil(promise);
      } catch {
        // no execution context (unit tests)
      }
    },
  });
  return c.json(ok({ saved: true, notified: result.notified }), 201);
});

// --- Admin (staff admin + aal2) ---

const adminRoutes = new Hono<AuthEnv>();
adminRoutes.use('*', requireAdmin);

function adminView(row: ChatThreadRow) {
  return {
    id: row.id,
    case: row.case,
    locale: row.locale,
    status: row.status,
    ai_enabled: row.ai_enabled,
    unread_for_admin: row.unread_for_admin,
    last_message_at: row.last_message_at,
    contact_id: row.contact_id,
    has_account: row.user_id !== null,
    origin_path: row.origin_path,
    context_version: row.context_version,
    created_at: row.created_at,
  };
}

adminRoutes.get('/threads', async (c) => {
  const unreadOnly = c.req.query('unread') === '1';
  const threads = await service(c as unknown as Context<AppEnv>).adminThreads({ unreadOnly });
  return c.json(ok(threads.map(adminView)));
});

adminRoutes.get('/threads/:id', async (c) => {
  const id = parseWith(uuidSchema, c.req.param('id'));
  const { thread, messages } = await service(c as unknown as Context<AppEnv>).adminThread(id);
  return c.json(ok({ thread: adminView(thread), messages }));
});

adminRoutes.post('/threads/:id/messages', async (c) => {
  const id = parseWith(uuidSchema, c.req.param('id'));
  const { content } = await readJson(c, adminReplyRequestSchema, MAX_BODY_BYTES * 2);
  const message = await service(c as unknown as Context<AppEnv>).adminReply({ threadId: id, content });
  return c.json(ok(message), 201);
});

adminRoutes.post('/threads/:id/ai', async (c) => {
  const id = parseWith(uuidSchema, c.req.param('id'));
  const { enabled } = await readJson(c, adminAiRequestSchema, MAX_BODY_BYTES);
  return c.json(ok(await service(c as unknown as Context<AppEnv>).adminSetAi({ threadId: id, enabled })));
});

adminRoutes.post('/threads/:id/read', async (c) => {
  const id = parseWith(uuidSchema, c.req.param('id'));
  return c.json(ok(await service(c as unknown as Context<AppEnv>).adminMarkRead(id)));
});

assistantRoutes.route('/admin', adminRoutes);
