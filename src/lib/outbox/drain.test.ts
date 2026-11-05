import { describe, expect, it, vi } from "vitest";

import { getTranslator } from "@/i18n/messages";
import type { OutboxConfig } from "@/types/outbox";

import { claimLimit, drainOutbox, maxAttempts } from "./drain";

const config: OutboxConfig = {
  resend: { apiKey: "re_key", from: "josecoded <a@josecoded.com>", baseUrl: "https://resend.test" },
  telegram: { token: "1:t", baseUrl: "https://telegram.test" },
};

interface Row {
  id: number;
  channel: "email" | "telegram";
  recipient: string;
  template: string;
  payload: unknown;
  attempts: number;
}

function row(overrides: Partial<Row> = {}): Row {
  return {
    id: 1,
    channel: "email",
    recipient: "someone@example.com",
    template: "test",
    payload: {},
    attempts: 0,
    ...overrides,
  };
}

function ok(body: unknown = {}) {
  return new Response(JSON.stringify(body), { status: 200 });
}

function failing(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}

function setup(rows: unknown, responses: (() => Response | Promise<Response>)[] = []) {
  const marks: { id: number; ok: boolean; error: string | null }[] = [];
  const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
    if (name === "outbox_claim") return Promise.resolve({ data: rows, error: null });
    marks.push({
      id: args.p_id as number,
      ok: args.p_ok as boolean,
      error: (args.p_error as string | undefined) ?? null,
    });
    return Promise.resolve({ data: null, error: null });
  });
  const queue = [...responses];
  const fetchImpl = vi.fn(() => {
    const next = queue.shift();
    return Promise.resolve(next ? next() : ok());
  });
  const sleep = vi.fn(() => Promise.resolve());
  const run = (cfg: OutboxConfig = config) =>
    drainOutbox({
      client: { rpc } as never,
      config: cfg,
      origin: "https://josecoded.com",
      translators: getTranslator,
      fetchImpl: fetchImpl,
      sleep,
    });
  return { run, rpc, marks, fetchImpl, sleep };
}

describe("drainOutbox", () => {
  it("claims a bounded batch", async () => {
    const { run, rpc } = setup([]);
    expect(await run()).toEqual({ status: "done", claimed: 0, sent: 0, retried: 0, failed: 0 });
    expect(rpc).toHaveBeenCalledWith("outbox_claim", { p_limit: claimLimit });
  });

  it("sends an email and a Telegram message and marks both as sent", async () => {
    const { run, marks, fetchImpl } = setup([
      row({ id: 1 }),
      row({ id: 2, channel: "telegram", recipient: "42" }),
    ]);
    expect(await run()).toEqual({ status: "done", claimed: 2, sent: 2, retried: 0, failed: 0 });
    expect(marks).toEqual([
      { id: 1, ok: true, error: null },
      { id: 2, ok: true, error: null },
    ]);
    const urls = fetchImpl.mock.calls.map((call) => (call as unknown as [string])[0]);
    expect(urls).toEqual([
      "https://resend.test/emails",
      "https://telegram.test/bot1:t/sendMessage",
    ]);
  });

  it("retries a transient failure inside the call and then marks it sent", async () => {
    const { run, marks, fetchImpl, sleep } = setup([row()], [() => failing(503), () => ok()]);
    expect(await run()).toMatchObject({ sent: 1, retried: 0, failed: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(marks).toEqual([{ id: 1, ok: true, error: null }]);
  });

  it("marks a transient failure that persists so the next run tries again", async () => {
    const { run, marks, fetchImpl } = setup(
      [row({ attempts: 1 })],
      [() => failing(503, { message: "down" }), () => failing(503, { message: "down" })],
    );
    expect(await run()).toMatchObject({ sent: 0, retried: 1, failed: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(marks).toEqual([{ id: 1, ok: false, error: "resend_503: down" }]);
  });

  it("does not retry a permanent failure", async () => {
    const { run, marks, fetchImpl } = setup(
      [row()],
      [() => failing(422, { message: "Invalid `to` field" })],
    );
    expect(await run()).toMatchObject({ retried: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(marks[0]?.error).toBe("resend_422: Invalid `to` field");
  });

  it("counts an item as failed once it has used its last attempt", async () => {
    const { run } = setup([row({ attempts: maxAttempts - 1 })], [() => failing(422)]);
    expect(await run()).toMatchObject({ sent: 0, retried: 0, failed: 1 });
  });

  it("waits for Telegram retry_after when it is short and gives up when it is long", async () => {
    const short = setup(
      [row({ channel: "telegram", recipient: "42" })],
      [() => failing(429, { ok: false, parameters: { retry_after: 2 } }), () => ok({ ok: true })],
    );
    expect(await short.run()).toMatchObject({ sent: 1 });
    expect(short.sleep).toHaveBeenCalledWith(2000);

    const long = setup(
      [row({ channel: "telegram", recipient: "42" })],
      [() => failing(429, { ok: false, parameters: { retry_after: 60 } })],
    );
    expect(await long.run()).toMatchObject({ sent: 0, retried: 1 });
    expect(long.fetchImpl).toHaveBeenCalledTimes(1);
    expect(long.sleep).not.toHaveBeenCalled();
  });

  it("marks an item whose payload cannot be rendered without calling the provider", async () => {
    const { run, marks, fetchImpl } = setup([
      row({ template: "invitation", payload: { path: "//x.example", role: "closer" } }),
      row({ id: 2, template: "surprise" }),
    ]);
    expect(await run()).toMatchObject({ claimed: 2, sent: 0, retried: 2 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(marks).toEqual([
      { id: 1, ok: false, error: "payload_invalid" },
      { id: 2, ok: false, error: "unknown_template" },
    ]);
  });

  it("marks items of a channel without credentials", async () => {
    const { run, marks, fetchImpl } = setup([
      row(),
      row({ id: 2, channel: "telegram", recipient: "42" }),
    ]);
    expect(await run({ resend: null, telegram: config.telegram })).toMatchObject({
      sent: 1,
      retried: 1,
    });
    expect(marks).toEqual([
      { id: 1, ok: false, error: "email_not_configured" },
      { id: 2, ok: true, error: null },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("marks a malformed row that still has an id and skips one that has none", async () => {
    const { run, marks } = setup([{ id: 5, channel: "sms" }, { nope: true }, null]);
    expect(await run()).toMatchObject({ claimed: 3, retried: 1 });
    expect(marks).toEqual([{ id: 5, ok: false, error: "invalid_row" }]);
  });

  it("keeps going when marking one item throws", async () => {
    const { run, rpc, fetchImpl } = setup([row(), row({ id: 2 })]);
    let calls = 0;
    rpc.mockImplementation((name: string) => {
      if (name === "outbox_claim")
        return Promise.resolve({ data: [row(), row({ id: 2 })], error: null });
      calls += 1;
      if (calls === 1) return Promise.reject(new Error("db down"));
      return Promise.resolve({ data: null, error: null });
    });
    expect(await run()).toMatchObject({ claimed: 2, sent: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports a failed claim", async () => {
    const { run, rpc } = setup([]);
    rpc.mockResolvedValueOnce({ data: null, error: { code: "42501" } } as never);
    expect(await run()).toEqual({ status: "claim_failed" });
    rpc.mockRejectedValueOnce(new Error("network"));
    expect(await run()).toEqual({ status: "claim_failed" });
  });
});
