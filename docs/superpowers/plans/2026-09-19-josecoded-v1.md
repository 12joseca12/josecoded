# josecoded v1 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Fecha:** 2026-09-19 · **Perfil:** web · **Versión:** 1.0 · **Autor:** `arquitecto`
**Insumos:** spec v1.5.2 (`docs/superpowers/specs/2026-09-13-josecoded-plataforma.md`), UX v3.2 (`docs/superpowers/design/2026-09-17-josecoded-ux.md`), diseño técnico v1.2.1 (`docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md`, en adelante **DT**), `ESTADO.md`, prototipo del hero (`docs/superpowers/design/ref/hero-lab-3/`), `Comercial/tarifas.md` v2 del vault, y el documento de `ui` v3 (`docs/superpowers/design/2026-09-17-josecoded-ui.md`, **en redacción en paralelo**: las tareas de interfaz lo citan como insumo; si aún no está cuando arranque una tarea, el implementador usa los tokens y parámetros del prototipo `hero-lab-3` y `ui` revisa después).

**Goal:** Publicar josecoded v1 completa (público + área de clientes + admin + Radar) en Cloudflare Workers sobre el gateway, Supabase y Omen existentes, sin reescribir nada heredado.

**Architecture:** Monorepo pnpm con `apps/web` (Next.js 16 App Router en Workers vía OpenNext, sin middleware Node), `apps/api` (el gateway Hono existente, movido, con rutas aditivas y Cron Triggers), `packages/{config,pricing,glyph-scene,radar-core,radar-connectors}` y `supabase/` (baseline de solo lectura + migraciones aditivas). El único WebGL es `packages/glyph-scene`, cargado por `import()` tras el LCP. Radar vive en el gateway (núcleo, cron, Telegram, Google) con conectores enchufables que también corren en Omen (`radar-runner`) y en el Mac (`/radar-indeed`).

**Tech Stack:** pnpm 11.2.2 · Node 22 · turbo 2.10 · Next 16.3.5 · React 19.3 · `@opennextjs/cloudflare` 1.20.6 · wrangler 4.133 · Tailwind 4.3 · shadcn 4.21 · GSAP 3.15 (núcleo + ScrollTrigger) · three (versión fijada en 0.2) · next-intl 4.14 · `@next/mdx` · `@supabase/ssr` 0.12 / `supabase-js` 2.116 · Hono 4.13 · zod 4.6 · Vitest 4.1.11 + `@cloudflare/vitest-pool-workers` 0.22 · Playwright 1.63 · Lighthouse CI 0.15 · TypeScript 5.9.3. Versiones completas en DT §1.2.

## Restricciones globales (aplican a todas las tareas)

- **Nada heredado se reescribe**: `josecoded-api` (rutas `v1`, `v1-protected`, `forum`, `admin-chat`, `health`, `system` intactas), `josecoded-worker` (sin cambios, ni por Radar), esquema Supabase (solo migraciones aditivas), dominio y cuenta Cloudflare. Contratos existentes intocables (spec §7, DT §7).
- **Sin middleware/proxy Node** en `apps/web`: guards en layouts server-side + re-comprobación en cada Server Action y route handler; i18n por rewrites (DT §1.4, §1.7).
- **El navegador nunca habla con Omen ni con n8n**; solo el gateway. Umami es la única URL de Omen expuesta (DT §7.2).
- **Producción con OK explícito de Jose en la sesión** (tareas marcadas **GATE**): `wrangler deploy`, `apply_migration`, `supabase functions deploy`, `pricing:sync-db`, exponer `stats.josecoded.com`, cambiar `API_MODE`, alta de `api.josecoded.com`, `setWebhook` de Telegram, contenedores y workflows en Omen, plist de launchd en el Mac, `wrangler secret put` en Workers de producción. **Las migraciones las aplica el controlador, no un subagente**, con `list_tables` y `get_advisors` antes y después (DT §6.2, §11.1).
- **Servicios preexistentes de Omen intocables** (worker, n8n, Ollama, Samba, túnel `josecoded-worker`). Solo contenedores y workflows **nuevos**.
- **Gmail solo borradores, nunca `send`**; **Google Calendar nada sin clic de Jose**; **Radar: ningún `sent` sin `confirmed_by_jose`** (tres invariantes con test, DT §11).
- **Secretos**: nunca en `NEXT_PUBLIC_*`, en el repo ni en `apps/web` para Radar; `wrangler secret`, `.dev.vars`/`.env.local` ignorados, credential store de n8n, `.env` de Omen fuera del repo.
- **Presupuestos del hero (spec §12.3):** chunk de la escena ≤ 200 KB gz; JS de la home sin escena ≤ 350 KB gz; vídeo ≤ 400 KB, poster ≤ 60 KB, sprites ≤ 80 KB; LCP ≤ 1,2 s escritorio / ≤ 2,5 s móvil 4G y elemento LCP = `h1` o `img.hero-media__poster`; worker web < 2,5 MiB comprimidos (Workers Free: 3 MiB).
- **Calidad:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde en cada tarea; Lighthouse móvil ≥ 90/95/100; WCAG 2.2 AA; solo modo oscuro; móvil primero; marca `josecoded` (nunca "Jose Dev").
- **Textos**: español para UI (voz de `Comercial/voz.md`), inglés para identificadores, ficheros y commits. Nada publicado sin contenido real: un bloque con `{{DATO}}` sin cubrir **no se renderiza** (UX §18).
- **Precios** solo desde `packages/pricing/pricing.json` (generado de `Comercial/tarifas.md` v2, vigencia 2026-09-14). El "desde" nunca suma extras (DT H8).
- Aplicar `vercel-react-best-practices` en todo React y pasar `web-design-guidelines` antes de cerrar cualquier tarea con UI.

## Cómo se ejecuta este plan

- **Una tarea = una invocación** de `implementador-web` (o `implementador-infra` en la fase 8), con TDD: test que falla → implementación mínima → test en verde → commit. Después de cada tarea, `revisor` (solo lectura) sobre el diff; los hallazgos se corrigen antes de la siguiente.
- **Al final de cada rama**, `revisor` sobre la rama completa y `/puerta-calidad` (`qa`, `revisor-seguridad`, `revisor-accesibilidad`, `usuario-ejemplo` en paralelo; en ramas sin interfaz los dos últimos devuelven "no aplica"). Se repite hasta que los cuatro pasan; entonces merge a `main`.
- **Insumo `ui` v3**: las tareas de interfaz (2.2 en adelante) toman tokens, tipografías, componentes y estados del documento de `ui`. Si aún no existe cuando toque, se implementa con los valores del prototipo `hero-lab-3` (`styles.css`) y `ui` revisa la implementación en la puerta de la rama.
- **Pointers al DT**: cuando una tarea dice "copiar literalmente de DT §x", ese apartado contiene el bloque completo (SQL, JSON schema, tabla de endpoints, interfaz TS). El implementador lo copia tal cual; no lo reinterpreta.
- **Comandos** (definidos en la tarea 1.1): raíz `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`; por paquete `pnpm --filter <nombre> test -- <patrón>`; `pnpm --filter api test` corre en workerd; `pnpm --filter web e2e` Playwright contra `wrangler dev`.
- **Commits** pequeños con Conventional Commits (`feat(web): …`, `feat(api): …`, `chore: …`, `test: …`, `infra: …`); nunca se commitea `.eml`, `.dev.vars`, `.env.local` ni medios sin pasar `hero:media:check`.

## Ramas sugeridas

| Fase | Rama | Puerta |
|---|---|---|
| 0 | `spike/t0-opennext`, `spike/t0-hero`, `spike/t0-radar` (no se mergean; los resultados van a `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` en `main`) | `revisor` sobre el documento de resultados |
| 1 | `chore/monorepo` | `/puerta-calidad` (sin UI: `qa` + `revisor-seguridad`) |
| 2 | `feat/shell-home` (+ `feat/glyph-scene` en paralelo, se mergea en `feat/shell-home` antes de 2.8) | `/puerta-calidad` completa + revisión de `ui` contra el prototipo |
| 3 | `feat/public-pages`, `feat/generator-leads` | `/puerta-calidad` completa (Marta) |
| 4 | `feat/auth-blog-chat` | `/puerta-calidad` completa (Dani) |
| 5 | `feat/client-area` | `/puerta-calidad` completa (cliente) |
| 6 | `feat/admin` | `/puerta-calidad` completa (Jose operador) |
| 7 | `feat/radar-core` (paquetes + migraciones), `feat/radar-connectors`, `feat/radar-api`, `feat/radar-admin`, `feat/radar-mail-calendar` | `/puerta-calidad` por rama; `usuario-ejemplo` como Jose operador y como reclutadora |
| 8 | `infra/omen` (ficheros de referencia en `infra/`; lo aplica `implementador-infra` en Omen con OK) | `revisor-seguridad` |
| 9 | `release/v1` | `/puerta-calidad` final sobre la preview con todo mergeado |

## Estimación relativa y camino crítico

| Fase | Tareas | Estimación | Notas |
|---|---|---|---|
| 0 Validaciones | 6 | M | Todas en paralelo; 0.1 bloquea todo lo demás; 0.2 bloquea 2.5–2.9; 0.3–0.6 bloquean conectores concretos |
| 1 Monorepo | 9 | M | 1.9 es GATE (migraciones no-Radar en producción) |
| 2 Shell + home + hero + i18n + SEO/GEO | 15 | XL | `packages/glyph-scene` (2.5a, 2.5b, 2.6) en paralelo con 2.1–2.4 |
| 3 Páginas públicas + generador + leads + contacto | 12 | L | 3.7–3.8 (gateway) en paralelo con 3.2–3.6 (páginas) |
| 4 Auth + blog + chat | 4 | L | 4.1 bloquea 5.x, 6.x y 7.25+ |
| 5 Área de clientes + afiliados | 5 | M | |
| 6 Admin | 6 | L | 6.1 bloquea 7.25+ |
| 7 Radar | 31 | XL | 7.1–7.5 y 7.8–7.15 (paquetes) pueden empezar tras la fase 1; 7.16+ (gateway) tras 7.7; 7.25+ (web) tras 6.1 |
| 8 Infra Omen | 3 | S | Tras 1.x; cada tarea con OK de Jose |
| 9 Lanzamiento | 6 | M | 9.6 GATE |

**Camino crítico** (todo lo demás se solapa): 0.1 → 1.1 → 1.5 → 2.1 → 2.3 → 2.8 (que espera a 2.5b + 2.6 + 2.7) → 2.13 → 3.9 → 4.1 → 6.1 → 7.7 → 7.16 → 7.17 → 7.18 → 7.19 → 7.25 → 7.26 → 7.30 → 7.31 → 9.5 → 9.6. Radar es ≈ 40 % del total (spec §13.9) y va al final del camino; lo que lo acorta es arrancar `feat/radar-core` y `feat/radar-connectors` justo después de la fase 1, en paralelo con las fases 2–6.

**Válvula de escape (spec §13.9, no decidida):** como Radar solo vive en `/admin`, si el plazo se dispara Jose podría abrir el público con las fases 0–6 + 8.1 + 9 y con Radar solo hasta 7.19 + 7.25 (núcleo, migraciones, un conector y bandeja con Telegram), completando el resto sobre la misma producción. Eso reabriría D17 y **lo decide Jose, no este plan**. El orden de las tareas de la fase 7 ya está pensado para que ese corte sea limpio.

## Insumos que faltan de Jose y dónde bloquean

| Insumo | Bloquea | Hasta entonces |
|---|---|---|
| Nombre a mostrar (UX §18.1; tildes, segundo apellido) | 2.7 (`h1` partido), 2.8 (presupuesto móvil), 2.11 (JSON-LD `Person`) | El `h1` usa "Jose Carlos Sánchez" del prototipo con `{{DATO}}` marcado en `messages/es.json`; la tarea 2.8 no se cierra sin el dato |
| Datos §18 de UX (2–15: ciudad, años, estado de 3catinfo/HazmeFila/Oportunix, webs de comercios, certificaciones, empleos, disponibilidad, repo público, WhatsApp y email, usuario GitHub, cuentas de stores) | 2.10 (`ProofStrip`, `PathPanel`, "Quién te responde"), 3.1 (fichas), 3.2, 3.4, 3.5, 3.10 (WhatsApp), 3.11 | Los bloques sin dato no se renderizan; `usuario-ejemplo` los reporta como huecos en la puerta de la fase 3 |
| Decisión §13.20 del hero (A/B/nada) | 2.8 | **Resuelta en spec v1.5.2: alternativa B** (subtítulo por audiencia sin tecnologías, CTAs como el prototipo). La frase final la fija `redactor` con `voz.md` |
| Documento `ui` v3 (tokens, tipografías, componentes, §13.16–13.18, §13.21 indicador de la escena) | 2.2 en adelante | Valores del prototipo; `ui` revisa en la puerta |
| `Comercial/voz.md` con los tres ejemplos corregidos | 2.10, 3.x (copy), 7.5 (`voice.radar.md`) | Se usa la versión actual; `redactor` revisa el copy cuando Jose corrija los ejemplos |
| Textos legales (aviso, privacidad, cookies) | 3.6 | Se portan los de josedev con marca `josecoded`; Jose los valida |
| Retrato para Sobre mí (UX §13.4) | 3.5 | Sin foto, el bloque muestra solo texto |
| OAuth Google y GitHub en el dashboard de Supabase; plantilla OTP con `{{ .Token }}`; "Leaked password protection" (DT P9) | 4.1 (login real) | Los E2E usan email + contraseña de seed; la prueba manual de OAuth queda para la puerta de la fase 4 |
| Widget Turnstile (site key + secret) | 3.12 (gate); 3.9/3.10 en preview | En dev y CI, claves de test de Cloudflare (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) |
| Cuenta Cal.com, evento "20 min", webhook `BOOKING_CREATED` + secreto | 3.11 (RH real), 3.12 | Test del RH con payload grabado y firma calculada |
| Resend: cuenta y dominio `josecoded.com` verificado (DT P8) | 3.8 (email de respaldo de `lead.created`) | Se omite el email; Telegram basta |
| URL `workers.dev` actual del gateway de josedev (DT P7) | 9.1 (301 y CORS de transición) | — |
| `GITHUB_TOKEN` en Actions (o PAT) | 3.1 (`scripts/github.ts`, calendario de contribuciones) | Fallback al JSON commiteado; sin calendario de contribuciones |
| Cloudflare Web Analytics activado en la zona (2 min) | 9.2 | — |
| **Radar:** `content/profile.json` rellenado (Q10, plantilla de 12 campos) | 7.17 (puntuación real), 7.28 (perfil en admin) | Tests con `profile.test.json`; en producción, `radar_missing_profile` hasta rellenarlo |
| **Radar:** CV maestro es/en con ids de sección (Q15) | 7.21 (materiales reales) | Plantilla `cv.master.es.md` con secciones de ejemplo; el verificador de hechos bloquea confirmaciones hasta que exista el maestro real |
| **Radar:** proyecto OAuth de Google "josecoded-radar" (Q11/P14): client id + secret, redirect `https://api.josecoded.com/api/v1/radar/google/callback` | 7.31 (gate) y uso real de 7.20/7.22/7.23 | Tests con `fetchMock`; en producción `google_status='unauthorized'` |
| **Radar:** ≥ 12 correos reales (`.eml` o export) para fixtures (DT §11.10) | 7.22 (parser y linker con datos reales) | El script `anonymize-email.ts` y 4 fixtures sintéticas permiten desarrollar; la puerta de `feat/radar-mail-calendar` exige las reales |
| **Radar:** alertas diarias de empleo de LinkedIn al Gmail | 7.22 (conector `linkedin-email` en vivo) | Fixtures |
| **Radar:** alta de aplicación en InfoJobs (Q14) | 0.3, 7.10 | `can_submit=false`, conector `no_credentials` |
| **Radar:** API key de Upwork (Q14) | 7.15 | Conector opcional; puede llegar tras el lanzamiento |
| **Radar:** cuentas en Tecnoempleo, Workana, Malt | 7.11, 7.12, 7.14 (solo para recibir correos y candidaturas; el descubrimiento no exige cuenta) | — |
| **Radar:** MCP de Indeed disponible en `claude -p` (0.5); Mac con `claude` autenticado | 7.9, 7.31 (plist) | `/radar-indeed` a mano en sesión |
| **Radar:** token del bot de Telegram para el gateway; `chat_id` ya está en `staff_members` | 7.31 | Tests con `fetchMock` |
| Rotar `WORKER_INTERNAL_TOKEN`, token de Telegram y key de Resend (pendientes heredados) | 9.4 | — |

## Riesgos del plan y cómo se detectan pronto

| Riesgo | Se detecta en | Señal / acción |
|---|---|---|
| OpenNext no soporta algo de Next 16.3 sin proxy, o el worker no cabe en 3 MiB | **0.1** (antes de escribir nada) | Fallo de a–e o tamaño > 2,5 MiB → fallback Vercel documentado en `ESTADO.md` y ADR; el gateway sigue en Workers |
| Chunk de `three` > 200 KB gz | **0.2** y test `check-hero-bundle` en CI desde 2.9 | Orden de renuncias: bloom → reflejo → ondas; nunca se sube el presupuesto |
| Medios del hero irreproducibles (SwiftShader, ffmpeg, PSNR < 35) | **0.2** | Poster desde captura única + vídeo diferido: `HeroMedia` en modo solo poster (spec §12.2 lo admite) |
| Envío por API de InfoJobs no disponible para candidatos | **0.3** | `can_submit=false` en la fila; flujo asistido (ya cubierto por 7.18) |
| Browser Rendering no disponible en Free | **0.4** | Impresión en navegador (`/admin/radar/[id]/cv/print`) como única vía; la ruta `materials/:id/pdf` responde 503 |
| MCP de Indeed no ejecutable en `claude -p` | **0.5** | Indeed manual desde sesión; la ingesta es la misma |
| Feed de Tecnoempleo inexistente o cambia | **0.6**; snapshot de fixture en 7.11 | Listado HTML con `HTMLRewriter` |
| Workers Free corta el `sweep` (CPU por invocación) | **7.17** (test de tiempo por tick con IA falsa) y primera semana en producción (Workers Logs) | Reducir `RADAR_BATCH_*`; si no basta, Workers Paid como decisión de Jose |
| `ui` v3 llega tarde o cambia tokens | **2.2** | La rama 2 se implementa con el prototipo; `ui` revisa en la puerta; los tokens viven en un solo fichero (`globals.css`) |
| Insumos de Jose tardíos (nombre, datos §18, CV maestro, OAuth) | Cada tarea marca el insumo | Bloques no renderizados y estados `no_credentials`/`unauthorized` visibles; nunca datos inventados |
| Deriva entre `baseline.sql` y producción | **1.6** (test que compara el número de tablas y políticas del baseline con `list_tables` del MCP la primera vez) y 1.9/7.7 (`get_advisors` antes y después) | Regenerar el dump antes de cada gate de migración |
| Migración Jest → Vitest rompe tests heredados | **1.3** | Decisión reversible: `apps/api` mantiene Jest para lo heredado y Vitest para lo nuevo |
| Cuenta de LinkedIn restringida | 7.13 (scraping apagado 2 semanas) | `detectBlock` + interruptor; `linkedin-email` desde el día 1 |
| Google en modo prueba caduca cada 7 días | 7.23 (recordatorio día 6) | Reautorización desde admin (7.27) |
| Alcance sin MVP se dispara | Al cerrar la fase 6 con Radar por debajo de 7.19 | Válvula de escape de arriba; lo decide Jose |

---

## Fase 0 — Validaciones (tareas 0) · Estimación M · rama `spike/t0-*`

Cada tarea 0 produce una sección en `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` (commit en `main`) con: qué se probó, comandos, medidas, **veredicto** (éxito / fallback) y qué decisión queda anotada para `ESTADO.md`. El código de los spikes vive en su rama `spike/*` y no se mergea. `revisor` revisa el documento de resultados, no el código.

### Tarea 0.1 — OpenNext en Workers Free sin middleware Node

**Agente:** implementador-web · **Rama:** `spike/t0-opennext` · **Gate:** no (crea un Worker de pruebas `josecoded-web-t0` con `wrangler versions upload`; no toca producción; avisar a Jose de que existe y borrarlo al terminar) · **Depende de:** —

**Objetivo:** demostrar con un despliegue real que Next 16.3.5 + `@opennextjs/cloudflare` 1.20.6 funciona en Workers Free con todo lo que la web necesita y sin `proxy.ts` (DT §1.3 "Tarea 0").

