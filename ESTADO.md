# Estado — josecoded

> **Etapa de diseño y planificación cerrada el 2026-09-30** (`/cierre`). Home v6 documentada, convenciones de trabajo, inventario de componentes, pantallas y contenidos, spec v1.7, DT v1.4, newsletter v1.2, plan v2.1 con `/plan-eng-review` CLEAR. **Batería de stack y metodologías de producción respondida el 2026-09-30 (tarde)**: working-agreements **v1.2**, `CLAUDE.md` con las reglas duras 11–13 y plan **v2.2**. Siguiente: **fase 0**. Sin código de aplicación todavía.

## Ahora

**Home elegida: `docs/superpowers/design/ref/home-v6/` («bento por escenas»).**
Servir con `python3 -m http.server 8765 --directory docs/superpowers/design/ref` → http://localhost:8765/home-v6/ (`?intro` para ver la caída de letras del hero). En la sesión de Claude existe la config `josecoded-design-ref` en `~/Documents/ClaudeDocuments/.claude/launch.json`.

Qué tiene la v6:
- **Hero** aprobado (split + GlyphScene: glifos que morfan móvil → web → chip IA). La nube vive solo en el hero.
- **Orden tras el hero** (y de la cabecera): Sobre mí · Empresas · Negocios · Proyectos · Blog · cierre «¿Empezamos?».
- **Cabecera**: ⌘K, **Chat** (punto verde), **Login** destacado en violeta. «Contacto» fuera de la cabecera (sigue en cierre y ⌘K) — confirmado 2026-09-29.
- **Cada sección es una escena** a pantalla con un bento de 3 celdas sin huecos; Negocios con los 4 packs (900 / 1.400 / 2.500 / 4.200 € desde, sin IVA). **Proyectos es un carrusel fijado** horizontal (CSS `animation-timeline`).
- **Un gesto = una escena**: rueda/trackpad/teclado/enlaces deslizan ~0,8 s a la siguiente; en Proyectos, una tarjeta por gesto. Solo en escritorio con puntero fino y si la escena cabe; si no, scroll nativo.
- **Transiciones por elemento** ligadas al scroll (entra: sube + nitidez; sale: retrocede + se apaga). Celdas grandes se amplían con View Transitions (Esc cierra).
- **Vida en las celdas**: luz bajo el cursor, marquesina doble del stack, mini-chat que se escribe, selección deslizante en Servicios y Packs, selector de tarifa, checks que se dibujan, arte flotando en Proyectos.
- **Indicador de sección**: líneas sin texto en el margen derecho, centradas; activa más larga y violeta; oculto en el hero y cuando no hay margen.
- **Adaptativo sin medidas mágicas**: clamp con vw/svh/vmin + container queries (bento 1 → 2 → 12 columnas según su contenedor). Probado de 360×640 a 1920×1080 sin desbordes.
- Pendiente de datos reales: todo lo marcado `{{DATO}}` (ciudad, descripciones de proyectos, artículos del blog, plazo de respuesta).

Fuentes de verdad de diseño: `PRODUCT.md` (producto), `DESIGN.md` + `.impeccable/design.json` (sistema v6, volcado el 2026-09-29; **faltan los tokens de INV §5, que completa la tarea 1.10 del plan**), contrato en `.impeccable/surfaces/`. Figma con exploraciones: https://www.figma.com/design/aGt6l1dnVUB8tmhU8ctn4f.

Histórico de prototipos (no usar como base): `home-v5/` (variantes A/B/C que llevaron a la v6), `home-v4/` (ventana con dock), `hero-lab-3/` (hero aprobado original), `estilo/`, `eje/`, `ui-v3/`, `heros/`, `hero-lab`, `hero-lab-2`.

Documentos (al día con la v6 desde el 2026-09-29):

