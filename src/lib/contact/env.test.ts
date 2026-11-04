import { describe, expect, it } from "vitest";

import { isContactAvailable, readContactClientConfig, readContactServerConfig } from "./env";

const production = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghij0123456789.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "k",
  TURNSTILE_SECRET_KEY: "0x4AAAsecret",
  FORM_IP_HASH_SECRET: "h",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAsite",
};

const loopback = {
  ...production,
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:3199",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
};

describe("production config", () => {
  it("accepts the real shape and uses Cloudflare defaults", () => {
    const config = readContactServerConfig(production);
    expect(config?.turnstileVerifyUrl).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(config?.loopback).toBe(false);
    expect(config?.allowedHostnames).not.toContain("localhost");
    expect(readContactClientConfig(production)?.scriptUrl).toContain("challenges.cloudflare.com");
    expect(isContactAvailable(production)).toBe(true);
  });

  it("needs every secret", () => {
    for (const key of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "TURNSTILE_SECRET_KEY",
      "FORM_IP_HASH_SECRET",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]) {
      expect(readContactServerConfig({ ...production, [key]: "  " })).toBeNull();
    }
    expect(readContactClientConfig({})).toBeNull();
  });

  it("rejects a Supabase URL that is not a project url", () => {
    for (const url of [
      "https://x.supabase.co",
      "https://evil.example",
      "http://abcdefghij0123456789.supabase.co",
      "https://abcdefghij0123456789.supabase.co.evil.example",
      "https://abcdefghij0123456789.supabase.co/",
    ]) {
      expect(readContactServerConfig({ ...production, NEXT_PUBLIC_SUPABASE_URL: url })).toBeNull();
    }
  });

  it("rejects public override urls", () => {
    expect(
      readContactServerConfig({ ...production, TURNSTILE_VERIFY_URL: "https://evil.example/v" }),
    ).toBeNull();
    expect(
      readContactServerConfig({ ...production, TURNSTILE_VERIFY_URL: "http://localhost:1/v" }),
    ).toBeNull();
    expect(
      readContactClientConfig({ ...production, TURNSTILE_SCRIPT_URL: "https://evil.example/a.js" }),
    ).toBeNull();
  });

  it("rejects Cloudflare test secrets and site keys", () => {
    for (const prefix of ["1x", "2x", "3x"]) {
      expect(
        readContactServerConfig({ ...production, TURNSTILE_SECRET_KEY: `${prefix}0000AA` }),
      ).toBeNull();
      expect(
        readContactClientConfig({ ...production, NEXT_PUBLIC_TURNSTILE_SITE_KEY: `${prefix}00AA` }),
      ).toBeNull();
    }
  });
});

describe("loopback mode", () => {
  it("allows local overrides, test keys and the localhost hostname", () => {
    const env = {
      ...loopback,
      TURNSTILE_VERIFY_URL: "http://127.0.0.1:3199/turnstile/siteverify",
      TURNSTILE_SCRIPT_URL: "http://localhost:3199/turnstile/api.js",
    };
    const config = readContactServerConfig(env);
    expect(config?.turnstileVerifyUrl).toBe("http://127.0.0.1:3199/turnstile/siteverify");
    expect(config?.loopback).toBe(true);
    expect(config?.allowedHostnames).toContain("localhost");
    expect(readContactClientConfig(env)?.scriptUrl).toBe("http://localhost:3199/turnstile/api.js");
  });

  it("still rejects public overrides", () => {
    expect(
      readContactServerConfig({ ...loopback, TURNSTILE_VERIFY_URL: "https://evil.example/v" }),
    ).toBeNull();
    expect(
      readContactClientConfig({ ...loopback, TURNSTILE_SCRIPT_URL: "https://evil.example/a.js" }),
    ).toBeNull();
  });
});
