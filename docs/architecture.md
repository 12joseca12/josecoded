# Architecture

> Written for someone opening this repository for the first time. The normative documents are in Spanish and linked at the end; this page is the map, not the law. Updated 2026-10-28 (spec v2.0, plan v3.0).

## In one paragraph

josecoded is the personal platform of a freelance full-stack developer: a public site (services, projects, technical blog, a small lab, an AI chat that answers by visitor type), a client area and a private CRM, all in one pnpm/turbo monorepo. The web app is Next.js 16 App Router rendered on Cloudflare Workers through OpenNext, with no Node middleware. Everything that needs a secret or talks to a third party goes through one Hono gateway (`apps/api`), also a Worker, which fronts Supabase (Postgres + Auth with RLS), Workers AI, Turnstile, Telegram and a Fastify backend on a home server ("Omen") reached only through a Cloudflare Tunnel. Design is expressed as tokens (`design.json` -> `tokens.css`) consumed by CSS Modules, motion is native CSS plus small TypeScript modules, and every cross-cutting rule (import boundaries, token-only styles, shared types, zod at the edges, duplication, RLS) is enforced by a test or a lint rule rather than by convention.

## Context

```mermaid
flowchart LR
  subgraph browser[Browser]
    V[Visitor / client / Jose]
  end

  subgraph cf[Cloudflare]
    WEB["apps/web<br/>Next 16 App Router on Workers (OpenNext)<br/>RSC, Server Actions, CSS Modules + tokens"]
    API["apps/api<br/>Hono gateway on Workers<br/>ports and adapters, cron */5"]
    AI[Workers AI + AI Gateway]
    TS[Turnstile]
    KV[(KV: quotas, OAuth tokens)]
  end

  subgraph supa[Supabase]
    DB[(Postgres + RLS<br/>leads, clients, crm_*, chat_*, blog_comments)]
    AUTH[Auth: Google, GitHub, email OTP]
  end

  subgraph omen[Home server "Omen"]
    TUN[Cloudflare Tunnel<br/>worker.josecoded.com]
    WRK["josecoded-worker (Fastify)<br/>ai, n8n, storage, system"]
    N8N[n8n]
    UMAMI[Umami analytics]
  end

  CAL[Cal.com]
  TG[Telegram bot]

  V -->|HTTPS| WEB
  V -->|publishable key + RLS| DB
  V -->|session| AUTH
  V -->|book a call| CAL
  WEB -->|NEXT_PUBLIC_JOSECODED_API_URL| API
  WEB -. widget .-> TS
  WEB -. script .-> UMAMI
  CAL -->|webhook| WEB
  API -->|service role| DB
  API --> AI
  API -->|verify| TS
  API --> KV
  API -->|Bearer WORKER_INTERNAL_TOKEN| TUN --> WRK
  WRK --> N8N
  API -->|outbox drain + inline: Telegram, Resend| TG
```

Rules the diagram encodes:

- The browser never talks to Omen or to n8n. The only Omen URL the public sees is Umami.
- Secrets live in the gateway (`wrangler secret`) or in Supabase, never in `NEXT_PUBLIC_*` and never in the repo.
- Supabase is reached from the browser only through RLS with the publishable key; privileged access exists only in the gateway and in Server Actions.
- Legacy pieces are consumed, not rewritten: the gateway's inherited routes (`v1`, `v1-protected`, `forum`, `admin-chat`, `health`, `system`), the Omen worker, the Supabase schema (additive migrations only), the domain and the Cloudflare account.

## Monorepo map

Folders marked *planned* are in the implementation plan but do not exist yet on `main`.

