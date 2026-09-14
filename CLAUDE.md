perfil: web
vault: Proyectos/josecoded.md
canvas_padre: "Plataforma web personal"

# josecoded

Brief (qué y por qué): nota del vault `Proyectos/josecoded.md`. Estado volátil: `ESTADO.md`. Este fichero es el cómo.

## Stack
- Frontend: por decidir en la spec inicial (docs/superpowers/specs/). Se rehace desde cero: estilos, objetivos y UI/UX nuevos.
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

## Estado durable
- ADR de codebase-memory (proyecto indexado tras el primer commit con código).
- Checkpoints de gstack en `~/.gstack/projects/` (carpeta con el nombre del repo) si se usa `/ship`.
- Grafo de código en `graphify-out/` (hook post-commit de graphify, ignorado por git): `graphify query "..."` para estructura. Lo transversal (decisiones, otros proyectos) está en el cerebro: `/cerebro <pregunta>`.
