import { describe, expect, it } from "vitest";

import { readAuthServerConfig, readSupabasePublicConfig } from "./env";

const production = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghij0123456789.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_AbCdEf0123456789",
  TURNSTILE_SECRET_KEY: "0x4AAAsecret",
};

const loopback = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:3199",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anything",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
};

describe("public Supabase config", () => {
  it("accepts a project url with a publishable key", () => {
    expect(readSupabasePublicConfig(production)).toEqual({
      supabaseUrl: production.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: production.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      loopback: false,
    });
  });

  it("needs both values", () => {
    expect(readSupabasePublicConfig({})).toBeNull();
    expect(readSupabasePublicConfig({ ...production, NEXT_PUBLIC_SUPABASE_URL: " " })).toBeNull();
    expect(
      readSupabasePublicConfig({ ...production, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toBeNull();
  });

  it("never accepts a secret or legacy service key as the public key", () => {
    for (const key of [
      "sb_secret_AbCdEf0123456789",
      "placeholder",
      "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature",
    ]) {
      expect(
        readSupabasePublicConfig({ ...production, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }),
      ).toBeNull();
    }
  });

  it("rejects urls that are not a project", () => {
    for (const url of [
      "https://evil.example",
      "http://abcdefghij0123456789.supabase.co",
      "https://abcdefghij0123456789.supabase.co.evil.example",
    ]) {
      expect(readSupabasePublicConfig({ ...production, NEXT_PUBLIC_SUPABASE_URL: url })).toBeNull();
    }
  });

  it("allows loopback urls and any key for local runs", () => {
    expect(readSupabasePublicConfig(loopback)?.loopback).toBe(true);
  });
});

describe("auth server config", () => {
  it("adds the Turnstile secret and Cloudflare defaults in production", () => {
    const config = readAuthServerConfig(production);
    expect(config?.turnstileVerifyUrl).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(config?.allowedHostnames).not.toContain("localhost");
  });

  it("needs the Turnstile secret and refuses test secrets in production", () => {
    expect(readAuthServerConfig({ ...production, TURNSTILE_SECRET_KEY: "" })).toBeNull();
    expect(
      readAuthServerConfig({ ...production, TURNSTILE_SECRET_KEY: "1x0000000000000000AA" }),
    ).toBeNull();
  });

  it("only accepts a verify override in loopback mode", () => {
    expect(
      readAuthServerConfig({ ...production, TURNSTILE_VERIFY_URL: "http://localhost:1/v" }),
    ).toBeNull();
    const local = readAuthServerConfig({
      ...loopback,
      TURNSTILE_VERIFY_URL: "http://127.0.0.1:3199/turnstile/siteverify",
    });
    expect(local?.turnstileVerifyUrl).toBe("http://127.0.0.1:3199/turnstile/siteverify");
    expect(local?.allowedHostnames).toContain("localhost");
    expect(
      readAuthServerConfig({ ...loopback, TURNSTILE_VERIFY_URL: "https://evil.example/v" }),
    ).toBeNull();
  });
});
