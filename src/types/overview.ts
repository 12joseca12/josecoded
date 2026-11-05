import "@/lib/security/zod-jitless";

import { z } from "zod";

const count = z.number().nonnegative().optional();

export const countersSchema = z.looseObject({
  leads_new: count,
  leads_waiting_admin: count,
  invitations_pending: count,
  users_active: count,
  accrued_pending_count: count,
  accrued_pending_amount: count,
  payments_overdue: count,
  proformas_unpaid: count,
  payouts_draft: count,
  jobs_failed: count,
});

export type Counters = z.infer<typeof countersSchema>;

export const counterKeys = [
  "leads_new",
  "leads_waiting_admin",
  "invitations_pending",
  "users_active",
  "accrued_pending_count",
  "payments_overdue",
  "proformas_unpaid",
  "payouts_draft",
  "jobs_failed",
] as const;
export type CounterKey = (typeof counterKeys)[number];

export interface CounterCellData {
  key: CounterKey;
  label: string;
  value: number | null;
  amount: string | null;
  href: string | null;
}
