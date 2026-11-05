"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { runInvite, runRenew, runRevoke } from "@/lib/admin/invite";
import {
  runHistory,
  runReassign,
  runResetTotp,
  runSetActive,
  runSetRates,
} from "@/lib/admin/manage";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createAuthUser,
  createSupabaseServiceClient,
  deleteFactor,
  listFactorIds,
} from "@/lib/supabase/service";
import type { InvitationActionResult, InviteActionResult } from "@/types/users";
import type { HistoryResult, ManageResult, ReassignResult } from "@/types/users-manage";

export async function inviteUser(locale: string, raw: unknown): Promise<InviteActionResult> {
  if (!isLocale(locale)) return { status: "error", code: "error" };
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  if (client === null || service === null) return { status: "error", code: "unavailable" };
  const result = await runInvite(
    { client, createAuthUser: (email) => createAuthUser(service, email) },
    locale,
    raw,
  );
  if (result.status === "done") revalidatePath(`/${locale}/admin/usuarios`);
  return result;
}

export async function renewInvitation(
  locale: string,
  raw: unknown,
): Promise<InvitationActionResult> {
  if (!isLocale(locale)) return { status: "error", code: "error" };
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error", code: "error" };
  const result = await runRenew(client, locale, raw);
  if (result.status === "done") revalidatePath(`/${locale}/admin/usuarios`);
  return result;
}

export async function revokeInvitation(
  locale: string,
  raw: unknown,
): Promise<InvitationActionResult> {
  if (!isLocale(locale)) return { status: "error", code: "error" };
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "error", code: "error" };
  const result = await runRevoke(client, raw);
  if (result.status === "done") revalidatePath(`/${locale}/admin/usuarios`);
  return result;
}

async function managed<T>(
  locale: string,
  fallback: T,
  run: (client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) => Promise<T>,
  changes: (result: T) => boolean,
): Promise<T> {
  if (!isLocale(locale)) return fallback;
  await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  if (client === null) return fallback;
  const result = await run(client);
  if (changes(result)) revalidatePath(`/${locale}/admin/usuarios`);
  return result;
}

const failed = { status: "error", code: "error" } as const;

export async function updateUserRates(locale: string, raw: unknown): Promise<ManageResult> {
  return managed(
    locale,
    failed,
    (client) => runSetRates(client, raw),
    (r) => r.status === "done",
  );
}

export async function updateUserActive(locale: string, raw: unknown): Promise<ManageResult> {
  return managed(
    locale,
    failed,
    (client) => runSetActive(client, raw),
    (r) => r.status === "done",
  );
}

export async function reassignUserPortfolio(locale: string, raw: unknown): Promise<ReassignResult> {
  return managed(
    locale,
    failed,
    (client) => runReassign(client, raw),
    (r) => r.status === "done",
  );
}

export async function loadUserHistory(locale: string, raw: unknown): Promise<HistoryResult> {
  return managed<HistoryResult>(
    locale,
    { status: "error" },
    (client) => runHistory(client, raw),
    () => false,
  );
}

export async function resetUserTotp(locale: string, raw: unknown): Promise<ManageResult> {
  if (!isLocale(locale)) return failed;
  const member = await requireZone("admin", locale);
  const client = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();
  if (client === null || service === null) return { status: "error", code: "unavailable" };
  const result = await runResetTotp(
    {
      client,
      actorId: member.userId,
      listFactorIds: (userId) => listFactorIds(service, userId),
      deleteFactor: (userId, id) => deleteFactor(service, userId, id),
    },
    raw,
  );
  if (result.status === "done") revalidatePath(`/${locale}/admin/usuarios`);
  return result;
}
