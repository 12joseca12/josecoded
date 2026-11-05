import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { isMissingObject } from "@/lib/admin/system";
import {
  type CrmCell,
  type CrmCellLabels,
  type CrmCounterKey,
  type CrmCounters,
  crmCountersSchema,
  dueContactSchema,
  type DueResult,
} from "@/types/crm-overview";
import type { Database } from "@/types/database";
import type { SystemSource } from "@/types/system";

import { madridDayBounds } from "./day";

export const dueLimit = 8;

const dueColumns = "id, full_name, next_action, next_action_at";
const dueRowsSchema = z.array(dueContactSchema);
const countersRowsSchema = z.array(crmCountersSchema).length(1);

export async function fetchCrmCounters(
  client: SupabaseClient<Database>,
): Promise<SystemSource<CrmCounters>> {
  try {
    const { data, error } = await client.rpc("crm_counters");
    if (error) return isMissingObject(error) ? { status: "unavailable" } : { status: "error" };
    const rows = countersRowsSchema.safeParse(data);
    const [row] = rows.success ? rows.data : [];
    return row ? { status: "ok", data: row } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

export type DueSource = { status: "ok"; data: DueResult } | { status: "error" };

export async function fetchDue(
  client: SupabaseClient<Database>,
  now: Date = new Date(),
): Promise<DueSource> {
  try {
    const { end } = madridDayBounds(now);
    const upToToday = await client
      .from("contacts")
      .select(dueColumns)
      .is("archived_at", null)
      .not("next_action_at", "is", null)
      .lte("next_action_at", new Date(end.getTime() - 1).toISOString())
      .order("next_action_at", { ascending: true })
      .limit(dueLimit);
    if (upToToday.error) return { status: "error" };
    const rows = dueRowsSchema.safeParse(upToToday.data);
    if (!rows.success) return { status: "error" };
    if (rows.data.length > 0) return { status: "ok", data: { rows: rows.data, next: null } };

    const later = await client
      .from("contacts")
      .select(dueColumns)
      .is("archived_at", null)
      .gt("next_action_at", end.toISOString())
      .order("next_action_at", { ascending: true })
      .limit(1);
    if (later.error) return { status: "error" };
    const next = dueRowsSchema.safeParse(later.data);
    if (!next.success) return { status: "error" };
    return { status: "ok", data: { rows: [], next: next.data[0] ?? null } };
  } catch {
    return { status: "error" };
  }
}

interface CellSpec {
  key: CrmCounterKey;
  label: (labels: CrmCellLabels) => string;
  path: string;
}

const todaySpecs: CellSpec[] = [
  { key: "inbox_new", label: (labels) => labels.inbox, path: "/interesados" },
  { key: "actions_overdue", label: (labels) => labels.overdue, path: "/contactos?due=1" },
  { key: "actions_today", label: (labels) => labels.dueToday, path: "/contactos" },
];

const stageSpecs: CellSpec[] = [
  { key: "deals_new", label: (labels) => labels.stages.new, path: "/contactos?stage=new" },
  {
    key: "deals_contacted",
    label: (labels) => labels.stages.contacted,
    path: "/contactos?stage=contacted",
  },
  {
    key: "deals_meeting",
    label: (labels) => labels.stages.meeting,
    path: "/contactos?stage=meeting",
  },
  {
    key: "deals_proposal",
    label: (labels) => labels.stages.proposal,
    path: "/contactos?stage=proposal",
  },
];

function build(
  specs: CellSpec[],
  counters: CrmCounters | null,
  labels: CrmCellLabels,
  locale: string,
): CrmCell[] {
  return specs.map((spec) => ({
    key: spec.key,
    label: spec.label(labels),
    value: counters === null ? null : counters[spec.key],
    amount: null,
    href: `/${locale}/crm${spec.path}`,
  }));
}

export function buildTodayCells(
  counters: CrmCounters | null,
  labels: CrmCellLabels,
  locale: string,
): CrmCell[] {
  return build(todaySpecs, counters, labels, locale);
}

export function buildStageCells(
  counters: CrmCounters | null,
  labels: CrmCellLabels,
  locale: string,
): CrmCell[] {
  return build(stageSpecs, counters, labels, locale);
}

export type PrimaryAction = "overdue" | "leads" | null;

export function primaryAction(counters: CrmCounters | null): PrimaryAction {
  if (counters === null) return null;
  if (counters.actions_overdue > 0) return "overdue";
  if (counters.inbox_new > 0) return "leads";
  return null;
}
