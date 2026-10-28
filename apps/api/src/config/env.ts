import { z } from 'zod';

import type { ApiMode, Env, RateLimiterBinding } from '../types/env.types';

const apiModeSchema = z.enum(['development', 'production'] satisfies ApiMode[]);

/** Native Rate Limiting binding (object with `.limit()`, not a string): kept as is, absent in local dev. */
const rateLimiterSchema = z
  .custom<RateLimiterBinding>(
    (v) => typeof v === 'object' && v !== null && typeof (v as { limit?: unknown }).limit === 'function',
    { message: 'Rate limiter binding must expose limit()' },
  )
  .optional();

const envSchema = z.object({
  API_MODE: apiModeSchema.default('development'),
  WORKER_URL: z.string().url(),
  WORKER_INTERNAL_TOKEN: z.string().min(10),
  CORS_ORIGINS: z.string().default(''),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(10).optional(),
  // New-format secret key (`sb_secret_…`, DATOS §8.1): outbox, scheduled jobs and staff_members (adapters/supabase.ts).
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  DEV_API_KEY: z.string().min(10).optional(),
  WORKER_TIMEOUT_MS: z.string().regex(/^\d+$/).optional(),
  AI_CHAT_TIMEOUT_MS: z.string().regex(/^\d+$/).optional(),
  // Admin guard (DATOS Q3): TOTP (`aal2`) is required unless this is exactly 'false' (local tests without TOTP).
  ADMIN_REQUIRE_MFA: z.enum(['true', 'false']).optional(),
  // Outbox notifications (plan 1.8c, DATOS §8.4): without both, outbox.drain leaves the events where they are.
  TELEGRAM_BOT_TOKEN: z.string().min(10).optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().regex(/^-?\d+$/).optional(),
  // Email channel (Resend, DATOS Q5); no launch event is routed to it yet.
  RESEND_API_KEY: z.string().min(10).optional(),
  // Signs `chat_sid` (assistant, task 4.4).
  CHAT_SID_SECRET: z.string().min(32).optional(),
  // New modules (plan 1.7, DT §9). Optional for now; every new binding must be listed here or parseEnv strips it.
  WORKER_INTERNAL_TOKEN_PREV: z.string().min(10).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  SERVER_KEY: z.string().min(1).optional(),
  N8N_LEAD_WEBHOOK_ENABLED: z.enum(['true', 'false']).optional(),
  PROPOSALS_DAILY_LIMIT_IP: z.string().regex(/^\d+$/).optional(),
  PROPOSALS_DAILY_LIMIT_ALL: z.string().regex(/^\d+$/).optional(),
  AI_PROPOSAL_MODEL: z.string().min(1).optional(),
  // becomes required with task 3.7
  AI_GATEWAY_ID: z.string().min(1).optional(),
  ALLOWED_TURNSTILE_HOSTNAMES: z.string().optional(),
  GITHUB_APP_ID: z.string().min(1).optional(),
  GITHUB_APP_INSTALLATION_ID: z.string().min(1).optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(),
  LEADS_RATE_LIMITER: rateLimiterSchema,
  AFFILIATE_RATE_LIMITER: rateLimiterSchema,
  RADAR_RATE_LIMITER: rateLimiterSchema,
  // Native binding (object with `.run()`): without this entry zod would strip it from the parsed env.
  AI: z
    .custom<Env['AI']>(
      (v) => typeof v === 'object' && v !== null && typeof (v as { run?: unknown }).run === 'function',
      { message: 'Falta el binding AI (Workers AI). Configura "ai": { "binding": "AI" } en wrangler.jsonc' },
    )
    .optional(),
}).refine(
  (data) => Boolean(data.SUPABASE_ANON_KEY?.trim() || data.SUPABASE_PUBLISHABLE_KEY?.trim()),
  {
    message: 'Set SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY',
    path: ['SUPABASE_ANON_KEY'],
  },
);

const REQUIRED_BINDING_KEYS = [
  'WORKER_URL',
  'WORKER_INTERNAL_TOKEN',
  'SUPABASE_URL',
] as const;

/** Values only for `wrangler dev` without `.dev.vars`: Supabase placeholders (nothing privileged works without them). */
const LOCAL_DEV_ENV_PLACEHOLDERS = {
  WORKER_URL: 'http://127.0.0.1:8787',
  WORKER_INTERNAL_TOKEN: 'local-dev-worker-internal-token',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'local-dev-supabase-anon-key-placeholder',
} as const;

function isEmptyBinding(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

/**
 * Convierte bindings de Wrangler en un objeto parseable y, en modo desarrollo,
 * rellena placeholders si faltan **todas** las variables obligatorias (típico en local sin `.dev.vars`).
 */
export function normalizeEnvBindings(raw: unknown): Record<string, unknown> {
  const base =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};

  for (const key of Object.keys(base)) {
    if (base[key] === '') base[key] = undefined;
  }

  const mode: ApiMode = base.API_MODE === 'production' ? 'production' : 'development';
  base.API_MODE = mode;

  // En development, rellenar solo las claves vacías (p. ej. wrangler.jsonc con WORKER_URL pero sin Supabase).
  if (mode === 'development') {
    for (const k of REQUIRED_BINDING_KEYS) {
      if (isEmptyBinding(base[k])) {
        base[k] = LOCAL_DEV_ENV_PLACEHOLDERS[k];
      }
    }
    const hasSupabaseKey =
      !isEmptyBinding(base.SUPABASE_ANON_KEY) || !isEmptyBinding(base.SUPABASE_PUBLISHABLE_KEY);
    if (!hasSupabaseKey) {
      base.SUPABASE_ANON_KEY = LOCAL_DEV_ENV_PLACEHOLDERS.SUPABASE_ANON_KEY;
    }
  }

  return base;
}

export function parseEnv(raw: unknown): Env {
  const parsed = envSchema.safeParse(normalizeEnvBindings(raw));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    throw new Error(`Invalid environment: ${JSON.stringify(issues)}`);
  }
  return parsed.data;
}
