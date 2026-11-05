import { afterEach, describe, expect, it, vi } from "vitest";

import { passesContactRateLimit, passesRateLimit } from "./rate-limit";

describe("passesRateLimit", () => {
  it("is a no-op without a binding", async () => {
    expect(await passesRateLimit(null, "k")).toBe(true);
  });

  it("passes the key and follows the binding verdict", async () => {
    const allow = { limit: vi.fn(() => Promise.resolve({ success: true })) };
    const deny = { limit: vi.fn(() => Promise.resolve({ success: false })) };
    expect(await passesRateLimit(allow, "abc")).toBe(true);
    expect(allow.limit).toHaveBeenCalledWith({ key: "abc" });
    expect(await passesRateLimit(deny, "abc")).toBe(false);
  });

  it("does not block the form when the binding itself fails", async () => {
    const broken = { limit: vi.fn(() => Promise.reject(new Error("down"))) };
    expect(await passesRateLimit(broken, "abc")).toBe(true);
  });

  it("fails closed on request when asked to, and reports a missing binding", async () => {
    const onMissing = vi.fn();
    expect(await passesRateLimit(null, "k", { failClosed: true, onMissing })).toBe(false);
    expect(onMissing).toHaveBeenCalledTimes(1);
    expect(await passesRateLimit(null, "k", { onMissing })).toBe(true);
    const broken = { limit: vi.fn(() => Promise.reject(new Error("down"))) };
    expect(await passesRateLimit(broken, "k", { failClosed: true })).toBe(false);
  });
});

describe("passesContactRateLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails closed and logs when the binding is missing outside loopback", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await passesContactRateLimit(null, "k", false)).toBe(false);
    expect(log).toHaveBeenCalledWith("limiter_missing", "CONTACT_LIMITER");
  });

  it("fails closed when the binding breaks outside loopback", async () => {
    const broken = { limit: vi.fn(() => Promise.reject(new Error("down"))) };
    expect(await passesContactRateLimit(broken, "k", false)).toBe(false);
  });

  it("lets the form through without a binding on loopback", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await passesContactRateLimit(null, "k", true)).toBe(true);
    expect(log).not.toHaveBeenCalled();
  });

  it("follows the binding verdict", async () => {
    const deny = { limit: vi.fn(() => Promise.resolve({ success: false })) };
    expect(await passesContactRateLimit(deny, "k", false)).toBe(false);
  });
});