```
josecoded/
├─ apps/
│  ├─ web/                      Next 16 App Router -> Cloudflare Workers (OpenNext)
│  │  ├─ app/                   routes only: layouts, pages, route handlers, Server Actions (thin)
│  │  │  └─ [locale]/           es (no prefix) and en, no middleware; (public), (area), (admin) groups *planned*
│  │  ├─ components/            one folder per component: <name>.tsx, <name>.module.css, index.ts
│  │  │  └─ {ui,layout,hero,scenes,home,forms,admin,crm}/   (ui, hero, scenes, forms, admin, crm *planned*)
│  │  ├─ lib/                   framework-free logic: env, locale, a11y/*, motion/*, supabase/*, analytics (*planned* beyond env/locale)
│  │  ├─ i18n/                  next-intl routing, pathnames (es/en slugs), rewrite and redirect rules
│  │  ├─ messages/{es,en}/      one JSON per screen; composed by messages/{es,en}.ts; the only place for copy
│  │  ├─ styles/                tokens.css, tokens.ts, breakpoints.ts (GENERATED), globals.css *planned*
│  │  ├─ content/               projects, services, FAQ, blog MDX *planned*
│  │  ├─ e2e/                   Playwright + axe against the local OpenNext preview
│  │  └─ tests/                 Vitest (happy-dom), type tests for message keys
│  └─ api/                      Hono gateway on Workers (branch chore/supabase until phase 1b merges)
│     ├─ src/index.ts           composition: middlewares, CORS, route mounting, scheduled handler
│     ├─ src/deps.ts            buildDeps(env): the composition root of the new modules
│     ├─ src/adapters/          the ONLY files that import SDKs or fetch third parties (*planned*: supabase, kv-quota, telegram, brevo, workers-ai, turnstile, google, github)
│     ├─ src/modules/           one Hono router per domain; legacy: v1, v1-protected, forum, admin-chat, health, system; *planned*: proposals, leads, notify, affiliates, assistant, crm, radar
│     ├─ src/services/          legacy domain logic (stores, n8n bridge, worker proxy); new services are create<X>Service(deps) factories
│     ├─ src/middlewares/       requestId, securityHeaders, auth (Supabase JWT), native rate limit, withDeps
│     ├─ src/schemas/           legacy zod request schemas (new ones live in @josecoded/types)
│     ├─ src/scheduled.ts       the single cron (*/5) dispatching private.scheduled_jobs
│     └─ test/fakes/            in-memory fakes of the ports used by service tests
├─ packages/
│  ├─ config/                   shared eslint (boundaries), stylelint (tokens only), tsconfig, prettier; tested
│  ├─ types/                    @josecoded/types: one file per domain + zod schemas; the only home of shared types
│  ├─ pricing/                  pricing.json (from Comercial/tarifas.md), price rules, affiliate and upgrade logic, DB sync script
│  ├─ design-tokens/            .impeccable/design.json -> apps/web/styles/tokens.css|ts with drift test
│  ├─ glyph-scene/              *planned*: Three.js hero scene, no React; renders the hero video/poster at build time
│  ├─ radar-core/               *planned, post-launch*: state machine, scoring and materials of the job-hunting module
│  └─ radar-connectors/         *planned, post-launch*: job-platform connectors + CLIs for Omen and the Mac
├─ supabase/                    migrations from scratch (DATOS), seed, migration tests and the `test/pg` harness; the gateway drains `private.outbox`
├─ infra/                       *planned*: reference only (Omen compose files, n8n exports, launchd plist); applied by hand with explicit OK
├─ .impeccable/                 design.json (source of the tokens), surface contracts
├─ docs/                        working agreements, specs, technical design, UX/UI, plans, prototypes (docs/superpowers/design/ref/)
└─ .github/workflows/           ci.yml (lint, jscpd, typecheck, test, build, e2e); preview and production deploys (disabled until CI has Cloudflare credentials)
```

## Layers and dependency rules

### `apps/web`

```
app/ (routes, thin)  ->  components/ (compose, styled with tokens)  ->  lib/ (pure logic)  ->  @josecoded/*
```

- `app/` holds routing, metadata, Server Actions and route handlers. A page validates its locale, loads translations and composes components; it does not contain business logic or markup beyond landmarks.
- `components/` never import from `app/`. One component per concept with variants expressed as unions in `@josecoded/types` and rendered as `data-variant`/`data-size`/`data-tone` attributes; the CSS Module selects by attribute. No CVA, no clsx, no Tailwind, no shadcn. Polymorphism by `href` (link vs button), never `as`/`asChild`.
- `lib/` is framework-light TypeScript with unit tests: `env` (zod-validated), `locale`, `a11y/*` (focus trap, inert, roving tabindex, announce), `motion/*` (paging, expand-cell, cursor light...), `supabase/*` (the only place that imports `@supabase/supabase-js` on the web side).
- Copy lives only in `messages/{es,en}/*.json`; `react/jsx-no-literals` fails the lint on any string in JSX. Message keys are typed through next-intl's `AppConfig`, so a wrong key does not compile.
- No Node middleware: i18n is rewrites and redirects derived from `i18n/pathnames.ts`; auth guards run in server layouts and are re-checked in every Server Action and route handler.
- Client state without a library: URL, RSC and Server Actions for data; `useState` locally; one `ShellProvider` for the shell (*planned*).
- Styles: CSS Modules that consume only `var(--token)`. `tokens.css` is generated from `.impeccable/design.json`; editing it by hand fails the drift test. Relative units everywhere text scales; `px` only for hairlines, strokes, shadows, blurs and motion offsets. Motion is native CSS (`scroll-snap`, `animation-timeline`, View Transitions) under `@supports` with documented fallbacks (Baseline 2024).

