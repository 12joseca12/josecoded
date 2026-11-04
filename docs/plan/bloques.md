# Bloques — scaffold y zona pública

**2026-11-02 · `arquitecto`.** Primer tablón del proyecto (decisión 10.5: una issue por bloque, enlazada a su PR). Cubre el scaffold de este repo y la zona pública completa (decisión 10.6, primer tramo). Las zonas siguientes van al final solo como grupos.

**2026-11-04.** Los bloques `data/*` de esta lista (W33, W37) y los de chat (W39, W39b) quedan sustituidos por el plan de migraciones `docs/plan/migraciones-chat.md` (M01–M11: `data/base`, `data/leads`, `data/crm-core`, `data/lead-claim`, `data/jobs`, `data/conversations`, `data/visitor-chat`, `data/private-rooms`, `data/chat-attachments`, W35, `data/client-rooms`). Por 10.7, `data/*` corre en el Supabase local del Mac y se aplica a `josecoded` solo con OK de Jose por migración; no hace falta `josecoded-dev` hasta el disparador. Nuevos bloques de pantalla: `admin/leads-inbox` (D8), `crm/leads-inbox` (K8) y `fix/contact-emails` (2.23).

## Reglas de los bloques

- Un bloque cierra algo visible: primero la pantalla con fixtures, después la lógica que la alimenta. Nunca lógica sin pantalla donde verla.
- ≤ ~400 líneas de diff y ≤ 1 h de agente (10.2). Si al empezar no cabe, se parte antes, no después.
- Rama `<area>/<tema>` (10.1); el scope del commit es el área. PR por bloque, squash en `main`.
- Por bloque: `implementador-web` implementa con TDD en lo que tiene comportamiento, `revisor` revisa, Jose aprueba en la preview. `/puerta-calidad` una vez por pantalla antes del merge (10.3).
- Criterio de hecho común a todo lo que tiene interfaz, además de los checks propios de cada bloque: responsive a 360, 768 y 1440; estados carga, vacío y error donde aplique; axe sin violaciones; contraste AA; textos solo en `messages/es.json`; CSS solo con `var(--token)`.
- URL local: `http://localhost:3000`, con segmento de idioma (`/es/...`). El catálogo `/dev/ui` no existe en producción.
- `data/*` se desarrolla en Supabase local (Docker, en el Mac) y se aplica al proyecto `josecoded` solo con OK de Jose por migración (10.7, 2026-11-04); `josecoded-dev` se crea cuando se cumpla el disparador de 10.7 y desde entonces `josecoded` es producción (W46).
- Lo que requiere datos de Jose (textos, enlaces, claves) entra como `{{DATO}}` y el bloque se da por hecho igualmente; `i18n:check` lista lo que falta.

Tamaños: **S** ≤ 30 min · **M** ≤ 1 h.

---

## Lista W — repo `josecoded` (web)

### Scaffold

#### W01 · `infra/scaffold` · Next 16 en pie
- **Verá:** `localhost:3000` con «josecoded» en pantalla y nada más.
- **Qué:** Next 16 App Router, TypeScript estricto, pnpm, `src/`, `.nvmrc`, `.gitignore` nuevo (el actual arrastra rutas del monorepo), `README.md` con mapa y arranque.
- **Depende:** — · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** `pnpm dev` arranca · `pnpm build` pasa · README describe los comandos y la estructura.

#### W02 · `infra/lint` · Lint que vigila las reglas
- **Verá:** nada visual; `pnpm lint` falla con un comentario de prueba y pasa sin él.
- **Qué:** eslint (sin comentarios, sin `eslint-disable` ni `@ts-expect-error`, orden de imports), stylelint (solo `var(--token)` en CSS Modules; `px` solo en hairlines, sombras y offsets), prettier, scripts `lint` y `typecheck`.
- **Depende:** W01 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** un comentario, un color literal y un `rem` → `px` de prueba hacen fallar el lint · `pnpm typecheck` pasa · documentado en README.

