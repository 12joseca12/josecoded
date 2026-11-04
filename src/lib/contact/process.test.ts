import { describe, expect, it, vi } from "vitest";

import { type ContactDeps, processContact, type SubmitLeadOutcome } from "./process";

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
    rateLimit: vi.fn(() => Promise.resolve(true)),
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

describe("processContact gates", () => {
  it("answers quota before verifying when the rate limit trips", async () => {
    const deps = makeDeps({ rateLimit: vi.fn(() => Promise.resolve(false)) });
    expect(await processContact(raw, { ip: "203.0.113.7", deps })).toEqual({ status: "quota" });
    expect(deps.rateLimit).toHaveBeenCalledWith("a".repeat(64));
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
  });

  it("reports a missing ip by code only and still processes", async () => {
    const deps = makeDeps();
    expect(await processContact(raw, { ip: null, deps })).toEqual({ status: "sent" });
    expect(deps.reportFailure).toHaveBeenCalledWith("ip_missing");
    expect(deps.verifyTurnstile).toHaveBeenCalledWith("token", null);
  });

  it("does not report ip_missing when the ip is present", async () => {
    const deps = makeDeps();
    await processContact(raw, { ip: "203.0.113.7", deps });
    expect(deps.reportFailure).not.toHaveBeenCalled();
  });
});
