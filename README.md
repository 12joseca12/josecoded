# josecoded

Personal platform of a freelance full-stack developer: public site (services, projects, technical blog, lab, case-based AI chat), client area and a private CRM. One pnpm + turbo monorepo: a Next.js 16 app on Cloudflare Workers, a Hono gateway on Workers, and shared packages for types, pricing, design tokens and tooling.

Architecture, layers and the rules the lint enforces: [`docs/architecture.md`](docs/architecture.md). Conventions (normative, Spanish): [`docs/working-agreements.md`](docs/working-agreements.md). Volatile state: `ESTADO.md`. How Claude agents work here: `CLAUDE.md`.

## Stack

- **Web**: Next.js 16 App Router, React 19, TypeScript strict, deployed to Cloudflare Workers through OpenNext (no Node middleware). i18n es/en with next-intl via rewrites; CSS Modules consuming only design tokens; native CSS motion plus small TypeScript modules.
- **Gateway**: Hono on Cloudflare Workers, ports and adapters (`buildDeps(env)`), one cron dispatcher, Workers AI, Turnstile, KV.
- **Data**: Supabase (Postgres + Auth, RLS), additive migrations only. A Fastify backend on a home server is reached only through a Cloudflare Tunnel from the gateway.
- **Quality**: ESLint import boundaries, stylelint token rules, jscpd, zod at every boundary, Vitest (+ axe), Playwright (+ axe) against the local OpenNext preview, Lighthouse CI.

## Requirements

- Node 22 (`.nvmrc`; Node 26 also works locally).
- pnpm 11.2.2 (`packageManager`). **Always pnpm, never `npm` or `npx`** (use `pnpm dlx`).

## Commands

| Command                                                              | What it does                                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                                       | Installs the whole workspace                                                                                                 |
| `pnpm dev`                                                           | `turbo run dev` (apps with a dev server)                                                                                     |
| `pnpm lint`                                                          | ESLint + stylelint per package (`@josecoded/config`)                                                                         |
| `pnpm typecheck`                                                     | `tsc --noEmit` per package (`strict` + `noUncheckedIndexedAccess`)                                                           |
| `pnpm test`                                                          | Vitest per package                                                                                                           |
| `pnpm build`                                                         | `turbo run build`                                                                                                            |
| `pnpm e2e`                                                           | Playwright against the local preview (`wrangler dev --local`); builds first. `PW_CHANNEL=chrome` uses the system Chrome      |
| `pnpm tokens:build`                                                  | `design.json` -> `tokens.css` (skeleton; task 1.10)                                                                          |
| `pnpm visual`                                                        | Screenshot diff app vs prototype (skeleton; task 2.13)                                                                       |
| `pnpm i18n:check`                                                    | Missing keys and `{{DATO}}` placeholders (skeleton; task 2.1)                                                                 |
| `pnpm pricing:sync`, `pnpm pricing:sync-db`                          | Prices from `Comercial/tarifas.md` (task 1.4)                                                                                |
| `pnpm hero:media`, `pnpm hero:media:check`, `pnpm check:hero-bundle` | Hero media and bundle budget (phase 2)                                                                                       |
| `pnpm lhci`                                                          | Lighthouse CI (task 2.9)                                                                                                     |

Per package: `pnpm --filter <name> test -- <pattern>`.

## Structure

```
apps/web/          Next 16 + OpenNext: app/ (routes) -> components/ -> lib/; messages/{es,en}; styles/tokens.css (generated)
apps/api/          Hono gateway: index.ts -> modules/*.routes.ts -> services -> ports (@josecoded/types) <- adapters/
packages/config/   shared eslint (boundaries), stylelint (tokens only), tsconfig, prettier, with tests
packages/types/    @josecoded/types: one file per domain, zod schemas, generated database.ts
packages/pricing/  pricing.json, price rules, affiliates, DB sync
packages/design-tokens/  .impeccable/design.json -> apps/web/styles/tokens.css|ts, drift test
supabase/          migrations (the only source of the schema), seed, migration tests, test/pg harness; RLS tests in apps/web
docs/              architecture, working agreements, specs, technical design, plans, prototypes
```

The full map, including what is still planned, is in [`docs/architecture.md`](docs/architecture.md#monorepo-map).

## CI

`.github/workflows/ci.yml` runs lint, jscpd, typecheck, test, build and e2e on every push and PR. `preview.yml` and `deploy-production.yml` stay disabled until CI has Cloudflare credentials; when enabled they use `opennextjs-cloudflare upload` / `deploy`, never a bare `wrangler versions upload`.

## Contributing

Branch per change, PR, squash merge; `main` is never pushed to directly. Conventional Commits in English. Any dependency outside the plan needs a written justification and a native alternative considered. See [`docs/working-agreements.md`](docs/working-agreements.md) §9 and §11.