**Ficheros (en el spike):**
- Crear: `apps/web/` mínimo con `package.json`, `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc` (DT §1.3, nombre `josecoded-web-t0`), `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `app/[locale]/cookie-demo/page.tsx` (Server Action que escribe y lee una cookie), `app/[locale]/(private)/demo/layout.tsx` (lee sesión con `@supabase/ssr` y hace `redirect`), `app/api/hmac-demo/route.ts` (POST que lee `await req.text()` y devuelve el sha256), `app/[locale]/mdx-demo/page.mdx`, `i18n/routing.ts`, `i18n/request.ts`.
- Crear: `apps/web/e2e/t0-matrix.spec.ts`.
- Documentar: `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` §0.1.

**Pasos:**
- [ ] 1. Escribir el test E2E de la matriz de URLs (falla porque no hay app):
```ts
// apps/web/e2e/t0-matrix.spec.ts
import { test, expect } from '@playwright/test';
const BASE = process.env.T0_BASE_URL!; // URL de preview del Worker
const cases: [string, number, string?][] = [
  ['/', 200, 'es'], ['/en', 200, 'en'], ['/negocios', 200, 'es'], ['/en/business', 200, 'en'],
  ['/es/negocios', 308], ['/no-existe', 404], ['/en/no-existe', 404], ['/en/', 200],
];
for (const [path, status, lang] of cases) {
  test(`GET ${path} -> ${status}`, async ({ request }) => {
    const res = await request.get(BASE + path, { maxRedirects: 0 });
    expect(res.status()).toBe(status);
    if (lang) expect(await res.text()).toContain(`<html lang="${lang}"`);
  });
}
test('server action escribe y lee cookie', async ({ page }) => {
  await page.goto(BASE + '/cookie-demo');
  await page.getByRole('button', { name: 'set' }).click();
  await expect(page.getByTestId('cookie-value')).toHaveText('t0-ok');
});
test('layout privado redirige sin sesión', async ({ request }) => {
  const res = await request.get(BASE + '/demo', { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()['location']).toContain('/auth');
});
test('route handler lee body raw', async ({ request }) => {
  const res = await request.post(BASE + '/api/hmac-demo', { data: 'abc', headers: { 'content-type': 'text/plain' } });
  expect((await res.json()).sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('mdx compilado', async ({ page }) => {
  await page.goto(BASE + '/mdx-demo');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MDX t0');
});
```
- [ ] 2. `pnpm --filter web e2e -- t0-matrix` → FAIL (no hay servidor / 404).
- [ ] 3. Implementar el mínimo: `next.config.ts` con `rewrites.beforeFiles` (`/` → `/es`, `/:path((?!en(?:/|$)|api|_next|.*\\..*).*)` → `/es/:path`) y `redirects` (`/es/:path*` → `/:path*` 308) **exactamente como DT §1.4**; `i18n/routing.ts` con `defineRouting({ locales:['es','en'], defaultLocale:'es', localePrefix:'as-needed', localeDetection:false })`; `generateStaticParams` en el layout; `open-next.config.ts` con `incrementalCache: "dummy"`; `wrangler.jsonc` de DT §1.3 con `name: "josecoded-web-t0"` y sin `routes`. Sin `proxy.ts` ni `middleware.ts`.
- [ ] 4. `pnpm --filter web build && pnpm --filter web exec opennextjs-cloudflare build && pnpm --filter web exec wrangler versions upload` → anotar la URL de preview y el tamaño que imprime wrangler ("Total Upload: X KiB / gzip: Y KiB").
- [ ] 5. `T0_BASE_URL=<url> pnpm --filter web e2e -- t0-matrix` → PASS (8 + 4 tests).
- [ ] 6. Escribir §0.1 del documento de resultados: tabla de la matriz, tamaño gz, versión de cada paquete, incidencias.
- [ ] 7. Commit en la rama spike: `git commit -m "spike(t0): OpenNext on Workers without Node middleware"`; commit del documento en `main`: `git commit -m "docs: task 0.1 results (OpenNext)"`.

**Hecho cuando:** los 12 tests pasan contra la URL de preview **y** el tamaño comprimido < 2,5 MiB. **Fallback:** si falla a–e o el tamaño supera 2,5 MiB, se documenta y la tarea 1.5 se hace con `vercel.json` (mismo código, mismas `NEXT_PUBLIC_*`); se anota la decisión en `ESTADO.md` y en el ADR; el gateway sigue en Workers.

### Tarea 0.2 — Hero: bundle de `glyph-scene` ≤ 200 KB gz y generación de medios

**Agente:** implementador-web · **Rama:** `spike/t0-hero` · **Gate:** no · **Depende de:** —

**Objetivo:** medir con esbuild el chunk real de una escena Three.js con las importaciones selectivas de DT §1.6.2 (con y sin bloom) y demostrar que la captura headless produce vídeo ≤ 400 KB con bucle perfecto (PSNR ≥ 35 dB) y poster ≤ 60 KB.

**Ficheros (en el spike):**
- Crear: `packages/glyph-scene/package.json` (`three` fijado a la última 0.17x/0.18x estable en npm el día del spike; anotar la versión), `src/spike-entry.ts` (importa exactamente los símbolos de DT §1.6.2 y monta la escena del prototipo portada a módulos: copiar `app.js` del prototipo y sustituir `Math.random` por mulberry32 con semilla 1), `scripts/measure-bundle.mjs`, `render/index.html`, `scripts/render-media.ts` (Playwright + ffmpeg + sharp, DT §1.6.3), `test/bundle-budget.test.ts`.
- Documentar: §0.2 del documento de resultados.

**Pasos:**
- [ ] 1. Test del presupuesto (falla porque no hay bundle):
```ts
// packages/glyph-scene/test/bundle-budget.test.ts
import { describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
async function gz(entry: string, define: Record<string,string> = {}) {
  const r = await build({ entryPoints: [entry], bundle: true, minify: true, format: 'esm', write: false, define, treeShaking: true, target: 'es2022' });
  return gzipSync(r.outputFiles[0].contents).length;
}
describe('glyph-scene bundle budget', () => {
  it('with bloom is measured and ≤ 200 KB gz (or documented)', async () => {
    const bytes = await gz('src/spike-entry.ts', { 'process.env.BLOOM': '"1"' });
    console.log('with bloom gz =', bytes);
    expect(bytes).toBeLessThanOrEqual(200 * 1024);
  });
  it('without bloom is ≤ 200 KB gz', async () => {
    const bytes = await gz('src/spike-entry.ts', { 'process.env.BLOOM': '"0"' });
    console.log('without bloom gz =', bytes);
    expect(bytes).toBeLessThanOrEqual(200 * 1024);
  });
});
```
- [ ] 2. `pnpm --filter glyph-scene test -- bundle-budget` → FAIL (entry inexistente).
- [ ] 3. Portar `app.js` del prototipo a `src/spike-entry.ts` con importaciones selectivas (`WebGLRenderer, Scene, PerspectiveCamera, Group, Points, BufferGeometry, BufferAttribute, ShaderMaterial, CanvasTexture, Vector2, AdditiveBlending, LinearMipmapLinearFilter, UniformsUtils` de `three`; `EffectComposer, RenderPass, UnrealBloomPass, OutputPass` de `three/addons/postprocessing/*` solo si `process.env.BLOOM === '1'`), y `createGlyphScene({ canvas, stage, seed, capture })` que expone `step(dt)`.
- [ ] 4. `pnpm --filter glyph-scene test -- bundle-budget` → PASS en al menos el caso sin bloom; anotar ambos valores.
- [ ] 5. Captura: `render/index.html` carga el ESM compilado (`esbuild src/spike-entry.ts --bundle --format=esm --outfile=render/scene.js`) y expone `window.__scene`; `scripts/render-media.ts` lanza Chromium headless con `--use-angle=swiftshader --enable-unsafe-swiftshader`, viewport 720×720, y ejecuta `for f in 0..458: scene.step(1/30); toDataURL('image/png')` → `frames/%04d.png`; luego `ffmpeg -framerate 30 -i frames/%04d.png -c:v libvpx-vp9 -crf 38 -b:v 0 -an video.webm` y el `mp4` H.264 de DT §1.6.3; poster = frame 15 → `sharp` AVIF q50 / WebP q78; PSNR entre frame 0 y 458 con `sharp` (diferencia cuadrática media por canal → `10·log10(255²/MSE)`).
- [ ] 6. `pnpm --filter glyph-scene hero:media` → imprime tamaños y PSNR. Criterios: `video.webm` ≤ 400 KB, `video.mp4` ≤ 400 KB, `poster.avif` y `poster.webp` ≤ 60 KB, PSNR ≥ 35 dB. Si el vídeo supera 400 KB, repetir una vez a 640×640 y `crf +2`.
- [ ] 7. Escribir §0.2: versión de `three` fijada, gz con/sin bloom, tiempos de captura por frame, tamaños, PSNR, y la **decisión**: bloom dentro o fuera del presupuesto.
- [ ] 8. Commit spike + commit del documento: `git commit -m "docs: task 0.2 results (hero bundle and media)"`.

**Hecho cuando:** existe un valor medido para el chunk (con y sin bloom) y una tanda de medios que cumple los cuatro topes con PSNR ≥ 35. **Fallback:** (a) si con bloom > 200 KB, la tarea 2.5b arranca con `PARAMS.bloom = 0` y el halo por `smoothstep` en el fragment shader; (b) si la captura no es reproducible (PSNR < 35 tras dos intentos), `HeroMedia` en 2.8 se implementa en modo **solo poster** (sin `<video>`), se anota en `ESTADO.md` y el vídeo queda como mejora post-lanzamiento.

### Tarea 0.3 — Radar: envío de candidatura de InfoJobs por API

**Agente:** implementador-web · **Rama:** `spike/t0-radar` · **Gate:** no · **Depende de:** alta de aplicación en InfoJobs por Jose (Q14). Sin credenciales, se hace solo la parte documental.

**Objetivo:** confirmar o refutar la hipótesis de DT §11.4: la API de InfoJobs permite **candidatura** con autorización del candidato (OAuth) además de búsqueda y detalle.

**Ficheros:** `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` §0.3; en el spike, `packages/radar-connectors/spike/infojobs-probe.ts`.

**Pasos:**
- [ ] 1. Con `firecrawl` o `agent-browser`, leer la documentación pública de `developer.infojobs.net` (endpoints `offer` v9/v7 y cualquier endpoint de candidatura/`application`), anotar: método, ruta, scopes, si exige OAuth del candidato, campos obligatorios (CV, carta, preguntas), límites de cuota.
- [ ] 2. Si Jose ya tiene `INFOJOBS_CLIENT_ID/SECRET`: `infojobs-probe.ts` hace `GET /api/9/offer?q=react&teleworking=2` con Basic auth y `GET /api/7/offer/{id}` del primer resultado; guardar las respuestas **anonimizadas** (sin ids de cuenta) como `test/fixtures/infojobs/{search,detail}.json` para la tarea 7.10. Si hay endpoint de candidatura, probar solo el flujo de autorización (nunca enviar una candidatura real).
- [ ] 3. Veredicto en §0.3: `can_submit = true` (con el contrato exacto de `prepareForm` y `submit`) o `can_submit = false` (asistido). Anotar la cuota diaria.
- [ ] 4. Commit del documento: `git commit -m "docs: task 0.3 results (InfoJobs submit)"`.

**Hecho cuando:** §0.3 fija `can_submit` y, si es `true`, el contrato del envío. **Fallback:** asistido (`submit_mode='assisted'`); la tarea 7.10 implementa solo `discover`/`detail`.

### Tarea 0.4 — Radar: Browser Rendering en Workers Free

**Agente:** implementador-web · **Rama:** `spike/t0-radar` · **Gate:** no (Worker de pruebas `josecoded-t0-pdf`, borrar al terminar) · **Depende de:** —

**Objetivo:** comprobar que el binding `BROWSER` existe en la cuenta con plan Free, que `@cloudflare/puppeteer` genera un PDF A4 desde HTML y cuánto pesa en el worker.

**Ficheros:** spike `apps/api-t0-pdf/{wrangler.jsonc,src/index.ts}`; §0.4 del documento.

**Pasos:**
- [ ] 1. Test en workerd (falla sin implementación):
```ts
// apps/api-t0-pdf/src/index.test.ts
import { SELF } from 'cloudflare:test';
import { it, expect } from 'vitest';
it('renders a PDF from HTML', async () => {
  const res = await SELF.fetch('http://x/pdf', { method: 'POST', body: '<h1>CV t0</h1>' });
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('application/pdf');
  const buf = new Uint8Array(await res.arrayBuffer());
  expect(String.fromCharCode(...buf.slice(0, 5))).toBe('%PDF-');
});
```
- [ ] 2. `pnpm --filter api-t0-pdf test` → FAIL.
- [ ] 3. `wrangler.jsonc` con `"browser": { "binding": "BROWSER" }`; `src/index.ts`: `const browser = await puppeteer.launch(env.BROWSER); const page = await browser.newPage(); await page.setContent(html); const pdf = await page.pdf({ format:'A4', printBackground:true }); await browser.close();`.
- [ ] 4. `pnpm --filter api-t0-pdf test` → PASS (Miniflare simula el binding) y **prueba real**: `wrangler versions upload` + `curl -X POST <preview>/pdf -d '<h1>x</h1>' -o t0.pdf` → `file t0.pdf` dice PDF. Anotar el tamaño del worker y el tiempo de respuesta.
- [ ] 5. §0.4: disponible sí/no en Free, cuota (dashboard → Browser Rendering), tamaño, latencia. Borrar el Worker de pruebas.
- [ ] 6. Commit del documento: `git commit -m "docs: task 0.4 results (Browser Rendering)"`.

**Hecho cuando:** §0.4 dice si `POST /radar/materials/:id/pdf` (7.21) usa Browser Rendering o responde siempre 503 `browser_rendering_unavailable`. **Fallback:** impresión en navegador (`/admin/radar/[id]/cv/print`, 7.26) como única vía de PDF.

### Tarea 0.5 — Radar: MCP de Indeed en `claude -p`

**Agente:** implementador-web · **Rama:** — (solo documento) · **Gate:** no · **Depende de:** CLI `claude` autenticado en el Mac de Jose (ya lo exige `automation/run-skill.sh`).

**Objetivo:** saber si el conector MCP oficial de Indeed (`search_jobs`, `get_job_details`) responde en una ejecución no interactiva.

**Pasos:**
- [ ] 1. Ejecutar desde el Mac: `claude -p 'Usa la herramienta search_jobs del conector de Indeed con query "react native", location "España", remote true, limit 3 y devuelve SOLO un JSON con [{id,title,company,url}]' --output-format json > /tmp/t0-indeed.json`; repetir con `get_job_details` sobre un id devuelto.
- [ ] 2. Comprobar que el JSON contiene ≥ 1 oferta con `url` de Indeed; anotar tiempo, tokens y si hizo falta `--allowedTools` o `--mcp-config`.
- [ ] 3. §0.5: veredicto (funciona en `claude -p` / solo interactivo), flags exactos que hay que poner en `run-skill.sh` para `/radar-indeed`, límites observados por consulta.
- [ ] 4. Commit: `git commit -m "docs: task 0.5 results (Indeed MCP headless)"`.

**Hecho cuando:** §0.5 fija cómo invoca `/radar-indeed` al MCP. **Fallback:** la skill se ejecuta a mano en una sesión de Jose (misma ingesta); el plist de 7.9 no se instala.

### Tarea 0.6 — Radar: feed de Tecnoempleo

**Agente:** implementador-web · **Rama:** `spike/t0-radar` · **Gate:** no · **Depende de:** —

**Objetivo:** fijar la URL exacta del feed RSS/XML de ofertas de Tecnoempleo por consulta, comprobar sus campos y grabar la fixture del conector 7.11.

**Pasos:**
- [ ] 1. Test (falla sin fixture):
```ts
// packages/radar-connectors/test/tecnoempleo-feed.spike.test.ts
import { it, expect } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'node:fs';
it('feed has ≥ 10 items with title, link and pubDate', () => {
  const xml = readFileSync('test/fixtures/tecnoempleo/feed.xml', 'utf8');
  const items = new XMLParser().parse(xml).rss.channel.item;
  expect(items.length).toBeGreaterThanOrEqual(10);
  for (const i of items.slice(0, 10)) { expect(i.title).toBeTruthy(); expect(i.link).toMatch(/^https:\/\/www\.tecnoempleo\.com\//); expect(i.pubDate).toBeTruthy(); }
});
```
- [ ] 2. `pnpm --filter radar-connectors test -- tecnoempleo-feed` → FAIL (no hay fixture).
- [ ] 3. Localizar el feed (`https://www.tecnoempleo.com/rss/...` o el que documente la web; probar con `curl -A 'josecoded-radar/0.1'`), descargarlo con una consulta del perfil (`react`, `typescript`), guardar `feed.xml` **anonimizando** nada (es público) pero recortando a 30 items; descargar una ficha HTML → `detail.html`.
- [ ] 4. `pnpm --filter radar-connectors test -- tecnoempleo-feed` → PASS. Anotar en §0.6 la URL con parámetros, cabeceras necesarias, campos disponibles (empresa, ubicación, salario si aparece), selectores de la ficha para `HTMLRewriter` (descripción, requisitos, plazo).
- [ ] 5. Commit: `git commit -m "docs: task 0.6 results (Tecnoempleo feed) + fixtures"`.

**Hecho cuando:** §0.6 tiene la URL, los campos y las dos fixtures. **Fallback:** sin feed, 7.11 descubre por el listado HTML (`/ofertas-trabajo/?te=react`) con `HTMLRewriter` y los mismos límites.

**Cierre de la fase 0:** `revisor` lee `2026-09-19-tarea0-resultados.md` y comprueba que cada sección tiene veredicto y decisión; el controlador anota en `ESTADO.md` las decisiones (fallbacks activados) y en la spec una línea por decisión que cambie D3, D16 o §13.5.

---
## Fase 1 — Monorepo, `apps/api` movido, `packages/pricing`, CI · Estimación M · rama `chore/monorepo`

### Tarea 1.1 — Esqueleto del monorepo

**Agente:** implementador-web · **Gate:** no · **Depende de:** 0.1 (decide Workers o Vercel para `apps/web`, no afecta al esqueleto)

**Objetivo:** raíz pnpm + turbo con scripts únicos y `packages/config` compartido (DT §1.1, §1.2).

**Ficheros:**
- Crear: `package.json` (raíz), `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` (`22`), `.gitignore` (añadir `.open-next/`, `.next/`, `.wrangler/`, `.dev.vars`, `.env.local`, `**/pending/`, `*.eml`, `frames/`), `.prettierrc`, `packages/config/package.json` (`@josecoded/config`), `packages/config/{eslint.config.mjs,tsconfig.base.json,tsconfig.next.json,tsconfig.worker.json,prettier.config.mjs}`, `README.md` (comandos).
- Modificar: `CLAUDE.md` del repo (sección Comandos: confirmar `pnpm dev|test|lint|typecheck|build|e2e`).
- Test: `packages/config/test/tsconfig.test.ts`.

**Interfaces:** produce los scripts raíz `lint`, `typecheck`, `test`, `build`, `e2e`, `pricing:sync`, `pricing:sync-db`, `hero:media`, `hero:media:check`, `check:hero-bundle`, `lhci` (los cinco últimos se rellenan en sus tareas; aquí se declaran como `turbo run <x>`), y `packageManager: "pnpm@11.2.2"`.

**Pasos:**
- [ ] 1. Test que falla (no existe `packages/config`):
```ts
// packages/config/test/tsconfig.test.ts
import { it, expect } from 'vitest';
import base from '../tsconfig.base.json';
it('base tsconfig is strict', () => {
  expect(base.compilerOptions.strict).toBe(true);
  expect(base.compilerOptions.noUncheckedIndexedAccess).toBe(true);
  expect(base.compilerOptions.moduleResolution).toBe('bundler');
});
```
- [ ] 2. `pnpm install && pnpm --filter @josecoded/config test` → FAIL.
- [ ] 3. Crear los ficheros: `pnpm-workspace.yaml` → `packages: ['apps/*', 'packages/*']`; `turbo.json` con tareas `lint`, `typecheck`, `test` (`dependsOn: ['^build']`), `build` (`outputs: ['.next/**', '.open-next/**', 'dist/**']`), `e2e` (`cache: false`); raíz `package.json` con `"scripts": { "lint":"turbo run lint", "typecheck":"turbo run typecheck", "test":"turbo run test", "build":"turbo run build", "e2e":"turbo run e2e", ... }` y `devDependencies` compartidas (`turbo`, `typescript@5.9.3`, `vitest@4.1.11`, `prettier`, `eslint`, `typescript-eslint`); `tsconfig.base.json` con `strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `target: "ES2022"`.
- [ ] 4. `pnpm --filter @josecoded/config test` → PASS; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → en verde (sin paquetes aún, turbo termina sin error).
- [ ] 5. Commit: `git commit -m "chore: monorepo skeleton (pnpm workspaces, turbo, shared config)"`.

**Hecho cuando:** los cuatro comandos raíz pasan y `pnpm --filter @josecoded/config test` está en verde.

### Tarea 1.2 — Mover `josecoded-api` a `apps/api` sin cambiar contratos

**Agente:** implementador-web · **Gate:** no · **Depende de:** 1.1

**Objetivo:** el gateway vive en `apps/api` con sus 13 suites Jest en verde, `wrangler` 4.133 y TypeScript 5.9.3 (DT §1.1, §1.2; `git subtree` no hace falta: josedev queda congelado).

**Ficheros:**
- Crear: `apps/api/**` copiando `~/Documents/GitHub/josedev/josecoded-api/` **sin** `node_modules`, `.wrangler`, `.dev.vars`; `apps/api/README.md` con una línea "movido desde josedev/josecoded-api el 2026-09-xx, commit <sha de josedev>".
- Modificar: `apps/api/package.json` (`wrangler@^4.133`, `typescript@5.9.3`, `hono@^4.13.8`, `zod@^4.6.5`, `@supabase/supabase-js@^2.116`, `@cloudflare/workers-types@^5.20260917`; scripts `lint`, `typecheck`, `test`), `apps/api/tsconfig.json` → `extends: "@josecoded/config/tsconfig.worker.json"`.
- Test: los existentes (`src/**/*.test.ts`, 13 ficheros).

**Pasos:**
- [ ] 1. Copiar y `git add apps/api`. Ejecutar `pnpm install`.
- [ ] 2. `pnpm --filter josecoded-api test` (Jest) → debe PASAR tal cual (es la no-regresión). Si algo falla por la subida de TS/Hono/zod, corregir tipos **sin tocar rutas ni respuestas**; anotar cada cambio en el mensaje de commit.
- [ ] 3. `pnpm --filter josecoded-api typecheck` → PASS con TS 5.9.3.
- [ ] 4. Añadir `apps/api/.dev.vars.example` con los nombres de DT §9 (sin valores).
- [ ] 5. Commit: `git commit -m "chore(api): move josecoded-api gateway into apps/api (unchanged contracts)"`.

**Hecho cuando:** 13 suites en verde, `typecheck` en verde, `wrangler deploy --dry-run` en `apps/api` termina sin error.

### Tarea 1.3 — Tests del gateway en Vitest + `@cloudflare/vitest-pool-workers`

**Agente:** implementador-web · **Gate:** no · **Depende de:** 1.2

**Objetivo:** migrar los 13 ficheros Jest a Vitest 4.1 corriendo en workerd real, para que las rutas nuevas y las heredadas compartan runner (DT §8.1 "heredado"). Decisión reversible: si un fichero se resiste tras 30 min, se deja en Jest y se documenta.

**Ficheros:**
- Crear: `apps/api/vitest.config.ts` (`defineWorkersConfig({ test: { poolOptions: { workers: { wrangler: { configPath: './wrangler.jsonc' } } } } })`), `apps/api/test/setup.ts`.
- Modificar: los 13 `*.test.ts` (`jest.fn`→`vi.fn`, `jest.mock`→`vi.mock`, imports de `vitest`), `package.json` (`test: "vitest run"`, quitar `jest`, `ts-jest`, `@types/jest`).

**Pasos:**
- [ ] 1. Crear `vitest.config.ts`; `pnpm --filter josecoded-api test` → FAIL (sintaxis Jest).
- [ ] 2. Migrar fichero a fichero; tras cada uno `pnpm --filter josecoded-api test -- <nombre>` → PASS.
- [ ] 3. `pnpm --filter josecoded-api test` → 13/13 PASS en workerd. Si alguno queda en Jest, mantener `jest.config` solo para él y `test: "vitest run && jest"`.
- [ ] 4. Commit: `git commit -m "test(api): migrate gateway tests to vitest pool-workers"`.

**Hecho cuando:** `pnpm test` en raíz ejecuta el gateway en workerd y todo está en verde.

### Tarea 1.4 — `packages/pricing`: esquema, `pricing.json`, reglas y sincronización desde `tarifas.md`

**Agente:** implementador-web · **Gate:** no (escribe solo el repo) · **Depende de:** 1.1

**Objetivo:** una sola fuente de precios en código, con las cuatro reglas que consumen web, gateway, admin y área de clientes (spec D13, DT §1.1, §8.1).

**Ficheros:**
- Crear: `packages/pricing/package.json` (`@josecoded/pricing`), `pricing.json`, `src/schema.ts`, `src/index.ts`, `src/proposal-price.ts`, `src/upgrade.ts`, `src/affiliate.ts`, `scripts/sync-from-tarifas.ts`, `scripts/sync-db.ts` (solo el esqueleto que imprime el diff; la escritura real se activa en 9.4), `test/pricing.test.ts`, `test/drift.test.ts`.

**Interfaces (produce; las usan 3.7, 3.8, 5.4, 6.2, 3.3):**
```ts
export type PackCode = 'P1'|'P2'|'P3'|'P4';
export type ExtraCode = 'seo_basic'|'seo_full'|'geo'|'security_audit'|'maintenance_basic'|'maintenance_extended';
export interface Pack { code: PackCode; name: string; price: number; weeks: number; includes: string[]; forWhom: string }
export interface Extra { code: ExtraCode; label: string; price: number; billing: 'one_off'|'monthly'; description: string }
export const pricing: { version: string; hourly: 40; feature: 150; packs: Pack[]; extras: Extra[] };
export function priceForProposal(pack: PackCode, extras: ExtraCode[]): { priceFrom: number; pack: Pack; recommendedExtras: Extra[]; pricingVersion: string };
export function computeUpgrade(from: PackCode|null, to: PackCode|null, extras: ExtraCode[]): { price: number; pricingVersion: string };  // lanza UpgradeError si to<=from o (to null y extras vacíos)
export function computeAffiliateReward(level: 'client'|'standard'|'premium', baseAmount: number): { type: 'maintenance_months'|'percent'; amount: number; percent?: number };
export function formatPrice(n: number, locale: 'es'|'en'): string;  // "1.400 €" / "€1,400"
```

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/pricing/test/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { pricing, priceForProposal, computeUpgrade, computeAffiliateReward, formatPrice } from '../src';
describe('pricing.json', () => {
  it('has version 2026-09-14 and four packs', () => {
    expect(pricing.version).toBe('2026-09-14');
    expect(pricing.packs.map(p => [p.code, p.price, p.weeks])).toEqual([['P1',900,1],['P2',1400,2],['P3',2500,2],['P4',4200,3]]);
  });
  it('extras match tarifas v2', () => {
    const byCode = Object.fromEntries(pricing.extras.map(e => [e.code, [e.price, e.billing]]));
    expect(byCode).toEqual({ seo_basic:[250,'one_off'], seo_full:[600,'one_off'], geo:[300,'one_off'], security_audit:[250,'one_off'], maintenance_basic:[49,'monthly'], maintenance_extended:[149,'monthly'] });
  });
  it('never exposes pack gifts', () => { expect(JSON.stringify(pricing)).not.toMatch(/regalo|gift/i); });
});
describe('priceForProposal', () => {
  it('priceFrom is the pack price and never sums extras', () => {
    const r = priceForProposal('P2', ['seo_basic','maintenance_basic']);
    expect(r.priceFrom).toBe(1400); expect(r.recommendedExtras.map(e => e.code)).toEqual(['seo_basic','maintenance_basic']);
  });
});
describe('computeUpgrade', () => {
  it('P2→P3 = 1100', () => expect(computeUpgrade('P2','P3',[]).price).toBe(1100));
  it('P1→P4 = 3300', () => expect(computeUpgrade('P1','P4',[]).price).toBe(3300));
  it('extras after = list price', () => expect(computeUpgrade('P2',null,['seo_full']).price).toBe(600));
  it('P3→P3 throws', () => expect(() => computeUpgrade('P3','P3',[])).toThrow());
  it('nothing requested throws', () => expect(() => computeUpgrade('P2',null,[])).toThrow());
});
describe('computeAffiliateReward', () => {
  it('standard 10 % of 1400 = 140', () => expect(computeAffiliateReward('standard',1400)).toEqual({ type:'percent', amount:140, percent:10 }));
  it('premium 20 % = 280', () => expect(computeAffiliateReward('premium',1400)).toEqual({ type:'percent', amount:280, percent:20 }));
  it('client = 2 maintenance months', () => expect(computeAffiliateReward('client',1400)).toEqual({ type:'maintenance_months', amount:2 }));
});
it('formatPrice', () => { expect(formatPrice(1400,'es')).toBe('1.400 €'); expect(formatPrice(1400,'en')).toBe('€1,400'); });
```
```ts
// packages/pricing/test/drift.test.ts  (solo corre en el Mac; en CI se salta si no hay vault)
import { it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { parseTarifas } from '../scripts/sync-from-tarifas';
const TARIFAS = process.env.TARIFAS_PATH ?? `${process.env.HOME}/Library/Mobile Documents/iCloud~md~obsidian/Documents/jose/Comercial/tarifas.md`;
it.skipIf(!existsSync(TARIFAS))('pricing.json equals tarifas.md', () => {
  const generated = parseTarifas(readFileSync(TARIFAS, 'utf8'));
  const committed = JSON.parse(readFileSync(new URL('../pricing.json', import.meta.url), 'utf8'));
  expect(generated).toEqual(committed);
});
```
- [ ] 2. `pnpm --filter @josecoded/pricing test` → FAIL.
- [ ] 3. Implementar: `schema.ts` (zod para `pricing.json`), `pricing.json` con la tabla de `tarifas.md` v2 (packs, extras, `upgradeRule: 'list_difference'`, `affiliate: { client:{maintenanceMonths:2}, standard:{percent:10}, premium:{percent:20}, base:'first_order_ex_vat' }`; **sin** la tabla de regalos), las cuatro funciones, y `parseTarifas(md)` que extrae las tablas Markdown por cabecera ("## Packs web", "## Extras", "## Afiliados", "## Tarifa hora") y la línea de vigencia.
- [ ] 4. `pnpm --filter @josecoded/pricing test` → PASS (incluido `drift` en el Mac).
- [ ] 5. `sync-db.ts`: lee `pricing.json`, conecta con `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`, calcula el diff de `pack_templates`/`pack_extras` por `code` (mapeo `orden` 1..4 ↔ P1..P4 la primera vez) y **lo imprime**; la escritura pide confirmación por stdin (`y/N`). Se ejecuta a mano en 9.4.
- [ ] 6. Commit: `git commit -m "feat(pricing): pricing.json from tarifas v2 with proposal, upgrade and affiliate rules"`.

**Hecho cuando:** 12 tests en verde; `pnpm pricing:sync` regenera `pricing.json` idéntico al commiteado.

### Tarea 1.5 — `apps/web` base: Next 16 + OpenNext + env validada + rutas mínimas

**Agente:** implementador-web · **Gate:** no · **Depende de:** 0.1, 1.1

**Objetivo:** promover el spike 0.1 a `apps/web` real: configuración de DT §1.3–§1.4, validación de env con zod, y la matriz de URLs como test E2E permanente.

**Ficheros:**
- Crear: `apps/web/package.json` (`@josecoded/web`; deps de DT §1.2 salvo `three`, `gsap`, `@calcom/embed-react`, `@marsidev/react-turnstile`, que llegan en sus tareas), `next.config.ts` (rewrites/redirects de DT §1.4, `images.unoptimized: true`, `serverExternalPackages` mínimos), `open-next.config.ts`, `wrangler.jsonc` (DT §1.3, `name: "josecoded-web"`, **sin** `routes` hasta 9.6), `lib/env.ts`, `i18n/routing.ts`, `i18n/request.ts`, `app/[locale]/layout.tsx` (`generateStaticParams`, `setRequestLocale`, `<html lang>`), `app/[locale]/page.tsx` (placeholder "josecoded"), `app/[locale]/not-found.tsx`, `messages/{es,en}.json` (vacíos salvo `site.name`), `vitest.config.ts` (happy-dom), `playwright.config.ts` (webServer: `wrangler dev` sobre `.open-next`), `e2e/url-matrix.spec.ts`, `tests/env.test.ts`, `.env.example`.
- Modificar: `turbo.json` (`build` de web ejecuta `next build && opennextjs-cloudflare build`).

**Interfaces (produce):** `env` (`apps/web/lib/env.ts`): `env.server.{TURNSTILE_SECRET_KEY,SERVER_KEY,CALCOM_WEBHOOK_SECRET}` y `env.client.{NEXT_PUBLIC_SITE_URL,NEXT_PUBLIC_JOSECODED_API_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,NEXT_PUBLIC_TURNSTILE_SITE_KEY,NEXT_PUBLIC_UMAMI_WEBSITE_ID?,NEXT_PUBLIC_CF_BEACON_TOKEN?,NEXT_PUBLIC_CAL_LINK,NEXT_PUBLIC_WHATSAPP_NUMBER,NEXT_PUBLIC_HERO_LIVE_MOBILE,NEXT_PUBLIC_HERO_MEDIA_VERSION}`; `routing` y `Link`/`redirect`/`usePathname` de `i18n/navigation.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/tests/env.test.ts
import { it, expect } from 'vitest';
it('env fails fast when a public var is missing', async () => {
  const saved = process.env.NEXT_PUBLIC_SITE_URL; delete process.env.NEXT_PUBLIC_SITE_URL;
  await expect(import('../lib/env')).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/);
  process.env.NEXT_PUBLIC_SITE_URL = saved;
});
```
`e2e/url-matrix.spec.ts` = el test de la tarea 0.1 (mismos 8 casos de URL) contra `baseURL` de Playwright, sin los demos de cookie/HMAC/MDX.
- [ ] 2. `pnpm --filter web test -- env` → FAIL; `pnpm --filter web e2e -- url-matrix` → FAIL.
- [ ] 3. Implementar según DT §1.3–§1.4 (copiar del spike lo que pasó). `lib/env.ts` con `z.object` para `server` y `client` y `throw` con el nombre de la variable que falta.
- [ ] 4. `pnpm --filter web build` (Next + OpenNext) → imprime tamaño; `pnpm --filter web test -- env` → PASS; `pnpm --filter web e2e -- url-matrix` → PASS.
- [ ] 5. Commit: `git commit -m "feat(web): Next 16 + OpenNext base with locale routing and validated env"`.

**Hecho cuando:** matriz de URLs en verde contra `wrangler dev`, `build` < 2,5 MiB comprimidos, `env` falla con mensaje claro.

### Tarea 1.6 — `supabase/`: baseline de solo lectura, config local, seed y test de deriva

**Agente:** implementador-web · **Gate:** no (lectura de producción con `supabase db dump --linked`; avisar a Jose de que se lee el esquema) · **Depende de:** 1.1

**Objetivo:** que `supabase start` local y CI reproduzcan el esquema real sin copiar las 47 migraciones remotas (DT H6, §6.2, §8.4).

**Ficheros:**
- Crear: `supabase/config.toml` (`[db.migrations] schema_paths = ["./schema/baseline.sql"]`, `[functions.notify] verify_jwt = false`, `[auth] enable_signup = true`, `[auth.email] enable_confirmations = false`, OTP habilitado), `supabase/schema/baseline.sql` (dump de `public`, `private`, `storage`, `vault` sin datos), `supabase/schema/baseline.meta.json` (`{ dumpedAt, tables, policies, functions }` calculado del dump), `supabase/seed/seed.sql` (tres cuentas `jose@test`/`ana@test`/`bob@test` con contraseñas de test, fila `staff_members` de Jose `role='admin'` con `telegram_chat_id`, cliente P2 de Ana, 2 leads, `pack_templates` con `code`… los inserts que dependen de migraciones nuevas se añaden en 1.8), `supabase/functions/notify/index.ts` (copia literal de la v4 desplegada, obtenida con `get_edge_function`), `scripts/supabase-baseline.sh` (ejecuta `supabase db dump --linked --schema public,private,storage,vault -f supabase/schema/baseline.sql` y regenera `baseline.meta.json`).
- Test: `supabase/test/baseline.test.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// supabase/test/baseline.test.ts
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../schema/baseline.sql', import.meta.url), 'utf8');
const meta = JSON.parse(readFileSync(new URL('../schema/baseline.meta.json', import.meta.url), 'utf8'));
it('baseline has the 21 inherited public tables and no radar_* tables', () => {
  const tables = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"?public"?\."?(\w+)"?/g)].map(m => m[1]);
  expect(tables).toHaveLength(21);
  for (const t of ['staff_members','leads','clients','client_tasks','client_assets','pack_templates','pack_extras','admin_chat_conversations','admin_chat_messages','blog_posts']) expect(tables).toContain(t);
  expect(tables.some(t => t.startsWith('radar_'))).toBe(false);
  expect(tables).not.toContain('admin_superusers');
});
it('baseline has 47 policies and the staff_role_of function', () => {
  expect((sql.match(/CREATE POLICY/g) ?? []).length).toBe(meta.policies);
  expect(meta.policies).toBe(47);
  expect(sql).toMatch(/FUNCTION "?private"?\."?staff_role_of"?/);
});
it('baseline contains no data', () => { expect(sql).not.toMatch(/^INSERT INTO/m); expect(sql).not.toMatch(/COPY .* FROM stdin/); });
```
- [ ] 2. `pnpm --filter supabase test` → FAIL (no hay dump). (Añadir `supabase/package.json` con nombre `@josecoded/supabase` y script `test`.)
- [ ] 3. `supabase login` (token de Jose en el Mac) + `supabase link --project-ref nrgrmymsjtgayzejtawa` + `scripts/supabase-baseline.sh`. Revisar el dump: sin `INSERT`, sin secretos de `vault` (solo `vault.secrets` vacío). Copiar la Edge Function `notify` v4.
- [ ] 4. `supabase start && supabase db reset` → aplica baseline + seed sin error. `pnpm --filter supabase test` → PASS.
- [ ] 5. Commit: `git commit -m "chore(supabase): read-only baseline dump, local config, seed and notify function copy"`.

**Hecho cuando:** `supabase db reset` local termina sin error y los 3 tests pasan. Regla: **cada tarea GATE de migración regenera el baseline antes de aplicar** y el test detecta si producción cambió (números distintos).

### Tarea 1.7 — Gateway: CORS con comodín, `routes-manifest`, `scheduled` y deuda menor

**Agente:** implementador-web · **Gate:** no · **Depende de:** 1.3

**Objetivo:** cambios aditivos del gateway que todas las rutas nuevas necesitan (DT §3.6).

**Ficheros:**
- Crear: `apps/api/src/routes-manifest.ts` (`export const routes = [...] as const` con `{ method, path, module }` de cada ruta registrada; lo lee `build-info.ts` de la web), `apps/api/src/scheduled.ts` (`export async function scheduled(event, env, ctx) {}` que despacha por `event.cron` a handlers registrados en un `Map`; vacío hasta 7.17), `apps/api/src/utils/cors-origins.ts`, `apps/api/src/utils/cors-origins.test.ts`, `apps/api/src/routes-manifest.test.ts`.
- Modificar: `apps/api/src/index.ts` (usar `isAllowedOrigin` en el CORS; `export default { fetch: app.fetch, scheduled }`; `app.onError` sin `error.message` en `details` fuera de `API_MODE=development`), `apps/api/src/utils/*` donde esté `toUpstreamFail` (quitar "Android emulator" del texto), `apps/api/src/config/env.ts` (`envSchema` con `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `NOTIFY_SHARED_SECRET`, `N8N_LEAD_WEBHOOK_ENABLED`, `PROPOSALS_DAILY_LIMIT_IP`, `PROPOSALS_DAILY_LIMIT_ALL`, `AI_PROPOSAL_MODEL`, `AI_GATEWAY_ID`, `ALLOWED_TURNSTILE_HOSTNAMES`, `QUOTA_KV`, `LEADS_RATE_LIMITER`, `AFFILIATE_RATE_LIMITER` — todos opcionales por ahora), `apps/api/wrangler.jsonc` (`ratelimits` 1002 y 1003 de DT §3.6; `kv_namespaces: [{ binding:'QUOTA_KV', id:'<se crea en 3.12>' }]` con un id de preview local).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/utils/cors-origins.test.ts
import { it, expect } from 'vitest';
import { isAllowedOrigin } from './cors-origins';
const list = 'https://josecoded.com,https://www.josecoded.com,https://*.josecoded-web.jose.workers.dev,http://localhost:3000';
it.each([
  ['https://josecoded.com', true], ['https://www.josecoded.com', true],
  ['https://abc123-josecoded-web.jose.workers.dev', true], ['https://evil.com', false],
  ['https://josecoded.com.evil.com', false], ['http://localhost:3000', true], ['https://x.workers.dev', false],
])('%s → %s', (origin, ok) => expect(isAllowedOrigin(origin, list)).toBe(ok));
```
```ts
// apps/api/src/routes-manifest.test.ts
import { it, expect } from 'vitest';
import { routes } from './routes-manifest';
it('manifest lists inherited routes', () => {
  const keys = routes.map(r => `${r.method} ${r.path}`);
  expect(keys).toContain('GET /api/v1/health'); expect(keys).toContain('GET /api/v1/admin-chat/thread');
  expect(new Set(keys).size).toBe(keys.length);
});
```
- [ ] 2. `pnpm --filter josecoded-api test -- cors-origins routes-manifest` → FAIL.
- [ ] 3. Implementar `isAllowedOrigin(origin, list)`: entradas exactas o, si empiezan por `https://*.`, comparación por sufijo de host `.` + resto (nunca `endsWith` sin el punto). Registrar en `routes-manifest.ts` las rutas heredadas leyendo `v1.routes.ts` a mano (no por regex). Exportar `{ fetch, scheduled }`.
- [ ] 4. `pnpm --filter josecoded-api test` → todo PASS (heredados + nuevos). `wrangler deploy --dry-run` OK.
- [ ] 5. Commit: `git commit -m "feat(api): wildcard CORS, routes manifest, scheduled export, env schema additions"`.

**Hecho cuando:** tests en verde y `curl -H 'Origin: https://x-josecoded-web.jose.workers.dev' -X OPTIONS http://localhost:8787/api/v1/health` devuelve `access-control-allow-origin` correcto en `wrangler dev`.

### Tarea 1.8 — Migraciones aditivas no-Radar + tests RLS con tres cuentas (local)

**Agente:** implementador-web · **Gate:** no (solo local) · **Depende de:** 1.6

**Objetivo:** escribir las 9 migraciones de DT §6.2 y probarlas con `supabase start` y tres cuentas (DT §8.4).

**Ficheros:**
- Crear: `supabase/migrations/20260917100000_leads_web_fields.sql`, `20260917100100_pack_codes.sql`, `20260917100200_blog_comments.sql`, `20260917100300_affiliates.sql`, `20260917100400_affiliate_rewards.sql`, `20260917100500_upgrade_requests.sql`, `20260917100600_client_access_claim.sql`, `20260917100650_admin_close_lead_paid.sql`, `20260917100700_notify_lead_event.sql` (comentario), **copiando literalmente el SQL de DT §6.2**; `apps/web/tests/rls.test.ts`; `apps/web/tests/helpers/supabase-test-clients.ts` (`clientFor('jose'|'ana'|'bob'|'anon')` con login por password contra `http://127.0.0.1:54321`).
- Modificar: `supabase/seed/seed.sql` (Ana afiliada `standard` con código `ANA-TEST`, Bob afiliado `premium` `BOB-TEST`, 2 leads (uno con `affiliate_code='ANA-TEST'`), 1 recompensa `pending`, 2 comentarios `pending`/`approved`, `clients.invite_email`), `supabase/functions/notify/index.ts` (nuevo `case 'lead.created'` y `case 'system.ping_failed'`; `EMAIL_FROM = 'josecoded <no-reply@josecoded.com>'`; `ADMIN_NOTIFY_EMAIL` opcional).

**Pasos:**
- [ ] 1. Test que falla (los inserts de seed fallan porque no existen las tablas):
```ts
// apps/web/tests/rls.test.ts (extracto; una aserción por fila de DT §6.3)
import { describe, it, expect, beforeAll } from 'vitest';
import { clientFor } from './helpers/supabase-test-clients';
let jose, ana, bob, anon;
beforeAll(async () => { [jose, ana, bob, anon] = await Promise.all(['jose','ana','bob','anon'].map(clientFor)); });
describe('blog_comments', () => {
  it('anon reads only approved', async () => { const { data } = await anon.from('blog_comments').select('status'); expect(data.every(c => c.status === 'approved')).toBe(true); });
  it('ana sees her pending, not bob pending', async () => { const { data } = await ana.from('blog_comments').select('user_id,status'); expect(data.filter(c => c.status === 'pending').every(c => c.user_id === ana.userId)).toBe(true); });
  it('ana cannot insert approved', async () => { const { error } = await ana.from('blog_comments').insert({ slug:'x', locale:'es', body:'hi', status:'approved', author_name:'Ana', user_id: ana.userId }); expect(error).toBeTruthy(); });
});
describe('affiliates', () => {
  it('ana cannot change her level', async () => { const { data } = await ana.from('affiliates').update({ level:'premium' }).eq('user_id', ana.userId).select(); expect(data).toHaveLength(0); });
  it('ana reads affiliate_leads_view without contact data', async () => { const { data } = await ana.from('affiliate_leads_view').select('*'); expect(data.length).toBeGreaterThan(0); expect(Object.keys(data[0])).not.toContain('contact_email'); });
  it('ana reads 0 rows of leads directly', async () => { const { data } = await ana.from('leads').select('id'); expect(data).toHaveLength(0); });
  it('ana cannot insert affiliate_rewards', async () => { const { error } = await ana.from('affiliate_rewards').insert({ affiliate_id: ana.affiliateId, lead_id: ana.leadId, type:'percent', amount:1, base_amount:10, pricing_version:'x' }); expect(error).toBeTruthy(); });
});
describe('upgrade_requests', () => {
  it('bob (no client) cannot insert', async () => { const { error } = await bob.from('upgrade_requests').insert({ client_id: ana.clientId, to_pack_code:'P3', computed_price:1100, pricing_version:'2026-09-14' }); expect(error).toBeTruthy(); });
  it('ana inserts pending for her client', async () => { const { error } = await ana.from('upgrade_requests').insert({ client_id: ana.clientId, from_pack_code:'P2', to_pack_code:'P3', computed_price:1100, pricing_version:'2026-09-14' }); expect(error).toBeNull(); });
});
describe('admin', () => {
  it('jose inserts a manual lead', async () => { const { error } = await jose.from('leads').insert({ estado:'nuevo', fuente:'whatsapp', contact_name:'Marta' }); expect(error).toBeNull(); });
  it('ana cannot insert a lead', async () => { const { error } = await ana.from('leads').insert({ estado:'nuevo', fuente:'whatsapp' }); expect(error).toBeTruthy(); });
  it('admin_close_lead_paid rejects non-admin', async () => { const { error } = await ana.rpc('admin_close_lead_paid', { p_lead_id: ana.leadId, p_base_amount:1400, p_reward_type:'percent', p_reward_amount:140, p_reward_percent:10, p_pricing_version:'2026-09-14', p_generate_reward:true }); expect(error?.message).toMatch(/forbidden/); });
});
```
- [ ] 2. `supabase db reset` → FAIL en seed; `pnpm --filter web test -- rls` → FAIL.
- [ ] 3. Crear las migraciones (literal de DT §6.2) y completar el seed.
- [ ] 4. `supabase db reset` OK; `pnpm --filter web test -- rls` → PASS (≥ 12 aserciones).
- [ ] 5. Commit: `git commit -m "feat(supabase): additive migrations (leads fields, comments, affiliates, rewards, upgrades, claim, close-paid RPC) with RLS tests"`.

**Hecho cuando:** `supabase db reset` + `rls.test.ts` en verde; `ci.yml` (1.9) ejecuta ambos.

### Tarea 1.9 — CI/CD + **GATE** aplicar migraciones no-Radar en producción

**Agente:** implementador-web (workflows) + **controlador** (migraciones, con OK de Jose) · **Gate:** **SÍ** (producción: `apply_migration` ×8 y `supabase functions deploy notify`) · **Depende de:** 1.5, 1.7, 1.8

**Objetivo:** los cuatro workflows de DT §1.8 y las migraciones aplicadas en producción para que las fases 3–6 puedan probarse en preview contra datos reales.

**Ficheros:**
- Crear: `.github/workflows/ci.yml` (install → `turbo lint typecheck test` → `pnpm --filter web build` → Playwright contra `wrangler dev` (web + api con `scheduled` simulado) → `supabase start` + `db reset` + `rls.test.ts` → Lighthouse CI (se activa en 2.9)), `preview.yml` (`wrangler versions upload` web y api si cambió; comenta URLs en el PR), `deploy-production.yml` (`workflow_dispatch` con inputs `web`/`api`; **nunca migraciones**), `supabase-ping.yml` (cron semanal `GET ${SUPABASE_URL}/rest/v1/` con publishable key; si falla, `POST functions/v1/notify` con `system.ping_failed`).
- Documentar: `docs/superpowers/plans/2026-09-19-josecoded-v1.md` no cambia; `ESTADO.md` recibe la fecha de aplicación.

**Pasos:**
- [ ] 1. Escribir los cuatro workflows; abrir PR de `chore/monorepo` → `ci.yml` y `preview.yml` deben pasar (la URL de preview aparece en el PR).
- [ ] 2. **Pedir OK a Jose** en la sesión, listando las 8 migraciones y el despliegue de la Edge Function.
- [ ] 3. Controlador: `list_tables` (confirmar que no existen `blog_comments`, `affiliates`, `affiliate_rewards`, `upgrade_requests` ni las columnas nuevas) → `get_advisors` (security + performance, guardar salida) → `apply_migration` una a una en orden → `get_advisors` de nuevo: **ningún hallazgo nuevo salvo `security_definer_view` de `affiliate_leads_view`** (esperado, DT §6.4) → `supabase functions deploy notify` → `scripts/supabase-baseline.sh` para regenerar el baseline con el esquema ya migrado (el test 1.6 pasa a esperar 25 tablas y 47 + N políticas: actualizar `baseline.meta.json` y las cifras del test).
- [ ] 4. Anotar en `ESTADO.md` ("Decisiones recientes": migraciones aplicadas, advisors antes/después) y en el ADR de codebase-memory (tras indexar el repo en 9.6 o antes si ya hay código: `manage_adr get` + copia antes de `index_repository`).
- [ ] 5. Commit: `git commit -m "ci: ci, preview, production dispatch and supabase ping workflows"`.

**Hecho cuando:** CI verde en el PR, migraciones aplicadas con advisors limpios, baseline regenerado y test 1.6 actualizado.

**Cierre de la fase 1:** `revisor` sobre `chore/monorepo`; `/puerta-calidad` (sin UI: `qa` prueba `wrangler dev` de api y web, `revisor-seguridad` revisa CORS, `envSchema`, RLS y workflows). Merge a `main`. Arrancan en paralelo `feat/radar-core` (7.1–7.6) y `feat/glyph-scene` (2.5a).

---
## Fase 2 — Shell público, home con hero, i18n es/en, SEO + GEO · Estimación XL · ramas `feat/shell-home` y `feat/glyph-scene`

Insumo de interfaz: documento `ui` v3 (`2026-09-17-josecoded-ui.md`, en redacción). Referencia obligatoria: prototipo `docs/superpowers/design/ref/hero-lab-3/` (`styles.css` para tokens y fondo, `app.js` para la escena). Pantallas: UX §3 (shell), §4.1 (home), §3.6 (intro), §3.7 (motion), §3.10 (catálogo), §10.1–10.2 (microcopy), §12 (accesibilidad).

### Tarea 2.1 — i18n: mensajes, metadatos con `alternates` y `hasTranslation`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 1.5

**Objetivo:** estructura de `messages/{es,en}.json` por pantalla (claves de UX §10) y un helper único de metadatos con canonical, `alternates` es/en y `x-default` (spec §8, DT §1.4).

**Ficheros:**
- Crear: `apps/web/lib/seo/page-metadata.ts`, `apps/web/lib/seo/page-metadata.test.ts`, `apps/web/i18n/navigation.ts` (`createNavigation(routing)`), `apps/web/i18n/pathnames.ts` (mapa de rutas localizadas de UX §2.1: `/empresas`↔`/companies`, `/negocios`↔`/business`, `/propuesta`↔`/proposal`, `/proyectos`↔`/projects`, `/sobre-mi`↔`/about`, `/contacto`↔`/contact`, `/legal/aviso-legal`↔`/legal/notice`, `/legal/privacidad`↔`/legal/privacy`, `/auth/registro`↔`/auth/sign-up`, `/auth/codigo`↔`/auth/code`, `/perfil`↔`/profile`, `/area-clientes`↔`/client-area` y sus hijas).
- Modificar: `messages/es.json`, `messages/en.json` (claves `nav.*`, `footer.*`, `hero.*`, `proof.*`, `path.*`, `home.*` con los textos de UX §10.1–10.2; los `{{DATO}}` se dejan como `"{{DATO: nombre}}"` literal para que el test de 2.10 los detecte), `i18n/routing.ts` (`pathnames`).

**Interfaces (produce):** `pageMetadata({ locale, pathname, title, description, hasTranslation = true, ogImage? }): Metadata` — `canonical` sin prefijo para `es`, `/en/...` para `en`; `alternates.languages = { es, en, 'x-default': es }` solo si `hasTranslation`; `title ≤ 60`, `description ≤ 155` (lanza en dev si se supera).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/lib/seo/page-metadata.test.ts
import { it, expect } from 'vitest';
import { pageMetadata } from './page-metadata';
process.env.NEXT_PUBLIC_SITE_URL = 'https://josecoded.com';
it('es canonical without prefix, en under /en, alternates with x-default', () => {
  const m = pageMetadata({ locale:'es', pathname:'/negocios', title:'Webs para tu negocio', description:'d' });
  expect(m.alternates?.canonical).toBe('https://josecoded.com/negocios');
  expect(m.alternates?.languages).toEqual({ es:'https://josecoded.com/negocios', en:'https://josecoded.com/en/business', 'x-default':'https://josecoded.com/negocios' });
});
it('no alternates when the page has no translation', () => {
  const m = pageMetadata({ locale:'es', pathname:'/blog/solo-es', title:'t', description:'d', hasTranslation:false });
  expect(m.alternates?.languages).toBeUndefined();
});
it('rejects long titles', () => { expect(() => pageMetadata({ locale:'es', pathname:'/', title:'x'.repeat(61), description:'d' })).toThrow(/60/); });
```
- [ ] 2. `pnpm --filter web test -- page-metadata` → FAIL.
- [ ] 3. Implementar con `routing.pathnames` para traducir la ruta; `openGraph` y `twitter` con `ogImage ?? /og/<slug>.png` (los ficheros los genera 2.11).
- [ ] 4. `pnpm --filter web test -- page-metadata` → PASS. `pnpm --filter web e2e -- url-matrix` sigue en verde con `pathnames` (añadir `/en/business` y `/en/companies` a la matriz).
- [ ] 5. Commit: `git commit -m "feat(web): localized pathnames, message catalogs and metadata helper with alternates"`.

**Hecho cuando:** los tests pasan y `/en/business` renderiza con `<html lang="en">`.

### Tarea 2.2 — Tokens de diseño, tipografías, Tailwind v4, shadcn base y `Backdrop`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 1.5 · **Insumo:** `ui` v3 §1–§3 (tipografías, paleta, capas); si no está, `hero-lab-3/styles.css` (`--bg`, `--acc`, `--green`, grano 3,5 % / 180 px, rayo 10 % / 14 % / 214° / 48 px)

**Objetivo:** un solo fichero de tokens (`globals.css` con `@theme`) que toda la web y el admin consumen, fuentes autoalojadas y el fondo fijo `Backdrop` (DT §1.6.1).

**Ficheros:**
- Crear: `apps/web/app/globals.css` (`@import "tailwindcss"; @theme { --color-bg…; --font-display…; --fs-0…-6; --radius…; --shadow-edge… }`, reglas `prefers-reduced-motion`, `scrollbar-color`, `.sr-only`), `apps/web/lib/fonts.ts` (`next/font/google` con las familias que fije `ui`; por defecto las del prototipo: Sora 600/700/800, Manrope 400/500/600, JetBrains Mono 400/500/600, `display: 'swap'`, `adjustFontFallback`), `apps/web/components/layout/backdrop.tsx`, `apps/web/components/layout/backdrop.test.tsx`, `apps/web/components/ui/{button,sheet,dialog,toast,badge,input,textarea,select,table,tabs,skeleton}.tsx` (shadcn CLI, re-tematizados con los tokens), `apps/web/components.json`.
- Modificar: `app/[locale]/layout.tsx` (importa `globals.css`, aplica clases de fuentes al `<html>`).

**Pasos:**
- [ ] 1. Test que falla:
```tsx
// apps/web/components/layout/backdrop.test.tsx
import { render } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Backdrop } from './backdrop';
it('renders two fixed aria-hidden layers (grain + ray) without JS hooks', () => {
  const { container } = render(<Backdrop />);
  const layers = container.querySelectorAll('[aria-hidden="true"]');
  expect(layers).toHaveLength(2);
  expect(layers[0].className).toMatch(/backdrop__grain/); expect(layers[1].className).toMatch(/backdrop__ray/);
  expect(container.querySelector('script')).toBeNull();
});
```
- [ ] 2. `pnpm --filter web test -- backdrop` → FAIL.
- [ ] 3. Implementar tokens (nombres estables: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-dim`, `--color-accent`, `--color-green`, `--color-amber`, `--color-red`, `--color-border`), `Backdrop` con dos `div` fijos (`z-index: -1`, `pointer-events: none`), grano SVG `feTurbulence` en `background-image` y rayo con `linear-gradient` + `filter: blur(48px)` + `mask-image` al 55 %. `npx shadcn@4 init` + `add` de los 11 componentes; sustituir sus colores por los tokens.
- [ ] 4. `pnpm --filter web test -- backdrop` → PASS; `pnpm --filter web build` OK; pasar `web-design-guidelines` sobre `globals.css` y `components/ui`.
- [ ] 5. Commit: `git commit -m "feat(web): design tokens, self-hosted fonts, shadcn base and fixed Backdrop"`.

**Hecho cuando:** test en verde, `ui` confirma (o corrige en su documento) los tokens, contraste AA en los pares texto/fondo (`revisor-accesibilidad` lo mide en la puerta).

### Tarea 2.3 — `SiteHeader`, `MobileMenuSheet`, `LangSwitch`, `UserMenu`, `SiteFooter`, layout público y `PageTransition`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.1, 2.2 · **Insumo:** UX §3.2–3.5, §13.11b–11c; `ui` v3 (cabecera, pie)

**Objetivo:** la navegación clásica de UX §3 con sus islas cliente y el `template.tsx` con `ViewTransition` (DT §1.6.1, §1.6.6).

**Ficheros:**
- Crear: `apps/web/app/[locale]/(public)/layout.tsx` (`<Backdrop/>` + `<SiteHeader/>` + `<a href="#contenido" class="skip-link">` + `<main id="contenido">` + `<SiteFooter/>`), `app/[locale]/template.tsx` (`<ViewTransition>` de React 19 con 120/160 ms; sin animación bajo reduced-motion), `components/layout/site-header.tsx` (RSC), `components/layout/header-scroll-state.tsx` (isla: sentinela 80 px + `IntersectionObserver` → `data-scrolled`), `components/layout/mobile-menu-sheet.tsx` (shadcn `Sheet`, foco atrapado, `Escape`, `aria-current="page"`), `components/layout/lang-switch.tsx` (cambia a la ruta traducida; guarda `localStorage.locale_pref`), `components/layout/user-menu.tsx` (pinta "Entrar" en SSR; tras montar, `createBrowserClient` y avatar si hay sesión — el cliente Supabase de navegador se crea aquí como `lib/supabase/browser.ts`), `components/layout/site-footer.tsx` (cuatro grupos + "Esta web" desde `build-info.json` de 2.4; hasta entonces, valores de `content/generated/build-info.json` de ejemplo), tests `site-header.test.tsx`, `mobile-menu-sheet.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/layout/mobile-menu-sheet.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect } from 'vitest';
import { MobileMenuSheet } from './mobile-menu-sheet';
const links = [{ href:'/empresas', label:'Empresas' }, { href:'/negocios', label:'Negocios' }];
it('opens with the Menu button, marks current page and closes with Escape', () => {
  render(<MobileMenuSheet links={links} currentPath="/negocios" />);
  fireEvent.click(screen.getByRole('button', { name: 'Menú' }));
  const dialog = screen.getByRole('dialog', { name: 'Menú' });
  expect(dialog).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Negocios' }).getAttribute('aria-current')).toBe('page');
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});
```
```tsx
// apps/web/components/layout/site-header.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { SiteHeader } from './site-header';
it('has brand, five links, language switch, sign-in and contact CTA', () => {
  render(<SiteHeader locale="es" currentPath="/" />);
  expect(screen.getByRole('link', { name: 'josecoded' }).getAttribute('href')).toBe('/');
  for (const l of ['Empresas','Negocios','Proyectos','Blog','Sobre mí']) expect(screen.getByRole('link', { name: l })).toBeTruthy();
  expect(screen.getByRole('link', { name: /EN/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Contacto' })).toBeTruthy();
  expect(screen.getByText('Entrar')).toBeTruthy();
});
```
- [ ] 2. `pnpm --filter web test -- site-header mobile-menu` → FAIL.
- [ ] 3. Implementar según UX §3.2 (cabecera transparente sobre el hero, translúcida tras 80 px; en 375 px `[Contacto]` y "Menú" ≥ 44 px sin tocarse) y §3.5 (pie). Todo texto por `next-intl` (`useTranslations('nav')`).
- [ ] 4. `pnpm --filter web test -- site-header mobile-menu` → PASS; `pnpm --filter web build` OK; `web-design-guidelines` sobre los componentes.
- [ ] 5. Commit: `git commit -m "feat(web): classic navigation shell (header, mobile sheet, lang switch, user menu, footer, page transition)"`.

**Hecho cuando:** tests en verde; en `wrangler dev` la cabecera se ve en `/` y `/en`, el menú móvil atrapa el foco y "Saltar al contenido" es el primer tabulable.

### Tarea 2.4 — Datos del build: `build-info.ts`, `content/generated` y contadores de tests

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 1.7 (`routes-manifest`), 1.8 (migraciones en `supabase/migrations`)

**Objetivo:** `content/generated/build-info.json` con rama, commit, fecha, versión de Next, rutas del gateway, tablas y políticas RLS, y contadores de tests; la build **falla** si falta un campo (DT §2.1).

**Ficheros:**
- Crear: `apps/web/scripts/build-info.ts`, `apps/web/scripts/build-info.test.ts`, `apps/web/scripts/test-counts.ts` (lee `vitest run --reporter=json` y `playwright test --list --reporter=json` en CI → `content/generated/test-counts.json`; en local usa el commiteado), `apps/web/content/generated/{build-info.json,test-counts.json,perf.json}` (valores iniciales reales de la primera ejecución; `perf.json` con `{ measuredAt: null }` hasta 9.3), `apps/web/lib/content/build-info.ts` (`getBuildInfo()` tipado con zod).
- Modificar: `apps/web/package.json` (`prebuild: "tsx scripts/build-info.ts"`).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/scripts/build-info.test.ts
import { it, expect } from 'vitest';
import { computeBuildInfo } from './build-info';
it('computes all mandatory fields from repo sources', async () => {
  const info = await computeBuildInfo({ repoRoot: new URL('../../..', import.meta.url).pathname, env: { GITHUB_REF_NAME:'feat/x', GITHUB_SHA:'abcdef1234567' } });
  expect(info.branch).toBe('feat/x'); expect(info.commit).toBe('abcdef1');
  expect(info.nextVersion).toMatch(/^16\./);
  expect(info.gatewayRoutes).toBeGreaterThan(20);
  expect(info.supabase.tables).toBeGreaterThanOrEqual(25); expect(info.supabase.policies).toBeGreaterThan(47);
  expect(info.publishedAt === null || typeof info.publishedAt === 'string').toBe(true);
});
it('throws when a source is missing', async () => {
  await expect(computeBuildInfo({ repoRoot: '/nonexistent', env: {} })).rejects.toThrow(/routes-manifest|baseline/);
});
```
- [ ] 2. `pnpm --filter web test -- build-info` → FAIL.
- [ ] 3. Implementar: rama/commit de `GITHUB_*` o `git rev-parse`; Next de `pnpm-lock.yaml`; rutas importando `apps/api/src/routes-manifest.ts`; tablas/políticas contando `create table public.` y `create policy` en `supabase/schema/baseline.sql` + `supabase/migrations/*.sql`; `publishedAt` solo si `BUILD_KIND=production`.
- [ ] 4. `pnpm --filter web test -- build-info` → PASS; `pnpm --filter web build` genera el JSON.
- [ ] 5. Commit: `git commit -m "feat(web): build-info and test-counts generated at prebuild (build fails when missing)"`.

**Hecho cuando:** `build-info.json` se regenera en cada build y el pie "Esta web" (2.3) lo consume.

### Tarea 2.5a — `packages/glyph-scene`: `params`, `rng`, `clouds`, `paramsHash` (módulos puros)

**Agente:** implementador-web · **Rama:** `feat/glyph-scene` · **Gate:** no · **Depende de:** 0.2 (versión de `three`, decisión del bloom)

**Objetivo:** la geometría determinista de la escena, sin WebGL, para que poster, vídeo, sprites y escena viva compartan las mismas nubes (DT §1.6.2).

**Ficheros:**
- Crear: `packages/glyph-scene/package.json` (`@josecoded/glyph-scene`, `sideEffects: false`, `exports`), `src/params.ts` (`PARAMS` = valores aprobados del prototipo: `hold 3.5, morph 1.6, rot 0.18, size 16, bright 1, green 0.14, rain 0.7, scatter 0.6, breath 0.025, wperiod 4, wamp 0.6, bloom <0.3 o 0 según 0.2>, bloomth 0.72, focus 6.2, mirror 0.45`; `paramsHash()` = sha256 corto de `JSON.stringify(PARAMS)` + fuente de `clouds.ts` + `shaders.ts`), `src/rng.ts` (`mulberry32(seed)`), `src/clouds.ts` (`cloudCode`, `cloudPhone`, `cloudWeb`, `cloudChipBrain: (n, rng) => Float32Array` portadas de `app.js` del prototipo), `src/glyphs.ts` (`GLYPHS` del prototipo), tests `test/clouds.test.ts`, `test/rng.test.ts`, `test/params.test.ts`.

**Interfaces (produce):** `PARAMS`, `paramsHash(): string`, `mulberry32(seed: number): () => number`, `clouds = { code, phone, web, chip }` con firma `(n: number, rng: () => number) => Float32Array` de longitud `n*3`, `GLYPHS: string`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/glyph-scene/test/clouds.test.ts
import { it, expect } from 'vitest';
import { clouds } from '../src/clouds';
import { mulberry32 } from '../src/rng';
for (const name of ['code','phone','web','chip'] as const) {
  it(`${name} is deterministic and sized n*3 within bounds`, () => {
    const a = clouds[name](500, mulberry32(1)), b = clouds[name](500, mulberry32(1)), c = clouds[name](500, mulberry32(2));
    expect(a).toHaveLength(1500); expect(a).toEqual(b); expect(a).not.toEqual(c);
    for (const v of a) expect(Math.abs(v)).toBeLessThanOrEqual(3);
  });
}
it('phone cloud is taller than wide', () => {
  const p = clouds.phone(2000, mulberry32(1)); let maxX = 0, maxY = 0;
  for (let i = 0; i < p.length; i += 3) { maxX = Math.max(maxX, Math.abs(p[i])); maxY = Math.max(maxY, Math.abs(p[i+1])); }
  expect(maxY).toBeGreaterThan(maxX);
});
```
```ts
// packages/glyph-scene/test/params.test.ts
import { it, expect } from 'vitest';
import { PARAMS, paramsHash } from '../src/params';
it('has approved prototype values', () => { expect(PARAMS.hold).toBe(3.5); expect(PARAMS.morph).toBe(1.6); expect(PARAMS.green).toBe(0.14); expect(PARAMS.wperiod).toBe(4); });
it('hash is stable and 16 hex chars', () => { expect(paramsHash()).toMatch(/^[0-9a-f]{16}$/); expect(paramsHash()).toBe(paramsHash()); });
```
- [ ] 2. `pnpm --filter @josecoded/glyph-scene test` → FAIL.
- [ ] 3. Portar las funciones de nube de `app.js` sustituyendo cada `Math.random()` por `rng()`.
- [ ] 4. `pnpm --filter @josecoded/glyph-scene test` → PASS.
- [ ] 5. Commit: `git commit -m "feat(glyph-scene): deterministic params, rng and glyph clouds"`.

**Hecho cuando:** 6 tests en verde y el paquete no importa `three` todavía.

### Tarea 2.5b — `packages/glyph-scene`: `atlas`, `shaders`, `scene`, `intro`, `worker`, `index`

**Agente:** implementador-web · **Rama:** `feat/glyph-scene` · **Gate:** no · **Depende de:** 2.5a

**Objetivo:** `createGlyphScene()` con la API pública de DT §1.6.2, importación selectiva de `three`, cálculo de nubes en Web Worker, bucle de estados, arrastre, paralaje, vaivén del chip, pausa e intro (`uIntroT`).

**Ficheros:**
- Crear: `src/atlas.ts` (canvas 16×8 × 64 px con JetBrains Mono; `await document.fonts.load('600 46px "JetBrains Mono"')`; respaldo `ui-monospace`), `src/shaders.ts` (vertex/fragment del prototipo como strings, con `uIntroT`, `uProg`, `uTime`, `uBreath`, `uWave`), `src/scene.ts` (renderer, composer con bloom solo si `PARAMS.bloom > 0`, `Points` + dos clones para ondas y reflejo, máquina `hold/morph`, arrastre con inercia en `stage`, paralaje pasivo, vaivén ±0,22 rad en el estado chip, `pause/resume`, `layout`, `dispose`), `src/intro.ts`, `src/worker.ts` (calcula las cuatro nubes y las transfiere; fallback a `requestIdleCallback` por trozos), `src/index.ts` (exporta `createGlyphScene`, `PARAMS`, `paramsHash`, tipos `GlyphSceneOptions`, `GlyphScene`), `test/scene.test.ts` (happy-dom + stub de `WebGLRenderer`).

**Interfaces (produce; las consume 2.8 y 2.6):** exactamente la API de DT §1.6.2 (`createGlyphScene(o): Promise<GlyphScene>`; `GlyphScene = { start, stop, pause, resume, playIntro(t0), skipIntro, step(dt), layout, dispose }`; `onState(index: 0|1|2)`; `capture: true` → dt fijo, sin intro, `rot 0`, vaivén 5,1 s, respiración 3 ciclos / 15,3 s, ondas 3,825 s).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// packages/glyph-scene/test/scene.test.ts
import { it, expect, vi } from 'vitest';
vi.mock('three', async (orig) => ({ ...(await orig<any>()), WebGLRenderer: class { setSize(){} setPixelRatio(){} render(){} dispose(){} domElement = document.createElement('canvas'); getContext(){ return {}; } } }));
vi.mock('three/addons/postprocessing/EffectComposer.js', () => ({ EffectComposer: class { addPass(){} render(){} setSize(){} dispose(){} } }));
vi.mock('three/addons/postprocessing/RenderPass.js', () => ({ RenderPass: class {} }));
vi.mock('three/addons/postprocessing/UnrealBloomPass.js', () => ({ UnrealBloomPass: class {} }));
vi.mock('three/addons/postprocessing/OutputPass.js', () => ({ OutputPass: class {} }));
import { createGlyphScene } from '../src';
async function make() {
  const canvas = document.createElement('canvas'); const stage = document.createElement('div'); document.body.append(stage);
  const states: number[] = [];
  const s = await createGlyphScene({ canvas, stage, count: 200, seed: 1, capture: true, onState: i => states.push(i) });
  return { s, states };
}
it('hold 3.5 s then morph 1.6 s; a full cycle returns to state 0', async () => {
  const { s, states } = await make();
  s.step(3.4); expect(s.debug().phase).toBe('hold');
  s.step(0.2); expect(s.debug().phase).toBe('morph');
  s.step(1.6); expect(states).toEqual([1]);
  for (let t = 0; t < 2 * 5.1; t += 0.1) s.step(0.1);
  expect(states.at(-1)).toBe(0); expect(s.debug().uProg).toBeCloseTo(0, 1);
});
it('skipIntro sets uIntroT to 100 and pause stops stepping', async () => {
  const { s } = await make(); s.playIntro(0); expect(s.debug().uIntroT).toBeLessThan(100); s.skipIntro(); expect(s.debug().uIntroT).toBe(100);
});
```
- [ ] 2. `pnpm --filter @josecoded/glyph-scene test -- scene` → FAIL.
- [ ] 3. Implementar; exponer `debug()` (solo lectura: `phase`, `uProg`, `uIntroT`, `state`) para tests y captura. Worker con `new Worker(new URL('./worker.ts', import.meta.url), { type:'module' })`.
- [ ] 4. `pnpm --filter @josecoded/glyph-scene test` → PASS; `pnpm --filter @josecoded/glyph-scene test -- bundle-budget` (heredado del spike, ahora sobre `src/index.ts`) → PASS ≤ 200 KB gz.
- [ ] 5. Commit: `git commit -m "feat(glyph-scene): three.js scene with deterministic loop, drag, intro and worker clouds"`.

**Hecho cuando:** tests en verde, bundle ≤ 200 KB gz, y `render/index.html` (2.6) muestra la escena en un navegador con `?debug=1`.

### Tarea 2.6 — Medios del hero generados desde la escena (`render-media.ts`, `media.json`, `hero:media:check`)

**Agente:** implementador-web · **Rama:** `feat/glyph-scene` · **Gate:** no · **Depende de:** 2.5b, 0.2

**Objetivo:** producir y commitear `apps/web/public/hero/{video.webm,video.mp4,poster.avif,poster.webp,mini-chip.avif,mini-phone.avif,media.json}` con los topes de DT §1.6.3 y un check de frescura en CI.

**Ficheros:**
- Crear: `packages/glyph-scene/render/index.html`, `scripts/render-media.ts` (del spike 0.2, completado con sprites 24 fotogramas × 256 px para estados chip y móvil, PSNR, tamaños, `media.json`), `scripts/check-media.ts` (`hero:media:check`), `test/check-media.test.ts`; los medios en `apps/web/public/hero/`.
- Modificar: `packages/glyph-scene/package.json` (scripts `hero:media`, `hero:media:check`), raíz `package.json`.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// packages/glyph-scene/test/check-media.test.ts
import { it, expect } from 'vitest';
import { checkMedia } from '../scripts/check-media';
it('fails when paramsHash differs or a file exceeds its limit', () => {
  const ok = { generatedAt:'2026-09-20', paramsHash:'deadbeefdeadbeef', seed:1, files:{ 'video.webm':300000, 'video.mp4':350000, 'poster.avif':40000, 'poster.webp':55000, 'mini-chip.avif':70000, 'mini-phone.avif':60000 } };
  expect(checkMedia(ok, 'deadbeefdeadbeef')).toEqual({ ok:true, errors:[] });
  expect(checkMedia({ ...ok, paramsHash:'0000000000000000' }, 'deadbeefdeadbeef').errors[0]).toMatch(/paramsHash/);
  expect(checkMedia({ ...ok, files:{ ...ok.files, 'video.webm': 400001 } }, 'deadbeefdeadbeef').errors[0]).toMatch(/video\.webm.*400/);
  expect(checkMedia({ ...ok, files:{ ...ok.files, 'poster.avif': 61441 } }, 'deadbeefdeadbeef').errors[0]).toMatch(/poster\.avif.*60/);
});
```
- [ ] 2. `pnpm --filter @josecoded/glyph-scene test -- check-media` → FAIL.
- [ ] 3. Implementar `checkMedia(manifest, currentHash)` (topes 400/400/60/60/80/80 KB) y el script que además comprueba que cada fichero existe en disco con esos bytes. Ejecutar `pnpm hero:media` en el Mac (ffmpeg por Homebrew): captura 459 frames, PSNR ≥ 35, vídeo, poster (frame 15), sprites, `media.json`.
- [ ] 4. `pnpm --filter @josecoded/glyph-scene test` → PASS; `pnpm hero:media:check` → OK.
- [ ] 5. Commit (medios incluidos): `git commit -m "feat(hero): generated video, poster and sprites from the glyph scene with freshness check"`.

**Hecho cuando:** `hero:media:check` pasa y los seis ficheros cumplen sus topes; `ci.yml` ejecuta el check (2.9).

### Tarea 2.7 — `FallText`, gate inline de la intro, `IntroFall` y `compile-reveal`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.3, 2.5a (`GLYPHS`) · **Insumo:** UX §3.6, §3.7; DT §1.6.4–1.6.6

**Objetivo:** intro de caída sin GSAP, con texto partido en el servidor, gate en `<head>` antes del primer paint y `CompileReveal` v3 para los `h2`.

**Ficheros:**
- Crear: `apps/web/components/hero/fall-text.tsx` (RSC: `<span class="sr-only">{text}</span><span aria-hidden><span class="w"><span class="ch" data-ch="J">J</span>…</span></span>`), `apps/web/components/hero/intro-gate-script.tsx` (inline `<script>` ≤ 400 bytes, solo en `/` y `/en`), `apps/web/components/hero/intro-fall.tsx` (isla cliente), `apps/web/lib/motion/intro-fall.ts` (lógica pura: `planFall(chars, seed)`, `tick`, `finish`), `apps/web/lib/motion/compile-reveal.ts`, `apps/web/lib/motion/gsap.ts` (`import()` de `gsap` + `ScrollTrigger` bajo `matchMedia('(prefers-reduced-motion: no-preference)')`), `apps/web/app/globals.css` (`[data-intro=pending] .ch { visibility:hidden }`, `.is-falling`, `.is-wet`, `.is-forming`, reglas reduced-motion), tests `fall-text.test.tsx`, `intro-fall.test.ts`, `compile-reveal.test.ts`.

**Interfaces (produce):** `<FallText as="h1"|"p"|"span" text={string} />`; `planFall(chars: HTMLElement[], seed: number, innerHeight: number): { el, start, landT, glyph }[]` con `landT ∈ [0.4, 1.2]`; `runIntro({ root, sceneReady?: Promise<{ playIntro(t0): void; skipIntro(): void }>, onDone(evt: { skipped: boolean; reduced: boolean; mode: 'full'|'letters'|'none' }) })`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/hero/fall-text.test.tsx
import { render } from '@testing-library/react';
import { it, expect } from 'vitest';
import { FallText } from './fall-text';
it('keeps accessible text and splits visible chars into indivisible words', () => {
  const { container } = render(<FallText as="h1" text="Jose Carlos Sánchez" />);
  expect(container.querySelector('h1 .sr-only')?.textContent).toBe('Jose Carlos Sánchez');
  const hidden = container.querySelector('h1 [aria-hidden="true"]')!;
  expect(hidden.querySelectorAll('.w')).toHaveLength(3);
  expect(hidden.querySelectorAll('.ch')).toHaveLength(17);
  expect(container.querySelectorAll('h1')).toHaveLength(1);
});
```
```ts
// apps/web/lib/motion/intro-fall.test.ts
import { it, expect, vi } from 'vitest';
import { planFall, runIntro } from './intro-fall';
function chars(n: number) { return Array.from({ length: n }, (_, i) => { const s = document.createElement('span'); s.className = 'ch'; s.dataset.ch = String.fromCharCode(65 + (i % 26)); s.textContent = s.dataset.ch; document.body.append(s); return s; }); }
it('every landing time is within [0.4, 1.2] s and deterministic per seed', () => {
  const a = planFall(chars(40), 7, 800), b = planFall(chars(40), 7, 800);
  for (const p of a) { expect(p.landT).toBeGreaterThanOrEqual(0.4); expect(p.landT).toBeLessThanOrEqual(1.2); expect(p.start).toBeLessThan(0); }
  expect(a.map(p => p.landT)).toEqual(b.map(p => p.landT));
});
it('finish() lands everything in one frame and keeps final letters', () => {
  vi.useFakeTimers(); document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div'); root.append(...chars(10)); document.body.append(root);
  const onDone = vi.fn();
  runIntro({ root, onDone });
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  vi.advanceTimersByTime(200);
  for (const el of root.querySelectorAll<HTMLElement>('.ch')) { expect(el.textContent).toBe(el.dataset.ch); expect(el.classList.contains('is-falling')).toBe(false); expect(el.style.transform).toBe(''); }
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ skipped: true }));
  expect(document.documentElement.dataset.intro).toBeUndefined();
});
```
- [ ] 2. `pnpm --filter web test -- fall-text intro-fall` → FAIL.
- [ ] 3. Implementar según DT §1.6.4 (bucle rAF idéntico a `tickChars` del prototipo; `finish` ante `pointerdown|keydown|wheel|touchstart|scroll` en `window` con `once`; espera `min(sceneReady, 1200 ms)`; solo muta `style`, `class`, `textContent` de `.ch`). Gate inline: `if(!sessionStorage.intro_seen||location.search.includes('intro=1'))&&!matchMedia('(prefers-reduced-motion: reduce)').matches → document.documentElement.dataset.intro='pending'; sessionStorage.intro_seen='1'; setTimeout(()=>delete dataset.intro, 2500)`, todo en `try/catch`. `compile-reveal.ts`: `ScrollTrigger.batch('.reveal h2', { once:true, onEnter: resolveLeftToRight(≤300 ms) })`.
- [ ] 4. `pnpm --filter web test -- fall-text intro-fall compile-reveal` → PASS.
- [ ] 5. Commit: `git commit -m "feat(web): server-split FallText, pre-paint intro gate, IntroFall and CompileReveal"`.

**Hecho cuando:** tests en verde y, en `wrangler dev`, la primera visita a `/` muestra la caída y la segunda no; `?intro=1` la fuerza.

### Tarea 2.8 — `HeroMedia`, `HeroSceneGate`, `HeroSplit` e integración de la escena tras el LCP

**Agente:** implementador-web · **Rama:** `feat/shell-home` (tras mergear `feat/glyph-scene`) · **Gate:** no · **Depende de:** 2.5b, 2.6, 2.7 · **Insumos:** nombre a mostrar (UX §18.1), subtítulo alternativa B fijado por `redactor`, `ui` §13.21 (indicador sin palabras o nada)

**Objetivo:** el bloque 1 de la home (UX §4.1) con la tabla de modos `scene|video|poster`, poster en el HTML en todos los viewports, `three` por `import()` tras el LCP y canvas con fundido (DT §1.6.2 pasos 1–6, §1.6.3).

**Ficheros:**
- Crear: `apps/web/components/hero/hero-split.tsx` (RSC: badge con `FallText`, `h1` con `FallText`, subtítulo, `[[ Ver proyectos ]]`, `> Una web para mi negocio →`, columna `HeroMedia`; badge condicional a `{{DATO: disponibilidad}}`), `components/hero/hero-media.tsx` (markup literal de DT §1.6.3 con `<picture>` poster `fetchpriority="high"`, `<video hidden preload="none">` sin `<source>`, `<canvas hidden>`; `<link rel="preload" as="image">` del poster en `head`), `components/hero/hero-scene-gate.tsx` (isla ~1 KB), `lib/hero/gate.ts` (`decideHeroMode(ctx): 'scene'|'video'|'poster'`), `lib/hero/gate.test.ts`, `lib/hero/load-scene.ts` (espera `largest-contentful-paint` con `PerformanceObserver({ buffered:true })` o 1 500 ms → `import('@josecoded/glyph-scene')` → `requestIdleCallback` → `createGlyphScene` → fundido 1 s → poster `visibility:hidden`; `IntersectionObserver` + `visibilitychange` → pause/resume; `pointerdown` en `stage` → evento `scene_drag` una vez), `components/hero/scene-state-indicator.tsx` (según `ui` §13.21; si "nada", no se crea).
- Modificar: `app/[locale]/page.tsx` (home con `HeroSplit` + `IntroGateScript` + `IntroFall`), `messages/{es,en}.json` (`hero.*` con el subtítulo B; `hero.title` con el nombre a mostrar o `{{DATO}}`).

**Pasos:**
- [ ] 1. Test que falla (tabla de UX §4.1):
```ts
// apps/web/lib/hero/gate.test.ts
import { it, expect } from 'vitest';
import { decideHeroMode } from './gate';
const desktop = { webgl2:true, minWidth900:true, reducedMotion:false, saveData:false, deviceMemory:8, liveMobileFlag:false };
it.each([
  [desktop, 'scene'],
  [{ ...desktop, minWidth900:false }, 'video'],
  [{ ...desktop, webgl2:false }, 'video'],
  [{ ...desktop, deviceMemory:2 }, 'video'],
  [{ ...desktop, saveData:true }, 'poster'],
  [{ ...desktop, reducedMotion:true }, 'poster'],
  [{ ...desktop, minWidth900:false, liveMobileFlag:true }, 'scene'],
  [{ ...desktop, minWidth900:false, liveMobileFlag:true, deviceMemory:2 }, 'video'],
])('%o → %s', (ctx, mode) => expect(decideHeroMode(ctx)).toBe(mode));
```
- [ ] 2. `pnpm --filter web test -- gate` → FAIL.
- [ ] 3. Implementar; en modo `video`, tras el LCP: añadir `<source src="/hero/video.webm?v=…" type="video/webm">` y mp4, `load()` en idle, quitar `hidden`, `play()`; en `canplay` ocultar el poster sin fundido. `aspect-ratio: 1/1`, ≤ 78 svh escritorio, ≤ 38 svh móvil, 34 svh en `max-height: 700px`. `touch-action: pan-y` en `stage`. `role="img"` + `aria-label` "Partículas de código que forman un móvil, una web y un chip de IA".
- [ ] 4. `pnpm --filter web test -- gate` → PASS; `pnpm --filter web build` OK; en `wrangler dev` escritorio: poster visible al instante, canvas aparece ≤ 3 s, arrastre gira; móvil (DevTools 390×844): vídeo reproduce, no hay canvas.
- [ ] 5. `web-design-guidelines` sobre `hero-split.tsx` y `hero-media.tsx`.
- [ ] 6. Commit: `git commit -m "feat(web): hero split with HeroMedia poster/video and deferred glyph scene"`.

**Hecho cuando:** los 8 casos del gate pasan; verificación manual de los tres modos; presupuesto vertical móvil de UX §4.1 (661 px ≤ 667) comprobado con el nombre real en 375×667 (si el dato aún falta, se comprueba con el del prototipo y se reabre al llegar).

### Tarea 2.9 — `check-hero-bundle`, Lighthouse CI y `lhci:assert-lcp-element`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.8

**Objetivo:** los presupuestos del hero como tests de CI, no como estimación (DT §1.6.7, §8.5, §8.6).

**Ficheros:**
- Crear: `apps/web/scripts/check-hero-bundle.ts`, `apps/web/scripts/check-hero-bundle.test.ts` (sobre un manifiesto de ejemplo en `tests/fixtures/app-build-manifest.json`), `apps/web/lighthouserc.json` (URLs `/`, `/en`, más las de 3.x cuando existan; preset móvil 4G `rttMs 150, throughputKbps 1600, cpuSlowdownMultiplier 4`, 3 pasadas; asserts `performance ≥ 0.9`, `accessibility ≥ 0.95`, `seo == 1`, `best-practices ≥ 0.9`, `largest-contentful-paint ≤ 2500`, `cumulative-layout-shift ≤ 0.1`, `total-blocking-time ≤ 200`; preset escritorio para `/` y `/en` con `largest-contentful-paint ≤ 1200`), `apps/web/scripts/lhci-assert-lcp-element.ts` (lee el JSON de LHCI; falla si `largest-contentful-paint-element` no es `h1` ni `img.hero-media__poster`).
- Modificar: `.github/workflows/ci.yml` (pasos `check:hero-bundle`, `hero:media:check`, `lhci autorun`, `lhci:assert-lcp-element`).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/scripts/check-hero-bundle.test.ts
import { it, expect } from 'vitest';
import { analyzeManifest } from './check-hero-bundle';
const chunks = { 'static/chunks/app/[locale]/page-abc.js': 'export const x=1;', 'static/chunks/three-xyz.js': 'class WebGLRenderer{}', 'static/chunks/worker-1.js': 'postMessage(1)' };
it('fails if an initial chunk contains three', () => {
  const r = analyzeManifest({ pages: { '/[locale]/page': ['static/chunks/app/[locale]/page-abc.js', 'static/chunks/three-xyz.js'] } }, chunks, { sceneBudget: 200*1024, homeBudget: 350*1024 });
  expect(r.ok).toBe(false); expect(r.errors[0]).toMatch(/three.*initial/);
});
it('passes and reports sizes when three is only in lazy chunks', () => {
  const r = analyzeManifest({ pages: { '/[locale]/page': ['static/chunks/app/[locale]/page-abc.js'] } }, chunks, { sceneBudget: 200*1024, homeBudget: 350*1024 });
  expect(r.ok).toBe(true); expect(r.sceneGz).toBeGreaterThan(0); expect(r.homeGz).toBeGreaterThan(0);
});
```
- [ ] 2. `pnpm --filter web test -- check-hero-bundle` → FAIL.
- [ ] 3. Implementar (`zlib.gzipSync` por chunk; chunks "de la escena" = los que contienen `WebGLRenderer` o `three.module` + el worker de nubes).
- [ ] 4. `pnpm --filter web test -- check-hero-bundle` → PASS; `pnpm --filter web build && pnpm check:hero-bundle` → imprime `sceneGz ≤ 204800`, `homeGz ≤ 358400`; `pnpm lhci` contra `wrangler dev` → asserts en verde y elemento LCP correcto.
- [ ] 5. Commit: `git commit -m "ci(web): hero bundle budget, Lighthouse CI thresholds and LCP element assertion"`.

**Hecho cuando:** CI del PR ejecuta los tres checks y pasan.

### Tarea 2.10 — Resto de la home: `ProofStrip`, `PathPanel`, proyectos, `BuildFacts`, último artículo, contacto

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.4, 2.6 (sprites), 2.7 (`CompileReveal`) · **Insumos:** datos §18 (2–15), `ui` v3 §13.11c–11d, UX §4.1 bloques 2–7, §10.2

**Objetivo:** bloques 2–7 de la home con datos reales o no renderizados (regla UX §18).

**Ficheros:**
- Crear: `components/home/proof-strip.tsx`, `components/home/path-panel.tsx` (panel-enlace con enlace secundario independiente; miniatura sprite `mini-chip.avif`/`mini-phone.avif` con `steps(24)` al hover/foco solo en escritorio y sin reduced-motion), `components/home/build-facts.tsx` (esquema en texto monoespaciado + `FactList` desde `build-info.json`, `test-counts.json`, `perf.json`), `components/home/latest-post.tsx` (lee `content/generated/blog-index.json`; hasta 4.2, si está vacío no renderiza), `components/home/who-answers.tsx`, `components/shared/fact-list.tsx`, `lib/content/dato.ts` (`hasDato(key)`: `false` si el mensaje empieza por `{{DATO`), `lib/content/dato.test.ts`, `components/home/path-panel.test.tsx`.
- Modificar: `app/[locale]/page.tsx` (todos los bloques; cada `h2` con `FallText` + `.reveal`), `messages/*.json` (`proof.*`, `path.*`, `home.thisweb.*`, `home.who.*`).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/content/dato.test.ts
import { it, expect } from 'vitest';
import { hasDato } from './dato';
it('detects unresolved facts', () => { expect(hasDato('{{DATO: ciudad}}')).toBe(false); expect(hasDato('Madrid')).toBe(true); expect(hasDato('')).toBe(false); });
```
```tsx
// apps/web/components/home/path-panel.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { PathPanel } from './path-panel';
it('whole panel is a link and the secondary link is independent', () => {
  render(<PathPanel path="companies" href="/empresas" title="Trabajo con empresas" facts={['a','b','c']} secondary={{ href:'/contacto?via=empresa', label:'Reservar 20 min' }} sprite="/hero/mini-chip.avif" />);
  const links = screen.getAllByRole('link'); expect(links).toHaveLength(2);
  expect(links[0].getAttribute('href')).toBe('/empresas'); expect(links[1].getAttribute('href')).toBe('/contacto?via=empresa');
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});
```
- [ ] 2. `pnpm --filter web test -- dato path-panel` → FAIL.
- [ ] 3. Implementar; `ProofStrip` con 5 hechos (apps publicadas, repos públicos, LCP < 1 s si `perf.json` lo dice, tarifas, disponibilidad) y omisión por hecho sin dato; `PathPanel` dispara `path_open {path}` (2.12).
- [ ] 4. `pnpm --filter web test -- dato path-panel` → PASS; build OK; `web-design-guidelines`.
- [ ] 5. Commit: `git commit -m "feat(web): home blocks (proof strip, path panels with sprites, projects, build facts, who answers)"`.

**Hecho cuando:** tests en verde y en `wrangler dev` la home muestra solo los bloques con datos reales; `usuario-ejemplo` (Marta y Dani) valida "sin scroll se entiende qué hace Jose, para quién y cómo contactar" en 390×844.

### Tarea 2.11 — SEO/GEO base: JSON-LD, `sitemap`, `robots`, OG generadas, `llms.txt`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.1, 2.10 · **Insumos:** nombre, usuario de GitHub, cuentas de stores, LinkedIn (§18)

**Objetivo:** los criterios de spec §8 que no dependen de páginas concretas (DT §2 SEO/GEO, §8.3).

**Ficheros:**
- Crear: `apps/web/lib/seo/jsonld.ts` (`personJsonLd()`, `organizationJsonLd()`, `webSiteJsonLd()`, `profilePageJsonLd()`, `serviceOfferJsonLd(pack)`, `faqJsonLd(items)`, `softwareApplicationJsonLd(project)`, `blogPostingJsonLd(post)`), `apps/web/tests/jsonld.test.ts` (snapshots + shapes), `app/sitemap.ts` (ambos idiomas, `lastmod` desde git/`blog-index`), `app/robots.ts` (permite `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`; bloquea `/admin`, `/area-clientes`, `/auth`), `scripts/og.ts` (satori + resvg → `public/og/<slug>.png` en `prebuild`), `scripts/llms.ts` (`public/llms.txt` y `llms-full.txt` desde `messages`, `content/` y `blog-index`), `components/seo/json-ld.tsx`.
- Modificar: `app/[locale]/layout.tsx` (JSON-LD `Person` + `Organization` + `WebSite` site-wide), `package.json` (`prebuild` encadena `build-info`, `og`, `llms`).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/tests/jsonld.test.ts
import { it, expect } from 'vitest';
import { personJsonLd, webSiteJsonLd, serviceOfferJsonLd } from '../lib/seo/jsonld';
import { pricing } from '@josecoded/pricing';
it('Person has sameAs URLs and canonical name', () => {
  const p = personJsonLd('es'); expect(p['@type']).toBe('Person'); expect(Array.isArray(p.sameAs)).toBe(true);
  for (const u of p.sameAs) expect(u).toMatch(/^https:\/\//); expect(p.name).not.toMatch(/Jose Dev/);
});
it('WebSite has SearchAction', () => expect(webSiteJsonLd('es').potentialAction['@type']).toBe('SearchAction'));
it('Service offer price comes from pricing.json', () => {
  const s = serviceOfferJsonLd(pricing.packs[1], 'es');
  expect(s.offers.priceSpecification.price).toBe(1400); expect(s.offers.priceSpecification.priceCurrency).toBe('EUR'); expect(s.areaServed).toBe('ES');
});
it('snapshots', () => { expect(personJsonLd('es')).toMatchSnapshot(); expect(serviceOfferJsonLd(pricing.packs[0], 'en')).toMatchSnapshot(); });
```
- [ ] 2. `pnpm --filter web test -- jsonld` → FAIL.
- [ ] 3. Implementar; `robots.ts` y `sitemap.ts` con `routing`; scripts de OG y `llms.txt`.
- [ ] 4. `pnpm --filter web test -- jsonld` → PASS; `curl localhost:8787/robots.txt` y `/sitemap.xml` correctos; `public/llms.txt` generado y sin `{{DATO`.
- [ ] 5. Commit: `git commit -m "feat(web): site-wide JSON-LD, sitemap, robots, generated OG images and llms.txt"`.

**Hecho cuando:** tests y snapshots en verde; el validador de schema.org (manual, `qa`) no da errores en `/`.

### Tarea 2.12 — Analítica en cliente: `lib/analytics.ts` y eventos del hero y la home

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.8, 2.10

**Objetivo:** `track()` seguro sin Umami cargado, y los eventos `intro_played {skipped, reduced, mode}`, `path_open {path}`, `scene_drag` (DT §5.6; los `<Script>` de Umami y CF Web Analytics llegan en 9.2).

**Ficheros:** `apps/web/lib/analytics.ts`, `apps/web/lib/analytics.test.ts`; modificar `intro-fall.tsx`, `path-panel.tsx`, `load-scene.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/lib/analytics.test.ts
import { it, expect, vi } from 'vitest';
import { track } from './analytics';
it('is a no-op without umami and forwards when present', () => {
  expect(() => track('intro_played', { skipped: true, reduced: false, mode: 'full' })).not.toThrow();
  (window as any).umami = { track: vi.fn() };
  track('path_open', { path: 'business' });
  expect((window as any).umami.track).toHaveBeenCalledWith('path_open', { path: 'business' });
});
it('rejects unknown event names at type level', () => { // @ts-expect-error
  track('unknown_event'); });
```
- [ ] 2. → FAIL. 3. Implementar con un tipo `EventMap` de los 11 nombres de DT §5.6. 4. → PASS. 5. Commit: `git commit -m "feat(web): typed analytics tracker and hero/home events"`.

**Hecho cuando:** test en verde; Playwright (2.14) intercepta `POST /api/send` con `intro_played`.

### Tarea 2.13 — Medición del hero en móvil (decisión `HERO_LIVE_MOBILE`)

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no (usa la preview del PR) · **Depende de:** 2.9, `preview.yml`

**Objetivo:** decidir con datos si móvil lleva escena viva (DT §11.11 c).

**Pasos:**
- [ ] 1. Añadir soporte de `?hero=live` en `HeroSceneGate` **solo cuando `NEXT_PUBLIC_SITE_URL` contiene `workers.dev`** (nunca en producción), que fuerza `liveMobileFlag=true`.
- [ ] 2. Sobre la URL de preview: `lhci collect --url=<preview>/?hero=live --preset=mobile --numberOfRuns=5` y lo mismo sin `?hero=live`. Recoger p75 de LCP, TBT, CLS de ambas.
- [ ] 3. Si con escena viva p75 LCP ≤ 2 500 ms, TBT ≤ 200 ms y CLS ≤ 0,1 → `NEXT_PUBLIC_HERO_LIVE_MOBILE=true` en `wrangler.jsonc` `vars`; si no, queda `false`. Anotar cifras en `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` §2.13 y en `ESTADO.md`.
- [ ] 4. Commit: `git commit -m "docs: mobile hero measurement and HERO_LIVE_MOBILE decision"`.

**Hecho cuando:** hay cifras de 5 pasadas por variante y la var está fijada.

### Tarea 2.14 — E2E del hero y de la home

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.8, 2.12

**Objetivo:** las filas "Home sin scroll", "Hero: intro y modos" y "Reduced motion" de DT §8.2 como tests Playwright.

**Ficheros:** `apps/web/e2e/home.spec.ts`, `apps/web/e2e/hero.spec.ts`, `apps/web/e2e/helpers/{reduced-motion,save-data,umami}.ts`.

**Pasos:**
- [ ] 1. Escribir los tests (fallan hasta ajustar detalles):
```ts
// apps/web/e2e/hero.spec.ts (extracto)
import { test, expect } from '@playwright/test';
test.describe('hero desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test('first visit: pending before paint, letters land ≤ 1.5 s, three after LCP, canvas visible', async ({ page }) => {
    await page.addInitScript(() => { (window as any).__pending = []; new MutationObserver(() => (window as any).__pending.push(document.documentElement.dataset.intro)).observe(document.documentElement, { attributes: true }); });
    await page.goto('/');
    expect(await page.evaluate(() => (window as any).__pending[0])).toBe('pending');
    await expect.poll(async () => page.evaluate(() => [...document.querySelectorAll('.ch')].every(e => e.textContent === (e as HTMLElement).dataset.ch)), { timeout: 1500 }).toBe(true);
    expect(await page.evaluate(() => sessionStorage.getItem('intro_seen'))).toBe('1');
    const order = await page.evaluate(() => { const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1)?.startTime ?? 0; const three = performance.getEntriesByType('resource').find(r => /three|glyph/.test(r.name))?.startTime ?? Infinity; return { lcp, three }; });
    expect(order.three).toBeGreaterThan(order.lcp);
    await expect(page.locator('canvas.hero-media__canvas')).toHaveCSS('opacity', '1', { timeout: 3000 });
    await expect(page.locator('img.hero-media__poster')).toBeHidden();
  });
  test('second visit has no intro; ?intro=1 forces it; Tab skips within 200 ms', async ({ page }) => { /* como DT §8.2 */ });
});
test.describe('hero mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });
  test('video after LCP, no canvas; saveData → no video request; reduced-motion → poster only', async ({ page, context }) => { /* como DT §8.2 */ });
});
```
```ts
// apps/web/e2e/home.spec.ts
import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true });
test('thesis, two paths and CTA visible without scroll; single h1; no console errors', async ({ page }) => {
  const errors: string[] = []; page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  for (const name of [/Ver proyectos/, /Una web para mi negocio/]) await expect(page.getByRole('link', { name })).toBeInViewport();
  expect(await page.locator('h1').count()).toBe(1);
  expect(errors).toEqual([]);
});
```
- [ ] 2. `pnpm --filter web e2e -- hero home` → corregir hasta PASS.
- [ ] 3. Commit: `git commit -m "test(web): e2e for hero modes, intro and home above the fold"`.

**Hecho cuando:** los E2E pasan en CI contra `wrangler dev` en ambos viewports.

**Cierre de la fase 2:** `revisor` sobre `feat/shell-home`; `ui` revisa la implementación contra el prototipo (decisiones §13.3, §13.11b–11d, §13.21) y sus tokens; `/puerta-calidad` completa (`usuario-ejemplo` con Marta y Dani en la home; `revisor-accesibilidad` con la intro, `role="img"`, teclado; `qa` con 60 fps en escritorio y un Android de gama media). Merge a `main`.

---
## Fase 3 — Páginas públicas, generador, leads vía gateway, contacto, Cal.com, Turnstile · Estimación L · ramas `feat/public-pages` (3.1–3.6) y `feat/generator-leads` (3.7–3.12)

Pantallas: UX §4.2–4.6, §4.9–4.10, §4.12 (páginas), §4.4 y §9.1 (generador), §9.2–9.3 (contacto), §10.2–10.4 (microcopy). Insumo `ui` v3: `PackCard`, `ExtraCard`, `PriceTag`, `GuidedChat`, `ProposalCard`, `ProjectCard`, `ContactForm`, `CalEmbed`, `WhatsAppButton`.

### Tarea 3.1 — Contenido versionado y scripts de build: proyectos, servicios, FAQ, GitHub y stores

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 2.4 · **Insumos:** datos §18 (4–8, 12, 14, 15), `GITHUB_TOKEN` en Actions

**Objetivo:** `content/` como única fuente de fichas y textos largos, con esquema zod, y los datos externos (GitHub, stores) generados en build con respaldo commiteado (DT §5.1, §5.2).

**Ficheros:**
- Crear: `apps/web/content/projects/{tres-cat-info,hazmefila,oportunix}.json` (+ `webs-*.json` si Jose aporta webs de comercios), `content/projects/schema.ts` (`{ slug, name, type:'app'|'web'|'this-site', oneLiner:{es,en}, proofs:{ appStoreId?, playPackage?, webUrl?, repoUrl? }, hideMetrics?, hideStack?, stack?, year, screenshots[] }`), `content/services/{companies,business}.{es,en}.md`, `content/faq/business.{es,en}.json`, `scripts/github.ts` (REST + GraphQL → `content/generated/github.json`; fallback al commiteado), `scripts/stores.ts` (iTunes Lookup + `google-play-scraper` → `content/generated/stores.json`; fallback), `scripts/content-index.ts` (esqueleto para blog; ordena proyectos por número de pruebas verificables → `content/generated/projects-index.json`), `.github/workflows/content-refresh.yml` (cron 04:00: scripts + `perf.ts` (9.3) → commit `chore(content): refresh generated data` → build → **`wrangler deploy` web solo si el diff se limita a `content/generated/*`**, decisión P4), tests `content/projects/schema.test.ts`, `scripts/content-index.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/scripts/content-index.test.ts
import { it, expect } from 'vitest';
import { rankProjects } from './content-index';
const p = (slug: string, proofs: Record<string, string>, hideMetrics = false, year = 2026) => ({ slug, proofs, hideMetrics, year });
it('orders by number of verifiable proofs, then recency; reduced 3catinfo never first', () => {
  const r = rankProjects([p('tres-cat-info', { appStoreId:'1', playPackage:'x' }, true, 2024), p('hazmefila', { repoUrl:'r' }, false, 2026), p('oportunix', { webUrl:'w', repoUrl:'r' }, false, 2026)]);
  expect(r.map(x => x.slug)).toEqual(['oportunix', 'hazmefila', 'tres-cat-info']);
});
```
```ts
// apps/web/content/projects/schema.test.ts
import { it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { projectSchema } from './schema';
it('every project file validates and 3catinfo hides metrics and stack', () => {
  const files = readdirSync(new URL('.', import.meta.url)).filter(f => f.endsWith('.json'));
  expect(files.length).toBeGreaterThanOrEqual(3);
  for (const f of files) { const j = projectSchema.parse(JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'))); if (j.slug === 'tres-cat-info') { expect(j.hideMetrics).toBe(true); expect(j.hideStack).toBe(true); } }
});
```
- [ ] 2. → FAIL. 3. Implementar (una ficha reducida con `hideMetrics` cuenta sus stores como pruebas pero nunca ocupa la primera posición). Ejecutar `pnpm --filter web content:refresh` una vez y commitear los JSON generados.
- [ ] 4. → PASS. `content-refresh.yml` con `workflow_dispatch` para probarlo a mano en el PR (sin deploy: el deploy solo corre en `main`).
- [ ] 5. Commit: `git commit -m "feat(content): project/service/faq content with schema, GitHub and store data at build"`.

**Hecho cuando:** tests en verde; `github.json` y `stores.json` con datos reales (o respaldo) y nunca "0 valoraciones".

### Tarea 3.2 — `/empresas`

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.1, 2.11 · **Insumos:** §18 (2, 9, 11), Cal.com link (`NEXT_PUBLIC_CAL_LINK`)

**Objetivo:** UX §4.2: párrafo citable, `FactList` de servicios (web, móvil, IA; 40 €/h, 150 €/feature desde `pricing`), stack, cómo trabajo, CV PDF (enlace a `public/cv/jose-carlos-sanchez.pdf` si existe; si no, el bloque no se renderiza), `CalEmbed` lazy, formulario corto que reutiliza `ContactForm` (3.10) o enlaza a `/contacto?via=empresa`, `Service` + `Offer` JSON-LD, preguntas.

**Ficheros:** `app/[locale]/(public)/empresas/page.tsx` (ruta localizada por `pathnames`), `components/companies/{services-facts,stack-list,how-i-work}.tsx`, `components/shared/cal-embed.tsx` (`@calcom/embed-react`, cargado al clic o al entrar en viewport; evento `booking_open {origin:'companies'}`), `components/shared/cal-embed.test.tsx`, `messages/*.json` (`companies.*`).

**Pasos:**
- [ ] 1. Test que falla:
```tsx
// apps/web/components/shared/cal-embed.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
vi.mock('@calcom/embed-react', () => ({ default: () => <div data-testid="cal-inline" />, getCalApi: async () => vi.fn() }));
import { CalEmbed } from './cal-embed';
it('does not load Cal until the user asks for it', async () => {
  render(<CalEmbed calLink="josecoded/20min" origin="companies" />);
  expect(screen.queryByTestId('cal-inline')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Reservar 20 min/ }));
  expect(await screen.findByTestId('cal-inline')).toBeTruthy();
});
```
- [ ] 2. → FAIL. 3. Implementar página y componentes; `pageMetadata` + JSON-LD; `h1` único; párrafo de apertura de 2–3 frases autocontenidas (spec §8). 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): companies page with lazy Cal.com embed and service JSON-LD"`.

**Hecho cuando:** la página pasa Lighthouse móvil ≥ 90/95/100 en local y el embed no aparece en el HTML inicial.

### Tarea 3.3 — `/negocios`

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.1, 1.4 · **Insumos:** `ui` (`PackCard`, `ExtraCard`, `PriceTag`, §13.6–13.7), §18.13 (WhatsApp)

**Objetivo:** UX §4.3: cuatro `PackCard` iguales con "Desde X €" desde `pricing.json`, extras aparte ("Opcional · no incluido"), proceso, `FAQPage`, CTA al generador (`/propuesta?pack=P2`) y `WhatsAppButton` (`wa.me/<número>?text=`, evento `whatsapp_click {origin:'business', pack?}`), barra fija móvil (UX §13.7).

**Ficheros:** `app/[locale]/(public)/negocios/page.tsx`, `components/business/{pack-card,extra-card,price-tag,process-steps,faq,mobile-cta-bar}.tsx`, `components/shared/whatsapp-button.tsx`, tests `pack-card.test.tsx`, `whatsapp-button.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/business/pack-card.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { pricing } from '@josecoded/pricing';
import { PackCard } from './pack-card';
it('shows "Desde 1.400 €", weeks and never "recomendado" or gifts', () => {
  render(<PackCard pack={pricing.packs[1]} locale="es" />);
  expect(screen.getByText('Desde 1.400 €')).toBeTruthy(); expect(screen.getByText(/2 semanas/)).toBeTruthy();
  expect(screen.queryByText(/recomendado/i)).toBeNull(); expect(screen.queryByText(/regalo|incluye gratis/i)).toBeNull();
  expect(screen.getByRole('link', { name: /propuesta/i }).getAttribute('href')).toContain('pack=P2');
});
```
```tsx
// apps/web/components/shared/whatsapp-button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { WhatsAppButton } from './whatsapp-button';
it('links to wa.me with prefilled text and tracks the click', () => {
  (window as any).umami = { track: vi.fn() };
  render(<WhatsAppButton number="34600000000" text="Hola Jose, quiero una web" origin="business" pack="P2" />);
  const a = screen.getByRole('link', { name: /WhatsApp/ });
  expect(a.getAttribute('href')).toBe('https://wa.me/34600000000?text=Hola%20Jose%2C%20quiero%20una%20web');
  fireEvent.click(a); expect((window as any).umami.track).toHaveBeenCalledWith('whatsapp_click', { origin:'business', pack:'P2' });
});
```
- [ ] 2. → FAIL. 3. Implementar; sin número (`{{DATO}}`), `WhatsAppButton` no se renderiza. 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): business page with packs, extras, FAQ JSON-LD and WhatsApp CTA"`.

**Hecho cuando:** los precios de la página coinciden con `pricing.json` (test) y el `FAQPage` valida.

### Tarea 3.4 — `/proyectos` y `/proyectos/[slug]`

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.1 · **Insumos:** capturas de producto (`content/projects/*/screenshots/`), `ui` §13.5

**Objetivo:** UX §4.5–4.6: listado con filtro por tipo (chips en URL `?tipo=apps|webs|esta-web`), `ProjectCard` con badges de prueba, ficha con carrusel en marco de móvil, `StoreBadges` (valoraciones de `stores.json`, ocultas con `hideMetrics`), `SoftwareApplication` JSON-LD, `generateStaticParams` por slug y locale.

**Ficheros:** `app/[locale]/(public)/proyectos/page.tsx`, `app/[locale]/(public)/proyectos/[slug]/page.tsx`, `components/projects/{project-card,project-filter,store-badges,screenshot-carousel,github-activity}.tsx`, `components/projects/project-card.test.tsx`, `scripts/images.ts` (sharp → AVIF/WebP y anchos fijos en `prebuild`).

**Pasos:**
- [ ] 1. Test que falla:
```tsx
// apps/web/components/projects/project-card.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { ProjectCard } from './project-card';
it('reduced card shows name and stores but no rating, installs or stack', () => {
  render(<ProjectCard project={{ slug:'tres-cat-info', name:'3catinfo', type:'app', oneLiner:'App de noticias de 3Cat', proofs:{ appStoreId:'1', playPackage:'x' }, hideMetrics:true, hideStack:true, stack:['React Native'] }} stores={{ '1': { rating:4.6, count:1200 } }} locale="es" />);
  expect(screen.getByText('3catinfo')).toBeTruthy(); expect(screen.getAllByRole('link', { name: /App Store|Google Play/ })).toHaveLength(2);
  expect(screen.queryByText(/4,6|1\.200/)).toBeNull(); expect(screen.queryByText('React Native')).toBeNull();
});
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): projects list and detail with store badges and SoftwareApplication JSON-LD"`.

