import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchPriceCatalog, historyKey, mapPriceError, runPriceAction } from "./prices";

interface Result {
  data: unknown;
  error: unknown;
}

interface Call {
  table: string;
  method: string;
  args: unknown[];
}

function chain(result: Result, calls: Call[], table: string) {
  const handler: ProxyHandler<object> = {
    get(_target, property) {
      if (property === "then") {
        return (resolve: (value: Result) => void) => {
          resolve(result);
        };
      }
      return (...args: unknown[]) => {
        calls.push({ table, method: String(property), args });
        return proxy;
      };
    },
  };
  const proxy: object = new Proxy({}, handler);
  return proxy;
}

function clientWith(results: Record<string, Result | Result[]>) {
  const calls: Call[] = [];
  const queues = new Map(
    Object.entries(results).map(([table, value]) => [
      table,
      Array.isArray(value) ? [...value] : [value],
    ]),
  );
  const from = vi.fn((table: string) => {
    const queue: Result[] = queues.get(table) ?? [{ data: [], error: null }];
    const result = (queue.length > 1 ? queue.shift() : queue[0]) ?? { data: [], error: null };
    return chain(result, calls, table);
  });
  return { client: { from } as unknown as SupabaseClient<Database>, calls };
}

const stamp = "2026-11-05T10:00:00.123456+00:00";

const offer = {
  slug: "web-presencia",
  name_es: "Presencia",
  name_en: "Presence",
  price: null,
  weeks_min: 2,
  weeks_max: 3,
  visible: true,
  sort: 10,
  archived_at: null,
  updated_at: stamp,
};
const extra = {
  slug: "seo",
  name_es: "Posicionamiento",
  name_en: "SEO",
  price: 300,
  billing: "once",
  visible: true,
  sort: 20,
  archived_at: null,
  updated_at: stamp,
};
const extraFirst = { ...extra, slug: "accounts", sort: 10 };
const rate = {
  code: "hourly",
  label_es: "Por hora",
  label_en: "Per hour",
  price: null,
  visible: true,
  sort: 10,
  updated_at: stamp,
};
const plan = {
  slug: "s",
  name_es: "Plan S",
  name_en: "Plan S",
  price_monthly: 49,
  visible: true,
  sort: 10,
  archived_at: "2026-11-05T11:00:00+00:00",
  updated_at: stamp,
};
const adminId = "00000000-0000-4000-8000-0000000000a1";

describe("fetchPriceCatalog", () => {
  it("maps each table to items and groups the history per row with the author name", async () => {
    const { client } = clientWith({
      offers: { data: [offer], error: null },
      extras: { data: [extra, extraFirst], error: null },
      rates: { data: [rate], error: null },
      maintenance_plans: { data: [plan], error: null },
      price_changes: {
        data: [
          {
            id: 7,
            table_name: "extras",
            row_id: "seo",
            field: "price",
            before: null,
            after: "300",
            changed_by: adminId,
            changed_at: stamp,
          },
          {
            id: 6,
            table_name: "unknown",
            row_id: "x",
            field: "price",
            before: null,
            after: "1",
            changed_by: null,
            changed_at: stamp,
          },
        ],
        error: null,
      },
      profiles: { data: [{ id: adminId, full_name: "Jose Admin" }], error: null },
    });
    const result = await fetchPriceCatalog(client);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const { items, history } = result.catalog;
    expect(items.offers[0]).toMatchObject({
      table: "offers",
      key: "web-presencia",
      price: null,
      weeks: { min: 2, max: 3 },
      archived: false,
    });
    expect(items.extras.map((entry) => entry.key)).toEqual(["accounts", "seo"]);
    expect(items.extras[1]).toMatchObject({ billing: "once", price: 300 });
    expect(items.rates[0]).toMatchObject({ key: "hourly", nameEs: "Por hora" });
    expect(items.plans[0]).toMatchObject({
      key: "s",
      price: 49,
      archived: true,
      billing: "monthly",
    });
    expect(history[historyKey("extras", "seo")]).toEqual([
      { id: 7, field: "price", before: null, after: "300", by: "Jose Admin", at: stamp },
    ]);
    expect(Object.keys(history)).toEqual([historyKey("extras", "seo")]);
  });

  it("reports an error when a table cannot be read or has an unexpected shape", async () => {
    const failing = clientWith({ offers: { data: null, error: { code: "42P01" } } });
    expect(await fetchPriceCatalog(failing.client)).toEqual({ status: "error" });
    const malformed = clientWith({ offers: { data: [{ slug: 1 }], error: null } });
    expect(await fetchPriceCatalog(malformed.client)).toEqual({ status: "error" });
  });
});

describe("mapPriceError", () => {
  it("maps permissions, constraint violations and everything else", () => {
    expect(mapPriceError({ code: "42501" })).toEqual({ status: "forbidden" });
    expect(mapPriceError({ code: "23514" })).toEqual({ status: "invalid", field: "price" });
    expect(mapPriceError({ code: "XX000" })).toEqual({ status: "error" });
  });
});

