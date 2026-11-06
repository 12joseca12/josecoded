import { describe, expect, it, vi } from "vitest";

import type { VisitorThread } from "@/types/chat-visitor";

import { type ChatDeps, processHandoff, processSend, processThread } from "./process";
import type { ChatRpc, RpcResult } from "./rpc";
import { newVisitorToken, signVisitorToken } from "./visitor-token";

const secret = "cookie-secret";
const sentRow = { conversationId: "c", messageId: "m1" };

function thread(partial: Partial<VisitorThread> = {}): VisitorThread {
  return {
    messages: [],
    nexo_online: false,
    ai_enabled: true,
    pending_reply: false,
    handoff_done: false,
    consent_at: null,
    status: "open",
    ...partial,
  };
}

function build(overrides: Partial<ChatDeps> = {}, rpc: Partial<ChatRpc> = {}) {
  const calls = { send: vi.fn(), thread: vi.fn(), handoff: vi.fn() };
  const deps: ChatDeps = {
    cookieSecret: secret,
    isOn: () => Promise.resolve(true),
    hashIp: () => Promise.resolve("iphash-1234567890abcdef"),
    rateLimit: () => Promise.resolve(true),
    verifyTurnstile: vi.fn(() => Promise.resolve("ok" as const)),
    reportFailure: vi.fn(),
    rpc: {
      send: (args) => {
        calls.send(args);
        return Promise.resolve<RpcResult<typeof sentRow>>({ ok: true, data: sentRow });
      },
      thread: (hash, since) => {
        calls.thread(hash, since);
        return Promise.resolve<RpcResult<VisitorThread>>({ ok: true, data: thread() });
      },
      handoff: (hash, input) => {
        calls.handoff(hash, input);
        return Promise.resolve<RpcResult<string>>({ ok: true, data: "lead-1" });
      },
      ...rpc,
    },
    ...overrides,
  };
  return { deps, calls };
}

const valid = { body: " hola ", locale: "es", pagePath: "/es/servicios", turnstileToken: "tok" };
const noCookie = { ip: "203.0.113.9", cookie: undefined };

describe("processSend", () => {
  it("answers 503 without configuration and 404 while the chat is off", async () => {
    expect((await processSend(valid, noCookie, null)).http).toBe(503);
    const { deps } = build({ isOn: () => Promise.resolve(false) });
    const off = await processSend(valid, noCookie, deps);
    expect(off).toEqual({ http: 404, body: null });
  });

  it("rejects malformed input before touching anything", async () => {
    const { deps, calls } = build();
    for (const raw of [
      null,
      {},
      { ...valid, body: "   " },
      { ...valid, body: "x".repeat(2001) },
      { ...valid, extra: 1 },
    ]) {
      expect((await processSend(raw, noCookie, deps)).http).toBe(400);
    }
    expect(calls.send).not.toHaveBeenCalled();
  });

  it("requires Turnstile on the first send and sets a signed cookie", async () => {
    const { deps, calls } = build();
    const missing = await processSend({ ...valid, turnstileToken: undefined }, noCookie, deps);
    expect(missing).toMatchObject({ http: 403, body: { status: "verification_failed" } });
    const result = await processSend(valid, noCookie, deps);
    expect(result.http).toBe(200);
    expect(result.body).toEqual({ status: "sent", messageId: "m1" });
    expect(result.setCookie).toMatch(/^[0-9a-f]{64}\.[0-9a-f]{32}$/);
    expect(calls.send).toHaveBeenCalledWith(
      expect.objectContaining({ body: "hola", locale: "es", pagePath: "/es/servicios" }),
    );
  });

  it("skips Turnstile for a returning visitor and ignores a forged cookie", async () => {
    const { deps } = build();
    const cookie = await signVisitorToken(newVisitorToken(), secret);
    const returning = await processSend(
      { ...valid, turnstileToken: undefined },
      { ip: null, cookie },
      deps,
    );
    expect(returning.http).toBe(200);
    const forged = await processSend(
      { ...valid, turnstileToken: undefined },
      { ip: null, cookie: `${newVisitorToken()}.${"a".repeat(32)}` },
      deps,
    );
    expect(forged.http).toBe(403);
  });

  it("maps verification and rate limit failures", async () => {
    const rejected = build({ verifyTurnstile: () => Promise.resolve("rejected") });
    expect((await processSend(valid, noCookie, rejected.deps)).http).toBe(403);
    const down = build({ verifyTurnstile: () => Promise.resolve("unreachable") });
    expect((await processSend(valid, noCookie, down.deps)).http).toBe(503);
    const limited = build({ rateLimit: () => Promise.resolve(false) });
    expect(await processSend(valid, noCookie, limited.deps)).toMatchObject({
      http: 429,
      body: { status: "quota" },
    });
  });

  it("maps the typed errors of visitor_send", async () => {
    const cases: [string, string | null, number, string | null][] = [
      ["chat_quota_exceeded", "burst", 429, "burst"],
      ["chat_quota_exceeded", "visitor", 429, "quota"],
      ["chat_closed", null, 409, "closed"],
      ["empty_body", null, 400, "invalid"],
      ["public_chat_off", null, 404, null],
      ["boom", null, 503, "unavailable"],
    ];
    for (const [message, hint, http, status] of cases) {
      const { deps } = build(
        {},
        { send: () => Promise.resolve({ ok: false, error: { code: "P0001", message, hint } }) },
      );
      const result = await processSend(valid, noCookie, deps);
      expect(result.http, message).toBe(http);
      expect(result.body === null ? null : result.body.status, message).toBe(status);
      expect(result.setCookie).toBeUndefined();
    }
  });
});

