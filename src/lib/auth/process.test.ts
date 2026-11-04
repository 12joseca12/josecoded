import { describe, expect, it, vi } from "vitest";

import type { AuthOutcome } from "./outcome";
import {
  mapEnrollment,
  processRequestCode,
  processVerifyCode,
  processVerifyTotp,
  type RequestCodeDeps,
  type TotpDeps,
  type VerifyCodeDeps,
} from "./process";

const ip = "203.0.113.7";
const factorId = "11111111-1111-4111-8111-111111111111";

function requestDeps(overrides: Partial<RequestCodeDeps> = {}): RequestCodeDeps {
  return {
    rateLimit: vi.fn().mockResolvedValue(true),
    sendCode: vi.fn().mockResolvedValue({ ok: true } satisfies AuthOutcome),
    reportFailure: vi.fn(),
    ...overrides,
  };
}

const validRequest = { email: " Ada@Example.com ", turnstileToken: "t", locale: "es" };

describe("processRequestCode", () => {
  it("is unavailable without deps", async () => {
    expect(await processRequestCode(validRequest, { ip, deps: null })).toEqual({
      status: "unavailable",
    });
  });

  it("validates the email and the token", async () => {
    const deps = requestDeps();
    expect(await processRequestCode({ ...validRequest, email: "" }, { ip, deps })).toEqual({
      status: "invalid",
      error: "email_required",
    });
    expect(await processRequestCode({ ...validRequest, email: "nope" }, { ip, deps })).toEqual({
      status: "invalid",
      error: "email_invalid",
    });
    expect(await processRequestCode({ ...validRequest, turnstileToken: "" }, { ip, deps })).toEqual(
      { status: "invalid", error: "verification_required" },
    );
    expect(deps.sendCode).not.toHaveBeenCalled();
    expect(deps.rateLimit).not.toHaveBeenCalled();
  });

  it("sends the code to the trimmed email once everything passes", async () => {
    const deps = requestDeps();
    expect(await processRequestCode(validRequest, { ip, deps })).toEqual({ status: "sent" });
    expect(deps.sendCode).toHaveBeenCalledWith("Ada@Example.com", "t");
  });

  it("answers the same neutral result for an unknown email", async () => {
    const deps = requestDeps({
      sendCode: vi.fn().mockResolvedValue({ ok: false, failure: "unknown_user" }),
    });
    expect(await processRequestCode(validRequest, { ip, deps })).toEqual({ status: "sent" });
    expect(deps.reportFailure).toHaveBeenCalledWith("otp_unknown_user");
  });

  it("rate limits by ip and by email before asking the provider", async () => {
    const rateLimit = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const deps = requestDeps({ rateLimit });
    expect(await processRequestCode(validRequest, { ip, deps })).toEqual({
      status: "rate_limited",
    });
    expect(rateLimit).toHaveBeenNthCalledWith(1, `otp-ip:${ip}`);
    expect(rateLimit).toHaveBeenNthCalledWith(2, "otp-email:ada@example.com");
    expect(deps.sendCode).not.toHaveBeenCalled();
  });

  it("maps captcha and provider failures", async () => {
    expect(
      await processRequestCode(validRequest, {
        ip,
        deps: requestDeps({
          sendCode: vi.fn().mockResolvedValue({ ok: false, failure: "captcha_failed" }),
        }),
      }),
    ).toEqual({ status: "verification_failed" });
    expect(
      await processRequestCode(validRequest, {
        ip,
        deps: requestDeps({
          sendCode: vi.fn().mockResolvedValue({ ok: false, failure: "rate_limited" }),
        }),
      }),
    ).toEqual({ status: "rate_limited" });
    expect(
      await processRequestCode(validRequest, {
        ip,
        deps: requestDeps({ sendCode: vi.fn().mockResolvedValue({ ok: false, failure: "error" }) }),
      }),
    ).toEqual({ status: "error" });
  });
});

function verifyDeps(overrides: Partial<VerifyCodeDeps> = {}): VerifyCodeDeps {
  return {
    rateLimit: vi.fn().mockResolvedValue(true),
    rateLimitWide: vi.fn().mockResolvedValue(true),
    verifyCode: vi.fn().mockResolvedValue({ ok: true } satisfies AuthOutcome),
    destination: vi.fn().mockResolvedValue("/es/admin"),
    ...overrides,
  };
}

const validVerify = { email: "ada@example.com", code: "123456", locale: "es" };