**Hecho cuando:** `/proyectos` y las tres fichas renderizan estáticas en ambos idiomas; 3catinfo nunca en primera posición.

### Tarea 3.5 — `/sobre-mi`

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.1 · **Insumos:** §18 (1–3, 9, 10), retrato (UX §13.4)

**Objetivo:** UX §4.9: `h1` nombre + rol + ciudad, retrato o solo texto, párrafo citable, línea de tiempo con fechas reales (Oportunix feb 2026, HazmeFila jun 2026, josecoded sep 2026, 3catinfo `{{DATO}}`), "Cómo trabajo", stack agrupado, formación (certificadas vs en curso según §18.9), enlaces, preguntas, `ProfilePage` JSON-LD.

**Ficheros:** `app/[locale]/(public)/sobre-mi/page.tsx`, `components/about/{timeline,stack-groups,credentials}.tsx`, `components/about/timeline.test.tsx`.

**Pasos:**
- [ ] 1. Test que falla:
```tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Timeline } from './timeline';
it('renders only entries with a real date and in chronological order', () => {
  render(<Timeline entries={[{ label:'josecoded v2', date:'2026-09' }, { label:'3catinfo', date:'{{DATO: año}}' }, { label:'Oportunix', date:'2026-02' }]} locale="es" />);
  const items = screen.getAllByRole('listitem').map(li => li.textContent);
  expect(items).toHaveLength(2); expect(items[0]).toMatch(/Oportunix/); expect(items[1]).toMatch(/josecoded/);
});
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(web): about page with timeline, credentials and ProfilePage JSON-LD"`.

