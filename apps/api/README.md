# josecoded-api

Cloudflare Worker (Hono) that acts as the **public API gateway** between the web (`apps/web`) and the private
optional backend on Omen, and the only holder of the Supabase secret key. Moved from `josedev/josecoded-api` on 2026-10-03
(josedev commit `baa8f0dea9543c6274aa0ad8ff133c6ae861fabc`). Since plan 1.8c (DATOS v1.2, 2026-10-28) it talks to
the **new** Supabase project through `src/adapters/`, drains `private.outbox` from its cron, and `forum/*` and
`admin-chat/*` are gone with their tables (DATOS §9, Q1; `assistant/*` succeeds admin-chat in 4.4). Every file is
linted with the full rules: there is no legacy exception list any more.

## Role in the system

```
browser
  -> apps/web (Next.js, calls NEXT_PUBLIC_JOSECODED_API_URL)
    -> josecoded-api (this Worker, Cloudflare edge, public but token/CORS gated)
        - Supabase (new project): Auth check of the browser JWT, staff_members, outbox and scheduled-jobs RPCs
          with the secret key, all through src/adapters/
        - Telegram: outbox notices to Jose (job outbox.drain)
        - optional, only with WORKER_URL + WORKER_INTERNAL_TOKEN (task 1.8d; production runs without them):
          /api/v1/system/status (session) and /api/dev/worker/* (development) proxy to Omen
      -> josecoded-worker (Fastify on Omen, private, outside the product)
          requires `Authorization: Bearer BACKEND_INTERNAL_TOKEN` (WORKER_INTERNAL_TOKEN here)
```

This Worker is the trust boundary: browser traffic reaches the backend (when configured) only through it, and
`BACKEND_INTERNAL_TOKEN` is never exposed to frontend code.

## Routes

`GET /health`, `GET /api/v1/health` (public; the public `GET /system/status` was removed in 1.8d); `GET /api/v1/auth/me` (`{ id, email, is_admin }`)
and `GET /api/v1/system/status` behind `requireUser` (503 `worker_not_configured` without Omen). Every other path under `/api/v1` answers 401 from the wildcard
gate. `ALL /api/dev/worker/*` only with `API_MODE=development`, `WORKER_URL` and `DEV_API_KEY` (404 otherwise). The list lives in
`src/routes-manifest.ts` and the snapshot in `src/__snapshots__/`.

## Structure (working-agreements §17.1)

- `src/index.ts` — app composition: request id, security headers, `withDeps`, CORS, route mounting, `scheduled`.
- `src/deps.ts` — `buildDeps(env)`: clock, `supabase` (gateway), `outbox`, `notices`, `scheduledJobs`, `telegram`.
  Tests replace ports through `env.__deps` (compiled out of every wrangler build).
- `src/adapters/` — the only files that import SDKs or call third parties: `supabase.ts` (port `SupabaseGateway`:
  `verifyUser`, `isAdmin`, `admin()`; the only `@supabase/supabase-js` import), `scheduled-jobs.ts`, `outbox.ts`
  (`OutboxRepo`, `NoticeLedger`), `telegram.ts`.
- `src/middlewares/` — `requireUser` / `requireAdmin` (admin = `staff_members` row **and** `aal2`, unless
  `ADMIN_REQUIRE_MFA=false`), security headers, rate limits, `withDeps`.
- `src/modules/` — Hono routers; they read `c.var.deps` and never import adapters (lint-enforced).
- `src/scheduled.ts` + `src/jobs/` — the single `*/5` cron dispatching `private.scheduled_jobs`; `outbox.drain`
  claims, resolves who is told (`notification_recipients`), sends by Telegram or fixed-template email, acks or fails (dead letter
  after 10 attempts is SQL). `telegram.poll_updates` links staff chats from `/start <code>`.
- `test/fakes/` — in-memory ports and an in-memory Supabase/Telegram `fetch` for end-to-end tests in workerd.

## Env vars

See `.dev.vars.example` and `DEPLOY.md` §2. Key ones: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `CHAT_SID_SECRET`, optional `RESEND_API_KEY`.
`WORKER_URL` and `WORKER_INTERNAL_TOKEN` are optional and coupled (both or neither; the second must equal
`BACKEND_INTERNAL_TOKEN` on the backend) and are not set in production.

## Commands

```bash
pnpm dev                          # wrangler dev with .dev.vars (Supabase local: supabase start)
pnpm dev -- --test-scheduled      # also exposes /__scheduled to fire the cron by hand
pnpm test                         # Vitest in workerd (@cloudflare/vitest-pool-workers), local only
pnpm typecheck
pnpm lint
pnpm build                        # wrangler deploy --dry-run for prod and preview (offline) + no test hooks check
pnpm deploy                       # wrangler deploy (the controller deploys, never an agent)
```
