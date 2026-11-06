import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";
import {
  type InvitationActionResult,
  invitationActionSchema,
  type InviteActionResult,
  type InviteErrorCode,
  inviteErrorCodes,
  type InviteField,
  inviteFields,
  inviteInputSchema,
} from "@/types/users";

export type AuthUserOutcome = "created" | "exists" | "failed";

export interface InviteDeps {
  client: SupabaseClient<Database>;
  createAuthUser: (email: string) => Promise<AuthUserOutcome>;
}

export interface RpcFailure {
  code?: string | null;
  message?: string | null;
}

const issued = z.array(z.object({ invitation_id: z.uuid(), token: z.string().min(16) })).length(1);

const knownCodes = new Set<string>(inviteErrorCodes);
const invitationCodes = new Set(["invitation_used", "invitation_revoked"]);

export function mapInviteError(error: RpcFailure): InviteErrorCode {
  const message = error.message ?? "";
  if (knownCodes.has(message)) return message as InviteErrorCode;
  if (error.code === "42501") return "forbidden";
  return "error";
}

export function invitationPath(locale: string, token: string): string {
  return `/${locale}/invitacion/${token}`;
}

function firstField(issues: readonly { path: PropertyKey[] }[]): InviteField {
  const key = issues[0]?.path[0];
  return inviteFields.find((field) => field === key) ?? "email";
}

export async function runInvite(
  deps: InviteDeps,
  locale: string,
  raw: unknown,
): Promise<InviteActionResult> {
  const parsed = inviteInputSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid", field: firstField(parsed.error.issues) };
  const input = parsed.data;
  try {
    const { data, error } = await deps.client.rpc("invite_user", {
      p_email: input.email,
      p_role: input.role === "subcloser" ? "closer" : input.role,
      p_parent_closer_id: input.parentCloserId ?? undefined,
      p_closer_rate: input.closerRate ?? undefined,
      p_parent_rate: input.parentRate ?? undefined,
      p_closer_recurring_rate: input.closerRecurringRate ?? undefined,
      p_parent_recurring_rate: input.parentRecurringRate ?? undefined,
      p_payout_cadence: input.payoutCadence ?? undefined,
      p_note: input.note === "" ? undefined : input.note,
      p_project_id: input.projectId ?? undefined,
    });
    if (error) return { status: "error", code: mapInviteError(error) };
    const created = issued.safeParse(data);
    if (!created.success) return { status: "error", code: "error" };
    const [row] = created.data;
    if (row === undefined) return { status: "error", code: "error" };

    const outcome = await deps.createAuthUser(input.email);
    if (outcome === "failed") {
      await deps.client.rpc("revoke_invitation", { p_id: row.invitation_id });
      return { status: "error", code: "unavailable" };
    }
    return {
      status: "done",
      invitationId: row.invitation_id,
      path: invitationPath(locale, row.token),
    };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runRenew(
  client: SupabaseClient<Database>,
  locale: string,
  raw: unknown,
): Promise<InvitationActionResult> {
  const parsed = invitationActionSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "error" };
  try {
    const { data, error } = await client.rpc("renew_invitation", {
      p_id: parsed.data.invitationId,
    });
    if (error) return { status: "error", code: mapInvitationError(error) };
    const renewed = issued.safeParse(data);
    const [row] = renewed.success ? renewed.data : [];
    if (row === undefined) return { status: "error", code: "error" };
    return { status: "done", path: invitationPath(locale, row.token) };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runRevoke(
  client: SupabaseClient<Database>,
  raw: unknown,
): Promise<InvitationActionResult> {
  const parsed = invitationActionSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "error" };
  try {
    const { error } = await client.rpc("revoke_invitation", { p_id: parsed.data.invitationId });
    return error
      ? { status: "error", code: mapInvitationError(error) }
      : { status: "done", path: null };
  } catch {
    return { status: "error", code: "error" };
  }
}

function mapInvitationError(
  error: RpcFailure,
): Extract<InvitationActionResult, { status: "error" }>["code"] {
  const message = error.message ?? "";
  if (invitationCodes.has(message)) return message as "invitation_used" | "invitation_revoked";
  return mapInviteError(error);
}
