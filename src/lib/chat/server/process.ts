import { isKnownIp } from "@/lib/contact/ip";
import type { TurnstileOutcome } from "@/lib/contact/turnstile";
import { collectHandoffErrors } from "@/types/chat";
import {
  chatHandoffRequestSchema,
  type ChatHandoffResponse,
  chatSendRequestSchema,
  type ChatSendResponse,
  chatThreadQuerySchema,
  type ChatWireThread,
} from "@/types/chat-visitor";

import { mapHandoffFailure, mapSendFailure } from "./outcomes";
import type { ChatRpc } from "./rpc";
import {
  hashVisitorToken,
  newVisitorToken,
  readVisitorCookie,
  signVisitorToken,
} from "./visitor-token";
import { toWireThread } from "./wire";

export interface ChatDeps {
  cookieSecret: string;
  isOn: () => Promise<boolean>;
  hashIp: (ip: string | null) => Promise<string>;
  rateLimit: (key: string) => Promise<boolean>;
  verifyTurnstile: (token: string, ip: string | null) => Promise<TurnstileOutcome>;
  rpc: ChatRpc;
  reportFailure: (code: string) => void;
}

export interface ChatRequestContext {
  ip: string | null;
  cookie: string | undefined;
}

export interface ChatResult<T> {
  http: number;
  body: T | null;
  setCookie?: string;
}

const probeToken = "0".repeat(64);

function none<T>(http: number): ChatResult<T> {
  return { http, body: null };
}

export async function processSend(
  raw: unknown,
  context: ChatRequestContext,
  deps: ChatDeps | null,
): Promise<ChatResult<ChatSendResponse>> {
  if (!deps) return { http: 503, body: { status: "unavailable" } };
  if (!(await deps.isOn())) return none(404);

  const parsed = chatSendRequestSchema.safeParse(raw);
  if (!parsed.success) return { http: 400, body: { status: "invalid" } };
  const input = parsed.data;

  const clientIp = isKnownIp(context.ip) ? context.ip : null;
  if (clientIp === null) deps.reportFailure("ip_missing");
  const ipHash = await deps.hashIp(context.ip);
  if (!(await deps.rateLimit(`chat:${ipHash}`))) return { http: 429, body: { status: "quota" } };

  let token = await readVisitorCookie(context.cookie, deps.cookieSecret);
  if (token === null) {
    if (!input.turnstileToken) return { http: 403, body: { status: "verification_failed" } };
    const verification = await deps.verifyTurnstile(input.turnstileToken, clientIp);
    if (verification === "rejected") return { http: 403, body: { status: "verification_failed" } };
    if (verification === "unreachable") {
      deps.reportFailure("turnstile_unreachable");
      return { http: 503, body: { status: "unavailable" } };
    }
    token = newVisitorToken();
  }

  const outcome = await deps.rpc.send({
    tokenHash: await hashVisitorToken(token),
    body: input.body,
    pagePath: input.pagePath ?? null,
    locale: input.locale,
    ipHash,
  });
  if (outcome.ok) {
    return {
      http: 200,
      body: { status: "sent", messageId: outcome.data.messageId },
      setCookie: await signVisitorToken(token, deps.cookieSecret),
    };
  }
  const failure = mapSendFailure(outcome.error);
  if (failure === "off") return none(404);
  if (failure === "unavailable") deps.reportFailure(outcome.error?.message ?? "send_unreachable");
  const http = { invalid: 400, burst: 429, quota: 429, closed: 409, unavailable: 503 }[failure];
  return { http, body: { status: failure } };
}

export async function processThread(
  query: unknown,
  context: ChatRequestContext,
  deps: ChatDeps | null,
): Promise<ChatResult<ChatWireThread>> {
  if (!deps) return none(503);
  if (!(await deps.isOn())) return none(404);
  const parsed = chatThreadQuerySchema.safeParse(query);
  if (!parsed.success) return none(400);

  const ipHash = await deps.hashIp(context.ip);
  if (!(await deps.rateLimit(`chat:${ipHash}`))) return none(429);

  const token = await readVisitorCookie(context.cookie, deps.cookieSecret);
  const tokenHash = await hashVisitorToken(token ?? probeToken);
  const outcome = await deps.rpc.thread(
    tokenHash,
    token === null ? null : (parsed.data.since ?? null),
  );
  if (!outcome.ok) {
    deps.reportFailure(outcome.error?.message ?? "thread_unreachable");
    return none(503);
  }
  return { http: 200, body: toWireThread(outcome.data) };
}

export async function processHandoff(
  raw: unknown,
  context: ChatRequestContext,
  deps: ChatDeps | null,
): Promise<ChatResult<ChatHandoffResponse>> {
  if (!deps) return { http: 503, body: { status: "unavailable" } };
  if (!(await deps.isOn())) return none(404);

  const parsed = chatHandoffRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      http: 400,
      body: { status: "invalid", errors: collectHandoffErrors(parsed.error) },
    };
  }

  const ipHash = await deps.hashIp(context.ip);
  if (!(await deps.rateLimit(`chat:${ipHash}`))) return { http: 429, body: { status: "quota" } };

  const token = await readVisitorCookie(context.cookie, deps.cookieSecret);
  if (token === null) return { http: 409, body: { status: "closed" } };

  const outcome = await deps.rpc.handoff(await hashVisitorToken(token), parsed.data);
  if (outcome.ok) return { http: 200, body: { status: "saved" } };
  const failure = mapHandoffFailure(outcome.error);
  if (failure.kind === "invalid") {
    return { http: 400, body: { status: "invalid", errors: failure.errors } };
  }
  if (failure.kind === "closed") return { http: 409, body: { status: "closed" } };
  deps.reportFailure(outcome.error?.message ?? "handoff_unreachable");
  return { http: 503, body: { status: "unavailable" } };
}