#### W03 · `infra/tokens` · Tokens del estilo B
- **Verá:** `localhost:3000/dev/ui/tokens` con muestras de color, tipografía, radios, sombras y duraciones.
- **Qué:** `src/styles/tokens.css` con el `:root` de `prototipos/estilo-b/css/base.css` (colores, líneas, cristal, radios, easings, duraciones, sombras), reset global, Inter Tight con `next/font` desde el repo, `src/types/tokens.ts` generado desde el CSS con test de deriva.
- **Depende:** W02 · **Tamaño:** S · **Decide Jose:** servir la fuente desde el repo en vez de Google Fonts (recomendado: privacidad y LCP).
- **Hecho cuando:** los valores coinciden 1:1 con el prototipo · el test de deriva falla si se añade un token sin regenerar · contraste de `--ink` sobre `--bg` y `--on-dark` sobre `--charcoal` ≥ 4,5:1.

#### W04 · `infra/i18n` · Idioma y textos
- **Verá:** `localhost:3000/es` con el texto leído de `messages/es.json`; `/` redirige a `/es`.
- **Qué:** segmento `[locale]`, `messages/es.json` y `en.json` preparado, claves tipadas y generadas, `i18n:check` (claves faltantes y `{{DATO}}`), `lang` en `<html>`.
- **Depende:** W01 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** un literal en un componente falla el lint · `i18n:check` lista una clave que falte en `en.json` · `/en` responde 404 mientras no se publique.

#### W05 · `infra/ci` · CI en cada PR
- **Verá:** check verde en el PR del propio bloque.
- **Qué:** GitHub Actions con lint, typecheck, Vitest, build, Playwright de humo con axe bloqueante; scripts `test` y `e2e`; un test de ejemplo de cada tipo.
- **Depende:** W02, W04 · **Tamaño:** S · **Decide Jose:** — (proteger `main` sigue en sus pendientes).
- **Hecho cuando:** el workflow pasa · un `role="img"` sin nombre en una página de prueba hace fallar axe · tiempo total < 8 min.

