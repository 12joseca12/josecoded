import { describe, expect, it, vi } from "vitest";

import { readContactClientConfig, readContactServerConfig } from "./env";
import { type ContactDeps, processContact, type SubmitLeadOutcome } from "./process";
import { verifyTurnstile } from "./turnstile";

const raw = {
  way: "freelance",
  name: "Ada",
  email: "ada@example.com",
  message: "Hola",
  consent: true,
  locale: "es",
  turnstileToken: "token",
};

function makeDeps(overrides: Partial<ContactDeps> = {}) {
  const deps = {
    verifyTurnstile: vi.fn(() => Promise.resolve("ok" as const)),
    hashIp: vi.fn(() => Promise.resolve("a".repeat(64))),
    submitLead: vi.fn((): Promise<SubmitLeadOutcome> => Promise.resolve({ ok: true })),
    reportFailure: vi.fn(),
    ...overrides,
  };
  return deps;
}

describe("processContact", () => {
  it("stores the lead and verifies with the client ip", async () => {
    const deps = makeDeps();
    const result = await processContact(raw, { ip: "203.0.113.7", deps });
    expect(result).toEqual({ status: "sent" });
    expect(deps.verifyTurnstile).toHaveBeenCalledWith("token", "203.0.113.7");
    expect(deps.submitLead).toHaveBeenCalledOnce();
  });

  it("pretends success on a filled honeypot and touches nothing", async () => {
    const deps = makeDeps();
    const result = await processContact({ ...raw, homepage: "http://spam" }, { ip: null, deps });
    expect(result).toEqual({ status: "sent" });
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.submitLead).not.toHaveBeenCalled();
  });

  it("returns field errors without calling anything", async () => {
    const deps = makeDeps();
    const result = await processContact({ ...raw, email: "x" }, { ip: null, deps });
    expect(result).toEqual({ status: "invalid", errors: { email: "email_invalid" } });
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
  });

  it("is unavailable without dependencies", async () => {
    expect(await processContact(raw, { ip: null, deps: null })).toEqual({
      status: "unavailable",
    });
  });

  it("maps verification outcomes", async () => {
    const rejected = makeDeps({
      verifyTurnstile: vi.fn(() => Promise.resolve("rejected" as const)),
    });
    expect(await processContact(raw, { ip: null, deps: rejected })).toEqual({
      status: "verification_failed",
    });
    expect(rejected.submitLead).not.toHaveBeenCalled();
    const down = makeDeps({
      verifyTurnstile: vi.fn(() => Promise.resolve("unreachable" as const)),
    });
    expect(await processContact(raw, { ip: null, deps: down })).toEqual({ status: "error" });
    expect(down.reportFailure).toHaveBeenCalledWith("turnstile_unreachable");
  });

  it("maps database errors to typed results", async () => {
    const quota = makeDeps({
      submitLead: vi.fn(() =>
        Promise.resolve({
          ok: false as const,
          error: {
            code: "P0001",
            message: "form_email_quota_exceeded",
            hint: "contact_alternatives",
          },
        }),
      ),
    });
    expect(await processContact(raw, { ip: null, deps: quota })).toEqual({ status: "quota" });

    const consent = makeDeps({
      submitLead: vi.fn(() =>
        Promise.resolve({
          ok: false as const,
          error: { code: "P0001", message: "consent_required" },
        }),
      ),
    });
    expect(await processContact(raw, { ip: null, deps: consent })).toEqual({
      status: "invalid",
      errors: { consent: "consent_required" },
    });

    const broken = makeDeps({
      submitLead: vi.fn(() =>
        Promise.resolve({
          ok: false as const,
          error: { code: "XX000", message: "ada@example.com" },
        }),
      ),
    });
    expect(await processContact(raw, { ip: null, deps: broken })).toEqual({ status: "error" });
    expect(broken.reportFailure).toHaveBeenCalledWith("XX000");

    const unreachable = makeDeps({
      submitLead: vi.fn(() => Promise.resolve({ ok: false as const, error: null })),
    });
    expect(await processContact(raw, { ip: null, deps: unreachable })).toEqual({ status: "error" });
  });
});

describe("verifyTurnstile", () => {
  const base = { url: "https://verify.test", secret: "s", token: "t", ip: "203.0.113.7" };

  it("posts secret, response and remoteip", async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(Response.json({ success: true })));
    expect(await verifyTurnstile({ ...base, fetchImpl })).toBe("ok");
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.body as URLSearchParams).toString()).toBe(
      "secret=s&response=t&remoteip=203.0.113.7",
    );
  });

  it("distinguishes rejection from outages", async () => {
    const rejected = vi.fn(() => Promise.resolve(Response.json({ success: false })));
    expect(await verifyTurnstile({ ...base, ip: null, fetchImpl: rejected })).toBe("rejected");
    const failing = vi.fn(() => Promise.reject(new Error("offline")));
    expect(await verifyTurnstile({ ...base, fetchImpl: failing })).toBe("unreachable");
    const bad = vi.fn(() => Promise.resolve(new Response("nope", { status: 500 })));
    expect(await verifyTurnstile({ ...base, fetchImpl: bad })).toBe("unreachable");
  });
});

describe("env", () => {
  const full = {
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "k",
    TURNSTILE_SECRET_KEY: "s",
    FORM_IP_HASH_SECRET: "h",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site",
  };

  it("needs every secret", () => {
    expect(readContactServerConfig(full)).not.toBeNull();
    for (const key of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "TURNSTILE_SECRET_KEY",
      "FORM_IP_HASH_SECRET",
    ]) {
      expect(readContactServerConfig({ ...full, [key]: "  " })).toBeNull();
    }
    expect(readContactClientConfig({})).toBeNull();
    expect(readContactClientConfig(full)?.scriptUrl).toContain("challenges.cloudflare.com");
  });
});
