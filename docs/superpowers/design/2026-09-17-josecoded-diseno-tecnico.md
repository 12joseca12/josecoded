# joseCoded — diseño técnico (previo a implementación)

**Fecha:** 2026-09-17 · **Perfil:** web · **Base:** spec v1.2 (`docs/superpowers/specs/2026-09-13-josecoded-plataforma.md`), `Comercial/tarifas.md` v2 (vigencia 2026-09-14), código real de `josedev/josecoded-api` y `josecoded-worker`, migraciones de `josedev/supabase/migrations` (28 ficheros, hasta `20260720120000`).
**Estado:** v1.1 (2026-09-17, tarde): esquema, RLS, triggers, Edge Function y advisors **verificados contra producción** (`nrgrmymsjtgayzejtawa`, `ACTIVE_HEALTHY`) en solo lectura; decisiones P1–P6 de Jose incorporadas (spec v1.3); §1, §2 y §3 alineados con la UX v2 (`docs/superpowers/design/2026-09-17-josecoded-ux.md`: shell IDE-lite, hero de presentación, sin decoración generativa). No se ha implementado ni aplicado nada. Versiones comprobadas en npm el 2026-09-17.

> Este documento cubre stack, funcionalidades, integraciones, datos, restricciones, tests, variables y riesgos. Pantallas, componentes, subpantallas y páginas de error van en el documento de `ux`/`ui` (`docs/superpowers/design/`), que se consolida con este antes del plan.

---

## 0. Hallazgos que corrigen la spec (leer primero)

**Verificado 2026-09-17 contra producción** con `list_tables`, `list_migrations`, `list_edge_functions`, `get_edge_function`, `get_advisors` y `SELECT` sobre `pg_policies`, `pg_proc`, `pg_trigger`, `pg_publication_tables`, `storage.buckets`, `vault.secrets` (solo nombres) y las tablas de catálogo. Al contrastar la spec con el código y la base de datos real han aparecido ocho discrepancias. El resto del documento asume las correcciones.

| # | La spec dice | La realidad | Corrección adoptada |
|---|---|---|---|
| H1 | Admin = fila en `admin_superusers` | **Verificado:** `admin_superusers` no existe en producción (comentario de la tabla `staff_members`: "reemplaza admin_superusers"). El rol vive en `staff_members.role in ('admin','closer')`; las 47 políticas RLS usan `private.staff_role_of((select auth.uid())) = 'admin'`. Hay **una fila**: Jose, `role='admin'`, con `telegram_chat_id` cargado. `auth.users` tiene 1 usuario. El gateway (`admin-chat.pg-store.ts:146-158`) comprueba lo mismo | Admin = `staff_members.role = 'admin'`. No se crea ninguna tabla nueva de admins. Los guards de `/admin` leen la propia fila de `staff_members` (política `staff read staff_members`, verificada). La UX v2 (§2.3, §7, §8.4) aún dice `admin_superusers`: corregir en el doc de `ux` |
| H2 | `leads.status`, `leads.source`; "política de insert anónimo acotada" | **Verificado:** `leads` tiene exactamente `id, conversation_id, assigned_staff_id, estado, fuente, monto, notas, created_at, updated_at, pack_template_id, is_upsell`. Solo dos políticas (`staff read leads`, `staff claim or update own leads`); **ninguna de INSERT ni DELETE** (los grants de tabla existen para `anon`/`authenticated` por defecto, pero RLS bloquea). Seis triggers heredados verificados (`trg_auto_assign_new_lead`, `trg_log_lead_assignment_insert/update`, `trg_leads_financial_integrity`, `trg_zz_client_on_lead_close`, `trg_extra_on_upsell_lost`) | Los leads públicos se crean **solo desde el gateway con service role** (`POST /api/v1/leads`). El lead manual del admin (UX §9.3) usa una política aditiva `admin insert leads`. No se añade insert anónimo. Columnas aditivas de contacto (§6). `fuente` se reutiliza con valores acotados; la UX usa `source=proposal\|contact`: se mapea a `fuente='web_proposal'\|'web_form'` |
| H3 | `notify/lead` → n8n → Telegram; "si falla, email vía Edge Function `notify`" | **Verificado (v4 desplegada, `verify_jwt=false`):** la Edge Function `notify` envía Telegram directo (Bot API a `staff_members.telegram_chat_id` de los admins) y email vía Resend (`from: josedev <no-reply@josedev.com>`, a rebrandear). Eventos cerrados: `comment.client`, `sale.closed`, `comment.admin`, `asset.uploaded.client`, `asset.uploaded.admin`. Secreto `x-notify-secret` solo se exige si `NOTIFY_SHARED_SECRET` está en su env; `vault.secrets` contiene `notify_shared_secret`. Solo la llama `private.notify_event()` por `pg_net` | **Decisión de Jose (P3):** la Edge Function `notify` con evento aditivo `lead.created` es la **vía primaria** (no depende de Omen); n8n `lead-created` queda opcional para automatizaciones futuras. Al añadir el evento se cambia `EMAIL_FROM` a `josecoded <no-reply@josecoded.com>` (requiere dominio verificado en Resend) |
| H4 | `pack_templates` y `pack_extras` "se alinean con `pricing.json`" | **Verificado:** `pack_templates` = `landing\|Landing\|null\|1; gestion-logica\|+ Gestión y lógica\|null\|2; crm-cms\|+ CRM / CMS\|null\|3; automatizaciones\|+ Automatizaciones e integraciones\|null\|4` (sin `precio_base`); `pack_extras` vacía; ambas legibles solo por `authenticated` | Columna aditiva `code` en ambas; `pnpm pricing:sync-db` rellena por `code` (mapeo por `orden` 1..4 ↔ P1..P4 en la primera ejecución). La web pública lee `pricing.json` |
| H5 | Supabase activo | Estaba `INACTIVE` el 2026-09-17 por la mañana; **restaurado por el controlador con OK de Jose**; ahora `ACTIVE_HEALTHY` | Ping semanal obligatorio (§1.8, §10) |
| H6 | "`supabase/migrations`: 28 heredadas (copiadas, intactas) + nuevas" | **Verificado:** el historial remoto (`supabase_migrations.schema_migrations`) tiene **47 versiones** con ids y nombres distintos de los 28 ficheros de `josedev` (se aplicaron por MCP en pasos más pequeños: `20260512231618_blog_posts_schema` … `20260719225847_p3_notify_shared_secret`). Copiar los 28 ficheros y hacer `supabase db push` fallaría por historial divergente | El monorepo **no** copia las migraciones heredadas. Lleva `supabase/schema/baseline.sql` (dump de solo lectura de `public`, `private`, `storage` y `vault` sin datos, generado con `supabase db dump --linked`) para `supabase start` local y CI, y solo las migraciones nuevas en `supabase/migrations/`. En producción las nuevas se aplican **una a una con `apply_migration` del MCP** (el controlador, con OK de Jose), nunca con `db push`. Ver §6.2 |
| H7 | Admin crea leads a mano (UX §9.3) | No hay política de INSERT en `leads` para nadie | Política aditiva `admin insert leads` (solo `staff_role_of = 'admin'`) en la migración `20260917100000` |
| H8 | "Precio desde X € = pack + extras" (borrador v1.0 de este doc, §3.2) | UX §4.4: "El *desde* nunca suma extras"; los extras se muestran aparte como "Opcional · no incluido" | `priceFrom` = precio del pack. Extras recomendados con su precio individual, fuera del "desde" |

Otros datos comprobados que condicionan decisiones: el gateway verifica el JWT con una llamada a GoTrue por petición (`supabase.service.ts:50-72`), no con JWKS; el binding `AI_RATE_LIMITER` (20/60 s) está declarado y **sin uso**; el worker de Omen no reintenta, no tiene tests ni CI, y su unidad systemd conserva `Requires=docker.service` (Docker ya no se usa); `CORS_ORIGINS` del gateway es lista exacta (`http://localhost:3000,https://josecoded.com`), sin patrones para previews. Extensiones instaladas: `pgcrypto 1.3`, `pg_net 0.20.0` (en `public`, advisor), `supabase_vault 0.3.1`, `moddatetime 1.0`, `uuid-ossp`, `pg_stat_statements`. Realtime: solo `public.admin_chat_messages`. Bucket: `client-assets` (privado, 25 MiB). Sin vistas en `public`.

---

## 1. Stack y estructura del monorepo

### 1.1 Árbol

```
josecoded/
├─ package.json                 # scripts raíz: lint, typecheck, test, build, e2e, lhci, pricing:*
├─ pnpm-workspace.yaml          # packages: apps/*, packages/*
├─ turbo.json                   # pipeline lint/typecheck/test/build con caché
├─ .nvmrc                       # 22
├─ .github/workflows/           # ci.yml, preview.yml, deploy-production.yml, supabase-ping.yml
├─ apps/
│  ├─ web/                      # Next.js 16 App Router → Cloudflare Workers vía OpenNext
│  │  ├─ app/[locale]/...       # rutas públicas y privadas (ver §2)
│  │  ├─ app/api/...            # route handlers (webhooks, auth callback, feeds)
│  │  ├─ content/               # blog MDX, proyectos, servicios, FAQ (versionado)
│  │  ├─ messages/{es,en}.json  # next-intl
│  │  ├─ public/                # fuentes, og generadas, iconos
│  │  ├─ scripts/               # build-time: github.ts, stores.ts, og.ts, llms.ts, images.ts
│  │  ├─ e2e/                   # Playwright
│  │  ├─ open-next.config.ts · wrangler.jsonc · next.config.ts · lighthouserc.json
│  └─ api/                      # josecoded-api movido tal cual (Hono, Cloudflare Worker)
│     ├─ src/ (existente) + src/modules/{proposals,leads,notify}.routes.ts (nuevos)
│     ├─ wrangler.jsonc         # + bindings nuevos aditivos
│     └─ vitest.config.ts       # @cloudflare/vitest-pool-workers
├─ packages/
│  ├─ pricing/                  # pricing.json + reglas + tipos + script de sync
│  │  ├─ pricing.json
│  │  ├─ src/{index,schema,upgrade,affiliate,proposal-price}.ts
│  │  └─ scripts/{sync-from-tarifas.ts, sync-db.ts}
│  └─ config/                   # eslint, tsconfig, prettier compartidos
└─ supabase/
   ├─ schema/baseline.sql       # dump de solo lectura del esquema heredado (public, private, storage, vault; sin datos). H6
   ├─ migrations/               # SOLO nuevas: 20260917*.sql (§6.2)
   ├─ functions/notify/         # Edge Function heredada (copiada de producción, v4) + evento lead.created (aditivo)
   ├─ seed/seed.sql             # usuarios y datos de prueba para tests RLS (solo local)
   └─ config.toml               # [functions.notify] verify_jwt = false; auth.email otp habilitado
```

`apps/api` se mueve con `git mv` desde `josedev/josecoded-api` conservando historial (`git subtree`/`filter-repo` no hace falta: josedev queda congelado como referencia). El worker de Omen **no** entra en el monorepo (repo propio `josecoded-worker`, sin cambios).

### 1.2 Versiones (comprobadas en npm 2026-09-17)