**Hecho cuando:** sin logos de terceros, sin frases de la lista negra de UX (test de microcopy: `grep -E "soluciones|ayudo a|sin complicaciones|alto rendimiento|profesional|innovador" messages/es.json` vacío, añadido a `lint`).

### Tarea 3.6 — `/legal/*` y `/404`, `/500` públicas

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 2.3 · **Insumos:** textos legales validados por Jose (se portan los de josedev con marca `josecoded`)

**Objetivo:** UX §4.12 y §8 (aviso legal, privacidad, cookies en es/en como MDX estático; `not-found.tsx` y `error.tsx` con el código sobre el título y enlaces útiles; `OfflineBanner`).

**Ficheros:** `content/legal/{aviso-legal,privacidad,cookies}.{es,en}.mdx`, `app/[locale]/(public)/legal/[doc]/page.tsx`, `app/[locale]/not-found.tsx`, `app/[locale]/error.tsx`, `app/global-error.tsx`, `components/shared/{error-page,offline-banner}.tsx`, `e2e/errors.spec.ts`.

**Pasos:**
- [ ] 1. E2E que falla: `/legal/privacidad` 200 con `h1`; `/en/legal/privacy` 200; `/no-existe` 404 con texto "404" y enlace a Inicio; `/en/no-existe` 404 en inglés.
- [ ] 2. → FAIL. 3. Implementar (`@next/mdx` ya configurado en 1.5/4.2: si 4.2 no ha llegado, configurar aquí `next.config.ts` con `withMDX` y `pageExtensions`). 4. → PASS. 5. Commit: `git commit -m "feat(web): legal pages, localized 404/500 and offline banner"`.

**Hecho cuando:** E2E en verde; `cookies` dice que no hay cookies de terceros ni banner (Umami sin cookies).

**Cierre de `feat/public-pages`:** `revisor`; `/puerta-calidad` completa con Marta (Negocios) y Dani (Empresas, Proyectos, Sobre mí); merge.

### Tarea 3.7 — Gateway: `verifyTurnstile`, cuotas KV y `POST /api/v1/proposals/generate`

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 1.7, 1.4

**Objetivo:** el generador de propuestas de DT §3.2 en workerd, con clasificación por IA (JSON mode) y precio por reglas, fallback por reglas, Turnstile, rate limit y cuota diaria.

**Ficheros:**
- Crear: `apps/api/src/services/turnstile.service.ts` (`verifyTurnstile(env, token, ip, { action, hostnames })`), `src/services/quota.service.ts` (`checkQuota(env.QUOTA_KV, key, limit, ttl)`), `src/services/proposal-classifier.ts` (prompt de sistema con `includes` de `pricing.json`; `classifyByRules(answers)`; JSON schema literal de DT §3.2), `src/modules/proposals.routes.ts`, `src/schemas/proposals.schema.ts`, tests `proposals.routes.test.ts`, `proposal-classifier.test.ts`, `turnstile.service.test.ts`.
- Modificar: `src/modules/v1.routes.ts` (montar **antes** de `protectedV1Routes`), `routes-manifest.ts`, `wrangler.jsonc` (`QUOTA_KV`), `package.json` (`@josecoded/pricing` como dependencia workspace).

**Interfaces (produce):** request/response exactos de DT §3.2 (`{ locale, turnstileToken, answers:{businessType, needs, salesMode, timeline, extrasInterest?}, preselectedPack? }` → `{ proposalId, pricingVersion, pack:{code,name,price,weeks,includes}, priceFrom, recommendedExtras[], summary, scope[], questions[], source:'ai'|'rules', disclaimer }`); errores `bot_check_failed` 403, `rate_limited`/`quota_exceeded` 429, `upstream_error` 502.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/services/proposal-classifier.test.ts
import { it, expect } from 'vitest';
import { classifyByRules } from './proposal-classifier';
it.each([
  [{ businessType:'peluquería', needs:'web de presentación', salesMode:'none', timeline:'flexible' }, 'P1'],
  [{ businessType:'tienda', needs:'tienda con carrito', salesMode:'orders', timeline:'asap' }, 'P2'],
  [{ businessType:'ferretería', needs:'panel de stock y facturas', salesMode:'orders', timeline:'one_month' }, 'P3'],
  [{ businessType:'clínica', needs:'avisos por WhatsApp automáticos y citas', salesMode:'bookings', timeline:'one_month' }, 'P4'],
])('%o → %s', (answers, pack) => expect(classifyByRules(answers as any).pack).toBe(pack));
```
```ts
// apps/api/src/modules/proposals.routes.test.ts (workerd)
import { SELF, env, fetchMock } from 'cloudflare:test';
import { it, expect, beforeAll } from 'vitest';
beforeAll(() => { fetchMock.activate(); fetchMock.disableNetConnect(); fetchMock.get('https://challenges.cloudflare.com').intercept({ path:'/turnstile/v0/siteverify', method:'POST' }).reply(200, { success:true, action:'proposal', hostname:'localhost' }).persist(); });
const body = { locale:'es', turnstileToken:'t', answers:{ businessType:'restaurante', needs:'carta y reservas online', salesMode:'bookings', timeline:'one_month' } };
const post = (b = body, ip = '1.1.1.1') => SELF.fetch('http://x/api/v1/proposals/generate', { method:'POST', headers:{ 'content-type':'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(b) });
it('AI returns valid JSON → P2, priceFrom 1400, source ai, extras aside', async () => {
  (env as any).AI.__next = { pack:'P2', extras:['seo_basic'], summary:'s', scope:['a','b','c'], questions:[] };
  const r = await post(); expect(r.status).toBe(200); const { data } = await r.json();
  expect(data.pack.code).toBe('P2'); expect(data.priceFrom).toBe(1400); expect(data.source).toBe('ai'); expect(data.recommendedExtras[0].price).toBe(250); expect(data.pricingVersion).toBe('2026-09-14');
});
it('AI returns invalid JSON → rules fallback, never an error for Marta', async () => {
  (env as any).AI.__next = 'not json'; const { data } = await (await post()).json(); expect(data.source).toBe('rules'); expect(data.pack.code).toBe('P2');
});
it('11th request of the day from one IP → 429 quota_exceeded', async () => {
  for (let i = 0; i < 10; i++) await post(body, '2.2.2.2');
  const r = await post(body, '2.2.2.2'); expect(r.status).toBe(429); expect((await r.json()).error.code).toBe('quota_exceeded');
});
it('failed Turnstile → 403 bot_check_failed', async () => {
  fetchMock.get('https://challenges.cloudflare.com').intercept({ path:'/turnstile/v0/siteverify', method:'POST' }).reply(200, { success:false });
  const r = await post(); expect(r.status).toBe(403); expect((await r.json()).error.code).toBe('bot_check_failed');
});
```
- [ ] 2. → FAIL. 3. Implementar según DT §3.2 (pasos 1–6); `AI` falso en `vitest.config.ts` (`miniflare.bindings` o `wrappedBindings`) que devuelve `env.AI.__next`; `AI_GATEWAY_ID` opcional en `env.AI.run(..., { gateway:{ id } })`; el `proposalId` se guarda 24 h en `QUOTA_KV`. 4. → PASS (heredados + nuevos). 5. Commit: `git commit -m "feat(api): AI proposal generator with rule-based pricing, Turnstile, rate limit and daily quota"`.

**Hecho cuando:** tests en verde; una prueba de humo manual con el modelo real en `wrangler dev --remote` antes del merge (DT §8.7).

### Tarea 3.8 — Gateway: `POST /api/v1/leads`, `notifyLead`, `POST /notify/lead`, `GET /affiliates/validate`; Edge Function `lead.created`

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no (el deploy de la función y los secretos van en 3.12) · **Depende de:** 3.7, 1.8, 1.9

**Objetivo:** creación de leads solo desde el gateway con service role, aviso primario por Edge Function y opcional por n8n, atribución de afiliado con detección de autoreferido (DT §3.3–3.5, H2, H3).

**Ficheros:**
- Crear: `src/modules/leads.routes.ts`, `src/modules/notify.routes.ts`, `src/modules/affiliates.routes.ts`, `src/services/lead-notify.service.ts` (`notifyLead(env, ctx, leadId)`), `src/services/leads.service.ts` (`createLead`), `src/schemas/leads.schema.ts`, tests `leads.routes.test.ts`, `lead-notify.service.test.ts`.
- Modificar: `v1.routes.ts`, `routes-manifest.ts`, `wrangler.jsonc` (`LEADS_RATE_LIMITER` 1002 5/60, `AFFILIATE_RATE_LIMITER` 1003 30/60), `supabase/functions/notify/index.ts` (ya con `lead.created` desde 1.8; aquí se añade el test de contrato del payload).

**Interfaces (produce):** request de DT §3.3 (`source:'web_form'|'web_proposal'|'calcom'`, `locale`, `contact:{name,email,phone?,company?}`, `message?`, `proposalId?`, `affiliateCode?`, `turnstileToken?`, `meta?`), auth `turnstileToken` **o** `x-josecoded-server-key`; 201 `{ leadId, notified:'edge'|'none'|'pending' }`; `notifyLead` escribe `leads.meta.notify`.

**Pasos:**
- [ ] 1. Tests que fallan (workerd; Supabase simulado con `fetchMock` sobre `SUPABASE_URL/rest/v1/*` **o** contra `supabase start` local vía `SUPABASE_URL=http://127.0.0.1:54321` en CI — elegir la segunda: es la real):
```ts
// apps/api/src/modules/leads.routes.test.ts (extracto)
import { SELF, env, fetchMock } from 'cloudflare:test';
import { it, expect, beforeAll } from 'vitest';
beforeAll(() => { fetchMock.activate(); fetchMock.disableNetConnect(); fetchMock.get('https://challenges.cloudflare.com').intercept({ path:/siteverify/, method:'POST' }).reply(200, { success:true, action:'contact', hostname:'localhost' }).persist(); fetchMock.get(env.SUPABASE_URL).intercept({ path:'/functions/v1/notify', method:'POST' }).reply(200, { ok:true }).persist(); });
const lead = (extra = {}) => ({ source:'web_form', locale:'es', contact:{ name:'Marta', email:'marta@example.com' }, message:'hola', turnstileToken:'t', ...extra });
it('creates a lead and notifies via edge function', async () => {
  const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead()) });
  expect(r.status).toBe(201); const { data } = await r.json(); expect(data.leadId).toMatch(/[0-9a-f-]{36}/); expect(['edge','pending']).toContain(data.notified);
});
it('rejects without turnstile or server key', async () => { const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead({ turnstileToken: undefined })) }); expect(r.status).toBe(403); });
it('accepts server key for calcom', async () => { const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json', 'x-josecoded-server-key': env.SERVER_KEY }, body: JSON.stringify(lead({ source:'calcom', turnstileToken: undefined })) }); expect(r.status).toBe(201); });
it('requires email or phone', async () => { const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead({ contact:{ name:'X' } })) }); expect(r.status).toBe(400); });
it('self-referral is stored with the code and flagged, not rejected', async () => {
  const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead({ affiliateCode:'ANA-TEST', contact:{ name:'Ana', email:'ana@test' } })) });
  expect(r.status).toBe(201); const row = await readLead((await r.json()).data.leadId); expect(row.affiliate_code).toBe('ANA-TEST'); expect(row.meta.self_referral_suspect).toBe(true);
});
it('unknown affiliate code → 400', async () => { const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead({ affiliateCode:'NOPE-0000' })) }); expect(r.status).toBe(400); });
it('GET /affiliates/validate', async () => { expect((await (await SELF.fetch('http://x/api/v1/affiliates/validate?code=ANA-TEST')).json()).data.valid).toBe(true); expect((await (await SELF.fetch('http://x/api/v1/affiliates/validate?code=ZZZ-0000')).json()).data.valid).toBe(false); });
```
- [ ] 2. → FAIL. 3. Implementar según DT §3.3–3.4 (`fuente` mapeada, `monto` = `priceFrom` de la propuesta recuperada de KV y re-tarificada, `waitUntil(notifyLead)`, `notified:'pending'` si no termina en 3 s; `N8N_LEAD_WEBHOOK_ENABLED` opcional). `POST /notify/lead` con `assertAdmin` existente. 4. → PASS. 5. Commit: `git commit -m "feat(api): leads endpoint with Turnstile/server-key auth, affiliate attribution and edge-function notification"`.

**Hecho cuando:** tests en verde con `supabase start`; un lead creado en local aparece en `leads` con `meta.notify.via`.

### Tarea 3.9 — Web: generador de propuesta `/propuesta` (`GuidedChat` + `ProposalCard`)

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 3.7, 3.8, 2.3 · **Insumos:** `ui` (`GuidedChat`, `ProposalCard` §13.12), UX §4.4, §9.1, §10.3

**Objetivo:** chat guiado de 4 pasos (tipo de negocio con chips, necesidades multiselección, ¿vende o reserva?, plazo) → propuesta (pack, alcance, "desde X €", extras opcionales, preguntas) → enviar (nombre + email/teléfono + Turnstile `proposal_send`) → lead `web_proposal`. Nunca página en blanco; `?pack=` preselecciona; errores inline (429, 502, Turnstile).

**Ficheros:** `app/[locale]/(public)/propuesta/page.tsx`, `components/proposal/{guided-chat,step-business,step-needs,step-sales,step-timeline,proposal-card,send-form}.tsx`, `lib/proposal/machine.ts` (máquina de estados pura: `idle→q1→q2→q3?→q4→generating→proposal→sending→sent|error`; `q3` se omite cuando `q2` marca pedidos o reservas), `lib/proposal/machine.test.ts`, `lib/proposal/api.ts` (`generateProposal`, `sendProposal` contra `NEXT_PUBLIC_JOSECODED_API_URL`), `components/shared/turnstile.tsx` (`@marsidev/react-turnstile`, `appearance:'interaction-only'`), `e2e/proposal.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/proposal/machine.test.ts
import { it, expect } from 'vitest';
import { reduce, initial } from './machine';
it('skips the sales question when needs already say orders/bookings', () => {
  let s = initial({ preselectedPack: 'P2' });
  s = reduce(s, { type:'answer', step:'business', value:'restaurante' });
  s = reduce(s, { type:'answer', step:'needs', value:{ chips:['bookings'], text:'' } });
  expect(s.step).toBe('timeline');
});
it('asks sales when needs are ambiguous and maps answers to the API payload', () => {
  let s = initial({});
  s = reduce(s, { type:'answer', step:'business', value:'clínica' });
  s = reduce(s, { type:'answer', step:'needs', value:{ chips:['presence'], text:'quiero que me encuentren' } });
  expect(s.step).toBe('sales');
  s = reduce(s, { type:'answer', step:'sales', value:'none' }); s = reduce(s, { type:'answer', step:'timeline', value:'flexible' });
  expect(s.step).toBe('generating');
  expect(s.payload).toEqual({ businessType:'clínica', needs:'presencia; quiero que me encuentren', salesMode:'none', timeline:'flexible' });
});
```
```ts
// apps/web/e2e/proposal.spec.ts
import { test, expect } from '@playwright/test';
test('restaurant with bookings → P2 from 1.400 €, send creates a lead and tracks events', async ({ page }) => {
  const events: string[] = []; await page.route('**/api/send', r => { events.push(JSON.parse(r.request().postData()!).payload.name); r.fulfill({ status: 200, body: 'ok' }); });
  await page.goto('/propuesta');
  await page.getByRole('button', { name: 'Restaurante' }).click();
  await page.getByRole('checkbox', { name: /Reservas/ }).check(); await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: /un mes/i }).click();
  await expect(page.getByText('P2')).toBeVisible(); await expect(page.getByText('Desde 1.400 €')).toBeVisible();
  await page.getByRole('button', { name: /Enviar/ }).click();
  await page.getByLabel('Nombre').fill('Marta'); await page.getByLabel('Email').fill('marta@example.com'); await page.getByRole('button', { name: /Enviar propuesta/ }).click();
  await expect(page.getByText(/te respondo/i)).toBeVisible();
  expect(events).toEqual(expect.arrayContaining(['proposal_generated', 'proposal_sent']));
});
```
- [ ] 2. → FAIL. 3. Implementar (Turnstile en modo test en dev/CI; `disclaimer` visible; `proposal_generated {pack, questions, source}` y `proposal_sent {pack, has_ref}`; lee la cookie `ref` de 3.11 si existe). 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): guided proposal generator with rule-priced proposal card and lead submission"`.