| Documento | Ruta | Versión |
|---|---|---|
| Spec | `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` | **v1.7** (D27–D35, §12 v6, válvula por fecha) |
| Spec newsletter | `docs/superpowers/specs/2026-09-29-josecoded-newsletter.md` | **v1.2** (bilingüe, GitHub App, grants por columna; Q1–Q6 resueltas) |
| UX | `docs/superpowers/design/2026-09-17-josecoded-ux.md` | **v4.0** (§2 y §4.1 v6; interiores → documento de pantallas) |
| Diseño técnico | `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` | **v1.4** (§0b: cambios del eng review) |
| Sistema visual | `DESIGN.md` + `.impeccable/design.json` | v6 (`2026-09-17-josecoded-ui.md` v3 superado) |
| Componentes home | `docs/superpowers/design/2026-09-29-componentes-home-v6.md` | v1.1 |
| Pantallas y contenidos | `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` | v1.0 |
| Convenciones | `docs/working-agreements.md` | **v1.2** (§14 tipos, §15 componentes con variantes, §16 a11y por componente, §17 servicios/estado/formularios) |
| Plan | `docs/superpowers/plans/2026-09-19-josecoded-v1.md` | **v2.2** (adendas «v2.2 (stack)» en 1.1–1.3, 1.5, 1.6, 1.10, 2.2, 2.17, 3.7–3.10, 7.1, 7.16–7.24, 10.2; fase 0 sin cambios) |

Índices: codebase-memory `Users-jose-Documents-GitHub-josecoded` (indexado 2026-09-29, con ADR de diseño); graphify se regenera en cada commit (hook).

## Pendientes

**Confirmaciones de Jose (cierran el diseño)**
- [x] Badge «Disponible para proyectos»: quitado del hero (2026-09-29).
- [x] «Contacto» fuera de la cabecera: confirmado.
- [x] Indicador de sección: «nunca en el hero», como está implementado.
- [x] A 320 px el botón de menú se salía 8 px: arreglado (Login solo icono en ≤ 22.5rem).

**Cerrar el diseño (siguiente sesión)**
- [x] Revisión de acabado de impeccable sobre `home-v6` y fixes (2026-09-29, commits 79e2516, dfa775f, 412a789, 07afeb9; revisor aprobado). Capturas en `.impeccable/review/v6/` (ignorado por git).
- [x] Decisiones de Jose sobre la revisión (2026-09-29): titular a dos tonos se queda; tarjetas se quedan como están pero algo más separadas del fondo (hecho: superficie más clara + borde más visible, tokens `--card`/`--card-line`); glifos se quedan como detalle discreto; aire en Sobre mí se resuelve al diseñar ese apartado.
- [x] Cabecera en orden idioma → buscador → chat → login; en ≤ 1080px el idioma va dentro del menú ☰.
- [x] Hero a 320×812 se desbordaba 5px (escenario de 38svh): acotado al ancho.
- [ ] `{{DATO}}` nuevos: foto real de Jose (celda Sobre mí), entregable por servicio (Empresas), textos en inglés de todo lo que aporte Jose, capturas y reto/trabajo/resultado por proyecto, CV maestro es/en, datos del titular para el aviso legal, respuestas de la FAQ de Empresas, tres artículos del blog, cuenta de Cal.com.
- [x] Volcar la v6 a `DESIGN.md` y `.impeccable/design.json` y al contrato de `.impeccable/surfaces/` (2026-09-29). Quedan los tokens de INV §5 → tarea 1.10 del plan.
- [x] UX §2 y §4.1 reescritos, UI v3 superada, fase 2 del plan reescrita contra la v6 (2026-09-29, plan v2.0).
- [x] Spec §12 alineada (v1.6): home v6, cabecera Chat + Login sin Contacto, orden de secciones, stack visual D27, Baseline 2024 D28, pantallas D30, bilingüe D31, área D32, blog D33.
- [x] Diseño técnico v1.3: `glyph-scene` desde `scene.js` v6 (vídeo en móvil, WebGL solo escritorio), tokens `design.json` → `tokens.css`, `lib/motion/`, `i18n:check`, `user_profiles` + `area_lead_summary()` para la personalización del área.
- [x] Spec de newsletter integrada como fase 10 del plan (sin cambiar sus decisiones; notas de encaje en el plan).
- [x] `/plan-eng-review` del plan v2.0 hecho (2026-09-30): 41 hallazgos decididos por Jose y aplicados en plan v2.1, DT v1.4, spec v1.7, newsletter v1.2 y working-agreements v1.1.
- [x] Preguntas del paso 5 respondidas por Jose (2026-09-30): newsletter **bilingüe** (spec v1.1), repo **privado**, tolerancia de capturas **2 %**, auto-merge solo en `newsletter/*`; n8n evaluado como orquestador y descartado (spec de newsletter §7.5). Sigue abierta solo la del paginado en trackpad (se decide en el navegador en 2.16).
- [x] **Indicaciones de cómo trabajar** antes de escribir código real: `docs/working-agreements.md` + reglas duras en `CLAUDE.md` (2026-09-29). Falta el paso manual de Jose: proteger `main` en GitHub (§9).
- [x] **Decisión de componentes de la home**: `docs/superpowers/design/2026-09-29-componentes-home-v6.md` (decisiones cerradas en su §3).
- [x] **Pantallas independientes**: mapa, contenidos y orden en `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` v1.0 (2026-09-29). Incluye las páginas derivadas: stack/CV (sección en Sobre mí + PDF), tarifas de negocio (comparador en `/negocios`) y personalización automática del área.

