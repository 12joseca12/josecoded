import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchDealMoney } from "./deal-money";

const dealId = "30000000-0000-4000-8000-0000000000a2";
const commissionId = "60000000-0000-4000-8000-000000000001";
const closerId = "00000000-0000-4000-8000-0000000000c1";

const header = {
  id: commissionId,
  deal_id: dealId,
  closer_id: closerId,
  closer_rate: 10,
  closer_recurring_rate: 5,
  subcloser_id: null,
  subcloser_rate: null,
  subcloser_recurring_rate: null,
  expected_base: 2800.1,
  expected_closer_amount: 280.01,
  expected_subcloser_amount: 0,
};

const line = {
  id: "61000000-0000-4000-8000-000000000001",
  commission_id: commissionId,
  payment_id: "72000000-0000-4000-8000-000000000001",
  payout_id: null,
  beneficiary_id: closerId,
  role: "closer",
  nature: "project",
  rate: 10,
  base: 1120.04,
  amount: 112.0,
  status: "accrued",
  rejected_reason: null,
  created_at: "2026-11-01T10:00:00+00:00",
};

const payment = {
  id: "72000000-0000-4000-8000-000000000001",
  schedule_id: null,
  kind: "payment",
  nature: "project",
  amount_net: 1120.04,
  received_at: "2026-11-01",
  method: null,
  reference: null,
};

interface Builder {
  select: () => Builder;
  in: () => Builder;
  order: () => Promise<{ data: unknown[]; error: unknown }>;
  then: (resolve: (value: { data: unknown[]; error: unknown }) => void) => void;
}

function table(rows: unknown[], error: unknown = null): Builder {
  const result = { data: rows, error };
  const builder: Builder = {
    select: () => builder,
    in: () => builder,
    order: () => Promise.resolve(result),
    then: (resolve) => {
      resolve(result);
    },
  };
  return builder;
}

function client(overrides: Record<string, Builder> = {}, paymentRows: unknown[] = [payment]) {
  const tables: Record<string, Builder> = {
    commissions: table([header]),
    commission_lines: table([line]),
    payment_schedule: table([]),
    invoices: table([]),
    ...overrides,
  };
  const from = vi.fn((name: string) => tables[name]);
  const rpc = vi.fn().mockResolvedValue({ data: paymentRows, error: null });
  return { client: { from, rpc } as unknown as SupabaseClient<Database>, from, rpc };
}

describe("fetchDealMoney", () => {
  it("returns an empty result without touching the database for no deals", async () => {
    const { client: empty, from } = client();
    const result = await fetchDealMoney(empty, [], true);
    expect(result).toEqual({
      status: "ok",
      data: { commissions: [], lines: [], schedule: [], invoices: [], payments: [] },
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("converts every euro amount to integer cents and tags payments with their deal", async () => {
    const { client: money } = client();
    const result = await fetchDealMoney(money, [dealId], true);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.data.commissions[0]).toMatchObject({
      expected_base: 280010,
      expected_closer_amount: 28001,
      expected_subcloser_amount: 0,
    });
    expect(result.data.lines[0]).toMatchObject({ base: 112004, amount: 11200 });
    expect(result.data.payments).toEqual([
      expect.objectContaining({ amount_net: 112004, deal_id: dealId }),
    ]);
  });

  it("skips invoices for non-admins", async () => {
    const { client: money, from } = client();
    await fetchDealMoney(money, [dealId], false);
    expect(from).not.toHaveBeenCalledWith("invoices");
  });

  it("reports an error when a payload does not match the contract", async () => {
    const broken = client({ commissions: table([{ ...header, closer_id: "x" }]) });
    expect(await fetchDealMoney(broken.client, [dealId], true)).toEqual({ status: "error" });
  });

  it("reports an error when a query fails", async () => {
    const failing = client({ payment_schedule: table([], { code: "XX000" }) });
    expect(await fetchDealMoney(failing.client, [dealId], true)).toEqual({ status: "error" });
  });
});
