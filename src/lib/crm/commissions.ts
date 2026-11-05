import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type CommissionFilter,
  commissionFilters,
  commissionHeaderRowSchema,
  type CommissionLineRow,
  commissionLineRowSchema,
  type CommissionsResult,
  type CommissionTotalsValue,
  type CommissionView,
  commissionViews,
  payoutRefSchema,
  personRefSchema,
} from "@/types/commissions";
import type { Database } from "@/types/database";

const lineColumns =
  "id, commission_id, payment_id, payout_id, beneficiary_id, role, nature, rate, base, amount, status, rejected_reason, created_at, commissions(deals(contacts(full_name)))";
const headerColumns =
  "id, deal_id, closer_id, closer_rate, closer_recurring_rate, subcloser_id, subcloser_rate, subcloser_recurring_rate, expected_base, expected_closer_amount, expected_subcloser_amount, deals(contacts(full_name))";

const linesSchema = z.array(commissionLineRowSchema);
const headersSchema = z.array(commissionHeaderRowSchema);
const payoutsSchema = z.array(payoutRefSchema);
const peopleSchema = z.array(personRefSchema);

export function parseCommissionFilter(
  value: string | string[] | undefined,
): CommissionFilter | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return commissionFilters.find((filter) => filter === raw) ?? null;
}

export function parseCommissionView(value: string | string[] | undefined): CommissionView {
  const raw = Array.isArray(value) ? value[0] : value;
  return commissionViews.find((view) => view === raw) ?? "lines";
}

export function computeTotals(lines: readonly CommissionLineRow[]): CommissionTotalsValue {
  const totals: CommissionTotalsValue = { accrued: 0, approved: 0, paid: 0, reversed: 0 };
  for (const line of lines) {
    if (line.status === "accrued") totals.accrued += line.amount;
    if (line.status === "approved") totals.approved += line.amount;
    if (line.status === "paid") totals.paid += line.amount;
    if (line.amount < 0) totals.reversed += line.amount;
  }
  return totals;
}

export function filterLines(
  lines: readonly CommissionLineRow[],
  filter: CommissionFilter | null,
): CommissionLineRow[] {
  if (filter === null) return [...lines];
  if (filter === "reversed") return lines.filter((line) => line.amount < 0);
  return lines.filter((line) => line.status === filter);
}

export function headerAccrued(lines: readonly CommissionLineRow[], commissionId: string): number {
  return lines
    .filter((line) => line.commission_id === commissionId && line.status !== "rejected")
    .reduce((sum, line) => sum + line.amount, 0);
}

export async function fetchCommissions(
  client: SupabaseClient<Database>,
): Promise<CommissionsResult> {
  try {
    const [lines, headers, payouts, people] = await Promise.all([
      client
        .from("commission_lines")
        .select(lineColumns)
        .order("created_at", { ascending: false })
        .limit(500),
      client
        .from("commissions")
        .select(headerColumns)
        .order("created_at", { ascending: false })
        .limit(500),
      client.from("payouts").select("id, period_start, period_end, status").limit(500),
      client.from("profiles").select("id, full_name").in("role", ["admin", "closer"]),
    ]);
    if (lines.error || headers.error || payouts.error || people.error) return { status: "error" };
    const parsedLines = linesSchema.safeParse(lines.data);
    const parsedHeaders = headersSchema.safeParse(headers.data);
    const parsedPayouts = payoutsSchema.safeParse(payouts.data);
    const parsedPeople = peopleSchema.safeParse(people.data);
    if (
      !parsedLines.success ||
      !parsedHeaders.success ||
      !parsedPayouts.success ||
      !parsedPeople.success
    ) {
      return { status: "error" };
    }
    return {
      status: "ok",
      lines: parsedLines.data,
      headers: parsedHeaders.data,
      payouts: parsedPayouts.data,
      names: Object.fromEntries(parsedPeople.data.map((person) => [person.id, person.full_name])),
    };
  } catch {
    return { status: "error" };
  }
}
