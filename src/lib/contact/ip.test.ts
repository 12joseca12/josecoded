import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { hashIp, isKnownIp, normaliseIp } from "./ip";

describe("normaliseIp", () => {
  it("keeps IPv4 as is", () => {
    expect(normaliseIp("203.0.113.7")).toBe("203.0.113.7");
  });

  it("unwraps IPv4-mapped IPv6", () => {
    expect(normaliseIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("collapses IPv6 to its /64 regardless of notation", () => {
    const expected = "2001:db8:1:2::/64";
    expect(normaliseIp("2001:db8:1:2:aaaa:bbbb:cccc:dddd")).toBe(expected);
    expect(normaliseIp("2001:0DB8:0001:0002:0000:0000:0000:0001")).toBe(expected);
    expect(normaliseIp("2001:db8:1:2::1")).toBe(expected);
    expect(normaliseIp("2001:db8:1:2::")).toBe(expected);
    expect(normaliseIp("2001:db8:1:2::1%eth0")).toBe(expected);
  });

  it("expands :: inside the first 64 bits", () => {
    expect(normaliseIp("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(normaliseIp("::1")).toBe("0:0:0:0::/64");
  });

  it("gives a different value for a different /64", () => {
    expect(normaliseIp("2001:db8:1:3::1")).not.toBe(normaliseIp("2001:db8:1:2::1"));
  });

  it("falls back to unknown for missing or invalid input", () => {
    for (const value of [null, undefined, "", "not-an-ip", "1.2.3", "2001:::1"]) {
      expect(normaliseIp(value)).toBe("unknown");
      expect(isKnownIp(value)).toBe(false);
    }
    expect(isKnownIp("203.0.113.7")).toBe(true);
  });
});

describe("hashIp", () => {
  const secret = "secret-for-tests";

  it("is HMAC-SHA256 hex of the normalised address", async () => {
    const expected = createHmac("sha256", secret).update("2001:db8:1:2::/64").digest("hex");
    expect(await hashIp("2001:db8:1:2:9:9:9:9", secret)).toBe(expected);
  });

  it("is stable inside a /64 and differs with the secret", async () => {
    const a = await hashIp("2001:db8:1:2::1", secret);
    expect(await hashIp("2001:db8:1:2::ffff", secret)).toBe(a);
    expect(await hashIp("2001:db8:1:2::1", "other")).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("2001");
  });
});
