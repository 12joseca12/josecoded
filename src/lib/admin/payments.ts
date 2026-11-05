import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  documentRowSchema,
  paymentSumSchema,
  type PaymentTab,
  paymentTabs,
  type ReceivableRow,
  receivableRowSchema,
  type ReceivablesResult,
  wonDealSchema,
} from "@/types/payments";

export const defaultVatRate = 0;

const scheduleColumns =
  "id, deal_id, label, kind, percent, amount, due_at, status, sort, deals(contacts(full_name))";
const documentColumns =
  "id, deal_id, schedule_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross, pdf_path, status, deals(contacts(full_name))";
const dealColumns = "id, won_amount, recurring_monthly, contacts(full_name)";

const scheduleSchema = z.array(receivableRowSchema);
const documentsSchema = z.array(documentRowSchema);
const dealsSchema = z.array(wonDealSchema);
const sumsSchema = z.array(paymentSumSchema);
const vatSchema = z.number().min(0).max(100);

export function parsePaymentTab(value: string | string[] | undefined): PaymentTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return paymentTabs.find((tab) => tab === raw) ?? "pending";
}

const openStatuses: readonly ReceivableRow["status"][] = ["scheduled", "proforma_sent", "invoiced"];

export function isOverdueRow(row: ReceivableRow, today: string): boolean {
  return row.due_at !== null && row.due_at < today && openStatuses.includes(row.status);
}

export function filterReceivables(
  rows: readonly ReceivableRow[],
  tab: PaymentTab,
  today: string,
): ReceivableRow[] {
  if (tab === "paid") return rows.filter((row) => row.status === "paid");
  if (tab === "overdue") return rows.filter((row) => isOverdueRow(row, today));
  if (tab === "pending") {
    return rows.filter((row) => openStatuses.includes(row.status) && !isOverdueRow(row, today));
  }
  return [];
}

export function tabCounts(
  rows: readonly ReceivableRow[],
  documents: readonly { kind: "proforma" | "invoice"; status: string }[],
  today: string,
): Record<PaymentTab, number> {
  return {
    pending: filterReceivables(rows, "pending", today).length,
    overdue: filterReceivables(rows, "overdue", today).length,
    paid: filterReceivables(rows, "paid", today).length,
    proformas: documents.filter((entry) => entry.kind === "proforma" && entry.status !== "void")
      .length,
    invoices: documents.filter((entry) => entry.kind === "invoice" && entry.status !== "void")
      .length,
  };
}

export async function fetchReceivables(
  client: SupabaseClient<Database>,
): Promise<ReceivablesResult> {
  try {
    const [schedule, documents, deals, payments, vat] = await Promise.all([
      client
        .from("payment_schedule")
        .select(scheduleColumns)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("sort", { ascending: true })
        .limit(500),
      client
        .from("invoices")
        .select(documentColumns)
        .order("issued_at", { ascending: false })
        .limit(500),
      client
        .from("deals")
        .select(dealColumns)
        .eq("stage", "won")
        .order("won_at", { ascending: false })
        .limit(500),
      client
        .from("payments")
        .select("schedule_id, kind, amount_net")
        .not("schedule_id", "is", null),
      client.from("site_settings").select("value").eq("key", "billing.vat_rate").maybeSingle(),
    ]);
    if (schedule.error || documents.error || deals.error || payments.error || vat.error) {
      return { status: "error" };
    }
    const parsedSchedule = scheduleSchema.safeParse(schedule.data);
    const parsedDocuments = documentsSchema.safeParse(documents.data);
    const parsedDeals = dealsSchema.safeParse(deals.data);
    const parsedPayments = sumsSchema.safeParse(payments.data);
    if (
      !parsedSchedule.success ||
      !parsedDocuments.success ||
      !parsedDeals.success ||
      !parsedPayments.success
    ) {
      return { status: "error" };
    }
    const paidBySchedule: Record<string, number> = {};
    for (const payment of parsedPayments.data) {
      if (payment.schedule_id === null) continue;
      const sign = payment.kind === "refund" ? -1 : 1;
      paidBySchedule[payment.schedule_id] =
        (paidBySchedule[payment.schedule_id] ?? 0) + sign * payment.amount_net;
    }
    const parsedVat = vatSchema.safeParse(vat.data?.value);
    return {
      status: "ok",
      deals: parsedDeals.data,
      schedule: parsedSchedule.data,
      documents: parsedDocuments.data,
      paidBySchedule,
      vatRate: parsedVat.success ? parsedVat.data : defaultVatRate,
    };
  } catch {
    return { status: "error" };
  }
}

export interface TemplateItem {
  key: "first" | "second" | "last" | "single";
  percent: number;
  amountCents: number;
}

export function buildTemplate(
  template: "442" | "single",
  wonCents: number,
): readonly TemplateItem[] {
  if (template === "single") return [{ key: "single", percent: 100, amountCents: wonCents }];
  const first = Math.floor((wonCents * 40 + 50) / 100);
  const second = first;
  return [
    { key: "first", percent: 40, amountCents: first },
    { key: "second", percent: 40, amountCents: second },
    { key: "last", percent: 20, amountCents: wonCents - first - second },
  ];
}
