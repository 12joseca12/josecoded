import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isLoopbackMode, present, productionSupabaseUrl } from "@/lib/contact/env";
import type { Database } from "@/types/database";

export type ServiceSupabase = SupabaseClient<Database>;

export function createSupabaseServiceClient(
  env: Record<string, string | undefined> = process.env,
): ServiceSupabase | null {
  const url = present(env.NEXT_PUBLIC_SUPABASE_URL);
  const key = present(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  if (!isLoopbackMode(env) && !productionSupabaseUrl.test(url)) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function createAuthUser(
  client: ServiceSupabase,
  email: string,
): Promise<"created" | "exists" | "failed"> {
  try {
    const { error } = await client.auth.admin.createUser({ email, email_confirm: true });
    if (!error) return "created";
    return error.code === "email_exists" || error.status === 422 ? "exists" : "failed";
  } catch {
    return "failed";
  }
}