#### W06 · `infra/opennext` · Preview en Cloudflare
- **Verá:** URL de preview en cada PR.
- **Qué:** adaptador OpenNext para Cloudflare Workers, `wrangler.jsonc` con entorno `preview`, despliegue desde CI, variables públicas (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) por entorno.
- **Depende:** W05 · **Tamaño:** M · **Decide Jose:** crear el token de API de Cloudflare y pegar `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en los secretos del repo. No toca el dominio.
- **Hecho cuando:** la preview sirve `/es` · un cambio en el PR actualiza la misma URL · el Worker de producción no existe todavía.

### Kit de interfaz y estados

#### W07 · `public/ui-core` · Botón, enlace, titular
- **Verá:** `localhost:3000/dev/ui` con cada variante y estado.
- **Qué:** `Button` (`variant` primary/accent/light/ghost, `size`, `href` polimórfico, hover/focus/active/disabled del prototipo, `aria-busy` con spinner), `Link`, `Heading` (dos tonos), `Badge`, `Chip`; catálogo `/dev/ui` solo fuera de producción.
- **Depende:** W03, W04 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** los cuatro estados del botón se ven y se navegan con teclado · `Button` con `href` renderiza `<a>` · captura comparada con el prototipo a 360/768/1440 · axe limpio.

#### W08 · `public/ui-states` · Esqueleto, vacío, error, toast
- **Verá:** `localhost:3000/dev/ui/states`.
- **Qué:** `Skeleton` (shimmer, quieto con reduced-motion), `EmptyState`, `ErrorState` con reintentar, `Toast` con región `aria-live`, `OfflineBanner` (evento `offline`/`online`).
- **Depende:** W07 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** el toast se anuncia en lector de pantalla · `ErrorState` ejecuta el reintento · el banner aparece al cortar la red en DevTools.

#### W09 · `public/error-pages` · 404, 500, 429, mantenimiento
- **Verá:** `localhost:3000/es/no-existe` (404); `/dev/ui/errors` para 500, 429 y mantenimiento.
- **Qué:** `not-found.tsx`, `error.tsx`, `global-error.tsx` y `ErrorPage` con variante por código (la pieza 404 del prototipo), acciones «Volver al inicio», «Ver proyectos», «Abrir el chat».
- **Depende:** W08 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** 404 real devuelve código 404 · `error.tsx` muestra la página propia ante un `throw` de prueba · foco en el titular al cargar.

#### W10 · `public/scrollbar` · Scroll y barra personalizada
- **Verá:** `localhost:3000/dev/ui/scroll` (página larga) con la barra del prototipo y la línea de progreso.
- **Qué:** `::-webkit-scrollbar` y `scrollbar-color` bajo `@supports`, `scrollbar-gutter: stable`, `scroll-behavior` solo sin reduced-motion, `progress-fill` con `animation-timeline: scroll()` y fallback por TS mínimo.
- **Depende:** W03 · **Tamaño:** S · **Decide Jose:** validar en Safari y Firefox frente a Chrome (10.10).
- **Hecho cuando:** sin salto de layout al aparecer la barra · reduced-motion desactiva el scroll suave · progreso correcto en los tres navegadores.

#### W11 · `public/layout-nav` · Cabecera cápsula con borde de progreso, menú y pie
- **Verá:** `localhost:3000/es` con cabecera y pie navegables en móvil y escritorio.
- **Qué:** `SiteHeader` con la variante elegida (A cápsula: indicador deslizante y hoja; B terminal: ruta y progreso con marcas; C raíl: barra mínima y raíl lateral), `MobileMenu` como `<dialog>`, `SiteFooter`, skip link, `aria-current`, `data-scrolled`, enlaces Servicios · Proyectos · Sobre mí · Blog · Chat · Entrar (Blog oculto por interruptor desde W22).
- **Depende:** W07, W10, decisión 10.9 · **Tamaño:** M · **Decide Jose:** 10.9. Si elige B, la paleta ⌘K se parte en `public/nav-palette` (S) justo después.
- **Hecho cuando:** menú móvil con foco atrapado y cierre con Esc · `aria-current` en la ruta activa · captura comparada con el prototipo · axe limpio.

#### W12 · `public/page-transitions` · Cambio de pantalla
- **Verá:** navegar entre `/es` y `/es/proyectos` (placeholder) con transición.
- **Qué:** View Transitions de Next, `view-transition-name` en la cabecera, duraciones y easings de tokens, sin animación con reduced-motion, foco en `main` tras navegar.
- **Depende:** W11 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** la cabecera no parpadea al navegar · reduced-motion corta la animación · Safari sin View Transitions navega igual.

### Home: hero

#### W13 · `public/home-hero-copy` · Texto del hero y entrada
- **Verá:** `localhost:3000/es`, arriba del todo: eyebrow, titular con el segundo tono en coral, lead, dos CTAs, `stats`; el visual es un hueco gris del tamaño final.
- **Qué:** sección `Hero` con la entrada escalonada (`.enter`), reserva de espacio del visual (CLS 0), textos en messages marcados para `redactor`.
- **Depende:** W11, W12 · **Tamaño:** S · **Decide Jose:** textos definitivos (por `redactor` en el Mac).
- **Hecho cuando:** CLS 0 en Lighthouse · entrada sin animación con reduced-motion · titular es el único `h1`.

#### W14 · `public/home-hero-visual` · Capas del visual, quietas
- **Verá:** hero completo sin movimiento: navegador (wireframe y app), teléfono (wireframe y app), tarjeta de chat IA, halo y esqueleto de carga.
- **Qué:** port 1:1 de la estructura de `hero.css` y el HTML del prototipo como componentes sin estado; valores ya como tokens.
- **Depende:** W13 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** captura comparada con el prototipo (estado final) a 360/768/1440 · todo `aria-hidden` · sin JS.

#### W15 · `public/home-hero-motion` · La transformación
- **Verá:** el hero animado igual que el prototipo: wireframe → app → datos → IA, escaneo, contadores, barras, sparkline, chat y cintas.
- **Qué:** timeline en CSS (`@property`, keyframes encadenados), cintas SVG con `<animate>`, TS mínimo solo para reiniciar el ciclo y pausar fuera de viewport.
- **Depende:** W14, decisión 10.10 · **Tamaño:** M · **Decide Jose:** 10.10 (qué cambia del prototipo antes de portar).
- **Hecho cuando:** mismo orden y ritmo que el prototipo · sin saltos entre fases · < 5 % de CPU en reposo (Performance panel).

#### W16 · `public/home-hero-fallback` · Reduced-motion, móvil y presupuesto
- **Verá:** el hero con reduced-motion activo (estado final fijo) y en móvil < 48rem.
- **Qué:** `prefers-reduced-motion`, póster o vídeo ligero en móvil, `content-visibility`, test de presupuesto del hero (CSS + JS), captura comparada.
- **Depende:** W15 · **Tamaño:** S · **Decide Jose:** vídeo o póster en móvil.
- **Hecho cuando:** reduced-motion sin animación alguna · LCP del hero < 2,5 s en móvil simulado · presupuesto en CI.

### Home: secciones

#### W17 · `public/home-projects` · Proyectos destacados
- **Verá:** `localhost:3000/es#proyectos` con tres tarjetas de fixture y el índice lateral.
- **Qué:** `ProjectGrid`, `ProjectCard`, `pindex`, `reveal` con `animation-timeline: view()` y fallback; fixtures hasta W23.
- **Depende:** W13 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** reveal sin animación con reduced-motion · índice con `aria-current` por tarjeta visible · captura comparada.