describe("processThread", () => {
  it("probes with a fixed token when there is no cookie and maps the wire shape", async () => {
    const { deps } = build(
      {},
      {
        thread: () =>
          Promise.resolve({
            ok: true,
            data: thread({
              nexo_online: true,
              messages: [
                {
                  id: "1",
                  author_kind: "human",
                  from_staff: false,
                  kind: "text",
                  system_event: null,
                  body: "hi",
                  sources: null,
                  auto: false,
                  created_at: "t1",
                },
                {
                  id: "2",
                  author_kind: "human",
                  from_staff: true,
                  kind: "text",
                  system_event: null,
                  body: "jose",
                  sources: null,
                  auto: false,
                  created_at: "t2",
                },
                {
                  id: "3",
                  author_kind: "nexo",
                  from_staff: false,
                  kind: "text",
                  system_event: null,
                  body: "n",
                  sources: ["a"],
                  auto: false,
                  created_at: "t3",
                },
                {
                  id: "4",
                  author_kind: "system",
                  from_staff: false,
                  kind: "text",
                  system_event: "handoff_done",
                  body: "",
                  sources: [],
                  auto: false,
                  created_at: "t4",
                },
                {
                  id: "5",
                  author_kind: "system",
                  from_staff: false,
                  kind: "text",
                  system_event: "member_added",
                  body: "",
                  sources: [],
                  auto: false,
                  created_at: "t5",
                },
              ],
            }),
          }),
      },
    );
    const result = await processThread({ since: "2026-11-05T10:00:00Z" }, noCookie, deps);
    expect(result.http).toBe(200);
    expect(result.body?.messages.map((entry) => entry.author)).toEqual([
      "visitor",
      "staff",
      "nexo",
      "system",
    ]);
    expect(result.body?.messages[3]?.systemEvent).toBe("handoff_done");
    expect(result.body?.state).toMatchObject({ nexoOnline: true, closed: false });
  });

  it("asks with a hashed probe token and no since when there is no cookie", async () => {
    const { deps, calls } = build();
    await processThread({ since: "2026-11-05T10:00:00Z" }, noCookie, deps);
    expect(calls.thread).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f]{64}$/), null);
  });

  it("passes since for a known visitor and rejects a malformed one", async () => {
    const { deps, calls } = build();
    const cookie = await signVisitorToken(newVisitorToken(), secret);
    await processThread({ since: "2026-11-05T10:00:00Z" }, { ip: null, cookie }, deps);
    expect(calls.thread).toHaveBeenCalledWith(expect.any(String), "2026-11-05T10:00:00Z");
    expect((await processThread({ since: "yesterday" }, { ip: null, cookie }, deps)).http).toBe(
      400,
    );
  });
});

describe("processHandoff", () => {
  const input = { email: "a@b.es", consent: true };

  it("needs a valid cookie and a valid body", async () => {
    const { deps } = build();
    const noVisitor = await processHandoff(input, noCookie, deps);
    expect(noVisitor).toMatchObject({ http: 409, body: { status: "closed" } });
    const cookie = await signVisitorToken(newVisitorToken(), secret);
    const invalid = await processHandoff({ consent: false }, { ip: null, cookie }, deps);
    expect(invalid).toMatchObject({ http: 400, body: { status: "invalid" } });
    const saved = await processHandoff(input, { ip: null, cookie }, deps);
    expect(saved).toEqual({ http: 200, body: { status: "saved" } });
  });

  it("maps typed errors of visitor_handoff", async () => {
    const cookie = await signVisitorToken(newVisitorToken(), secret);
    const fail = (message: string) =>
      build(
        {},
        {
          handoff: () =>
            Promise.resolve({ ok: false, error: { code: "P0001", message, hint: null } }),
        },
      ).deps;
    expect(await processHandoff(input, { ip: null, cookie }, fail("invalid_email"))).toMatchObject({
      http: 400,
      body: { errors: { email: "email_invalid" } },
    });
    expect((await processHandoff(input, { ip: null, cookie }, fail("chat_not_found"))).http).toBe(
      409,
    );
    expect((await processHandoff(input, { ip: null, cookie }, fail("boom"))).http).toBe(503);
  });
});