**Insumos de Jose (bloquean tareas del plan)**
- [ ] Los `{{DATO}}`: nombre a mostrar, ciudad, años, estado y descripción de 3catinfo/HazmeFila/Oportunix, certificaciones, WhatsApp y email, usuario de GitHub, enlaces de stores, plazo de respuesta real, artículos del blog.
- [ ] Radar: `content/radar/profile.json` y CV maestro es/en; proyecto OAuth de Google; alertas de LinkedIn; ≥ 12 correos reales anonimizados; cuentas en InfoJobs/Tecnoempleo/Upwork/Workana/Malt.
- [ ] Supabase: OAuth Google/GitHub, plantilla OTP **en es y en**, «leaked password protection», **«Confirm email» activo y cuenta SMTP propia para Auth (`cuenta@josecoded.com`)** (D35; gate 1.9/3.12).
- [ ] GitHub App `josecoded-bot` (newsletter, tarea 10.0) y comprobar el plan de GitHub del repo privado; `TELEGRAM_PING_TOKEN` en los secretos de Actions; AI Gateway con presupuestos por consumidor (3.12).
- [ ] GitHub: proteger `main` (working-agreements §9) antes del primer merge; la excepción de auto-merge solo para `newsletter/*` con checks `ci` + `newsletter-content-only` en verde y 0 revisiones requeridas (fase 10, tarea 10.6).
- [ ] Newsletter (fase 10, tras el lanzamiento): cuenta de Brevo y dominio autenticado, registros DNS, PAT fine-grained, `claude setup-token` para Omen (Q1), lista de fuentes (Q6), política de privacidad, 3–5 temas iniciales. Q1–Q6 de su spec **resueltas el 2026-09-30** (recomendaciones aceptadas; Q5: pie con nombre + baja + enlace al aviso legal, NIF y domicilio solo en el aviso legal, valores en la fase de datos) y auto-merge del PR de contenido confirmado (el clic de Aprobar es el OK).
- [ ] Cloudflare: `api.josecoded.com` como custom domain y URL `workers.dev` del gateway. Los servidores MCP de Cloudflare necesitan autorizarse (`/mcp` en una sesión interactiva).
- [ ] Corregir los ejemplos provisionales de `Comercial/voz.md`.

**Suelto**
- [ ] Accesibilidad: al descomponer etiquetas en glifos (home-v4) el nombre accesible puede leerse con basura; en v6 ya no se usa, confirmar al implementar.
- [ ] `.gitignore` de `josedev` y `josecoded-worker` con `graphify-out/` sin commitear.

## Siguiente paso

1. ~~Jose responde las tres confirmaciones.~~ Hecho 2026-09-29.
2. ~~Revisión de acabado + fixes~~ hecho. Jose valida en navegador y decide lo pendiente de la revisión → documentador → `DESIGN.md` + contrato v6 en `.impeccable/surfaces/`.
3. ~~Pantallas independientes y contenidos~~ hecho (2026-09-29).
4. ~~Componentes de la home~~ hecho (2026-09-29).
5. ~~Actualizar spec, UX, diseño técnico y plan + `/plan-eng-review`~~ hecho (2026-09-30: plan v2.1 con los 41 hallazgos).
6. ~~Batería de stack y metodologías de producción~~ hecha (2026-09-30: 12 respuestas → working-agreements v1.2, `CLAUDE.md` reglas 11–13, plan v2.2).
7. **Fase 0 del plan** (siguiente paso) (0.1 con `cpuTime` p95 y caché de assets; 0.2 con `scene.js` de la v6; 0.3–0.6 Radar) y **fase 1** en dos ramas: `chore/monorepo-base` (1.1, 1.4 `pricing` bilingüe, 1.5, **1.10 tokens antes de cualquier UI**) y `chore/supabase` (1.2, 1.3, 1.6, 1.7 cron único + preview, 1.8 migraciones + RPCs, 1.9 gate con «Confirm email» y SMTP).
8. Fase 2: port 1:1 de `home-v6` escena a escena, con capturas comparadas (2 %) y aprobación de Jose entre escenas. Al cerrarla, **fijar la fecha de válvula** y la tabla del hito «contenido completo».
9. Orden de fases: 0 → 1a → 1b → 2 → hito de contenido → 3 → 4 → 5 → 6 → 8.1 → 9 (lanzamiento) → **7 Radar** → 10 Newsletter.

