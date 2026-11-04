import { type Env, isLoopbackMode, present, productionSupabaseUrl } from "@/lib/contact/env";

const publishableKeyPattern = /^sb_publishable_[A-Za-z0-9_-]{8,}$/;

export interface SupabasePublicConfig {
  supabaseUrl: string;
  publishableKey: string;
  loopback: boolean;
}

export function readSupabasePublicConfig(env: Env): SupabasePublicConfig | null {
  const supabaseUrl = present(env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = present(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!supabaseUrl || !publishableKey) return null;
  const loopback = isLoopbackMode(env);
  if (!loopback && !productionSupabaseUrl.test(supabaseUrl)) return null;
  if (!loopback && !publishableKeyPattern.test(publishableKey)) return null;
  return { supabaseUrl, publishableKey, loopback };
}
