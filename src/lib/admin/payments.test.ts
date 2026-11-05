import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";
import type { ReceivableRow } from "@/types/payments";

import {
  buildTemplate,
  fetchReceivables,
  filterReceivables,
  isOverdueRow,
  parsePaymentTab,
  tabCounts,
} from "./payments";

const today = "2026-11-05";

function row(overrides: Partial<ReceivableRow>): ReceivableRow {
  return {
    id: "70000000-0000-4000-8000-000000000001",
    deal_id: "30000000-0000-4000-8000-0000000000a2",
    label: "Hito",
    kind: "milestone",
    percent: null,
    amount: 100000,
    due_at: "2026-12-01",
    status: "scheduled",
    sort: 1,
    deals: { contacts: { full_name: "Bruno" } },
    ...overrides,
  };
}

describe("tabs", () => {
  it("defaults to pending and accepts only known tabs", () => {
    expect(parsePaymentTab(undefined)).toBe("pending");
    expect(parsePaymentTab("overdue")).toBe("overdue");
    expect(parsePaymentTab(["invoices", "paid"])).toBe("invoices");
    expect(parsePaymentTab("hax")).toBe("pending");
  });

  it("separates pending, overdue and paid by status and due date", () => {
    const rows = [
      row({ id: "a", due_at: "2026-12-01" }),
      row({ id: "b", due_at: "2026-10-30", status: "proforma_sent" }),
      row({ id: "c", due_at: "2026-10-01", status: "paid" }),
      row({ id: "d", due_at: "2026-10-01", status: "cancelled" }),
      row({ id: "e", due_at: null }),
    ];
    expect(filterReceivables(rows, "pending", today).map((entry) => entry.id)).toEqual(["a", "e"]);
    expect(filterReceivables(rows, "overdue", today).map((entry) => entry.id)).toEqual(["b"]);
    expect(filterReceivables(rows, "paid", today).map((entry) => entry.id)).toEqual(["c"]);
    expect(filterReceivables(rows, "proformas", today)).toEqual([]);
  });

  it("does not call a due-today milestone overdue", () => {
    expect(isOverdueRow(row({ due_at: today }), today)).toBe(false);
    expect(isOverdueRow(row({ due_at: "2026-11-04" }), today)).toBe(true);
    expect(isOverdueRow(row({ due_at: "2026-11-04", status: "paid" }), today)).toBe(false);
  });

  it("counts documents that are not void", () => {
    const counts = tabCounts(
      [row({ id: "a" }), row({ id: "b", due_at: "2026-10-01" })],
      [
        { kind: "proforma", status: "sent" },
        { kind: "proforma", status: "void" },
        { kind: "invoice", status: "paid" },
      ],
      today,
    );
    expect(counts).toEqual({ pending: 1, overdue: 1, paid: 0, proformas: 1, invoices: 1 });
  });
});

describe("buildTemplate", () => {
  it("splits 40/40/20 in cents and gives the remainder to the last milestone", () => {
    expect(buildTemplate("442", 100000).map((item) => item.amountCents)).toEqual([
      40000, 40000, 20000,
    ]);
    const odd = buildTemplate("442", 100001);
    expect(odd.map((item) => item.amountCents)).toEqual([40000, 40000, 20001]);
    expect(odd.reduce((sum, item) => sum + item.amountCents, 0)).toBe(100001);
    const tiny = buildTemplate("442", 1);
    expect(tiny.reduce((sum, item) => sum + item.amountCents, 0)).toBe(1);
  });

  it("offers a single payment", () => {
    expect(buildTemplate("single", 12345)).toEqual([
      { key: "single", percent: 100, amountCents: 12345 },
    ]);
  });
});

function table(rows: unknown[], error: unknown = null) {
  const result = { data: rows, error };
  const builder: Record<string, unknown> = {};
  for (const name of ["select", "order", "limit", "eq", "not"]) {
    builder[name] = () => builder;
  }
  builder.maybeSingle = () => Promise.resolve(result);
  builder.then = (resolve: (value: typeof result) => void) => {
    resolve(result);
  };
  return builder;
}

describe("fetchReceivables", () => {
  function client(tables: Record<string, unknown>) {
    return { from: vi.fn((name: string) => tables[name]) } as unknown as SupabaseClient<Database>;
  }

  const schedule = {
    id: "70000000-0000-4000-8000-000000000001",
    deal_id: "30000000-0000-4000-8000-0000000000a2",
    label: "Anticipo",
    kind: "milestone",
    percent: 50,
    amount: 1400.5,
    due_at: "2026-10-20",
    status: "paid",
    sort: 1,
    deals: { contacts: { full_name: "Bruno" } },
  };

  it("converts amounts to cents and nets refunds out of the paid total", async () => {
    const result = await fetchReceivables(
      client({
        payment_schedule: table([schedule]),
        invoices: table([]),
        deals: table([
          {
            id: schedule.deal_id,
            won_amount: 2800,
            recurring_monthly: null,
            contacts: { full_name: "Bruno" },
          },
        ]),
        payments: table([
          { schedule_id: schedule.id, kind: "payment", amount_net: 1400.5 },
          { schedule_id: schedule.id, kind: "refund", amount_net: 100.25 },
        ]),
        site_settings: table([], null),
      }),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.schedule[0]?.amount).toBe(140050);
    expect(result.deals[0]?.won_amount).toBe(280000);
    expect(result.paidBySchedule[schedule.id]).toBe(130025);
    expect(result.vatRate).toBe(0);
  });

  it("reports an error for a failing query or a payload outside the contract", async () => {
    const failing = await fetchReceivables(
      client({
        payment_schedule: table([], { code: "XX000" }),
        invoices: table([]),
        deals: table([]),
        payments: table([]),
        site_settings: table([]),
      }),
    );
    expect(failing).toEqual({ status: "error" });
    const broken = await fetchReceivables(
      client({
        payment_schedule: table([{ ...schedule, status: "mystery" }]),
        invoices: table([]),
        deals: table([]),
        payments: table([]),
        site_settings: table([]),
      }),
    );
    expect(broken).toEqual({ status: "error" });
  });
});
