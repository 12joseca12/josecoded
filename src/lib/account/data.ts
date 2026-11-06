import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type AccountFailure,
  type AccountProfile,
  type AccountSource,
  type DeletionResult,
  profileInputSchema,
  type ProfileResult,
  profileRowSchema,
} from "@/types/account";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

interface Failure {
  code?: string | null;
  message?: string | null;
}

const missingCodes = new Set(["PGRST202", "PGRST205", "42883", "42P01"]);

export function mapAccountError(error: Failure): AccountFailure {
  if (error.code === "42501") return "forbidden";
  if (missingCodes.has(error.code ?? "")) return "unavailable";
  return "error";
}

export async function fetchProfile(
  client: Client,
  userId: string,
): Promise<AccountSource<AccountProfile>> {
  try {
    const { data, error } = await client
      .from("profiles")
      .select("full_name, locale, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) return { status: "error" };
    const row = profileRowSchema.safeParse(data);
    if (!row.success) return { status: "error" };
    return {
      status: "ok",
      data: {
        fullName: row.data.full_name,
        locale: row.data.locale,
        createdAt: row.data.created_at,
      },
    };
  } catch {
    return { status: "error" };
  }
}

export async function runSaveProfile(client: Client, raw: unknown): Promise<ProfileResult> {
  const parsed = profileInputSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message;
    return {
      status: "invalid",
      error:
        message === "name_too_long" || message === "locale_invalid" ? message : "name_required",
    };
  }
  try {
    const { error } = await client.rpc("update_my_profile", {
      p_full_name: parsed.data.fullName,
      p_locale: parsed.data.locale,
    });
    if (error) return { status: "error", code: mapAccountError(error) };
    return { status: "done", fullName: parsed.data.fullName, locale: parsed.data.locale };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function fetchDeletion(client: Client): Promise<AccountSource<string | null>> {
  try {
    const { data, error } = await client.rpc("my_account_deletion");
    if (error)
      return mapAccountError(error) === "unavailable"
        ? { status: "unavailable" }
        : { status: "error" };
    return { status: "ok", data: typeof data === "string" ? data : null };
  } catch {
    return { status: "error" };
  }
}

export async function runRequestDeletion(client: Client): Promise<DeletionResult> {
  try {
    const { data, error } = await client.rpc("request_account_deletion");
    if (error) return { status: "error", code: mapAccountError(error) };
    return { status: "done", requestedAt: typeof data === "string" ? data : null };
  } catch {
    return { status: "error", code: "error" };
  }
}

export async function runCancelDeletion(client: Client): Promise<DeletionResult> {
  try {
    const { error } = await client.rpc("cancel_account_deletion");
    if (error) return { status: "error", code: mapAccountError(error) };
    return { status: "done", requestedAt: null };
  } catch {
    return { status: "error", code: "error" };
  }
}