Gates que no se cruzan sin OK explícito de Jose en la misma sesión: migraciones y deploys a producción, contratar servicios, tocar servicios preexistentes de Omen.

## Decisiones recientes

- **2026-09-30:** Jose aprueba el vídeo del hero a 700 KB (0.2 cerrada) y decide **slugs traducidos en inglés** (`/en/business`, `/en/about`…). Anotado en el plan (nota v2.3 antes de la fase 1).

- **2026-09-30 (spike 0.1, parte local, rama `spike/t0-opennext`):** 12/12 tests en `wrangler dev --local`; Worker ~1,12 MiB gz (tope 2,5); caché de assets estáticos de OpenNext funciona (variante por defecto) y **en CI hay que usar `opennextjs-cloudflare upload`/`deploy`, no `wrangler versions upload` a secas** (afecta a 1.1 y `preview.yml`); **`check-hero-bundle` (2.9) debe leer el HTML prerrenderizado + source maps**, Turbopack no genera `app-build-manifest.json`; barra final: se mantiene 308 → sin barra y se ajusta el test (decisión técnica). Pendiente: `cpuTime` p95 remoto (necesita `wrangler login` + OK de Jose) y decisión de slugs en inglés. Tope del vídeo 700 KB aplicado en el spike (webm 671 KB, mp4 622 KB, SSIM 0,92–0,93).

- **2026-09-30 (fase 0):** spike 0.2 hecho en `spike/t0-hero` (chunk `glyph-scene` 139,7 KiB gz con bloom, póster 25 KB, captura reproducible PSNR 39,6). **Tope del vídeo del hero en móvil subido a 700 KB** tras verlo Jose en el navegador (a 400 KB los glifos salían borrosos). **0.3–0.6 (Radar) movidas al inicio de la fase 7.** 0.1 solo en local hasta que Jose haga `wrangler login` y dé OK al Worker de pruebas `josecoded-web-t0`.

- **2026-09-30 (batería de stack y metodologías de producción, 12 respuestas de Jose; recomendada en todas):** normativa en working-agreements v1.2 (§14–§17), reglas duras 11–13 en `CLAUDE.md`, plan v2.2 (fase 0 sin cambios).
  1. **Tipos:** `packages/types` (`@josecoded/types`) con barrel y un fichero por dominio (`ui`, `content`, `api`, `db`, `i18n`, `tokens`, `radar`, `newsletter`); ningún tipo compartido fuera del paquete.
  2. **zod como fuente en las fronteras** (`packages/types/src/schemas/`) y tipos por `z.infer`; los internos a mano. Sin `satisfies` ni duplicar.
  3. **Tipos de Supabase:** `supabase gen types --local` → `packages/types/src/database.ts` commiteado con test de deriva (nunca contra producción); helpers `Tables<>`/`Enums<>` en `db.ts`; se regenera en cada migración.
  4. **Claves tipadas:** `AppConfig` de next-intl (autocompletado y error de compilación en `t()`) y `tokens.ts` generado por design-tokens con `TokenName` + `readToken` para `lib/motion/`.
  5. **Variantes:** uniones de tipos + `data-variant`/`data-size`/`data-tone` y CSS Module por atributo; sin CVA ni `clsx`. Un componente se parte solo si cambia rol ARIA, elemento raíz o slots, nunca por estilo.
  6. **Polimorfismo por `href`** con unión discriminada (con `href` → `Link`, sin él → `<button>`); sin `as` ni `asChild`/`Slot`.
  7. **A11y por componente:** contrato «A11y» en cada tarea, helpers únicos en `lib/a11y/` (focus-trap, inert, roving tabindex, return-focus, announce), `vitest-axe` en componentes con comportamiento y `@axe-core/playwright` bloqueante en todo E2E de escena o pantalla. VoiceOver manual opcional.
  8. **Estado en cliente sin librería:** URL/RSC/Server Actions para datos, `useState` local, un solo `ShellProvider` (`palette`, `menu`, `openCell`). Zustand descartado.
  9. **Formularios:** Server Actions + `useActionState` + zod en servidor; `Form`/`Field` propios (`Field` con variantes `kind`); react-hook-form descartado también en admin y Radar.
  10. **Gateway nuevo con puertos y adaptadores:** interfaces en `@josecoded/types/api.ts`, `apps/api/src/adapters/*.adapter.ts` (únicos que importan SDKs o hacen `fetch`), `buildDeps(env)` en `c.var.deps`, servicios `create<X>Service(deps)` testeados con falsas en memoria; `fetchMock` queda para los tests de contrato de adaptadores. Módulos heredados intactos.
  11. **Catálogo `/dev/ui`** en la propia app (todas las primitivas × variantes × estados), solo con `NEXT_PUBLIC_DEV_UI=1` (dev y preview), 404 en producción; sin Storybook. Documentación = JSDoc de props + catálogo.
  12. **Lint extra:** `no-restricted-imports` de fronteras (messages JSON, `database.ts`, `tokens.css`, `three`, `supabase-js`, adaptadores desde rutas), `eslint-plugin-import-x` (order, no-duplicates, no-cycle) y `jscpd` con `pnpm dlx` en CI. **No** entran las reglas TypeScript extra (`consistent-type-imports`, `no-explicit-any` error, prohibir `React.FC`/enums).
  - Lista blanca de dependencias ampliada (§11): `vitest-axe`, `@axe-core/playwright`, `eslint-plugin-import-x`, `jscpd` (solo CI). Descartados con nombre: CVA, clsx, `@radix-ui/react-slot`, react-hook-form, Zustand, Storybook.