**Hecho cuando:** E2E en verde; `usuario-ejemplo` (Marta) completa el flujo en 390×844 sin abandonos.

### Tarea 3.10 — Web: `/contacto` (segmento, `ContactForm`, WhatsApp, fallback)

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 3.8, 3.3 (`WhatsAppButton`) · **Insumos:** §18.13, UX §4.10, §9.2–9.3

**Objetivo:** una página con segmento negocio/empresa (`?via` → `sessionStorage.audience` → `negocio` por defecto); negocio: WhatsApp primario + formulario plegado; empresa: formulario + `CalEmbed`; SA `submitContact` → gateway; si el gateway responde 5xx, fallback `mailto:` + WhatsApp (DT §10).

**Ficheros:** `app/[locale]/(public)/contacto/page.tsx`, `components/contact/{segment-switch,contact-form}.tsx`, `app/[locale]/(public)/contacto/actions.ts` (`submitContact(formData)`: valida con zod, exige `turnstileToken`, llama a `POST /leads` con `source:'web_form'`, devuelve `{ ok }` o `{ error:'gateway_down'|'bot'|'invalid' }`), `components/contact/contact-form.test.tsx`, `e2e/contact.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/contact/contact-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { ContactForm } from './contact-form';
it('shows mailto and WhatsApp fallback when the gateway is down', async () => {
  const action = vi.fn().mockResolvedValue({ error: 'gateway_down' });
  render(<ContactForm action={action} email="hola@josecoded.com" whatsapp="34600000000" />);
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Marta' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'm@x.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Enviar/ }));
  await waitFor(() => expect(screen.getByRole('link', { name: /hola@josecoded.com/ }).getAttribute('href')).toMatch(/^mailto:/));
});
```
- [ ] 2. → FAIL. 3. Implementar; evento `contact_submit {via}`. E2E: contacto crea lead `web_form` (comprobar en Supabase local) y `contact_submit` interceptado. 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): contact page with audience segment, server action to gateway and offline fallbacks"`.

**Hecho cuando:** E2E en verde; sin `{{DATO}}` de WhatsApp, el botón no aparece y el formulario es la primaria.

### Tarea 3.11 — Web: webhook de Cal.com, `call_booked` y captura de afiliado (`RefCapture`, `RefNotice`)

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 3.8

**Objetivo:** `POST /api/webhooks/calcom` con HMAC del body raw → lead `calcom` con `x-josecoded-server-key`; evento `call_booked` en servidor (`@umami/node`, sin PII); `?ref=CODIGO` → cookie `ref` 30 días (primera gana) + `RefNotice` una vez (DT §5.3, §2 "Afiliados").

**Ficheros:** `app/api/webhooks/calcom/route.ts`, `lib/calcom/verify.ts` (`verifySignature(raw, header, secret)`), `lib/calcom/verify.test.ts`, `tests/fixtures/calcom-booking-created.json`, `components/shared/ref-capture.tsx`, `lib/affiliates/ref-cookie.ts` (`captureRef(search, existingCookie): { set?: string; notice: boolean }`), `lib/affiliates/ref-cookie.test.ts`, `components/shared/ref-notice.tsx`, `e2e/affiliate-ref.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/calcom/verify.test.ts
import { it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifySignature } from './verify';
it('accepts a valid HMAC-SHA256 and rejects a tampered body', () => {
  const raw = JSON.stringify({ triggerEvent:'BOOKING_CREATED' }); const sig = createHmac('sha256', 's3cret').update(raw).digest('hex');
  expect(verifySignature(raw, sig, 's3cret')).toBe(true); expect(verifySignature(raw + ' ', sig, 's3cret')).toBe(false);
});
```
```ts
// apps/web/lib/affiliates/ref-cookie.test.ts
import { it, expect } from 'vitest';
import { captureRef } from './ref-cookie';
it('stores a well-formed code once and ignores later codes and junk', () => {
  expect(captureRef('?ref=ANA-3B7K', undefined)).toEqual({ set:'ANA-3B7K', notice:true });
  expect(captureRef('?ref=BOB-7F2K', 'ANA-3B7K')).toEqual({ notice:false });
  expect(captureRef('?ref=<script>', undefined)).toEqual({ notice:false });
});
```
- [ ] 2. → FAIL. 3. Implementar; `RefCapture` consulta `GET /affiliates/validate` antes de escribir la cookie (`SameSite=Lax`, 30 días, `Secure` en https); el RH del webhook usa `await req.text()`, cabecera `x-cal-signature-256`, `attendees[0]`, `responses.notes`, `metadata.ref` → `affiliateCode`. E2E de DT §8.2 "Afiliado" (visita con `?ref=ANA-TEST` → `RefNotice` → contacto → lead con `affiliate_code`; segundo `?ref` no sobrescribe; autoreferido marcado). 4. → PASS. 5. Commit: `git commit -m "feat(web): Cal.com webhook to gateway lead, call_booked event and affiliate ref capture"`.

**Hecho cuando:** tests y E2E en verde; el RH responde 401 con firma inválida.

### Tarea 3.12 — **GATE**: secretos, KV, Turnstile, Cal.com y Edge Function en producción

**Agente:** controlador (con OK de Jose); `implementador-web` prepara el checklist · **Gate:** **SÍ** · **Depende de:** 3.7–3.11 mergeadas o listas en la rama

**Pasos (cada uno con OK explícito de Jose en la sesión):**
- [ ] 1. Jose crea el widget Turnstile (dominios `josecoded.com`, `*.workers.dev`, `localhost`) y la cuenta Cal.com con el evento "20 min" y el webhook `BOOKING_CREATED` apuntando a `https://josecoded.com/api/webhooks/calcom` (la URL existirá al lanzar; hasta entonces, a la preview).
- [ ] 2. `wrangler kv namespace create QUOTA_KV` (anotar id en `apps/api/wrangler.jsonc`).
- [ ] 3. `wrangler secret put` en `josecoded-api`: `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `NOTIFY_SHARED_SECRET` (mismo valor que `vault.notify_shared_secret`); en `josecoded-web`: `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `CALCOM_WEBHOOK_SECRET`. Vars públicas en ambos `wrangler.jsonc`.
- [ ] 4. `supabase functions deploy notify` (si no se hizo en 1.9) y `ADMIN_NOTIFY_EMAIL` en el env de la función (opcional, P8).
- [ ] 5. Anotar en `ESTADO.md` qué se configuró (nombres, nunca valores).

**Hecho cuando:** en la preview del PR, el generador y el contacto crean leads reales en Supabase y Jose recibe el Telegram en < 1 min (spec §10).

**Cierre de `feat/generator-leads`:** `revisor`; `/puerta-calidad` completa (Marta en generador y contacto; `revisor-seguridad` en Turnstile, `SERVER_KEY`, HMAC, cuotas, cookie `ref`); merge.

---
## Fase 4 — Auth, blog MDX + comentarios, chat con takeover · Estimación L · rama `feat/auth-blog-chat`

Pantallas: UX §5 (auth), §4.7–4.8 (blog), §4.11 (chat), §4.13 (perfil), §9.4–9.6, §10.4. Insumo `ui`: `AuthProviders`, `PostCard`, `CommentThread`.

### Tarea 4.1 — Auth con `@supabase/ssr`: guards, login/registro/OTP, callback, perfil

**Agente:** implementador-web · **Gate:** no · **Depende de:** 2.3, 1.8 · **Insumos de Jose (para la prueba manual, no para los tests):** OAuth Google/GitHub en Supabase, plantilla OTP con `{{ .Token }}`, leaked password protection (DT P9)

**Objetivo:** una cuenta de visitante para chat, comentarios y área; guards sin middleware (DT §1.7); email por código OTP de 6 cifras (UX §5.3).

**Ficheros:**
- Crear: `lib/supabase/{server,browser,route}.ts` (`createServerClient` con `cookies()`; `createBrowserClient`), `lib/auth/guards.ts` (`requireUser(): Promise<Session>` → `redirect('/auth/login?next=…')`; `requireAdmin(): Promise<Session>` → `notFound()` si `staff_members.role !== 'admin'`), `lib/auth/guards.test.ts`, `lib/auth/next-param.ts` (`safeNext(next)`: solo rutas internas relativas), `lib/auth/next-param.test.ts`, `app/[locale]/(public)/auth/{login,registro,codigo}/page.tsx`, `app/[locale]/(public)/auth/actions.ts` (`signInWithOtp`, `verifyOtp`, `signOut`, `claimClientAccess` tras login: `rpc('claim_client_access')`), `app/api/auth/callback/route.ts` (intercambia `code`, `redirect(safeNext(next))`), `app/[locale]/(public)/perfil/page.tsx`, `components/auth/{auth-providers,otp-form}.tsx`, `e2e/auth.spec.ts`.
- Modificar: `components/layout/user-menu.tsx` (sesión real, "Salir").

**Interfaces (produce; las usan 4.3, 4.4, 5.x, 6.x, 7.25+):** `requireUser()`, `requireAdmin()`, `createServerSupabase()`, `createBrowserSupabase()`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/auth/next-param.test.ts
import { it, expect } from 'vitest';
import { safeNext } from './next-param';
it.each([['/area-clientes', '/area-clientes'], ['https://evil.com', '/'], ['//evil.com', '/'], ['/admin/radar?x=1', '/admin/radar?x=1'], [undefined, '/']])('%s → %s', (i, o) => expect(safeNext(i)).toBe(o));
```
```ts
// apps/web/lib/auth/guards.test.ts
import { it, expect, vi } from 'vitest';
vi.mock('next/navigation', () => ({ redirect: vi.fn((u) => { throw new Error('REDIRECT ' + u); }), notFound: vi.fn(() => { throw new Error('NOT_FOUND'); }) }));
vi.mock('../supabase/server', () => ({ createServerSupabase: () => ({ auth: { getUser: async () => ({ data: { user: globalThis.__user } }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: globalThis.__staff }) }) }) }) }) }));
import { requireUser, requireAdmin } from './guards';
it('redirects anonymous users', async () => { globalThis.__user = null; await expect(requireUser()).rejects.toThrow(/REDIRECT \/auth\/login/); });
it('404s non-admin users', async () => { globalThis.__user = { id:'u' }; globalThis.__staff = null; await expect(requireAdmin()).rejects.toThrow('NOT_FOUND'); });
it('passes admins', async () => { globalThis.__user = { id:'u' }; globalThis.__staff = { role:'admin' }; await expect(requireAdmin()).resolves.toBeTruthy(); });
```
- [ ] 2. → FAIL. 3. Implementar; E2E (DT §8.2 "Auth"): login con email + contraseña de seed (`ana@test`), `/area-clientes` accesible (placeholder hasta 5.1), logout, `/area-clientes` redirige. 4. → PASS; `web-design-guidelines` en auth. 5. Commit: `git commit -m "feat(web): Supabase SSR auth with OTP code, OAuth callback, guards and profile"`.

**Hecho cuando:** tests y E2E en verde; prueba manual de Google y GitHub en la puerta (cuando Jose los active).

### Tarea 4.2 — Blog en MDX: contenido, índice, listado, artículo, RSS, `BlogPosting`

**Agente:** implementador-web · **Gate:** no · **Depende de:** 2.11, 2.1

**Objetivo:** blog compilado en build con `@next/mdx` (DT §1.5), artículos en `content/blog/{es,en}/<slug>.mdx` con `export const metadata` validada por zod, índice en `prebuild`, RSS (`app/feed.xml/route.ts`), `llms-full.txt` con el contenido.

**Ficheros:** `next.config.ts` (`withMDX`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code`), `mdx-components.tsx`, `content/blog/es/como-esta-hecha-esta-web.mdx` (primer artículo real: arquitectura, hero, Radar en una frase; lo redacta `redactor` o Jose; sin él, el listado queda vacío y el bloque de la home no se renderiza), `content/blog/schema.ts`, `scripts/content-index.ts` (completar: `blog-index.json` con `slug, locale, title, description, date, tags, readingTime, hasTranslation`), `app/[locale]/(public)/blog/page.tsx`, `app/[locale]/(public)/blog/[slug]/page.tsx` (`import()` dinámico por slug; `generateStaticParams`), `app/feed.xml/route.ts`, `components/blog/{post-card,post-header,toc}.tsx`, tests `scripts/content-index.test.ts` (ampliar), `e2e/blog.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/scripts/content-index.test.ts (añadir)
import { it, expect } from 'vitest';
import { buildBlogIndex } from './content-index';
it('marks hasTranslation only when the same slug exists in both locales', async () => {
  const idx = await buildBlogIndex({ es: { 'a': { title:'A', description:'d', date:'2026-09-20' }, 'solo-es': { title:'S', description:'d', date:'2026-09-21' } }, en: { 'a': { title:'A', description:'d', date:'2026-09-20' } } });
  expect(idx.find(p => p.slug === 'a' && p.locale === 'es')?.hasTranslation).toBe(true);
  expect(idx.find(p => p.slug === 'solo-es')?.hasTranslation).toBe(false);
  expect(idx.map(p => p.slug)).toEqual(['solo-es', 'a', 'a']); // más reciente primero
});
```
- [ ] 2. → FAIL. 3. Implementar; artículo con `BlogPosting` JSON-LD (`author.name` = nombre a mostrar), `pageMetadata({ hasTranslation })`. E2E: `/blog/<slug>` tiene JSON-LD `BlogPosting`, `/feed.xml` es RSS válido con el artículo. 4. → PASS. 5. Commit: `git commit -m "feat(web): MDX blog compiled at build with index, RSS and BlogPosting JSON-LD"`.

**Hecho cuando:** el worker **no** contiene el compilador MDX (grep `compile` de `@mdx-js` en `.open-next/worker.js` vacío) y el tamaño sigue < 2,5 MiB.

### Tarea 4.3 — Comentarios con cola de aprobación

**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 4.2, 1.8

**Objetivo:** `CommentThread` (cliente, lee `blog_comments` con RLS: aprobados + propios), SA `postComment` con Turnstile (action `comment`, verificación en la SA con `TURNSTILE_SECRET_KEY` de `apps/web`), estado "Pendiente" visible solo al autor, respuestas a comentarios aprobados (UX §9.5, D10).

**Ficheros:** `components/blog/comment-thread.tsx`, `components/blog/comment-form.tsx`, `app/[locale]/(public)/blog/[slug]/actions.ts` (`postComment`), `lib/turnstile/verify.ts` (`verifyTurnstileToken(token, ip, action)` compartido con 5.x/6.x si hace falta), `lib/turnstile/verify.test.ts`, `components/blog/comment-thread.test.tsx`, `e2e/blog.spec.ts` (ampliar con la fila "Blog" de DT §8.2).

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/blog/comment-thread.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { CommentThread } from './comment-thread';
const c = (id: string, status: string, user_id: string) => ({ id, status, user_id, body: `b-${id}`, author_name:'A', created_at:'2026-09-20', parent_id: null });
it('shows approved for everyone and pending only to its author, with a Pendiente badge', () => {
  render(<CommentThread comments={[c('1','approved','x'), c('2','pending','me'), c('3','pending','other')]} currentUserId="me" slug="s" locale="es" />);
  expect(screen.getByText('b-1')).toBeTruthy(); expect(screen.getByText('b-2')).toBeTruthy(); expect(screen.queryByText('b-3')).toBeNull();
  expect(screen.getByText('Pendiente')).toBeTruthy();
});
it('asks to sign in when anonymous', () => { render(<CommentThread comments={[]} currentUserId={null} slug="s" locale="es" />); expect(screen.getByRole('link', { name: /Entrar/ })).toBeTruthy(); });
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; E2E: comentar sin sesión → CTA login; con sesión → "Pendiente" solo para el autor. 5. Commit: `git commit -m "feat(web): moderated blog comments with Turnstile-protected server action"`.

**Hecho cuando:** tests y E2E en verde; RLS (1.8) ya cubre el aislamiento.

### Tarea 4.4 — Chat `/chat` con takeover (gateway `admin-chat/*`) y `knowledge.json` nuevo

**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 1.7

**Objetivo:** UX §4.11, §9.6: hilo, envío, selector de reunión, respuestas por realtime en `admin_chat_messages`; el gateway conserva el contrato y solo cambia, de forma aditiva, `knowledge.json` (perfil nuevo, sin "Jose Dev") y el prompt de `ai-reply.ts` (DT §7.8).

**Ficheros:** `app/[locale]/(public)/chat/page.tsx` (`requireUser`), `components/chat/{thread,composer,meeting-picker}.tsx`, `lib/chat/api.ts` (`getThread`, `postMessage`, `postMeeting` con el `access_token` de la sesión), `lib/chat/realtime.ts`, `components/chat/thread.test.tsx`, `e2e/chat.spec.ts`; `apps/api/src/knowledge/knowledge.json` (contenido nuevo), `apps/api/src/services/ai-reply.ts` (texto del prompt: "josecoded"), y sus tests heredados actualizados (`knowledge.test.ts`, `ai-reply.test.ts`).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/api/src/services/knowledge.test.ts (añadir)
import { it, expect } from 'vitest';
import knowledge from '../knowledge/knowledge.json';
it('brand is josecoded and never Jose Dev', () => { expect(JSON.stringify(knowledge)).not.toMatch(/Jose Dev/); expect(JSON.stringify(knowledge)).toMatch(/josecoded/); });
```
- [ ] 2. → FAIL. 3. Implementar (los tests heredados de `admin-chat` siguen en verde: contrato intacto). Web: `chat_started` al primer mensaje. E2E con `AI` falso: mensaje aparece; respuesta llega por realtime. 4. → PASS. 5. Commit: `git commit -m "feat(web,api): assistant chat page over admin-chat routes; refreshed knowledge and brand"`.

**Hecho cuando:** E2E en verde; el admin verá la conversación en 6.6.

**Cierre de la fase 4:** `revisor`; `/puerta-calidad` completa (Dani en chat y blog; `revisor-seguridad` en `safeNext`, cookies de sesión, Turnstile de comentarios); merge.

---

## Fase 5 — Área de clientes, afiliados y ampliaciones · Estimación M · rama `feat/client-area`

Pantallas: UX §6.1–6.7, §3.8, §9.7–9.8, §10.5. Insumo `ui`: `DataTable`, `Sheet`, `EmptyState`, `StatusBadge`.

### Tarea 5.1 — Shell del área, inicio del área y reclamar acceso

**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 1.8

**Objetivo:** `app/[locale]/(private)/area-clientes/layout.tsx` (`requireUser`, subnavegación: Mi proyecto · Tareas · Material · Pack · Recomiéndame; las de proyecto solo si `clients.user_id = auth.uid()`), inicio con estado del proyecto o estado "no cliente" (UX §6.1), `claimClientAccess` ya llamado en 4.1.

**Ficheros:** el layout, `app/[locale]/(private)/area-clientes/page.tsx`, `components/area/{area-nav,project-summary,not-client-state}.tsx`, `lib/area/queries.ts` (`getMyClient()`, `getMyTasks()`, …), `components/area/project-summary.test.tsx`, `e2e/client-area.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla: `NotClientState` muestra "Recomiéndame" y el CTA a `/negocios`; `ProjectSummary` muestra fase, pack (`P2` → "Pedidos / reservas") y próximas tareas. 2. → FAIL. 3. Implementar. 4. → PASS; E2E: Ana ve su proyecto; Bob ve el estado "no cliente" y "Recomiéndame". 5. Commit: `git commit -m "feat(web): client area shell and home with non-client state"`.

**Hecho cuando:** E2E en verde; URL directa de Ana desde Bob → 404 (RLS + `notFound`).

### Tarea 5.2 — Tareas y detalle de tarea (comentarios)

**Agente:** implementador-web · **Gate:** no · **Depende de:** 5.1

**Objetivo:** UX §6.2–6.3 sobre `client_tasks` y `client_task_comments` heredadas (RLS existente): lista por estado, detalle, comentar (SA `postTaskComment`), aviso `comment.client` lo dispara el trigger heredado `notify_event`.

**Ficheros:** `app/[locale]/(private)/area-clientes/tareas/page.tsx`, `.../tareas/[id]/page.tsx`, `.../tareas/actions.ts`, `components/area/{task-list,task-detail,task-comments}.tsx`, `components/area/task-list.test.tsx`.

**Pasos:** 1. Test: `TaskList` agrupa por `estado` y muestra `EmptyState` sin tareas. 2. FAIL. 3. Implementar. 4. PASS; E2E: Ana comenta una tarea y el comentario aparece. 5. Commit: `git commit -m "feat(web): client tasks and task detail with comments"`.

### Tarea 5.3 — Material (assets del bucket `client-assets`)

**Agente:** implementador-web · **Gate:** no · **Depende de:** 5.1

**Objetivo:** UX §6.4: lista de `client_assets`, descarga por URL firmada (SA `signedAssetUrl(id)`), subida (≤ 25 MiB, tipos permitidos) con SA `uploadAsset` sobre `storage.from('client-assets')` con la sesión del usuario (políticas heredadas), aviso `asset.uploaded.client` por trigger.

**Ficheros:** `.../material/page.tsx`, `.../material/actions.ts`, `components/area/{asset-list,asset-upload}.tsx`, `lib/area/assets.ts` (`assetPath(clientId, filename)`), `lib/area/assets.test.ts`.

**Pasos:** 1. Test: `assetPath` sanea nombres (`../x.pdf` → `x.pdf`; espacios → `-`) y prefija `clientId/`. 2. FAIL. 3. Implementar. 4. PASS; E2E: Ana sube un PDF de 10 KB y lo ve en la lista; Bob no puede listar el bucket de Ana. 5. Commit: `git commit -m "feat(web): client assets list, signed downloads and uploads"`.

### Tarea 5.4 — Pack y extras + Solicitar ampliación

**Agente:** implementador-web · **Gate:** no · **Depende de:** 5.1, 1.4

**Objetivo:** UX §6.5–6.6: pack contratado y extras (`client_pack_extras`), solicitud de ampliación con precio por `computeUpgrade` (diferencia de lista) → `upgrade_requests` (RLS), pendiente visible al cliente.

**Ficheros:** `.../pack/page.tsx`, `.../pack/ampliar/page.tsx`, `.../pack/actions.ts` (`requestUpgrade`), `components/area/{pack-summary,upgrade-form}.tsx`, `components/area/upgrade-form.test.tsx`, `e2e/client-area.spec.ts` (ampliar).

**Pasos:**
- [ ] 1. Test que falla:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect } from 'vitest';
import { UpgradeForm } from './upgrade-form';
it('P2 client choosing P3 sees 1.100 € and submits computed price', () => {
  render(<UpgradeForm currentPack="P2" action={async () => ({ ok:true })} locale="es" />);
  fireEvent.click(screen.getByRole('radio', { name: /P3/ }));
  expect(screen.getByText('1.100 €')).toBeTruthy();
  expect(screen.queryByRole('radio', { name: /P1|P2/ })).toBeNull(); // no se puede bajar ni repetir
});
```
- [ ] 2. → FAIL. 3. Implementar (la SA recalcula el precio con `computeUpgrade` y guarda `pricing_version`). 4. → PASS; E2E: Ana solicita P3 → "1.100 €" y aparece `pending` (comprobación en Supabase local). 5. Commit: `git commit -m "feat(web): client plan page and upgrade request priced by list difference"`.

### Tarea 5.5 — Recomiéndame (afiliados)

**Agente:** implementador-web · **Gate:** no · **Depende de:** 5.1, 1.8

**Objetivo:** UX §6.7: SA `ensureAffiliate` (insert `affiliates` propio; el código lo genera el trigger), enlace `https://josecoded.com/?ref=CODIGO` con copiar (`referral_copy`), leads atribuidos desde `affiliate_leads_view` (estado y fecha, sin contacto), recompensas (`affiliate_rewards`: pendiente/abonada), explicación de las tres reglas desde `pricing.json`.

**Ficheros:** `.../recomiendame/page.tsx`, `.../recomiendame/actions.ts`, `components/area/{referral-link,referral-leads,rewards-list}.tsx`, `components/area/referral-link.test.tsx`, `e2e/client-area.spec.ts` (ampliar).

**Pasos:** 1. Test: `ReferralLink` muestra la URL con el código y al pulsar "Copiar" llama a `navigator.clipboard.writeText` y a `track('referral_copy')`. 2. FAIL. 3. Implementar. 4. PASS; E2E: Bob (no cliente) entra, obtiene código `BOB-TEST`, ve su recompensa `pending` de seed. 5. Commit: `git commit -m "feat(web): referral program page with code, attributed leads and rewards"`.

**Cierre de la fase 5:** `revisor`; `/puerta-calidad` completa (`usuario-ejemplo` como cliente Ana y como afiliado Bob; `revisor-seguridad` sobre RLS y URLs firmadas); merge.

---
## Fase 6 — Admin · Estimación L · rama `feat/admin`

Pantallas: UX §7.1–7.11, §3.9 (shell del admin con barra móvil Leads · Radar · Clientes · Más), §9.9, §10.6, §13.8 (densidad). Solo español. Insumo `ui`: `DataTable`, `Sheet`, `StatusBadge`, `Toast`.

### Tarea 6.1 — Layout del admin, guard, shell y Resumen `/admin`

**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 1.7

**Objetivo:** `app/[locale]/(private)/admin/layout.tsx` con `requireAdmin()` (404 sin rol, DT §1.7), navegación (escritorio lateral; móvil barra inferior), Resumen con 5 contadores (leads nuevos, comentarios pendientes, ampliaciones pendientes, recompensas pendientes, chats sin leer), "Radar hoy" (placeholder hasta 7.25), semáforo de Omen (`GET /api/v1/system/status` con el JWT de Jose; 502 → "Omen sin conexión").

**Ficheros:** el layout, `app/[locale]/(private)/admin/page.tsx`, `components/admin/{admin-nav,admin-mobile-bar,counter-card,omen-status}.tsx`, `lib/admin/queries.ts` (`getAdminCounters()`), `lib/admin/gateway.ts` (`adminFetch(path, init)`: añade `Authorization: Bearer <access_token>` de la sesión), `lib/admin/gateway.test.ts`, `e2e/admin.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/admin/gateway.test.ts
import { it, expect, vi } from 'vitest';
vi.mock('../supabase/server', () => ({ createServerSupabase: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } }) }));
import { adminFetch } from './gateway';
it('adds the admin JWT and hits the gateway base URL', async () => {
  const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true,"data":{}}'));
  await adminFetch('/api/v1/system/status');
  expect(spy.mock.calls[0][0]).toBe(process.env.NEXT_PUBLIC_JOSECODED_API_URL + '/api/v1/system/status');
  expect((spy.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok' });
});
```
E2E: `/admin` con Ana → 404; con Jose → "Resumen" y los cinco contadores.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): admin layout with role guard, navigation and summary"`.

**Hecho cuando:** E2E en verde; en móvil (390 px) la barra tiene 4 destinos ≥ 44 px.

### Tarea 6.2 — Leads: bandeja, detalle, lead manual, cerrar cobrado + recompensa

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 1.4, 1.8, 3.8

**Objetivo:** UX §7.2–7.3, §9.3, §9.9: bandeja filtrable por `estado`/`fuente`, detalle con `ProposalCard` (reutilizada de 3.9), afiliado, `meta.notify` y "Reenviar aviso" (`POST /notify/lead`), nuevo lead manual (SA `createManualLead`, `fuente='whatsapp'`), cambio de estado, "Marcar cerrado y cobrado" (modal con base = `monto` editable, recompensa calculada por `computeAffiliateReward`, casilla "Generar recompensa igualmente" desmarcada si `self_referral_suspect`) → RPC `admin_close_lead_paid`.