| Ámbito | Paquete | Versión | Nota |
|---|---|---|---|
| Gestor | `pnpm` (`packageManager`) | 11.2.2 | La instalada en el Mac de Jose. Corepack la fija en CI |
| Node | `.nvmrc` | 22 | Mínimo del worker de Omen (`engines >=22`); OpenNext y Wrangler lo soportan. En local corre Node 26 sin problema |
| Monorepo | `turbo` | 2.10.13 | Caché local y remoto opcional; `pnpm build` en raíz ejecuta todo |
| Web | `next` | 16.3.5 | Soportado por OpenNext (`>=16.3.3`) |
| | `react` / `react-dom` | 19.3.0 | |
| | `@opennextjs/cloudflare` | 1.20.6 | Peer: `next >=16.3.3`, `wrangler ^4.125` |
| | `wrangler` | 4.133.0 | Mismo en `apps/api` (hoy `^4.87`, se sube; aditivo) |
| | `tailwindcss` + `@tailwindcss/postcss` | 4.3.3 | |
| | `shadcn` (CLI) | 4.21.0 | Componentes copiados al repo y re-tematizados por `ui` |
| | `gsap` + `@gsap/react` | 3.15.0 / 2.1.2 | Plugins usados (todos gratuitos desde gsap 3.13): `ScrollTrigger` (`FocusLight`), `Flip` (minimización del hero), `ScrambleTextPlugin` (estado `compiling`). Sin Observer ni SplitText |
| | `lenis` | 1.3.26 | Smooth scroll **sobre el panel central** (`wrapper`/`content` de Lenis), no sobre `window`: en escritorio solo ese contenedor hace scroll (UX §12). Sincronizado con `ScrollTrigger.update` vía `gsap.ticker` |
| | `next-intl` | 4.14.5 | Peer `next ^16`. Sin `proxy.ts` (ver 1.4) |
| | `@next/mdx` + `@mdx-js/loader` + `@mdx-js/react` | 16.3.5 / 3.1.x | Compilación en build; ver decisión 1.5 |
| | `rehype-pretty-code` + `shiki` | 0.14.5 / 4.4.3 | Código en el blog, en build |
| | `@supabase/ssr` + `@supabase/supabase-js` | 0.12.7 / 2.116.0 | Peer `supabase-js ^2.114` |
| | `@marsidev/react-turnstile` | 1.6.1 | Widget Turnstile |
| | `@calcom/embed-react` | 1.5.3 | Reserva 20 min (vía Empresas) |
| | ~~`ogl`~~ | — | **Eliminado** (UX v2: sin decoración generativa; ver 1.6) |
| | `lucide-react` | 1.47.0 | Iconos de UI (no de fichero: UX §3.1); los "jc" propios se dibujan como SVG en el repo |
| | `zod` | 4.6.5 | Validación de env, formularios, frontmatter y `pricing.json` |
| API | `hono` | 4.13.8 | Hoy 4.12.16; subida menor |
| | `zod` | 4.6.5 | Hoy 4.4.2 |
| | `@supabase/supabase-js` | 2.116.0 | Hoy 2.105.4 |
| | `@cloudflare/workers-types` | 5.20260917.1 | |
| Pricing | `zod` | 4.6.5 | Esquema de `pricing.json` |
| Tests | `vitest` | **4.1.11** | No 5.x: `@cloudflare/vitest-pool-workers` 0.22.0 exige `vitest ^4.1` |
| | `@cloudflare/vitest-pool-workers` | 0.22.0 | Gateway en workerd real |
| | `@playwright/test` | 1.63.0 | |
| | `@lhci/cli` | 0.15.1 | |
| | `@testing-library/react` + `happy-dom` | 16.3.3 / 20.14.5 | Componentes |
| Calidad | `typescript` | **5.9.3** | No 7.x (port nativo, tooling aún desigual); `apps/api` baja de `^6.0.3` a 5.9.3 y se verifica con `typecheck` en la tarea 0 |
| | `eslint` + `eslint-config-next` + `typescript-eslint` | 10.10.0 / 16.3.5 / 8.70.0 | |
| | `prettier` | 3.9.7 | |
| Build scripts | `sharp` | 0.35.4 | Optimización de imágenes en build (no en el worker) |
| | `satori` + `@resvg/resvg-js` | última estable | OG images en build |
| | `gray-matter` | última estable | Frontmatter de MDX en scripts (sitemap, llms.txt) |
| Stores | `app-store-scraper` / `google-play-scraper` | 0.18.0 / 10.1.3 | Solo en scripts de build (ver §5) |

### 1.3 Despliegue: Cloudflare Workers vía OpenNext

- Dos Workers en la cuenta `d26022a34346cb759178a720bace386d`: `josecoded-web` (OpenNext) y `josecoded-api` (existente).
- Dominios: `josecoded.com` → `josecoded-web` (custom domain en `wrangler.jsonc`); `api.josecoded.com` → `josecoded-api` (custom domain nuevo, aditivo). `NEXT_PUBLIC_JOSECODED_API_URL=https://api.josecoded.com`.
- `apps/web/wrangler.jsonc` mínimo:

```jsonc
{
  "name": "josecoded-web",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-09-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "preview_urls": true,
  "observability": { "enabled": true },
  "routes": [{ "pattern": "josecoded.com", "custom_domain": true }]
}
```

- `open-next.config.ts`: sin caché incremental (`incrementalCache: "dummy"`), sin tag cache ni cola. **No hay ISR ni `revalidateTag`**: todo lo público es SSG en build; lo dinámico (comentarios, área privada, admin) se renderiza por petición. Esto evita R2 + D1 + Durable Objects y mantiene el worker pequeño. **Decisión de Jose (P1): la cuenta está en Workers Free → límite duro de 3 MiB comprimidos** para `josecoded-web`; la tarea 0 lo mide y, si no cabe, el fallback es Vercel (no pasar a Paid).
- Imágenes: `images.unoptimized = true` + script `scripts/images.ts` (sharp) que genera AVIF/WebP y anchos fijos en build. No hay fotos; solo capturas de proyectos y OG. Evita el optimizador en runtime (en Workers requiere Cloudflare Images, de pago).
- Previews: `wrangler versions upload` por PR → URL `https://<hash>-josecoded-web.<subdominio>.workers.dev` comentada en el PR. Producción: `wrangler deploy` solo desde `deploy-production.yml` con `workflow_dispatch` (gate: OK de Jose en sesión).

**Tarea 0 (validación real, antes de cualquier otra tarea):** hello world de `apps/web` desplegado en un Worker de preview con: (a) `app/[locale]` + rewrites de i18n sin `proxy.ts`; (b) un Server Action que escribe y lee cookies; (c) `@supabase/ssr` leyendo sesión en un layout server-side y redirigiendo; (d) un route handler `POST` con lectura de body raw (para HMAC); (e) una página MDX compilada con `@next/mdx`; (f) tamaño del worker comprimido. **Criterio de éxito:** a–e funcionan en la URL de preview y (f) < 2,5 MiB con `next`, `@supabase/ssr` y `@next/mdx` incluidos. **Fallback:** si falla a–e o el tamaño supera el límite del plan, se despliega en Vercel (`vercel.json` vacío, mismo código; `NEXT_PUBLIC_*` idénticas) y se registra la decisión en `ESTADO.md` y el ADR; el gateway sigue en Workers en ambos casos.

### 1.4 i18n sin middleware (decisión)

Next 16 renombra `middleware.ts` a `proxy.ts` y **lo ejecuta en runtime Node** (no configurable); OpenNext no soporta el middleware Node. La spec prohíbe middleware Node. Por tanto:

- Estructura `app/[locale]/…` con `generateStaticParams` → `[{locale:'es'},{locale:'en'}]` y `setRequestLocale(locale)` en cada layout/página (render estático).
- `next-intl` con `routing = defineRouting({ locales: ['es','en'], defaultLocale: 'es', localePrefix: 'as-needed', localeDetection: false })`; `i18n/request.ts` toma el locale de `next/root-params` (soportado en next-intl 4 con Next 16), no de cabeceras.
- `next.config.ts` `rewrites.beforeFiles`: `/` → `/es`, `/:path((?!en(?:/|$)|api|_next|.*\\..*).*)` → `/es/:path`; `redirects`: `/es/:path*` → `/:path*` (308) para una sola URL canónica. Los `alternates` (`hreflang`) y el `sitemap` los genera `generateMetadata`/`app/sitemap.ts` con `routing`.
- Sin detección automática por `Accept-Language` (era una función del middleware): el conmutador es/en es manual y persistente en `localStorage` (no en cookie: el servidor no lo necesita). Aceptable para SEO (Google prefiere no redirigir por idioma).
- Alternativas descartadas: `proxy.ts` (runtime Node, no soportado en OpenNext, prohibido por spec); `localePrefix: 'always'` (`/es/...` en todas las URLs; peor para el dominio principal en español).

### 1.5 MDX (decisión)

`@next/mdx` con `import()` dinámico por slug (`content/blog/{locale}/{slug}.mdx`) y `export const metadata` tipado con zod. Compila en build con Turbopack; **el worker no incluye el compilador de MDX**. Descartado `next-mdx-remote` (compila en runtime: +~400 KB gzip en el worker y coste por petición) y Notion/CMS (D8).

Plugins: `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code` (tema único oscuro). Índice del blog: `scripts/content-index.ts` genera `content/generated/blog-index.json` (slug, locale, title, description, date, tags, readingTime, hasTranslation) en `prebuild`; lo consumen listado, sitemap, RSS y `llms.txt`.

### 1.6 Motion y shell (alineado con UX v2 §3.6–3.7)

**Sin canvas, WebGL ni shaders.** La UX v2 prohíbe partículas, ondas, retículas, gradientes animados y parallax; `ogl` y el Canvas 2D salen del stack. Todo el motion es GSAP sobre DOM, con tres recursos y un flujo de entrada:

| Pieza | Implementación | Estado sin JS / reduced-motion |
|---|---|---|
| `HeroIntro` (§3.6 UX) | Máquina de estados `boot → compiling → typing → hold → minimizing → ready` en un componente cliente. `compiling`: `ScrambleTextPlugin` con `chars` fijo y `revealDelay` para converger de izquierda a derecha (determinista: `seed` derivado del nombre). `minimizing`: `Flip.fit` del `h1` al hueco de `TitleBar`. Tiempos: escritorio ≤ 3.300 ms, móvil ≤ 2.400 ms. Cualquier `pointerdown`, `keydown`, `wheel`, `touchstart` o `scroll` → `gsap.globalTimeline` a `ready` en ≤ 200 ms | El HTML se sirve en estado `ready` (SSG). Un `<script>` inline en `<head>` (≤ 300 bytes, sin dependencias) lee `localStorage.hero_seen` y, si no es la fecha de hoy, no estamos en `prefers-reduced-motion` y la ruta es `/` o `/en`, pone `data-hero="boot"` en `<html>` **antes del primer paint**; el CSS de `boot` oculta el contenido y muestra el hero a pantalla completa, así no hay parpadeo ni desajuste de hidratación (`suppressHydrationWarning` en `<html>`). Con GSAP bloqueado, un `setTimeout(400)` en el inline script devuelve `ready` |
| `hero_seen` | `localStorage.hero_seen = 'AAAA-MM-DD'` (zona del navegador), escrito al llegar a `ready` o al saltar. `try/catch`: sin `localStorage` se comporta como primera visita solo en `/` | Con reduced-motion se escribe igual y no hay animación |
| `CompileReveal` | Por bloque: `h2` con una línea monoespaciada `section: <título>` que se resuelve en ≤ 300 ms al entrar en viewport (`ScrollTrigger` `once: true`) | Desactivado: el `h2` se pinta directamente |
| `FocusLight` | Un solo elemento `aria-hidden` con `mix-blend-mode`/`radial-gradient` cuya posición sigue el bloque centrado (`ScrollTrigger` con `scrub`) y, en escritorio, la tarjeta bajo el puntero (`pointermove` con `gsap.quickTo`). Sin escalas ni inclinaciones | Fijo en el bloque activo |
| Transición de página | `ViewTransition` de React 19 en `app/[locale]/template.tsx`: salida 120 ms opacidad, entrada 160 ms `translateY(8px)`; pestaña activa sin animación | Sin transición |
| Lenis | `new Lenis({ wrapper: panelEl, content: panelInnerEl, autoRaf: false })` solo en escritorio (≥ 1024 px); `gsap.ticker.add(t => lenis.raf(t*1000))`; `lenis.on('scroll', ScrollTrigger.update)`; anclas con `lenis.scrollTo('#comentarios')`; en móvil Lenis no se instancia (UX §12: sin secuestro del scroll) | `prefers-reduced-motion` → no se instancia |

Reglas de rendimiento (las verifica `revisor` y Lighthouse CI): GSAP y sus plugins se cargan con `next/dynamic` tras el primer paint; `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` envuelve todo; `will-change` solo durante `minimizing`; el hero no bloquea LCP (el `h1` con el nombre final está en el HTML; el scramble solo cambia texto ya pintado).

Shell IDE-lite (UX §3): `AppShell` es un layout server (`app/[locale]/(public)/layout.tsx`) con `SiteTree` (RSC, árbol estático desde `content/generated/site-tree.json`; la rama Blog lista los 5 últimos del índice de MDX; la rama Proyectos las fichas), `TitleBar`, `StatusLine` y, en escritorio, `Tabs` (cliente: `sessionStorage.tabs`, máx. 6, cada pestaña es una ruta real; `Ctrl/Cmd+W` solo con foco en la pestaña). Estados de cliente y dónde viven: `localStorage.hero_seen`, `localStorage.tree_collapsed`, `localStorage.locale_pref` (conmutador es/en), `sessionStorage.tabs`, `sessionStorage.audience` (`negocio|empresa`, UX §4.10). Ninguno se lee en servidor; ninguna cookie nueva salvo `ref` (afiliados) y las de sesión de Supabase.

### 1.7 Auth y guards sin middleware

- `@supabase/ssr`: `createServerClient` en RSC/Server Actions/route handlers con `cookies()`; `createBrowserClient` en cliente. Sin `proxy.ts`, el refresco de tokens lo hace el cliente de navegador (escribe cookies) y los Server Actions (pueden escribir cookies); los RSC solo leen.
- OAuth: `app/api/auth/callback/route.ts` intercambia `code` por sesión y redirige a `next` (allowlist de rutas internas). Proveedores Google/GitHub/email configurados por Jose en Supabase (pendiente en `ESTADO.md`).
- Guards en layouts server-side: `app/[locale]/(private)/area-clientes/layout.tsx` (sesión obligatoria) y `app/[locale]/(private)/admin/layout.tsx` (sesión + `staff_members.role='admin'` leído con el cliente del usuario; RLS lo permite). Sin sesión → `redirect('/auth?next=…')`; sin rol → `notFound()` (404, no revela que existe).
- **Cada Server Action y route handler privado repite la comprobación** (Next lo exige: los layouts no protegen acciones). Helper único `requireAdmin()` / `requireUser()` en `apps/web/lib/auth/guards.ts`.

### 1.8 CI (GitHub Actions)