#### W18 · `public/home-services` · Tres vías y packs
- **Verá:** `localhost:3000/es#servicios`.
- **Qué:** `ServicesStrip`, `PackTeaser` con precios «desde» de fixture, `Steps` (cómo trabajo).
- **Depende:** W17 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** `PackTeaser` tiene `Skeleton` · una sola acción primaria en la sección · captura comparada.

#### W19 · `public/home-stack-closing` · Stack y cierre
- **Verá:** `localhost:3000/es#stack` y `#contacto`.
- **Qué:** `StackRow` (tiles), `ChatInvite` (abre el panel; placeholder hasta W36), `Closing` con `QuickContact` (email con copiar).
- **Depende:** W18 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** copiar email anuncia en el toast · pie y cierre no duplican CTA · captura comparada.

### Catálogo y datos

#### W20 · `data/public-catalog` · Primera migración
- **Verá:** `supabase start && supabase db reset` verde y las tablas en Studio local.
- **Qué:** `packs`, `extras`, `rates`, `site_settings`, `price_changes` con trigger; vistas `public_packs`, `public_extras`, `public_settings`; `anon` solo con grant a las vistas; RLS admin; seed local; `rls.test.ts`.
- **Depende:** W05 · **Tamaño:** M · **Decide Jose:** — (local; nada en producción).
- **Hecho cuando:** `anon` no lee las tablas y sí las vistas (test) · `get_advisors` a cero en local · tipos tipados en SQL, sin `jsonb` salvo `site_settings.value`.

#### W21 · `data/types-contracts` · Tipos generados y contratos
- **Verá:** nada visual; CI falla si el esquema y `database.ts` difieren.
- **Qué:** `supabase gen types` → `src/types/database.ts`, script `types:gen` con test de deriva, carpeta `contracts/` con el primer fixture (`jobs/chat.reply.json`) y `contracts.lock`.
- **Depende:** W20 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** un cambio de columna sin regenerar rompe CI · `contracts/` tiene README de una pantalla para `josecoded-omen`.

#### W22 · `public/home-data` · La home lee la base
- **Verá:** `localhost:3000/es#servicios` con precios de la base local; apagar `show_prices` en Studio y recargar.
- **Qué:** `PackTeaser` y `ServicesStrip` leen las vistas con caché por tag y `Suspense` + `Skeleton`; si falla, el bloque se oculta sin romper; interruptores (`blog`, `lab`, `public_chat`) aplicados en el layout.
- **Depende:** W19, W21 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** con Supabase parado la home carga sin el teaser · cambiar un precio invalida la caché · Blog desaparece de la cabecera con el interruptor apagado.

