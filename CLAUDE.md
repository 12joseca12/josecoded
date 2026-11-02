perfil: web
vault: Proyectos/josecoded.md
canvas_padre: "Plataforma web personal"

# josecoded

> **Reinicio 2026-11-02.** El repositorio se vació por decisión de Jose para empezar con una metodología nueva. Lo que sigue en este fichero describe el proyecto anterior (v1, en la rama `archivo/v1-2026-11-02`) y se reescribirá cuando la metodología nueva esté decidida. Hoy solo existen `archivo/`, `.claude/` y este fichero; ver `README.md` y `ESTADO.md`.

Brief (qué y por qué): nota del vault `Proyectos/josecoded.md`. Estado volátil: `ESTADO.md`. Este fichero es el cómo.

## Stack
- Frontend: Next 16 App Router en Cloudflare Workers vía OpenNext, sin middleware Node; monorepo pnpm + turbo (`apps/web`, `apps/api`, `packages/*`). Detalle en la spec (`docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` §5) y el diseño técnico (`docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` §1). Se rehace desde cero: estilos, objetivos y UI/UX nuevos.
- **Se conserva, no se reescribe:**
  - `josecoded-api` (Cloudflare Worker, gateway), ya movido a `apps/api` (rama `chore/supabase`): rutas `health`, `system`, `v1/health`, `v1-protected` (`auth/me`, `system/status`). **`forum/*` y `admin-chat/*` retirados** en la tarea 1.8c (sus tablas ya no existen; Jose lo confirmó, DATOS Q1). Referencia histórica en `~/Documents/GitHub/josedev/josecoded-api/`.
  - `josecoded-worker` (backend Fastify en el servidor casero "Omen", `https://worker.josecoded.com`): módulos `ai`, `n8n`, `storage`, `system`, `health`. Repo `~/Documents/GitHub/josecoded-worker`. No usa Supabase.
  - Dominio `https://josecoded.com` y cuenta Cloudflare.
- **Supabase: proyecto nuevo, esquema desde cero (D49, 2026-10-28).** Ref `echlwywbucgbhwpncviy` (`josecoded`, eu-west-1, Postgres 17) en la cuenta nueva de Jose. El heredado `nrgrmymsjtgayzejtawa` está abandonado (sin acceso) y **nada se migra**. `supabase/migrations/` es la única fuente del esquema (sin baseline); diseño normativo en `docs/superpowers/design/2026-10-28-datos-v2.md` (**DATOS**): `private` para helpers/contadores/jobs/outbox, `anon` sin grants salvo `blog_comments` aprobados, RPC `security definer` con `search_path = ''` y grants explícitos, notificaciones por `private.outbox` que drena el gateway (sin `pg_net` ni Edge Function), `get_advisors` a cero como criterio. Local: `supabase start && supabase db reset`; producción solo en gates con OK de Jose (`supabase db push`, nunca `db reset`).
- Variables de entorno: `NEXT_PUBLIC_JOSECODED_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (valores del proyecto nuevo desde el gate 1.9).
- Referencia de lo anterior: repo `josedev` (`~/Documents/GitHub/josedev`, indexado en codebase-memory como `Users-jose-Documents-GitHub-josedev`, con ADR). No se evoluciona; se consulta.

## Comandos
- Instalar: `pnpm install` · Dev: `pnpm dev` · Test: `pnpm test` · Lint (eslint + stylelint): `pnpm lint` · Types: `pnpm typecheck` · Build: `pnpm build` · E2E: `pnpm e2e`.
- Más scripts raíz (todos `turbo run`, se rellenan en sus tareas): `tokens:build`, `visual`, `i18n:check`, `pricing:sync-db`, `pricing:pull`, `hero:media`, `hero:media:check`, `check:hero-bundle`, `lhci`. Por paquete: `pnpm --filter <nombre> test -- <patrón>`. Detalle en `README.md`.

## Reglas del proyecto
- Agentes: `implementador-web` implementa; `revisor` revisa cada tarea; `/puerta-calidad` antes de merge.
- Aplicar `vercel-react-best-practices` y `web-design-guidelines`.
- Supabase: `supabase start && supabase db reset` + `rls.test.ts` en local antes de proponer esquema; producción solo en gates con OK de Jose (`supabase db push`, `get_advisors` antes y después, nunca `db reset` ni seed contra producción).
- Persona objetivo (para `usuario-ejemplo`): definir en la spec de la primera feature.

## Reglas de trabajo (resumen; el documento normativo es `docs/working-agreements.md`)
1. CSS Modules por componente que consumen solo `var(--token)`; sin Tailwind ni shadcn. Lo vigila stylelint.
2. `.impeccable/design.json` genera `apps/web/styles/tokens.css` (`pnpm tokens:build`) con test de deriva; el CSS generado no se edita.
3. Motion en CSS nativo (`scroll-snap`, `animation-timeline`, View Transitions); JS propio mínimo en TypeScript; GSAP solo con justificación aceptada por `revisor`.
4. Navegadores: Baseline 2024; `animation-timeline`, View Transitions y `backdrop-filter` bajo `@supports` con los fallbacks de working-agreements §6, que `qa` comprueba en Safari.
5. Prototipo `docs/superpowers/design/ref/home-v6/` 1:1 (estructura y valores, ya como tokens); React solo compone. Todo desvío se marca `deviation:` en el commit y lo decide Jose en el navegador.
6. Cada tarea con UI adjunta capturas app/prototipo a 360, 900 y 1440 comparadas por diff; `ui` revisa; Jose aprueba en la preview antes del merge.
7. TDD solo en lo que tiene comportamiento; los componentes sin lógica no llevan unit test (E2E, capturas y accesibilidad los cubren).
8. Unidades relativas para todo lo que escala con el texto, breakpoints en `rem`; `px` solo en hairlines, trazos, sombras, desenfoques y offsets de motion.
9. PR por rama, squash merge, `main` protegida (la configura Jose en GitHub); nunca push a `main`.
10. Textos solo en `messages/{es,en}.json` (ningún literal en componentes; `i18n:check` lista `{{DATO}}` y claves faltantes). **pnpm siempre, nunca npm/npx.** Dependencias solo las del plan; una extra, con justificación de peso y alternativa nativa, la decide `revisor`.
11. Tipos compartidos solo en `@josecoded/types` (un fichero por dominio, barrel único); zod es la fuente en las fronteras y los tipos se infieren; `database.ts` (Supabase), claves de `messages` y nombres de token tipados y generados (working-agreements §14).
12. Un componente por concepto con variantes (`variant`/`size`/`tone` como uniones volcadas a `data-*`, sin CVA ni clsx); polimorfismo por `href`; se parte solo si cambia rol, elemento raíz o slots; catálogo `/dev/ui` fuera de producción; `jscpd` en CI (§15).
13. Accesibilidad por componente: contrato a11y en cada tarea, helpers únicos en `lib/a11y/`, axe bloqueante en Vitest y E2E. Gateway nuevo con puertos y adaptadores (`buildDeps(env)`), estado en cliente sin librería (`ShellProvider`), formularios con Server Actions + `Form`/`Field` (§16, §17).

## Estado durable
- ADR de codebase-memory (proyecto indexado tras el primer commit con código).
- Checkpoints de gstack en `~/.gstack/projects/` (carpeta con el nombre del repo) si se usa `/ship`.
- Grafo de código en `graphify-out/` (hook post-commit de graphify, ignorado por git): `graphify query "..."` para estructura. Lo transversal (decisiones, otros proyectos) está en el cerebro: `/cerebro <pregunta>`.
