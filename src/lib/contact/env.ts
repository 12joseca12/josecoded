export const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const turnstileScriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js";

const productionSupabaseUrl = /^https:\/\/[a-z0-9]{20}\.supabase\.co$/;
const turnstileTestKey = /^[123]x/;
const loopbackHosts = new Set(["localhost", "127.0.0.1"]);

export const allowedHostnames = [
  "josecoded.com",
  "www.josecoded.com",
  "josecoded-preview.josecoded-api.workers.dev",
] as const;

type Env = Record<string, string | undefined>;

export interface ContactServerConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  turnstileSecret: string;
  ipHashSecret: string;
  turnstileVerifyUrl: string;
  loopback: boolean;
  allowedHostnames: readonly string[];
}

function present(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function isLoopbackUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol.startsWith("http") && loopbackHosts.has(url.hostname);
  } catch {
    return false;
  }
}

function isLoopbackMode(env: Env): boolean {
  const supabaseUrl = present(env.NEXT_PUBLIC_SUPABASE_URL);
  return supabaseUrl !== null && isLoopbackUrl(supabaseUrl);
}

function overrideUrl(value: string | undefined, loopback: boolean): string | false | null {
  const url = present(value);
  if (url === null) return null;
  return loopback && isLoopbackUrl(url) ? url : false;
}

export function readContactServerConfig(env: Env): ContactServerConfig | null {
  const supabaseUrl = present(env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = present(env.SUPABASE_SERVICE_ROLE_KEY);
  const turnstileSecret = present(env.TURNSTILE_SECRET_KEY);
  const ipHashSecret = present(env.FORM_IP_HASH_SECRET);
  if (!supabaseUrl || !serviceRoleKey || !turnstileSecret || !ipHashSecret) return null;

  const loopback = isLoopbackMode(env);
  if (!loopback && !productionSupabaseUrl.test(supabaseUrl)) return null;
  if (!loopback && turnstileTestKey.test(turnstileSecret)) return null;

  const verifyUrl = overrideUrl(env.TURNSTILE_VERIFY_URL, loopback);
  if (verifyUrl === false) return null;

  return {
    supabaseUrl,
    serviceRoleKey,
    turnstileSecret,
    ipHashSecret,
    turnstileVerifyUrl: verifyUrl ?? turnstileVerifyUrl,
    loopback,
    allowedHostnames: loopback ? [...allowedHostnames, "localhost"] : allowedHostnames,
  };
}

export interface ContactClientConfig {
  siteKey: string;
  scriptUrl: string;
}

export function readContactClientConfig(env: Env): ContactClientConfig | null {
  const siteKey = present(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (!siteKey) return null;
  const loopback = isLoopbackMode(env);
  if (!loopback && turnstileTestKey.test(siteKey)) return null;
  const scriptUrl = overrideUrl(env.TURNSTILE_SCRIPT_URL, loopback);
  if (scriptUrl === false) return null;
  return { siteKey, scriptUrl: scriptUrl ?? turnstileScriptUrl };
}

export function isContactAvailable(env: Env): boolean {
  return readContactServerConfig(env) !== null && readContactClientConfig(env) !== null;
}
