import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn<() => Promise<unknown>>();
const abortSignal = vi.fn();
const createClient = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

const { features } = await import("@/config/features");
const { fetchPublicSettings, getFeatures, readPublicSettingsConfig } = await import("./features");

const production = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghij0123456789.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
};

beforeEach(() => {
  rpc.mockReset();
  abortSignal.mockReset();
  createClient.mockReset();
  abortSignal.mockImplementation(() => rpc());
  createClient.mockReturnValue({ rpc: () => ({ abortSignal }) });
});

describe("readPublicSettingsConfig", () => {
  it("needs the Supabase URL and the service key", () => {
    expect(readPublicSettingsConfig({})).toBeNull();
    expect(
      readPublicSettingsConfig({ NEXT_PUBLIC_SUPABASE_URL: production.NEXT_PUBLIC_SUPABASE_URL }),
    ).toBeNull();
    expect(readPublicSettingsConfig(production)).toEqual({
      supabaseUrl: production.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: "service-key",
    });
  });

  it("refuses a URL that is not a production project or a loopback one", () => {
    expect(
      readPublicSettingsConfig({
        ...production,
        NEXT_PUBLIC_SUPABASE_URL: "https://evil.example.com",
      }),
    ).toBeNull();
    expect(
      readPublicSettingsConfig({
        ...production,
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:3199",
      }),
    ).not.toBeNull();
  });
});

describe("fetchPublicSettings", () => {
  it("returns null without calling Supabase when the config is missing", async () => {
    expect(await fetchPublicSettings({})).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns the key and value of each public setting", async () => {
    rpc.mockResolvedValue({
      data: [{ key: "blog", value: false, updated_at: "2026-11-05T10:00:00+00:00" }],
      error: null,
    });
    expect(await fetchPublicSettings(production)).toEqual([{ key: "blog", value: false }]);
  });

  it("returns null when the function does not exist yet", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "not found" } });
    expect(await fetchPublicSettings(production)).toBeNull();
  });

  it("returns null when the request throws or times out", async () => {
    rpc.mockRejectedValue(new Error("timeout"));
    expect(await fetchPublicSettings(production)).toBeNull();
  });
});

describe("getFeatures", () => {
  it("falls back to the code when Supabase is not configured", async () => {
    expect(await getFeatures()).toEqual(features);
  });
});