### Contenido y proyectos

#### W23 · `public/content-mdx` · Pipeline de contenido
- **Verá:** `localhost:3000/dev/ui/prose` con un MDX de ejemplo.
- **Qué:** `content/` (projects, blog, about, legal), frontmatter validado con zod por tipo, `Prose`, loader con `cache`, dos proyectos de ejemplo.
- **Depende:** W07 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** un frontmatter inválido rompe el build con mensaje claro · `Prose` cubre títulos, listas, código, imágenes y tablas · axe limpio.

#### W24 · `public/projects-list` · Proyectos
- **Verá:** `localhost:3000/es/proyectos`.
- **Qué:** `PageHead`, `FilterTabs` (Todos · Apps · Webs, en la URL), `ProjectCard` apilada, `EmptyState` por filtro.
- **Depende:** W23, W17 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** el filtro sobrevive a recargar · vacío por filtro · estática (sin esqueleto).

#### W25 · `public/project-detail` · Ficha de proyecto
- **Verá:** `localhost:3000/es/proyectos/<slug>`.
- **Qué:** `ProjectHead`, `ScreenGallery` (omitida sin capturas), `CaseSection` ×3, `Chip`, `StoreLinks`, `PrevNext`, `Closing`; 404 propia.
- **Depende:** W24 · **Tamaño:** M · **Decide Jose:** los tres proyectos reales, sus capturas y enlaces (`{{DATO}}`).
- **Hecho cuando:** slug inexistente → 404 · galería navegable con teclado · metadatos por proyecto.

### Servicios

#### W26 · `public/services-ways` · Las tres vías
- **Verá:** `localhost:3000/es/servicios`.
- **Qué:** `PageHead`, `WayNav` pegajosa con `aria-current`, `WaySection` ×3, `RateFigure` (fixture), CTAs a `/contacto?via=…`, CV en la vía contratación (2.8).
- **Depende:** W11, W07 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** `WayNav` sigue el scroll y no tapa contenido en 360 · una acción primaria por vía · captura comparada.

#### W27 · `public/services-packs` · Comparador y FAQ
- **Verá:** `localhost:3000/es/servicios#packs`.
- **Qué:** `PackCompare` (columnas en escritorio; un pack por vista con `scroll-snap` en móvil), `ExtraList`, `Faq` con JSON-LD `FAQPage`, `Closing`; fixtures.
- **Depende:** W26 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** comparador usable con teclado en móvil · «Pedir este pack» lleva a `/contacto?via=pack&pack=…` · FAQ con `<details>` nativo.

#### W28 · `public/services-data` · Precios reales
- **Verá:** `localhost:3000/es/servicios` con la base local.
- **Qué:** packs, extras y tarifas desde las vistas públicas con `Skeleton`; si falla, vías sin importes y aviso discreto.
- **Depende:** W27, W22 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** con Supabase parado la página carga sin importes · `show_prices` apagado oculta los importes · sin CLS al llegar los precios.

### Sobre mí

#### W29 · `public/about-page` · Sobre mí
- **Verá:** `localhost:3000/es/sobre-mi`.
- **Qué:** `content/about.mdx` y `content/cv.json` (zod), `PageHead` con retrato, `Timeline`, `PrinciplesList`, `LinkRow` (LinkedIn, GitHub, CV es/en como PDF estático), `Closing`.
- **Depende:** W23 · **Tamaño:** M · **Decide Jose:** retrato, PDF del CV, enlaces (`{{DATO}}`).
- **Hecho cuando:** retrato con `alt` y tamaño reservado · timeline legible en 360 · PDF enlazado con `download`.

#### W30 · `public/about-stack` · Stack y formación
- **Verá:** `localhost:3000/es/sobre-mi#stack`.
- **Qué:** `StackGroups` y `CredentialList` desde `cv.json`; ancla `#stack` desde la cabecera.
- **Depende:** W29 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** `cv.json` es la única fuente (test) · ancla con desplazamiento bajo la cabecera · axe limpio.

### Formularios y contacto