| Workflow | Disparador | Pasos |
|---|---|---|
| `ci.yml` | push, PR | `pnpm i --frozen-lockfile` → `turbo lint typecheck test` → `pnpm --filter web build` (OpenNext) → Playwright contra `wrangler dev` local → tests RLS contra `supabase start` (Docker) → Lighthouse CI contra `wrangler dev` |
| `preview.yml` | PR | `wrangler versions upload` de web y api (api solo si cambió) → comenta URLs; `CORS_ORIGINS` del gateway de preview incluye el sufijo `.workers.dev` (§3.6) |
| `deploy-production.yml` | `workflow_dispatch` (Jose) | `wrangler deploy` web y/o api; nunca migraciones |
| `content-refresh.yml` | cron diario 04:00 | Ejecuta `scripts/github.ts`, `scripts/stores.ts` y `scripts/perf.ts` (Lighthouse contra producción → `perf.json`); si cambia algo en `content/generated/*`, commit `chore(content): refresh generated data` + build + **`wrangler deploy` de la web** (**decisión de Jose, P4**: única excepción acotada al gate de producción; cualquier otro diff aborta el deploy) |
| `supabase-ping.yml` | cron semanal | `GET /rest/v1/` con publishable key; si falla, Telegram vía Edge Function `notify` (evento `system.ping_failed`, aditivo) |

