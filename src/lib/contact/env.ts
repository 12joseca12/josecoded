export const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const turnstileScriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type Env = Record<string, string | undefined>;

export interface ContactServerConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  turnstileSecret: string;
  ipHashSecret: string;
  turnstileVerifyUrl: string;
}

function present(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function readContactServerConfig(env: Env): ContactServerConfig | null {
  const supabaseUrl = present(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = present(env.SUPABASE_SERVICE_ROLE_KEY);
  const turnstileSecret = present(env.TURNSTILE_SECRET_KEY);
  const ipHashSecret = present(env.FORM_IP_HASH_SECRET);
  if (!supabaseUrl || !serviceRoleKey || !turnstileSecret || !ipHashSecret) return null;
  return {
    supabaseUrl,
    serviceRoleKey,
    turnstileSecret,
    ipHashSecret,
    turnstileVerifyUrl: present(env.TURNSTILE_VERIFY_URL) ?? turnstileVerifyUrl,
  };
}

export interface ContactClientConfig {
  siteKey: string;
  scriptUrl: string;
}

export function readContactClientConfig(env: Env): ContactClientConfig | null {
  const siteKey = present(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (!siteKey) return null;
  return { siteKey, scriptUrl: present(env.TURNSTILE_SCRIPT_URL) ?? turnstileScriptUrl };
}

export function isContactAvailable(env: Env): boolean {
  return readContactServerConfig(env) !== null && readContactClientConfig(env) !== null;
}
