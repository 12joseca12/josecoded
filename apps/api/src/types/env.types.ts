export type ApiMode = 'development' | 'production';

export type Env = {
  API_MODE: ApiMode;
  /** Omen backend, optional (task 1.8d). Set together with `WORKER_INTERNAL_TOKEN` or not at all. */
  WORKER_URL?: string;
  WORKER_INTERNAL_TOKEN?: string;
  CORS_ORIGINS: string;
  SUPABASE_URL: string;
  /** Legacy anon JWT (`eyJ...`), only when there is no publishable key. */
  SUPABASE_ANON_KEY?: string;
  /** `sb_publishable_…`: same value as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` of the web. */
  SUPABASE_PUBLISHABLE_KEY?: string;
  /**
   * `sb_secret_…` (bypasses RLS). Only adapters/supabase.ts reads it: outbox, scheduled jobs and the admin check.
   * Without it the dispatcher finds nothing to run and `isAdmin` fails.
   */
  SUPABASE_SECRET_KEY?: string;

  /** Optional: protect /api/dev/* with a separate key (`x-dev-api-key`). */
  DEV_API_KEY?: string;

  /** Optional: timeout ms for /ai/chat proxy to worker (default 30000). */
  AI_CHAT_TIMEOUT_MS?: string;

  /** Native Cloudflare Rate Limiting binding for /ai/*. Absent in local dev. */
  AI_RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };

  /** Native Workers AI binding. Absent in tests and in local envs that do not configure it. */
  AI?: {
    run(
      model: string,
      opts: { messages: { role: string; content: string }[] },
    ): Promise<{ response?: string }>;
  };

  // --- Plan 1.8c (DATOS §8.4, §12). ---
  /** `'false'` turns off the `aal2` requirement of `requireAdmin` (local tests without TOTP). Any other value: required. */
  ADMIN_REQUIRE_MFA?: string;
  /** Telegram bot that tells Jose about outbox events (outbox.drain). */
  TELEGRAM_BOT_TOKEN?: string;
  /** Jose's chat with the bot. */
  TELEGRAM_ADMIN_CHAT_ID?: string;
  /** Resend (DATOS Q5): email channel; no launch event uses it yet. */
  RESEND_API_KEY?: string;
  /** Signs `chat_sid` of the case-based chat (task 4.4). */
  CHAT_SID_SECRET?: string;

  // --- Added by plan 1.7 for the new modules (DT §9). All optional until the task that uses each one. ---
  TURNSTILE_SECRET_KEY?: string;
  /** Server-to-server key of `leads` (header `x-josecoded-server-key`). */
  SERVER_KEY?: string;
  PROPOSALS_DAILY_LIMIT_IP?: string;
  PROPOSALS_DAILY_LIMIT_ALL?: string;
  AI_PROPOSAL_MODEL?: string;
  /** Required from task 3.7 (AI Gateway for proposals). */
  AI_GATEWAY_ID?: string;
  ALLOWED_TURNSTILE_HOSTNAMES?: string;
  GITHUB_APP_ID?: string;
  GITHUB_APP_INSTALLATION_ID?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  /** Native rate limiting bindings (wrangler `ratelimits`). Absent in local dev. */
  LEADS_RATE_LIMITER?: RateLimiterBinding;
  AFFILIATE_RATE_LIMITER?: RateLimiterBinding;
  RADAR_RATE_LIMITER?: RateLimiterBinding;
};

export type RateLimiterBinding = { limit(opts: { key: string }): Promise<{ success: boolean }> };