Secretos de CI: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_ACCESS_TOKEN` (solo para `supabase start`, no toca producción), `GITHUB_TOKEN` (propio de Actions, para `scripts/github.ts`).

---

## 2. Funcionalidades por módulo y quién las sirve

Leyenda: **RSC** (Server Component estático o dinámico), **SA** (Server Action en `apps/web`), **RH** (route handler en `apps/web`), **GW** (gateway `apps/api`), **SB** (Supabase directo desde el cliente/servidor con la sesión del usuario y RLS), **OM** (worker de Omen vía gateway), **BT** (script de build).

### Público

| Módulo | Función | Servido por |
|---|---|---|
| Shell IDE-lite (UX §3) | `AppShell`: barra de título (hero minimizado), árbol del sitio (3 niveles, hoja "Menú" en móvil), pestañas en escritorio (máx. 6, `sessionStorage`), panel central, línea de estado con datos del build y accesos (Menú · Contacto · Chat) | Layout RSC estático; `Tabs`, plegado del árbol y conmutador de idioma como islas cliente; datos del build por BT (§2.1) |
| Hero de presentación (UX §3.6) | `HeroIntro`: una vez al día (`localStorage.hero_seen`), solo en `/` y `/en`, ≤ 3,3 s escritorio / ≤ 2,4 s móvil, saltable, sin animación con reduced-motion; evento `hero_played {skipped, ms}` | HTML en estado `ready` + script inline en `<head>` que decide `boot` antes del paint (§1.6); GSAP cargado tras el paint |
| Home | Presentación con hechos, índice de secciones (un hecho por sección), 3 proyectos, "Cómo está hecha esta web" (datos del build), último artículo, contacto | RSC estático; datos GitHub/stores/build por BT |
| Empresas | Servicios, stack, forma de trabajar, CV PDF, reserva 20 min (Cal.com), formulario | RSC estático; embed Cal.com (cliente, lazy); formulario → SA `submitContact` → GW `POST /api/v1/leads` |
| Negocios | Packs P1–P4 y extras desde `pricing.json`, proceso, FAQ (`FAQPage`), CTA generador y WhatsApp | RSC estático; `@josecoded/pricing` en build |
| Generador de propuesta | Chat guiado 3–4 preguntas → propuesta (pack, extras, alcance, "desde X €") → enviar → lead | Cliente (estado del chat) → GW `POST /api/v1/proposals/generate` (Workers AI + pricing) → GW `POST /api/v1/leads` con `ai_proposal` |
| Proyectos | Fichas (3catinfo con campos ocultables, Oportunix, HazmeFila, webs), valoraciones de stores, `SoftwareApplication` | RSC estático; `content/projects/*.json` + `content/generated/stores.json` (BT) |
| Sobre mí | Perfil, `ProfilePage`, `sameAs` | RSC estático |
| Blog | Listado, artículo MDX, `BlogPosting`, RSS, comentarios moderados (cola de aprobación; el autor ve el suyo como "Pendiente") | RSC estático (MDX en build); comentarios: componente cliente → SB (`blog_comments`, RLS devuelve `approved` + propios) y SA `postComment` → SB insert (RLS). Un comentario aprobado es visible en la siguiente carga, sin revalidación (no hay ISR) |
| Chat IA | Hilo, envío, selector de reunión, takeover humano | Cliente → GW `admin-chat/*` con JWT; realtime SB en `admin_chat_messages` (RLS select propio) |
| Contacto | Una página con segmento negocio/empresa (`?via` → `sessionStorage.audience` → `negocio`); negocio: WhatsApp primario + formulario plegado; empresa: formulario + Cal.com; Turnstile | Segmento en cliente; SA `submitContact` → GW `POST /api/v1/leads`; WhatsApp no crea lead (Jose lo crea a mano en admin, UX §9.3) |
| Auth | Google y GitHub a un toque; email con **código OTP de 6 cifras** (`signInWithOtp` + `verifyOtp({ type:'email' })`, sin enlace ni contraseña, UX §5); callback OAuth; logout; perfil mínimo | SB Auth (plantilla de email de Supabase con `{{ .Token }}`: tarea de Jose); RH `api/auth/callback`; SA `signOut` |
| SEO/GEO | `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, OG, JSON-LD, 301/410 | `app/sitemap.ts`, `app/robots.ts` (RSC); `llms*.txt` y OG por BT; redirecciones en `next.config.ts` |
| i18n | es sin prefijo, en en `/en`, alternates solo si existe traducción | next-intl + rewrites (§1.4) |
| Analítica | Umami (5 eventos) + Cloudflare Web Analytics | Cliente (`umami.track`), scripts en `app/[locale]/layout.tsx` |
| Afiliados (captura) | `?ref=CODIGO` en cualquier ruta → cookie `ref` 30 días (se conserva la primera; un lead, un afiliado) + `RefNotice` una vez | Componente cliente `RefCapture` (valida formato, consulta `GET /api/v1/affiliates/validate` para no guardar códigos inexistentes ni mostrar el aviso, escribe cookie `ref` `SameSite=Lax`; sin middleware) |

### 2.1 Datos del build (línea de estado y "Cómo está hecha esta web")

La UX exige datos reales, nunca en vivo y nunca inventados. Los genera `apps/web/scripts/build-info.ts` en `prebuild` y escribe `content/generated/build-info.json`; si falta cualquier campo obligatorio, **la build falla** (UX §4.1). Fuentes y momento:

| Dato | Dónde se muestra | Fuente | Cuándo se genera |
|---|---|---|---|
| Rama y commit corto | `StatusLine` (escritorio) | `GITHUB_REF_NAME` / `GITHUB_SHA` en CI; `git rev-parse` en local | Cada build |
| Fecha de publicación | `StatusLine`, "Cómo está hecha" | Reloj de CI en el build de producción (`deploy-production.yml` / `content-refresh.yml`) | Cada build de producción; en preview muestra "preview" |
| Versión de Next.js | "Cómo está hecha" | `pnpm-lock.yaml` (`next@`) | Cada build |
| Rutas del gateway | "Cómo está hecha" | `apps/api/src/routes-manifest.ts` (export tipado que registra cada ruta; el conteo se lee de ahí, no por regex) | Cada build |
| Tablas y políticas RLS | "Cómo está hecha" | Parseo de `supabase/schema/baseline.sql` + `supabase/migrations/*.sql` (`create table` / `create policy` en `public`) | Cada build |
| Tests | "Cómo está hecha" | `vitest run --reporter=json` y `playwright test --list --reporter=json` en el paso previo de CI → `test-counts.json` | Cada build en CI (en local, último valor commiteado) |
| LCP, INP, Lighthouse | `StatusLine` (LCP), `ProofStrip` ("carga en menos de 1 s" si LCP < 1 s; frase alternativa si no), "Cómo está hecha" | `content/generated/perf.json`: Lighthouse CI móvil contra **producción** en `content-refresh.yml` (mediana de 3 pasadas) | Diario; el primer valor se mide contra la preview de la rama y se commitea a mano. El dato lleva su fecha ("medido el 17 sep") |
| Repos públicos, actividad, valoraciones de stores | `ProofStrip`, `GitHubActivity`, `StoreBadges` | `content/generated/github.json`, `stores.json` (§5.1, §5.2) | Diario (`content-refresh.yml`) y en cada build |

Regla: `content/generated/` está versionado; un script que falla no rompe la build si existe el valor anterior, salvo `build-info.json` (rama, commit, versión, rutas, tablas), que siempre se puede calcular.

### Privado

| Módulo | Función | Servido por |
|---|---|---|
| Área de clientes | Proyecto, fase, tareas, comentarios, assets (bucket `client-assets`), pack y extras | RSC dinámico + SA → SB con RLS heredada (`clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_pack_extras`) |
| Reclamar acceso | Usuario recién registrado se vincula a su `clients` por email | SA `claimClientAccess` → RPC `public.claim_client_access()` (SECURITY DEFINER, aditiva) |
| Ampliaciones | Solicitar pack superior o extras; precio por diferencia de lista | SA `requestUpgrade` (calcula con `@josecoded/pricing`) → SB insert `upgrade_requests` (RLS) |
| Afiliados | Código y enlace, leads atribuidos (solo estado y fecha, sin datos de contacto), recompensas | SA `ensureAffiliate` → SB insert `affiliates` (RLS + trigger de código); RSC lee `affiliate_rewards` y vista `affiliate_leads_view` (RLS) |
| Admin: leads | Bandeja, detalle (propuesta IA, afiliado, fuente), **nuevo lead manual** (origen WhatsApp, UX §9.3), cambio de `estado`, "Marcar cerrado y cobrado" (UX §9.9: base = `monto`, extras que suman, recompensa calculada; pone `estado='cerrado'` + `paid_at`) → recompensa | RSC + SA → SB con políticas admin heredadas + nuevas (`admin insert leads`); SA `closeLeadPaid` hace en una transacción (RPC `public.admin_close_lead_paid`, SECURITY DEFINER con comprobación de admin) el update del lead y el insert de `affiliate_rewards` con `@josecoded/pricing`; los triggers heredados crean `clients` |
| Admin: comentarios | Cola `pending`, aprobar/rechazar | SA → SB update `blog_comments.status` (RLS admin) |
| Admin: clientes | Clientes, tareas, assets, extras, solicitudes de ampliación, `invite_email` | SA → SB (políticas admin heredadas + `upgrade_requests`) |
| Admin: afiliados | Nivel `standard\|premium`, recompensas pendientes → abonadas | SA → SB update `affiliates.level`, `affiliate_rewards.status` |
| Admin: chat | Conversaciones, mensajes, takeover (`ai` on/off), marcar leído | Cliente → GW `admin-chat/admin/*` con JWT de Jose |
| Admin: reenviar aviso | Botón "avisar por Telegram" de un lead | SA → GW `POST /api/v1/notify/lead` (JWT admin) |
| Admin: estado de Omen | Semáforo `system/status` | RSC → GW `GET /api/v1/system/status` (JWT) → OM |

---

## 3. Integraciones con `josecoded-api` (gateway)

Envelope existente: éxito `{ ok:true, data }`; error `{ ok:false, error:{ code, message, details? } }` con códigos `invalid_request | unauthorized | forbidden | not_found | conflict | rate_limited | upstream_error | internal_error` (`src/utils/api-response.ts`). Las rutas nuevas lo respetan y añaden el código `bot_check_failed` (Turnstile) y `quota_exceeded` (cuota diaria).

### 3.1 Tabla de endpoints que consume la web

| Estado | Método y ruta | Auth | Payload | Respuesta `data` | Errores | Quién lo llama |
|---|---|---|---|---|---|---|
| existente | `GET /api/v1/health` | — | — | `{service, mode, timestamp, version}` | — | CI (smoke) |
| existente | `GET /api/v1/auth/me` | JWT | — | `{ user }` | 401 | No se usa (la web lee la sesión con `@supabase/ssr`) |
| existente | `GET /api/v1/system/status` | JWT | — | JSON del worker de Omen (§4) | 401, 502 `upstream_error` | Admin (semáforo) |
| existente | `GET /api/v1/admin-chat/thread` | JWT | — | `{conversationId, messages[]}` | 401, 503 | Chat (carga inicial) |
| existente | `POST /api/v1/admin-chat/messages` | JWT | `{ content: string 1..4000 }` | 201 `{ userMessage, thread }`; IA en `waitUntil` | 400, 401, 500 | Chat |
| existente | `POST /api/v1/admin-chat/meeting` | JWT | `{ conversationId, messageId, date 'YYYY-MM-DD', time 'HH:MM' }` | `{ message, thread }` | 400, 401, 404 | Chat (selector de reunión) |
| existente | `POST /api/v1/admin-chat/n8n/inbound` | `x-n8n-chat-secret` | `{ conversationId, reply, showMeetingPicker? }` | `{ accepted:true }` | 401 | n8n (no la web) |
| existente | `GET /api/v1/admin-chat/admin/conversations` | JWT admin | — | `AdminConversationSummaryDTO[]` | 401, 403 | Admin chat |
| existente | `GET/POST /api/v1/admin-chat/admin/conversations/:id/messages` | JWT admin | POST `{ content }` | `AdminChatMessageDTO[]` / 201 DTO | 400, 403 | Admin chat |
| existente | `POST /api/v1/admin-chat/admin/conversations/:id/ai` | JWT admin | `{ enabled: boolean }` | `{ conversationId, aiEnabled }` | 400, 403 | Admin chat (takeover) |
| existente | `POST /api/v1/admin-chat/admin/conversations/:id/read` | JWT admin | — | `{ conversationId }` | 403 | Admin chat |
| existente | `forum/*` | — | — | — | — | Sin consumidor; intactas |
| **nuevo** | `POST /api/v1/proposals/generate` | Turnstile + rate limit + cuota | ver 3.2 | ver 3.2 | 400, 403 `bot_check_failed`, 429 `rate_limited`/`quota_exceeded`, 502 `upstream_error` (IA) | Generador (cliente, fetch directo) |
| **nuevo** | `POST /api/v1/leads` | Turnstile **o** `x-josecoded-server-key` + rate limit | ver 3.3 | `{ leadId, notified: 'n8n'\|'edge'\|'none' }` | 400, 403, 409 `conflict` (autoreferido), 429, 500 | SA `submitContact`, generador (enviar), RH webhook Cal.com |
| **nuevo** | `POST /api/v1/notify/lead` | JWT admin | `{ leadId: uuid }` | `{ notified: 'n8n'\|'edge'\|'none' }` | 401, 403, 404 | Admin (reenviar aviso). Internamente lo usa `POST /leads` |
| **nuevo** | `GET /api/v1/affiliates/validate?code=` | — (rate limit) | — | `{ valid: boolean }` | 429 | `RefCapture` (opcional, para no guardar cookies con códigos inexistentes) |

### 3.2 `POST /api/v1/proposals/generate`

**Request** (`src/schemas/proposals.schema.ts`, zod):

```ts
{
  locale: 'es' | 'en',
  turnstileToken: string,               // widget action 'proposal'
  answers: {
    businessType: string,              // 1..120  "clínica dental", "restaurante"
    needs: string,                     // 1..600  qué debe hacer la web
    salesMode: 'none' | 'orders' | 'bookings' | 'both',
    timeline: 'asap' | 'one_month' | 'three_months' | 'flexible',
    extrasInterest?: ('seo' | 'geo' | 'security' | 'maintenance')[]
  }
}
```

**Proceso:** (1) `nativeRateLimit(env.AI_RATE_LIMITER)` clave `proposals:<ip>` (binding existente 20/60 s, hoy sin uso); (2) cuota diaria por IP en KV `QUOTA_KV` (`proposals:<yyyymmdd>:<ip>`, límite 10, TTL 24 h) y cuota global diaria (`proposals:<yyyymmdd>:all`, límite 300; al superarla, aviso Telegram vía `notify/lead`-like `system.quota` y respuesta 429); (3) `verifyTurnstile(token, ip)` contra `https://challenges.cloudflare.com/turnstile/v0/siteverify` con `TURNSTILE_SECRET_KEY`, exigiendo `action === 'proposal'` y `hostname` ∈ dominios permitidos; (4) `env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages, response_format: { type:'json_schema', json_schema }, max_tokens: 700, temperature: 0.2 })`; (5) validación zod de la salida; si el modelo falla o el JSON no cumple ("JSON Mode couldn't be met"), **clasificador de reglas** local (`salesMode` → P2; palabras clave "stock/panel/facturación/clientes" → P3; "automatiz/whatsapp/aviso/IA" → P4; resto P1) para que Marta nunca vea un error; (6) precio por `@josecoded/pricing` (`priceForProposal(pack, extras)`), nunca por el modelo.

JSON schema de la salida del modelo (el modelo **no ve precios**):

```json
{ "type":"object", "required":["pack","extras","summary","scope","questions"],
  "properties":{
    "pack":{"enum":["P1","P2","P3","P4"]},
    "extras":{"type":"array","items":{"enum":["seo_basic","seo_full","geo","security_audit","maintenance_basic","maintenance_extended"]}},
    "summary":{"type":"string","maxLength":400},
    "scope":{"type":"array","minItems":3,"maxItems":6,"items":{"type":"string","maxLength":120}},
    "questions":{"type":"array","maxItems":2,"items":{"type":"string","maxLength":120}} } }
```

**Response `data`:**

```ts
{
  proposalId: string,                  // uuid; se guarda 24 h en QUOTA_KV para poder "enviar" sin recalcular
  pricingVersion: '2026-09-14',
  pack: { code:'P2', name:'Pedidos / reservas', price:1400, weeks:2, includes: string[] },
  priceFrom: 1400,                     // = pack.price. NUNCA suma extras (UX §4.4, H8)
  recommendedExtras: [                 // 0–3, "Opcional · no incluido", precio aparte
    { code:'seo_basic', label:'Que te encuentren en Google, básico (SEO)', price:250, billing:'one_off' },
    { code:'maintenance_basic', label:'Mantenimiento básico', price:49, billing:'monthly' }
  ],
  summary: string, scope: string[], questions: string[],
  source: 'ai' | 'rules',              // para Umami y para el admin
  disclaimer: 'Orientativo. El precio cerrado va en la propuesta que te mando'
}
```

Las respuestas de la UX (§4.4: P1 tipo de negocio con chips, P2 multiselección de necesidades, P3 vender/reservar, P4 plazo, `?pack=` preseleccionado) se mapean a `answers` así: `businessType` = chip o texto de P1; `needs` = chips de P2 unidos + texto libre; `salesMode` = P3 (`'none'` si "No", `'both'` si P2 marcó pedidos y reservas; se omite P3 cuando P2 lo deja claro); `timeline` = P4; `preselectedPack?: 'P1'|'P2'|'P3'|'P4'` (el modelo lo recibe como "el visitante viene del pack X; confírmalo o corrígelo").

Prompt de sistema (resumen; el texto vive en `src/services/proposal-classifier.ts`): rol "clasificas peticiones de negocios locales en uno de cuatro packs" + definición literal de P1–P4 y extras tomada de `pricing.json` (campos `includes`), regla "si dudas entre dos packs, elige el menor", "no menciones precios", idioma = `locale`. Contexto máximo ~2 k tokens de entrada; coste estimado por propuesta ≈ 0,001 $ (Workers AI: 0,293 $/M entrada, 2,253 $/M salida; 10 000 neuronas/día gratis).

### 3.3 `POST /api/v1/leads`

**Request:**

```ts
{
  source: 'web_form' | 'web_proposal' | 'calcom',      // → leads.fuente
  locale: 'es' | 'en',
  contact: { name: string 1..120, email: string email, phone?: string 6..30, company?: string ≤120 },
  message?: string ≤2000,
  proposalId?: string,                 // obligatorio si source='web_proposal'; el gateway recupera la propuesta de KV y la re-tarifica
  affiliateCode?: string /^[A-Z0-9]{8}$/,
  turnstileToken?: string,             // obligatorio salvo con x-josecoded-server-key
  meta?: { path: string, userAgent?: string }
}
```

**Auth:** dos modos. (a) Navegador/SA: `turnstileToken` (action `contact` o `proposal_send`). (b) Servidor a servidor (webhook Cal.com desde `apps/web`): cabecera `x-josecoded-server-key` = secreto `SERVER_KEY` compartido entre `apps/web` y `apps/api` (dos secretos Workers). Rate limit: binding nuevo `LEADS_RATE_LIMITER` (5/60 s por IP, `namespace_id` 1002).

**Proceso:** validar (email **o** teléfono obligatorio, UX §4.4 paso 4) → Turnstile/server key → si `affiliateCode`: debe existir en `affiliates`; se comprueba **autoreferido** (email del contacto = email del usuario del afiliado vía `auth.admin.getUserById`): según UX §9.1 el lead **se guarda igual con el código** y se marca `meta.self_referral_suspect = true` para que el admin lo vea y decida (UX §9.9: casilla "Generar recompensa igualmente" desmarcada); no se devuelve 409 → `insert leads` con service role: `{ estado:'nuevo', fuente:source, locale, contact_name, contact_email, contact_phone, message, ai_proposal (jsonb o null), affiliate_code, pack_template_id (por `code` del pack propuesto), monto: priceFrom (orientativo), meta }` → `waitUntil(notifyLead(leadId))` → 201 `{ leadId, notified }` (`notified` refleja el intento síncrono corto de 3 s; si sigue en `waitUntil`, devuelve `'pending'`).

Los triggers heredados de `leads` corren (verificados): `trg_auto_assign_new_lead` (0 closers → `assigned_staff_id` null; correcto), `trg_log_lead_assignment_insert` (no-op sin asignación). Ninguno bloquea el insert.

**Lead manual del admin** (UX §9.3, origen WhatsApp): no pasa por el gateway; SA `createManualLead` en `apps/web` con la sesión de Jose → insert directo con la política aditiva `admin insert leads` (`fuente='whatsapp'`, `affiliate_code` tecleado si el visitante mencionó el código) → `POST /api/v1/notify/lead` no hace falta (lo crea Jose).

### 3.4 `POST /api/v1/notify/lead` y servicio `notifyLead`

`notifyLead(leadId)` (`src/services/lead-notify.service.ts`): lee el lead (service role) y construye `{ event:'lead.created', lead:{ id, source, locale, contact:{name,email,phone}, message, pack, priceFrom, affiliateCode, createdAt }, adminUrl }`.

1. **Primaria (decisión P3 de Jose):** `POST ${SUPABASE_URL}/functions/v1/notify` con cabecera `x-notify-secret: NOTIFY_SHARED_SECRET` y body `{ event:'lead.created', data:{ lead_id, source, locale, contact:{name,email,phone}, pack, price_from, affiliate_code, admin_url } }`. La Edge Function (cambio aditivo: nuevo `case 'lead.created'`, `EMAIL_FROM` rebrandeado) envía Telegram a `staff_members.telegram_chat_id` de los admins (verificado: Jose tiene `chat_id` cargado) con el enlace directo a `/admin/leads/<id>` y, si `RESEND_API_KEY` está configurada, email a `ADMIN_NOTIFY_EMAIL`. No depende de Omen. Timeout 5 s; un reintento.
2. **Opcional (n8n, si el workflow existe y `N8N_LEAD_WEBHOOK_ENABLED='true'`):** `callWorker('/n8n/trigger/lead-created', { method:'POST', body, timeoutMs: 6000 })` (worker de Omen; `lead-created` ya está en la allowlist `n8n.service.ts:3-8`) para automatizaciones futuras (Notion, seguimiento). Éxito si HTTP 200 **y** `data.ok === true`. Su fallo nunca cuenta como fallo del aviso.
3. Resultado en `leads.meta.notify = { via:'edge'|'none', n8n:'ok'|'skipped'|'failed', at, error? }` (update con service role) para que el admin lo muestre y ofrezca "Reenviar aviso".

El endpoint público `POST /api/v1/notify/lead` (JWT admin, `assertAdmin` existente) solo llama a `notifyLead` y devuelve `{ notified }`.

### 3.5 Afiliados y ampliaciones: ¿gateway o Supabase directo?

**Decisión: Supabase directo con RLS** para crear el afiliado, leer sus leads/recompensas y solicitar ampliaciones; **gateway** solo para lo que necesita service role (atribuir el lead, comprobar autoreferido). Razones: (1) son operaciones del usuario sobre sus propias filas, exactamente el caso de uso de RLS; (2) no hay lógica secreta (el precio de ampliación es público); (3) evita cuatro rutas nuevas en el gateway y su CORS/tests; (4) los tests RLS con dos cuentas cubren el aislamiento. Lo que sí queda fuera del alcance del usuario por diseño: el código de afiliado lo genera un trigger (no se puede elegir), el nivel `premium` solo lo cambia el admin, y las recompensas solo las inserta el admin (SA `markLeadPaid` con `@josecoded/pricing`; política de insert solo admin). Descartado: trigger en BD que calcule la recompensa (duplicaría las reglas de `pricing.json` en SQL).

### 3.6 CORS y cambios de configuración (aditivos)

- `CORS_ORIGINS` pasa a admitir entradas con comodín de subdominio: `https://josecoded.com,https://www.josecoded.com,https://*.josecoded-web.<subdominio>.workers.dev,http://localhost:3000`. Cambio en `src/index.ts:20-39`: si la entrada empieza por `https://*.` se compara por sufijo de host. Lista exacta para el resto.
- `allowHeaders` añade `x-josecoded-server-key` (solo la usa el servidor, pero el preflight de fetch desde Workers no aplica; se añade por coherencia).
- `wrangler.jsonc`: `routes: [{ pattern:'api.josecoded.com', custom_domain:true }]`; `ratelimits` añade `LEADS_RATE_LIMITER` (1002, 5/60) y `AFFILIATE_RATE_LIMITER` (1003, 30/60); `kv_namespaces: [{ binding:'QUOTA_KV', id }]`; `API_MODE` sigue `development` hasta que Jose decida el cutover (pendiente heredado, `DEPLOY.md §4`); **todo binding nuevo se declara también en `envSchema` (`src/config/env.ts`) o `parseEnv` lo elimina**.
- Montaje: `proposalsRoutes`, `leadsRoutes`, `notifyRoutes`, `affiliatesRoutes` se registran en `src/modules/v1.routes.ts` **antes** de `protectedV1Routes` (línea 25), porque este aplica `requireUser` a `*`.
- Deuda heredada que se corrige de paso (aditiva, sin tocar contratos): `toUpstreamFail` deja de mencionar "Android emulator" en timeouts; `app.onError` deja de exponer `error.message` en `details` fuera de `API_MODE=development`.

---

## 4. Integraciones con el worker de Omen (siempre vía gateway)

Contrato real (`josecoded-worker/src`): Fastify 5 en `http://localhost:4000` de Omen, expuesto en `https://worker.josecoded.com` por el túnel `josecoded-worker` (`c0dac20a-…`); auth `Authorization: Bearer <BACKEND_INTERNAL_TOKEN>` (= `WORKER_INTERNAL_TOKEN` del gateway) o `x-internal-token`; solo `GET /health` es público; sin reintentos; timeout del gateway 10 s.

| Módulo del worker | Uso en josecoded v1 | Quién | Si Omen está apagado |
|---|---|---|---|
| `POST /n8n/trigger/lead-created` | **Opcional** (P3): automatizaciones posteriores al lead; el aviso Telegram primario va por la Edge Function `notify` sin Omen | Gateway `notifyLead` (paso 2) | Se marca `n8n:'failed'` en `leads.meta`; el aviso ya llegó por la Edge Function. Nada se pierde |
| `GET /system/status` | Semáforo en admin (Ollama, n8n, discos) | Gateway `GET /api/v1/system/status` | Admin muestra "Omen sin conexión" (502 del gateway); sin impacto público |
| `POST /ai/blog/generate`, `/ai/blog/improve`, `/ai/summarize` | Redacción del blog **en local**: script `pnpm blog:draft --topic` y `pnpm blog:improve <file>` en `apps/web/scripts/blog-ai.ts` llaman al gateway `ALL /api/dev/worker/*` (proxy existente, `x-dev-api-key`, solo `API_MODE=development`) o directamente a `worker.josecoded.com` con el token desde `.env.local` del Mac | Jose, Claude Code | El script falla con mensaje claro; se escribe a mano |
| `POST /ai/chat`, `/ai/admin-chat` | **No se usan** (chat público con Workers AI, D5/Q9) | — | — |
| `storage/*` | **No se usa** (assets de clientes en Supabase Storage `client-assets`) | — | — |
| `n8n/trigger/blog-generate`, `client-message`, `file-uploaded` | No se usan en v1 | — | — |

Umami no pasa por el worker: el navegador habla con `stats.josecoded.com` (túnel propio, §5.6). Si Omen está apagado, el script de Umami falla silenciosamente (`async`, sin bloquear render) y Cloudflare Web Analytics sigue midiendo.

Cambios en Omen: **ninguno en el worker**. Un contenedor nuevo (Umami) y un túnel nuevo. Recomendación aparte para `implementador-infra` (fuera de este proyecto, con OK de Jose): quitar `Requires=docker.service` de la unidad systemd del worker y confirmar que está instalada como servicio (el snapshot de 2026-06-01 decía que corría con `pnpm start` manual).

---

## 5. Integraciones con plataformas externas

### 5.1 GitHub (prueba real para Dani)

- Datos: repos públicos de `12joseca12` (nombre, descripción, lenguaje, estrellas, `pushed_at`, topics) y actividad reciente (eventos públicos: push, PR, release) + calendario de contribuciones (GraphQL `contributionsCollection`, **requiere token**).
- API: REST `GET /users/12joseca12/repos?sort=pushed&per_page=30`, `GET /users/12joseca12/events/public?per_page=50`; GraphQL para el calendario. Límites: 60 req/h sin auth, 5 000/h con PAT.
- Estrategia: **solo en build** (`scripts/github.ts` → `content/generated/github.json`, con `GITHUB_TOKEN` de Actions). Sin llamadas en runtime ni ISR. Frescura: `content-refresh.yml` diario (04:00) regenera, commitea y **despliega la web solo si el diff se limita a `content/generated/*`** (decisión de Jose, P4; §1.8).
- Fallback: si la API falla en build, se usa el JSON commiteado anterior (`content/generated/` está versionado precisamente para esto) y el build no rompe.

### 5.2 App Store / Google Play (fichas de apps)

- App Store: **iTunes Lookup API** pública, sin auth: `https://itunes.apple.com/lookup?id=<trackId>&country=es` devuelve `averageUserRating`, `userRatingCount`, `version`, `currentVersionReleaseDate`, `screenshotUrls`, `trackViewUrl`. Límite ~20 llamadas/min. Suficiente.
- Google Play: **no hay API pública** de fichas. Opciones: (a) `google-play-scraper` 10.1.3 en build (scraping no oficial de la página pública; puede romperse); (b) datos a mano en `content/projects/*.json`. **Decisión: (a) con (b) como valor de respaldo**: el script rellena `rating`, `ratingsCount`, `installs`, `updated`; si falla, se mantiene el último valor commiteado y se avisa en el log de CI. Nunca se muestra un dato vacío ni "0 valoraciones".
- Caché: igual que GitHub, `content/generated/stores.json` en build. Enlaces a stores siempre estáticos desde `content/projects/*.json` (`appStoreId`, `playPackage`).
- 3catinfo: la ficha tiene `hideMetrics: true` (Q6): se muestran nombre y enlaces, no valoraciones ni instalaciones. Las fichas admiten `hideStack`.

### 5.3 Cal.com vs Calendly (decisión: Cal.com)

| | Cal.com | Calendly |
|---|---|---|
| Embed | `@calcom/embed-react` (inline y popup), tema oscuro y colores personalizables | Widget iframe; personalización limitada en plan gratuito |
| Webhooks | Plan gratuito: sí (`BOOKING_CREATED`, firma `x-cal-signature-256` HMAC-SHA256 del body) | Solo desde plan Standard (de pago) |
| Datos | Open source; puede autoalojarse más adelante | SaaS |
| Coste | 0 € | 0 € sin webhooks; 10 $/mes con ellos |

Integración: página Empresas con embed **lazy** (se carga al hacer clic en "Reservar 20 min" o al entrar en viewport; no en el HTML inicial, pesa). Webhook `BOOKING_CREATED` → `apps/web/app/api/webhooks/calcom/route.ts`: lee el body raw, verifica HMAC con `CALCOM_WEBHOOK_SECRET`, extrae `attendees[0].name/email`, `startTime`, `responses.notes`, y llama a `POST /api/v1/leads` con `source:'calcom'`, `x-josecoded-server-key` y `affiliateCode` si el visitante llegó con `?ref=` (se pasa como `metadata` del embed: `calLink?ref=` → campo oculto `ref` del formulario de reserva). Umami: evento `call_booked` (sexto evento, añadido a la lista D11; se anota como decisión).

### 5.4 Telegram vía n8n

- Workflow n8n `lead-created` (webhook `POST /webhook/lead-created`, cabecera `x-josecoded-webhook-secret` verificada en el propio workflow): formatea el lead y envía con el nodo Telegram (bot existente de la fase 3a; `chat_id` de Jose). Responde `{ ok:true }` en < 5 s.
- Tarea `infra`: crear/activar el workflow en n8n de Omen (el repo del worker no versiona workflows; se exporta el JSON a `apps/api/infra/n8n/lead-created.json` como referencia).
- Rotar el token del bot y la key de Resend (pendiente del informe P3 de josedev; tarea de Jose).

### 5.5 Cloudflare Turnstile

- Widget `@marsidev/react-turnstile` en formulario de contacto (action `contact`), generador (action `proposal` al generar y `proposal_send` al enviar) y comentarios del blog (action `comment`; verificación en la SA con `TURNSTILE_SECRET_KEY` de `apps/web`, ya que los comentarios no pasan por el gateway).
- Verificación siempre en servidor (`siteverify`): token de un solo uso, 5 min, se comprueba `action` y `hostname`. Modo "managed" invisible por defecto; `appearance: 'interaction-only'`.
- Claves: una site key con dominios `josecoded.com`, `*.workers.dev` (previews) y `localhost`; secret en dos Workers (`apps/api` y `apps/web`).

### 5.6 Umami (autoalojado en Omen)

- Tarea `infra` (con OK de Jose antes de exponer): `docker compose` nuevo `umami` (imagen `ghcr.io/umami-software/umami:postgresql-latest`, Postgres 16 propio, puerto local 3001) + **túnel nuevo** `josecoded-umami` con ingress `stats.josecoded.com → http://localhost:3001` (túnel separado para no editar la config del túnel existente `josecoded-worker`, que pertenece a un servicio preexistente).
- Web: `<Script src="https://stats.josecoded.com/script.js" data-website-id={NEXT_PUBLIC_UMAMI_WEBSITE_ID} data-domains="josecoded.com" strategy="afterInteractive" />`. Sin cookies, sin banner.
- Eventos (`lib/analytics.ts` → `window.umami?.track(name, data)`), alineados con UX §11 y aprobados por Jose: `whatsapp_click {origin, pack?, ref?}`, `contact_submit {via}`, `proposal_generated {pack, questions, source:'ai'|'rules'}`, `proposal_sent {pack, has_ref}`, `chat_started`, `call_booked` (desde el RH del webhook de Cal.com, con `@umami/node` en servidor, sin PII), `hero_played {skipped, ms}`, `section_open {section}`, `booking_open`, `referral_copy`. Los mismos nombres se comprueban en Playwright interceptando `POST /api/send`.
- Si Omen está apagado: el script no carga; `track` es no-op (`?.`).

### 5.7 Cloudflare Web Analytics

Activar en el dashboard para la zona `josecoded.com` (tarea de Jose, 2 min). Como la web es un Worker con custom domain en la zona, Cloudflare puede inyectar el beacon automáticamente; si no, `<Script src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}' />` con `NEXT_PUBLIC_CF_BEACON_TOKEN`. Sin cookies. Complemento de Umami (CWV reales por navegador).

### 5.8 Candidatas no pedidas (máx. 6)

| Candidata | Beneficio | Coste | Recomendación |
|---|---|---|---|
| **Cloudflare Email Service** (Email Sending binding) en lugar de Resend para el email de respaldo y para "copia de tu propuesta" al visitante | Sin proveedor extra ni API key; mismo panel; dominio ya en Cloudflare | Bajo: binding + DKIM/SPF en la zona; requiere que el remitente sea `@josecoded.com` | **Sí, después de v1**: v1 usa la Edge Function heredada con Resend (ya existe). Migrar el respaldo a Email Service es una tarea pequeña que quita una credencial |
| **Sentry** (`@sentry/nextjs`) | Trazas de errores en web y gateway | Medio: +~60 KB cliente, SDK en Workers, cuenta y DSN; ruido | **No en v1**: Workers Logs + `observability.enabled` cubren errores del servidor gratis; en cliente, `window.onerror` → Umami evento `client_error` (sin PII). Revisar a los 3 meses |
| **Stripe** (señal 40 % o mantenimiento mensual) | Cobro sin transferencia; mantenimiento recurrente automático | Alto: Checkout + webhooks + facturación/IVA + conciliación con Notion; toca dinero (gate) | **No en v1**: el pago es 40/30/30 por transferencia según `condiciones.md`; añadir pagos exige spec propia y `/plan-eng-review` |
| **WhatsApp Business API** (Cloud API) | Mensajes desde la web con plantilla y trazabilidad | Alto: verificación de Meta, número dedicado, plantillas aprobadas, coste por conversación | **No**: `wa.me/<número>?text=` con evento Umami cumple el objetivo de Marta a coste cero |
| **LinkedIn** (API) | Mostrar posts/recomendaciones en Sobre mí | Alto: la API de perfil no es pública; Marketing API exige app aprobada | **No**: enlace `sameAs` + posts curados a mano en `content/` (los genera `/linkedin-post`) |
| **RSS + newsletter** | RSS: alcance para Dani y agregadores; newsletter: retención | RSS bajo (una ruta estática, `app/feed.xml/route.ts` en build); newsletter medio (proveedor, doble opt-in, RGPD) | **RSS sí en v1** (coste casi cero, ayuda a GEO); **newsletter no** hasta tener ≥ 10 artículos |

Extra sin coste, no cuenta como candidata: **Cloudflare AI Gateway** delante de Workers AI (`env.AI.run(..., { gateway:{ id } })`) para logs, caché de respuestas idénticas y límite de gasto del generador. Se activa en la tarea del generador si Jose lo aprueba (un clic en el dashboard).

---

## 6. Supabase

Proyecto `nrgrmymsjtgayzejtawa` (eu-west-1, Postgres 17.6.1.105, plan Free, `ACTIVE_HEALTHY`). **Esquema, políticas, funciones, triggers, realtime, bucket y Edge Function verificados contra producción el 2026-09-17** (solo lectura). 21 tablas en `public`, todas con RLS; 47 políticas (incluidas 3 en `storage.objects`); 13 funciones en `private` (todas SECURITY DEFINER) y 5 en `public`; 15 triggers no internos.

### 6.1 Tablas heredadas usadas por la web (intactas, verificadas)

| Tabla | Uso | Políticas que se aprovechan |
|---|---|---|
| `staff_members` | Rol admin de Jose (`role='admin'`), `telegram_chat_id` para la Edge Function | `staff read staff_members` (el propio usuario lee su fila) |
| `leads` | Bandeja de admin; origen de clientes y recompensas | `staff read leads`, `staff claim or update own leads` (admin lee y actualiza todo). Insert solo service role (gateway) |
| `pack_templates`, `pack_extras` | Referencia de `clients.pack_template_id` y `client_pack_extras`; sincronizadas desde `pricing.json` por `code` | Lectura `authenticated`; escritura admin |
| `clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_pack_extras` | Área de clientes y admin | Todas las heredadas (cliente ve lo suyo, admin todo). Bucket `client-assets` con sus políticas |
| `admin_chat_conversations`, `admin_chat_messages` | Chat (lectura propia por realtime; escritura por gateway) | `read admin chat conversations/messages` |
| `blog_posts`, `forum_*`, `lead_assignments`, `commission_entries` | **Sin uso**; no se borran | — |

Trigger heredado relevante: al poner `leads.estado='cerrado'`, `leads_financial_integrity` exige `monto` (BEFORE) y `on_lead_close` crea la fila en `clients` (AFTER). El admin nuevo lo usa a su favor: "cerrar lead" = crear cliente. Como Jose no es `closer` y no tiene `comision`, no se generan `commission_entries`.

### 6.2 Migraciones nuevas (todas aditivas; se aplican **solo con OK de Jose**, con `list_tables` y `get_advisors` antes y después)

**Colisiones comprobadas 2026-09-17:** no existen en producción las tablas `blog_comments`, `affiliates`, `affiliate_rewards`, `upgrade_requests`; ni las columnas `leads.contact_*`, `leads.message`, `leads.locale`, `leads.ai_proposal`, `leads.affiliate_code`, `leads.paid_at`, `leads.meta`, `pack_templates.code`, `pack_extras.code`, `clients.invite_email`; ni las funciones `private.set_affiliate_code`, `public.claim_client_access`, `public.admin_close_lead_paid`; ni la vista `affiliate_leads_view`; ni ninguna política con los nombres de abajo. `pgcrypto` (para `gen_random_bytes`) está instalado. Ningún nombre de migración nuevo coincide con las 47 versiones remotas.

**Cómo se aplican (H6):** en producción, el controlador ejecuta cada fichero con `apply_migration(name, query)` del MCP (queda registrado en `supabase_migrations.schema_migrations`), tras `list_tables` + `get_advisors` y con OK de Jose en la sesión. Nunca `supabase db push`. En local/CI, `supabase start` aplica `supabase/schema/baseline.sql` (como `20260917000000_baseline.sql`, solo en el entorno local mediante `supabase/config.toml` `[db.migrations] schema_paths`) y después las nuevas. Todas las políticas nuevas usan `(select auth.uid())` (advisor `auth_rls_initplan`) y toda FK nueva lleva índice (advisor `unindexed_foreign_keys`).

Numeración `YYYYMMDDHHMMSS`, ficheros en `supabase/migrations/`:

**`20260917100000_leads_web_fields.sql`**
```sql
alter table public.leads
  add column contact_name  text,
  add column contact_email text,
  add column contact_phone text,
  add column message       text,
  add column locale        text check (locale in ('es','en')),
  add column ai_proposal   jsonb,
  add column affiliate_code text,
  add column paid_at       timestamptz,
  add column meta          jsonb not null default '{}'::jsonb;
create index idx_leads_contact_email on public.leads (lower(contact_email));
create index idx_leads_affiliate_code on public.leads (affiliate_code) where affiliate_code is not null;
create index idx_leads_created_at on public.leads (created_at desc);
-- fuente: valores acotados por convención de la app: web_form | web_proposal | calcom | whatsapp (sin CHECK para no alterar filas heredadas)
-- H7: lead manual del admin (UX §9.3). Única política de INSERT de la tabla; anon y usuarios normales siguen sin poder insertar.
create policy "admin insert leads" on public.leads for insert to authenticated
  with check (private.staff_role_of((select auth.uid())) = 'admin');
```
(`affiliate_code` recibe FK a `affiliates(code)` en la migración de afiliados.)

**`20260917100100_pack_codes.sql`**
```sql
alter table public.pack_templates add column code text unique check (code ~ '^P[1-4]$');
alter table public.pack_extras    add column code text unique;
-- El script pricing:sync-db rellena code/nombre/precio_base/descripcion por orden (1..4 ↔ P1..P4) y crea los extras.
```

**`20260917100200_blog_comments.sql`**
```sql
create table public.blog_comments (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  locale      text not null check (locale in ('es','en')),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_id   uuid references public.blog_comments(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  author_name text not null,             -- snapshot del nombre público al comentar
  created_at  timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references auth.users(id) on delete set null
);
create index idx_blog_comments_slug_status on public.blog_comments (slug, locale, status, created_at);
create index idx_blog_comments_user on public.blog_comments (user_id);
create index idx_blog_comments_parent on public.blog_comments (parent_id) where parent_id is not null;
create index idx_blog_comments_moderated_by on public.blog_comments (moderated_by) where moderated_by is not null;
create index idx_blog_comments_pending on public.blog_comments (created_at) where status = 'pending';
alter table public.blog_comments enable row level security;
grant select on public.blog_comments to anon, authenticated;
grant insert, update on public.blog_comments to authenticated;
create policy "comments read approved or own or admin" on public.blog_comments for select to anon, authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "comments insert own pending" on public.blog_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending'
    and (parent_id is null or exists (select 1 from public.blog_comments p where p.id = parent_id and p.status = 'approved' and p.slug = blog_comments.slug)));
create policy "comments admin update" on public.blog_comments for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin') with check (private.staff_role_of((select auth.uid())) = 'admin');
create policy "comments admin delete" on public.blog_comments for delete to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin');
```

**`20260917100300_affiliates.sql`**
```sql
create table public.affiliates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  code       text not null unique check (code ~ '^[A-Z]{2,6}-[A-Z0-9]{4}$'),   -- formato UX: DANI-3B7K, MARTA-7F2K
  level      text not null default 'standard' check (level in ('standard','premium')),
  created_at timestamptz not null default now()
);
create or replace function private.set_affiliate_code() returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name   text;
  v_prefix text;
  v_suffix text;
begin
  -- El usuario nunca elige su código. Prefijo: primeras letras del nombre (auth.users.raw_user_meta_data), sin tildes; si no hay nombre, 'JC'.
  select coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
    into v_name from auth.users u where u.id = new.user_id;
  v_prefix := upper(regexp_replace(translate(coalesce(v_name, ''), 'áéíóúàèìòùäëïöüñÁÉÍÓÚÑ', 'aeiouaeiouaeiounAEIOUN'), '[^A-Za-z]', '', 'g'));
  v_prefix := substr(v_prefix, 1, 6);
  if length(v_prefix) < 2 then v_prefix := 'JC'; end if;
  loop
    -- sufijo de 4 caracteres sin 0/O/1/I
    v_suffix := translate(upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4)), '01', 'XZ');
    new.code := v_prefix || '-' || v_suffix;
    exit when not exists (select 1 from public.affiliates a where a.code = new.code);
  end loop;
  return new;
end $$;
revoke all on function private.set_affiliate_code() from public, anon, authenticated;
create trigger trg_affiliates_code before insert on public.affiliates for each row execute function private.set_affiliate_code();
alter table public.affiliates enable row level security;
grant select, insert on public.affiliates to authenticated;
grant update on public.affiliates to authenticated;
create policy "affiliates read own or admin" on public.affiliates for select to authenticated
  using (user_id = (select auth.uid()) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "affiliates insert self standard" on public.affiliates for insert to authenticated
  with check (user_id = (select auth.uid()) and level = 'standard');
create policy "affiliates admin update" on public.affiliates for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin') with check (private.staff_role_of((select auth.uid())) = 'admin');
alter table public.leads add constraint leads_affiliate_code_fkey foreign key (affiliate_code) references public.affiliates(code) on delete set null;

-- Vista para que el afiliado vea SOLO estado y fecha de sus leads (nunca datos de contacto).
-- Sin security_invoker: la vista corre con los privilegios de su dueño (postgres) y filtra por auth.uid(),
-- así NO hace falta ninguna política nueva de select sobre `leads` (que expondría las filas completas por PostgREST).
create view public.affiliate_leads_view as
  select l.id, l.affiliate_code, l.estado, l.created_at, (l.paid_at is not null) as paid
  from public.leads l
  where l.affiliate_code in (select a.code from public.affiliates a where a.user_id = (select auth.uid()));
revoke all on public.affiliate_leads_view from public, anon;
grant select on public.affiliate_leads_view to authenticated;
```
(`get_advisors` marcará la vista como "security definer view"; es intencionado y se documenta en el ADR. La web nunca consulta `leads` con la sesión de un afiliado; el test RLS comprueba que un afiliado obtiene 0 filas de `leads` y N de la vista, sin `contact_email`.)

**`20260917100400_affiliate_rewards.sql`**
```sql
create table public.affiliate_rewards (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  lead_id      uuid not null unique references public.leads(id) on delete restrict,
  type         text not null check (type in ('maintenance_months','percent')),
  amount       numeric(10,2) not null check (amount > 0),   -- meses o euros según type
  base_amount  numeric(10,2) not null,                       -- primer pedido sin IVA
  percent      numeric(5,2),                                 -- 10 o 20 si type='percent'
  pricing_version text not null,
  status       text not null default 'pending' check (status in ('pending','paid')),
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  constraint rewards_paid_consistency check ((status = 'paid') = (paid_at is not null))
);
create index idx_affiliate_rewards_affiliate on public.affiliate_rewards (affiliate_id, status);
alter table public.affiliate_rewards enable row level security;
grant select, insert, update on public.affiliate_rewards to authenticated;
create policy "rewards read own or admin" on public.affiliate_rewards for select to authenticated
  using (affiliate_id in (select id from public.affiliates where user_id = (select auth.uid())) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "rewards admin insert" on public.affiliate_rewards for insert to authenticated
  with check (private.staff_role_of((select auth.uid())) = 'admin');
create policy "rewards admin mark paid" on public.affiliate_rewards for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin' and status = 'pending')
  with check (private.staff_role_of((select auth.uid())) = 'admin' and status = 'paid' and paid_at is not null);
```

**`20260917100500_upgrade_requests.sql`**
```sql
create table public.upgrade_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  from_pack_code  text check (from_pack_code ~ '^P[1-4]$'),
  to_pack_code    text check (to_pack_code ~ '^P[1-4]$'),
  extras          text[] not null default '{}',
  computed_price  numeric(10,2) not null check (computed_price >= 0),
  pricing_version text not null,
  note            text check (char_length(note) <= 1000),
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  check (to_pack_code is not null or cardinality(extras) > 0)
);
create index idx_upgrade_requests_client on public.upgrade_requests (client_id, created_at desc);
create index idx_upgrade_requests_pending on public.upgrade_requests (created_at) where status = 'pending';
alter table public.upgrade_requests enable row level security;
grant select, insert, update on public.upgrade_requests to authenticated;
create policy "upgrades read own or admin" on public.upgrade_requests for select to authenticated
  using (client_id = private.client_id_of((select auth.uid())) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "upgrades insert own pending" on public.upgrade_requests for insert to authenticated
  with check (client_id = private.client_id_of((select auth.uid())) and status = 'pending');
create policy "upgrades admin update" on public.upgrade_requests for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin') with check (private.staff_role_of((select auth.uid())) = 'admin');
```

**`20260917100600_client_access_claim.sql`**
```sql
alter table public.clients add column invite_email text;
create index idx_clients_invite_email on public.clients (lower(invite_email)) where invite_email is not null;
create or replace function public.claim_client_access() returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.clients set user_id = auth.uid()
   where user_id is null and lower(invite_email) = lower(auth.email())
   returning id into v_id;
  return v_id;
end $$;
revoke all on function public.claim_client_access() from public, anon;
grant execute on function public.claim_client_access() to authenticated;
```
Con esto el admin no necesita service role ni `auth.admin` para dar acceso: pone el email en el cliente y el usuario, al registrarse con ese email, queda vinculado (la SA del login llama al RPC tras el callback; UX §9.4 paso 3, "regla del admin 7.5").

**`20260917100650_admin_close_lead_paid.sql`** (UX §9.9: cierre cobrado + recompensa en una transacción)
```sql
create or replace function public.admin_close_lead_paid(
  p_lead_id uuid, p_base_amount numeric, p_reward_type text, p_reward_amount numeric,
  p_reward_percent numeric, p_pricing_version text, p_generate_reward boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_aff uuid; v_reward uuid;
begin
  if private.staff_role_of((select auth.uid())) is distinct from 'admin' then raise exception 'forbidden'; end if;
  -- monto = base del primer pedido sin IVA; el trigger heredado leads_financial_integrity exige monto y on_lead_close crea clients
  update public.leads set monto = p_base_amount, estado = 'cerrado', paid_at = now() where id = p_lead_id and paid_at is null;
  if not found then raise exception 'lead_already_closed_or_missing'; end if;
  if p_generate_reward then
    select a.id into v_aff from public.affiliates a join public.leads l on l.affiliate_code = a.code where l.id = p_lead_id;
    if v_aff is not null then
      insert into public.affiliate_rewards (affiliate_id, lead_id, type, amount, base_amount, percent, pricing_version)
        values (v_aff, p_lead_id, p_reward_type, p_reward_amount, p_base_amount, p_reward_percent, p_pricing_version)
        returning id into v_reward;
    end if;
  end if;
  return v_reward;
end $$;
revoke all on function public.admin_close_lead_paid(uuid, numeric, text, numeric, numeric, text, boolean) from public, anon;
grant execute on function public.admin_close_lead_paid(uuid, numeric, text, numeric, numeric, text, boolean) to authenticated;
```
La regla (10 % / 20 % / 2 meses) la calcula la SA con `@josecoded/pricing` y la pasa ya resuelta; la función solo garantiza atomicidad y el rol admin (la política `rewards admin insert` sigue vigente para inserts directos). Irreversible desde el admin (UX §14).

**`20260917100700_notify_lead_event.sql`** (solo documenta; el cambio está en `supabase/functions/notify/index.ts`: nuevo evento `lead.created` y `system.ping_failed`). Despliegue de la Edge Function: `supabase functions deploy notify` con OK de Jose.

**`20260917100800_realtime_admin_chat_conversations.sql`** (opcional): `alter publication supabase_realtime add table public.admin_chat_conversations;` para que la bandeja del admin se actualice sin polling. Solo si el admin lo necesita en la implementación.

### 6.3 RLS por rol (resumen)

| Tabla | anon | authenticated (propio) | admin |
|---|---|---|---|
| `blog_comments` | select `approved` | select approved + propios; insert `pending` propio | select/update/delete todo |
| `affiliates` | — | select/insert propio (`standard`) | select/update todo |
| `affiliate_rewards` | — | select propias | select/insert/update (`pending`→`paid`) |
| `upgrade_requests` | — | select/insert (`pending`) de su cliente | select/update todo |
| `leads` (+ columnas nuevas) | — | (afiliado: solo vía vista) | select/update todo; **insert** (política nueva `admin insert leads`); insert público solo service role (gateway) |
| `clients.invite_email` | — | RPC `claim_client_access` | update |

Tests RLS con tres cuentas (§8.4) cubren cada fila de esta tabla.

### 6.4 Advisors: línea base (2026-09-17, antes de cualquier migración nueva)

| Tipo | Nivel | Hallazgo | Qué hacemos |
|---|---|---|---|
| Seguridad | WARN | `extension_in_public`: `pg_net` instalado en `public` | Heredado. No se toca en v1 (moverlo exige `alter extension … set schema` y revisar `private.notify_event`); se anota como deuda para después del lanzamiento |
| Seguridad | WARN | `auth_leaked_password_protection` desactivada | Irrelevante para visitantes (OAuth y OTP, sin contraseñas). Activarla en el dashboard es un clic de Jose; recomendado |
| Rendimiento | WARN | `auth_rls_initplan` en `blog_posts.blog_posts_select` (`auth.uid()` sin `select`) | Heredado y sin uso (blog en MDX). No se toca |
| Rendimiento | INFO | `unindexed_foreign_keys` ×11 (`admin_chat_conversations.assigned_staff_id`, `admin_chat_messages.sender_id`, `blog_posts.author_id`, 7 de `forum_*`, `forum_thematics.created_by`) | Heredado; tablas con 0 filas. No se toca. Las tablas nuevas no añaden ninguno |
| Rendimiento | INFO | `unused_index` ×25 (todos los índices de leads, clients, client_*, commission_entries, forum, blog_posts, admin_chat) | Esperado: base sin tráfico. Se reevalúa a los 3 meses |

Criterio de aceptación de cada migración nueva: `get_advisors` después no añade **ningún** hallazgo de seguridad ni `auth_rls_initplan`/`unindexed_foreign_keys` nuevos; el único añadido esperado es `security_definer_view` para `affiliate_leads_view` (documentado en el ADR).

### 6.5 Sincronización con `pricing.json`

`pnpm pricing:sync-db` (`packages/pricing/scripts/sync-db.ts`, se ejecuta a mano en el Mac con `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`, nunca en CI): `upsert` en `pack_templates` por `code` (`nombre`, `descripcion`, `precio_base`, `orden`, `activo`) y en `pack_extras` por `code` (`nombre`, `descripcion`, `precio`, `activo`). Imprime el diff y pide confirmación. Es escritura en producción: **OK de Jose en sesión**.

---

## 7. Restricciones (consolidadas)

1. **Sin middleware/proxy Node** en `apps/web`: guards en layouts + re-comprobación en cada SA/RH; i18n por rewrites.
2. **El navegador nunca habla con Omen** (`worker.josecoded.com`) ni con n8n; solo el gateway con `WORKER_INTERNAL_TOKEN`. Umami es la única URL de Omen expuesta al navegador, en su propio túnel y sin datos privados.
3. **Cambios solo aditivos** en `apps/api` (rutas, bindings, middleware CORS con comodín), `josecoded-worker` (ninguno), Supabase (columnas, tablas, funciones, vista, un evento en la Edge Function). Ninguna tabla, columna, política ni trigger heredado se altera o borra. Las 28 migraciones heredadas se copian byte a byte.
4. **RLS** en toda tabla nueva; `service_role` solo en el gateway y en scripts locales; `apps/web` opera siempre con la sesión del usuario (publishable key). `get_advisors` (security + performance) antes y después de cada migración.
5. **Secretos**: nunca en `NEXT_PUBLIC_*` ni en el repo; `wrangler secret put` por Worker; `.dev.vars` y `.env.local` ignorados; CI con secretos de GitHub. Rotar `WORKER_INTERNAL_TOKEN`, token de Telegram y key de Resend (pendientes heredados) antes del lanzamiento.
6. **Producción con OK explícito en la sesión**: `wrangler deploy` (web y api), `supabase db push`/`apply_migration`, `supabase functions deploy`, `pricing:sync-db`, exponer `stats.josecoded.com`, cambiar `API_MODE`, alta de dominio `api.josecoded.com`. Las migraciones las aplica el controlador, no un subagente.
7. **Servicios de Omen intocables**: worker, n8n, Ollama, Samba, túnel `josecoded-worker`. Umami = contenedor y túnel nuevos.
8. `pnpm` únicamente; TypeScript estricto; WCAG 2.2 AA; móvil primero; solo oscuro; marca `josecoded` (nunca "Jose Dev": el prompt heredado del gateway `ai-reply.ts:4-7` dice "Jose Dev" y **se corrige** junto con `knowledge.json`, cambio aditivo previsto en la spec).
9. Precios y textos comerciales solo desde `Comercial/tarifas.md` → `pricing.json` y `Comercial/voz.md`.
10. Gmail solo borradores; Notion solo desde skills comerciales; ninguna de las dos se toca desde la web.

---

## 8. Estrategia de tests

### 8.1 Unidad e integración (Vitest 4.1.11)

| Paquete | Qué | Entorno | Ejemplos con datos |
|---|---|---|---|
| `packages/pricing` | Esquema de `pricing.json`; `priceForProposal`; `computeUpgrade`; `computeAffiliateReward`; parser de `tarifas.md` | node | P2→P3 = 1 100 €; P1→P4 = 3 300 €; P3→P3 = error; extras después = lista (SEO completo 600); base 1 400 → `standard` 140 €, `premium` 280 €, `client` `{type:'maintenance_months', amount:2}`; base excluye mensuales; `sync-from-tarifas` sobre el `tarifas.md` real produce exactamente el `pricing.json` commiteado (test de deriva) |
| `apps/web` lógica | Clasificador de reglas (fallback), `RefCapture` (cookie 30 días, ignora códigos inválidos), guards (`requireAdmin` con sesión mockeada), formateo de precios es/en, generación de JSON-LD, `hasTranslation` para alternates | node / happy-dom | "tienda con carrito" → P2; "panel de stock y facturas" → P3; "avisos por WhatsApp automáticos" → P4; "web de presentación" → P1 |
| `apps/web` componentes | Formularios (estados vacío/carga/error), generador (máquina de estados de 4 pasos), comentarios (pendiente visible solo al autor) | happy-dom + Testing Library | — |
| `apps/api` | Todas las rutas nuevas en **workerd real** (`@cloudflare/vitest-pool-workers`): Turnstile mockeado con `fetchMock`, `AI.run` sustituido por binding falso, KV y rate limit reales de Miniflare | workers | `proposals/generate` con IA que devuelve JSON válido → `pack:'P2', priceFrom:1650`; IA devuelve JSON inválido → `source:'rules'`; 11.ª petición del día → 429 `quota_exceeded`; `leads` con `affiliateCode` del propio email → 409 y lead creado sin afiliado; `leads` sin Turnstile ni server key → 403; `notifyLead` con worker 200/`ok:false` → respaldo Edge llamado |
| `apps/api` heredado | Los 13 ficheros Jest existentes se migran a Vitest (`jest.fn`→`vi.fn`, mismo `app.request`) y deben seguir en verde; es el test de no-regresión de los contratos conservados | workers | — |

### 8.2 E2E (Playwright 1.63, contra `wrangler dev` en CI y contra preview antes de merge)

| Escenario | Datos | Comprobación |
|---|---|---|
| Home sin scroll (móvil 390×844) | — | Tesis, dos vías y CTA visibles sin scroll; `h1` único; sin errores de consola |
| Generador → propuesta → enviar | businessType "restaurante", needs "carta y reservas online", salesMode `bookings`, timeline `one_month`; Turnstile en modo test (`1x00000000000000000000AA`) | Propuesta muestra "P2" y "desde 1.400 €"; al enviar, existe lead con `fuente='web_proposal'`, `ai_proposal.pack='P2'`; eventos Umami `proposal_generated` y `proposal_sent` interceptados |
| Contacto | nombre "Marta", email `marta@example.com`, mensaje | 201, lead `fuente='web_form'`, `contact_submit` |
| Afiliado | visita `/negocios?ref=ANA-TEST` → `RefNotice` una vez → contacto | cookie `ref=ANA-TEST` (30 días); una segunda visita con `?ref=BOB-TEST` no la sobrescribe; lead con `affiliate_code='ANA-TEST'`; con email del propio afiliado → lead creado con código y `meta.self_referral_suspect=true`, visible en el detalle del admin |
| Hero de presentación | primera visita a `/` (sin `hero_seen`), viewport 1280×800 y 390×844 | estado `boot` antes del primer paint (sin parpadeo del contenido), llega a `ready` en ≤ 3,3 s / ≤ 2,4 s; `localStorage.hero_seen` = hoy; recarga → sin animación; `Tab` durante `compiling` → `ready` en ≤ 200 ms; evento `hero_played {skipped}`; ruta interior `/negocios` nunca anima |
| Auth | Email+password de seed (Google/GitHub no se automatizan) | login, `/area-clientes` accesible, logout, `/area-clientes` redirige |
| Área de clientes | usuario A (cliente P2) | ve su proyecto, no ve el del cliente B (URL directa → 404); solicita P3 → "1.100 €"; aparece en admin como `pending` |
| Admin | Jose de seed (`staff_members.role='admin'`) | `/admin` con usuario normal → 404; con Jose → bandeja; marcar lead cobrado con `monto` 1 400 y afiliado `standard` → recompensa 140 € `pending`; marcar abonada → afiliado la ve `paid` |
| Blog | artículo de seed | JSON-LD `BlogPosting` presente; comentar sin sesión → CTA login; con sesión → "pendiente" visible solo al autor; admin aprueba → visible anónimo |
| Chat | usuario de seed; gateway con `AI` falso | mensaje aparece; respuesta del asistente llega por realtime; admin ve la conversación y desactiva IA |
| SEO | — | `/services` → 301 a `/empresas`; `/blog/viejo-slug` → 410; `/foro/x` → 410; `/en/...` con `hreflang`; `sitemap.xml` incluye ambos idiomas; `robots.txt` permite `GPTBot` y bloquea `/admin` |
| Reduced motion | `prefers-reduced-motion: reduce` | Lenis no instanciado, hero directamente en `ready` (sin "Repetir presentación"), `CompileReveal` y transiciones desactivados, `FocusLight` fijo; navegación por teclado completa |

### 8.3 Snapshots de JSON-LD

`apps/web/tests/jsonld.test.ts`: renderiza `generateJsonLd()` de cada tipo de página (home, empresas, negocios, proyecto, artículo, sobre mí) y compara con snapshots versionados; además valida cada bloque contra `schema-dts` (tipos) y con un validador estructural (`jsonld` + shapes mínimas: `Person.sameAs` es array de URLs, `Offer.priceSpecification.price` = número de `pricing.json`, `BlogPosting.author.name='Jose…'`). Cambiar un precio en `pricing.json` rompe el snapshot a propósito.

### 8.4 RLS con tres cuentas

`supabase start` (CLI, Docker) en CI y local; aplica `supabase/schema/baseline.sql` (dump del esquema real, H6) + las migraciones nuevas; `supabase/seed/seed.sql` crea: `jose@test` (admin), `ana@test` (cliente P2 + afiliado `standard`), `bob@test` (usuario sin cliente, afiliado `premium`), 2 leads (uno atribuido a Ana), 1 recompensa, 2 comentarios (pending/approved), secreto `notify_shared_secret` en `vault`. `apps/web/tests/rls.test.ts` abre tres clientes `supabase-js` con JWT de cada cuenta (login por password) y afirma, por tabla, lo que dice §6.3: Ana no lee `clients` de Bob (0 filas), Bob no inserta `upgrade_requests` (sin cliente), Ana no puede insertar `affiliate_rewards`, Ana no puede cambiar `affiliates.level`, anon lee solo comentarios `approved`, Ana ve su comentario `pending` y no el `pending` de Bob, Ana (afiliada) lee `affiliate_leads_view` sin `contact_email`, Jose lee y actualiza todo. Se ejecuta también con `as_level` equivalente vía `get_advisors` tras aplicar en producción.

### 8.5 Lighthouse CI

`lighthouserc.json`: URLs `/`, `/negocios`, `/empresas`, `/proyectos`, `/blog/<seed>`, `/en`; preset móvil, 3 pasadas; asserts `categories:performance >= 0.9`, `accessibility >= 0.95`, `seo == 1`, `best-practices >= 0.9`, `largest-contentful-paint <= 2500`, `cumulative-layout-shift <= 0.1`, `total-blocking-time <= 200`; falla el PR si no cumple. Corre contra `wrangler dev` (workerd local) para aproximar el runtime real.

### 8.6 Qué no se testea y por qué

- El worker de Omen: repo aparte, sin cambios, sin tests propios; se testea el **contrato** desde el gateway con `fetchMock` (formato `{ok, data}` real documentado en §4).
- Login OAuth real de Google/GitHub en E2E: depende de terceros y captchas; se cubre con email+password y con una prueba manual en la puerta de calidad.
- Workers AI real: no determinista y con coste; se usan bindings falsos con salidas fijas (válida, inválida, timeout). Una prueba manual de humo con el modelo real en preview antes de merge de la rama del generador.
- Cal.com real: se testea el RH con un payload grabado y firma calculada; la reserva real es manual.
- Umami/CF Web Analytics: solo se intercepta que la web **emite** los eventos; no se comprueba el servidor de Umami.
- Rendimiento de shaders en GPU real: Lighthouse en CI corre sin GPU; se verifica a mano en un móvil Android de gama media en la puerta de calidad (`qa`).

---

## 9. Variables de entorno y secretos

### `apps/web` (Worker `josecoded-web`)

| Nombre | Tipo | Dónde vive | Uso |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | var pública | `wrangler.jsonc` `vars` / `.env.local` | canonical, OG, sitemap |
| `NEXT_PUBLIC_JOSECODED_API_URL` | var pública | idem (`https://api.josecoded.com`) | fetch al gateway |
| `NEXT_PUBLIC_SUPABASE_URL` | var pública | idem | `@supabase/ssr` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | var pública | idem | `@supabase/ssr` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | var pública | idem | widget |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | var pública | idem | tracker |
| `NEXT_PUBLIC_CF_BEACON_TOKEN` | var pública (opcional) | idem | Web Analytics si no hay inyección automática |
| `NEXT_PUBLIC_CAL_LINK` | var pública | idem (`josecoded/20min`) | embed |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | var pública | idem | `wa.me` |
| `TURNSTILE_SECRET_KEY` | **secret** | `wrangler secret put` / `.dev.vars` | SA de comentarios |
| `SERVER_KEY` | **secret** | idem | cabecera `x-josecoded-server-key` hacia el gateway (webhook Cal.com) |
| `CALCOM_WEBHOOK_SECRET` | **secret** | idem | HMAC del webhook |
| `GITHUB_TOKEN` | secret de **build** (GitHub Actions) | Actions | `scripts/github.ts` (no llega al worker) |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo local** | `.env.local` del Mac | `pricing:sync-db`, seeds; **nunca** en el worker web ni en CI |
| `WORKER_INTERNAL_TOKEN` | **solo local** (opcional) | `.env.local` | `blog-ai.ts` directo a Omen |

Validación con zod en `apps/web/lib/env.ts` (`server` / `client`), fallo de build si falta algo.

### `apps/api` (Worker `josecoded-api`)

Heredadas (sin cambio): `API_MODE`, `WORKER_URL`, `CORS_ORIGINS`, `ADMIN_SUPERUSER_ID`, `ADMIN_SUPERUSER_EMAIL` (vars); `WORKER_INTERNAL_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (o `SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `N8N_CHAT_WEBHOOK_URL`, `N8N_CHAT_WEBHOOK_SECRET`, `DEV_API_KEY` (secrets); bindings `AI`, `AI_RATE_LIMITER`.

Nuevas (todas declaradas en `envSchema`):

| Nombre | Tipo | Uso |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | secret | `proposals/generate`, `leads` |
| `SERVER_KEY` | secret | auth servidor-a-servidor de `leads` |
| `NOTIFY_SHARED_SECRET` | secret | vía primaria del aviso por Edge Function (mismo valor que `vault.notify_shared_secret` y que el env de la función) |
| `N8N_LEAD_WEBHOOK_ENABLED` | var (`false`) | activa el paso opcional n8n `lead-created` (P3) |
| `PROPOSALS_DAILY_LIMIT_IP`, `PROPOSALS_DAILY_LIMIT_ALL` | var (`10`, `300`) | cuotas |
| `AI_PROPOSAL_MODEL` | var (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) | modelo |
| `AI_GATEWAY_ID` | var (opcional) | AI Gateway |
| `ALLOWED_TURNSTILE_HOSTNAMES` | var (`josecoded.com,localhost`, + sufijo `.workers.dev`) | verificación |
| `QUOTA_KV` | binding KV | cuotas y propuestas 24 h |
| `LEADS_RATE_LIMITER`, `AFFILIATE_RATE_LIMITER` | bindings ratelimit | límites |

### `packages/pricing`

Ninguna en runtime. `scripts/sync-from-tarifas.ts` lee `TARIFAS_PATH` (default la ruta del vault en iCloud) y escribe `pricing.json`; `sync-db.ts` usa `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`.

### Supabase (Edge Function `notify`)

Heredadas: `NOTIFY_SHARED_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`. Nueva: `ADMIN_NOTIFY_EMAIL` (destino del email de respaldo de leads). `vault` con `notify_shared_secret`.

### Omen

Sin cambios en el worker. Umami: `.env` del compose (`DATABASE_URL`, `APP_SECRET`) en `/srv/josecoded-data/umami/`, fuera del repo.

---

## 10. Riesgos técnicos y mitigación

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Worker web supera 3 MiB comprimido (plan Free) | Media | Bloquea deploy en Workers | Tarea 0 mide; sin MDX runtime, sin ISR, `serverExternalPackages` mínimos, `supabase-js` sin realtime en servidor (`realtime` solo en cliente); si no basta: Workers Paid (5 $/mes) o fallback Vercel (P1) |
| next-intl sin proxy (rewrites + `as-needed`) tiene un caso roto (p. ej. `not-found` de raíz, `/en` sin barra) | Media | URLs duplicadas o 404 | Tarea 0 incluye matriz de URLs (`/`, `/en`, `/negocios`, `/en/negocios`, `/es/x`→308, `/x` inexistente→404 localizado); test E2E "SEO" la fija |
| JSON mode de Workers AI falla o el modelo clasifica mal | Media | Propuesta absurda | Fallback por reglas; `temperature 0.2`; regla "en duda, el menor pack"; `source` visible en admin para revisar; Umami mide `source:'rules'` |
| Coste/abuso de Workers AI | Baja | Coste | Turnstile + rate limit nativo + cuota diaria KV + aviso Telegram al 80 % + AI Gateway con tope |
| Omen apagado | Alta (es un PC doméstico) | Sin aviso n8n, sin Umami | Respaldo Edge Function (Telegram directo); Umami tolerante; nada público depende de Omen |
| Supabase pausado (ya ocurrió) | Alta | Auth, leads, comentarios caídos | Restaurar ahora; `supabase-ping.yml` semanal con alerta; formulario con fallback: si el gateway devuelve 5xx, la web muestra `mailto:` y WhatsApp |
| Triggers heredados de `leads` con efectos al cerrar (`monto` obligatorio, alta de `clients`) | Media | Errores confusos en admin | Admin exige `monto` antes de "cerrar"; mensaje claro; test E2E de cierre; documentado en el ADR |
| Afiliado ve datos de contacto de leads por una política demasiado amplia | Media | Fuga de PII | Vista sin PII y sin política de select sobre `leads` para afiliados; test RLS explícito; `get_advisors` |
| Leads falsos con `?ref=` para inflar recompensas | Baja | Ruido | Turnstile + rate limit; recompensa solo al marcar **cobrado** a mano; sin autoreferidos; un lead un afiliado |
| Migración Jest→Vitest rompe tests heredados | Baja | Tiempo | Tarea aislada; si un test resiste, se mantiene Jest para `apps/api` (decisión reversible) |
| Refresco de sesión sin middleware (RSC no escribe cookies) | Baja | Usuario "deslogueado" tras expirar el access token en una página estática | Cliente de navegador refresca y reescribe cookies; SA/RH refrescan en servidor; tokens de 1 h; test manual en `qa` |
| Scraping de Google Play deja de funcionar | Alta a medio plazo | Dato desactualizado | Valor commiteado como respaldo, build no rompe, aviso en CI |
| Estética "IA" | Media | Rechazo | Fuera de este doc: `ui` con 3 direcciones en HTML real y lista negra (D12) |
| Deriva `tarifas.md` ↔ `pricing.json` | Media | Precio erróneo en web | Test de deriva en `packages/pricing` que parsea el `tarifas.md` real (solo en el Mac; en CI se salta si el vault no está) + `pricingVersion` en cada propuesta y solicitud |

### Preguntas abiertas para Jose — resueltas el 2026-09-17

| # | Pregunta | Decisión |
|---|---|---|
| P1 | Plan de Workers | **Free**: el worker web debe caber en 3 MiB comprimidos. La tarea 0 lo mide; si no cabe, fallback Vercel sin cambiar código |
| P2 | Supabase pausado | Restaurado por el controlador con `restore_project` (OK explícito de Jose en sesión). Esquema real verificado en §6 tras la restauración |
| P3 | Vía primaria del aviso de lead | **Invertida**: Edge Function `notify` (evento `lead.created`) es la primaria; n8n `lead-created` queda opcional para automatizaciones posteriores. Actualiza D9 de la spec |
| P4 | Frescura de GitHub/stores | Deploy automático diario **solo** cuando cambian `content/generated/*` (excepción acotada al gate de producción; el workflow no toca nada más) |
| P5 | Dominio del gateway | Alta de `api.josecoded.com` como custom domain del worker `josecoded-api`. `NEXT_PUBLIC_JOSECODED_API_URL=https://api.josecoded.com`. La URL `workers.dev` sigue respondiendo durante la transición |
| P6 | Umami `call_booked` y AI Gateway | Aprobados: sexto evento en D11 y Cloudflare AI Gateway delante del generador en D5 |

### Preguntas nuevas tras la verificación (2026-09-17, tarde)

- **P7.** Valor actual de `NEXT_PUBLIC_JOSECODED_API_URL` en producción de josedev (URL `workers.dev` del gateway) para el 301 y la lista CORS de transición.
- **P8.** Resend: ¿hay cuenta y dominio `josecoded.com` verificado? Si no, el email de respaldo de `lead.created` se omite en v1 (Telegram basta) y solo se rebrandea `EMAIL_FROM`.
- **P9.** Dos tareas de dashboard de Supabase antes de la rama de auth: plantilla de email OTP con `{{ .Token }}` (código de 6 cifras, UX §5) y activar "Leaked password protection" (advisor).
- **P10.** El doc de `ux` sigue nombrando `admin_superusers` (§2.3, §7, §8.4) y describe el insert de leads por "RLS anónima" y `leads.status=closed` (§9.1, §9.9): pedir a `ux` que lo alinee con H1, H2 y §6.2 (`staff_members.role='admin'`, gateway `POST /leads`, `estado='cerrado'` + `paid_at`, RPC `admin_close_lead_paid`).

## Anexo — notas para `ESTADO.md`, la nota del vault y el ADR (no aplicadas)

- **Vault (`Proyectos/josecoded.md`)**: decisiones de este documento: admin = `staff_members.role='admin'` (no existe `admin_superusers`); leads públicos solo vía gateway con service role (sin insert anónimo; el admin inserta a mano por política propia); i18n por rewrites sin proxy; `@next/mdx` en build; **sin canvas ni WebGL** (motion GSAP: ScrambleText, Flip, ScrollTrigger; Lenis solo en el panel central de escritorio); Edge Function `notify` como vía primaria del aviso de lead; Cal.com; Umami en túnel propio; afiliados/ampliaciones por Supabase con RLS; migraciones heredadas no se copian (baseline + `apply_migration` por MCP); Vitest 4.1 + pool-workers; RSS en v1.
- **`ESTADO.md`**: pendientes de Jose: alta `api.josecoded.com`; rotar `WORKER_INTERNAL_TOKEN`, token de Telegram y key de Resend; activar CF Web Analytics; crear widget Turnstile; cuenta Cal.com con webhook; plantilla OTP y leaked-password en Supabase (P9); responder P7–P8; `ux` corrige `admin_superusers` y el flujo de leads (P10). Línea base de advisors anotada (§6.5). Siguiente paso: `ui` (3 direcciones en HTML real) → plan del `arquitecto`.
- **ADR (codebase-memory, tras el primer commit con código)**: "Leads públicos se crean únicamente desde el gateway con service role; `leads` solo tiene política de INSERT para admin" · "Sin proxy.ts: i18n por rewrites, guards en layouts + SA" · "Sin ISR: contenido público SSG, datos externos y del build en `content/generated/`" · "Triggers heredados de `leads` (cierre crea `clients`, exige `monto`) se conservan; el cierre cobrado va por RPC `admin_close_lead_paid`" · "Historial de migraciones remoto (47 versiones) ≠ ficheros de josedev (28): baseline dump + solo migraciones nuevas, aplicadas con `apply_migration`" · "`affiliate_leads_view` es SECURITY DEFINER a propósito (sin PII para afiliados)".
