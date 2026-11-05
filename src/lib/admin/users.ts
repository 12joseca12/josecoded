import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  type InvitationRow,
  invitationRowSchema,
  type InvitationStatus,
  userRowSchema,
  type UsersResult,
} from "@/types/users";

export const invitationsLimit = 100;
export const previewBase = 1000;

const usersSchema = z.array(userRowSchema);
const invitationsSchema = z.array(invitationRowSchema);

export async function fetchUsers(client: SupabaseClient<Database>): Promise<UsersResult> {
  try {
    const [users, invitations] = await Promise.all([
      client.rpc("admin_users"),
      client
        .from("invitations")
        .select(
          "id, email, role, invited_by, expires_at, accepted_at, revoked_at, created_at, parent_closer_id",
        )
        .order("created_at", { ascending: false })
        .limit(invitationsLimit),
    ]);
    if (users.error || invitations.error) return { status: "error" };
    const parsedUsers = usersSchema.safeParse(users.data);
    const parsedInvitations = invitationsSchema.safeParse(invitations.data);
    if (!parsedUsers.success || !parsedInvitations.success) return { status: "error" };
    return { status: "ok", users: parsedUsers.data, invitations: parsedInvitations.data };
  } catch {
    return { status: "error" };
  }
}

export function invitationStatus(
  row: Pick<InvitationRow, "accepted_at" | "revoked_at" | "expires_at">,
  now: Date = new Date(),
): InvitationStatus {
  if (row.accepted_at !== null) return "accepted";
  if (row.revoked_at !== null) return "revoked";
  return new Date(row.expires_at).getTime() <= now.getTime() ? "expired" : "pending";
}

export interface PreviewRates {
  closer: number | null;
  parent: number | null;
  closerRecurring: number | null;
  parentRecurring: number | null;
}

export interface CommissionPreview {
  project: { closer: number; parent: number | null } | null;
  recurring: { closer: number; parent: number | null } | null;
}

function amount(base: number, rate: number | null): number | null {
  return rate === null ? null : Math.round(base * rate) / 100;
}

export function previewCommission(base: number, rates: PreviewRates): CommissionPreview {
  const closer = amount(base, rates.closer);
  const closerRecurring = amount(base, rates.closerRecurring);
  return {
    project: closer === null ? null : { closer, parent: amount(base, rates.parent) },
    recurring:
      closerRecurring === null
        ? null
        : { closer: closerRecurring, parent: amount(base, rates.parentRecurring) },
  };
}

export function readRate(value: string): number | null {
  const text = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const number = Number(text);
  return number <= 100 ? number : null;
}

export function formatEuro(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatRate(value: number | null, locale: string): string | null {
  if (value === null) return null;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} %`;
}

export function formatDay(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Europe/Madrid" }).format(
    date,
  );
}