- **2026-09-30 (cierre de etapa; principios de producción pedidos por Jose):** SOLID aplicado a la UI: un componente por concepto con variantes (p. ej. un único `Button` con variantes visuales), sin componentes duplicados para lo mismo; accesibilidad asegurada como requisito, no como revisión final; literales en `messages/`, estilos en tokens y **tipos unificados en un fichero de types**. Se concretan en la batería de stack y metodologías antes de la fase 0.

- **2026-09-30 (`/plan-eng-review` del plan v2.0, 41 hallazgos decididos por Jose):** recomendaciones aceptadas salvo lo indicado. Claves: **lanzamiento todo junto con válvula por fecha y Radar como última etapa** (spec D34; fecha al cerrar la fase 2); **correos de Auth desde @josecoded.com** con SMTP propio y «Confirm email» obligatorio, RPC de usuario solo con email confirmado (D35); generador con Turnstile antes que cuota, cuotas atómicas en Supabase (`increment_quota`), propuesta firmada HMAC, guarda determinista y evals manuales; leads idempotentes; contrato único del código de afiliado (prefijo elegido, código desconocido no bloquea); `request_upgrade()` en BD; precios de pack en la migración `pack_codes` y `sync-db` que genera SQL; Worker `josecoded-api-preview`; **un único cron `*/5`** con despachador y Radar en tres trabajos; AI Gateway con presupuestos; GitHub App `josecoded-bot` y `deploy-content.yml` con guarda `last-deployed`; newsletter con grants por columna, trigger de transición, `send_lock` y runner endurecido; cookie `ref` con aceptación explícita; `pricing.json` bilingüe; CV con `<!-- id: -->` y campos públicos cerrados; fase 1 en dos ramas; catálogos por pantalla; puerta visual con `mask` y solo la home contra prototipo; **prototipos solo para home, Negocios y Contacto**; **WebGL en tablets grandes aceptado como desvío**; Workers Free hasta medir `cpuTime` en 0.1; hito «contenido completo» antes de la fase 3; NOT in scope explícito. Documentos: plan **v2.1**, DT **v1.4** (§0b), spec **v1.7**, newsletter **v1.2**, working-agreements **v1.1**.

