export type ApiMode = 'development' | 'production';

export type Env = {
  API_MODE: ApiMode;
  WORKER_URL: string;
  WORKER_INTERNAL_TOKEN: string;
  CORS_ORIGINS: string;
  SUPABASE_URL: string;
  /** Legacy anon JWT (`eyJ...`) o clave publicable si no usas anon. */
  SUPABASE_ANON_KEY?: string;
  /** Recomendado en local: misma que `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. */
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** `true` (p. ej. `pnpm dev -- --mock`): foro solo en mock aunque exista service_role. */
  FORUM_USE_MOCK?: string;
  /** Opcional: `false` fuerza mock aunque haya service_role (compat). */
  FORUM_USE_DATABASE?: string;
  FORUM_MODERATION_DISABLED?: string;

  /**
   * Optional: protect /api/dev/* with a separate key.
   * If set, requests must include `x-dev-api-key`.
   */
  DEV_API_KEY?: string;

  /**
   * Optional: max ms to wait for upstream worker.
   */
  WORKER_TIMEOUT_MS?: string;

  /**
   * Optional: timeout ms for /ai/chat proxy to worker (default 30000).
   */
  AI_CHAT_TIMEOUT_MS?: string;

  /** UUIDs separados por coma con permisos de moderación en el foro (mock). */
  FORUM_ADMIN_USER_IDS?: string;

  /** Email del superusuario / administrador del chat. */
  ADMIN_SUPERUSER_EMAIL?: string;

  /** UUID en Supabase Auth (opcional; evita depender solo del email). */
  ADMIN_SUPERUSER_ID?: string;

  /** Ruta del worker IA para el chat (default `/ai/chat`). */
  ADMIN_CHAT_WORKER_PATH?: string;

  /** Timeout ms para la llamada IA del chat (default 60000). */
  ADMIN_CHAT_WORKER_TIMEOUT_MS?: string;

  /** Webhook n8n (opcional; el chat usa worker IA por defecto). */
  N8N_CHAT_WEBHOOK_URL?: string;

  /** Secreto compartido: cabecera `x-n8n-chat-secret` en callback n8n → API. */
  N8N_CHAT_WEBHOOK_SECRET?: string;

  /** URL pública del API para callbacks n8n (p. ej. https://api.tudominio.com). */
  PUBLIC_API_BASE_URL?: string;

  /** Binding nativo de Cloudflare Rate Limiting para /ai/*. Ausente en dev local. */
  AI_RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };

  /**
   * Binding nativo de Cloudflare Workers AI (respuesta del admin-chat).
   * Opcional como `AI_RATE_LIMITER`: ausente en tests/env que no lo configuran;
   * `generateAdminReply` (ai-reply.ts) falla explícito si falta y el pipeline
   * cae al fallback local.
   */
  AI?: {
    run(
      model: string,
      opts: { messages: { role: string; content: string }[] },
    ): Promise<{ response?: string }>;
  };

  /** Modelo Workers AI para el admin-chat (default `@cf/meta/llama-3.3-70b-instruct-fp8-fast`). */
  AI_CHAT_MODEL?: string;

  // --- Added by plan 1.7 for the new modules (DT §9). All optional until the task that uses each one. ---
  /** Previous internal token, accepted for 24 h while rotating `WORKER_INTERNAL_TOKEN` (worker.service.ts). */
  WORKER_INTERNAL_TOKEN_PREV?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Server-to-server key of `leads` (header `x-josecoded-server-key`). */
  SERVER_KEY?: string;
  NOTIFY_SHARED_SECRET?: string;
  N8N_LEAD_WEBHOOK_ENABLED?: string;
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