#### W31 · `public/form-kit` · Formularios con Server Actions
- **Verá:** `localhost:3000/dev/ui/forms` con un formulario de ejemplo: éxito, error de validación, error de servidor.
- **Qué:** `Form` y `Field` (label, error en línea, `aria-invalid`, `aria-describedby`), `useActionState`, zod compartido cliente/servidor, `Turnstile` invisible con verificación en servidor, `Button` en carga.
- **Depende:** W08 · **Tamaño:** M · **Decide Jose:** crear el widget Turnstile en Cloudflare y pegar `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` (las claves de prueba valen hasta entonces).
- **Hecho cuando:** funciona sin JS (envío nativo) · error de campo con foco en el primero inválido · doble envío bloqueado.

#### W32 · `public/contact-page` · Contacto
- **Verá:** `localhost:3000/es/contacto?via=pack&pack=P2`.
- **Qué:** `PageHead`, `ViaSelector` segmentado (`?via`, `?pack`), `ContactForm` sobre el kit con acción simulada, `QuickContact`, hueco de `CalEmbed` (2.9).
- **Depende:** W31, W26 · **Tamaño:** M · **Decide Jose:** WhatsApp y Cal.com cuando dé los datos.
- **Hecho cuando:** la vía y el pack se preseleccionan desde la URL · los cinco estados de P6 visibles · captura comparada.

#### W33 · `data/contacts-lead` · Contactos y RPC pública
- **Verá:** `db reset` verde; `contacts` y `activities` en Studio.
- **Qué:** `contacts`, `activities`, helpers `private.uid/role/is_admin/owns_contact`, `private.form_quota` (ip_hash, día), RPC `public_submit_contact` con `search_path = ''` y cuota, `private.audit_log`, tests RLS.
- **Depende:** W21 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** `anon` solo ejecuta la RPC (test) · cuota devuelve error tipado · advisors a cero en local.

#### W34 · `public/contact-submit` · Envío real
- **Verá:** enviar desde `/es/contacto` y ver la fila en Studio local.
- **Qué:** Server Action → Turnstile → RPC; éxito con siguiente paso, error de servidor con reintento, 429 con vías alternativas; `activities` `form`.
- **Depende:** W32, W33 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** E2E de humo crea un contacto · 429 simulado muestra las alternativas · sin datos personales en logs.

#### W35 · `infra/outbox-email` · Aviso a Jose por email
- **Verá:** un email de prueba en su buzón enviado desde la preview.
- **Qué:** `private.outbox`, trigger `lead_new` en `contacts`, cron de Cloudflare que drena la cola con Resend, plantilla `lead-new`, reintentos con límite.
- **Depende:** W34, W06 · **Tamaño:** M · **Decide Jose:** dominio verificado en Resend y `RESEND_API_KEY` en secretos. **Pedir OK a Jose antes de activar el envío real.**
- **Hecho cuando:** fila `sent` tras el cron · fallo de Resend deja `attempts` y no pierde la fila · plantilla sin datos de más.

### Chat

#### W36 · `chat/panel-ui` · Panel y pantalla de chat
- **Verá:** «Chat» en la cabecera abre el panel en `/es`; `localhost:3000/es/chat` a pantalla completa; estados con fixtures.
- **Qué:** `ChatPanel` (`<dialog>` no modal), `ChatThread`, `ChatBubble` (etiqueta «Asistente de Jose» / «Jose»), `ChatComposer`, `QuotaNotice`, `OfflineNotice`, `SaveThreadHint`.
- **Depende:** W11, W08 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** panel con foco gestionado y Esc · hilo anunciado como `log` · composer crece hasta 6 líneas · captura a 360.

#### W37 · `data/chat` · Hilos, mensajes, latido y trabajos
- **Verá:** `db reset` verde.
- **Qué:** `chat_threads`, `chat_messages`, `private.chat_quota`, `private.heartbeat`, `private.jobs`, RPC `public_chat_thread`, `public_chat_send` (encola `chat.reply`), `omen_status`; Realtime en `chat_messages` con RLS; purga a 90 días como job; tests RLS.
- **Depende:** W33 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** un anónimo no lee hilos ajenos (test) · `jobs` usa `for update skip locked` · advisors a cero.

