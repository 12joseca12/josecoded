import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { features } from "@/config/features";
import { type Env, isLoopbackMode, present, productionSupabaseUrl } from "@/lib/contact/env";
import type { Database } from "@/types/database";

import { mergeFeatures } from "./definitions";

export const settingsCacheTag = "site-settings";
export const settingsRevalidateSeconds = 60;
const readTimeoutMs = 1500;

interface PublicSettingsConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export function readPublicSettingsConfig(env: Env): PublicSettingsConfig | null {
  const supabaseUrl = present(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = present(env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!isLoopbackMode(env) && !productionSupabaseUrl.test(supabaseUrl)) return null;
  return { supabaseUrl, serviceRoleKey };
}

type PublicRows = { key: string; value: unknown }[];

export async function fetchPublicSettings(env: Env): Promise<PublicRows | null> {
  const config = readPublicSettingsConfig(env);
  if (!config) return null;
  try {
    const client = createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
    const { data, error } = await client
      .rpc("read_public_settings")
      .abortSignal(AbortSignal.timeout(readTimeoutMs));
    if (error || !Array.isArray(data)) return null;
    return data.map((row) => ({ key: row.key, value: row.value }));
  } catch {
    return null;
  }
}

const readCached = unstable_cache(
  () => fetchPublicSettings(process.env),
  [settingsCacheTag, process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""],
  {
    revalidate: settingsRevalidateSeconds,
    tags: [settingsCacheTag],
  },
);

export async function getFeatures(): Promise<typeof features> {
  try {
    return mergeFeatures(features, await readCached());
  } catch {
    return features;
  }
}
