import { describe, expect, it, vi } from "vitest";

import type { EmailMessage, ResendConfig, TelegramConfig } from "@/types/outbox";

import { sendEmail, sendTelegram } from "./providers";

const resend: ResendConfig = {
  apiKey: "re_key",
  from: "josecoded <avisos@josecoded.com>",
  baseUrl: "https://api.resend.com",
};

const telegram: TelegramConfig = { token: "123:abc", baseUrl: "https://api.telegram.org" };

const message: EmailMessage = {
  channel: "email",
  to: "someone@example.com",
  subject: "Hola",
  text: "Texto",
  html: "<p>Texto</p>",
};

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("sendEmail", () => {
  it("posts to Resend with the key, the sender and an idempotency key", async () => {
    const fetchImpl = respond(200, { id: "abc" });
    expect(await sendEmail(resend, message, "outbox-7", fetchImpl)).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer re_key");
    expect(headers["idempotency-key"]).toBe("outbox-7");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "josecoded <avisos@josecoded.com>",
      to: ["someone@example.com"],
      subject: "Hola",
      text: "Texto",
      html: "<p>Texto</p>",
    });
  });

  it("treats a validation error as permanent", async () => {
    const fetchImpl = respond(422, { name: "validation_error", message: "Invalid `to` field" });
    const result = await sendEmail(resend, message, "outbox-7", fetchImpl);
    expect(result).toEqual({
      ok: false,
      transient: false,
      error: "resend_422: Invalid `to` field",
    });
  });

  it("treats rate limits and server errors as transient", async () => {
    const limited = await sendEmail(resend, message, "k", respond(429, { message: "slow down" }));
    expect(limited).toMatchObject({ ok: false, transient: true });
    const broken = await sendEmail(resend, message, "k", respond(503, { message: "down" }));
    expect(broken).toMatchObject({ ok: false, transient: true });
  });

  it("treats a network failure as transient without leaking details", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    expect(await sendEmail(resend, message, "k", fetchImpl)).toEqual({
      ok: false,
      transient: true,
      error: "resend_network_error",
    });
  });

  it("copes with a body that is not JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("<html>", { status: 502 }));
    expect(await sendEmail(resend, message, "k", fetchImpl)).toEqual({
      ok: false,
      transient: true,
      error: "resend_502",
    });
  });
});

describe("sendTelegram", () => {
  it("posts the text to the chat", async () => {
    const fetchImpl = respond(200, { ok: true, result: {} });
    expect(await sendTelegram(telegram, "42", "Hola", fetchImpl)).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    expect(JSON.parse(init.body as string)).toEqual({
      chat_id: "42",
      text: "Hola",
      disable_web_page_preview: true,
    });
  });

  it("treats a blocked bot as permanent", async () => {
    const fetchImpl = respond(403, {
      ok: false,
      error_code: 403,
      description: "Forbidden: bot was blocked by the user",
    });
    expect(await sendTelegram(telegram, "42", "Hola", fetchImpl)).toEqual({
      ok: false,
      transient: false,
      error: "telegram_403: Forbidden: bot was blocked by the user",
    });
  });

  it("reads retry_after on a 429 and reports it in milliseconds", async () => {
    const fetchImpl = respond(429, {
      ok: false,
      error_code: 429,
      description: "Too Many Requests: retry after 2",
      parameters: { retry_after: 2 },
    });
    expect(await sendTelegram(telegram, "42", "Hola", fetchImpl)).toEqual({
      ok: false,
      transient: true,
      retryAfterMs: 2000,
      error: "telegram_429: Too Many Requests: retry after 2",
    });
  });

  it("never puts the bot token in an error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("connect to /bot123:abc failed"));
    const result = await sendTelegram(telegram, "42", "Hola", fetchImpl);
    expect(result).toEqual({ ok: false, transient: true, error: "telegram_network_error" });
  });
});
