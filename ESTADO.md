# Estado — josecoded

> **Reposicionamiento decidido por Jose el 2026-10-28** (identidad única freelance; `/servicios` con cuatro vías y cinco packs; `/partners` para agencias; chat por casos sin cuenta con contexto desde el CRM; CRM propio en `/admin`; Radar módulo del CRM y newsletter fuera del lanzamiento; blog técnico + `/lab`; home v7 con prototipo y gate). Documentos: **spec v2.0** (§0, D36–D47), **pantallas v2.0**, **plan v3.0**. Fase 0 y 1a hechas (PR #1); **fase 1b en curso en `chore/supabase`** (1.2, 1.3, 1.7 hechas; quedan 1.6, 1.8 en el Mac y 1.9 gate). **Prototipo `home-v7` aprobado por Jose el 2026-10-28** (tarea 2.0 hecha). Siguiente: cerrar 1b, arrancar **1c** (`chore/crm-schema`) y la fase 2 (port de la v7).

## Ahora

**Home: la referencia a portar es `ref/home-v7/`, aprobada por Jose en el navegador el 2026-10-28** (escenas Sobre mí · Servicios · Proyectos · Lab/Blog · ¿Empezamos?; la home es una muestra y la navegación va a pantallas propias, D48; destaque ámbar tostado `#e09c47`). Servir con `python3 -m http.server 8768 --directory docs/superpowers/design/ref` → http://localhost:8768/home-v7/?nointro. Qué cambia respecto a la v6 y decisiones aplicadas: `ref/home-v7/README.md` §10–§17. Lo que sigue describe la v6, cuya mecánica y sistema visual se mantienen.
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

Histórico de prototipos (no usar como base): `home-v6/` (base de la v7), `home-v5/` (variantes A/B/C que llevaron a la v6), `home-v4/` (ventana con dock), `hero-lab-3/` (hero aprobado original), `estilo/`, `eje/`, `ui-v3/`, `heros/`, `hero-lab`, `hero-lab-2`.

Documentos (al día con la v6 desde el 2026-09-29):

| Documento | Ruta | Versión |
|---|---|---|
| Spec | `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` | **v2.0** (2026-10-28: §0 reposicionamiento, D36–D47, modelo `crm_*`/`chat_*`, Q16–Q20 abiertas) · v1.7 (D27–D35) |
| Spec newsletter | `docs/superpowers/specs/2026-09-29-josecoded-newsletter.md` | **v1.2** (bilingüe, GitHub App, grants por columna; Q1–Q6 resueltas) |
| UX | `docs/superpowers/design/2026-09-17-josecoded-ux.md` | **v4.0** (§2 y §4.1 v6; interiores → documento de pantallas) |
| Diseño técnico | `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` | **v1.4** (§0b: cambios del eng review) |
| Sistema visual | `DESIGN.md` + `.impeccable/design.json` | v6 (`2026-09-17-josecoded-ui.md` v3 superado) |
| Componentes home | `docs/superpowers/design/2026-09-29-componentes-home-v6.md` | v1.1 |
| Pantallas y contenidos | `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` | **v2.0** (bloque v2.0: P20 `/servicios`, P21 `/partners`, P22–P23 `/lab`, P11 v2, CRM C1–C13) |
| Convenciones | `docs/working-agreements.md` | **v1.2** (§14 tipos, §15 componentes con variantes, §16 a11y por componente, §17 servicios/estado/formularios) |
| Plan | `docs/superpowers/plans/2026-09-19-josecoded-v1.md` | **v3.1** (2026-10-28: tarea **9.5b** repo público + gate «Jose cambia la visibilidad») · v3.0 (fase 1c, 2.0 gate home-v7, 3.2 `/servicios`, 3.3 `/partners`, 4.4 chat v2, 4.5 `/lab`, fase 6 CRM, Radar y newsletter tras 9.6) · v2.2 |
| Arquitectura (portada técnica, inglés) | `docs/architecture.md` + `README.md` | v1.0 (2026-10-28, PR #2) |

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
- [ ] **v3.0 (2026-10-28):** aprobar el prototipo `ref/home-v7/` en el navegador (2.0); **contexto inicial del chat por caso** (4 casos × es/en; se publica desde el CRM, 6.9); texto de `/partners` y decisión **Q16** (precio para agencias: recomendación «sin precio»); titular, frase por vía y FAQ por vía de `/servicios`; **dos demos del lab** y **tres guías largas** del blog; buzón `freelance@josecoded.com` activo (Email Routing, **Q18**) y URL de LinkedIn; `agencias.md` al día para la importación; decisiones **Q17** (mantener `/contacto` con cuatro vías), **Q19** (mentoría fuera del lanzamiento), **Q20** (CRM arranca solo con «Copiar», sin Gmail). Detalle en spec v2.0 §0.13 y plan v3.0 «Insumos».
- [ ] Los `{{DATO}}`: nombre a mostrar, ciudad, años, estado y descripción de 3catinfo/HazmeFila/Oportunix, certificaciones, WhatsApp y email, usuario de GitHub, enlaces de stores, plazo de respuesta real, artículos del blog.
- [ ] Radar: `content/radar/profile.json` y CV maestro es/en; proyecto OAuth de Google; alertas de LinkedIn; ≥ 12 correos reales anonimizados; cuentas en InfoJobs/Tecnoempleo/Upwork/Workana/Malt.
- [ ] Supabase: OAuth Google/GitHub, plantilla OTP **en es y en**, «leaked password protection», **«Confirm email» activo y cuenta SMTP propia para Auth (`cuenta@josecoded.com`)** (D35; gate 1.9/3.12).
- [ ] GitHub App `josecoded-bot` (newsletter, tarea 10.0) y comprobar el plan de GitHub del repo privado; `TELEGRAM_PING_TOKEN` en los secretos de Actions; AI Gateway con presupuestos por consumidor (3.12).
- [ ] GitHub: proteger `main` (working-agreements §9) antes del primer merge; la excepción de auto-merge solo para `newsletter/*` con checks `ci` + `newsletter-content-only` en verde y 0 revisiones requeridas (fase 10, tarea 10.6).
- [ ] Newsletter (fase 10, tras el lanzamiento): cuenta de Brevo y dominio autenticado, registros DNS, PAT fine-grained, `claude setup-token` para Omen (Q1), lista de fuentes (Q6), política de privacidad, 3–5 temas iniciales. Q1–Q6 de su spec **resueltas el 2026-09-30** (recomendaciones aceptadas; Q5: pie con nombre + baja + enlace al aviso legal, NIF y domicilio solo en el aviso legal, valores en la fase de datos) y auto-merge del PR de contenido confirmado (el clic de Aprobar es el OK).
- [ ] Cloudflare: `api.josecoded.com` como custom domain y URL `workers.dev` del gateway. Los servidores MCP de Cloudflare necesitan autorizarse (`/mcp` en una sesión interactiva).
- [ ] Corregir los ejemplos provisionales de `Comercial/voz.md`.
- [ ] **Perfiles freelance (2026-10-24)**: kit listo en el vault `Comercial/perfiles-plataformas.md` (14 plataformas en 3 tandas, 45 €/h ES · 50 $/h intl, 20–30 h/sem). Cuentas creadas (2026-10-26): Malt, SoyFreelance, Upwork, Workana, Conektium, Shakers, Codementor, Fiverr, Contra, Arc.dev, micro1. Falta: Get on Board; completar cada perfil con los textos del kit y sus `{{DATO}}` (§0); kit sin secciones de Fiverr, SoyFreelance y Shakers. Yeeply descartado (es suscripción de pago para empresas). Freelancer.com aplazado hasta que exista Radar.
- [ ] **Canales de captación (2026-10-27)**: Jose prioriza agencias/consultoras, clientes directos locales, productos propios (en marcha) y mentoría/formación; plataformas como base. Detalle y primeras acciones en el vault `Comercial/canales-captacion.md`. Toca a la web: Radar como seguimiento de agencias, demo de negocio local para `/negocios`, casos de HazmeFila y Oportunix, y decidir si la mentoría va en Empresas (tarifa pendiente en `tarifas.md`).
- [ ] **Buzones @josecoded.com (2026-10-24)**: guía en el vault `Comercial/buzones-josecoded.md` (freelance, novedades, bienvenida, proyectos, equipo, hola, privacidad, facturacion, cuenta, noreply → josecodeddev@gmail.com). Falta activar Email Routing en Cloudflare y sustituir el SPF de DonDominio. josecoded.com devuelve 521 a 2026-10-24.

**De la puerta de calidad de la fase 1a (2026-10-03), no bloquean la rama:**
- [ ] Tarea de **cabeceras de seguridad** antes de la fase 9 (CSP con nonce, HSTS en dominio propio, `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) con test E2E (revisor-seguridad M2).
- [ ] Acciones de GitHub fijadas por **SHA** + Dependabot; jscpd como devDependency fijada en lockfile (seguridad B2).
- [ ] `preview_urls: true` en `apps/web/wrangler.jsonc`: decidir en 1.9 (Access sobre previews o `noindex` y sin rutas sensibles como `/dev/ui`) (seguridad B5).
- [ ] Precios: cubrir los 36 `{{DATO}}` de `pricing.json` (inglés y «para quién») y que la pantalla diga «desde» y «sin IVA» antes de mostrarlos (3.3; usuario-ejemplo).
- [ ] `/business` sin `/en` da 404: valorar redirección a `/en/business` (usuario-ejemplo).
- [ ] Fase 2: media queries con sintaxis de rango (`width <= 67.5rem` / `width > 67.5rem`); tokens semánticos para huecos fluidos con `svh`/`vmin` (`.scene`, `.tour__sticky`, `.tcard`, `.close`) y paddings del hero/botón; decidir `color-mix` vs color relativo para la luz de `Cell` (ui).
- [ ] A11y fase 2: zona táctil del pager ≥ 24 px (44 recomendado) con pseudo-elemento; `--pager-idle` 1,61:1 necesita indicador no cromático o alfa ~0,55; pulgar de scroll a ~3:1 (`#5a4fb0` o `--pager-hover`); helper axe en 2.17 incluyendo los 404 (revisor-accesibilidad).

**De la revisión de la 1.7 (2026-10-24):**
- [ ] 1.8: el adaptador real de `ScheduledJobsRepo` debe implementar el nuevo `disable(name, reason)` (pone `enabled = false`; se usa cuando la fila tiene cron o tz imposibles). Un job desactivado se reactiva a mano tras corregir la fila.
- [ ] Desde el Mac: mirar en `josecoded-worker` si su 401 por token interno se distingue de otros 401 (cabecera o código en el envelope). Hoy el gateway reintenta cualquier 401 con `WORKER_INTERNAL_TOKEN_PREV`, así que un POST no idempotente (`/ai/admin-chat`) podría ejecutarse dos veces si el 401 viene de otra causa.
- [ ] `API_MODE: "development"` en el Worker de producción devuelve `details` de error hasta el corte a producción (DT §3.6).
- [ ] Un test del gateway que espera 403 falló una vez y pasó al relanzar: vigilar si es intermitente.
- [ ] El «Hecho cuando» de la 1.7 (`wrangler deploy --dry-run` y `curl` en `wrangler dev`) no se ha ejecutado en la nube: comprobarlo en el Mac.
- [ ] Sincronizar desde el Mac (no hay vault ni codebase-memory en la nube): nota del vault y ADR con el estado de la 1.7.

**Antes de hacer público el repo (tarea 9.5b del plan v3.1; gate «Jose cambia la visibilidad», antes de 9.6):**
- [ ] `apps/api/wrangler.jsonc`: fuera `account_id`, `ADMIN_SUPERUSER_ID` y `ADMIN_SUPERUSER_EMAIL` (a secretos/entorno); bloque `env.production` con `API_MODE=production`; test de wrangler ampliado.
- [ ] `apps/api/DEPLOY.md`, `apps/api/README.md`, `apps/api/infra/cloudflared/README.md`, spec §7/Q11/Q20 y DT §1.3/P14: sin correo de la cuenta de Cloudflare/Google, sin `account_id`, sin UUID del túnel ni rutas de disco de Omen (`/Volumes/...`). Valores al vault.
- [ ] Correo personal literal en código heredado: `apps/api/src/services/supabase.service.ts` (`DEFAULT_ADMIN_SUPERUSER_EMAIL`) y `admin-chat.pg-store.ts` (mensaje de error). Desvío de una línea aprobado por `revisor-seguridad`.
- [ ] Historial: sin tokens ni claves (escaneo 2026-10-28); correos e identificadores sí. **Decide Jose**: aceptar o `git filter-repo` una vez.
- [ ] «3catinfo» (NDA) en `PRODUCT.md`, `ESTADO.md`, spec, DT, PANT: **decide Jose** si se mantiene el nombre (recomendado; NDA sobre métricas y detalles) o se anonimiza. Alten y las agencias no están en el repo (comprobado).
- [ ] `.claude/` (rama `chore/supabase`): agentes sin rutas personales; skills de Emil Kowalski sin licencia en el repo → comprobar `emilkowalski/skills` y sacarlas si no permite redistribución; Vercel (MIT) con atribución. `.impeccable/` se queda (`review/` ya ignorado).
- [ ] `LICENSE` (**decide Jose**; recomendación: MIT para el código, todos los derechos reservados para marca, textos, diseño y medios), `SECURITY.md`, opcional `CODEOWNERS`.
- [ ] Al publicar: proteger `main` (GitHub Free lo permite en públicos; cierra el pendiente de working-agreements §9), confirmar que `preview.yml`/`deploy-production.yml` nunca corren con `pull_request` de forks, acciones por SHA + Dependabot (B2), cerrar `preview_urls` (B5).

**Heredados del gateway (revisión de 1.2, preexistentes; revisar en 1.7 y en la tarea de cabeceras de seguridad):**
- [ ] `apps/api/wrangler.jsonc` despliega `API_MODE: "development"`: con `DEV_API_KEY` puesto, `/api/dev/worker/*` quedaría activo en producción (`DEPLOY.md` §4 ya lo marca).
- [ ] `GET /system/status` de raíz es público y llama a Omen con el token interno.
- [ ] `/admin-chat/n8n/inbound` compara el secreto sin tiempo constante.
- [ ] Correos personales en `apps/api/wrangler.jsonc` (`ADMIN_SUPERUSER_EMAIL`) y `apps/api/DEPLOY.md`: moverlos a secretos → **absorbido por la tarea 9.5b** (repo público).

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
7. ~~Fase 0~~ y ~~Fase 1a~~ (PR #1). **Fase 1b en curso** en `chore/supabase`: 1.2, 1.3, 1.7 hechas; **quedan 1.6 y 1.8 (Supabase local, en el Mac) y 1.9 (gate con OK de Jose)**. No se le añade nada nuevo.
8. **Plan v3.0 (2026-10-28):** al mergear 1b → **1c** `chore/crm-schema` (1.11 migraciones `crm_*`/`chat_*`, 1.12 gate) en paralelo con **2.0** (`ui` hace `ref/home-v7/`; **Jose lo aprueba en el navegador**: gate) → fase 2 (port de la v7) → hito de contenido reducido → 3 (`/servicios`, `/partners`, contacto con cuatro vías, generador con cinco packs, proyectos, sobre mí, legales) → 4 (auth, blog de guías, `/lab`, chat por casos) → 5 (área) → 6 (CRM) → 8.1 → 9 (lanzamiento = público + área + CRM, sin válvula) → **7 Radar como módulo del CRM** → 10 Newsletter solo si Jose lo decide a los 3 meses con datos.
9. Camino crítico: 1.6 → 1.8 → 1.9 → 2.0 (OK de Jose) → 2.1 … 2.17 → 3.13 → 3.2 → 3.8 → 3.10 → 3.3 → 3.9 → 3.4 → 3.5 → 3.6 → 3.12 → 4.1 → 4.2 → 4.5 → 4.4 → 5.1 → 6.1 → 6.2 → 6.9 → 6.8 → 6.6 → 9.1 → 9.4 → 9.5 → 9.6.

Gates que no se cruzan sin OK explícito de Jose en la misma sesión: migraciones y deploys a producción, contratar servicios, tocar servicios preexistentes de Omen.

## Decisiones recientes

- **2026-10-28 — Prototipo `home-v7` aprobado (Jose, en el navegador; gate de la tarea 2.0):** con todas las propuestas del README §15 (CTA del hero «Servicios y precios» sólido + «Ver proyectos»; vías Por horas · Encargo a precio fijo · Packs de web y app · Abierto a empleo; «Para agencias» siempre visible en Servicios; CV como acción principal de la vía de empleo y en Sobre mí; P5 separado de P1–P4; Lab y Blog como dos enlaces; sin celda ampliada ⤢). **D48:** la home es una muestra; cabecera, ☰, ⌘K, pie y botones de cada celda llevan a pantallas propias. **Destaque** de los titulares a dos tonos: ámbar tostado `#e09c47` (token `highlight`). Los textos propuestos siguen pasando por `redactor` antes de entrar en `messages`.
- **2026-10-28 — Arquitectura enseñable en GitHub (`arquitecto`; en `main` desde el PR #2):** `docs/architecture.md` en inglés (visión, diagrama de contexto Mermaid, mapa del monorepo con lo *planned*, capas y reglas de dependencia de web y gateway, cómo se hacen cumplir, decisiones clave, dónde mirar primero) y `README.md` reescrito en inglés como portada (conserva la tabla de comandos). El repo sigue **privado hasta la tarea 9.5b** (plan v3.1), que sustituye la decisión «repo privado» del 2026-09-30 por «privado hasta limpiar y Jose cambia la visibilidad». Violaciones de la arquitectura descrita detectadas y **no arregladas** (se listan para decidir): (1) código heredado del gateway exento por lista literal en ESLint —`supabase.service.ts` y `forum.pg-store.ts` importan `@supabase/supabase-js` fuera de `adapters/`, las rutas heredadas importan servicios directamente en vez de `c.var.deps`, tipos compartidos en `apps/api/src/types/*`—; `adapters/` está vacío (`.gitkeep`) hasta 3.7; (2) `apps/web/i18n/route-rules.ts` (`RewriteRule`, `RedirectRule`), `i18n/pathnames.ts` (`Pathnames`) y `lib/locale.ts` (`LocaleParams`) exportan tipos usados por varios ficheros fuera de `@josecoded/types` (working-agreements §14.1 al pie de la letra); (3) deriva v3.0 en el código: ruta `app/[locale]/negocios/`, `pathnames` con `/empresas` y `/negocios`, catálogos `messages/*/{companies,business,newsletter}.json` (se resuelven en 3.2/2.1); (4) la CORS se construye inline en `apps/api/src/index.ts` en cada petición (heredado); (5) en `main` no existe `apps/api` aunque README y DT lo describen (se resuelve al mergear `chore/supabase`).

- **2026-10-28 — Reposicionamiento (Jose; spec v2.0 §0, D36–D47; pantallas v2.0; plan v3.0):** (D36) **identidad única: freelance**; se acaba la distinción empresas/negocios. (D37) **`/servicios`** única página de oferta con cuatro vías —por hora 40 €/h · proyecto cerrado desde 150 € · **cinco packs** (P1–P4 + **P5 App móvil desde 4.000 €**, ampliada 6.000 € como opción) · **abierto a contratación** (CV es/en, Cal.com, chat, LinkedIn/email)—; `/empresas` y `/negocios` → 301; el generador clasifica en cinco packs. (D38) **`/partners`** para agencias y consultoras con contacto rápido múltiple; será el enlace de los mensajes a agencias (`agencias-mensajes.md` deberá permitirlo). (D39) **Chat por casos sin cuenta** (`client`, `partner`, `recruiter`, `curious`; Turnstile + cuota por IP con `increment_quota`; módulo `assistant/*` y tablas `chat_*`; `admin-chat/*` queda intacto sin consumidor porque exige `user_id`). (D40) **El contexto de la IA por caso lo edita y publica Jose desde el CRM** (`chat_contexts`, versionado, un `published` por caso e idioma). (D41) **CRM propio en `/admin`**: contactos unificados (leads, clientes, agencias, reclutadores) con estado, historial, siguiente acción; importación de `agencias.md`; **mensajes con IA que Jose envía a mano** (nunca envío automático; Gmail solo borradores y solo con OAuth); leads y clientes heredados mapeados por FK nullable sin alterarlos. (D42) **Notion** solo guarda documentos comerciales (brief, propuesta, presupuesto) vía skills, enlazados por `notion_url`; el estado del contacto vive en el CRM; `/seguimiento` leerá del CRM más adelante (cambio en `claude-config`). (D43) **Radar = módulo del CRM, fuera del lanzamiento** (tras 9.6, sin válvula). (D44) **Blog técnico (guías largas) + `/lab`** (≥ 2 demos reales; si no, 404) como prioridad; **newsletter aplazada**, decisión a los 3 meses con datos; mientras, «Avísame» crea un contacto en el CRM. (D45) **Home v7**: Sobre mí · Servicios · Proyectos · Lab/Blog · ¿Empezamos?; prototipo nuevo `ref/home-v7/` que **Jose aprueba en el navegador antes de portar** (gate 2.0). (D46) **Lanzamiento = público + área de clientes + CRM**. (D47) vía «contratación» explícita. Plan v3.0: fase **1c** `chore/crm-schema` (1.11, 1.12) separada de `chore/supabase`; 3.2 = `/servicios`, 3.3 = `/partners`, 4.4 chat v2, 4.5 `/lab`, fase 6 = CRM (6.2 contactos, 6.6 hilos, 6.7 organizaciones e importación, 6.8 borradores con linter de reglas y test negativo de envío, 6.9 contextos). **Preguntas abiertas para Jose (spec §0.13):** Q16 tarifa para agencias en `/partners`, Q17 mantener `/contacto`, Q18 buzón `freelance@`, Q19 mentoría, Q20 Gmail en el CRM; se aplican las recomendaciones hasta que decida.

- **2026-10-24 — Paso a sesiones en la nube.** Fase 1b en `chore/supabase`: **1.2** (gateway movido a `apps/api`, contratos intactos, snapshot de 31 rutas) y **1.3** (tests en Vitest/workerd, Jest fuera, `__deps` solo con `__TEST_HOOKS__` en compilación y `TEST=1`) con `revisor` PASA; **1.7** implementada (CORS con comodín de previews, `routes-manifest`, cron único `*/5` con despachador `nextRun` y presupuesto de 40 subpeticiones, `env.preview` → `josecoded-api-preview`, `minify`) **pendiente de `revisor`**. Copiados a `.claude/` del repo los agentes, skills y plugins que usa el proyecto (`.claude/README.md`); la fuente sigue siendo `claude-config`. En la nube no hay vault, codebase-memory, `/cierre`, `/cerebro`, CLI de Supabase con sesión ni Docker: **1.6 y 1.8 necesitan el Mac** (o instalar Supabase CLI + Docker y que Jose haga `supabase login`).

- **2026-10-03:** **GitHub Free** con repo privado: no hay protección de ramas. Se sigue con PR por rama y squash por disciplina, con `revisor` como control; protección solo si se pasa a Pro. `main` se subió una única vez con los 44 commits de diseño antes del primer PR (OK de Jose). pnpm 11 en CI exige `allowBuilds` explícito en `pnpm-workspace.yaml` (en el Mac de Jose está `dangerouslyAllowAllBuilds` global, por eso en local no fallaba).

- **2026-10-03 — Fase 1a terminada en `chore/monorepo-base`** (tareas 1.1, 1.4, 1.5, 1.10; cada una con `revisor` PASA). **Puerta de calidad: PASA en la vuelta 2** (qa, revisor-seguridad, revisor-accesibilidad, usuario-ejemplo, ui). Arreglos de la puerta: 500 en rutas españolas profundas, 404 localizado con título y enlace, `<title>` en páginas, tokens de trazo y círculo, Next 16.3.6 (GHSA-vcvr-r3jv-pc5j), sin `x-powered-by`, fronteras de ESLint endurecidas (+ `@eslint-community/eslint-plugin-eslint-comments`), `undici ^7.29.1`, `.gitignore` de entornos. 251 tokens. Config `web-preview` en `.claude/launch.json` para aprobaciones en local.

- **2026-10-03 (Jose):** la página **404 se mantiene por idioma** (es/en según la URL), aunque el HTML de servidor sea un shell que completa el cliente al hidratar (sin JS se ve vacía; cada URL inexistente se renderiza en el Worker). Descartado el 404 estático bilingüe que proponía el `revisor`. Deuda aceptada y documentada.

- **2026-10-02 (Jose):** **`apps/web` en Workers Free** (junto al gateway), **sin código de medición de CPU**: el rendimiento se analiza con la web construida y en producción. Fase 0 cerrada. Aprobaciones en local hasta tener credenciales de Cloudflare en CI; workflows de preview y producción desactivados de momento.

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
