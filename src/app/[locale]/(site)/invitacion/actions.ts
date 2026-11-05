"use server";

import { redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { handleSignOut } from "@/lib/auth/handler";
import { isInvitationToken, runAccept } from "@/lib/invitation/invitation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AcceptResult } from "@/types/invitation";

export async function acceptInvitation(locale: string, raw: unknown): Promise<AcceptResult> {
  if (!isLocale(locale)) return { status: "failed", failure: "error" };
  const client = await createSupabaseServerClient();
  if (client === null) return { status: "failed", failure: "error" };
  return runAccept(client, locale, raw);
}

export async function leaveInvitation(locale: string, token: string): Promise<void> {
  await handleSignOut(process.env);
  const base = `/${isLocale(locale) ? locale : "es"}`;
  redirect(isInvitationToken(token) ? `${base}/invitacion/${token}` : `${base}/entrar`);
}
