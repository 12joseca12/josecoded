import "@/lib/security/zod-jitless";

import { z } from "zod";

const count = z.number().int().nonnegative();

export const crmCountersSchema = z.object({
  inbox_new: count,
  actions_overdue: count,
  actions_today: count,
  deals_new: count,
  deals_contacted: count,
  deals_meeting: count,
  deals_proposal: count,
});

export type CrmCounters = z.infer<typeof crmCountersSchema>;

export const dueContactSchema = z.object({
  id: z.uuid(),
  full_name: z.string(),
  next_action: z.string().nullable(),
  next_action_at: z.string(),
});

export type DueContact = z.infer<typeof dueContactSchema>;

export type CrmCounterKey = keyof CrmCounters;

export interface CrmCell {
  key: CrmCounterKey;
  label: string;
  value: number | null;
  amount: null;
  href: string;
}

export interface CrmCellLabels {
  inbox: string;
  overdue: string;
  dueToday: string;
  stages: { new: string; contacted: string; meeting: string; proposal: string };
}

export interface DueListLabels {
  listLabel: string;
  noAction: string;
  overdue: string;
}

export interface DueResult {
  rows: DueContact[];
  next: DueContact | null;
}
