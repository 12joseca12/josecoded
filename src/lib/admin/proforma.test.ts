import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchProforma } from "./proforma";

const id = "71000000-0000-4000-8000-000000000001";

const row = {
  id,
  number: "PF-2026-001",
  kind: "proforma",
  issued_at: "2026-10-25",
  amount_net: 1400.1,
  vat_rate: 21,
  vat_amount: 294.02,
  amount_gross: 1694.12,
  status: "sent",
  payment_schedule: { label: "Entrega final 50 %", due_at: "2026-10-30" },
  deals: { contacts: { full_name: "Bruno Banco", organization: null } },
};

function client(result: { data: unknown; error: unknown }) {
  const eq = vi.fn();
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const chain = { eq, maybeSingle, select: vi.fn() };
  eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  const from = vi.fn().mockReturnValue(chain);
  return { client: { from } as unknown as SupabaseClient<Database>, from, eq };
}

describe("fetchProforma", () => {
  it("never queries for a malformed id", async () => {
    const { client: db, from } = client({ data: row, error: null });
    expect(await fetchProforma(db, "no-es-un-id")).toEqual({ status: "missing" });
    expect(from).not.toHaveBeenCalled();
  });

  it("asks only for proformas and returns integer cents", async () => {
    const { client: db, eq } = client({ data: row, error: null });
    const result = await fetchProforma(db, id);
    expect(eq).toHaveBeenCalledWith("id", id);
    expect(eq).toHaveBeenCalledWith("kind", "proforma");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.proforma).toMatchObject({
      number: "PF-2026-001",
      amount_net: 140010,
      vat_amount: 29402,
      amount_gross: 169412,
    });
  });

  it("reports a missing row, a query error and a payload that is not a proforma", async () => {
    expect(await fetchProforma(client({ data: null, error: null }).client, id)).toEqual({
      status: "missing",
    });
    expect(
      await fetchProforma(client({ data: null, error: { code: "XX000" } }).client, id),
    ).toEqual({ status: "error" });
    expect(
      await fetchProforma(
        client({ data: { ...row, number: "F-2026/0001" }, error: null }).client,
        id,
      ),
    ).toEqual({ status: "error" });
  });
});