#### W38 · `data/rag-schema` · Vectores en Supabase
- **Verá:** `db reset` verde con `vector` activa.
- **Qué:** extensión `pgvector` en `extensions`, `private.rag_documents` y `private.rag_chunks` con índice, fixture `contracts/jobs/rag.index.json`, sin acceso desde el cliente.
- **Depende:** W37 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** tipos regenerados · ningún rol de cliente ve las tablas (test) · dimensión del embedding fijada en el contrato.

#### W39 · `chat/public-send` · El visitante escribe
- **Verá:** enviar en `/es/chat` y ver el mensaje en Studio; sin Omen aparece «Jose te responde en cuanto pueda».
- **Qué:** cookie firmada `anon_id`, Server Action → `public_chat_send`, suscripción Realtime, Turnstile en el primer mensaje, cuota, aviso si `heartbeat` > 2 min. La respuesta la pone Omen (O07).
- **Depende:** W36, W37, W38 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** el mensaje aparece por Realtime sin recargar · cuota superada muestra `QuotaNotice` · cookie `HttpOnly`, `Secure`, `SameSite=Lax`.

### Blog, legales, SEO, seguridad y lanzamiento

#### W40 · `public/blog-index` · Blog
- **Verá:** `localhost:3000/es/blog` con dos artículos de ejemplo.
- **Qué:** `PostTeaser`, `Chip`, `LoadMore` por URL, 404 si `site_settings.blog` está apagado, vacío sin artículos.
- **Depende:** W23, W22 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** interruptor apagado → 404 y sin enlace en la cabecera · paginación con teclado · vacío diseñado.

#### W41 · `public/blog-post` · Artículo
- **Verá:** `localhost:3000/es/blog/<slug>`.
- **Qué:** `Prose`, `Toc`, `CodeBlock` con copiar, `ReadingProgress`, `ShareRow`, relacionados; sin comentarios (2.7).
- **Depende:** W40 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** `Toc` con `aria-current` al hacer scroll · copiar anuncia en el toast · metadatos y OG por artículo.

#### W42 · `public/legal` · Aviso, privacidad y cookies
- **Verá:** `localhost:3000/es/legal/privacidad`.
- **Qué:** tres MDX en `content/legal/`, `Prose` + `Toc`, enlaces en el pie; privacidad cubre chat anónimo, cuota por IP, CRM, Groq, Resend y Cloudflare como encargados.
- **Depende:** W23, W11 · **Tamaño:** S · **Decide Jose:** nombre legal, NIF, domicilio y email (`{{DATO}}`); redacción por `redactor` en el Mac.
- **Hecho cuando:** `i18n:check` lista los `{{DATO}}` pendientes · tres rutas en el sitemap · tipografía legible en 360.

#### W43 · `public/seo` · SEO básico
- **Verá:** `/sitemap.xml`, `/robots.txt`, `/llms.txt`; tarjeta OG en una vista previa.
- **Qué:** `metadata` por ruta, `sitemap.ts`, `robots.ts`, imagen OG estática, JSON-LD `Person`, `llms.txt`, `hreflang` preparado.
- **Depende:** W41, W42 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** todas las rutas públicas en el sitemap · `/dev/*` bloqueado en robots y ausente en producción · JSON-LD válido en el validador.

#### W44 · `infra/security-headers` · Cabeceras y ZAP
- **Verá:** cabeceras en la preview; job ZAP verde en el PR.
- **Qué:** CSP estricta con nonce (scripts propios, Turnstile, Supabase), HSTS, `frame-ancestors 'none'`, Permissions-Policy; ZAP baseline contra la preview en CI; `pnpm audit` y escaneo de secretos.
- **Depende:** W06, W39 · **Tamaño:** M · **Decide Jose:** —
- **Hecho cuando:** sin `unsafe-inline` · chat y Turnstile funcionan con la CSP · ZAP sin alertas medias o altas.

