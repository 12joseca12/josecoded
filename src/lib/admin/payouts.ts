import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import { cents, payoutCadences, payoutRowSchema } from "@/types/money";
import {
  type Beneficiary,
  beneficiarySchema,
  type PayoutDetailResult,
  payoutItemSchema,
  payoutLineSchema,
  type PayoutsListResult,
  type PayoutTab,
  payoutTabs,
  previewLineSchema,
  type PreviewPayoutResult,
} from "@/types/payouts";

const payoutColumns =
  "id, kind, beneficiary_id, period_start, period_end, cadence, total, withholding_rate, net_total, status, statement_note, closer_invoice_path, issued_at, paid_at, paid_reference";
const lineColumns =
  "id, commission_id, payment_id, payout_id, beneficiary_id, role, nature, rate, base, amount, status, rejected_reason, created_at, payments(received_at), commissions(deals(contacts(full_name)))";

const payoutsSchema = z.array(payoutRowSchema);
const beneficiariesSchema = z.array(beneficiarySchema);
const linesSchema = z.array(payoutLineSchema);
const itemsSchema = z.array(payoutItemSchema);
const previewSchema = z.array(previewLineSchema);
const cadenceSchema = z.enum(payoutCadences);

export function parsePayoutTab(value: string | string[] | undefined): PayoutTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return payoutTabs.find((tab) => tab === raw) ?? "all";
}

export async function fetchPayouts(client: SupabaseClient<Database>): Promise<PayoutsListResult> {
  try {
    const [payouts, people, cadence] = await Promise.all([
      client
        .from("payouts")
        .select(payoutColumns)
        .order("period_end", { ascending: false })
        .limit(300),
      client
        .from("profiles")
        .select("id, full_name, role, is_active, payout_cadence")
        .in("role", ["closer", "freelance"])
        .order("full_name"),
      client
        .from("site_settings")
        .select("value")
        .eq("key", "payout.default_cadence")
        .maybeSingle(),
    ]);
    if (payouts.error || people.error || cadence.error) return { status: "error" };
    const parsedPayouts = payoutsSchema.safeParse(payouts.data);
    const parsedPeople = beneficiariesSchema.safeParse(people.data);
    if (!parsedPayouts.success || !parsedPeople.success) return { status: "error" };
    const parsedCadence = cadenceSchema.safeParse(cadence.data?.value);
    return {
      status: "ok",
      payouts: parsedPayouts.data,
      beneficiaries: parsedPeople.data,
      defaultCadence: parsedCadence.success ? parsedCadence.data : "biweekly",
    };
  } catch {
    return { status: "error" };
  }
}

export function beneficiaryName(beneficiaries: readonly Beneficiary[], id: string): string | null {
  return beneficiaries.find((entry) => entry.id === id)?.full_name ?? null;
}

export async function fetchPayoutDetail(
  client: SupabaseClient<Database>,
  id: string,
): Promise<PayoutDetailResult> {
  if (!z.uuid().safeParse(id).success) return { status: "missing" };
  try {
    const [payout, lines, items] = await Promise.all([
      client.from("payouts").select(payoutColumns).eq("id", id).maybeSingle(),
      client
        .from("commission_lines")
        .select(lineColumns)
        .eq("payout_id", id)
        .order("created_at", { ascending: true }),
      client
        .from("freelance_fee_items")
        .select("id, label, hours, amount, worked_on")
        .eq("payout_id", id)
        .order("worked_on", { ascending: true }),
    ]);
    if (payout.error || lines.error || items.error) return { status: "error" };
    if (payout.data === null) return { status: "missing" };
    const parsedPayout = payoutRowSchema.safeParse(payout.data);
    const parsedLines = linesSchema.safeParse(lines.data);
    const parsedItems = itemsSchema.safeParse(items.data);
    if (!parsedPayout.success || !parsedLines.success || !parsedItems.success) {
      return { status: "error" };
    }
    const people = await client
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "closer", "freelance"]);
    const parsedPeople = z
      .array(z.object({ id: z.uuid(), full_name: z.string() }))
      .safeParse(people.data);
    const name = parsedPeople.success
      ? parsedPeople.data.find((entry) => entry.id === parsedPayout.data.beneficiary_id)?.full_name
      : undefined;
    return {
      status: "ok",
      payout: parsedPayout.data,
      lines: parsedLines.data,
      items: parsedItems.data,
      beneficiary: name ?? "",
    };
  } catch {
    return { status: "error" };
  }
}

const previewItemSchema = z.object({ amount: cents, worked_on: z.string() });

export async function previewPayoutLines(
  client: SupabaseClient<Database>,
  beneficiaryId: string,
  role: "closer" | "freelance",
  start: string,
  end: string,
): Promise<PreviewPayoutResult> {
  try {
    if (role === "freelance") {
      const { data, error } = await client
        .from("freelance_fee_items")
        .select("amount, worked_on, freelance_fees!inner(freelance_id)")
        .eq("freelance_fees.freelance_id", beneficiaryId)
        .eq("status", "approved")
        .is("payout_id", null)
        .gte("worked_on", start)
        .lte("worked_on", end);
      if (error) return { status: "error" };
      const items = z.array(previewItemSchema.loose()).safeParse(data);
      if (!items.success) return { status: "error" };
      return {
        status: "ok",
        count: items.data.length,
        totalCents: items.data.reduce((sum, item) => sum + item.amount, 0),
      };
    }
    const { data, error } = await client
      .from("commission_lines")
      .select("amount, payments(received_at)")
      .eq("beneficiary_id", beneficiaryId)
      .eq("status", "approved")
      .is("payout_id", null);
    if (error) return { status: "error" };
    const parsed = previewSchema.safeParse(data);
    if (!parsed.success) return { status: "error" };
    const inside = parsed.data.filter(
      (line) =>
        line.payments !== null &&
        line.payments.received_at >= start &&
        line.payments.received_at <= end,
    );
    return {
      status: "ok",
      count: inside.length,
      totalCents: inside.reduce((sum, line) => sum + line.amount, 0),
    };
  } catch {
    return { status: "error" };
  }
}
