import { describe, expect, it } from "vitest";

import { features } from "@/config/features";

import { sessionCookieOptions } from "./cookies";

describe("sessionCookieOptions", () => {
  it("keeps session cookies httpOnly, lax and secure outside loopback", () => {
    expect(sessionCookieOptions(false)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("drops secure only for loopback http", () => {
    expect(sessionCookieOptions(true).secure).toBe(false);
  });
});

describe("feature flags", () => {
  it("keeps Google sign-in off", () => {
    expect(features.googleSignIn).toBe(false);
  });
});