**Ficheros:** `app/[locale]/(private)/admin/leads/page.tsx`, `.../leads/[id]/page.tsx`, `.../leads/actions.ts` (`createManualLead`, `updateLeadStatus`, `closeLeadPaid`, `resendLeadNotification`), `components/admin/leads/{lead-table,lead-detail,new-lead-sheet,close-paid-modal}.tsx`, `lib/admin/close-paid.ts` (`buildClosePaidArgs(lead, affiliate, base, generate)`), `lib/admin/close-paid.test.ts`, `e2e/admin.spec.ts` (ampliar).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/lib/admin/close-paid.test.ts
import { it, expect } from 'vitest';
import { buildClosePaidArgs } from './close-paid';
it('standard affiliate with base 1400 → percent 10, 140 €', () => {
  expect(buildClosePaidArgs({ id:'l' }, { level:'standard', isClient:false }, 1400, true)).toEqual({ p_lead_id:'l', p_base_amount:1400, p_reward_type:'percent', p_reward_amount:140, p_reward_percent:10, p_pricing_version:'2026-09-14', p_generate_reward:true });
});
it('client affiliate → 2 maintenance months; premium → 280', () => {
  expect(buildClosePaidArgs({ id:'l' }, { level:'standard', isClient:true }, 1400, true)).toMatchObject({ p_reward_type:'maintenance_months', p_reward_amount:2, p_reward_percent:null });
  expect(buildClosePaidArgs({ id:'l' }, { level:'premium', isClient:false }, 1400, true)).toMatchObject({ p_reward_amount:280, p_reward_percent:20 });
});
it('no affiliate → generate false', () => expect(buildClosePaidArgs({ id:'l' }, null, 900, true).p_generate_reward).toBe(false));
```
- [ ] 2. → FAIL. 3. Implementar; el modal exige `monto` (trigger heredado). E2E (DT §8.2 "Admin"): marcar lead cobrado con 1 400 y afiliado `standard` → recompensa 140 `pending`. 4. → PASS. 5. Commit: `git commit -m "feat(web): admin leads inbox and detail, manual lead, close-paid with affiliate reward"`.

### Tarea 6.3 — Moderación de comentarios

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 4.3

**Objetivo:** UX §7.4: cola `pending` con contexto (artículo, autor, fecha), aprobar/rechazar (SA con RLS admin: `moderated_at`, `moderated_by`), historial.

**Ficheros:** `.../admin/comentarios/page.tsx`, `.../comentarios/actions.ts`, `components/admin/comment-queue.tsx`, `components/admin/comment-queue.test.tsx`.

**Pasos:** 1. Test: la cola muestra solo `pending` y los botones Aprobar/Rechazar llaman a la acción con `id` y estado. 2. FAIL. 3. Implementar. 4. PASS; E2E: aprobar → visible anónimo en `/blog/<slug>`. 5. Commit: `git commit -m "feat(web): admin comment moderation queue"`.

### Tarea 6.4 — Clientes, ficha con pestañas, tareas, material, extras y ampliaciones

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 5.x

**Objetivo:** UX §7.5–7.7: lista de clientes, ficha (resumen, tareas con hoja `?tarea=nueva|[id]`, material con subida de admin, pack y extras con `client_pack_extras`, `invite_email`), lista de ampliaciones con aprobar/rechazar (`admin_note`, `resolved_at`; aprobar añade `client_pack_extras` o actualiza `pack_template_id` por `code`).

**Ficheros:** `.../admin/clientes/page.tsx`, `.../clientes/[id]/page.tsx`, `.../clientes/actions.ts`, `.../admin/ampliaciones/page.tsx`, `.../ampliaciones/actions.ts`, `components/admin/clients/{client-table,client-tabs,task-sheet,asset-admin,pack-editor}.tsx`, `components/admin/upgrades/upgrade-table.tsx`, `lib/admin/apply-upgrade.ts` (`applyUpgrade(request, packs, extras)` → cambios a escribir), `lib/admin/apply-upgrade.test.ts`.

**Pasos:** 1. Test: `applyUpgrade({ to_pack_code:'P3', extras:['seo_full'] })` devuelve `{ packTemplateCode:'P3', extrasToAdd:['seo_full'] }` y con solo extras no cambia el pack. 2. FAIL. 3. Implementar. 4. PASS; E2E: Jose aprueba la ampliación de Ana → su área muestra P3. 5. Commit: `git commit -m "feat(web): admin clients, client file tabs and upgrade requests"`.

### Tarea 6.5 — Afiliados: lista, detalle, nivel, recompensas abonadas

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 5.5

**Objetivo:** UX §7.8–7.9: lista con nivel y recompensas pendientes; detalle con leads atribuidos y recompensas; cambiar `level` a `premium` (SA, RLS admin); "Marcar abonada" (`status='paid'`, `paid_at`).

**Ficheros:** `.../admin/afiliados/page.tsx`, `.../afiliados/[id]/page.tsx`, `.../afiliados/actions.ts`, `components/admin/affiliates/{affiliate-table,affiliate-detail,reward-row}.tsx`, `components/admin/affiliates/reward-row.test.tsx`.

**Pasos:** 1. Test: `RewardRow` `pending` muestra "Marcar abonada"; `paid` muestra fecha y sin botón. 2. FAIL. 3. Implementar. 4. PASS; E2E: marcar abonada → Bob la ve `paid` en su área. 5. Commit: `git commit -m "feat(web): admin affiliates with level and reward payout marking"`.

### Tarea 6.6 — Chat del admin con takeover

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 4.4

**Objetivo:** UX §7.10–7.11: conversaciones (`GET admin-chat/admin/conversations`), conversación con mensajes, respuesta manual (`POST …/messages`), interruptor IA (`POST …/ai`), marcar leído; realtime en `admin_chat_messages`. Opcional: migración `20260917100800_realtime_admin_chat_conversations.sql` si la bandeja necesita actualizarse sin recarga (se aplica en el gate 7.7 junto con Radar).

**Ficheros:** `.../admin/chat/page.tsx`, `.../chat/[id]/page.tsx`, `components/admin/chat/{conversation-list,conversation-view,takeover-switch}.tsx`, `components/admin/chat/takeover-switch.test.tsx`, `e2e/chat.spec.ts` (ampliar: admin ve la conversación y desactiva IA).

**Pasos:** 1. Test: `TakeoverSwitch` con `aiEnabled=true` muestra "IA activa" y al pulsar llama a `onToggle(false)`. 2. FAIL. 3. Implementar. 4. PASS; E2E. 5. Commit: `git commit -m "feat(web): admin chat conversations with human takeover"`.

**Cierre de la fase 6:** `revisor`; `/puerta-calidad` completa (`usuario-ejemplo` como Jose operador en leads y cierre cobrado; `revisor-seguridad` en `requireAdmin` por acción, RPC y `adminFetch`); merge.

---
## Fase 7 — Radar · Estimación XL · ramas `feat/radar-core`, `feat/radar-connectors`, `feat/radar-api`, `feat/radar-admin`, `feat/radar-mail-calendar`

Fuente: spec §13, DT §11 (SQL, endpoints, cron, conectores, OAuth, Telegram, materiales, correo, tests), UX §7.12–7.18, §9.10–9.14, §10.8, §13.16–13.19. Decisiones a–j de UX §13.19 **cerradas en este plan como las resolvió el DT §11.11**: (a) perfil solo lectura + ajustes rápidos en `radar_settings`; (b) posponer = `next_action_at` + evento `snoozed`; (c) `HERO_LIVE_MOBILE` medido en 2.13; (d) reautorización de Google desde admin con token cifrado en KV; (e) `?correos=revisar`; (f) PDF con Browser Rendering + impresión de respaldo (según 0.4); (g) botones Confirmar · Posponer · Descartar + `url` "Ver y editar"; (h) confirmación por Telegram para envío por API solo con material visto y segundo paso "¿Seguro?" de 10 min (UX v3.2); (i) pausa con fecha y reanudación automática; (j) control de plantilla ≥ 2 referencias concretas para API. Orden pensado para la válvula de escape: 7.1–7.7 (paquetes + migraciones) → 7.8 (conectores base) → 7.16–7.19 (núcleo + Telegram) → 7.25 (bandeja) es el mínimo operativo.

Las ramas `feat/radar-core` (7.1–7.7) y `feat/radar-connectors` (7.8–7.15) **arrancan tras la fase 1**, en paralelo con las fases 2–6.

### Tarea 7.1 — `packages/radar-core`: tipos, esquemas zod, plantillas de perfil/CV/voz, `profile.meta`

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no · **Depende de:** 1.1 · **Insumos:** `profile.json` real (Q10) y CV maestro (Q15) de Jose — hasta entonces plantillas con `{{DATO}}`

**Objetivo:** la única fuente de hechos de Radar y los esquemas que comparten gateway, web, CLI y tests (DT §11.1 "Perfil", §11.7, §11.11 k).

**Ficheros:**
- Crear: `packages/radar-core/package.json` (`@josecoded/radar-core`), `src/types.ts` (`Status`, `Actor`, `Source`, `EventKind`, `MaterialKind`, `Offer`, `Application`, `ApplicationEvent`, `Material`, `Profile`, `PlatformRow`), `src/schemas.ts` (zod: `offerDraftSchema` (campos de DT §11.4 `OfferDraft`), `ingestBodySchema` (`platform`, `run`, `offers ≤ 200`), `profileSchema` (12 campos: `roles[]`, `keywords{es,en}`, `remote[]`, `locations[]`, `minSalaryYear`, `minHourlyRate`, `minGigBudget`, `languages[]`, `excludedSectors[]`, `excludedCompanies[]`, `availabilityFrom`, `contact{phone,portfolio,github,linkedin,email}`, `rates{hourly,feature}`, `weights{}`), `scoreOutputSchema`, `cvPlanSchema` (`order[]`, `highlight{}`, `summary`, `omit[]`), `emailClassSchema`), `content/profile.json` (plantilla con `{{DATO}}` donde falte), `content/profile.test.json` (perfil de pruebas completo), `content/cv.master.es.md` y `content/cv.master.en.md` (plantilla con `<!-- id: exp-3catinfo -->`, `<!-- id: proj-hazmefila -->`, `<!-- id: edu-itil -->`, `<!-- id: skill-react-native -->`…), `content/voice.radar.md` (generado), `scripts/sync-voice.ts` (`VOZ_PATH` → registro formal-cercano: encabezado + reglas + ejemplos de `voz.md`), `scripts/profile-meta.ts` (`prebuild` → `content/profile.meta.json` `{ hash, commit, date }`), `test/schemas.test.ts`.

**Interfaces (produce):** todo lo exportado desde `@josecoded/radar-core` (`schemas`, `types`, `loadProfile(): Profile`, `loadCvMaster(locale): { markdown, sections: { id, heading, bullets[] }[] }`, `profileVersion(): string`).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-core/test/schemas.test.ts
import { it, expect } from 'vitest';
import { offerDraftSchema, ingestBodySchema, profileSchema } from '../src/schemas';
import { loadCvMaster } from '../src/content';
import testProfile from '../content/profile.test.json';
it('OfferDraft requires externalId, url, title, kind', () => {
  expect(offerDraftSchema.safeParse({ externalId:'1', url:'https://x', title:'t', kind:'job' }).success).toBe(true);
  expect(offerDraftSchema.safeParse({ url:'https://x', title:'t', kind:'job' }).success).toBe(false);
});
it('ingest body caps offers at 200', () => {
  const offers = Array.from({ length: 201 }, (_, i) => ({ externalId:String(i), url:'https://x', title:'t', kind:'job' }));
  expect(ingestBodySchema.safeParse({ platform:'tecnoempleo', run:{ key:'a2f0c1e8-0000-4000-8000-000000000000', runtime:'gateway', startedAt:new Date().toISOString(), status:'ok' }, offers }).success).toBe(false);
});
it('test profile is valid and a missing field gives a readable error', () => {
  expect(profileSchema.parse(testProfile).roles.length).toBeGreaterThan(0);
  const r = profileSchema.safeParse({ ...testProfile, minSalaryYear: undefined }); expect(r.success).toBe(false); expect(JSON.stringify(r.error?.issues)).toMatch(/minSalaryYear/);
});
it('CV master exposes section ids', () => { const cv = loadCvMaster('es'); expect(cv.sections.map(s => s.id)).toContain('exp-3catinfo'); });
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(radar-core): types, zod schemas, profile/CV/voice templates and profile version"`.

**Hecho cuando:** tests en verde; `pnpm --filter @josecoded/radar-core radar:sync-voice` produce `voice.radar.md` desde el vault (test de deriva `it.skipIf(!existsSync(VOZ_PATH))` como en pricing).

### Tarea 7.2 — `radar-core`: máquina de estados con invariante `sent ⇒ confirmed_by_jose` y `revert`

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no · **Depende de:** 7.1

**Objetivo:** `TRANSITIONS` literal de spec §13.3, `transition()`, `hasConfirmation()`, `revert()` (DT §11.2 "Transiciones", §11.10).

**Ficheros:** `src/state-machine.ts`, `test/state-machine.test.ts`.

**Interfaces (produce):**
```ts
export const TRANSITIONS: Record<Status, Partial<Record<Status, Actor[]>>>;
export class InvalidTransition extends Error { constructor(from: Status, to: Status, actor: Actor) }
export class NotConfirmed extends Error {}  // message 'radar_not_confirmed'
export function hasConfirmation(events: ApplicationEvent[]): boolean;  // confirmed_by_jose posterior al último status_change
export function transition(app: Application, to: Status, ctx: { actor: Actor; source?: Source; sourceId?: string; events: ApplicationEvent[]; now: Date }): { app: Application; event: ApplicationEvent };
export function revert(app: Application, event: ApplicationEvent, ctx: { now: Date }): { app: Application; event: ApplicationEvent };  // solo status_change de email|rule no revertidos
export function isTerminal(s: Status): boolean;  // rejected, discarded, offer
```

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-core/test/state-machine.test.ts
import { it, expect } from 'vitest';
import { transition, revert, hasConfirmation, InvalidTransition, NotConfirmed, TRANSITIONS } from '../src/state-machine';
const now = new Date('2026-09-20T08:00:00Z');
const app = (status: any) => ({ id:'a', offerId:'o', status, events: [] as any[] });
const ev = (kind: string, at: string, extra = {}) => ({ id: kind + at, applicationId:'a', kind, actor:'jose', createdAt: new Date(at), ...extra });
it('all listed transitions pass; unlisted throw', () => {
  for (const [from, tos] of Object.entries(TRANSITIONS)) for (const [to, actors] of Object.entries(tos!)) {
    if (to === 'sent') continue;
    expect(() => transition(app(from), to as any, { actor: actors![0], events: [], now })).not.toThrow();
  }
  expect(() => transition(app('discovered'), 'interview', { actor:'jose', events: [], now })).toThrow(InvalidTransition);
  expect(() => transition(app('sent'), 'discovered', { actor:'email', events: [], now })).toThrow(InvalidTransition);
});
it('sent requires confirmed_by_jose after the last status_change', () => {
  expect(() => transition(app('prepared'), 'sent', { actor:'connector', events: [], now })).toThrow(NotConfirmed);
  const stale = [ev('confirmed_by_jose','2026-09-19T10:00:00Z'), ev('status_change','2026-09-19T11:00:00Z', { toStatus:'prepared' })];
  expect(hasConfirmation(stale)).toBe(false);
  expect(() => transition(app('prepared'), 'sent', { actor:'connector', events: stale, now })).toThrow(NotConfirmed);
  const fresh = [ev('status_change','2026-09-19T10:00:00Z'), ev('confirmed_by_jose','2026-09-19T11:00:00Z')];
  const r = transition(app('prepared'), 'sent', { actor:'connector', source:'connector', events: fresh, now });
  expect(r.app.status).toBe('sent'); expect(r.event.kind).toBe('status_change'); expect(r.event.fromStatus).toBe('prepared');
});
it('email transitions are forward-only and never to sent', () => {
  expect(() => transition(app('interview'), 'contacted', { actor:'email', events: [], now })).toThrow(InvalidTransition);
  expect(() => transition(app('prepared'), 'sent', { actor:'email', events: [ev('status_change','2026-09-19T10:00:00Z'), ev('confirmed_by_jose','2026-09-19T11:00:00Z')], now })).toThrow(InvalidTransition);
});
it('revert restores from_status for email/rule changes and refuses jose changes', () => {
  const e = { ...ev('status_change','2026-09-19T10:00:00Z'), actor:'email', fromStatus:'sent', toStatus:'rejected' };
  const r = revert({ ...app('rejected') }, e as any, { now }); expect(r.app.status).toBe('sent'); expect(r.event.payload.revertsEventId).toBe(e.id);
  expect(() => revert(app('rejected'), { ...e, actor:'jose' } as any, { now })).toThrow();
});
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(radar-core): application state machine with confirmation invariant and reversible email/rule transitions"`.

### Tarea 7.3 — `radar-core`: reglas duras de puntuación, `fingerprint`/dedup y parser de cron

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no · **Depende de:** 7.1

**Ficheros:** `src/scoring/rules.ts` (`applyRules(offer, profile, settings): { discard: boolean; ruleHits: string[]; ruleAdjust: number }`), `src/dedup.ts` (`fingerprint(company, title)`, `findDuplicate(candidate, existing[], windowDays = 7)`), `src/cron.ts` (`nextRun(expr, from: Date): Date`), tests `scoring/rules.test.ts`, `dedup.test.ts`, `cron.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-core/test/scoring/rules.test.ts
import { it, expect } from 'vitest';
import { applyRules } from '../../src/scoring/rules';
import profile from '../../content/profile.test.json';
const base = { title:'React Native dev', company:'Acme', remote:'remote', kind:'job', compensation:{ min:45000, period:'year', currency:'EUR' }, language:'es', description:'', location:'Madrid' };
const settings = { quickExclusions: { companies: ['Malísima SL'], keywords: ['php senior'] } };
it('passes a good remote offer', () => expect(applyRules(base as any, profile as any, settings)).toEqual({ discard:false, ruleHits:[], ruleAdjust: 5 }));
it.each([
  [{ remote:'onsite', location:'Berlín' }, 'rule:onsite_out_of_zone'],
  [{ compensation:{ min:18000, period:'year' } }, 'rule:salary_below_min'],
  [{ language:'other' }, 'rule:language_not_covered'],
  [{ company:'Malísima SL' }, 'rule:company_quick_excluded'],
  [{ title:'PHP senior' }, 'rule:keyword_quick_excluded'],
])('%o → %s', (patch, hit) => { const r = applyRules({ ...base, ...patch } as any, profile as any, settings); expect(r.discard).toBe(true); expect(r.ruleHits).toContain(hit); });
```
```ts
// packages/radar-core/test/dedup.test.ts
import { it, expect } from 'vitest';
import { fingerprint, findDuplicate } from '../src/dedup';
it('normalizes accents, case and punctuation', () => expect(fingerprint('Acme, S.L.', 'Desarrollador/a React Native (Remoto)')).toBe(fingerprint('acme sl', 'desarrollador a react native remoto')));
it('links to the oldest within ±7 days on another platform', () => {
  const existing = [{ id:'old', platformId:'p1', fingerprint:'f', postedAt:new Date('2026-09-10') }, { id:'newer', platformId:'p1', fingerprint:'f', postedAt:new Date('2026-09-12') }];
  expect(findDuplicate({ platformId:'p2', fingerprint:'f', postedAt:new Date('2026-09-15') }, existing)?.id).toBe('old');
  expect(findDuplicate({ platformId:'p2', fingerprint:'f', postedAt:new Date('2026-09-21') }, existing)).toBeNull();   // 9 días
  expect(findDuplicate({ platformId:'p1', fingerprint:'f', postedAt:new Date('2026-09-11') }, existing)).toBeNull();   // misma plataforma
});
```
```ts
// packages/radar-core/test/cron.test.ts
import { it, expect } from 'vitest';
import { nextRun } from '../src/cron';
it.each([
  ['0 7 * * *', '2026-09-20T08:00:00Z', '2026-09-21T07:00:00Z'],
  ['*/30 * * * *', '2026-09-20T08:10:00Z', '2026-09-20T08:30:00Z'],
  ['0 6,18 * * *', '2026-09-20T07:00:00Z', '2026-09-20T18:00:00Z'],
  ['0 */6 * * *', '2026-09-20T05:59:00Z', '2026-09-20T06:00:00Z'],
])('%s from %s → %s', (expr, from, exp) => expect(nextRun(expr, new Date(from)).toISOString()).toBe(exp));
it('rejects 6-field or invalid expressions', () => expect(() => nextRun('* * * * * *', new Date())).toThrow());
```
- [ ] 2. → FAIL. 3. Implementar (`norm` en TS: NFD + quitar diacríticos, minúsculas, `[^a-z0-9 ]` → espacio, colapsar). 4. → PASS. 5. Commit: `git commit -m "feat(radar-core): hard scoring rules, cross-platform dedup and cron parser"`.

### Tarea 7.4 — `radar-core`: `callback_data` firmado de Telegram y textos de mensajes

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no · **Depende de:** 7.1

**Ficheros:** `src/telegram/callback.ts` (`encodeCallback({ action, id }, key): Promise<string>`; `verifyCallback(data, key): Promise<{ action, id } | null>`; acciones `c p p1 p3 pL d u m r k x n e1 e2 e3 e4 z`; formato `1|<a>|<id32>|<sig8>`), `src/telegram/messages.ts` (funciones puras que devuelven `{ text, keyboard }` con los textos literales de UX §7.17 y §10.8: `preparedMessage`, `confirmedMessage`, `assistedMessage`, `sentMessage`, `deadlineMessage`, `followupMessage`, `emailLinkedMessage`, `emailReviewMessage`, `connectorErrorMessage`, `googleExpiringMessage`, `dailySummary`, `weeklySummary`, `areYouSureMessage`), tests `telegram/callback.test.ts`, `telegram/messages.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-core/test/telegram/callback.test.ts
import { it, expect } from 'vitest';
import { encodeCallback, verifyCallback, ACTIONS } from '../../src/telegram/callback';
const key = 'test-key'; const id = '9f1c2d3e4a5b6c7d8e9f0a1b2c3d4e5f';
it('every action encodes to ≤ 64 bytes and round-trips', async () => {
  for (const a of ACTIONS) { const d = await encodeCallback({ action: a, id }, key); expect(new TextEncoder().encode(d).length).toBeLessThanOrEqual(64); expect(await verifyCallback(d, key)).toEqual({ action: a, id }); }
});
it('rejects tampered signature, other version and malformed id', async () => {
  const d = await encodeCallback({ action:'c', id }, key);
  expect(await verifyCallback(d.slice(0, -1) + 'x', key)).toBeNull();
  expect(await verifyCallback('2' + d.slice(1), key)).toBeNull();
  expect(await verifyCallback(`1|c|short|deadbeef`, key)).toBeNull();
});
```
```ts
// packages/radar-core/test/telegram/messages.test.ts
import { it, expect } from 'vitest';
import { preparedMessage } from '../../src/telegram/messages';
it('prepared message is ≤ 8 lines, no emojis, with three callback buttons and one url button', () => {
  const m = preparedMessage({ title:'React Native dev', company:'Acme', score:82, platform:'Tecnoempleo', deadline:null, materialSeen:false, references:2, blockers:[] , detailUrl:'https://josecoded.com/admin/radar/x', callbacks:{ c:'1|c|x|y', p:'1|p|x|y', d:'1|d|x|y' } });
  expect(m.text.split('\n').length).toBeLessThanOrEqual(8); expect(m.text).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  expect(m.keyboard.flat().map(b => b.text)).toEqual(['Confirmar', 'Posponer', 'Descartar', 'Ver y editar']);
  expect(m.keyboard.flat().find(b => b.text === 'Ver y editar')?.url).toContain('/admin/radar/x');
});
```
- [ ] 2. → FAIL. 3. Implementar (HMAC-SHA256 con `crypto.subtle`, comparación constante). 4. → PASS. 5. Commit: `git commit -m "feat(radar-core): signed Telegram callback data and message templates"`.

### Tarea 7.5 — `radar-core`: CV por reordenación + verificador de hechos, prompts, `email/query`, `email/linker`

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no · **Depende de:** 7.1, 7.2

**Ficheros:** `src/materials/cv.ts` (`assembleCv(master, plan): string`; `extractFacts(master, profile): Set<string>`; `verifyFacts(text, facts): string[]` → hechos no verificados), `src/materials/prompts.ts` (`scorePrompt(offer, profile, cvSummary)`, `cvPlanPrompt`, `coverPrompt`, `proposalPrompt`, `classifyEmailPrompt`, `followupPrompt`; el modelo nunca ve precios ni tarifas salvo las de `profile.rates` en la propuesta), `src/email/query.ts` (`buildGmailQuery({ platformDomains, companyDomains, subjects, messageIds, sinceDays }): string` ≤ 1 500 chars), `src/email/linker.ts` (`linkByRules(mail, openApplications, linkedEmails): { applicationId, rule } | null` con las reglas 1–3 de DT §11.8; Jaro-Winkler ≥ 0,9 en `src/text/jaro-winkler.ts`), tests `materials/cv.test.ts`, `email/query.test.ts`, `email/linker.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-core/test/materials/cv.test.ts
import { it, expect } from 'vitest';
import { assembleCv, extractFacts, verifyFacts } from '../../src/materials/cv';
const master = { sections: [ { id:'exp-3catinfo', heading:'3catinfo (2023)', bullets:['App de noticias en React Native', 'Rendimiento y publicación en stores'] }, { id:'proj-hazmefila', heading:'HazmeFila (2026)', bullets:['Expo + Supabase'] }, { id:'edu-itil', heading:'ITIL 4', bullets:[] } ] };
it('assembles in plan order, highlights first, omits sections, keeps master text verbatim', () => {
  const md = assembleCv(master as any, { order:['proj-hazmefila','exp-3catinfo'], highlight:{ 'exp-3catinfo':[1] }, summary:'Desarrollador React Native con apps en stores.', omit:['edu-itil'] });
  expect(md.indexOf('HazmeFila')).toBeLessThan(md.indexOf('3catinfo')); expect(md).not.toContain('ITIL 4');
  expect(md).toContain('Rendimiento y publicación en stores'); expect(md.indexOf('Rendimiento')).toBeLessThan(md.indexOf('App de noticias'));
});
it('flags facts absent from the master', () => {
  const facts = extractFacts(master as any, { keywords:{ es:['React Native'], en:[] } } as any);
  expect(verifyFacts('Experiencia con React Native desde 2022 y Kotlin en 2019', facts)).toEqual(['Kotlin', '2019']);
  expect(verifyFacts('React Native y Supabase', facts)).toEqual([]);
});
```
```ts
// packages/radar-core/test/email/linker.test.ts
import { it, expect } from 'vitest';
import { linkByRules } from '../../src/email/linker';
const apps = [{ id:'a1', externalId:'IJ-778', title:'Desarrollador React Native', companyDomain:'acme.es', platformDomains:['infojobs.net'] }, { id:'a2', externalId:'T-9', title:'Frontend Next.js', companyDomain:'beta.com', platformDomains:['tecnoempleo.com'] }];
it('rule 1: thread already linked', () => expect(linkByRules({ threadId:'th1', from:'x@y.z', subject:'', excerpt:'' } as any, apps as any, [{ threadId:'th1', applicationId:'a2' }] as any)).toEqual({ applicationId:'a2', rule:'thread' }));
it('rule 2: platform sender + external id or ≥ 0.9 title', () => {
  expect(linkByRules({ from:'noreply@infojobs.net', subject:'Tu candidatura IJ-778', excerpt:'' } as any, apps as any, [])).toEqual({ applicationId:'a1', rule:'platform_reference' });
  expect(linkByRules({ from:'noreply@tecnoempleo.com', subject:'Frontend Next.js — actualización', excerpt:'' } as any, apps as any, [])).toEqual({ applicationId:'a2', rule:'platform_reference' });
});
it('rule 3: company domain of exactly one open application; otherwise null', () => {
  expect(linkByRules({ from:'rrhh@acme.es', subject:'Hola', excerpt:'' } as any, apps as any, [])).toEqual({ applicationId:'a1', rule:'company_domain' });
  expect(linkByRules({ from:'news@other.com', subject:'Hola', excerpt:'' } as any, apps as any, [])).toBeNull();
});
```
```ts
// packages/radar-core/test/email/query.test.ts
import { it, expect } from 'vitest';
import { buildGmailQuery } from '../../src/email/query';
it('includes domains, subjects and message ids, stays under 1500 chars', () => {
  const q = buildGmailQuery({ platformDomains:['infojobs.net','linkedin.com'], companyDomains:['acme.es'], subjects: Array.from({ length: 40 }, (_, i) => `Oferta muy larga número ${i} con muchas palabras`), messageIds:['<abc@x>'], sinceDays: 3 });
  expect(q).toMatch(/newer_than:3d/); expect(q).toMatch(/from:\(.*infojobs\.net.*\)/); expect(q).toMatch(/rfc822msgid:<abc@x>/); expect(q.length).toBeLessThanOrEqual(1500);
});
```
- [ ] 2. → FAIL. 3. Implementar (facts = tecnologías del maestro y `profile.keywords`, empleadores de `heading`, años `\b(19|20)\d{2}\b`, productos; comparación sin tildes ni mayúsculas). 4. → PASS. 5. Commit: `git commit -m "feat(radar-core): CV assembly with fact verification, AI prompts, Gmail query builder and rule-based email linker"`.

### Tarea 7.6 — Migraciones `radar_*`, seed de Radar y tests de BD (RLS, guarda, `claim_work`)

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no (local) · **Depende de:** 1.6, 1.8

**Ficheros:** `supabase/migrations/20260919100000_radar_settings_platforms_runs.sql`, `20260919100100_radar_offers_scores.sql`, `20260919100200_radar_applications_materials_events.sql`, `20260919100300_radar_emails_profile_versions.sql`, `20260919100400_radar_rls_rpc.sql`, `20260919100500_radar_storage.sql` — **copiados literalmente de DT §11.1**; `supabase/seed/seed.sql` (ampliar: 8 plataformas `enabled=false` salvo `tecnoempleo` y `linkedin-email`, 6 ofertas, 3 candidaturas (`prepared` asistida, `prepared` con `can_submit`, `sent`), materiales v1, 4 correos, 1 evento propuesto); `apps/web/tests/rls-radar.test.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/tests/rls-radar.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { clientFor, serviceClient } from './helpers/supabase-test-clients';
const TABLES = ['radar_settings','radar_platforms','radar_runs','radar_offers','radar_scores','radar_applications','radar_materials','radar_application_events','radar_emails','radar_profile_versions'];
let jose, ana, bob, anon, svc;
beforeAll(async () => { [jose, ana, bob, anon] = await Promise.all(['jose','ana','bob','anon'].map(clientFor)); svc = serviceClient(); });
describe('only admin', () => {
  for (const t of TABLES) it(`${t}: ana/bob/anon get nothing, jose reads`, async () => {
    for (const c of [ana, bob, anon]) { const { data, error } = await c.from(t).select('*'); expect((data ?? []).length === 0 || error).toBeTruthy(); }
    const { error } = await jose.from(t).select('*'); expect(error).toBeNull();
  });
  it('bucket radar-materials lists nothing for ana', async () => { const { data } = await ana.storage.from('radar-materials').list(); expect(data ?? []).toHaveLength(0); });
  it('radar_claim_work denied to authenticated', async () => { const { error } = await ana.rpc('radar_claim_work', { p_kind:'score', p_limit:5 }); expect(error).toBeTruthy(); });
});
describe('guard trigger', () => {
  it('service role cannot set sent without confirmed_by_jose; can after', async () => {
    const { data: app } = await svc.from('radar_applications').select('id').eq('status','prepared').limit(1).single();
    const { error } = await svc.from('radar_applications').update({ status:'sent' }).eq('id', app.id); expect(error?.message).toMatch(/radar_not_confirmed/);
    await svc.from('radar_application_events').insert({ application_id: app.id, kind:'confirmed_by_jose', actor:'jose', source:'admin' });
    const { data, error: e2 } = await svc.from('radar_applications').update({ status:'sent', submitted_via:'assisted' }).eq('id', app.id).select().single();
    expect(e2).toBeNull(); expect(data.submitted_at).toBeTruthy();
  });
});
```
- [ ] 2. `supabase db reset` (seed falla) y `pnpm --filter web test -- rls-radar` → FAIL. 3. Crear migraciones y seed. 4. `supabase db reset` OK; test → PASS (≥ 13 aserciones). 5. Commit: `git commit -m "feat(supabase): radar_* tables, RLS admin-only, sent guard trigger, work queue RPCs, private bucket"`.

### Tarea 7.7 — **GATE**: aplicar migraciones de Radar en producción

**Agente:** controlador con OK de Jose · **Gate:** **SÍ** · **Depende de:** 7.6 mergeada

**Pasos:**
- [ ] 1. `scripts/supabase-baseline.sh` para comprobar que el baseline sigue igual a producción (test 1.6).
- [ ] 2. Pedir OK a Jose listando las 6 migraciones (+ la opcional `20260917100800` de realtime si 6.6 la necesita).
- [ ] 3. `list_tables` (ninguna `radar_*`) → `get_advisors` → `apply_migration` ×6 en orden → `get_advisors`: ningún hallazgo nuevo de seguridad; `unused_index` nuevos esperados.
- [ ] 4. Regenerar baseline + `baseline.meta.json` + cifras del test 1.6; `ESTADO.md`; ADR.

**Hecho cuando:** `list_tables` muestra las 10 tablas y el bucket `radar-materials` existe (privado).

**Cierre de `feat/radar-core`:** `revisor`; `/puerta-calidad` (sin UI: `qa` ejecuta los tests de BD y paquetes; `revisor-seguridad` revisa RLS, trigger, funciones `security definer` y que ningún `.eml` esté en el repo); merge.

### Tarea 7.8 — `packages/radar-connectors`: interfaz, registro, `bin/ingest.ts` y conector `linkedin-email`

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no · **Depende de:** 7.1

**Ficheros:** `packages/radar-connectors/package.json` (`@josecoded/radar-connectors`, bins `radar-ingest`, `radar-runner`), `src/types.ts` (**literal de DT §11.4**), `src/index.ts` (`connectors: Record<PlatformCode, RadarConnector>`), `src/connectors/linkedin-email.ts` (`parseEmail`: remitentes `jobalerts-noreply@linkedin.com`, `jobs-noreply@linkedin.com`; tarjetas → `OfferDraft` con `externalId = currentJobId`, url limpia sin `trk`/`refId`), `src/html/cards.ts` (extracción con `parse5` o regex robusta; sin cheerio), `bin/ingest.ts` (lee `OfferDraft[]` de stdin o `--file`, valida con `ingestBodySchema`, `POST $RADAR_API_URL/api/v1/radar/ingest` con `Authorization: Bearer $RADAR_INGEST_TOKEN`, reintento ×3 con backoff, en 5xx/sin red guarda en `pending/<runKey>.json` y sale 1; JSON inválido → sale 2 sin POST; al arrancar, reintenta los `pending/*`), `test/fixtures/emails/linkedin-alert-{1,2,3}.html` (anonimizados; sintéticos hasta que Jose aporte los reales), tests `connectors/linkedin-email.test.ts`, `ingest.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-connectors/test/connectors/linkedin-email.test.ts
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { connectors } from '../../src';
import { ctxFor } from '../helpers/ctx';
it('parses 5 job cards from an alert with clean urls and stable ids', async () => {
  const html = readFileSync(new URL('../fixtures/emails/linkedin-alert-1.html', import.meta.url), 'utf8');
  const offers = await connectors['linkedin-email'].parseEmail!({ from:'jobalerts-noreply@linkedin.com', subject:'5 nuevas ofertas', date:'2026-09-20T07:00:00Z', html, messageId:'<m1@linkedin>' }, ctxFor());
  expect(offers).toHaveLength(5);
  for (const o of offers) { expect(o.externalId).toMatch(/^\d{6,}$/); expect(o.url).toMatch(/^https:\/\/www\.linkedin\.com\/jobs\/view\/\d+\/?$/); expect(o.submitMode).toBe('assisted'); expect(o.kind).toBe('job'); }
  expect(offers).toMatchSnapshot();
});
it('ignores non-alert senders', async () => { expect(await connectors['linkedin-email'].parseEmail!({ from:'someone@linkedin.com', subject:'x', date:'', html:'<a href="https://www.linkedin.com/jobs/view/1/">x</a>', messageId:'<m2>' }, ctxFor())).toEqual([]); });
```
```ts
// packages/radar-connectors/test/ingest.test.ts
import { it, expect, vi } from 'vitest';
import { runIngest } from '../bin/ingest';
const offers = [{ externalId:'1', url:'https://x', title:'t', kind:'job' }];
it('invalid JSON exits 2 without POST', async () => { const fetch = vi.fn(); expect(await runIngest({ input:'{bad', platform:'indeed', fetch, env:{ RADAR_API_URL:'https://api', RADAR_INGEST_TOKEN:'t' }, pendingDir:'/tmp/p' })).toBe(2); expect(fetch).not.toHaveBeenCalled(); });
it('5xx retries then writes pending and exits 1; next run replays it', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
  const code = await runIngest({ input: JSON.stringify(offers), platform:'indeed', runKey:'k1', fetch, env:{ RADAR_API_URL:'https://api', RADAR_INGEST_TOKEN:'t' }, pendingDir:'/tmp/p-test', sleep: async () => {} });
  expect(code).toBe(1); expect(fetch).toHaveBeenCalledTimes(3);
  const fetch2 = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok:true, data:{ runId:'r' } }), { status: 200 }));
  await runIngest({ input: '[]', platform:'indeed', runKey:'k2', fetch: fetch2, env:{ RADAR_API_URL:'https://api', RADAR_INGEST_TOKEN:'t' }, pendingDir:'/tmp/p-test' });
  expect(fetch2.mock.calls.some(c => JSON.parse(c[1].body).run.key === 'k1')).toBe(true);
});
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(radar-connectors): connector interface, registry, ingest CLI and linkedin-email parser"`.

### Tarea 7.9 — Conector `indeed` (normalizador) + skill `/radar-indeed` + plist del Mac

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** la **instalación** del plist es GATE (7.31); aquí solo ficheros · **Depende de:** 7.8, 0.5

**Ficheros:** `src/connectors/indeed.ts` (`normalizeIndeed(json): OfferDraft[]` desde la salida del MCP: `id`, `title`, `company`, `location`, `remote`, `salary`, `applyUrl`/`url`, `description`; `capabilities.discover=false` en el paquete: el descubrimiento lo hace la skill), `test/fixtures/indeed/search.json`, `test/fixtures/indeed/details.json` (anonimizadas desde 0.5), `test/connectors/indeed.test.ts`; en **claude-config**: `skills/radar-indeed/SKILL.md` (pasos: `GET $RADAR_API_URL/api/v1/radar/platforms/indeed/job` con el token de `~/.config/josecoded/radar.env` → si `run:false` termina; por cada `query` (≤ 3) `search_jobs` (país ES, remoto según `remote`, ≤ 30); `get_job_details` para ids no presentes en `~/.config/josecoded/indeed-seen.json` (30 días); escribe `OfferDraft[]` a `/tmp/radar-indeed-<runKey>.json`; ejecuta `pnpm --filter @josecoded/radar-connectors ingest --platform indeed --run-key <runKey> --file …`; siempre termina con una ingesta aunque sea `status:'error'`), `automation/com.jose.josecoded.radar-indeed.plist` (copia en `infra/mac/`; `StartCalendarInterval` 08:00; `run-skill.sh radar-indeed "/radar-indeed" guarded` con los flags de 0.5).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// packages/radar-connectors/test/connectors/indeed.test.ts
import { it, expect } from 'vitest';
import search from '../fixtures/indeed/search.json';
import { normalizeIndeed } from '../../src/connectors/indeed';
it('normalizes MCP search results into OfferDrafts with intact apply links', () => {
  const offers = normalizeIndeed(search);
  expect(offers.length).toBeGreaterThan(0);
  for (const o of offers) { expect(o.externalId).toBeTruthy(); expect(o.url).toMatch(/indeed\.com/); expect(o.submitMode).toBe('assisted'); }
  expect(offers).toMatchSnapshot();
});
```
- [ ] 2. → FAIL. 3. Implementar; escribir la skill y el plist. 4. → PASS; prueba manual: `claude -p` con la skill contra `wrangler dev` del gateway (7.16) ingesta ≥ 1 oferta. 5. Commit en josecoded y commit en claude-config: `git commit -m "feat(radar-connectors): indeed normalizer" / "feat(skills): /radar-indeed skill and launchd plist"`.

### Tarea 7.10 — Conector `infojobs` (API oficial)

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no · **Depende de:** 7.8, 0.3

**Ficheros:** `src/connectors/infojobs.ts` (`discover`: `GET https://api.infojobs.net/api/9/offer?q=…&province=…&teleworking=…` Basic `INFOJOBS_CLIENT_ID:INFOJOBS_CLIENT_SECRET`; `detail`: `/api/7/offer/{id}`; `submit`/`prepareForm` **solo si 0.3 dijo `can_submit=true`**; `secrets: [{ name:'INFOJOBS_CLIENT_ID', where:'wrangler', required:true }, { name:'INFOJOBS_CLIENT_SECRET', … }]`; `defaults: { schedule:'0 */6 * * *', limits:{ runsPerDay:4, maxOffers:50 }, emailDomains:['infojobs.net'] }`), fixtures de 0.3, `test/connectors/infojobs.test.ts`.

**Pasos:** 1. Test: `discover` con `fetch` falso que sirve `search.json` → snapshot de `OfferDraft[]` (compensación parseada a `{min,max,period:'year'}`, `remote` desde `teleworking`, `postedAt` ISO); sin secretos → lanza `MissingSecrets(['INFOJOBS_CLIENT_ID', …])`. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(radar-connectors): infojobs API connector"`.

### Tarea 7.11 — Conector `tecnoempleo` (feed + ficha con `HTMLRewriter`)

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no · **Depende de:** 7.8, 0.6