describe("runPriceAction save", () => {
  const base = { table: "extras", key: "seo", expectedUpdatedAt: stamp, price: "250,5" };

  it("updates the price guarded by updated_at and reports done", async () => {
    const { client, calls } = clientWith({ extras: { data: [{ slug: "seo" }], error: null } });
    expect(await runPriceAction(client, "save", { ...base, visible: false })).toEqual({
      status: "done",
    });
    expect(calls.find((call) => call.method === "update")?.args).toEqual([
      { price: 250.5, visible: false },
    ]);
    expect(calls.filter((call) => call.method === "eq").map((call) => call.args)).toEqual([
      ["slug", "seo"],
      ["updated_at", stamp],
    ]);
  });

  it("stores an empty price as null so the web shows it under review", async () => {
    const { client, calls } = clientWith({
      maintenance_plans: { data: [{ slug: "s" }], error: null },
    });
    await runPriceAction(client, "save", { ...base, table: "plans", key: "s", price: "" });
    expect(calls.find((call) => call.method === "update")?.args).toEqual([{ price_monthly: null }]);
  });

  it("only sends visibility for extras and plans and weeks for offers", async () => {
    const { client, calls } = clientWith({
      offers: { data: [{ slug: "web-negocio" }], error: null },
    });
    await runPriceAction(client, "save", {
      ...base,
      table: "offers",
      key: "web-negocio",
      price: "1200",
      visible: false,
      weeksMin: 4,
      weeksMax: 6,
    });
    expect(calls.find((call) => call.method === "update")?.args).toEqual([
      { price: 1200, weeks_min: 4, weeks_max: 6 },
    ]);
  });

  it("rejects bad prices and inverted weeks without calling the database", async () => {
    const { client, calls } = clientWith({});
    expect(await runPriceAction(client, "save", { ...base, price: "-5" })).toEqual({
      status: "invalid",
      field: "price",
    });
    expect(await runPriceAction(client, "save", { ...base, price: "12.345" })).toEqual({
      status: "invalid",
      field: "price",
    });
    expect(
      await runPriceAction(client, "save", {
        ...base,
        table: "offers",
        price: "1",
        weeksMin: 5,
        weeksMax: 2,
      }),
    ).toEqual({ status: "invalid", field: "weeks" });
    expect(await runPriceAction(client, "save", { ...base, table: "offers", price: "1" })).toEqual({
      status: "invalid",
      field: "weeks",
    });
    expect(calls).toHaveLength(0);
  });

  it("reports a row that changed in the meantime as stale and permissions as forbidden", async () => {
    const stale = clientWith({ extras: { data: [], error: null } });
    expect(await runPriceAction(stale.client, "save", base)).toEqual({ status: "stale" });
    const denied = clientWith({ extras: { data: null, error: { code: "42501" } } });
    expect(await runPriceAction(denied.client, "save", base)).toEqual({ status: "forbidden" });
  });

  it("turns a thrown error into a generic error", async () => {
    const client = {
      from: () => {
        throw new Error("network");
      },
    } as unknown as SupabaseClient<Database>;
    expect(await runPriceAction(client, "save", base)).toEqual({ status: "error" });
  });
});

describe("runPriceAction archive", () => {
  const base = { table: "extras", key: "seo", expectedUpdatedAt: stamp };

  it("archives and restores guarded by updated_at", async () => {
    const { client, calls } = clientWith({ extras: { data: [{ slug: "seo" }], error: null } });
    expect(await runPriceAction(client, "archive", { ...base, archived: true })).toEqual({
      status: "done",
    });
    const archived = calls.find((call) => call.method === "update")?.args[0] as {
      archived_at: string;
    };
    expect(Number.isNaN(Date.parse(archived.archived_at))).toBe(false);
    await runPriceAction(client, "archive", { ...base, archived: false });
    const updates = calls.filter((call) => call.method === "update");
    expect(updates[1]?.args).toEqual([{ archived_at: null }]);
  });

  it("does not archive rates", async () => {
    const { client, calls } = clientWith({});
    expect(
      await runPriceAction(client, "archive", { ...base, table: "rates", archived: true }),
    ).toEqual({ status: "error" });
    expect(calls).toHaveLength(0);
  });
});

describe("runPriceAction move", () => {
  const rows = [
    { slug: "accounts", sort: 10 },
    { slug: "admin", sort: 20 },
    { slug: "seo", sort: 30 },
  ];

  it("swaps the sort values of two neighbours", async () => {
    const { client, calls } = clientWith({ extras: { data: rows, error: null } });
    expect(
      await runPriceAction(client, "move", { table: "extras", key: "seo", direction: "up" }),
    ).toEqual({ status: "done" });
    const updates = calls.filter((call) => call.method === "update").map((call) => call.args[0]);
    expect(updates).toEqual([{ sort: 20 }, { sort: 30 }]);
    const targets = calls.filter((call) => call.method === "eq").map((call) => call.args);
    expect(targets).toEqual([
      ["slug", "seo"],
      ["slug", "admin"],
    ]);
  });

  it("does nothing at the ends of the list", async () => {
    const { client, calls } = clientWith({ extras: { data: rows, error: null } });
    expect(
      await runPriceAction(client, "move", { table: "extras", key: "accounts", direction: "up" }),
    ).toEqual({ status: "done" });
    expect(calls.some((call) => call.method === "update")).toBe(false);
  });

  it("renumbers a list whose sort values collide", async () => {
    const tied = [
      { slug: "a", sort: 0 },
      { slug: "b", sort: 0 },
    ];
    const { client, calls } = clientWith({ extras: { data: tied, error: null } });
    await runPriceAction(client, "move", { table: "extras", key: "b", direction: "up" });
    const updates = calls.filter((call) => call.method === "update").map((call) => call.args[0]);
    expect(updates).toEqual([{ sort: 10 }, { sort: 20 }]);
  });

  it("reports an unknown row as stale and refuses offers and rates", async () => {
    const { client } = clientWith({ extras: { data: rows, error: null } });
    expect(
      await runPriceAction(client, "move", { table: "extras", key: "gone", direction: "up" }),
    ).toEqual({ status: "stale" });
    expect(
      await runPriceAction(client, "move", { table: "offers", key: "x", direction: "up" }),
    ).toEqual({ status: "error" });
  });
});