describe("processVerifyCode", () => {
  it("rejects malformed codes without calling the provider", async () => {
    const deps = verifyDeps();
    for (const code of ["", "12345", "1234567", "abcdef", "12 456"]) {
      expect(await processVerifyCode({ ...validVerify, code }, { ip, deps })).toEqual({
        status: "invalid",
        error: "code_invalid",
      });
    }
    expect(deps.verifyCode).not.toHaveBeenCalled();
  });

  it("returns the destination after a good code", async () => {
    const deps = verifyDeps();
    expect(await processVerifyCode({ ...validVerify, next: "/es/admin" }, { ip, deps })).toEqual({
      status: "ok",
      destination: "/es/admin",
    });
    expect(deps.destination).toHaveBeenCalledWith("es", "/es/admin");
  });

  it("maps wrong, limited and failed codes", async () => {
    const run = (failure: "wrong_code" | "rate_limited" | "error") =>
      processVerifyCode(validVerify, {
        ip,
        deps: verifyDeps({ verifyCode: vi.fn().mockResolvedValue({ ok: false, failure }) }),
      });
    expect(await run("wrong_code")).toEqual({ status: "wrong_code" });
    expect(await run("rate_limited")).toEqual({ status: "rate_limited" });
    expect(await run("error")).toEqual({ status: "error" });
  });

  it("stops brute force per email and ip, and per email overall", async () => {
    const pair = verifyDeps({ rateLimit: vi.fn().mockResolvedValue(false) });
    expect(await processVerifyCode(validVerify, { ip, deps: pair })).toEqual({
      status: "rate_limited",
    });
    expect(pair.rateLimit).toHaveBeenCalledWith(`verify:ada@example.com|${ip}`);
    expect(pair.verifyCode).not.toHaveBeenCalled();
    const wide = verifyDeps({ rateLimitWide: vi.fn().mockResolvedValue(false) });
    expect(await processVerifyCode(validVerify, { ip, deps: wide })).toEqual({
      status: "rate_limited",
    });
    expect(wide.rateLimitWide).toHaveBeenCalledWith("verify-email:ada@example.com");
    expect(wide.verifyCode).not.toHaveBeenCalled();
  });
});

const userId = "22222222-2222-4222-8222-222222222222";

function totpDeps(overrides: Partial<TotpDeps> = {}): TotpDeps {
  return {
    identify: vi.fn().mockResolvedValue(userId),
    rateLimit: vi.fn().mockResolvedValue(true),
    verifyTotp: vi.fn().mockResolvedValue({ ok: true } satisfies AuthOutcome),
    destination: vi.fn().mockResolvedValue("/es/admin"),
    ...overrides,
  };
}

describe("processVerifyTotp", () => {
  const valid = { factorId, code: "654321", locale: "es" };

  it("validates the factor id and the code", async () => {
    const deps = totpDeps();
    expect(await processVerifyTotp({ ...valid, factorId: "x" }, { ip, deps })).toEqual({
      status: "invalid",
      error: "factor_invalid",
    });
    expect(await processVerifyTotp({ ...valid, code: "12" }, { ip, deps })).toEqual({
      status: "invalid",
      error: "code_invalid",
    });
    expect(deps.verifyTotp).not.toHaveBeenCalled();
  });

  it("returns the destination after a good code", async () => {
    expect(await processVerifyTotp(valid, { ip, deps: totpDeps() })).toEqual({
      status: "ok",
      destination: "/es/admin",
    });
  });

  it("limits by ip and by user before asking the provider", async () => {
    const rateLimit = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const deps = totpDeps({ rateLimit });
    expect(await processVerifyTotp(valid, { ip, deps })).toEqual({ status: "rate_limited" });
    expect(rateLimit).toHaveBeenNthCalledWith(1, `totp-ip:${ip}`);
    expect(rateLimit).toHaveBeenNthCalledWith(2, `totp-user:${userId}`);
    expect(deps.verifyTotp).not.toHaveBeenCalled();
  });

  it("needs a signed in staff member", async () => {
    const deps = totpDeps({ identify: vi.fn().mockResolvedValue(null) });
    expect(await processVerifyTotp(valid, { ip, deps })).toEqual({ status: "unauthenticated" });
    expect(deps.rateLimit).not.toHaveBeenCalled();
  });

  it("maps failures", async () => {
    const run = (failure: "wrong_code" | "rate_limited" | "unauthenticated" | "error") =>
      processVerifyTotp(valid, {
        ip,
        deps: totpDeps({ verifyTotp: vi.fn().mockResolvedValue({ ok: false, failure }) }),
      });
    expect(await run("wrong_code")).toEqual({ status: "wrong_code" });
    expect(await run("rate_limited")).toEqual({ status: "rate_limited" });
    expect(await run("unauthenticated")).toEqual({ status: "unauthenticated" });
    expect(await run("error")).toEqual({ status: "error" });
    expect(await processVerifyTotp(valid, { ip, deps: null })).toEqual({ status: "unavailable" });
  });
});

describe("mapEnrollment", () => {
  it("maps every outcome", () => {
    expect(mapEnrollment(null)).toEqual({ status: "unavailable" });
    expect(
      mapEnrollment({ ok: true, factorId, qrCode: "data:image/svg+xml,x", secret: "S" }),
    ).toEqual({
      status: "ready",
      factorId,
      qrCode: "data:image/svg+xml,x",
      secret: "S",
    });
    expect(mapEnrollment({ ok: false, failure: "already_enrolled" })).toEqual({
      status: "unauthenticated",
    });
    expect(mapEnrollment({ ok: false, failure: "rate_limited" })).toEqual({
      status: "rate_limited",
    });
    expect(mapEnrollment({ ok: false, failure: "error" })).toEqual({ status: "error" });
  });
});
