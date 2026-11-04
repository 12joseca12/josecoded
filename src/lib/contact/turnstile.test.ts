import { describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "./turnstile";

const base = {
  url: "https://verify.test",
  secret: "s",
  token: "t",
  ip: "203.0.113.7",
  allowedHostnames: ["josecoded.com"],
};

function answer(body: unknown) {
  return vi.fn(() => Promise.resolve(Response.json(body)));
}

const good = { success: true, hostname: "josecoded.com", action: "contact" };

describe("verifyTurnstile", () => {
  it("posts secret, response, remoteip and an idempotency key", async () => {
    const fetchImpl = answer(good);
    expect(await verifyTurnstile({ ...base, fetchImpl })).toBe("ok");
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("s");
    expect(body.get("response")).toBe("t");
    expect(body.get("remoteip")).toBe("203.0.113.7");
    expect(body.get("idempotency_key")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("omits remoteip when unknown", async () => {
    const fetchImpl = answer(good);
    await verifyTurnstile({ ...base, ip: null, fetchImpl });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.body as URLSearchParams).has("remoteip")).toBe(false);
  });

  it("rejects a wrong hostname, a wrong or missing action and failure", async () => {
    for (const body of [
      { ...good, hostname: "evil.example" },
      { ...good, hostname: undefined },
      { ...good, action: "login" },
      { ...good, action: undefined },
      { ...good, success: false },
    ]) {
      expect(await verifyTurnstile({ ...base, fetchImpl: answer(body) })).toBe("rejected");
    }
  });

  it("distinguishes rejection from outages", async () => {
    const failing = vi.fn(() => Promise.reject(new Error("offline")));
    expect(await verifyTurnstile({ ...base, fetchImpl: failing })).toBe("unreachable");
    const bad = vi.fn(() => Promise.resolve(new Response("nope", { status: 500 })));
    expect(await verifyTurnstile({ ...base, fetchImpl: bad })).toBe("unreachable");
    expect(await verifyTurnstile({ ...base, fetchImpl: answer({ nope: 1 }) })).toBe("unreachable");
  });
});