### `apps/api` (gateway)

```
index.ts (compose)  ->  modules/*.routes.ts (validate, call service, respond)  ->  services (pure, take deps)  ->  ports (@josecoded/types)  <-  adapters (SDKs, fetch)
```

- **Ports** are interfaces in `@josecoded/types/api.ts` (`Clock`, `ScheduledJobsRepo` today; `LeadsRepo`, `QuotaStore`, `Notifier`, `AiClient`, `TurnstileVerifier`... as each task lands).
- **Adapters** in `src/adapters/*.adapter.ts` are the only files allowed to import an SDK or `fetch` a third party.
- **`buildDeps(env)`** in `src/deps.ts` builds the real adapters once per request; the `withDeps` middleware leaves them in `c.var.deps`. Routes never import adapters (lint-enforced) and never build dependencies.
- **Services** are factories `create<X>Service(deps: Pick<Deps, ...>)` tested with in-memory fakes from `test/fakes/`. Pure business rules (quotas, pricing, state machines) have no `deps` at all.
- **Modules per domain**: legacy `v1`, `v1-protected`, `forum`, `admin-chat`, `health`, `system` (kept as moved from the old repo, contracts frozen); new `proposals`, `leads`, `notify`, `affiliates`, `assistant` (case-based public chat), `crm` (contacts, drafts, contexts), later `radar/*` and `newsletter/*`.
- The response envelope is shared by all routes: `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`.
- One cron trigger (`*/5`) dispatches jobs read from `private.scheduled_jobs` with a subrequest budget; no per-job crons (Workers Free limit).
- Test hooks (`env.__deps`) are compiled out of production bundles with `define: { __TEST_HOOKS__: false }`, and the wrangler config has a test asserting it for every environment.

### `packages/*`

- Packages never depend on `apps/*`. `pricing` and `design-tokens` depend on `types`; `types` depends on nothing at runtime (zod is a peer dependency for the schemas); `config` is tooling only.
- `@josecoded/types` is the single home for any type used by more than one file: one file per domain (`ui`, `content`, `api`, `db`, `i18n`, `tokens`...) re-exported from one barrel (a test checks the barrel). zod schemas in `schemas/` are the source at every process boundary (env, JSON content, forms, gateway bodies, webhooks) and the types are inferred from them. `database.ts` is generated from the local Supabase schema, imported only through `db.ts`, and guarded by a drift test. Internal composition types of one app (for example `Deps`/`AppEnv` of the gateway) may stay in that app.

## How the rules are enforced

| Rule | Mechanism | Where |
|---|---|---|
| Import boundaries (no message JSON outside `i18n/`, no `database.ts` outside `db.ts`, no `tokens.css` outside `globals.css`, `three` only in `glyph-scene`, `supabase-js` only in `lib/supabase/` and `adapters/`, routes never import adapters, no non-literal `import()`) | `no-restricted-imports` + `no-restricted-syntax`, and `eslint-comments` forbids disabling them | `packages/config/eslint.config.mjs`, `packages/config/test/eslint-boundaries.test.ts` |
| Import order, duplicates, cycles | `eslint-plugin-import-x` (`order`, `no-duplicates`, `no-cycle` depth 4) | same |
| No copy in components | `react/jsx-no-literals` on `apps/web/**/*.tsx` | same |
| Styles consume only tokens; no `px` outside the allowed properties; no named colors; no `!important`; no `border` shorthand | stylelint `declaration-property-value-disallowed-list`, `unit-disallowed-list`... | `packages/config/stylelint.config.mjs`, `packages/config/test/stylelint.test.ts` |
| Tokens are generated, never edited | `pnpm tokens:build` + drift test + required-token list | `packages/design-tokens/test/*.test.ts` |
| Duplicated code | `jscpd` (30 lines / 120 tokens, threshold 0) in the `lint` job | `.github/workflows/ci.yml` |
| Shared types in one place; zod at boundaries | barrel test, `strict` + `noUncheckedIndexedAccess`, reviewer checklist | `packages/types/test/barrel.test.ts`, `pnpm typecheck` |
| Typed message keys | next-intl `AppConfig` + type tests | `apps/web/global.d.ts`, `apps/web/tests/i18n-keys.test-d.ts` |
| Validated environment | zod schemas for `NEXT_PUBLIC_*` and server secrets; build fails on a missing variable | `packages/types/src/schemas/env.ts`, `apps/web/lib/env.ts`, `apps/api/src/config/env.ts` |
| Routes and redirects behave on workerd | URL matrix E2E against the OpenNext preview, security-header E2E | `apps/web/e2e/*.spec.ts` |
| Accessibility is a requirement, not a review | `vitest-axe` in component tests, `@axe-core/playwright` blocking in E2E | `apps/web/tests`, `apps/web/e2e` |
| Database access | RLS tests with three accounts against local Supabase; `database.ts` drift test (*planned, phase 1b*) | `supabase/`, `packages/types/test/database-drift.test.ts` |
| Production gates | migrations and deploys only with an explicit OK in the session; the gateway's wrangler config has a test on its environments | `apps/api/test/wrangler-config.test.ts`, plan tasks marked GATE |

