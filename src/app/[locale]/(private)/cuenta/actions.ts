"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isLocale } from "@/i18n/config";
import { runCancelDeletion, runRequestDeletion, runSaveProfile } from "@/lib/account/data";
import { loginPath } from "@/lib/auth/guards";
import {
  handleFinishTotpChange,
  handleSignOutScope,
  handleStartTotpChange,
} from "@/lib/auth/handler";
import { requireAccount } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  DeletionResult,
  ProfileResult,
  SessionScopeResult,
  TotpChangeResult,
} from "@/types/account";
import type { EnrollmentResult } from "@/types/auth";

async function clientIp(): Promise<string | null> {
  return (await headers()).get("cf-connecting-ip");
}

async function open(locale: string) {
  if (!isLocale(locale)) return null;
  await requireAccount(locale);
  const client = await createSupabaseServerClient();
  if (client === null) return null;
  return { client, path: `/${locale}/cuenta` };
}

export async function saveProfile(locale: string, raw: unknown): Promise<ProfileResult> {
  const session = await open(locale);
  if (session === null) return { status: "error", code: "unavailable" };
  const result = await runSaveProfile(session.client, raw);
  if (result.status === "done") revalidatePath(session.path, "layout");
  return result;
}

export async function signOutSessions(locale: string, raw: unknown): Promise<SessionScopeResult> {
  const session = await open(locale);
  if (session === null) return { status: "error" };
  const result = await handleSignOutScope(raw, process.env);
  if (result.status === "done" && raw === "global") redirect(loginPath(locale));
  return result;
}

export async function startTotpChange(locale: string): Promise<EnrollmentResult> {
  const session = await open(locale);
  if (session === null) return { status: "unavailable" };
  return handleStartTotpChange(await clientIp(), process.env);
}

export async function finishTotpChange(locale: string, raw: unknown): Promise<TotpChangeResult> {
  const session = await open(locale);
  if (session === null) return { status: "error" };
  const result = await handleFinishTotpChange(raw, await clientIp(), process.env);
  if (result.status === "done") revalidatePath(session.path);
  return result;
}

export async function requestDeletion(locale: string): Promise<DeletionResult> {
  const session = await open(locale);
  if (session === null) return { status: "error", code: "unavailable" };
  const result = await runRequestDeletion(session.client);
  if (result.status === "done") revalidatePath(session.path);
  return result;
}

export async function withdrawDeletion(locale: string): Promise<DeletionResult> {
  const session = await open(locale);
  if (session === null) return { status: "error", code: "unavailable" };
  const result = await runCancelDeletion(session.client);
  if (result.status === "done") revalidatePath(session.path);
  return result;
}
