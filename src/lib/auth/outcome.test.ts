import { describe, expect, it } from "vitest";

import { classifyCodeError, classifySendError } from "./outcome";

describe("classifySendError", () => {
  it("reads rate limits by status or code", () => {
    expect(classifySendError({ status: 429 })).toBe("rate_limited");
    expect(classifySendError({ status: 400, code: "over_email_send_rate_limit" })).toBe(
      "rate_limited",
    );
  });

  it("treats unknown emails and other client errors as unknown users", () => {
    expect(classifySendError({ status: 422, code: "otp_disabled" })).toBe("unknown_user");
    expect(classifySendError({ status: 400, code: "user_not_found" })).toBe("unknown_user");
    expect(classifySendError({ status: 400, code: "email_address_invalid" })).toBe("unknown_user");
  });

  it("keeps provider and network faults as errors", () => {
    expect(classifySendError({ status: 500 })).toBe("error");
    expect(classifySendError({ status: 0 })).toBe("error");
    expect(classifySendError({ name: "AuthRetryableFetchError" })).toBe("error");
  });
});

describe("classifyCodeError", () => {
  it("reads a wrong or expired code", () => {
    expect(classifyCodeError({ status: 403, code: "otp_expired" })).toBe("wrong_code");
    expect(classifyCodeError({ status: 400, code: "mfa_verification_failed" })).toBe("wrong_code");
  });

  it("reads rate limits, faults and lost sessions", () => {
    expect(classifyCodeError({ status: 429, code: "over_request_rate_limit" })).toBe(
      "rate_limited",
    );
    expect(classifyCodeError({ status: 503 })).toBe("error");
    expect(classifyCodeError({ status: 401, code: "session_not_found" })).toBe("unauthenticated");
  });
});