#### W45 · `infra/budgets` · Presupuestos de rendimiento
- **Verá:** informe de Lighthouse CI en el PR.
- **Qué:** LHCI con umbrales (9.3), presupuesto de JS de la home ≤ 150 KB gz, `jscpd`.
- **Depende:** W16, W43 · **Tamaño:** S · **Decide Jose:** —
- **Hecho cuando:** Lighthouse ≥ 95 en móvil en `/es` · el presupuesto rompe CI si se supera · `jscpd` sin duplicados > 5 %.

#### W46 · `infra/go-live` · Lanzamiento · **GATE: OK de Jose**
- **Verá:** `https://josecoded.com`.
- **Qué:** `supabase db push` a producción con `get_advisors` antes y después, secretos de producción, Worker de producción, DNS del dominio al Worker, Turnstile y Resend en modo real, humo en producción.
- **Depende:** todo lo anterior, 10.7 · **Tamaño:** M · **Decide Jose:** el OK explícito en la sesión y la fecha.
- **Hecho cuando:** el dominio sirve `/es` con HTTPS · advisors a cero en producción · formulario y chat funcionan en producción con una prueba real.

---

## Lista O — repo `josecoded-omen` (cuando exista, 10.8)

- **O01 · `infra/scaffold`** · Node 22 + TypeScript + pnpm, `src/`, lint sin comentarios, Docker Compose, README. Verá: `pnpm dev` imprime el latido en consola. S.
- **O02 · `infra/contracts-pull`** · `pnpm contracts:pull` copia `database.ts` y `contracts/` desde `josecoded` al commit de `contracts.lock`; CI falla si difieren. Depende W21. S.
- **O03 · `infra/ci`** · lint, typecheck, Vitest, comprobación de contrato, imagen Docker publicada en GHCR. Depende O02. S.
- **O04 · `data/supabase-client`** · cliente con clave de servicio, `private.heartbeat` cada 30 s, consumidor de `private.jobs` con reintentos. Verá: semáforo verde en `omen_status` desde Studio. Depende W37. M.
- **O05 · `ai/providers`** · adaptadores Groq y modelo local con la misma interfaz, reserva local si Groq falla, `model` registrado. Decide Jose: modelo local concreto y `GROQ_API_KEY`. M.
- **O06 · `ai/rag-index`** · job `rag.index`: `content/*` y packs → chunks → embeddings locales → `private.rag_chunks`. Depende W38, O05. M.
- **O07 · `chat/reply-job`** · job `chat.reply`: contexto del hilo + RAG + Groq → inserta `chat_messages` `assistant`. Verá: respuesta en `/es/chat` de la preview. Depende O04–O06, W39. M.
- **O08 · `infra/deploy-omen`** · Compose en Omen que recoge la imagen de GHCR, `.env`, latido visible en `/admin` cuando exista. **GATE: OK de Jose; servicios preexistentes intocables.** M.

---

## Zonas siguientes (solo grupos; se detallan al cerrar la pública)

1. **Auth y admin base:** `auth/otp-login`, `auth/totp`, `auth/invitation`, `auth/account`, `admin/shell`, `admin/overview`, `admin/users`, `admin/prices`, `admin/system`, `admin/notifications` (Telegram), `admin/chat-inbox`.
2. **CRM:** `data/crm-schema`, `crm/overview`, `crm/contacts-list`, `crm/contact-detail`, `crm/deals`, `data/commissions`, `crm/commissions`, `crm/import` (posterior), `crm/settings`, `crm/chat`.
3. **Área de clientes:** `data/projects-schema`, `area/overview`, `area/tasks`, `area/documents` (Storage), `area/stories`, `area/chat`, `admin/projects`.
4. **Freelance:** `freelance/overview`, `freelance/project`, `freelance/chat`.
5. **Radar:** `data/radar-schema`, `radar/overview`, `radar/findings`, `radar/sources`; en Omen `radar/scan`, `radar/score`, `radar/draft`, `radar/send` (solo API oficial, 8.3).
6. **Lab:** `lab/index`, `lab/demo-frame`; formato por decidir cuando lleguen las apps.
