import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type ContactFilters,
  contactKinds,
  contactRowSchema,
  type ContactsResult,
  dealStages,
  type DealSummary,
  noOwnerFilter,
  openDealStages,
  ownerRowSchema,
} from "@/types/crm";
import type { Database } from "@/types/database";

export const contactsLimit = 200;

const contactColumns =
  "id, full_name, organization, email, phone, kind, source, owner_id, next_action, next_action_at, last_activity_at, created_at";
const dealColumns = "id, stage, via, amount, created_at, updated_at";
const plainSelect = `${contactColumns}, deals(${dealColumns})`;
const stageSelect = `${contactColumns}, deals!inner(${dealColumns})`;

const rowsSchema = z.array(contactRowSchema);
const ownersSchema = z.array(ownerRowSchema);
const uuidSchema = z.uuid();
const searchMax = 80;

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function pick<T extends string>(options: readonly T[], value: string): T | null {
  return options.find((option) => option === value) ?? null;
}

export function parseContactFilters(params: RawParams): ContactFilters {
  const owner = first(params.owner);
  return {
    q: first(params.q).trim().slice(0, searchMax),
    kind: pick(contactKinds, first(params.kind)),
    stage: pick(dealStages, first(params.stage)),
    due: first(params.due) === "1",
    owner:
      owner === noOwnerFilter ? noOwnerFilter : uuidSchema.safeParse(owner).success ? owner : null,
  };
}

export function hasActiveFilters(filters: ContactFilters): boolean {
  return (
    filters.q !== "" ||
    filters.kind !== null ||
    filters.stage !== null ||
    filters.due ||
    filters.owner !== null
  );
}

export function searchPattern(q: string): string {
  return q
    .replace(/[,()*%\\:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchContacts(
  client: SupabaseClient<Database>,
  filters: ContactFilters,
  now: Date = new Date(),
): Promise<ContactsResult> {
  try {
    let query = client
      .from("contacts")
      .select(filters.stage ? stageSelect : plainSelect)
      .is("archived_at", null);
    if (filters.kind) query = query.eq("kind", filters.kind);
    if (filters.stage) query = query.eq("deals.stage", filters.stage);
    if (filters.due)
      query = query.not("next_action_at", "is", null).lte("next_action_at", now.toISOString());
    if (filters.owner === noOwnerFilter) query = query.is("owner_id", null);
    else if (filters.owner) query = query.eq("owner_id", filters.owner);
    const pattern = searchPattern(filters.q);
    if (pattern !== "") {
      query = query.or(
        `full_name.ilike.*${pattern}*,organization.ilike.*${pattern}*,email.ilike.*${pattern}*`,
      );
    }
    const [contacts, people] = await Promise.all([
      query
        .order("last_activity_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(contactsLimit),
      client
        .from("profiles")
        .select("id, full_name, role, is_active")
        .in("role", ["admin", "closer"])
        .order("full_name"),
    ]);
    if (contacts.error || people.error) return { status: "error" };
    const rows = rowsSchema.safeParse(contacts.data);
    const owners = ownersSchema.safeParse(people.data);
    if (!rows.success || !owners.success) return { status: "error" };
    return {
      status: "ok",
      rows: rows.data,
      owners: owners.data.map((person) => ({
        id: person.id,
        name: person.full_name,
        assignable: person.is_active,
      })),
      limit: contactsLimit,
      nowIso: now.toISOString(),
    };
  } catch {
    return { status: "error" };
  }
}

export function isOpenStage(stage: DealSummary["stage"]): boolean {
  return openDealStages.some((open) => open === stage);
}

export function primaryDeal(deals: readonly DealSummary[]): DealSummary | null {
  const byRecent = [...deals].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return byRecent.find((deal) => isOpenStage(deal.stage)) ?? byRecent[0] ?? null;
}

export function isOverdue(nextActionAt: string | null, nowIso: string): boolean {
  return nextActionAt !== null && Date.parse(nextActionAt) < Date.parse(nowIso);
}

export function formatDay(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(
    date,
  );
}
