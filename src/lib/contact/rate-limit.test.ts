import { describe, expect, it, vi } from "vitest";

import { passesRateLimit } from "./rate-limit";

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
});