- **2026-09-30 (respuestas de Jose a las cuatro preguntas del paso 5):**
  1. **Newsletter bilingüe:** cada número genera post y email en es y en en el mismo trabajo de Claude; el suscriptor recibe el de su idioma de alta (`locale` en la suscripción, cambiable desde preferencias); Jose revisa y aprueba las dos versiones en el admin; dos campañas de Brevo por número (una lista, atributo `LOCALE`); PR con dos ficheros; ratio de edición por idioma; LinkedIn solo es. Spec de newsletter **v1.1** (S4, Q2 reabierta; Q1, Q3–Q6 con las recomendaciones) y fase 10 del plan actualizadas.
  2. **Repo de josecoded privado:** el caso de estudio enlaza solo a la web y explica la arquitectura, sin `repoUrl` (spec §4, pantallas P8, plan 3.4).
  3. **Tolerancia del diff de capturas: 2 %** (`maxDiffPixelRatio: 0.02`), fijada en working-agreements §5 y tarea 2.13.
  4. **Auto-merge solo en `newsletter/*`** con `ci` + `newsletter-content-only` en verde y 0 revisiones requeridas; regla escrita en working-agreements §9 (S16). **n8n como orquestador o bot: evaluado y descartado** (spec de newsletter §7.5): no puede ejecutar la CLI de Claude sin cambiar el contenedor de n8n (prohibido) y crons, PR, Brevo y Telegram ya viven gratis y sin depender de Omen en el gateway y en `notify`; n8n solo como workflows opcionales. Ahorro admitido: el runner como segundo servicio en el `compose.yml` de `radar-runner`.

- **2026-09-29 (paso 5, documentos al día; `arquitecto`):**
  1. Spec v1.6: D27 stack visual (CSS Modules + tokens, motion CSS + TS, sin Tailwind/shadcn/GSAP), D28 Baseline 2024, D29 home v6, D30 pantallas y contenidos, D31 todo bilingüe, D32 área personalizada, D33 blog ≥ 3 artículos; §12 reescrita; lanzamiento sigue siendo todo junto.
  2. **Tarifas de Empresas confirmadas por Jose**: 40 €/h y feature cerrada desde 150 € se mantienen como formas de contratar (no packs); la celda Tarifas de la home no cambia; los packs de app van en Negocios.
  3. DT v1.3: `packages/glyph-scene` = port de `ref/home-v6/scene.js` a TS sin código muerto (Geist Mono, bloom 0.22, reflejo 0.35, verde 0); **WebGL solo en escritorio**, móvil vídeo + póster (desaparece `HERO_LIVE_MOBILE`); arte de Proyectos regenerado ≤ 60 KB; `design.json` → `tokens.css` con test de deriva y stylelint; `lib/motion/` como módulos puros; `messages/{es,en}.json` + `i18n:check`; **personalización del área con tabla aditiva `user_profiles` (señal de origen write-once, RLS propia) y RPC `security definer` `area_lead_summary()`**; cliente y lead se calculan en cada petición; `leads` sigue sin lectura para `authenticated`.
  4. Plan v2.0: fase 2 reescrita (paginado = hook, carrusel = componente, celda ampliada genérica, bento JSX, capturas comparadas en 2.13); 2.2 v1 eliminada; nueva **1.10 bloqueante** (tokens de INV §5); fase 3 en el orden de pantallas con prototipo validado por Jose antes de construir; 3.13 (componentes de interiores) y 3.14 (CV maestro → PDF); 4.2 regla de 3 artículos; 5.1 personalización; 9.3 retirada (sin métricas); **fase 10 newsletter** con las ramas de su spec §14 y notas de encaje (sin cambiar sus decisiones).
  5. UX v4.0: §2 y §4.1 v6; §3 y §4.2–4.10, §5.4, §6.1 con «superado por» hacia el documento de pantallas; UI v3 superada por `DESIGN.md`.

- **2026-09-29 (pantallas independientes, `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` v1.0):**
  1. Alcance: todo junto, como la spec (Radar y área incluidos); la prioridad del documento es orden de diseño y construcción, no de lanzamiento.
  2. Interiores: escenas con scroll libre (titular a dos tonos y bentos, sin 100svh ni paginado).
  3. Inglés: todas las páginas en es y en desde el lanzamiento, Negocios y área incluidas.
  4. Contacto: página `/contacto` con selector negocio/empresa y cierre corto en cada página.
  5. Sobre mí: profundidad media.
  6. Stack y CV: sección «Stack y formación» en Sobre mí + PDF es/en desde el CV maestro de Radar.
  7. Proyecto: caso de estudio medio.
  8. josecoded.com: caso propio en Proyectos.
  9. Tarifas de negocio: comparador dentro de `/negocios`.
  10. Packs de app (4.000 / 6.000 €): en Negocios («¿Necesitas una app?»); Empresas solo trabajo y freelancing, sin packs.
  11. Área privada: personalización automática (cliente → propuesta/lead → `?ref` → página de origen → neutra), sin preguntar.
  12. Blog: sale con un mínimo de 3 artículos reales; si no, se ocultan la sección y la entrada de la cabecera.
