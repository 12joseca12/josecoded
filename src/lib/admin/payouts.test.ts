import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { fetchPayoutDetail, fetchPayouts, parsePayoutTab, previewPayoutLines } from "./payouts";

const id = "73000000-0000-4000-8000-000000000001";
const beneficiary = "00000000-0000-4000-8000-0000000000c2";

function table(rows: unknown, error: unknown = null) {
  const result = { data: rows, error };
  const builder: Record<string, unknown> = {};
  for (const name of ["select", "order", "limit", "in", "eq", "is", "gte", "lte"])
    builder[name] = () => builder;
  builder.maybeSingle = () => Promise.resolve(result);
  builder.then = (resolve: (value: typeof result) => void) => {
    resolve(result);
  };
  return builder;
}

function client(tables: Record<string, unknown>) {
  return { from: vi.fn((name: string) => tables[name]) } as unknown as SupabaseClient<Database>;
}

const payout = {
  id,
  beneficiary_id: beneficiary,
  period_start: "2026-10-01",
  period_end: "2026-10-15",
  cadence: "biweekly",
  total: 120.5,
  withholding_rate: 15,
  net_total: 102.43,
  status: "issued",
  statement_note: null,
  closer_invoice_path: null,
  issued_at: "2026-10-16T09:00:00+00:00",
  paid_at: null,
  paid_reference: null,
};

describe("parsePayoutTab", () => {
  it("falls back to all", () => {
    expect(parsePayoutTab("paid")).toBe("paid");
    expect(parsePayoutTab(["draft"])).toBe("draft");
    expect(parsePayoutTab("nope")).toBe("all");
    expect(parsePayoutTab(undefined)).toBe("all");
  });
});

describe("fetchPayouts", () => {
  const people = [
    {
      id: beneficiary,
      full_name: "Dani",
      role: "closer",
      is_active: true,
      payout_cadence: "weekly",
    },
  ];

  it("returns amounts in cents and the default cadence", async () => {
    const result = await fetchPayouts(
      client({
        payouts: table([payout]),
        profiles: table(people),
        site_settings: table({ value: "per_payment" }),
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.payouts[0]).toMatchObject({ total: 12050, net_total: 10243 });
    expect(result.defaultCadence).toBe("per_payment");
    expect(result.beneficiaries).toHaveLength(1);
  });

  it("falls back to biweekly when the setting is missing", async () => {
    const result = await fetchPayouts(
      client({ payouts: table([]), profiles: table(people), site_settings: table(null) }),
    );
    expect(result.status === "ok" && result.defaultCadence).toBe("biweekly");
  });

  it("reports an error for failures and malformed rows", async () => {
    expect(
      await fetchPayouts(
        client({
          payouts: table([], { code: "X" }),
          profiles: table([]),
          site_settings: table(null),
        }),
      ),
    ).toEqual({ status: "error" });
    expect(
      await fetchPayouts(
        client({
          payouts: table([{ ...payout, status: "mystery" }]),
          profiles: table([]),
          site_settings: table(null),
        }),
      ),
    ).toEqual({ status: "error" });
  });
});

describe("fetchPayoutDetail", () => {
  const line = {
    id: "61000000-0000-4000-8000-000000000005",
    commission_id: "60000000-0000-4000-8000-000000000002",
    payment_id: null,
    payout_id: id,
    beneficiary_id: beneficiary,
    role: "closer",
    nature: "recurring",
    rate: 4,
    base: 50,
    amount: 2,
    status: "approved",
    rejected_reason: null,
    created_at: "2026-10-10T12:00:00+00:00",
    payments: { received_at: "2026-10-10" },
    commissions: { deals: { contacts: { full_name: "Carmen" } } },
  };

  it("never queries a malformed id", async () => {
    const db = client({});
    expect(await fetchPayoutDetail(db, "x")).toEqual({ status: "missing" });
  });

  it("returns the payout, its lines and the beneficiary name", async () => {
    const result = await fetchPayoutDetail(
      client({
        payouts: table(payout),
        commission_lines: table([line]),
        freelance_fee_items: table([]),
        profiles: table([{ id: beneficiary, full_name: "Dani" }]),
      }),
      id,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.beneficiary).toBe("Dani");
    expect(result.lines[0]).toMatchObject({ base: 5000, amount: 200 });
  });

  it("reports a missing payout", async () => {
    expect(
      await fetchPayoutDetail(
        client({
          payouts: table(null),
          commission_lines: table([]),
          freelance_fee_items: table([]),
          profiles: table([]),
        }),
        id,
      ),
    ).toEqual({ status: "missing" });
  });
});

describe("previewPayoutLines", () => {
  it("counts only lines whose payment falls inside the period", async () => {
    const result = await previewPayoutLines(
      client({
        commission_lines: table([
          { amount: 40, payments: { received_at: "2026-10-28" } },
          { amount: 10.5, payments: { received_at: "2026-10-31" } },
          { amount: 99, payments: { received_at: "2026-11-01" } },
          { amount: 7, payments: null },
        ]),
      }),
      beneficiary,
      "closer",
      "2026-10-01",
      "2026-10-31",
    );
    expect(result).toEqual({ status: "ok", count: 2, totalCents: 5050 });
  });

  it("reports an error when the query fails", async () => {
    expect(
      await previewPayoutLines(
        client({ commission_lines: table([], { code: "X" }) }),
        beneficiary,
        "closer",
        "2026-10-01",
        "2026-10-31",
      ),
    ).toEqual({ status: "error" });
  });

  it("sums the approved fee items of a freelance in the period", async () => {
    const result = await previewPayoutLines(
      client({
        freelance_fee_items: table([
          { amount: 280, worked_on: "2026-10-10" },
          { amount: 70.5, worked_on: "2026-10-20" },
        ]),
      }),
      beneficiary,
      "freelance",
      "2026-10-01",
      "2026-10-31",
    );
    expect(result).toEqual({ status: "ok", count: 2, totalCents: 35050 });
  });
});

describe("fetchPayoutDetail for a freelance", () => {
  it("returns the fee items of the payout", async () => {
    const result = await fetchPayoutDetail(
      client({
        payouts: table({ ...payout, kind: "freelance" }),
        commission_lines: table([]),
        freelance_fee_items: table([
          {
            id: "75000000-0000-4000-8000-000000000001",
            label: "Catálogo",
            hours: 8,
            amount: 280,
            worked_on: "2026-10-10",
          },
        ]),
        profiles: table([{ id: beneficiary, full_name: "Fran" }]),
      }),
      id,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.payout.kind).toBe("freelance");
    expect(result.items).toEqual([
      expect.objectContaining({ label: "Catálogo", hours: 8, amount: 28000 }),
    ]);
  });
});
