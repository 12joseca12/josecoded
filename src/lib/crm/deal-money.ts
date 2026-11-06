import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import type { DealMoneyResult } from "@/types/deal-win";
import {
  commissionHeaderSchema,
  commissionLineSchema,
  invoiceRowSchema,
  paymentRowSchema,
  scheduleItemSchema,
} from "@/types/money";

const headerColumns =
  "id, deal_id, closer_id, closer_rate, closer_recurring_rate, subcloser_id, subcloser_rate, subcloser_recurring_rate, expected_base, expected_closer_amount, expected_subcloser_amount";
const lineColumns =
  "id, commission_id, payment_id, payout_id, beneficiary_id, role, nature, rate, base, amount, status, rejected_reason, created_at";
const scheduleColumns = "id, deal_id, label, kind, percent, amount, due_at, status, sort";
const invoiceColumns =
  "id, deal_id, schedule_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross, pdf_path, status";

const headersSchema = z.array(commissionHeaderSchema);
const linesSchema = z.array(commissionLineSchema);
const scheduleSchema = z.array(scheduleItemSchema);
const invoicesSchema = z.array(invoiceRowSchema);
const paymentsSchema = z.array(paymentRowSchema);

export async function fetchDealMoney(
  client: SupabaseClient<Database>,
  dealIds: readonly string[],
  isAdmin: boolean,
): Promise<DealMoneyResult> {
  const empty = { commissions: [], lines: [], schedule: [], invoices: [], payments: [] };
  if (dealIds.length === 0) return { status: "ok", data: empty };
  const ids = [...dealIds];
  try {
    const [headers, schedule, invoices, ...payments] = await Promise.all([
      client.from("commissions").select(headerColumns).in("deal_id", ids),
      client
        .from("payment_schedule")
        .select(scheduleColumns)
        .in("deal_id", ids)
        .order("sort", { ascending: true }),
      isAdmin
        ? client
            .from("invoices")
            .select(invoiceColumns)
            .in("deal_id", ids)
            .order("issued_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      ...ids.map((id) => client.rpc("deal_payments", { p_deal_id: id })),
    ]);
    if (headers.error || schedule.error || invoices.error) return { status: "error" };
    if (payments.some((entry) => entry.error)) return { status: "error" };

    const parsedHeaders = headersSchema.safeParse(headers.data);
    if (!parsedHeaders.success) return { status: "error" };
    const commissionIds = parsedHeaders.data.map((header) => header.id);
    const lines =
      commissionIds.length === 0
        ? { data: [], error: null }
        : await client
            .from("commission_lines")
            .select(lineColumns)
            .in("commission_id", commissionIds)
            .order("created_at", { ascending: false });
    if (lines.error) return { status: "error" };

    const parsedLines = linesSchema.safeParse(lines.data);
    const parsedSchedule = scheduleSchema.safeParse(schedule.data);
    const parsedInvoices = invoicesSchema.safeParse(invoices.data);
    if (!parsedLines.success || !parsedSchedule.success || !parsedInvoices.success) {
      return { status: "error" };
    }
    const flatPayments = [];
    for (const [index, entry] of payments.entries()) {
      const parsed = paymentsSchema.safeParse(entry.data);
      if (!parsed.success) return { status: "error" };
      const dealId = ids[index] ?? "";
      flatPayments.push(...parsed.data.map((payment) => ({ ...payment, deal_id: dealId })));
    }
    return {
      status: "ok",
      data: {
        commissions: parsedHeaders.data,
        lines: parsedLines.data,
        schedule: parsedSchedule.data,
        invoices: parsedInvoices.data,
        payments: flatPayments,
      },
    };
  } catch {
    return { status: "error" };
  }
}