- **2026-09-29 (convenciones de trabajo, `docs/working-agreements.md`; resumen en `CLAUDE.md`):**
  1. Estilos: CSS Modules por componente que consumen solo tokens; sin Tailwind ni shadcn; stylelint prohíbe literales fuera del fichero de tokens.
  2. Tokens: `.impeccable/design.json` genera `tokens.css` con test de deriva; la guía de qué token usar vive en `DESIGN.md`.
  3. Motion: CSS nativo primero; JS propio mínimo en TypeScript; GSAP solo con justificación.
  4. Navegadores: Baseline 2024 + `@supports` para `animation-timeline`, View Transitions y `backdrop-filter`; tabla de fallbacks obligatorios que `qa` comprueba en Safari.
  5. Fidelidad: prototipo `home-v6` 1:1 (estructura y valores como tokens); React solo compone; desvíos marcados `deviation:` y decididos por Jose en el navegador.
  6. Validación: capturas app/prototipo a 360, 900 y 1440 comparadas por diff; `ui` revisa; Jose aprueba en preview antes del merge.
  7. Tests de UI: sin unit test en componentes sin lógica; TDD solo en lo que tiene comportamiento.
  8. Unidades: relativas para todo lo que escala con el texto, breakpoints en `rem`; `px` solo en hairlines, trazos, sombras, desenfoques y offsets de motion.
  9. Integración: PR por rama, squash merge, `main` protegida (paso manual de Jose en GitHub).
  10. Contenidos: un JSON de literales por idioma en `messages/{es,en}.json` (hechos bajo `facts.*`, sin `facts.json` aparte); ningún literal en componentes; `i18n:check` lista `{{DATO}}` y claves faltantes.
  11. Dependencias: pnpm siempre, nunca npm; solo las del plan; una extra con justificación de peso y alternativa nativa, la decide `revisor`.
  12. Documento: `docs/working-agreements.md` completo + 10 reglas duras en `CLAUDE.md`. Quedan obsoletas la tarea 2.2 del plan (Tailwind, shadcn, Sora/Manrope) y el GSAP de la spec §5; pendiente decidir `packages/glyph-scene` frente a `scene.js` de la v6 (working-agreements §12).
- **2026-09-29**: indicador de sección con líneas en el margen derecho (sin texto, activa más larga y violeta, oculto en el hero). Paginado por gesto, layout adaptativo por container queries y vida por celda. Repo indexado en codebase-memory con ADR.
- **2026-09-26/27**: Jose elige el **bento**, con secciones claras a pantalla, transiciones suaves y **Proyectos como carrusel fijado** → `home-v6`. Quitada «Esta web la he hecho yo». Resúmenes de cada página tras el hero en orden Sobre mí · Empresas · Negocios · Proyectos · Blog, igual que la cabecera; cabecera con Chat y Login destacado.
- **2026-09-25**: el hero se conserva; lo demás se rehace al estilo Raycast con un solo gesto por sección (fuera chorros, barridos, bordes iluminados, imanes y nube viajera: «básico y lioso»).
- **2026-09-24**: flujo de diseño obligatorio **taste-skill → impeccable → Emil** interconectados. Mundo índigo casi negro `#07060F`, texto lavanda, acción violeta `#7C6CFF`, verde solo para «disponible», Geist/Geist Mono. **Nivel estudio sin metáforas**, listón raycast.com + igloo.inc, **nada de métricas** (precios «desde» sí). Cristal y las direcciones «placa/plano/carteles» descartadas.
- **2026-09-19**: hero aprobado (D16) y **módulo Radar en v1** (D17–D26).
- **2026-09-17**: navegación clásica. Admin = `staff_members.role='admin'`; leads solo vía gateway.
- **2026-09-14**: tarifas v2 (packs 900 / 1.400 / 2.500 / 4.200 €, mantenimiento 49/149 €/mes) y afiliados (2 meses / 10 % / 20 %).
- **2026-09-13**: dos audiencias de igual peso, freelance sin marca de agencia, producto final v1, SEO + GEO, monorepo en Cloudflare Workers con OpenNext.
