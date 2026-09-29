perfil: web
vault: Proyectos/josecoded.md
canvas_padre: "Plataforma web personal"

# josecoded

Brief (qué y por qué): nota del vault `Proyectos/josecoded.md`. Estado volátil: `ESTADO.md`. Este fichero es el cómo.

## Stack
- Frontend: Next 16 App Router en Cloudflare Workers vía OpenNext, sin middleware Node; monorepo pnpm + turbo (`apps/web`, `apps/api`, `packages/*`). Detalle en la spec (`docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` §5) y el diseño técnico (`docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` §1). Se rehace desde cero: estilos, objetivos y UI/UX nuevos.
- **Se conserva, no se reescribe:**
  - `josecoded-api` (Cloudflare Worker, gateway): rutas `v1`, `v1-protected`, `forum`, `admin-chat`, `health`, `system`. Código en `~/Documents/GitHub/josedev/josecoded-api/` (referencia; se decidirá si se mueve a este repo o queda donde está).
  - `josecoded-worker` (backend Fastify en el servidor casero "Omen", `https://worker.josecoded.com`): módulos `ai`, `n8n`, `storage`, `system`, `health`. Repo `~/Documents/GitHub/josecoded-worker`.
  - Supabase (Postgres + Auth) del sistema joseCoded.
  - Dominio `https://josecoded.com` y cuenta Cloudflare.
- Variables de entorno heredadas: `NEXT_PUBLIC_JOSECODED_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Referencia de lo anterior: repo `josedev` (`~/Documents/GitHub/josedev`, indexado en codebase-memory como `Users-jose-Documents-GitHub-josedev`, con ADR). No se evoluciona; se consulta.

## Comandos
- Instalar: `pnpm install` · Dev: `pnpm dev` · Test: `pnpm test` · Lint+types: `pnpm lint && pnpm typecheck` · Build: `pnpm build`.
(Ajustar si el proyecto usa otros.)

## Reglas del proyecto
- Agentes: `implementador-web` implementa; `revisor` revisa cada tarea; `/puerta-calidad` antes de merge.
- Aplicar `vercel-react-best-practices` y `web-design-guidelines`.
- Supabase: `list_tables` antes de tocar esquema; migraciones a producción solo con OK del controlador.
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

## Estado durable
- ADR de codebase-memory (proyecto indexado tras el primer commit con código).
- Checkpoints de gstack en `~/.gstack/projects/` (carpeta con el nombre del repo) si se usa `/ship`.
- Grafo de código en `graphify-out/` (hook post-commit de graphify, ignorado por git): `graphify query "..."` para estructura. Lo transversal (decisiones, otros proyectos) está en el cerebro: `/cerebro <pregunta>`.
