import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { CrmCellLabels, CrmCounters } from "@/types/crm-overview";
import type { Database } from "@/types/database";

import {
  buildStageCells,
  buildTodayCells,
  dueLimit,
  fetchCrmCounters,
  fetchDue,
  primaryAction,
} from "./overview";

interface Result {
  data: unknown;
  error: unknown;
}

const counters: CrmCounters = {
  inbox_new: 3,
  actions_overdue: 2,
  actions_today: 1,
  deals_new: 4,
  deals_contacted: 0,
  deals_meeting: 1,
  deals_proposal: 2,
};

const labels: CrmCellLabels = {
  inbox: "Interesados",
  overdue: "Vencidos",
  dueToday: "Hoy",
  stages: { new: "Nuevas", contacted: "Contactadas", meeting: "Reunión", proposal: "Propuesta" },
};

function rpcClient(result: Result | Error) {
  const rpc = vi.fn(() =>
    result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
  );
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc };
}

function chain(results: Result[]) {
  const calls: [string, unknown[]][] = [];
  let index = 0;
  const make = (): Record<string, unknown> => {
    const result = results[index++] ?? { data: [], error: null };
    const proxy: Record<string, unknown> = {
      then: (resolve: (value: Result) => unknown) => resolve(result),
    };
    for (const method of ["select", "is", "not", "lte", "gt", "order", "limit"]) {
      proxy[method] = (...args: unknown[]) => {
        calls.push([method, args]);
        return proxy;
      };
    }
    return proxy;
  };
  const from = vi.fn(() => make());
  return { client: { from } as unknown as SupabaseClient<Database>, calls, from };
}

const contact = {
  id: "20000000-0000-4000-8000-0000000000a1",
  full_name: "Ada Arquitecta",
  next_action: "Enviar presupuesto",
  next_action_at: "2026-11-01T09:00:00+00:00",
};

describe("fetchCrmCounters", () => {
  it("reads the single counters row through the RPC", async () => {
    const { client, rpc } = rpcClient({ data: [counters], error: null });
    expect(await fetchCrmCounters(client)).toEqual({ status: "ok", data: counters });
    expect(rpc).toHaveBeenCalledWith("crm_counters");
  });

  it("reports an unapplied function as unavailable and other failures as errors", async () => {
    const missing = rpcClient({ data: null, error: { code: "PGRST202", message: "no function" } });
    expect(await fetchCrmCounters(missing.client)).toEqual({ status: "unavailable" });
    const failed = rpcClient({ data: null, error: { code: "XX000", message: "internal" } });
    expect(await fetchCrmCounters(failed.client)).toEqual({ status: "error" });
    const shaped = rpcClient({ data: [{ inbox_new: -1 }], error: null });
    expect(await fetchCrmCounters(shaped.client)).toEqual({ status: "error" });
    const empty = rpcClient({ data: [], error: null });
    expect(await fetchCrmCounters(empty.client)).toEqual({ status: "error" });
    const thrown = rpcClient(new Error("down"));
    expect(await fetchCrmCounters(thrown.client)).toEqual({ status: "error" });
  });
});

describe("fetchDue", () => {
  const now = new Date("2026-11-05T10:00:00Z");

  it("lists the steps up to the end of the Madrid day, oldest first", async () => {
    const { client, calls } = chain([{ data: [contact], error: null }]);
    expect(await fetchDue(client, now)).toEqual({
      status: "ok",
      data: { rows: [contact], next: null },
    });
    expect(calls).toContainEqual(["lte", ["next_action_at", "2026-11-05T22:59:59.999Z"]]);
    expect(calls).toContainEqual(["order", ["next_action_at", { ascending: true }]]);
    expect(calls).toContainEqual(["limit", [dueLimit]]);
    expect(calls).toContainEqual(["is", ["archived_at", null]]);
  });

  it("looks for the next future step when nothing is due", async () => {
    const future = { ...contact, next_action_at: "2026-11-09T09:00:00+00:00" };
    const { client, calls, from } = chain([
      { data: [], error: null },
      { data: [future], error: null },
    ]);
    expect(await fetchDue(client, now)).toEqual({
      status: "ok",
      data: { rows: [], next: future },
    });
    expect(from).toHaveBeenCalledTimes(2);
    expect(calls).toContainEqual(["gt", ["next_action_at", "2026-11-05T23:00:00.000Z"]]);
  });

  it("returns an empty result when there is nothing at all and errors otherwise", async () => {
    const none = chain([
      { data: [], error: null },
      { data: [], error: null },
    ]);
    expect(await fetchDue(none.client, now)).toEqual({
      status: "ok",
      data: { rows: [], next: null },
    });
    const failed = chain([{ data: null, error: { message: "x" } }]);
    expect(await fetchDue(failed.client, now)).toEqual({ status: "error" });
    const shaped = chain([{ data: [{ id: "nope" }], error: null }]);
    expect(await fetchDue(shaped.client, now)).toEqual({ status: "error" });
    const laterFailed = chain([
      { data: [], error: null },
      { data: null, error: { message: "x" } },
    ]);
    expect(await fetchDue(laterFailed.client, now)).toEqual({ status: "error" });
  });
});

describe("cells", () => {
  it("builds the day cells linking to the screens that explain them", () => {
    expect(buildTodayCells(counters, labels, "es")).toEqual([
      {
        key: "inbox_new",
        label: "Interesados",
        value: 3,
        amount: null,
        href: "/es/crm/interesados",
      },
      {
        key: "actions_overdue",
        label: "Vencidos",
        value: 2,
        amount: null,
        href: "/es/crm/contactos?due=1",
      },
      { key: "actions_today", label: "Hoy", value: 1, amount: null, href: "/es/crm/contactos" },
    ]);
  });

  it("builds one cell per open stage and keeps unknown values empty", () => {
    const cells = buildStageCells(null, labels, "en");
    expect(cells.map((cell) => cell.href)).toEqual([
      "/en/crm/contactos?stage=new",
      "/en/crm/contactos?stage=contacted",
      "/en/crm/contactos?stage=meeting",
      "/en/crm/contactos?stage=proposal",
    ]);
    expect(cells.every((cell) => cell.value === null)).toBe(true);
    expect(buildStageCells(counters, labels, "es").map((cell) => cell.value)).toEqual([4, 0, 1, 2]);
  });
});

describe("primaryAction", () => {
  it("prefers overdue steps, then new leads, then nothing", () => {
    expect(primaryAction(counters)).toBe("overdue");
    expect(primaryAction({ ...counters, actions_overdue: 0 })).toBe("leads");
    expect(primaryAction({ ...counters, actions_overdue: 0, inbox_new: 0 })).toBeNull();
    expect(primaryAction(null)).toBeNull();
  });
});
