"use server";

import { revalidatePath } from "next/cache";

import { isLocale } from "@/i18n/config";
import { runInvite, runRenew, runRevoke } from "@/lib/admin/invite";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAuthUser, createSupabaseServiceClient } from "@/lib/supabase/service";
import type { InvitationActionResult, InviteActionResult } from "@/types/users";

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