## Key decisions

Short list; each links to the Spanish document where it was taken.

| Decision | Why | Source |
|---|---|---|
| Next 16 App Router on Cloudflare Workers via OpenNext, no Node middleware | One account, one edge, Workers Free; i18n by rewrites and guards in layouts | [spec §5](superpowers/specs/2026-09-13-josecoded-plataforma.md), [DT §1.3–1.4](superpowers/design/2026-09-17-josecoded-diseno-tecnico.md) |
| Keep the legacy gateway, worker and Supabase schema; only additive changes | They work in production; the rewrite is the site, not the platform | [spec §3, §7](superpowers/specs/2026-09-13-josecoded-plataforma.md), plan "Restricciones globales" |
| Ports and adapters with `buildDeps(env)` for new gateway modules only | Services testable with fakes; SDKs confined to adapters; legacy stays frozen | [working-agreements §17.1](working-agreements.md) |
| CSS Modules + generated tokens; no Tailwind, shadcn or GSAP by default | A design system with a single source (`design.json`) and lint-checkable styles | [working-agreements §1–§3](working-agreements.md), spec D27 |
| `@josecoded/types` as the only home of shared types; zod at boundaries | No duplicated contracts between web and gateway; inferred types | [working-agreements §14](working-agreements.md) |
| One component per concept with `data-*` variants, polymorphism by `href` | SOLID applied to UI without CVA/clsx/Slot | [working-agreements §15](working-agreements.md) |
| Client state without a library; Server Actions + `Form`/`Field` | URL/RSC already hold the state; forms work without JS | [working-agreements §17.2–17.3](working-agreements.md) |
| Baseline 2024 with `@supports` fallbacks | Native scroll-driven motion and View Transitions where available | [working-agreements §6](working-agreements.md), spec D28 |
| Single freelance identity; `/servicios` with four ways to hire, `/partners` for agencies, case-based anonymous chat, own CRM in `/admin` | Repositioning of 2026-10-28 | [spec §0 (D36–D47)](superpowers/specs/2026-09-13-josecoded-plataforma.md) |
| Radar (job hunting) as a CRM module after launch; newsletter postponed | Launch = public site + client area + CRM | [spec §0.9, D43–D46](superpowers/specs/2026-09-13-josecoded-plataforma.md) |
| One cron, a dispatcher table and a subrequest budget | Workers Free allows five crons per account | [DT §0b](superpowers/design/2026-09-17-josecoded-diseno-tecnico.md), plan 1.7 |

## Where to look first

1. `docs/working-agreements.md` — the normative conventions (Spanish). Sections 1, 14, 15, 17 explain most of what you see in the code.
2. `packages/config/eslint.config.mjs` and `stylelint.config.mjs` — the rules as code, with their tests next to them.
3. `packages/types/src/` — the contracts: one file per domain, `schemas/` for zod.
4. `apps/web/i18n/` and `apps/web/app/[locale]/` — how routing works without middleware.
5. `apps/api/src/index.ts`, `deps.ts`, `middlewares/with-deps.ts` — the gateway's composition root (branch `chore/supabase` until phase 1b merges).
6. `packages/design-tokens/` and `.impeccable/design.json` — where the visual system comes from.
7. `docs/superpowers/plans/2026-09-19-josecoded-v1.md` — the plan, with branches, gates and what is still *planned*.

Documents (Spanish): [spec](superpowers/specs/2026-09-13-josecoded-plataforma.md) · [technical design](superpowers/design/2026-09-17-josecoded-diseno-tecnico.md) · [screens and content](superpowers/design/2026-09-29-pantallas-y-contenidos.md) · [home components](superpowers/design/2026-09-29-componentes-home-v6.md) · [plan](superpowers/plans/2026-09-19-josecoded-v1.md) · [working agreements](working-agreements.md).
