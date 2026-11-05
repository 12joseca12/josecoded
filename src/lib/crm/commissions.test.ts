import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { CommissionLineRow } from "@/types/commissions";
import type { Database } from "@/types/database";

import {
  computeTotals,
  fetchCommissions,
  filterLines,
  parseCommissionFilter,
  parseCommissionView,
} from "./commissions";

function line(overrides: Partial<CommissionLineRow>): CommissionLineRow {
  return {
    id: "61000000-0000-4000-8000-000000000001",
    commission_id: "60000000-0000-4000-8000-000000000001",
    payment_id: null,
    payout_id: null,
    beneficiary_id: "00000000-0000-4000-8000-0000000000c1",
    role: "closer",
    nature: "project",
    rate: 10,
    base: 100000,
    amount: 10000,
    status: "accrued",
    rejected_reason: null,
    created_at: "2026-11-01T10:00:00+00:00",
    commissions: null,
    ...overrides,
  };
}

const lines = [
  line({ id: "a", status: "accrued", amount: 4000 }),
  line({ id: "b", status: "accrued", amount: -1000 }),
  line({ id: "c", status: "approved", amount: 2500 }),
  line({ id: "d", status: "paid", amount: 700 }),
  line({ id: "e", status: "rejected", amount: 900 }),
];

describe("parsing", () => {
  it("accepts only known filters and views", () => {
    expect(parseCommissionFilter("approved")).toBe("approved");
    expect(parseCommissionFilter(["paid", "x"])).toBe("paid");
    expect(parseCommissionFilter("rejected")).toBeNull();
    expect(parseCommissionFilter(undefined)).toBeNull();
    expect(parseCommissionView("headers")).toBe("headers");
    expect(parseCommissionView("nope")).toBe("lines");
  });
});

describe("totals and filters", () => {
  it("nets each status in cents and reports reversals as their own total", () => {
    expect(computeTotals(lines)).toEqual({
      accrued: 3000,
      approved: 2500,
      paid: 700,
      reversed: -1000,
    });
  });

  it("filters by status and treats reversed as the negative lines", () => {
    expect(filterLines(lines, "accrued").map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(filterLines(lines, "paid").map((entry) => entry.id)).toEqual(["d"]);
    expect(filterLines(lines, "reversed").map((entry) => entry.id)).toEqual(["b"]);
    expect(filterLines(lines, null)).toHaveLength(5);
  });
});

function table(rows: unknown[], error: unknown = null) {
  const result = { data: rows, error };
  const builder: Record<string, unknown> = {};
  for (const name of ["select", "order", "limit", "in"]) builder[name] = () => builder;
  builder.then = (resolve: (value: typeof result) => void) => {
    resolve(result);
  };
  return builder;
}

describe("fetchCommissions", () => {
  const client = (tables: Record<string, unknown>) =>
    ({ from: vi.fn((name: string) => tables[name]) }) as unknown as SupabaseClient<Database>;

  const wire = {
    id: "61000000-0000-4000-8000-000000000001",
    commission_id: "60000000-0000-4000-8000-000000000001",
    payment_id: null,
    payout_id: null,
    beneficiary_id: "00000000-0000-4000-8000-0000000000c1",
    role: "closer",
    nature: "project",
    rate: 10,
    base: 1000.5,
    amount: 100.05,
    status: "accrued",
    rejected_reason: null,
    created_at: "2026-11-01T10:00:00+00:00",
    commissions: { deals: { contacts: { full_name: "Bruno" } } },
  };

  it("returns lines in cents and the names of the people", async () => {
    const result = await fetchCommissions(
      client({
        commission_lines: table([wire]),
        commissions: table([]),
        payouts: table([]),
        profiles: table([{ id: wire.beneficiary_id, full_name: "Cleo" }]),
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.lines[0]).toMatchObject({ base: 100050, amount: 10005 });
    expect(result.names).toEqual({ [wire.beneficiary_id]: "Cleo" });
  });

  it("reports an error for failing or malformed responses", async () => {
    const tables = {
      commission_lines: table([wire]),
      commissions: table([]),
      payouts: table([]),
      profiles: table([]),
    };
    expect(
      await fetchCommissions(client({ ...tables, payouts: table([], { code: "XX000" }) })),
    ).toEqual({ status: "error" });
    expect(
      await fetchCommissions(
        client({ ...tables, commission_lines: table([{ ...wire, status: "mystery" }]) }),
      ),
    ).toEqual({ status: "error" });
  });
});
