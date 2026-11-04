import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { readSupabasePublicConfig } from "@/lib/auth/env";
import type { Database } from "@/types/database";

import { sessionCookieOptions } from "./cookies";

export type ServerSupabase = SupabaseClient<Database>;

export async function createSupabaseServerClient(
  env: Record<string, string | undefined> = process.env,
): Promise<ServerSupabase | null> {
  const store = await cookies();
  const config = readSupabasePublicConfig(env);
  if (!config) return null;
  return createServerClient<Database>(config.supabaseUrl, config.publishableKey, {
    cookieOptions: sessionCookieOptions(config.loopback),
    cookies: {
      getAll: () => store.getAll(),
      setAll: (entries) => {
        try {
          for (const { name, value, options } of entries) store.set(name, value, options);
        } catch {
          return;
        }
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
