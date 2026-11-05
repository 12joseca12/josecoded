import { describe, expect, it, vi } from "vitest";

import { fetchCatalogRows, readCatalogConfig } from "./source";

const config = { supabaseUrl: "http://localhost:3912", serviceRoleKey: "service-key" };

const bodies: Record<string, unknown> = {
  public_offers: [{ slug: "web-presencia", price: null, weeks_min: 2, weeks_max: 3, sort: 10 }],
  public_extras: [{ slug: "seo", price: 250, sort: 10 }],
  public_rates: [{ code: "hourly", price: null }],
  public_maintenance_plans: [{ slug: "s", price_monthly: 49, sort: 10 }],
};

function respond(overrides: Record<string, Response | Error> = {}) {
  return vi.fn((input: string) => {
    const url = input;
    const view = Object.keys(bodies).find((name) => url.includes(`/rest/v1/${name}?`));
    const override = view ? overrides[view] : undefined;
    if (override instanceof Error) return Promise.reject(override);
    if (override) return Promise.resolve(override);
    return Promise.resolve(Response.json(view ? bodies[view] : []));
  }) as unknown as typeof fetch;
}

describe("readCatalogConfig", () => {
  it("needs the URL and the service role key", () => {
    expect(readCatalogConfig({})).toBeNull();
    expect(readCatalogConfig({ NEXT_PUBLIC_SUPABASE_URL: "http://localhost:3912" })).toBeNull();
    expect(
      readCatalogConfig({
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:3912",
        SUPABASE_SERVICE_ROLE_KEY: "k",
      }),
    ).toEqual({ supabaseUrl: "http://localhost:3912", serviceRoleKey: "k" });
  });

  it("refuses a URL that is neither loopback nor the production project shape", () => {
    expect(
      readCatalogConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://evil.example.com",
        SUPABASE_SERVICE_ROLE_KEY: "k",
      }),
    ).toBeNull();
    expect(
      readCatalogConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://echlwywbucgbhwpncviy.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "k",
      }),
    ).not.toBeNull();
  });
});

describe("fetchCatalogRows", () => {
  it("reads the four public views with the service key and parses them", async () => {
    const fetchImpl = respond();
    const rows = await fetchCatalogRows(config, fetchImpl);
    expect(rows?.offers).toHaveLength(1);
    expect(rows?.plans[0]?.price_monthly).toBe(49);
    const mock = vi.mocked(fetchImpl);
    expect(mock).toHaveBeenCalledTimes(4);
    const [url, init] = mock.mock.calls[0] ?? [];
    expect(url).toBe(
      "http://localhost:3912/rest/v1/public_offers?select=slug,price,weeks_min,weeks_max,sort",
    );
    expect((init?.headers as Record<string, string>).apikey).toBe("service-key");
  });

  it("returns null when a view is missing, the response is malformed or the network fails", async () => {
    expect(
      await fetchCatalogRows(
        config,
        respond({ public_extras: new Response("{}", { status: 404 }) }),
      ),
    ).toBeNull();
    expect(
      await fetchCatalogRows(config, respond({ public_rates: Response.json([{ code: 1 }]) })),
    ).toBeNull();
    expect(
      await fetchCatalogRows(config, respond({ public_offers: new Error("offline") })),
    ).toBeNull();
  });
});
