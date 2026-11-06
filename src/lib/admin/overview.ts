import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  type CounterCellData,
  type CounterKey,
  counterKeys,
  type Counters,
  countersSchema,
} from "@/types/overview";
import type { StaffZone } from "@/types/staff";
import type { SystemSource } from "@/types/system";

import { isMissingObject } from "./system";

interface CellTarget {
  zone: StaffZone;
  nav: string;
  query: string;
}

const targets: Record<CounterKey, CellTarget> = {
  leads_new: { zone: "admin", nav: "leads", query: "?status=new" },
  leads_waiting_admin: { zone: "admin", nav: "leads", query: "?status=waiting" },
  invitations_pending: { zone: "admin", nav: "users", query: "" },
  users_active: { zone: "admin", nav: "users", query: "" },
  accrued_pending_count: { zone: "crm", nav: "commissions", query: "" },
  payments_overdue: { zone: "admin", nav: "receivables", query: "" },
  proformas_unpaid: { zone: "admin", nav: "receivables", query: "" },
  payouts_draft: { zone: "admin", nav: "payouts", query: "" },
  jobs_failed: { zone: "admin", nav: "system", query: "?estado=failed" },
  stories_to_decide: { zone: "admin", nav: "projects", query: "" },
};

export async function fetchCounters(
  client: SupabaseClient<Database>,
): Promise<SystemSource<Counters>> {
  try {
    const { data, error } = await client.rpc("admin_counters");
    if (error) return isMissingObject(error) ? { status: "unavailable" } : { status: "error" };
    const counters = countersSchema.safeParse(data);
    return counters.success ? { status: "ok", data: counters.data } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export function formatAmount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

export interface ReadyNav {
  zone: StaffZone;
  key: string;
  path: string;
}

export function buildCells(
  counters: Counters | null,
  labels: Record<CounterKey, string>,
  locale: string,
  ready: readonly ReadyNav[],
): CounterCellData[] {
  return counterKeys.map((key) => {
    const target = targets[key];
    const destination = ready.find(
      (entry) => entry.zone === target.zone && entry.key === target.nav,
    );
    const value = counters?.[key];
    const amount = key === "accrued_pending_count" ? counters?.accrued_pending_amount : undefined;
    return {
      key,
      label: labels[key],
      value: value ?? null,
      amount: amount === undefined ? null : formatAmount(amount, locale),
      href: destination ? `/${locale}/${target.zone}${destination.path}${target.query}` : null,
    };
  });
}
