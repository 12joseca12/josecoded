import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";
import { type CounterKey, counterKeys } from "@/types/overview";

import { buildCells, fetchCounters } from "./overview";

const labels = Object.fromEntries(counterKeys.map((key) => [key, key])) as Record<
  CounterKey,
  string
>;

const ready = [
  { zone: "admin" as const, key: "leads", path: "/interesados" },
  { zone: "admin" as const, key: "users", path: "/usuarios" },
  { zone: "admin" as const, key: "system", path: "/sistema" },
  { zone: "admin" as const, key: "projects", path: "/proyectos" },
];

function clientWith(result: { data: unknown; error: unknown }) {
  return { rpc: vi.fn().mockResolvedValue(result) } as unknown as SupabaseClient<Database>;
}

describe("fetchCounters", () => {
  it("accepts partial and extended payloads", async () => {
    const partial = await fetchCounters(clientWith({ data: { leads_new: 2 }, error: null }));
    expect(partial).toEqual({ status: "ok", data: { leads_new: 2 } });
    const extended = await fetchCounters(
      clientWith({ data: { leads_new: 2, future_key: 9 }, error: null }),
    );
    expect(extended.status).toBe("ok");
  });

  it("separates a missing function from a failure and a bad payload", async () => {
    const missing = await fetchCounters(
      clientWith({ data: null, error: { code: "PGRST202", message: "x" } }),
    );
    expect(missing.status).toBe("unavailable");
    const failed = await fetchCounters(
      clientWith({ data: null, error: { code: "XX000", message: "x" } }),
    );
    expect(failed.status).toBe("error");
    const bad = await fetchCounters(clientWith({ data: { leads_new: "many" }, error: null }));
    expect(bad.status).toBe("error");
    const notObject = await fetchCounters(clientWith({ data: 4, error: null }));
    expect(notObject.status).toBe("error");
  });
});

describe("buildCells", () => {
  it("shows a missing key as unknown instead of zero", () => {
    const cells = buildCells({ leads_new: 0, users_active: 3 }, labels, "es", ready);
    const byKey = Object.fromEntries(cells.map((cell) => [cell.key, cell]));
    expect(byKey.leads_new?.value).toBe(0);
    expect(byKey.users_active?.value).toBe(3);
    expect(byKey.payments_overdue?.value).toBeNull();
  });

  it("is all unknown when the function does not exist", () => {
    expect(buildCells(null, labels, "es", ready).every((cell) => cell.value === null)).toBe(true);
  });

  it("links only to sections that are ready, with the filter in the URL", () => {
    const cells = buildCells({}, labels, "es", ready);
    const byKey = Object.fromEntries(cells.map((cell) => [cell.key, cell]));
    expect(byKey.leads_new?.href).toBe("/es/admin/interesados?status=new");
    expect(byKey.leads_waiting_admin?.href).toBe("/es/admin/interesados?status=waiting");
    expect(byKey.jobs_failed?.href).toBe("/es/admin/sistema?estado=failed");
    expect(byKey.stories_to_decide?.href).toBe("/es/admin/proyectos");
    expect(byKey.payments_overdue?.href).toBeNull();
    expect(byKey.accrued_pending_count?.href).toBeNull();
  });

  it("formats the accrued amount in euros", () => {
    const cells = buildCells(
      { accrued_pending_count: 2, accrued_pending_amount: 1234.5 },
      labels,
      "es",
      ready,
    );
    const cell = cells.find((entry) => entry.key === "accrued_pending_count");
    expect(cell?.amount).toMatch(/1234,50|1\.234,50/);
    expect(cell?.amount).toContain("€");
  });
});
