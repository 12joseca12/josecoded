import {
  allowedHostnames,
  type Env,
  isLoopbackMode,
  overrideUrl,
  present,
  productionSupabaseUrl,
  turnstileTestKey,
  turnstileVerifyUrl,
} from "@/lib/contact/env";

const publishableKeyPattern = /^sb_publishable_[A-Za-z0-9_-]{8,}$/;

export interface SupabasePublicConfig {
  supabaseUrl: string;
  publishableKey: string;
  loopback: boolean;
}

export interface AuthServerConfig extends SupabasePublicConfig {
  turnstileSecret: string;
  turnstileVerifyUrl: string;
  allowedHostnames: readonly string[];
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

export function readAuthServerConfig(env: Env): AuthServerConfig | null {
  const base = readSupabasePublicConfig(env);
  const turnstileSecret = present(env.TURNSTILE_SECRET_KEY);
  if (!base || !turnstileSecret) return null;
  if (!base.loopback && turnstileTestKey.test(turnstileSecret)) return null;
  const verifyUrl = overrideUrl(env.TURNSTILE_VERIFY_URL, base.loopback);
  if (verifyUrl === false) return null;
  return {
    ...base,
    turnstileSecret,
    turnstileVerifyUrl: verifyUrl ?? turnstileVerifyUrl,
    allowedHostnames: base.loopback ? [...allowedHostnames, "localhost"] : allowedHostnames,
  };
}
