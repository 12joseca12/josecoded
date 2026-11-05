import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { homeZone, zonePath } from "@/lib/auth/roles";
import { userRoles } from "@/types/auth";
import type { Database } from "@/types/database";
import {
  type AcceptFailure,
  acceptInputSchema,
  type AcceptResult,
  invitationRowSchema,
  type InvitationSummary,
  invitationTokenPattern,
  type InvitationView,
} from "@/types/invitation";

const rowsSchema = z.array(invitationRowSchema);

export function isInvitationToken(value: string): boolean {
  return invitationTokenPattern.test(value);
}

export async function readInvitation(
  client: SupabaseClient<Database>,
  token: string,
): Promise<InvitationSummary | null> {
  if (!isInvitationToken(token)) return { status: "unknown" };
  try {
    const { data, error } = await client.rpc("read_invitation", { p_token: token });
    if (error) return null;
    const rows = rowsSchema.safeParse(data);
    if (!rows.success) return null;
    const [row] = rows.data;
    if (row === undefined) return { status: "unknown" };
    return {
      status: row.status,
      role: row.role,
      inviterName: row.invited_by_name,
      email: row.email,
      expiresAt: row.expires_at,
    };
  } catch {
    return null;
  }
}

export type SessionView =
  | { kind: "anonymous" }
  | { kind: "member"; destination: string }
  | { kind: "profileless"; email: string | null };

export function decideInvitationView(
  summary: InvitationSummary,
  session: SessionView,
): InvitationView {
  if (summary.status === "unknown") return { kind: "gone", reason: "unknown" };
  if (summary.status === "revoked") return { kind: "gone", reason: "revoked" };
  if (summary.status === "accepted") {
    return session.kind === "member"
      ? { kind: "enter", destination: session.destination }
      : { kind: "gone", reason: "used" };
  }
  if (summary.status === "expired") return { kind: "gone", reason: "expired" };
  if (session.kind === "member") return { kind: "enter", destination: session.destination };
  if (session.kind === "anonymous") return { kind: "login" };
  const same = session.email?.trim().toLowerCase() === summary.email.trim().toLowerCase();
  return same ? { kind: "accept" } : { kind: "mismatch" };
}

const failures: Record<string, AcceptFailure> = {
  invitation_not_found: "gone",
  invitation_revoked: "gone",
  invitation_expired: "expired",
  invitation_used: "used",
  invitation_email_mismatch: "mismatch",
  profile_exists: "exists",
};

const roleSchema = z.enum(userRoles);

export async function runAccept(
  client: SupabaseClient<Database>,
  locale: string,
  raw: unknown,
): Promise<AcceptResult> {
  const parsed = acceptInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  try {
    const { data, error } = await client.rpc("accept_invitation", {
      p_token: parsed.data.token,
      p_full_name: parsed.data.fullName,
      p_locale: parsed.data.locale,
    });
    if (error) {
      if (error.message === "invalid_full_name") return { status: "invalid" };
      return { status: "failed", failure: failures[error.message] ?? "error" };
    }
    const role = roleSchema.safeParse(data);
    if (!role.success) return { status: "failed", failure: "error" };
    return { status: "done", destination: zonePath(locale, homeZone(role.data)) };
  } catch {
    return { status: "failed", failure: "error" };
  }
}

export function formatInvitationDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Madrid" }).format(
    date,
  );
}