**Ficheros:** `src/connectors/tecnoempleo.ts` (`discover`: feed por consulta con `fast-xml-parser`; `detail`: ficha con `HTMLRewriter` **si existe en el runtime** (gateway) o `parse5` en Node — abstraído en `src/html/extract.ts` con `extractDetail(html, selectors)`), fixtures de 0.6, `test/connectors/tecnoempleo.test.ts`.

**Pasos:** 1. Test: `discover` sobre `feed.xml` → ≥ 10 `OfferDraft` con `externalId` (id de la URL), `postedAt` ISO, `kind:'job'`, snapshot; `detail` sobre `detail.html` → `description`, `requirements[]`, `deadlineAt` si aparece; con `maxOffers: 5` devuelve 5. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(radar-connectors): tecnoempleo feed connector"`.

### Tarea 7.12 — `bin/runner.ts` (Node + Playwright para Omen) y conector `workana`

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no · **Depende de:** 7.8

**Ficheros:** `bin/runner.ts` (`radar-runner run --platform <code> --run-key <k>`: `GET /job` → `connectors[code].discover` con `ctx` real (Playwright Chromium, `sleep` aleatorio en `[minPauseMs, maxPauseMs]`, `detectBlock` tras cada página) → `POST /radar/ingest` con `status` `ok|blocked|error`; también expone `POST :4100/run { platform, runKey, secrets? }` con `RADAR_RUNNER_TOKEN` para n8n), `src/connectors/workana.ts` (listados públicos `https://www.workana.com/jobs?language=es&category=it-programming&query=…`, fichas; `kind:'gig'`; `detectBlock` en 403/429/captcha; `defaults: { schedule:'0 8,20 * * *', limits:{ runsPerDay:2, maxOffers:40, minPauseMs:3000, maxPauseMs:12000, maxPages:3 } }`), fixtures HTML anonimizadas, `test/connectors/workana.test.ts`, `test/runner.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/radar-connectors/test/connectors/workana.test.ts
import { it, expect, vi } from 'vitest';
import { connectors } from '../../src';
import { ctxFor } from '../helpers/ctx';
it('stops at the block page without requesting page 2 and reports blocked', async () => {
  const pages = ['list-1.html', 'blocked.html'].map(f => readFixture(`workana/${f}`));
  const fetch = vi.fn().mockImplementation(async () => new Response(pages.shift(), { status: pages.length ? 200 : 403 }));
  const ctx = ctxFor({ fetch, limits:{ runsPerDay:2, maxOffers:40, minPauseMs:3000, maxPauseMs:12000, maxPages:3 } });
  await expect(connectors.workana.discover!({ roles:['react'], keywords:[], locations:[], remote:['remote'], kind:'gig', languages:['es'], sinceDays:7, maxOffers:40 }, ctx)).rejects.toThrow(/blocked/);
  expect(fetch).toHaveBeenCalledTimes(2);
  for (const ms of ctx.sleepCalls) { expect(ms).toBeGreaterThanOrEqual(3000); expect(ms).toBeLessThanOrEqual(12000); }
});
it('never exceeds maxOffers', async () => { /* 3 páginas de 20 → 40 con maxOffers 40; no pide la 4.ª */ });
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(radar-connectors): Playwright runner for Omen and workana scraper with block detection"`.

### Tarea 7.13 — Conector `linkedin` (scraping con sesión propia, apagado por defecto)

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no (queda `enabled=false`; activar es decisión de Jose tras 2 semanas, Q13) · **Depende de:** 7.12

**Ficheros:** `src/connectors/linkedin.ts` (`storageState` desde la cookie `li_at` recibida en el cuerpo de `/run` (nunca en disco); listados `/jobs/search/?keywords=…&f_WT=2`, fichas; **solo lectura**; `detectBlock`: `/checkpoint/`, `/authwall`, `/uas/login`, `#captcha-internal` → `blocked`; `limits` **no editables al alza**: `{ runsPerDay:1, maxOffers:30, minPauseMs:3000, maxPauseMs:12000, maxPages:3 }`; `secrets:[{ name:'LINKEDIN_LI_AT', where:'n8n', required:true }]`; `defaults.schedule:'0 9 * * *'`), fixtures anonimizadas de listado, ficha y checkpoint, `test/connectors/linkedin.test.ts`.

**Pasos:** 1. Test: `detectBlock({ url:'https://www.linkedin.com/checkpoint/challenge/x', status:200 })` → `'verification'`; `discover` con fixture de checkpoint en la página 2 → lanza `blocked` tras 2 peticiones; `limits` mayores que los máximos se recortan (`clampLimits`). 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(radar-connectors): linkedin read-only scraper with strict limits and block detection (disabled by default)"`.

### Tarea 7.14 — Conector `malt-email`

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no · **Depende de:** 7.8

**Ficheros:** `src/connectors/malt-email.ts` (`parseEmail`: remitentes `@malt.es`/`@malt.com` con asunto "Nueva propuesta de proyecto"/"New project proposal" → `OfferDraft` `kind:'gig'`, `initialStatus:'contacted'`, `submitMode:'assisted'`; sin `discover`), 2 fixtures anonimizadas, `test/connectors/malt-email.test.ts`.

**Pasos:** 1. Test: fixture → 1 oferta con `initialStatus:'contacted'`, `url` de Malt, presupuesto si aparece; correo de marketing de Malt → `[]`. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(radar-connectors): malt-email parser (offers arrive as contacted)"`.

### Tarea 7.15 — Conector `upwork` (GraphQL oficial, opcional en el lanzamiento)

**Agente:** implementador-web · **Rama:** `feat/radar-connectors` · **Gate:** no · **Depende de:** 7.8, API key de Upwork (Q14) — sin ella, se implementa contra fixture y queda `no_credentials`

**Ficheros:** `src/connectors/upwork.ts` (`marketplaceJobPostingsSearch` con `Authorization: Bearer <access>`; el token lo aporta `ctx.secrets.UPWORK_ACCESS_TOKEN` que el gateway obtiene del refresh cifrado en `RADAR_KV` (7.20 reutiliza `googleFetch`-like como `oauthFetch('upwork')`); `kind:'gig'`; `secrets:[UPWORK_CLIENT_ID (wrangler), UPWORK_CLIENT_SECRET (wrangler), UPWORK_TOKEN (kv-oauth)]`; `defaults.schedule:'0 */6 * * *'`), fixture GraphQL, `test/connectors/upwork.test.ts`.

**Pasos:** 1. Test: `discover` sobre fixture → snapshot con `compensation:{ budget | hourly }` y `submitMode:'assisted'`. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(radar-connectors): upwork GraphQL connector (optional at launch)"`.

**Cierre de `feat/radar-connectors`:** `revisor`; `/puerta-calidad` (sin UI; `revisor-seguridad` con foco en secretos, `detectBlock`, límites de LinkedIn no editables, `.gitignore` de `pending/`); merge.

---
### Tarea 7.16 — Gateway Radar: módulo, modos de auth, `POST /radar/ingest`, `GET /platforms/:code/job`, `GET /platforms/health`

**Agente:** implementador-web · **Rama:** `feat/radar-api` · **Gate:** no · **Depende de:** 7.7, 7.3, 7.8, 1.7

**Objetivo:** el núcleo de ingesta idempotente de DT §11.2 en workerd, con service role, dedup en TS y `radar_finish_run`.

**Ficheros:**
- Crear: `apps/api/src/modules/radar/radar.routes.ts` (grupo `/radar`, montado antes de `protectedV1Routes`), `radar.auth.ts` (`radarAuth(mode: 'admin'|'ingest'|'telegram'|'google-state')`: JWT admin con `assertAdmin` existente; `Bearer RADAR_INGEST_TOKEN` (+ `_PREV`) en tiempo constante; secreto de Telegram; `state` en KV), `ingest.service.ts` (`ingestRun(env, ctx, body)` pasos 1–8 de DT §11.2), `platforms.service.ts` (`getJob(code)`, `health()`), `radar.repo.ts` (acceso a Supabase con service role: `upsertOffers`, `getRun`, `createRun`, `finishRun`, `updatePlatform`, …), `radar.errors.ts` (códigos aditivos), tests `ingest.routes.test.ts`, `platforms.routes.test.ts`.
- Modificar: `wrangler.jsonc` (`RADAR_KV`, `RADAR_RATE_LIMITER` 1004 60/60, `triggers.crons`), `src/config/env.ts` (vars/secrets de DT §9 "Radar"), `routes-manifest.ts`, `vitest.config.ts` (Supabase local en CI: `SUPABASE_URL=http://127.0.0.1:54321`; `fetchMock` estricto para el resto).

**Interfaces (produce):** `ingestRun(...)` → `{ runId, received, created, updated, duplicates, queuedForScoring, replay }`; `radarAuth`; `RadarRepo`.

**Pasos:**
- [ ] 1. Tests que fallan (workerd contra `supabase start` con la seed de 7.6):
```ts
// apps/api/src/modules/radar/ingest.routes.test.ts
import { SELF, env } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
const offer = (id: string, title = 'React Native dev', company = 'Acme') => ({ externalId:id, url:`https://www.tecnoempleo.com/x/${id}`, title, company, kind:'job', postedAt:'2026-09-19T00:00:00Z' });
const body = (platform: string, offers: any[], key = randomUUID(), status = 'ok') => ({ platform, run:{ key, runtime:'gateway', startedAt:new Date().toISOString(), status, fullListing:true }, offers });
const post = (b: any, token = env.RADAR_INGEST_TOKEN) => SELF.fetch('http://x/api/v1/radar/ingest', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token}` }, body: JSON.stringify(b) });
it('401 with a bad token; 404 unknown platform; 409 when disabled', async () => {
  expect((await post(body('tecnoempleo', []), 'nope')).status).toBe(401);
  expect((await post(body('nope', []))).status).toBe(404);
  expect((await post(body('upwork', []))).status).toBe(409);
});
it('same payload twice → second updates, same run_key finished → replay', async () => {
  const key = randomUUID(); const b = body('tecnoempleo', [offer('t-1'), offer('t-2')], key);
  const r1 = (await (await post(b)).json()).data; expect(r1).toMatchObject({ received:2, created:2, updated:0, replay:false });
  const r2 = (await (await post(body('tecnoempleo', [offer('t-1'), offer('t-2')]))).json()).data; expect(r2).toMatchObject({ created:0, updated:2, replay:false });
  const r3 = (await (await post(b)).json()).data; expect(r3.replay).toBe(true); expect(r3.created).toBe(2);
});
it('cross-platform duplicate gets duplicate_of and is not scored', async () => {
  await post(body('tecnoempleo', [offer('dup-a', 'Frontend Next.js', 'Beta SL')]));
  const r = (await (await post(body('linkedin-email', [offer('dup-b', 'Frontend Next.js (remoto)', 'Beta, S.L.')]))).json()).data;
  expect(r.duplicates).toBe(1); expect(r.queuedForScoring).toBe(0);
});
it('201 offers → 400; blocked run marks platform blocked', async () => {
  expect((await post(body('tecnoempleo', Array.from({ length: 201 }, (_, i) => offer(String(i)))))).status).toBe(400);
  await post(body('linkedin-email', [], randomUUID(), 'blocked'));
  const h = (await (await SELF.fetch('http://x/api/v1/radar/platforms/health', { headers:{ authorization:`Bearer ${await adminJwt()}` } })).json()).data;
  expect(h.platforms.find((p: any) => p.code === 'linkedin-email').status).toBe('blocked');
});
it('GET /job returns queries and limits and respects runs_per_day', async () => {
  const j = (await (await SELF.fetch('http://x/api/v1/radar/platforms/tecnoempleo/job', { headers:{ authorization:`Bearer ${env.RADAR_INGEST_TOKEN}` } })).json()).data;
  expect(j.run).toBe(true); expect(j.queries[0].roles.length).toBeGreaterThan(0); expect(j.runKey).toMatch(/[0-9a-f-]{36}/);
});
```
- [ ] 2. → FAIL. 3. Implementar (ingesta con `waitUntil(sweep({ score:5, prepare:0 }))` que en esta tarea es un no-op hasta 7.17). 4. → PASS. 5. Commit: `git commit -m "feat(api): radar ingest with idempotent runs, cross-platform dedup, job endpoint and platform health"`.

### Tarea 7.17 — Gateway Radar: `scheduled` sweep (puntuar, preparar, caducar, perfil, reintentos)

**Agente:** implementador-web · **Rama:** `feat/radar-api` · **Gate:** no · **Depende de:** 7.16, 7.2, 7.5

**Ficheros:** `src/scheduled.ts` (despacho por `event.cron` con `try/catch` por bloque), `src/modules/radar/sweep.service.ts` (`sweep(env, ctx, { score, prepare })`: pasos 1–8 de DT §11.3 `*/5`), `scoring.service.ts` (`scoreOffer(env, offer, profile, settings)`: reglas → IA JSON mode → `radar_scores` `is_current`), `prepare.service.ts` (`prepareApplication(env, appId, opts)`: plan de CV → `assembleCv` → `verifyFacts`; carta/propuesta; `form_payload` si `prepareForm`; `radar_materials` v1; → `prepared`; Telegram `radar.prepared` vía 7.19 (aquí una interfaz `notifier` inyectable)), `ai.service.ts` (`runJson(env, prompt, schema, { retries:1 })` con AI Gateway y respaldo `worker.josecoded.com/ai/chat` tras 2 fallos 5xx), tests `sweep.test.ts`, `scoring.service.test.ts`, `prepare.service.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/modules/radar/sweep.test.ts (workerd; AI falso con env.AI.__queue)
import { SELF, env } from 'cloudflare:test';
import { it, expect } from 'vitest';
it('scores ≤ 8 pending offers; ≥ threshold creates a discovered application; rules discard without AI', async () => {
  await seedOffers([{ id:'o-good', title:'React Native dev', remote:'remote', compensation:{ min:45000, period:'year' } }, { id:'o-low', title:'Java', remote:'remote' }, { id:'o-onsite', title:'React', remote:'onsite', location:'Berlín' }]);
  env.AI.__queue = [{ score:82, reasons:[{sign:'+',text:'RN',weight:3},{sign:'+',text:'remoto',weight:2},{sign:'-',text:'sin salario',weight:1}], language:'es' }, { score:40, reasons:[{sign:'-',text:'Java',weight:3},{sign:'-',text:'x',weight:1},{sign:'+',text:'remoto',weight:1}], language:'es' }];
  await SELF.scheduled({ cron:'*/5 * * * *' });
  expect(await scoreOf('o-good')).toMatchObject({ score: 87, is_current: true });  // 82 + remote:+5
  expect(await appOf('o-good')).toMatchObject({ status:'discovered', prepare_status:'pending' });
  expect(await appOf('o-low')).toBeNull();
  expect(await offerRow('o-onsite')).toMatchObject({ score_status:'discarded_by_rule' }); expect(env.AI.__calls).toBe(2);
});
it('prepares ≤ 2 discovered applications into prepared with v1 materials and a notification', async () => {
  env.AI.__queue = [cvPlanFixture, coverFixture, cvPlanFixture, coverFixture, cvPlanFixture, coverFixture];
  await SELF.scheduled({ cron:'*/5 * * * *' });
  const prepared = await appsWhere({ status:'prepared' }); expect(prepared.length).toBeLessThanOrEqual(2);
  const mats = await materialsOf(prepared[0].id); expect(mats.map(m => m.kind).sort()).toEqual(['cover_letter','cv']); expect(mats[0].version).toBe(1); expect(mats[0].generated_by).toBe('ai');
  expect(env.__notifier.calls[0]).toMatchObject({ event:'radar.prepared', applicationId: prepared[0].id });
});
it('AI failure marks error and retries next tick; expires offers missing twice; records a new profile version', async () => { /* como DT §11.10 sweep */ });
it('a tick with 8 scores + 2 prepares stays under 30 s wall time with fake AI', async () => { const t = Date.now(); await SELF.scheduled({ cron:'*/5 * * * *' }); expect(Date.now() - t).toBeLessThan(30000); });
```
- [ ] 2. → FAIL. 3. Implementar (`radar_claim_work` para reclamar; lotes `RADAR_BATCH_SCORE=8`, `RADAR_BATCH_PREPARE=2`; `unverified_facts` guardados; `diff_summary`). 4. → PASS. 5. Commit: `git commit -m "feat(api): radar sweep cron — rule and AI scoring, material preparation, expiry, retries, profile versions"`.

**Hecho cuando:** tests en verde y el tiempo por tick medido queda anotado en `ESTADO.md` (riesgo Workers Free).

### Tarea 7.18 — Gateway Radar: rutas de candidaturas (`prepare`, `confirm`, `mark-sent`, `snooze`, `discard`, `reopen`, `status`, `revert`)

**Agente:** implementador-web · **Rama:** `feat/radar-api` · **Gate:** no · **Depende de:** 7.17

**Ficheros:** `src/modules/radar/applications.routes.ts`, `applications.service.ts` (`confirm(env, ctx, appId, { source, sourceId, acknowledgeUnverified })` pasos 1–6 de DT §11.2 "Confirmación"; `markSent`, `snooze` (evento `snoozed`), `discard` (+ `excludeCompany` → `quick_exclusions`), `reopen`, `setStatus`, `revertEvent`), `applications.routes.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/modules/radar/applications.routes.test.ts (extracto)
import { SELF, env, fetchMock } from 'cloudflare:test';
import { it, expect } from 'vitest';
const call = (id: string, action: string, body = {}) => SELF.fetch(`http://x/api/v1/radar/applications/${id}/${action}`, { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${adminJwt}` }, body: JSON.stringify(body) });
it('assisted confirm records confirmed_by_jose and returns mode assisted; mark-sent then sets sent/assisted', async () => {
  const id = await seededApp('prepared-assisted');
  const r = (await (await call(id, 'confirm', { source:'admin' })).json()).data; expect(r).toMatchObject({ status:'prepared', mode:'assisted' }); expect(r.offerUrl).toMatch(/^https:/);
  expect((await eventsOf(id)).some(e => e.kind === 'confirmed_by_jose' && e.source === 'admin')).toBe(true);
  const s = (await (await call(id, 'mark-sent')).json()).data; expect(s).toEqual({ status:'sent', submittedVia:'assisted' });
});
it('mark-sent without confirmation → 409 radar_not_confirmed', async () => { const id = await seededApp('prepared-assisted'); const r = await call(id, 'mark-sent'); expect(r.status).toBe(409); expect((await r.json()).error.code).toBe('radar_not_confirmed'); });
it('connector confirm: submit OK → sent with receipt; submit 500 → stays prepared with error event and assisted mode', async () => {
  const id = await seededApp('prepared-connector');
  fetchMock.get('https://api.infojobs.net').intercept({ path:/apply/, method:'POST' }).reply(200, { id:'4F7Q' });
  expect((await (await call(id, 'confirm', { source:'admin' })).json()).data).toMatchObject({ status:'sent', submittedVia:'connector', receipt:{ id:'4F7Q' } });
  const id2 = await seededApp('prepared-connector');
  fetchMock.get('https://api.infojobs.net').intercept({ path:/apply/, method:'POST' }).reply(500, {});
  const r = (await (await call(id2, 'confirm', { source:'admin' })).json()).data; expect(r.mode).toBe('assisted'); expect((await appRow(id2)).status).toBe('prepared'); expect((await eventsOf(id2)).some(e => e.kind === 'error')).toBe(true);
});
it('unverified facts block confirm unless acknowledged', async () => { const id = await seededApp('prepared-unverified'); expect((await call(id, 'confirm', { source:'admin' })).status).toBe(400); expect((await call(id, 'confirm', { source:'admin', acknowledgeUnverified:true })).status).toBe(200); });
it('snooze sets next_action_at and a snoozed event; discard + reopen within undo window', async () => {
  const id = await seededApp('prepared-assisted');
  const s = (await (await call(id, 'snooze', { until:'2026-09-22T06:00:00Z', source:'admin' })).json()).data; expect(s.nextActionAt).toBe('2026-09-22T06:00:00.000Z');
  const d = (await (await call(id, 'discard', { reason:'not_interested' })).json()).data; expect(d.status).toBe('discarded');
  expect((await (await call(id, 'reopen', {})).json()).data.status).toBe('prepared');
});
it('revert an email transition restores state; revert a jose transition → 409', async () => { /* seed sent→rejected by email */ });
```
- [ ] 2. → FAIL. 3. Implementar (Telegram: si `telegram_msg` existe, editar mensaje — a través del `notifier` de 7.19; aquí falso). 4. → PASS. 5. Commit: `git commit -m "feat(api): radar application actions with confirmation invariant, assisted mode and reversible events"`.

### Tarea 7.19 — Gateway Radar: Telegram (envío con botones, edición, reintentos, webhook y acciones)

**Agente:** implementador-web · **Rama:** `feat/radar-api` · **Gate:** `setWebhook` es GATE (7.31) · **Depende de:** 7.18, 7.4

**Ficheros:** `src/modules/radar/telegram.service.ts` (`sendRadarMessage(env, ctx, { kind, applicationId?, … })` con `TELEGRAM_BOT_TOKEN`, `chat_id` de `staff_members` (caché KV `tg:chat` 1 h), `telegram_msg` guardado; `editDecision(app, text)`; reintentos KV `tg:retry:*`), `telegram.routes.ts` (`POST /radar/telegram`: pasos 1–7 de DT §11.6; acciones `c p p1 p3 pL d u m r k x n e1–e4 z`; para `c` sobre `can_submit` sin material visto → responde con "Ver material" (UX v3.2); `¿Seguro?` con caducidad 10 min en KV), `telegram.routes.test.ts`, `telegram.service.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/modules/radar/telegram.routes.test.ts (extracto)
import { SELF, env, fetchMock } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { encodeCallback } from '@josecoded/radar-core/telegram/callback';
const update = async (action: string, id: string, fromId = env.__joseChatId, cbId = 'cb-' + Math.random()) => ({ update_id: 1, callback_query: { id: cbId, from: { id: fromId }, message: { message_id: 10, chat: { id: fromId }, date: Math.floor(Date.now()/1000) }, data: await encodeCallback({ action, id }, env.RADAR_CALLBACK_HMAC_KEY) } });
const hook = (u: any, secret = env.TELEGRAM_WEBHOOK_SECRET) => SELF.fetch('http://x/api/v1/radar/telegram', { method:'POST', headers:{ 'content-type':'application/json', 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(u) });
it('wrong secret → 401; foreign from.id → 200 no effect; bad signature → 200 no effect', async () => {
  const id = await seededApp('prepared-assisted');
  expect((await hook(await update('c', id), 'bad')).status).toBe(401);
  expect((await hook(await update('c', id, 999))).status).toBe(200); expect((await appRow(id)).status).toBe('prepared'); expect((await eventsOf(id)).some(e => e.kind === 'confirmed_by_jose')).toBe(false);
  const u = await update('c', id); u.callback_query.data = u.callback_query.data.slice(0, -1) + '0'; expect((await hook(u)).status).toBe(200); expect((await eventsOf(id)).some(e => e.kind === 'confirmed_by_jose')).toBe(false);
});
it('valid c on assisted → confirmed from telegram, message edited with the UX text; same callback id twice → one confirmation', async () => {
  const id = await seededApp('prepared-assisted'); const edits: any[] = [];
  fetchMock.get('https://api.telegram.org').intercept({ path:/editMessageText/, method:'POST' }).reply(200, (o) => { edits.push(JSON.parse(o.body)); return { ok:true }; }).persist();
  fetchMock.get('https://api.telegram.org').intercept({ path:/answerCallbackQuery/, method:'POST' }).reply(200, { ok:true }).persist();
  const u = await update('c', id); await hook(u); await hook(u);
  expect((await eventsOf(id)).filter(e => e.kind === 'confirmed_by_jose')).toHaveLength(1);
  expect(edits[0].text).toMatch(/Confirmada .* desde Telegram/); expect(edits[0].reply_markup.inline_keyboard.flat().map((b: any) => b.text)).toContain('Marcar enviada');
});
it('c on connector platform with unseen material → replies "Ver material" and does not confirm', async () => { /* UX v3.2 §7.17 */ });
it('p1 sets next_action_at tomorrow 08:00 Madrid; d then u within 10 min restores prepared; k creates the calendar event exactly once', async () => { /* como DT §11.10 telegram */ });
it('sendMessage failure is queued in KV and retried by the sweep (≤ 3)', async () => { /* telegram.service.test */ });
```
- [ ] 2. → FAIL. 3. Implementar; `answerCallbackQuery` siempre; `submit` largo en `waitUntil` tras editar a "Confirmada · Enviando…". 4. → PASS. 5. Commit: `git commit -m "feat(api): radar Telegram notifications with inline actions, signed callbacks, idempotent webhook and retries"`.

### Tarea 7.20 — Gateway Radar: Google OAuth (modo prueba), token cifrado en KV, `googleFetch`, calendario "Radar"

**Agente:** implementador-web · **Rama:** `feat/radar-mail-calendar` · **Gate:** el proyecto OAuth lo crea Jose; secretos en 7.31 · **Depende de:** 7.16

**Ficheros:** `src/modules/radar/google.routes.ts` (`POST /radar/google/authorize`, `GET /radar/google/callback`, `POST /radar/google/calendar`), `google.service.ts` (`authorizeUrl(env)` con `state` en KV TTL 10 min; `handleCallback(env, code, state)`: intercambio, `userinfo`, **AES-GCM-256** con `RADAR_KV_KEY` → `google:refresh`; `googleFetch(env, path, init)` con refresh y `invalid_grant` → `expired` + alerta; `ensureRadarCalendar(env)` → `calendars.insert { summary:'Radar', timeZone:'Europe/Madrid' }`; `createCalendarEvent(env, evt, confirmation)` **lanza** sin `confirmation.source ∈ {admin,telegram}` o sin `confirmation.at`), `crypto.ts` (`encrypt`, `decrypt` con `crypto.subtle`), tests `google.routes.test.ts`, `google.service.test.ts`, `crypto.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/modules/radar/google.service.test.ts (extracto)
import { env, fetchMock } from 'cloudflare:test';
import { it, expect } from 'vitest';
import { handleCallback, googleFetch, createCalendarEvent } from './google.service';
import { encrypt, decrypt } from './crypto';
it('encrypt/decrypt round-trips with a random IV per write', async () => { const a = await encrypt('tok', env.RADAR_KV_KEY), b = await encrypt('tok', env.RADAR_KV_KEY); expect(a).not.toBe(b); expect(await decrypt(a, env.RADAR_KV_KEY)).toBe('tok'); });
it('callback with unknown state → 400; valid → encrypted refresh in KV, status ok', async () => {
  await expect(handleCallback(env, 'code', 'unknown')).rejects.toMatchObject({ status: 400 });
  await env.RADAR_KV.put('google:state:n1', '1', { expirationTtl: 600 });
  fetchMock.get('https://oauth2.googleapis.com').intercept({ path:'/token', method:'POST' }).reply(200, { access_token:'a', refresh_token:'REFRESH-SECRET', expires_in:3600 });
  fetchMock.get('https://www.googleapis.com').intercept({ path:/userinfo/ }).reply(200, { email:'jose@gmail.com' });
  await handleCallback(env, 'code', 'n1');
  const stored = await env.RADAR_KV.get('google:refresh'); expect(stored).not.toContain('REFRESH-SECRET'); expect(await decrypt(stored!, env.RADAR_KV_KEY)).toBe('REFRESH-SECRET');
  expect((await settings()).google_status).toBe('ok');
});
it('invalid_grant → expired + alert; createCalendarEvent refuses without confirmation and never touches primary', async () => {
  fetchMock.get('https://oauth2.googleapis.com').intercept({ path:'/token', method:'POST' }).reply(400, { error:'invalid_grant' });
  await expect(googleFetch(env, '/gmail/v1/users/me/messages')).rejects.toThrow(/google_expired/); expect((await settings()).google_status).toBe('expired');
  await expect(createCalendarEvent(env, { title:'Entrevista', at:'2026-09-25T10:00:00+02:00', durationMin:45 }, { source:'cron' } as any)).rejects.toThrow(/confirmation/);
});
it('no request in the whole suite hits a Gmail /send URL', () => { expect(fetchMock.__seen.some((u: string) => /gmail.*\/send/.test(u))).toBe(false); });
```
- [ ] 2. → FAIL. 3. Implementar (scopes `openid email gmail.readonly gmail.compose calendar.events`; `access_type=offline&prompt=consent`). 4. → PASS. 5. Commit: `git commit -m "feat(api): Google OAuth (test mode) with AES-GCM refresh token in KV, googleFetch and Radar calendar creation"`.

### Tarea 7.21 — Gateway Radar: materiales por IA (regenerar), verificación y PDF (Browser Rendering + respaldo)

**Agente:** implementador-web · **Rama:** `feat/radar-api` · **Gate:** no · **Depende de:** 7.17, 0.4

**Ficheros:** `src/modules/radar/materials.routes.ts` (`POST /applications/:id/prepare` con `kinds`, `instruction`, `locale` → vN+1 `ai` o 202 `queued`; `POST /materials/:id/pdf`), `pdf.service.ts` (Markdown → HTML con `cv.css` (compartida con la web en `packages/radar-core/content/cv.css`) → `@cloudflare/puppeteer` sobre `env.BROWSER` → `storage.upload('radar-materials/<app>/cv-v<N>.pdf')` → fila `pdf` → URL firmada 1 h; sin binding o error → 503 `browser_rendering_unavailable`), tests `materials.routes.test.ts`, `pdf.service.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan: regenerar con `instruction:'más corta'` crea `cover_letter` v2 `generated_by='ai'` con `instruction` guardada y no borra v1; `locale:'en'` sin `cv.master.en.md` → 400 `radar_missing_profile{locale:'en'}`; estado terminal → 409; PDF con `BROWSER` simulado → fila `pdf` misma versión y `storage.upload` a la ruta esperada; sin `BROWSER` → 503 con `browser_rendering_unavailable`. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(api): radar material regeneration with fact verification and PDF via Browser Rendering with fallback"`.

### Tarea 7.22 — Gateway Radar: correo (`MailSource`, sondeo, vinculación, cola por revisar, borrador de seguimiento, fixtures anonimizadas)

**Agente:** implementador-web · **Rama:** `feat/radar-mail-calendar` · **Gate:** no · **Depende de:** 7.20, 7.5, 7.8 (`parseEmail` de `linkedin-email`/`malt-email`) · **Insumo:** ≥ 12 correos reales de Jose (sin ellos, 4 fixtures sintéticas y la puerta de la rama queda pendiente)

**Ficheros:** `src/modules/radar/mail/{mail-source.ts (interfaz DT §11.8), gmail-source.ts, fixture-source.ts, proton-ingest.ts}`, `mail.service.ts` (`pollMail(env, ctx)`: `q` de `buildGmailQuery`, ≤ 3 páginas × 50, `format=metadata` (+ `full` solo para remitentes de alertas → `parseEmail` → ingesta → cuerpo descartado), `radar_emails` idempotente por `(account, message_id)`, `linkByRules` → IA → transición hacia delante o cola de revisión → Telegram `radar.email_linked` / "¿Qué es?"; tres `unrelated` del mismo dominio → propuesta de ignorar), `emails.routes.ts` (`POST /emails/poll`, `POST /emails/ingest` (token de ingesta, Proton), `POST /emails/fetch`, `POST /emails/:id/link`, `POST /emails/:id/unrelated`, `POST /applications/:id/followup-draft`), `packages/radar-core/scripts/anonymize-email.ts` (`.eml`/export → `test/fixtures/emails/*.json` con marcadores estables; `.eml` en `.gitignore`), fixtures, tests `mail.service.test.ts`, `emails.routes.test.ts`, `anonymize-email.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/modules/radar/mail.service.test.ts (extracto; RADAR_MAIL_SOURCE=fixtures)
import { SELF, env, fetchMock } from 'cloudflare:test';
import { it, expect } from 'vitest';
it('12 fixtures → 8 linked by rule, 3 to AI (one interview 0.92 → state + proposed event; one 0.55 → review), 1 unrelated; second poll → 0 new', async () => {
  env.AI.__queue = [{ application_id:'a-sent', kind:'interview', confidence:0.92, event:{ kind:'interview', at:'2026-09-25T10:00:00+02:00', durationMin:45, url:'https://meet.google.com/x' } }, { application_id:'a-sent-2', kind:'contacted', confidence:0.55 }, { application_id:null, kind:'unrelated', confidence:0.95 }];
  const r1 = (await (await SELF.fetch('http://x/api/v1/radar/emails/poll', { method:'POST', headers:{ authorization:`Bearer ${adminJwt}` } })).json()).data;
  expect(r1).toEqual({ fetched:12, linked:9, review:1, unrelated:2 });
  expect((await appRow('a-sent')).status).toBe('interview');
  expect((await eventsOf('a-sent')).some(e => e.kind === 'interview' && e.proposed === true && e.google_event_id === null)).toBe(true);
  expect(fetchMock.__seen.some((u: string) => /calendar\/v3\/events/.test(u))).toBe(false);
  const r2 = (await (await SELF.fetch('http://x/api/v1/radar/emails/poll', { method:'POST', headers:{ authorization:`Bearer ${adminJwt}` } })).json()).data; expect(r2.fetched).toBe(0);
});
it('linkedin alert with 5 cards ingests 5 offers and stores no body anywhere', async () => {
  await SELF.fetch('http://x/api/v1/radar/emails/poll', { method:'POST', headers:{ authorization:`Bearer ${adminJwt}` } });
  expect((await offersOf('linkedin-email')).length).toBeGreaterThanOrEqual(5);
  const dump = JSON.stringify(await allRadarRows()); expect(dump).not.toContain('BODY-MARKER-FROM-FIXTURE');
});
it('the 3 unrelated fixtures (newsletter, invoice, personal) never link to an application', async () => { /* privacidad */ });
it('followup-draft creates a Gmail draft (never send) with the voice and an event', async () => {
  fetchMock.get('https://gmail.googleapis.com').intercept({ path:/drafts$/, method:'POST' }).reply(200, { id:'d1', message:{ threadId:'t1' } });
  const r = (await (await SELF.fetch('http://x/api/v1/radar/applications/a-sent-2/followup-draft', { method:'POST', headers:{ authorization:`Bearer ${adminJwt}` } })).json()).data;
  expect(r.draftId).toBe('d1'); expect(r.draftUrl).toMatch(/mail\.google\.com/);
  expect(fetchMock.__seen.some((u: string) => /\/send/.test(u))).toBe(false);
});
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(api): radar mail polling with filtered Gmail queries, rule+AI linking, review queue, Proton ingest endpoint and follow-up drafts"`.

**Hecho cuando:** tests en verde con fixtures **reales anonimizadas** (los 3 ajenos acaban `unrelated`); el assert global "ninguna URL `/send`" pasa en toda la suite del gateway.

### Tarea 7.23 — Gateway Radar: cron diario y de correo/calendario, rutas de eventos y lectura horaria del calendario

**Agente:** implementador-web · **Rama:** `feat/radar-mail-calendar` · **Gate:** no · **Depende de:** 7.20, 7.22, 7.19

**Ficheros:** `src/modules/radar/daily.service.ts` (bloques 1–8 de DT §11.3 `0 6/0 7` con comprobación de 08:00 Europe/Madrid), `calendar.service.ts` (`proposeEvent`, `confirmEvent` → `createCalendarEvent`, `discardEvent`, `proposeChange`, `syncFromGoogle(updatedMin)`), `events.routes.ts` (`POST /events/propose`, `POST /events/:id/confirm`, `POST /events/:id/discard`, `POST /events/:id/propose-change`), `scheduled.ts` (bloques `*/30` y diarios), tests `daily.service.test.ts`, `events.routes.test.ts`, `calendar.service.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan: (a) a las 07:00 UTC en verano (08:00 Madrid) el cron actúa y a las 06:00 UTC es no-op; en invierno al revés; (b) plazo a 20 h → `radar.deadline` + `reminder_sent` una sola vez; (c) `sent` con 8 días sin actividad → borrador + `followup_draft` + `radar.followup_due`; (d) silencio 46 días → `rejected` por `rule`, reversible; (e) `google_authorized_at + 6 d` → recordatorio; (f) `POST /events/:id/confirm` llama a `events.insert` **una vez** con `calendarId` = `google_calendar_id` (nunca `primary`) y guarda `google_event_id`; `discard` no llama a Google; `propose-change` + `confirm` hace `events.patch`; (g) `syncFromGoogle` refleja hora movida y cancelación sin borrar. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(api): radar daily reminders, follow-ups, silence rule, calendar proposals/confirmations and hourly Google sync"`.

### Tarea 7.24 — Gateway Radar: `run`, `test`, `reactivate` de plataformas y disparo de n8n para Omen

**Agente:** implementador-web · **Rama:** `feat/radar-api` · **Gate:** no · **Depende de:** 7.16, 7.11

**Ficheros:** `platforms.routes.ts` (`POST /platforms/:code/run`: gateway → `discover` inline ≤ 25 s o encola; omen → `POST N8N_RADAR_WEBHOOK_URL` `{ platform, runKey }` con `x-josecoded-webhook-secret` + `run_requested_at`; mac → 409 `runs_from_mac`; `POST /platforms/:code/test` → ≤ 3 ofertas sin ingesta; `POST /platforms/:code/reactivate { sessionChecked:true }`), `sweep.service.ts` (ampliar: plataformas de Omen vencidas → webhook; 30 min sin ingesta → `waiting_runtime` + alerta R5), tests.

**Pasos:** 1. Tests: `run` de `tecnoempleo` con `fetchMock` del feed → `radar_runs` nueva y `started:true`; `run` de `workana` → webhook n8n llamado con el secreto y `run_requested_at` fijado; n8n 5xx → 502 y `status='waiting_runtime'`; `run` de `indeed` → 409; `test` devuelve ≤ 3 y no crea filas; `reactivate` sin `sessionChecked` → 400. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(api): radar platform run/test/reactivate and n8n dispatch for Omen connectors"`.

**Cierre de `feat/radar-api`:** `revisor`; `/puerta-calidad` (sin UI; `revisor-seguridad` con foco en modos de auth, webhook, HMAC, KV cifrado, `service_role`, ausencia de `/send`); merge. **Cierre de `feat/radar-mail-calendar`** igual, tras 7.23.

### Tarea 7.25 — Web Radar: shell (`RadarSubnav`, `RadarPauseSwitch`, `RadarAlerts`) y bandeja `/admin/radar`

**Agente:** implementador-web · **Rama:** `feat/radar-admin` · **Gate:** no · **Depende de:** 6.1, 7.18, 7.19 · **Insumo:** `ui` §13.16 (piezas de bandeja), UX §7.12, §7.18, §9.14, §10.8

**Ficheros:** `app/[locale]/(private)/admin/radar/layout.tsx` (`RadarSubnav` con contador; `RadarPauseSwitch`; `RadarAlerts`), `.../radar/page.tsx` (RSC: `searchParams` → filtros; `StatusCounters`; `RadarRow`/`RadarCard`; `?correos=revisar` → hoja), `.../radar/actions.ts` (`confirmApplication`, `markSent`, `snoozeApplication`, `discardApplication`, `reopenApplication`, `setRadarPause`, `linkEmail`, `markEmailUnrelated` → `adminFetch` a `/radar/*` o SB `radar_settings`), `components/radar/{radar-subnav,radar-pause-switch,pause-modal,radar-alerts,status-counters,score-badge,deadline-tag,mail-tag,radar-row,radar-card,confirm-send-modal,snooze-sheet,discard-sheet,review-emails-sheet}.tsx`, `lib/radar/filters.ts` (`parseFilters(searchParams)` ↔ URL), `lib/radar/derive.ts` (`subState(app, events)`: "Confirmada · por marcar enviada"; `deadlineLabel(at, now)`), tests `filters.test.ts`, `derive.test.ts`, `confirm-send-modal.test.tsx`, `deadline-tag.test.tsx`.
- Modificar: `app/[locale]/(private)/admin/page.tsx` ("Radar hoy": preparadas, pendientes de ti, plazos < 24 h, conectores con error).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/radar/derive.test.ts
import { it, expect } from 'vitest';
import { subState, deadlineLabel } from './derive';
it('derives "confirmed, mark sent pending" when confirmed_by_jose follows the last status_change', () => {
  const events = [{ kind:'status_change', createdAt:'2026-09-20T08:00:00Z' }, { kind:'confirmed_by_jose', createdAt:'2026-09-20T09:00:00Z' }];
  expect(subState({ status:'prepared' } as any, events as any)).toBe('confirmed_pending_mark');
  expect(subState({ status:'prepared' } as any, events.reverse() as any)).toBe(null);
});
it.each([['2026-09-22T10:00:00Z','Vence en 2 d','amber'], ['2026-09-20T18:00:00Z','Vence en 8 h','red'], ['2026-09-19T10:00:00Z','Caducada','red'], [null,'Sin plazo','none']])('%s → %s/%s', (at, label, tone) => expect(deadlineLabel(at, new Date('2026-09-20T10:00:00Z'), 'es')).toEqual({ label, tone }));
```
```tsx
// apps/web/components/radar/confirm-send-modal.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { ConfirmSendModal } from './confirm-send-modal';
it('assisted: says the offer will open; connector: lists material and blocks with empty required fields', () => {
  render(<ConfirmSendModal open mode="assisted" offerUrl="https://x" materials={[]} blockers={[]} onConfirm={() => {}} onClose={() => {}} />);
  expect(screen.getByText(/se abrirá la oferta/i)).toBeTruthy();
  render(<ConfirmSendModal open mode="connector" offerUrl="https://x" materials={[{ kind:'cv', version:2 }, { kind:'cover_letter', version:1 }]} blockers={[{ type:'form_incomplete', fields:['Salario deseado'] }]} onConfirm={() => {}} onClose={() => {}} />);
  expect(screen.getByText(/CV v2/)).toBeTruthy(); expect(screen.getByRole('button', { name: /Confirmar/ }).hasAttribute('disabled')).toBe(true); expect(screen.getByText(/Salario deseado/)).toBeTruthy();
});
```
- [ ] 2. → FAIL. 3. Implementar (acciones ≥ 44 px en móvil; deshacer descarte en toast 10 s; `?correos=revisar` con `e1–e4`). 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): radar shell, pause switch, alerts and inbox with URL filters and quick actions"`.

### Tarea 7.26 — Web Radar: detalle `/admin/radar/[id]` (puntuación, `MaterialEditor`, decisión, calendario, correos, historial, `cv/print`)

**Agente:** implementador-web · **Rama:** `feat/radar-admin` · **Gate:** no · **Depende de:** 7.25, 7.21, 7.23 · **Insumo:** `ui` §13.17, UX §7.13, v3.2 (control de plantilla, "Editar en el portátil")

**Ficheros:** `.../radar/[id]/page.tsx`, `.../radar/[id]/actions.ts` (`saveMaterial` → SB insert vN+1 `jose` `approved=true`; `regenerateMaterial`, `requestPdf`, `createFollowupDraft`, `proposeEvent`, `confirmEvent`, `discardEvent`, `revertEvent`, `setStatus`, `addNote`, `remindLaterOnLaptop`), `.../radar/[id]/cv/print/page.tsx` (`cv.css` + `window.print()`; `?v=N`), `components/radar/{score-reasons,material-editor,material-preview,version-picker,template-check,form-payload-table,decision-card,event-proposal-card,email-list,link-email-sheet,event-timeline,notes}.tsx`, `lib/radar/template-check.ts` (`countConcreteReferences(text, offer)`: ≥ 2 referencias concretas (empresa, tecnología de la oferta, título) resaltadas), `lib/radar/template-check.test.ts`, `material-editor.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/radar/template-check.test.ts
import { it, expect } from 'vitest';
import { countConcreteReferences } from './template-check';
const offer = { company:'Acme', title:'React Native developer', requirements:['Expo','Supabase'] };
it('counts distinct concrete references and returns their ranges', () => {
  const r = countConcreteReferences('En Acme buscáis alguien con Expo; he publicado apps con Expo y Supabase.', offer);
  expect(r.count).toBe(3); expect(r.ranges.map(x => x.text)).toEqual(['Acme', 'Expo', 'Supabase']);
});
it('generic letter → 0', () => expect(countConcreteReferences('Me interesa mucho el puesto y creo encajar.', offer).count).toBe(0));
```
```tsx
// apps/web/components/radar/material-editor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { MaterialEditor } from './material-editor';
it('shows tabs, versions, unverified facts and saves a new version', async () => {
  const save = vi.fn().mockResolvedValue({ ok:true, version:2 });
  render(<MaterialEditor kind="cover_letter" versions={[{ version:1, content:'Hola Acme', generatedBy:'ai', unverifiedFacts:['Kotlin'] }]} offer={{ company:'Acme', title:'RN', requirements:[] }} onSave={save} onRegenerate={vi.fn()} />);
  expect(screen.getByRole('tab', { name: /Carta/ })).toBeTruthy(); expect(screen.getByText(/Kotlin/)).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hola Acme, con Expo' } }); fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ kind:'cover_letter', content:'Hola Acme, con Expo' }));
});
```
- [ ] 2. → FAIL. 3. Implementar (barra de decisión fija inferior en móvil; `EventTimeline` con "No era esto" solo en transiciones de `email`/`rule`; `EmailList` solo asunto y extracto; `LinkEmailSheet` con búsqueda por remitente/asunto y pegado de enlace de Gmail). 4. → PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): radar application detail with material editor, template check, decision, calendar, emails and reversible history"`.

