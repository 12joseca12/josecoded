import {
  type LeadFilters,
  type LeadRow,
  leadSources,
  type LeadTab,
  leadTabs,
  leadVias,
} from "@/types/leads";

export type LeadSearchParams = Record<string, string | string[] | undefined>;

export const leadQueryMax = 100;
export const noneValue = "none";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function single(params: LeadSearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function member<T extends string>(list: readonly T[], value: string): T | null {
  return (list as readonly string[]).includes(value) ? (value as T) : null;
}

export function parseLeadFilters(params: LeadSearchParams): LeadFilters {
  const owner = single(params, "owner");
  const via = single(params, "via");
  return {
    tab: member(leadTabs, single(params, "status")) ?? "all",
    via: via === noneValue ? "none" : member(leadVias, via),
    source: member(leadSources, single(params, "source")),
    owner: owner === noneValue || uuidPattern.test(owner) ? owner : null,
    q: single(params, "q").trim().slice(0, leadQueryMax),
  };
}

export function tabOf(row: LeadRow): Exclude<LeadTab, "all"> {
  if (row.status === "discarded") return "discarded";
  if (row.status === "converted") return "converted";
  if (row.status === "new") return row.contact_id ? "waiting" : "new";
  return "assigned";
}

function matchesQuery(row: LeadRow, q: string): boolean {
  if (q === "") return true;
  const needle = q.toLowerCase();
  return [row.full_name, row.email, row.organization].some((value) =>
    value?.toLowerCase().includes(needle),
  );
}

function matchesVia(row: LeadRow, via: LeadFilters["via"]): boolean {
  if (via === null) return true;
  return via === "none" ? row.via === null : row.via === via;
}

function matchesOwner(row: LeadRow, owner: LeadFilters["owner"]): boolean {
  if (owner === null) return true;
  return owner === noneValue ? row.assigned_to === null : row.assigned_to === owner;
}

function matchesFields(row: LeadRow, filters: LeadFilters): boolean {
  return (
    matchesVia(row, filters.via) &&
    (filters.source === null || row.source === filters.source) &&
    matchesOwner(row, filters.owner) &&
    matchesQuery(row, filters.q)
  );
}

export function filterLeads(rows: LeadRow[], filters: LeadFilters): LeadRow[] {
  return rows.filter(
    (row) => matchesFields(row, filters) && (filters.tab === "all" || tabOf(row) === filters.tab),
  );
}

export function countByTab(rows: LeadRow[], filters: LeadFilters): Record<LeadTab, number> {
  const counts: Record<LeadTab, number> = {
    all: 0,
    new: 0,
    waiting: 0,
    assigned: 0,
    converted: 0,
    discarded: 0,
  };
  for (const row of rows) {
    if (!matchesFields(row, filters)) continue;
    counts.all += 1;
    counts[tabOf(row)] += 1;
  }
  return counts;
}

export function hasFieldFilters(filters: LeadFilters): boolean {
  return (
    filters.via !== null || filters.source !== null || filters.owner !== null || filters.q !== ""
  );
}

export function leadsHref(basePath: string, filters: LeadFilters, tab: LeadTab): string {
  const query = new URLSearchParams();
  if (tab !== "all") query.set("status", tab);
  if (filters.via) query.set("via", filters.via);
  if (filters.source) query.set("source", filters.source);
  if (filters.owner) query.set("owner", filters.owner);
  if (filters.q) query.set("q", filters.q);
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}
