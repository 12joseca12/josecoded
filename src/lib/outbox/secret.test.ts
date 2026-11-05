import { describe, expect, it } from "vitest";

import { secretMatches } from "./secret";

describe("secretMatches", () => {
  it("accepts the same secret", async () => {
    expect(await secretMatches("s3cret-value", "s3cret-value")).toBe(true);
  });

  it("refuses a different, shorter, longer or empty secret", async () => {
    expect(await secretMatches("s3cret-valuf", "s3cret-value")).toBe(false);
    expect(await secretMatches("s3cret", "s3cret-value")).toBe(false);
    expect(await secretMatches("s3cret-value-and-more", "s3cret-value")).toBe(false);
    expect(await secretMatches("", "s3cret-value")).toBe(false);
  });

  it("refuses everything when no secret is configured", async () => {
    expect(await secretMatches("anything", null)).toBe(false);
    expect(await secretMatches("anything", "")).toBe(false);
    expect(await secretMatches(null, null)).toBe(false);
    expect(await secretMatches(undefined, undefined)).toBe(false);
  });
});
