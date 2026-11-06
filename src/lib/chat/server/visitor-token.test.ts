import { describe, expect, it } from "vitest";

import {
  hashVisitorToken,
  newVisitorToken,
  readVisitorCookie,
  signVisitorToken,
} from "./visitor-token";

const secret = "test-secret";

describe("visitor token", () => {
  it("creates opaque 64 hex tokens and hashes them to 64 hex", async () => {
    const token = newVisitorToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(newVisitorToken()).not.toBe(token);
    expect(await hashVisitorToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashVisitorToken(token)).not.toBe(token);
  });

  it("accepts only cookies this server signed", async () => {
    const token = newVisitorToken();
    const cookie = await signVisitorToken(token, secret);
    expect(await readVisitorCookie(cookie, secret)).toBe(token);
    expect(await readVisitorCookie(cookie, "other-secret")).toBeNull();
    expect(
      await readVisitorCookie(`${newVisitorToken()}.${cookie.split(".")[1] ?? ""}`, secret),
    ).toBeNull();
    expect(await readVisitorCookie(token, secret)).toBeNull();
    expect(await readVisitorCookie(`${cookie}.x`, secret)).toBeNull();
    expect(await readVisitorCookie(undefined, secret)).toBeNull();
    expect(await readVisitorCookie("abc.def", secret)).toBeNull();
  });
});