### Tarea 7.27 — Web Radar: plataformas `/admin/radar/plataformas`

**Agente:** implementador-web · **Rama:** `feat/radar-admin` · **Gate:** no · **Depende de:** 7.24, 7.20 · **Insumo:** UX §7.14, §9.13

**Ficheros:** `.../radar/plataformas/page.tsx` (`?nueva=1`, `?plataforma=[code]`, `?google=ok|error`), `.../plataformas/actions.ts` (`savePlatform` → SB; `runPlatform`, `testPlatform`, `reactivatePlatform`, `authorizeGoogle` (→ `POST /radar/google/authorize` → `redirect(url)`), `ensureRadarCalendar`), `components/radar/{connector-card,connector-sheet,secret-ref,google-status-card}.tsx`, `lib/radar/limits.ts` (`clampLimits(code, limits)` con los máximos de LinkedIn no superables), `lib/radar/limits.test.ts`, `connector-sheet.test.tsx`.

**Pasos:** 1. Tests: `clampLimits('linkedin', { runsPerDay:3, maxOffers:100 })` → `{ runsPerDay:1, maxOffers:30 }`; `ConnectorSheet` muestra `SecretRef` con nombre, dónde vive y "configurado/falta" **sin** campo de valor; "Ejecutar ahora" en plataforma `mac` deshabilitado con explicación. 2. FAIL. 3. Implementar (toast de `?google=ok`). 4. PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): radar platforms page with connector health, sheet, secret references and Google reauthorization"`.

### Tarea 7.28 — Web Radar: perfil `/admin/radar/perfil`

**Agente:** implementador-web · **Rama:** `feat/radar-admin` · **Gate:** no · **Depende de:** 7.25, 7.1

**Ficheros:** `.../radar/perfil/page.tsx` (lee `@josecoded/radar-core` `loadProfile()` y `loadCvMaster()` en solo lectura; `radar_settings` editable: umbral 40–90, `quick_exclusions`, `availability_from`, `email_ignored_domains`), `.../perfil/actions.ts` (`updateRadarSettings`, `rescoreAll` → `POST /radar/offers/:id/score { force:true }` en lote), `components/radar/{profile-view,quick-settings,cv-master-view}.tsx`, `quick-settings.test.tsx`.

**Pasos:** 1. Test: `QuickSettings` valida umbral fuera de 40–90 y muestra el `profile_version` vigente y "N ofertas con perfil anterior". 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(web): radar profile page (read-only facts + quick settings)"`.

### Tarea 7.29 — Web Radar: calendario `/admin/radar/calendario`

**Agente:** implementador-web · **Rama:** `feat/radar-admin` · **Gate:** no · **Depende de:** 7.23, 7.25 · **Insumo:** `ui` §13.18 (Agenda + rejilla simple propia; sin librería pesada)

**Ficheros:** `.../radar/calendario/page.tsx` (`?vista=mes|semana|agenda`, Agenda por defecto en móvil), `components/radar/{radar-calendar,calendar-month,calendar-week,calendar-agenda,event-item}.tsx`, `lib/radar/calendar.ts` (`groupEventsByDay(events, range)`), `lib/radar/calendar.test.ts`.

**Pasos:** 1. Test: `groupEventsByDay` agrupa entrevistas, llamadas, plazos, seguimientos (`next_action_at`) y propuestos (marcados) por día en `Europe/Madrid`. 2. FAIL. 3. Implementar (propuestos con borde discontinuo + "Propuesto"; crear = confirmar). 4. PASS; `web-design-guidelines`. 5. Commit: `git commit -m "feat(web): radar calendar (month, week, agenda) with proposed events"`.

### Tarea 7.30 — E2E de Radar, RLS ampliada y validación de calidad de candidaturas

**Agente:** implementador-web (E2E) + `usuario-ejemplo` (reclutadora) · **Rama:** `feat/radar-admin` · **Gate:** no · **Depende de:** 7.25–7.29

**Ficheros:** `apps/web/e2e/radar.spec.ts` (las 5 filas de Radar de DT §8.2: confirmar desde admin asistida + marcar enviada + `mark-sent` directo → 409; confirmar desde Telegram con webhook simulado → recibo `4F7Q` + historial + reenvío idempotente + `from.id` ajeno; correo vinculado → evento propuesto → crear en Google simulado → "No era esto"; bandeja con filtros desde URL; plataformas: alta con `SecretRef` y `Probar` con fixture; perfil: umbral → toast; pausa/reanudar), `apps/web/tests/rls-radar.test.ts` (ya en 7.6; añadir `storage.objects` con Ana), `docs/superpowers/design/2026-09-xx-radar-candidaturas-validacion.md` (informe de `usuario-ejemplo` como reclutadora sobre 5 candidaturas generadas con el CV maestro real: veredicto por candidatura, hechos inventados = 0).

**Pasos:** 1. Escribir los E2E (fallan hasta ajustar). 2. `pnpm --filter web e2e -- radar` → PASS. 3. `usuario-ejemplo` (reclutadora) evalúa 5 candidaturas: si alguna tiene hechos inventados o carta genérica (< 2 referencias), se corrigen prompts/verificador (7.17/7.21) y se repite. 4. Commit: `git commit -m "test(web): radar e2e (admin, telegram, mail, calendar, platforms, pause) and recruiter validation report"`.

**Cierre de `feat/radar-admin`:** `revisor`; `/puerta-calidad` completa (`usuario-ejemplo` como Jose operador en §7.12–7.18 y §9.10–9.14, incluida la segunda pasada de §7.17/§9.11 que pide UX v3.2; `revisor-accesibilidad` en tabla, barra de decisión móvil, editor, calendario; `revisor-seguridad` en SA con `requireAdmin`, `SecretRef` sin valores); merge.

### Tarea 7.31 — **GATE**: Radar en producción (secretos, KV, crons, Telegram, Google, Mac)

**Agente:** controlador con OK de Jose (y Jose en consolas) · **Gate:** **SÍ** · **Depende de:** ramas de Radar mergeadas, 8.2–8.3 para Omen

**Pasos (cada uno con OK explícito):**
- [ ] 1. Jose: proyecto Google Cloud "josecoded-radar" (consentimiento External en prueba, su Gmail como usuario de prueba, cliente OAuth Web con redirect `https://api.josecoded.com/api/v1/radar/google/callback`); alta de aplicación InfoJobs si procede; alertas de LinkedIn al Gmail.
- [ ] 2. `wrangler kv namespace create RADAR_KV`; `wrangler secret put` en `josecoded-api`: `RADAR_INGEST_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `RADAR_CALLBACK_HMAC_KEY`, `RADAR_KV_KEY` (32 bytes base64), `GOOGLE_OAUTH_CLIENT_SECRET`, `INFOJOBS_CLIENT_SECRET` (si hay), `N8N_RADAR_WEBHOOK_SECRET`; vars `GOOGLE_OAUTH_CLIENT_ID`, `INFOJOBS_CLIENT_ID`, `N8N_RADAR_WEBHOOK_URL`, `RADAR_BATCH_*`, `RADAR_THRESHOLD_DEFAULT`.
- [ ] 3. Deploy del gateway (`deploy-production.yml` con `api`) → los crons quedan activos.
- [ ] 4. `setWebhook` del bot con `secret_token` y `allowed_updates:['callback_query']`.
- [ ] 5. Jose autoriza Google desde `/admin/radar/plataformas` y crea el calendario "Radar" (botón).
- [ ] 6. Mac: `~/.config/josecoded/radar.env` (`chmod 600`) y `automation/install-launchd.sh` con el plist de `radar-indeed` (si 0.5 fue éxito).
- [ ] 7. Insertar/activar filas de `radar_platforms` (`tecnoempleo`, `linkedin-email`, `indeed`; `infojobs`/`upwork` si hay credenciales; `linkedin` **apagado**).
- [ ] 8. Prueba real: una pasada de `tecnoempleo` desde admin ("Ejecutar ahora") → ofertas → puntuación → una candidatura preparada → Telegram con botones → confirmar asistida → marcar enviada. `ESTADO.md` + ADR.

**Hecho cuando:** el flujo real completo se ha ejecutado una vez con datos de producción y `0 envíos sin confirmación` (consulta SQL de DT §11.10).

---
## Fase 8 — Infra en Omen · Estimación S · rama `infra/omen` · agente `implementador-infra`

Regla inquebrantable: servicios preexistentes de Omen (worker, n8n, Ollama, Samba, túnel `josecoded-worker`) intocables; todo son contenedores, túneles y workflows **nuevos**. Cada tarea pide OK a Jose antes de tocar Omen y antes de exponer cualquier hostname. Los ficheros de referencia se versionan en `infra/` del repo; los `.env` viven en `/srv/josecoded-data/<servicio>/` fuera del repo.

### Tarea 8.1 — Umami en Omen + túnel `josecoded-umami` → `stats.josecoded.com`

**Agente:** implementador-infra · **Gate:** **SÍ** (exponer `stats.josecoded.com`) · **Depende de:** 1.x (nada del código; puede hacerse en cualquier momento)

**Ficheros:** `infra/omen/umami/{compose.yml,.env.example,README.md}` (imagen `ghcr.io/umami-software/umami:postgresql-latest`, Postgres 16 propio, puerto local 3001, volúmenes en `/srv/josecoded-data/umami/`), `infra/omen/umami/tunnel.yml` (túnel nuevo `josecoded-umami`, ingress `stats.josecoded.com → http://localhost:3001`).

**Pasos:**
- [ ] 1. Test previo (script `infra/omen/umami/check.sh`): `docker ps --format '{{.Names}}'` no contiene `umami`; `cloudflared tunnel list` no contiene `josecoded-umami`; el puerto 3001 está libre. → registra el estado inicial.
- [ ] 2. **Pedir OK a Jose** (crear contenedores + túnel + DNS `stats`).
- [ ] 3. `docker compose up -d` en `/srv/josecoded-data/umami/`; `curl -s localhost:3001/api/heartbeat` → `ok`; crear el sitio `josecoded.com` en Umami y anotar `website id` (→ `NEXT_PUBLIC_UMAMI_WEBSITE_ID`); cambiar la contraseña por defecto.
- [ ] 4. `cloudflared tunnel create josecoded-umami` + `route dns` + servicio systemd **nuevo** (`cloudflared-umami.service`); `curl -sI https://stats.josecoded.com/script.js` → 200.
- [ ] 5. `check.sh` de nuevo: `josecoded-worker` túnel y worker siguen `active`; `docker ps` muestra los contenedores previos intactos.
- [ ] 6. Commit: `git commit -m "infra(omen): umami compose and dedicated tunnel reference"`; `ESTADO.md`.

**Hecho cuando:** `https://stats.josecoded.com/script.js` responde y los servicios preexistentes no han cambiado (diff de `docker ps` y `systemctl list-units` antes/después).

### Tarea 8.2 — Contenedor `radar-runner` (Node 22 + Playwright Chromium) en la red de n8n

**Agente:** implementador-infra · **Gate:** **SÍ** · **Depende de:** 7.12 (runner y conectores publicados en el repo)

**Ficheros:** `infra/omen/radar-runner/{Dockerfile,compose.yml,.env.example,README.md}` (imagen desde `mcr.microsoft.com/playwright:v1.63.0-noble`, `pnpm --filter @josecoded/radar-connectors build`, `CMD radar-runner serve --port 4100`; **sin `ports:`**; `networks: [n8n_default]`; `.env`: `RADAR_API_URL`, `RADAR_INGEST_TOKEN`, `RADAR_RUNNER_TOKEN`), `infra/omen/radar-runner/check.sh`.

**Pasos:** 1. `check.sh`: no existe `radar-runner`; la red de n8n existe (`docker network ls`). 2. OK de Jose. 3. Build + `up -d`; desde el contenedor de n8n: `curl -s -H "Authorization: Bearer $RADAR_RUNNER_TOKEN" -X POST http://radar-runner:4100/run -d '{"platform":"workana","runKey":"…"}'` → 202; desde fuera de la red: puerto inaccesible. 4. `check.sh` final: preexistentes intactos. 5. Commit + `ESTADO.md`.

**Hecho cuando:** una pasada de Workana disparada a mano desde n8n llega a `POST /radar/ingest` del gateway (preview o producción según el momento) y la bandeja muestra "última pasada".

### Tarea 8.3 — Workflows n8n `radar-run` (+ `radar-notion` opcional) e ingress protegido con Cloudflare Access (P15)

**Agente:** implementador-infra · **Gate:** **SÍ** (nuevo ingress `n8n.josecoded.com` en túnel nuevo + política de Access) · **Depende de:** 8.2, 7.24

**Ficheros:** `infra/omen/n8n/radar-run.json` (webhook `POST /webhook/radar-run` con verificación de `x-josecoded-webhook-secret` (HMAC del cuerpo con `N8N_RADAR_WEBHOOK_SECRET`) → lee credencial `LINKEDIN_LI_AT` del credential store solo si `platform='linkedin'` → `HTTP Request` a `http://radar-runner:4100/run`), `infra/omen/n8n/radar-notion.json` (opcional, apagado), `infra/omen/n8n/tunnel-n8n.yml` (túnel nuevo `josecoded-n8n`, ingress `n8n.josecoded.com → http://localhost:5678` **solo para la ruta `/webhook/radar-*`**), `infra/omen/n8n/access-policy.md` (aplicación de Cloudflare Access con **service token** que solo posee el gateway: `CF-Access-Client-Id/Secret` como secrets `N8N_ACCESS_CLIENT_ID/SECRET` del gateway; añadir a `envSchema` y a la llamada de 7.24 — cambio aditivo de una línea en `apps/api`).

**Pasos:** 1. Verificar con Jose si `N8N_CHAT_WEBHOOK_URL` ya es alcanzable desde el gateway (P15); si sí, reutilizar esa vía y saltar el túnel nuevo. 2. OK de Jose. 3. Importar workflows (**añadir**, no editar los existentes), activar `radar-run`; crear Access app + service token; probar `curl` sin token → 403 de Access; con token y HMAC → 200 y pasada en el runner. 4. Comprobar que los workflows previos siguen activos (`n8n_list_workflows`). 5. Commit + `ESTADO.md`.

**Hecho cuando:** `POST /radar/platforms/workana/run` desde admin dispara la cadena gateway → Access → n8n → runner → ingest.

**Cierre de la fase 8:** `revisor-seguridad` sobre `infra/` y sobre la superficie expuesta (solo `stats.josecoded.com` y, si existe, `n8n.josecoded.com` tras Access); ningún puerto nuevo publicado en Omen.

---

## Fase 9 — Redirecciones desde josedev, analítica, puerta final y lanzamiento · Estimación M · rama `release/v1`

### Tarea 9.1 — Redirecciones 301/410 y CORS de transición

**Agente:** implementador-web · **Gate:** no · **Depende de:** 3.x, 4.2; insumo P7 (URL `workers.dev` del gateway de josedev)

**Ficheros:** `apps/web/next.config.ts` (`redirects`: `/services` → `/empresas` 301, `/en/services` → `/en/companies` 301, `/auth` → `/auth/login` 301; `/es/:path*` → `/:path*` 308 ya existe), `apps/web/app/[locale]/(public)/blog/[slug]/page.tsx` y `app/[locale]/foro/[[...rest]]/page.tsx` (410 para slugs antiguos de josedev listados en `content/legacy/blog-slugs.json` y para todo `/foro/*`: `new Response(null, { status: 410 })` vía route handler `app/gone/route.ts` + rewrite), `content/legacy/blog-slugs.json` (exportado de `blog_posts` con `select slug` — solo lectura), `e2e/seo.spec.ts`, `apps/api/wrangler.jsonc` (`CORS_ORIGINS` con el `workers.dev` antiguo durante la transición).

**Pasos:**
- [ ] 1. E2E que falla:
```ts
// apps/web/e2e/seo.spec.ts
import { test, expect } from '@playwright/test';
for (const [from, to] of [['/services', '/empresas'], ['/en/services', '/en/companies'], ['/auth', '/auth/login']]) test(`${from} → 301 ${to}`, async ({ request }) => { const r = await request.get(from, { maxRedirects: 0 }); expect(r.status()).toBe(301); expect(r.headers()['location']).toBe(to); });
for (const gone of ['/blog/slug-antiguo-de-josedev', '/foro/x/y']) test(`${gone} → 410`, async ({ request }) => expect((await request.get(gone)).status()).toBe(410));
test('sitemap has both locales and robots allows AI crawlers and blocks private paths', async ({ request }) => {
  const s = await (await request.get('/sitemap.xml')).text(); expect(s).toContain('/en/business'); expect(s).toContain('hreflang="x-default"');
  const r = await (await request.get('/robots.txt')).text(); expect(r).toMatch(/User-agent: GPTBot\s+Allow: \//); expect(r).toMatch(/Disallow: \/admin/);
});
```
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(web): legacy redirects (301) and gone responses (410) for josedev URLs"`.

### Tarea 9.2 — Analítica: scripts de Umami y Cloudflare Web Analytics, `client_error`, verificación de los 11 eventos

**Agente:** implementador-web · **Gate:** no · **Depende de:** 8.1 (`website id`), 2.12; Jose activa CF Web Analytics

**Ficheros:** `app/[locale]/layout.tsx` (`<Script src="https://stats.josecoded.com/script.js" data-website-id data-domains="josecoded.com" strategy="afterInteractive" />`; beacon de CF solo si `NEXT_PUBLIC_CF_BEACON_TOKEN`), `lib/analytics.ts` (`window.onerror` → `client_error { message, source }` sin PII), `e2e/analytics.spec.ts` (intercepta `POST **/api/send` y comprueba que en un recorrido completo se emiten `intro_played`, `path_open`, `scene_drag`, `whatsapp_click`, `contact_submit`, `proposal_generated`, `proposal_sent`, `chat_started`, `booking_open`, `referral_copy`; `call_booked` se comprueba en el test del RH de Cal.com con `@umami/node` mockeado).

**Pasos:** 1. E2E que falla. 2. Implementar. 3. PASS. 4. Commit: `git commit -m "feat(web): Umami and Cloudflare Web Analytics scripts with event verification"`.

### Tarea 9.3 — Primera medición de rendimiento y `perf.json`

**Agente:** implementador-web · **Gate:** no · **Depende de:** 2.9, `preview.yml`

**Ficheros:** `apps/web/scripts/perf.ts` (Lighthouse móvil ×3 contra una URL → mediana LCP/INP/CLS/score → `content/generated/perf.json` con `measuredAt`), `content/generated/perf.json` (primer valor medido contra la preview de `release/v1` y commiteado), `.github/workflows/content-refresh.yml` (añadir `perf.ts` contra producción tras el lanzamiento).

**Pasos:** 1. Test unit de `perf.ts` (mediana de 3 JSON de ejemplo). 2. Ejecutar contra la preview; commitear. 3. `ProofStrip` muestra "carga en menos de 1 s" solo si LCP < 1 s (test existente de 2.10). 4. Commit: `git commit -m "feat(web): performance measurement script and first perf.json"`.

### Tarea 9.4 — **GATE**: preparación del cutover

**Agente:** controlador con OK de Jose · **Gate:** **SÍ** · **Depende de:** todas las ramas mergeadas en `release/v1`

**Pasos (cada uno con OK):**
- [ ] 1. `pricing:sync-db` (escribe `pack_templates`/`pack_extras` por `code` en producción; imprime diff y pide confirmación).
- [ ] 2. Alta de `api.josecoded.com` como custom domain de `josecoded-api` (`wrangler.jsonc` `routes`) y `NEXT_PUBLIC_JOSECODED_API_URL=https://api.josecoded.com`; la URL `workers.dev` sigue respondiendo.
- [ ] 3. Rotar `WORKER_INTERNAL_TOKEN` (gateway + Omen), token del bot de Telegram (Edge Function + gateway) y key de Resend (Edge Function) en la misma sesión.
- [ ] 4. `API_MODE=production` en el gateway (deuda heredada `DEPLOY.md §4`): confirmar con Jose qué desactiva (`/api/dev/*`) y que `blog-ai.ts` local usa la vía directa a Omen.
- [ ] 5. Jose activa Cloudflare Web Analytics en la zona; Turnstile y Cal.com apuntan a `josecoded.com`.
- [ ] 6. Copia del ADR (`manage_adr get`) → `docs/adr-backup-<fecha>.md` (ignorado o commiteado, decisión del controlador) → `index_repository` del monorepo → restaurar/actualizar el ADR con las decisiones del Anexo del DT y de este plan.

### Tarea 9.5 — Puerta de calidad final sobre `release/v1`

**Agente:** `/puerta-calidad` (qa, revisor-seguridad, revisor-accesibilidad, usuario-ejemplo en paralelo) + `revisor` sobre la rama · **Gate:** no · **Depende de:** 9.1–9.4

**Pasos:**
- [ ] 1. `revisor` sobre `release/v1` completa.
- [ ] 2. `/puerta-calidad` contra la preview con datos de producción: `usuario-ejemplo` con Marta (home → negocios → generador/WhatsApp), Dani (home → proyectos → sobre mí → chat), Jose operador (bandeja de Radar en admin y Telegram) y reclutadora (5 candidaturas); `qa` con los E2E completos, 60 fps del hero y Android de gama media con `HERO_LIVE_MOBILE` según 2.13; `revisor-seguridad` con cabeceras, RLS, secretos, superficie de Omen; `revisor-accesibilidad` WCAG 2.2 AA.
- [ ] 3. Lighthouse móvil sobre la preview: ≥ 90/95/100 en `/`, `/negocios`, `/empresas`, `/proyectos`, `/blog/<slug>`, `/en`.
- [ ] 4. Baseline GEO: ejecutar el protocolo de spec §8 (10 preguntas a ChatGPT, Perplexity, Claude, Google AI Overviews) y guardar `docs/geo/baseline-<fecha>.md`.
- [ ] 5. Repetir hasta que los cuatro agentes dan PASA.

### Tarea 9.6 — **GATE**: lanzamiento y cierre

**Agente:** controlador con OK de Jose · **Gate:** **SÍ** · **Depende de:** 9.5

**Pasos:**
- [ ] 1. Merge `release/v1` → `main`; `deploy-production.yml` con `web` y `api` (`routes` de `josecoded.com` en `apps/web/wrangler.jsonc`; el Worker antiguo de josedev deja de recibir la ruta).
- [ ] 2. Smoke en producción: `/`, `/en`, `/negocios`, `/api/v1/health`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`; un lead de prueba (formulario) → Telegram; una ingesta de prueba de Radar (`tecnoempleo`) → bandeja; `stats.josecoded.com` recibe eventos.
- [ ] 3. Activar `content-refresh.yml` (cron) y `supabase-ping.yml`.
- [ ] 4. Actualizar `ESTADO.md` (Ahora: en producción; Pendientes: conectores sin credenciales, Proton diferido, LinkedIn scraping tras 2 semanas, Upwork), la nota del vault `Proyectos/josecoded.md`, el nodo del canvas y el ADR; `/cerebro update`; `/cierre` de la etapa v1.
- [ ] 5. Post-lanzamiento (primera semana): revisar Workers Logs del `sweep` (tiempo por tick), Telegram entregados/fallidos, `google_status`, y anotar en `ESTADO.md`.

**Hecho cuando:** producción responde con la nueva web, Jose ha recibido el Telegram de prueba y el flujo de Radar ha corrido una vez sobre datos reales.

---

## Anotaciones que deja este plan (para el controlador)

**Nota del vault (`Proyectos/josecoded.md`):** plan v1 escrito el 2026-09-19 con 97 tareas en 10 fases; Radar ≈ 40 % del esfuerzo y al final del camino crítico, con las ramas `feat/radar-core` y `feat/radar-connectors` arrancando tras la fase 1; decisiones a–j de UX §13.19 cerradas como en DT §11.11 (perfil solo lectura + ajustes rápidos, evento `snoozed`, `HERO_LIVE_MOBILE` medido, reautorización de Google desde admin con KV cifrado, `?correos=revisar`, PDF con Browser Rendering + impresión, botones Confirmar · Posponer · Descartar + "Ver y editar", segundo paso "¿Seguro?" de 10 min, pausa con fecha, control de plantilla ≥ 2 referencias); hero: alternativa B (spec v1.5.2); orden de conectores: linkedin-email → Indeed (Mac) → InfoJobs → Tecnoempleo → Workana (Omen) → LinkedIn scraping apagado → Malt-email → Upwork opcional; válvula de escape de §13.9 anotada y no decidida.

**`ESTADO.md`:** "Ahora": plan v1 listo, arrancan las tareas 0 (0.1–0.6 en paralelo). "Pendientes" nuevos: los insumos de la tabla "Insumos que faltan" con la tarea que bloquean; resultados de las tareas 0 en `docs/superpowers/specs/2026-09-19-tarea0-resultados.md`. "Siguiente paso": ejecutar la fase 0 con `implementador-web` y, si 0.1 pasa, la fase 1.

**ADR (codebase-memory, al indexar el monorepo tras la fase 1):** los del Anexo del DT más: "Plan v1: tareas 0 con fallback explícito (Vercel, bloom fuera, poster solo, asistido, impresión, Indeed manual, HTML de Tecnoempleo)" · "Migraciones en producción una a una con `apply_migration` por el controlador; baseline regenerado tras cada gate" · "Ramas de Radar por subsistema; mínimo operativo = 7.1–7.8 + 7.16–7.19 + 7.25 (válvula de escape)" · "Tests del gateway en workerd contra `supabase start`; `AI` falso con cola; `fetchMock` estricto con assert global de ausencia de `/send`".

## Auto-revisión del plan

- **Cobertura de la spec:** §4 público (1–12) → fases 2–4 y 9.1; privado (13–15) → fases 5–7; transversal (Umami, Telegram, reduced-motion, AA) → 2.12/9.2, 3.8/7.19, 2.7–2.8, puertas; infra de Radar → fase 8; §8 SEO/GEO → 2.11, 3.x (JSON-LD por página), 4.2 (RSS, `BlogPosting`), 9.1, 9.5 (baseline GEO); §10 criterios de aceptación → cada uno tiene un test nombrado (hero 2.9/2.14; generador 3.9; chat 4.4/6.6; blog 4.2–4.3; portal 5.1; ampliación 5.4; afiliados 3.11/5.5/6.2; admin 6.1; Radar 7.6/7.18/7.19/7.22/7.23/7.30; SEO 9.1; Umami 9.2; comandos y Lighthouse 2.9/9.5); §13 Radar completo (§13.2 pasos 1–8 → 7.16, 7.17, 7.18, 7.19, 7.22, 7.23; §13.5 conectores → 7.8–7.15; §13.6 integraciones → 7.19–7.23; §13.9 orden y válvula). DT §1.6 hero → 2.5–2.9, 2.13–2.14. UX §2 mapa de sitio: todas las rutas tienen tarea (legales 3.6, perfil 4.1, `/chat` 4.4, área 5.x, admin 6.x, Radar 7.25–7.29). **Hueco conocido:** la migración opcional de realtime `20260917100800` se decide en 6.6 y se aplica en 7.7.
- **Placeholders:** ningún "TBD"/"TODO"; donde el contenido completo ya existe en el DT (SQL de §6.2 y §11.1, endpoints de §3 y §11.2, interfaces de §1.6.2, §11.4 y §11.8) el plan lo referencia como "copiar literalmente" con la sección exacta.
- **Consistencia de nombres:** `requireUser`/`requireAdmin` (4.1) usados en 5.x, 6.x, 7.25+; `adminFetch` (6.1) en 7.25–7.29; `track` y `EventMap` (2.12) en 2.10, 3.3, 3.9, 3.10, 5.5, 9.2; `priceForProposal`/`computeUpgrade`/`computeAffiliateReward` (1.4) en 3.7, 5.4, 6.2; `createGlyphScene`/`paramsHash` (2.5b) en 2.6, 2.8; `planFall`/`runIntro` (2.7) en 2.8; `decideHeroMode` (2.8) en 2.13–2.14; `transition`/`hasConfirmation`/`revert` (7.2) en 7.18–7.19; `applyRules`/`fingerprint`/`findDuplicate`/`nextRun` (7.3) en 7.16–7.17; `encodeCallback`/`verifyCallback` (7.4) en 7.19; `assembleCv`/`verifyFacts`/`buildGmailQuery`/`linkByRules` (7.5) en 7.17, 7.21, 7.22; `connectors`/`RadarConnector`/`OfferDraft` (7.8) en 7.9–7.16, 7.24; `ingestRun`/`radarAuth` (7.16) en 7.17–7.24; `googleFetch`/`createCalendarEvent` (7.20) en 7.22–7.23.
