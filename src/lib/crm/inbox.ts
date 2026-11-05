import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { describeExtras, describeOffer, type OfferLabels } from "@/lib/admin/lead-offer";
import { formatLeadDate, leadColumns } from "@/lib/admin/leads";
import type { UserRole } from "@/types/auth";
import type { Database } from "@/types/database";
import {
  type InboxCardData,
  type InboxResult,
  type InboxRow,
  inboxRowSchema,
  type InboxTab,
  inboxTabs,
  type OwnLeadItem,
  type OwnLeadRow,
  ownLeadRowSchema,
  teamMemberSchema,
} from "@/types/inbox";

export const inboxLimit = 200;

const ownColumns = `${leadColumns}, phone`;
const inboxSchema = z.array(inboxRowSchema);
const ownSchema = z.array(ownLeadRowSchema);
const membersSchema = z.array(teamMemberSchema);

type RawParams = Record<string, string | string[] | undefined>;

export function parseInboxTab(params: RawParams, hasTeam: boolean): InboxTab {
  const raw = params.tab;
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const tab = inboxTabs.find((entry) => entry === value) ?? "inbox";
  return tab === "team" && !hasTeam ? "inbox" : tab;
}

export async function fetchInbox(
  client: SupabaseClient<Database>,
  userId: string,
  role: UserRole,
): Promise<InboxResult> {
  try {
    let own = client
      .from("leads")
      .select(ownColumns)
      .not("assigned_to", "is", null)
      .order("created_at", { ascending: false })
      .limit(inboxLimit);
    if (role === "admin") own = own.eq("assigned_to", userId);
    const [inbox, leads, people] = await Promise.all([
      client.rpc("list_lead_inbox"),
      own,
      client
        .from("profiles")
        .select("id, full_name")
        .eq("role", "closer")
        .eq("parent_closer_id", userId)
        .order("full_name"),
    ]);
    if (inbox.error || leads.error || people.error) return { status: "error" };
    const inboxRows = inboxSchema.safeParse(inbox.data);
    const ownRows = ownSchema.safeParse(leads.data);
    const members = membersSchema.safeParse(people.data);
    if (!inboxRows.success || !ownRows.success || !members.success) return { status: "error" };
    const names: Record<string, string> = {};
    for (const member of members.data) names[member.id] = member.full_name;
    const hasTeam = role === "closer" && members.data.length > 0;
    return {
      status: "ok",
      inbox: inboxRows.data,
      mine: ownRows.data.filter((row) => row.assigned_to === userId),
      team: hasTeam ? ownRows.data.filter((row) => row.assigned_to !== userId) : [],
      people: names,
      hasTeam,
      limit: inboxLimit,
    };
  } catch {
    return { status: "error" };
  }
}

export function toInboxCards(
  rows: InboxRow[],
  locale: string,
  offers: OfferLabels,
  vias: Record<string, string>,
  locales: Record<string, string>,
): InboxCardData[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.first_name,
    viaLabel: row.via === null ? null : (vias[row.via] ?? null),
    offerText: row.offer ? describeOffer(row.offer, offers) : null,
    extrasText: row.extras && row.extras.length > 0 ? describeExtras(row.extras, offers) : null,
    excerpt: row.excerpt && row.excerpt.trim() !== "" ? row.excerpt.trim() : null,
    createdAt: row.created_at,
    dateText: formatLeadDate(row.created_at, locale),
    localeLabel: row.locale === null ? null : (locales[row.locale] ?? null),
  }));
}

export function toOwnItems(rows: OwnLeadRow[], locale: string, offers: OfferLabels): OwnLeadItem[] {
  return rows.map((row) => ({
    row,
    dateText: formatLeadDate(row.created_at, locale),
    offerText: row.offer ? describeOffer(row.offer, offers) : null,
  }));
}
