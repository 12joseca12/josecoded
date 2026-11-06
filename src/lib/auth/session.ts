import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { createSupabaseServerClient, type ServerSupabase } from "@/lib/supabase/server";
import { assuranceLevels, userRoles, type Zone } from "@/types/auth";

import {
  accountPath,
  decideAccess,
  decideAccountAccess,
  loginPath,
  requestPathHeader,
  safeNext,
  secondFactorPath,
  type SessionState,
} from "./guards";
import { zonePath } from "./roles";

const claimsSchema = z.object({
  sub: z.uuid(),
  email: z.string().optional(),
  aal: z.enum(assuranceLevels).optional(),
});

const profileSchema = z.object({
  role: z.enum(userRoles),
  full_name: z.string(),
  is_active: z.boolean(),
  archived_at: z.string().nullable(),
});

export async function readSessionState(client: ServerSupabase): Promise<SessionState> {
  const { data, error } = await client.auth.getClaims();
  if (error || !data) return { status: "anonymous" };
  const claims = claimsSchema.safeParse(data.claims);
  if (!claims.success) return { status: "anonymous" };

  const { data: row, error: profileError } = await client
    .from("profiles")
    .select("role, full_name, is_active, archived_at")
    .eq("id", claims.data.sub)
    .maybeSingle();
  if (profileError) throw new Error("profile_unreadable");
  const profile = profileSchema.safeParse(row);
  if (!profile.success || !profile.data.is_active || profile.data.archived_at !== null) {
    return { status: "inactive" };
  }
  return {
    status: "member",
    userId: claims.data.sub,
    email: claims.data.email ?? null,
    fullName: profile.data.full_name,
    role: profile.data.role,
    level: claims.data.aal ?? "aal1",
  };
}

export const getSessionState = cache(async (): Promise<SessionState | null> => {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  return readSessionState(client);
});

export async function requireZone(
  zone: Zone,
  locale: string,
): Promise<Extract<SessionState, { status: "member" }>> {
  const state = await getSessionState();
  if (state === null) notFound();
  const access = decideAccess(state, zone);
  if (access.kind === "login" || access.kind === "second-factor") {
    const requested = (await headers()).get(requestPathHeader);
    const next = safeNext(locale, requested) ?? zonePath(locale, zone);
    redirect(access.kind === "login" ? loginPath(locale, next) : secondFactorPath(locale, next));
  }
  if (access.kind === "not-found" || state.status !== "member") notFound();
  return state;
}

export async function requireAccount(
  locale: string,
): Promise<Extract<SessionState, { status: "member" }>> {
  const state = await getSessionState();
  if (state === null) notFound();
  const access = decideAccountAccess(state);
  if (access.kind === "login" || access.kind === "second-factor") {
    const next = accountPath(locale);
    redirect(access.kind === "login" ? loginPath(locale, next) : secondFactorPath(locale, next));
  }
  if (access.kind === "not-found" || state.status !== "member") notFound();
  return state;
}
