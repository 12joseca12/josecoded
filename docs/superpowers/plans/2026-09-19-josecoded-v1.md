# josecoded v1 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Fecha:** 2026-09-19 · **Perfil:** web · **Versión:** **3.4 (2026-11-01, Q21–Q24 decididas por Jose; D54 catálogo de precios desde el admin con extras y presupuestos a medida; DATOS v1.4 §14.12, PANT v2.2; tareas nuevas 3.1c, 3.7b, 6.16, 6.17; séptima migración)** · **3.3 (2026-11-01, closers como usuarios del CRM, historias de usuario del cliente y contenido editable por el admin; D51–D53; DATOS v1.3 §14, PANT v2.1; fase 6b con camino crítico de 3 días + día 4 de calidad y pentest)** · **3.2 (2026-10-28, Supabase desde cero en el proyecto nuevo; D49; `docs/superpowers/design/2026-10-28-datos-v2.md`, en adelante DATOS)** · **3.1 (2026-10-28, tarea 9.5b repo público)** · **3.0 (2026-10-28, reposicionamiento: identidad única freelance, `/servicios`, `/partners`, chat por casos, CRM, Radar y newsletter post-lanzamiento; spec v2.0, PANT v2.0)** · 2.2 (2026-09-30, batería de stack y metodologías; working-agreements v1.2) · 2.1 (2026-09-30, tras `/plan-eng-review`) · 2.0 (2026-09-29) · **Autor:** `arquitecto`
**Insumos:** spec **v2.0** (`docs/superpowers/specs/2026-09-13-josecoded-plataforma.md`; §0 manda), pantallas **v2.0** (bloque «v2.0» de `2026-09-29-pantallas-y-contenidos.md`, **PANT v2.0**), `ESTADO.md` de `main` y de `chore/supabase` (punto real), vault `Comercial/{canales-captacion,agencias,agencias-mensajes,tarifas}.md`; y los de v2.2: spec v1.7, UX **v4.0** (`docs/superpowers/design/2026-09-17-josecoded-ux.md`), diseño técnico **v1.4** (§0b recoge los cambios del eng review) (`docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md`, en adelante **DT**), `docs/working-agreements.md` v1.0 (**normativo**: si una tarea lo contradice, manda él), `DESIGN.md` + `.impeccable/design.json` (sistema visual v6), inventario `docs/superpowers/design/2026-09-29-componentes-home-v6.md` v1.1 (**INV**), pantallas `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` v1.0 (**PANT**), prototipo `docs/superpowers/design/ref/home-v6/`, spec de newsletter `docs/superpowers/specs/2026-09-29-josecoded-newsletter.md` **v1.2** (fase 10), `docs/working-agreements.md` **v1.1**, `ESTADO.md`, `Comercial/tarifas.md` v2. El documento de `ui` v3 (`2026-09-17-josecoded-ui.md`) **queda superado** por `DESIGN.md` y no es insumo de ninguna tarea.

## Changelog v3.4 (2026-11-01, Q21–Q24 decididas por Jose; spec v2.3 §0.14 y D54; DATOS v1.4 §14.12; PANT v2.2)

**Decisiones de Jose (2026-11-01, tarde):** **Q21** la comisión es un % de lo cobrado por el proyecto; la tasa de cada closer la fija el admin **al crear su perfil** (campo obligatorio de la invitación) y cada comisión **congela** el % vigente al crearse. **Q22** las filas del CSV que chocan con un contacto de otra cartera van a una **cola de conflictos que resuelve el admin** (mantener · asignar al importador · fusionar · descartar); el importador solo ve «N pendientes». **Q23 → D54 (cambia la recomendación):** el admin **muestra/oculta, crea, borra y modifica packs y precios**, mantiene un **catálogo de extras** y hace **presupuestos a medida** solo con extras (suma; descuento solo admin). La fuente de precios pasa de `pricing.json` a **Supabase**, publicada como `content/pricing.json` por el mismo circuito D53 (el público sigue estático). **Q24** TOTP obligatorio también para closers (`aal2` en `requireStaff` web y gateway; RLS no ve `aal`).

| # | Cambio | Tareas |
|---|---|---|
| 1 | **Esquema**: `staff_invites.commission_rate` obligatoria; `crm_import_conflicts` + RPC de resolución; migración 7 `20261101100600_pricing_catalog.sql` (`packs`/`pack_options`/`extras` ampliadas, `pricing_settings`, `pricing_price_history`, `custom_quotes`, `custom_quote_items`, RPC `admin_pricing_*`, `pricing_catalog_snapshot`, `pricing_published`, `quote_*`, `content_publish` con precios); seed con conflicto, pack oculto y presupuesto; 17 migraciones, 36 tablas | **1.8e**, **1.9c** adendas |
| 2 | **Fuente de precios**: `@josecoded/pricing` lee `content/pricing.json` (movido desde `packages/pricing/pricing.json`); `pricing:sync` retirado; `pricing:sync-db` = carga inicial con guarda; `pricing:pull` nuevo; `settings.prices` solo `showPrices` | **3.1c** nueva (F2, día 1); 1.4, 3.1b, 3.2, 1.9 paso 10, 9.4 paso 1 adendas |
| 3 | **Gateway lee la publicación**: puerto `PricingSource` → `pricing_published()` (caché 5 min) para generador, `ai-guard` y `pricingVersion`; middleware `requireStaff` con `aal2` | **3.7b** nueva (D, día 2); 3.7, 3.8b, 3.8c adendas |
| 4 | **D2 Precios**: packs, opciones, extras, tarifa, historial, banda «sin publicar», mismo botón Publicar | **6.16** nueva (F2, día 3) · 6.15a adenda (sin lista de packs en Secciones) |
| 5 | **K3 Presupuestos a medida** | **6.17** nueva (F3, día 3; recortable por detrás de 6.14) |
| 6 | **K4 conflictos**: «N pendientes» para el importador, pestaña Conflictos del admin con cuatro acciones | **6.10** adenda |
| 7 | **D1**: tasa obligatoria al invitar, columna TOTP; **K5**: % congelado por fila | 6.13, 6.11 adendas |
| 8 | Área y admin leen el pack del cliente de las **tablas** (un pack oculto o borrado sigue mostrándose a quien lo tiene) | 5.4, 6.4 adendas |
| 9 | Pentest: fichero público sin ocultos ni descuentos; `update packs` directo → 42501; `aal1` de closer → 403 en el gateway | 9.7 adenda |
| 10 | Regla «Precios solo desde `packages/pricing/pricing.json`» → «Precios solo desde el catálogo de Supabase publicado en `content/pricing.json` (web) y `pricing_published()` (gateway)» | reglas de este plan; `CLAUDE.md` (scripts `pricing:*`) se actualiza desde el Mac |

**Camino crítico v3.4 (sustituye al de v3.3).** Día 1: `1.8e` (ahora con la migración 7: +2 h) → **`1.9c` (gate, tarde, incluye la carga inicial del catálogo)** ‖ `6.0b` (`ui`) ‖ `3.1b` → **`3.1c`** (F2) ‖ `3.8b` (D) ‖ `6.0` (F1). Día 2: `6.1` → `6.2` → `6.10` (F1, con la cola de conflictos: +3 h) ‖ `6.15a` (F2) ‖ `6.13` (F3) ‖ `5.6` (E) ‖ **`3.7b`** → `3.8c` (D). Día 3: `6.11` → `6.12` (F1) ‖ **`6.16`** → `6.15b` (F2) ‖ **`6.17`** → `6.14` (F3) ‖ `9.1`, `9.2` (A/B) ‖ **`9.4` (gate, tarde)**. Día 4: **`9.7`** → arreglos → **`9.6`**. **Orden de recorte si el día 3 no llega:** 6.14 → 6.15b Blog → Telegram de K7 → **6.17** (el esquema ya está; el presupuesto se hace en Notion hasta que exista la pantalla) → 6.15b FAQ/Proyectos. **Nunca se recorta:** 1.8e, 1.9c, 3.1c, 3.7b, 6.0–6.2, 6.10 (incluida la cola del admin), 6.11 lectura, 6.12, 5.6, 6.13, 6.15a, **6.16**, 3.8b, 3.8c, 9.7.

**Riesgo nuevo para los 3 días (honesto):** D54 añade ~1,5 días-persona (3.1c ½, 3.7b ¼, 6.16 ½, 6.17 ½, más 1.8e y 6.10) sobre un plan que ya iba justo. Cabe porque F2 tenía hueco el día 1 (solo 3.1b), D el día 2 (solo 3.8c) y F3 el día 3 (solo 6.14, recortable), y porque 6.17 es recortable; **lo que no cabe si algo se retrasa es 6.15b y 6.14**, que ya estaban marcadas. Si el día 2 termina con 6.10 sin la cola de conflictos, el día 3 F1 empieza por ella antes de 6.11 (las filas en conflicto no pueden quedar atascadas en producción).

## Changelog v3.3 (2026-11-01, closers, historias de usuario y contenido editable; spec v2.2 §0.14 D51–D53; DATOS v1.3 §14; PANT v2.1)

**Decisiones de Jose (2026-11-01):** lanzamiento en **3 días + 1 día de revisión y pentest**; Radar después. (D51) **Los closers vuelven** como usuarios del CRM que solo el admin habilita, con datos globales y cartera propia (`crm_contacts.owner_id`), importación CSV, invitación al portal y comisiones que el admin aprueba y paga. (D52) El cliente propone **historias de usuario** que admin/closer aceptan, estiman y convierten en tareas. (D53) El admin **edita textos es/en, FAQ, proyectos, posts y secciones/visibilidad de precios** con vista previa, publicación y vuelta atrás: Supabase edita, el repo publica (commit del bot `josecoded-bot` desde el gateway), las páginas siguen estáticas. (4) El admin controla también el equipo y las **reglas de notificación** (Telegram por evento y destinatario; los closers reciben lo de su cartera). (5) SEO/GEO: nota honesta en la spec §0.14 y tareas medibles en 9.4/9.6.

**Punto real de partida (2026-11-01):** carriles en marcha **A** (home v7, fase 2), **B** (SEO/headers: 2.11, cabeceras de seguridad), **D** (gateway: 3.7 propuestas, 3.8 leads, 4.4 chat) y **E** (auth 4.1 + área 5.x). Este changelog **no toca** lo que esos carriles tienen en curso; añade el carril **F** (CRM/closers/contenido, hasta tres implementadores en paralelo sobre ficheros disjuntos: **F1** CRM, **F2** contenido, **F3** equipo/notificaciones) y cuelga de **D** y **E** dos tareas pequeñas cada uno.

| # | Cambio | Tareas |
|---|---|---|
| 1 | **Esquema aditivo D51–D53** (DATOS §14.7: seis migraciones `20261101…`, políticas de `crm_*`/`clients` reemplazadas, seed con `carla@test` closer y `dani@test` closer desactivado, matriz RLS de §14.3) y **gate** en producción | **1.8e** nueva, **1.9c** gate nuevo |
| 2 | **Zona `/crm` compartida por admin y closers** (PANT v2.1 K1–K7); `/admin/crm/*` desaparece antes de nacer; `/admin` queda para lo exclusivo del admin | **6.0**, **6.0b** (`ui`), 6.1 y 6.2 **reescritas** (adenda v3.3), **6.10** importar CSV, **6.11** comisiones, **6.12** clientes + decisión de historias, **6.13** equipo, **6.14** notificaciones |
| 3 | **Historias de usuario** en el área (A8) | **5.6** nueva (carril E) |
| 4 | **Contenido editable** (D2): build con overrides, editor, Draft Mode, publicar/rollback; gateway commitea con la GitHub App y vigila el despliegue | **3.1b** build, **6.15a/6.15b** web, **3.8c** gateway |
| 5 | **Notificaciones por reglas** y correos transaccionales de plantilla fija (`client.invited`, `staff.invited`, `story.decided`), vinculación de Telegram por código | **3.8b** gateway (carril D), 6.14 web |
| 6 | **Día 4: puerta de calidad + pentest ligero** con lista cerrada; SEO medible en el gate (Search Console, Bing, IndexNow, línea base GEO) | **9.7** nueva; 9.4, 9.5, 9.6 adendas |
| 7 | Regla de trabajo: «textos solo en `messages`» pasa a «`messages` + `content/overrides` validados por `i18n:check`» (working-agreements §10, spec D53) | 3.1b, 6.15a |

**Camino crítico de 3 días (+1).** Día 1: `1.8e` → **`1.9c` (gate, tarde)** ‖ `6.0b` (`ui`, medio día, Jose valida en el navegador) ‖ `3.1b` (F2) ‖ `3.8b` (D) ‖ `6.0` (F1, tras 4.1 de E). Día 2: `6.1` → `6.2` → `6.10` (F1) ‖ `6.15a` (F2) ‖ `6.13` (F3) ‖ `5.6` (E, tras 5.2) ‖ `3.8c` (D). Día 3: `6.11` → `6.12` (F1) ‖ `6.15b` → `6.14` (F2/F3) ‖ `9.1`, `9.2` (A/B) ‖ **`9.4` (gate, tarde)**. Día 4: **`9.7`** (puerta + pentest) → arreglos → **`9.6`** (gate de lanzamiento). **Qué se recorta si el día 3 no llega** (PANT v2.1 §4): 6.14 (las reglas quedan sembradas), 6.15b Blog, vinculación de Telegram de K7 (el admin pega el `chat_id` en D1). Nunca se recorta: 1.8e, 1.9c, 6.0–6.2, 6.10, 6.11 lectura, 6.12, 5.6, 6.13, 6.15a, 3.8b, 3.8c, 9.7.

**Preguntas abiertas (spec §0.14):** ~~se aplica la recomendación~~ → **decididas por Jose la tarde del 2026-11-01; ver changelog v3.4** (Q21 tasa fijada al crear el closer y congelada por comisión; Q22 conflictos al admin; Q23 el admin edita precios, packs, extras y presupuestos → D54; Q24 TOTP para closers). El camino crítico de este changelog queda **sustituido** por el de v3.4.

## Changelog v3.2 (2026-10-28, Supabase desde cero; spec D49; DATOS v1.0)

**Decisión de Jose:** el proyecto Supabase heredado `nrgrmymsjtgayzejtawa` se abandona (sin acceso desde su cuenta actual); se usa el proyecto **nuevo y vacío** `echlwywbucgbhwpncviy` (`josecoded`, eu-west-1, Postgres 17). Nada se migra. Diseño del esquema: **DATOS** (`docs/superpowers/design/2026-10-28-datos-v2.md`), que sustituye a DT §6 y a spec §0.6 en lo que se contradigan.

**Qué cambia:**

| # | Cambio | Tareas |
|---|---|---|
| 1 | **Sin baseline de producción.** Las migraciones del repo son la fuente; `supabase start` las aplica desde cero. Desaparecen `supabase/schema/`, `scripts/supabase-baseline.sh`, `supabase/scripts/baseline-meta.ts`, `supabase/test/baseline.test.ts` y la regla «cada gate regenera el baseline» | 1.6 reescrita; 1.9, 1.12, 7.7, 10.1 pierden el paso de baseline |
| 2 | **Esquema v2 en inglés, diseñado para la spec v2.0** (DATOS §4): `staff_members`, `user_profiles`, `packs`/`pack_options`/`extras`, `crm_organizations`, `crm_contacts`, `leads` (oportunidades de un contacto), `crm_interactions`, `crm_message_templates`, `crm_message_drafts`, `clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_extras`, `upgrade_requests`, `affiliates`, `affiliate_rewards`, `blog_comments`, `chat_contexts`, `chat_threads`, `chat_messages`; `private.quota_counters`, `private.scheduled_jobs`, `private.outbox`. Sin `forum_*`, `blog_posts`, `admin_chat_*`, `lead_assignments`, `commission_entries`, sin `crm_contacts_view` ni `affiliate_leads_view` (RPC `affiliate_leads()`) | 1.8 reescrita y partida en **1.8a** (identidad, catálogo, CRM, área, afiliados, comentarios), **1.8b** (chat), **1.8c** (gateway: adaptador Supabase, outbox, retirada de rutas) |
| 3 | **La fase 1c se funde en la 1b**: 1.11 y 1.12 quedan superadas (su contenido está en 1.8a/1.8b y 1.9). La rama `chore/crm-schema` no se crea | 1.11, 1.12 marcadas «(v3.0, superada)»; ramas y camino crítico |
| 4 | **Notificaciones por `private.outbox` + gateway** (DATOS §8.4; Q2): sin `pg_net`, sin Edge Function `notify`, sin `vault.notify_shared_secret`. Los eventos `lead.created`, `comment.pending`, `asset.uploaded`, `upgrade.requested`, `chat.visitor_message` se drenan en el job `outbox.drain` del cron `*/5`; los que nacen en el gateway se notifican además en la misma petición | 1.8c (drenaje), 3.8 (`POST /notify/lead` y `notifyLead` pasan a ser internos del gateway), 3.12 y 9.4 (sin `supabase functions deploy`), 10.2 (eventos `newsletter.*` en el outbox) |
| 5 | **Rutas heredadas del gateway sin tabla**: `forum/*` y `admin-chat/*` **se retiran** (Q1; DATOS §9); `supabase.service.ts` pasa a `adapters/supabase.ts`; `v1-protected`, `health`, `system` se mantienen | 1.8c; restricción global «rutas intactas» reescrita; 9.5b pierde tres pendientes (correos literales, `n8n/inbound`) |
| 6 | **Auth del proyecto nuevo** (DATOS §8.1): Google + GitHub + OTP sin contraseña (Q4), confirmación obligatoria (D35), SMTP propio (Q5), Turnstile en Auth, **TOTP para admin** (Q3), plantillas es/en versionadas en `supabase/templates/` | 1.9 (configuración en el gate), 4.1 (login sin contraseña; `requireAdmin()` exige `aal2`), 6.1 (guard admin con `aal2`) |
| 7 | **Gate 1.9 contra el proyecto nuevo**: `supabase link` + `supabase db push` (el repo es la fuente), configuración de Auth/API/Storage, alta de Jose como admin, variables y secretos de web, gateway (prod y preview) y Omen, `get_advisors` limpio, sin baseline | 1.9 reescrita |
| 8 | **Tabla de equivalencias** para las tareas 5.x y 6.x escritas contra nombres heredados: `pack_templates`→`packs` (`code` PK), `pack_extras`→`extras`, `client_pack_extras`→`client_extras`, `leads.estado/fuente/monto/notas`→`status/source/amount/owner_note (en el contacto)`, `clients.project_phase` valores en inglés, `staff_members.role` enum, `admin_counters()` con los 7 contadores de DATOS §6 desde el principio | 5.1–5.5, 6.1–6.9, 7.6 (`radar_applications.contact_id` desde la primera migración), 9.1 |

**Qué se reutiliza de `chore/supabase` (commits 53329bc…7888c1a):** `supabase/config.toml` (editado), `supabase/package.json`, `tsconfig.json`, `supabase/test/migrations.test.ts` (lista nueva + reglas de DATOS §10.2), `apps/web/tests/helpers/supabase-test-clients.ts` (sin cambios), estructura y helpers de `apps/web/tests/rls.test.ts`, `packages/types/src/db.ts`, `packages/types/test/database-drift.test.ts`, script `db:types`, `apps/api/src/adapters/scheduled-jobs.ts` (+ handler `outbox.drain`), `apps/api/wrangler.jsonc`, reglas ESLint de fronteras; el SQL de `quota_counters`, `scheduled_jobs`, `user_profiles` (guard), `affiliates` (trigger de código), `upgrade_requests` (`request_upgrade`), `client_access_claim`, `admin_close_lead_paid`, `admin_counters` y `blog_comments` se copia adaptando nombres. **Se rehace:** las 13 migraciones como una serie nueva `20261028…`, `seed.sql`, `rls.test.ts`. **Se borra:** `supabase/schema/`, `scripts/supabase-baseline.sh`, `supabase/scripts/baseline-meta.ts`, `supabase/test/baseline.test.ts`, `supabase/functions/notify/`, `20260917100700_notify_lead_event.sql`, `[functions.notify]` del `config.toml`, `apps/api/src/services/forum*`, `admin-chat*`, `supabase.service.ts`.

## Changelog v3.1 (2026-10-28, repo público)

Jose quiere poder enseñar el código en GitHub (hoy el repo es privado; la decisión de 2026-09-30 de «repo privado» pasa a «privado hasta 9.5b»). Se añade la **tarea 9.5b — Repo público: limpieza y GATE «Jose cambia la visibilidad»**, entre la puerta final (9.5) y el lanzamiento (9.6), con la lista concreta de lo que hay que sacar o mover antes de publicar (secretos e identificadores de cuenta en `apps/api/wrangler.jsonc` y `DEPLOY.md`, `API_MODE`, correos personales, licencia, `.claude/`, nombres bajo NDA en documentos). Documentación para visitantes: `docs/architecture.md` (inglés) y `README.md` reescrito en inglés como portada; ambos sin commitear hasta que Jose los vea. Ninguna otra tarea cambia.

## Changelog v3.0 (2026-10-28, reposicionamiento; spec v2.0 §0, D36–D47; PANT v2.0)

**Punto real de partida.** Fase 0 y fase 1a hechas y mergeadas (PR #1). **Fase 1b en curso en `chore/supabase`**: 1.2, 1.3 y 1.7 hechas y revisadas; quedan 1.6 y 1.8 (Supabase local en el Mac) y 1.9 (gate de producción). Este plan **no toca `chore/supabase`**: la 1b se cierra tal cual estaba y todo lo nuevo de esquema va a una fase **1c** propia.

**Qué cambia (resumen; detalle por tarea con la marca «v3.0»):**

| # | Cambio | Tareas |
|---|---|---|
| 1 | **Identidad única freelance; `/servicios` con cuatro vías y cinco packs; `/empresas` y `/negocios` → 301** (D36, D37, D47) | 3.2 reescrita (`/servicios`), 3.3 reasignada (`/partners`), 3.13 (prototipo de P20 en vez de P1), 3.7/3.9 (cinco packs, `P5` con opción `plus`), 3.10 (`/contacto` con cuatro vías), 1.4 (adenda: `pricing.json` con P5), 9.1 (solo josedev; los 301 de `/empresas`/`/negocios` van en 3.2) |
| 2 | **`/partners`** para agencias (D38) | 3.3 nueva; `QuickContact` compartido con el chat |
| 3 | **Chat por casos sin cuenta** con módulo `assistant` y tablas `chat_*`; **contexto por caso desde el CRM** (D39, D40) | 1.11 (migraciones), 4.4 reescrita (gateway + web), 6.9 (editor de contextos), 6.6 reescrita (hilos + takeover) |
| 4 | **CRM propio en `/admin`** (D41, D42): contactos, organizaciones, importación de `agencias.md`, mensajes con IA que Jose envía a mano | 1.11, 1.12 (gate), fase 6 reescrita (6.1 adenda, 6.2, 6.6, 6.7, 6.8, 6.9), 3.8 (adenda: `POST /leads` crea el contacto) |
| 5 | **Radar = módulo del CRM, fuera del lanzamiento** (D43) | Fase 7 completa tras 9.6; 7.6 añade `contact_id`; 7.25+ bajo `/admin/crm/radar`; sin válvula por fecha |
| 6 | **Blog técnico (guías) + `/lab`**; newsletter aplazada y reevaluada a los 3 meses (D44) | 4.2 adenda, **4.5 nueva** (`/lab`), 2.15 (escena Lab/Blog), fase 10 adenda |
| 7 | **Home v7** con prototipo nuevo y **gate de aprobación de Jose** (D45) | **2.0 nueva** (prototipo + gate), 2.3, 2.14 (escena Servicios única), 2.15, 2.16, 2.17 adendas |
| 8 | **Lanzamiento = público + área + CRM** (D46) | Orden de fases, camino crítico, 9.4–9.6 |

**Numeración:** se conservan los números existentes; las tareas sustituidas quedan con su texto marcado **«(v2.2, superada)»** debajo de la versión v3.0 para no perder el historial ni las referencias. Nuevas: 1.11, 1.12, 2.0, 4.5, 6.7, 6.8, 6.9.

**Goal (v3.0):** Publicar josecoded v2 (público con identidad única freelance, `/servicios`, `/partners`, blog técnico + `/lab`, chat por casos; área de clientes; CRM propio en `/admin`) en Cloudflare Workers sobre el gateway, Supabase y Omen existentes, sin reescribir nada heredado; Radar (módulo del CRM) y newsletter después, sobre la misma producción.


## Changelog v2.0 (2026-09-29)

- **Fase 2 reescrita** contra `ref/home-v6/`: bento por escenas con container queries, paginado por gesto (hook `usePagedScroll` sobre `lib/motion/paging.ts`), carrusel fijado de Proyectos (componente `ProjectsTour`), celda ampliada genérica con View Transitions, `Bento` por composición JSX, capturas comparadas app/prototipo (2.13). La 2.2 de la v1 (Tailwind, shadcn, Sora/Manrope) **desaparece** y su número lo ocupa la tarea de `globals.css` + fuentes Geist + primitivas. La 2.13 de la v1 (`HERO_LIVE_MOBILE`) desaparece: móvil es siempre vídeo + póster.
- **Fase 1:** 1.1 añade `packages/design-tokens`, stylelint en `@josecoded/config` y los scripts `tokens:build`, `visual`, `i18n:check`; **nueva 1.10 (bloqueante de toda la fase 2)**: completar `.impeccable/design.json` con los tokens que faltan (INV §5) y generar `tokens.css` con test de deriva; 1.8 añade la migración `user_profiles` (DT §1.12).
- **Fase 3 reordenada** según PANT §4 (orden de diseño y construcción, no de lanzamiento) sin renumerar: tabla «Orden de construcción» al inicio; cada tarea de pantalla incluye `/impeccable shape` + prototipo en `ref/` + aprobación de Jose en el navegador antes de construir, y capturas comparadas + aprobación en preview al terminar. 3.2 (Empresas solo trabajo y freelancing, tarifas confirmadas), 3.3 (comparador + «¿Necesitas una app?»), 3.4 (casos de estudio medios + josecoded.com), 3.5 (Sobre mí profundidad media + «Stack y formación»), 3.10 (`/contacto` con selector y cierre corto) reescritas; **nuevas 3.13** (componentes compartidos de interiores + prototipo de P1) y **3.14** (CV maestro + PDF es/en).
- **Fase 4:** 4.1 registra la señal de origen del área; 4.2 aplica la regla de los 3 artículos. **Fase 5:** 5.1 personalización automática. **Fase 9:** 9.3 (`perf.json`) retirada (sin métricas en la web).
- **Todo bilingüe** (spec D31): cada tarea de pantalla entrega `es.json` y `en.json` y pasa `i18n:check`.
- **Nueva fase 10 — Newsletter** (post-lanzamiento) con las ramas del §14 de su spec y las notas de encaje con lo decidido el 2026-09-29.
- **pnpm siempre**: ninguna tarea usa `npm` ni `npx` (`pnpm dlx`).
- Todas las decisiones anteriores (v1.0) que no se citan siguen vigentes; nada se borra, se marca «superado».

**Goal (v2.2, superado por el Goal v3.0 de arriba):** Publicar josecoded v1 completa (público + área de clientes + admin + Radar) en Cloudflare Workers sobre el gateway, Supabase y Omen existentes, sin reescribir nada heredado.

**Architecture (v3.0 añade:** módulo `assistant` y rutas `crm/*` en el gateway con puertos y adaptadores; tablas aditivas `crm_*` y `chat_*`; `packages/crm-rules`; `admin-chat/*` heredado sin consumidor; Radar como módulo del CRM post-lanzamiento**).** Monorepo pnpm con `apps/web` (Next.js 16 App Router en Workers vía OpenNext, sin middleware Node), `apps/api` (el gateway Hono existente, movido, con rutas aditivas y Cron Triggers), `packages/{config,pricing,glyph-scene,radar-core,radar-connectors}` y `supabase/` (baseline de solo lectura + migraciones aditivas). El único WebGL es `packages/glyph-scene`, cargado por `import()` tras el LCP. Radar vive en el gateway (núcleo, cron, Telegram, Google) con conectores enchufables que también corren en Omen (`radar-runner`) y en el Mac (`/radar-indeed`).

**Tech Stack:** pnpm 11.2.2 · Node 22 · turbo 2.10 · Next 16.3.5 · React 19.3 · `@opennextjs/cloudflare` 1.20.6 · wrangler 4.133 · **CSS Modules + tokens generados desde `.impeccable/design.json` (`packages/design-tokens`) + stylelint** · **motion en CSS nativo + `lib/motion/` en TypeScript (sin GSAP, Tailwind ni shadcn; spec D27)** · Baseline 2024 con `@supports` (D28) · three (versión fijada en 0.2) · next-intl 4.14 · `@next/mdx` · `@supabase/ssr` 0.12 / `supabase-js` 2.116 · Hono 4.13 · zod 4.6 · Vitest 4.1.11 + `@cloudflare/vitest-pool-workers` 0.22 · Playwright 1.63 (Chromium + WebKit) · Lighthouse CI 0.15 · TypeScript 5.9.3. Versiones completas en DT §1.2.

## Changelog v2.2 (2026-09-30, batería de stack y metodologías de producción)

Jose respondió las 12 preguntas eligiendo la opción recomendada en todas; en «Lint extra» marcó fronteras de import, orden de imports y `jscpd`, y **no** las reglas TypeScript extra. Normativa en `docs/working-agreements.md` v1.2 (§14–§17, §11 y §13); aquí solo aterriza por tarea con la marca **«v2.2 (stack)»**. **La fase 0 no cambia** (los spikes no se mergean y no crean tipos ni componentes compartidos).

| # | Decisión | Tareas |
|---|---|---|
| 1 | `packages/types` (`@josecoded/types`): barrel + un fichero por dominio; ningún tipo compartido fuera | 1.1, 7.1 (`radar.ts` reexportado), 10.1 |
| 2 | zod como fuente en las fronteras (`packages/types/src/schemas/`), tipos por `z.infer` | 1.1, 1.4, 1.5, 3.7, 3.8, 3.9, 3.10 |
| 3 | `supabase gen types --local` → `packages/types/src/database.ts` commiteado + test de deriva; helpers `db.ts` | 1.6 (y cada migración: 1.8, 7.6, 10.1) |
| 4 | Claves tipadas: `AppConfig` de next-intl y `tokens.ts` (`TokenName`, `readToken`) | 1.5, 1.10 |
| 5 | Variantes como uniones + `data-*`; sin CVA/clsx; regla de partición por rol/raíz/slots | 2.2 (y todo componente posterior) |
| 6 | Polimorfismo por `href` con unión discriminada | 2.2 |
| 7 | A11y por componente: contrato en la tarea, `lib/a11y/`, `vitest-axe` + `@axe-core/playwright` bloqueantes | 2.2, 2.17 y todo E2E de escena o pantalla |
| 8 | Estado en cliente sin librería: `ShellProvider` único | 2.2 (provider), 2.16 (paleta y menú lo consumen) |
| 9 | Formularios: Server Actions + `useActionState` + `Form`/`Field` | 3.9, 3.10 (y 4.x, 5.x, 6.x, 7.25–7.29, 10.4, 10.5 reutilizan) |
| 10 | Gateway nuevo con puertos y adaptadores, `buildDeps(env)`, falsas en memoria; heredado intacto | 1.2, 1.3, 3.7, 3.8, 7.16–7.24, 10.2 |
| 11 | Catálogo `/dev/ui` en la app (sin Storybook), 404 en producción | 2.2 |
| 12 | Lint: `no-restricted-imports` de fronteras, `eslint-plugin-import-x`, `jscpd` en CI; sin reglas TS extra | 1.1 |

## Changelog v2.1 (2026-09-30, 41 hallazgos de `/plan-eng-review` decididos por Jose)

Se acepta la opción recomendada salvo donde se indica. Cada punto dice en qué tarea aterriza; el detalle técnico está en DT v1.4 §0b, la spec v1.7 (D34, D35), la spec de newsletter v1.2 y working-agreements v1.1. Las adendas por tarea llevan la marca **«v2.1 (eng review)»**.

| # | Decisión | Tareas |
|---|---|---|
| 1 | `claim_client_access` y `area_lead_summary` exigen email confirmado, `revoke from anon`, `limit 1 for update`; test con usuario sin confirmar; 1.9 comprueba «Confirm email». **SMTP propio en Supabase Auth** desde @josecoded.com (DNS e insumo) | 1.8, 1.9, 4.1, 3.12 |
| 2 | `deploy-content.yml` con guarda `last-deployed`; CI reducido para `newsletter/*` | 1.9, 10.2 |
| 3 | GitHub App `josecoded-bot`; check de alcance en todos los PR; fusión por el gateway si el plan de GitHub no lo permite | 1.9, 10.0, 10.2, 10.6 |
| 4 | Newsletter: grants por columna, inserts solo service role, trigger de transición, «revisado» vía gateway, reset al editar, tests negativos | 10.1, 10.2, 10.4 |
| 5 | **Todo junto con válvula por fecha; Radar última etapa** (fecha al cerrar la fase 2) | Orden de fases, camino crítico, 9.4, 9.6 |
| 6 | ~~0.1 mide `cpuTime`~~ (retirado v2.4: sin medición; se analiza en producción); caché de assets de OpenNext | 0.1 |
| 7 | Contrato único del código de afiliado; trigger solo si nulo; `extensions.gen_random_bytes`; código desconocido → lead con `meta.invalid_ref`; `(ref XXX)` en WhatsApp; un campo `ref` en Cal.com | 1.4, 1.8, 3.3, 3.8, 3.11 |
| 8 | Generador: Turnstile antes que cuota; RPC `increment_quota`; propuesta firmada HMAC; fallo del contador deja pasar | 1.8, 3.7, 3.8, 3.9 |
| 9 | Worker `josecoded-api-preview` con secretos propios; rotar Telegram y Resend antes de 3.12; `WORKER_INTERNAL_TOKEN_PREV` | 1.7, 1.9, 3.12 |
| 10 | RPC `request_upgrade()`; sin insert directo | 1.8, 5.4 |
| 11 | Códigos y precios en `pack_codes`; `sync-db` genera SQL; mapeo revisado | 1.4, 1.8, 1.9, 9.4 |
| 12 | `supabase-ping.yml` con Telegram directo | 1.9 |
| 13 | Chat con rate limit y cuota; AI Gateway obligatorio con presupuestos; avisos agrupados | 3.7, 4.4, 6.6 |
| 14 | Cookie `ref` con aceptación explícita; sin ella, `sessionStorage`; políticas actualizadas | 3.11, 3.6 |
| 15 | `schema.ts` único para `.md`/`.mdx`; `import()` doble; YAML por librería; test con `.md`; aviso si `blogEnabled` es falso | 4.2, 10.1, 10.2 |
| 16 | `send_lock`; campañas no `draft` = enviadas; cupo con `GET /v3/account`; `week_key` única; test de barridos simultáneos | 10.1, 10.2 |
| 17 | Iframe `sandbox=""`; escapado con tests; CSP en admin/newsletter; secreto del webhook en cabecera | 10.2, 10.4 |
| 18 | Timeout 20 min < lock 30 min; `claim_token`/`attempt`; `rate_limit` no cuenta; compose propio | 10.1, 10.3 |
| 19 | `idempotency_key` en leads; dedup de avisos; barrido de `via='none'`; CANCELLED/RESCHEDULED | 1.8, 3.8, 3.11 |
| 20 | Contrato `ai_proposal` con test; `isApp` en modelo y reglas; `ensureProfile` idempotente; email verificado para la señal por `contact_email` | 1.4, 3.7, 3.8, 4.1, 5.1 |
| 21 | `pricing.json` bilingüe con test; reglas en es/en con precedencia P4 > P3 > P2 > P1; `admin-chat-assistant.service.ts` en 4.4 | 1.4, 3.7, 4.4 |
| 22 | CV: convención `<!-- id: -->`, `loadCvMaster` en `radar-core`, `cv.css`, campos públicos cerrados, `noindex` | 3.14, 7.1, 7.21 |
| 23 | Fase 1 en `chore/monorepo-base` y `chore/supabase`; catálogos por pantalla; `tokens.css` solo por su tarea dueña | Ramas, 1.x, 2.1 |
| 24 | Coherencia: 3.8 con Supabase local; DT §8.1 alineado; 12 eventos; 26 tablas; sin `perf.ts` | 2.4, 2.12, 3.1, 3.8, 9.2 |
| 25 | Puerta visual: `mask`, desvíos registrados, fuentes locales, job solo en PR de UI, solo la home contra prototipo | 2.13, 3.x |
| 26 | Guarda determinista en el gateway; evals manuales (propuestas, chat, newsletter, Radar) | 3.7, 4.4, 7.30, 10.1 |
| 27 | `performance.mark` vs LCP; móvil sin `canvas`; E2E de paginado, OTP por buzón local y señal de origen | 2.17, 4.1, 5.1 |
| 28 | **WebGL en tablets grandes: desvío aceptado**; `qa` en iPad | 2.8, puerta fase 2 |
| 29 | `supabase-js` diferido; 0.1 valida `check-hero-bundle` con Turbopack | 0.1, 2.3, 2.9 |
| 30 | `paramsHash` completo; póster a 9 000; regenerar solo si cambia | 2.5a, 2.6 |
| 31 | `React.cache()`, `Promise.all`, RPC `admin_counters()` | 1.8, 6.1 |
| 32 | CORS `https://*-josecoded-web.jose.workers.dev` con tests límite | 1.7 |
| 33 | Código de afiliado con prefijo elegido, sufijo más largo, `validate` más estricto; nivel `client` derivado | 1.4, 1.8, 3.8, 5.5, 6.2 |
| 34 | JSON-LD `minPrice`, `valueAddedTaxIncluded:false`, `unitCode:'HUR'` | 2.11 |
| 35 | Un único cron `*/5` con despachador `nextRun`; Radar de 4 a 3 trabajos (DT §0b) | 1.7, 7.17, 7.23, 10.2 |
| 36 | Test de subpeticiones (< 40) por tick; lotes dinámicos | 7.17 |
| 37 | `api.josecoded.com` en 3.12; smoke de `v1`, `forum`, `admin-chat` tras cada deploy del gateway | 3.12, 1.9 |
| 38 | Seguir en Free; Paid solo con la medida de 0.1 | 0.1, NOT in scope |
| 39 | Hito «contenido completo» antes de la fase 3 | Nueva sección antes de la fase 3 |
| 40 | Prototipos solo para home, Negocios y Contacto | 3.13, fase 3 |
| 41 | Radar última etapa; newsletter tras el lanzamiento | Orden de fases |

## Restricciones globales (aplican a todas las tareas)

- **Lo heredado que se conserva** (v3.2, D49): `josecoded-api` solo en sus rutas `health`, `system`, `v1/health` y `v1-protected` (`forum/*` y `admin-chat/*` se retiran en 1.8c, Q1), `josecoded-worker` (sin cambios, ni por Radar), dominio y cuenta Cloudflare. **Supabase es un proyecto nuevo (`echlwywbucgbhwpncviy`) con esquema propio desde cero (DATOS)**: las migraciones del repo son la fuente; nada del proyecto heredado se migra. Contratos del gateway que siguen vivos, intocables (spec §7, DT §7).
- **Sin middleware/proxy Node** en `apps/web`: guards en layouts server-side + re-comprobación en cada Server Action y route handler; i18n por rewrites (DT §1.4, §1.7).
- **Ninguna ruta de producción de la web ni del gateway depende de Omen** (1.8d): `WORKER_URL`/`WORKER_INTERNAL_TOKEN` son opcionales y no se fijan en producción.
- **El navegador nunca habla con Omen ni con n8n**; solo el gateway. Umami es la única URL de Omen expuesta (DT §7.2).
- **Producción con OK explícito de Jose en la sesión** (tareas marcadas **GATE**): `wrangler deploy`, `apply_migration`, `supabase functions deploy`, `pricing:sync-db`, exponer `stats.josecoded.com`, cambiar `API_MODE`, alta de `api.josecoded.com`, `setWebhook` de Telegram, contenedores y workflows en Omen, plist de launchd en el Mac, `wrangler secret put` en Workers de producción. **Las migraciones las aplica el controlador, no un subagente**, con `list_tables` y `get_advisors` antes y después (DT §6.2, §11.1).
- **Servicios preexistentes de Omen intocables** (worker, n8n, Ollama, Samba, túnel `josecoded-worker`). Solo contenedores y workflows **nuevos**.
- **Gmail solo borradores, nunca `send`**; **Google Calendar nada sin clic de Jose**; **Radar: ningún `sent` sin `confirmed_by_jose`** (tres invariantes con test, DT §11).
- **Secretos**: nunca en `NEXT_PUBLIC_*`, en el repo ni en `apps/web` para Radar; `wrangler secret`, `.dev.vars`/`.env.local` ignorados, credential store de n8n, `.env` de Omen fuera del repo.
- **Presupuestos del hero (spec §12.3):** chunk de la escena ≤ 200 KB gz; JS de la home sin escena ≤ 350 KB gz; vídeo ≤ 700 KB, póster ≤ 60 KB, arte de Proyectos ≤ 60 KB; LCP ≤ 1,2 s escritorio / ≤ 2,5 s móvil 4G y elemento LCP = `h1` o `img.hero-stage__poster`; worker web < 2,5 MiB comprimidos (Workers Free: 3 MiB). **WebGL solo en escritorio**; móvil siempre vídeo + póster.
- **Convenciones de trabajo (working-agreements, normativo):** CSS Modules que consumen solo `var(--token)` (sin Tailwind, shadcn ni GSAP); `design.json` → `tokens.css` con test de deriva, nunca editado a mano; motion CSS nativo + `lib/motion/` en TS; Baseline 2024 con la tabla de fallbacks de §6; prototipo `home-v6` 1:1 con desvíos `deviation:` que decide Jose en el navegador; capturas comparadas a 360/900/1440 en cada tarea con UI, revisadas por `ui`, y **aprobación de Jose en preview antes de cada merge**; TDD solo en lo que tiene comportamiento (sin unit tests de componentes visuales); unidades relativas, breakpoints en `rem`, `px` solo en hairlines, sombras, desenfoques y offsets de motion; PR por rama con squash y `main` protegida (nunca push a `main`); textos solo en `messages/{es,en}.json`, **siempre en los dos idiomas**; dependencias solo las del plan (una extra exige justificación de peso y alternativa nativa, la decide `revisor`); **pnpm siempre, nunca npm ni npx**.
- **Calidad:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde en cada tarea; Lighthouse móvil ≥ 90/95/100; WCAG 2.2 AA; solo modo oscuro; móvil primero; marca `josecoded` (nunca "Jose Dev").
- **Textos**: español e inglés para la UI (voz de `Comercial/voz.md`; la versión inglesa la redacta `redactor`), inglés para identificadores, ficheros y commits. Nada publicado sin contenido real: un bloque con `{{DATO}}` sin cubrir **no se renderiza** (UX §18); `i18n:check` lista lo pendiente. Sin métricas en la web (ni contadores de GitHub, ni valoraciones, ni cifras de rendimiento); precios «desde» sí.
- **Precios** solo desde el catálogo de Supabase (D54, v3.4): la web los lee de **`content/pricing.json`** (publicado por el bot desde `pricing_catalog_snapshot()`; hasta la primera publicación, el fichero movido desde `packages/pricing/pricing.json` con los valores de `tarifas.md` v2) y el gateway de **`pricing_published()`**; ningún número de precio escrito a mano en componentes, prompts ni tests (los tests comparan con el fichero). ~~`packages/pricing/pricing.json` generado de `tarifas.md`~~. El "desde" nunca suma extras (DT H8).
- Aplicar `vercel-react-best-practices` en todo React y pasar `web-design-guidelines` antes de cerrar cualquier tarea con UI.

## What already exists (no se reescribe; se consume)

- **`josecoded-api`** (gateway Hono en Workers): rutas `v1`, `v1-protected`, `forum` (intacto, sin consumidor), `admin-chat` (+ `admin-chat/admin/*`, takeover), `health`, `system`; middlewares `requestId`, `securityHeaders`, CORS, rate limit; binding `AI_RATE_LIMITER` declarado. Se mueve a `apps/api` (1.2) y solo recibe rutas, bindings y cron aditivos.
- **`josecoded-worker`** en Omen (Fastify, `worker.josecoded.com`): módulos `ai/*` (chat, blog, summarize), `n8n/*` (trigger de workflows), `storage/*`, `system/*`, `health`. Sin cambios en todo el plan; **opcional para el gateway desde 1.8d** (fuera del producto).
- **Supabase `josecoded` (v3.2):** proyecto **nuevo** `echlwywbucgbhwpncviy` (eu-west-1, Postgres 17), vacío hasta el gate 1.9. Esquema v2 en `supabase/migrations/` (DATOS). ~~**Supabase `josecoded`**: 21 tablas heredadas (`staff_members` con Jose admin y `telegram_chat_id`, `leads` con sus 6 triggers, `clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_pack_extras`, `pack_templates`, `pack_extras`, `admin_chat_*`, `blog_posts`, `forum_*`), 47 políticas con `private.staff_role_of()`, esquema `private.*` (`notify_event()` por `pg_net`), bucket privado `client-assets` (25 MiB), Edge Function `notify` v4 (Telegram + Resend), `vault.notify_shared_secret`. Solo migraciones aditivas.~~ (heredado de `nrgrmymsjtgayzejtawa`, abandonado el 2026-10-28, D49).
- Dominio `josecoded.com`, cuenta Cloudflare, bot de Telegram, cuenta de Resend (dominio a verificar).

## NOT in scope (decidido el 2026-09-30; **ampliado v3.0 el 2026-10-28**)

- **v3.0 — En el lanzamiento no entran:** Radar (fase 7, módulo del CRM, después), newsletter (fase 10, a reevaluar a los 3 meses con datos; mientras, solo «Avísame» → contacto en el CRM), mentoría/formación como vía de `/servicios` (Q19: cuando `tarifas.md` tenga tarifa), envío de mensajes desde el CRM (nunca: Gmail solo borradores y solo con OAuth, Q20), sincronización automática CRM ↔ Notion (D42), páginas `/empresas` y `/negocios` (301), chat sobre `admin-chat/*` (D39).

- **Workers Paid**: no se contrata. **Decisión de Jose (2026-10-02): `apps/web` en Workers Free, sin código de medición de CPU; el rendimiento se analiza con la web construida y en producción.**
- **WebGL en tablets grandes**: desvío aceptado por Jose (reciben modo `scene`); `qa` lo prueba en iPad y, si no rinde, `(pointer: fine)` en el gate es un cambio de una línea.
- **Conectores opcionales de Radar**: scraping de LinkedIn (7.13, apagado dos semanas), Upwork (7.15) y Malt por correo (7.14) pueden llegar tras el lanzamiento; no bloquean nada.
- **PDF por Browser Rendering** (7.21): solo si 0.4 lo confirma en Free; el respaldo (impresión en navegador) es la vía por defecto.
- **`build-info` con recuento de tablas y políticas** como dato público: no se muestra (sin métricas); el JSON conserva los campos solo para el pie y `llms.txt`.
- Programación de envíos, segmentación y editor WYSIWYG de la newsletter (NL §5), pagos online, WhatsApp Business API, Sentry (DT §5.8).

## Cómo se ejecuta este plan

- **Una tarea = una invocación** de `implementador-web` (o `implementador-infra` en la fase 8), con TDD: test que falla → implementación mínima → test en verde → commit. Después de cada tarea, `revisor` (solo lectura) sobre el diff; los hallazgos se corrigen antes de la siguiente.
- **Al final de cada rama**, `revisor` sobre la rama completa y `/puerta-calidad` (`qa`, `revisor-seguridad`, `revisor-accesibilidad`, `usuario-ejemplo` en paralelo; en ramas sin interfaz los dos últimos devuelven "no aplica"). Se repite hasta que los cuatro pasan; entonces merge a `main`.
- **Insumo de interfaz (v2.0):** las tareas de la home toman estructura y valores del prototipo `home-v6` (1:1), tokens de `tokens.css` (1.10), componentes y estados de INV; las de páginas interiores, de PANT y del prototipo que `ui` haga en `ref/` para cada pantalla (tarea 3.13 y siguientes). Flujo por pantalla nueva: `ux` (`/impeccable shape`, wireframe) → `usuario-ejemplo` → `ui` (prototipo en `ref/` con el sistema v6) → **Jose valida en el navegador** → implementación → capturas comparadas → `ui` revisa → **Jose aprueba en preview** → merge.
- **Pointers al DT**: cuando una tarea dice "copiar literalmente de DT §x", ese apartado contiene el bloque completo (SQL, JSON schema, tabla de endpoints, interfaz TS). El implementador lo copia tal cual; no lo reinterpreta.
- **Comandos** (definidos en la tarea 1.1): raíz `pnpm lint` (eslint + stylelint), `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`, `pnpm tokens:build`, `pnpm visual`, `pnpm i18n:check`; por paquete `pnpm --filter <nombre> test -- <patrón>`; `pnpm --filter api test` corre en workerd; `pnpm --filter web e2e` Playwright contra `wrangler dev`; `pnpm --filter web visual` capturas comparadas. `pnpm dlx` en lugar de `npx`.
- **Commits** pequeños con Conventional Commits (`feat(web): …`, `feat(api): …`, `chore: …`, `test: …`, `infra: …`); nunca se commitea `.eml`, `.dev.vars`, `.env.local` ni medios sin pasar `hero:media:check`.

## Ramas sugeridas (v3.0)

| Fase | Rama | Puerta | Estado a 2026-10-28 |
|---|---|---|---|
| 0 | `spike/t0-*` | — | Hecha |
| 1a | `chore/monorepo-base` (1.1, 1.4, 1.5, 1.10) | `revisor` | **Mergeada** (PR #1) |
| 1b | `chore/supabase` (1.2 ✅, 1.3 ✅, 1.7 ✅, **1.6, 1.8a, 1.8b, 1.8c, 1.9** reescritas en v3.2) | `/puerta-calidad` sin UI (`qa` + `revisor-seguridad`) | **En curso**; v3.2 la amplía con el CRM y el chat (DATOS) |
| ~~1c~~ | ~~`chore/crm-schema`~~ | — | **Superada por v3.2**: fundida en 1b |
| 2 | `design/home-v7` (2.0: prototipo, **no se mergea hasta el OK de Jose**), `feat/shell-home` (+ `feat/glyph-scene` en paralelo) | 2.0: **OK de Jose en el navegador**; resto: `/puerta-calidad` completa + `ui` sobre capturas + OK de Jose en preview | — |
| 3 | `feat/public-pages` (3.1, 3.13, **3.2 `/servicios`**, **3.3 `/partners`**, 3.4, 3.5, 3.6, 3.14), `feat/generator-leads` (3.7–3.12) | `/puerta-calidad` completa (Marta, Dani, Nuria, Pablo) + OK de Jose en preview | — |
| 4 | `feat/auth-blog-lab` (4.1, 4.2, 4.3, **4.5 `/lab`**), **`feat/assistant-chat`** (4.4: gateway `assistant` + web `/chat`) | `/puerta-calidad` completa (Dani, Nuria, Pablo en el chat) | — |
| 5 | `feat/client-area` | `/puerta-calidad` completa (cliente) | — |
| 6 | **`feat/crm`** (6.1, 6.2, 6.7, 6.8, 6.9), `feat/admin-modules` (6.3, 6.4, 6.5), `feat/crm-chat` (6.6) | `/puerta-calidad` completa (`usuario-ejemplo` como Jose operador: importar agencias, redactar y marcar enviado, takeover, publicar contexto; `revisor-seguridad`: **test negativo de envío**, RLS `crm_*`, `requireAdmin` por acción) | — |
| 8 | `infra/omen` (solo 8.1 Umami antes del lanzamiento) | `revisor-seguridad` | — |
| 9 | `release/v2` | `/puerta-calidad` final | — |
| 7 (**post-lanzamiento**) | `feat/radar-core`, `feat/radar-connectors`, `feat/radar-api`, `feat/radar-admin`, `feat/radar-mail-calendar` + 8.2/8.3 | Como v2.2; `usuario-ejemplo` como Jose operador y reclutadora | Tras 9.6 |
| 10 (**post-lanzamiento, a reevaluar**) | las de la spec de newsletter §14 | Como v2.2; `/plan-eng-review` antes | Tras 9.6 y decisión con datos (spec §0.9) |

## Estimación relativa y camino crítico (v3.0)

| Fase | Tareas | Estimación | Notas |
|---|---|---|---|
| 1b (resto, v3.2) | 1.6, 1.8a, 1.8b, 1.8c, 1.9 | **M** | En el Mac; esquema completo del lanzamiento (DATOS); 1.9 GATE contra el proyecto nuevo. Bloquea 3.8, 4.1, 4.4, 5 y 6; no bloquea la fase 2 |
| ~~1c~~ | ~~1.11, 1.12~~ | — | Fundida en 1b (v3.2) |
| 2 Home v7 | 2.0 + 2.1–2.17 | **XL** | 2.0 (prototipo) bloquea todo el port; 2.5a–2.6 (`glyph-scene`) en paralelo; la escena Servicios (2.14) sustituye a dos escenas: algo menos que en v2.2 |
| 3 Páginas públicas | 3.1, 3.13, 3.2, 3.3, 3.4, 3.5, 3.6, 3.14, 3.7–3.12 | **L** | `/servicios` (3.2) es la pantalla más grande; `/partners` (3.3) es pequeña; 3.7–3.8 en paralelo |
| 4 Auth + blog + lab + chat | 4.1–4.5 | **L** | 4.4 (chat v2) es la tarea más grande de la fase; 4.5 depende de que existan dos demos |
| 5 Área | 5.1–5.5 | M | Sin cambios |
| **6 CRM** | 6.1–6.9 | **L+** | 6.2 (contactos) y 6.9 (contextos) son el núcleo; 6.8 (mensajes con IA) toca Workers AI + reglas; 6.3–6.5 sin cambios |
| 8 Infra | 8.1 | S | Umami |
| 9 Lanzamiento | 9.1, 9.2, 9.4, 9.5, 9.6 | M | Sin Radar |
| 7 Radar (post) | 31 | XL | Como v2.2; reutiliza contactos e interacciones del CRM |
| 10 Newsletter (post, a reevaluar) | 7 | L | Solo si la decisión de los 3 meses es «sí» |

**Orden de ejecución de fases (v3.2):** 1b (cerrar, ahora con CRM y chat) ‖ **2.0 (prototipo home-v7 + gate)** → 2 (port) → **hito «contenido completo» (reducido)** → 3 → 4 → 5 → 6 → 8.1 → 9 (lanzamiento) → 7 Radar → 10 Newsletter (si procede). Carriles: **A** web pública (`design/home-v7` → `feat/shell-home` → `feat/public-pages` → `feat/auth-blog-lab` → `feat/client-area` → `release/v2`); **B** paquetes sin UI (`feat/glyph-scene`, `pricing` con P5); **C** gateway y esquema (`chore/supabase` → 3.7–3.8 → `feat/assistant-chat` → `feat/crm`); **D** infra (`infra/omen` 8.1). El CRM (fase 6) puede empezar en el carril C en cuanto 1.12 esté aplicado y 6.1 (shell) exista, en paralelo con las fases 3–5 del carril A, porque no comparte `messages/` de pantallas públicas ni `tokens.css`.

**Camino crítico real (v3.2):** 1.6 → 1.8a → 1.8b → 1.8c → 1.8d → 1.9 → **2.0 (OK de Jose)** → 2.1 → 2.2 → 2.3 → 2.8 (espera a 2.5b + 2.6 + 2.7) → 2.10 → 2.13 → **2.14 (Servicios)** → 2.15 (Proyectos + Lab/Blog) → 2.16 → 2.17 → hito de contenido → 3.13 → **3.2 (`/servicios`)** → 3.8 → 3.10 → **3.3 (`/partners`)** → 3.9 → 3.4 → 3.5 → 3.6 → 3.12 → 4.1 → 4.2 → 4.5 → **4.4 (chat v2; necesita 1.9 y 6.9 para contextos reales, con contexto de seed hasta entonces)** → 5.1 → 6.1 → 6.2 → 6.9 → 6.8 → 6.6 → 9.1 → 9.4 → 9.5 → 9.6. En paralelo y fuera del camino crítico: 6.7 (importar), 6.3–6.5, 8.1.

**Lo que más acorta el lanzamiento:** (1) aprobar el prototipo home-v7 pronto (2.0 es un gate de Jose, no de código); (2) arrancar el shell del CRM en el carril C en cuanto 1.9 esté aplicada mientras el carril A porta la home; (3) tener las dos demos del lab y las tres guías antes de la fase 4 (insumos). **Sin válvula por fecha**: ya no hay nada en el lanzamiento que dependa de Radar.


### Ramas y estimación (v2.2, superadas por v3.0)


| Fase | Rama | Puerta |
|---|---|---|
| 0 | `spike/t0-opennext`, `spike/t0-hero`, `spike/t0-radar` (no se mergean; los resultados van a `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` en `main`) | `revisor` sobre el documento de resultados |
| 1a | `chore/monorepo-base` (1.1, 1.4, 1.5, 1.10) | `revisor` sobre la rama; **sin puerta** (v2.1) |
| 1b | `chore/supabase` (1.2, 1.3, 1.6, 1.7, 1.8, 1.9) | `/puerta-calidad` (sin UI: `qa` + `revisor-seguridad`) |
| 2 | `feat/shell-home` (+ `feat/glyph-scene` en paralelo, se mergea en `feat/shell-home` antes de 2.8) | `/puerta-calidad` completa + `ui` sobre el diff de capturas + **OK de Jose en preview** |
| 3 | `feat/public-pages` (3.1, 3.13, 3.2–3.6, 3.14), `feat/generator-leads` (3.7–3.12) | `/puerta-calidad` completa (Marta y Dani) + OK de Jose en preview |
| 4 | `feat/auth-blog-chat` | `/puerta-calidad` completa (Dani) |
| 5 | `feat/client-area` | `/puerta-calidad` completa (cliente) |
| 6 | `feat/admin` | `/puerta-calidad` completa (Jose operador) |
| 7 (**última etapa**, tras 9.6 salvo que llegue antes de la fecha de válvula) | `feat/radar-core` (paquetes + migraciones), `feat/radar-connectors`, `feat/radar-api`, `feat/radar-admin`, `feat/radar-mail-calendar` | `/puerta-calidad` por rama; `usuario-ejemplo` como Jose operador y como reclutadora |
| 8 | `infra/omen` (ficheros de referencia en `infra/`; lo aplica `implementador-infra` en Omen con OK) | `revisor-seguridad` |
| 9 | `release/v1` | `/puerta-calidad` final sobre la preview con todo mergeado |
| 10 | `spike/t10-claude-runner`, `feat/newsletter-core`, `feat/newsletter-api`, `feat/newsletter-runner` + `infra/newsletter-runner`, `feat/newsletter-admin`, `feat/newsletter-public` (post-lanzamiento, spec de newsletter §14) | `/puerta-calidad` por rama; `revisor-seguridad` en tokens, webhooks, RLS, Markdown y PAT |

**Estimación v2.2:**

| Fase | Tareas | Estimación | Notas |
|---|---|---|---|
| 0 Validaciones | 6 | M | Todas en paralelo; 0.1 bloquea todo lo demás; 0.2 bloquea 2.5–2.9; 0.3–0.6 bloquean conectores concretos |
| 1 Monorepo (1a base + 1b supabase) | 10 | M | 1.9 es GATE (migraciones no-Radar en producción); **1.10 (tokens) bloquea toda la fase 2**; 1a sin puerta |
| 2 Shell + home v6 + hero + i18n + SEO/GEO | 18 | XL | `packages/glyph-scene` (2.5a, 2.5b, 2.6) en paralelo con 2.1–2.4; escenas en el orden del prototipo con validación de Jose entre ellas |
| 3 Páginas públicas + generador + leads + contacto | 14 | L | Orden de PANT §4; 3.7–3.8 (gateway) en paralelo con 3.13/3.3 |
| 4 Auth + blog + chat | 4 | L | 4.1 bloquea 5.x, 6.x y 7.25+ |
| 5 Área de clientes + afiliados | 5 | M | |
| 6 Admin | 6 | L | 6.1 bloquea 7.25+ |
| 7 Radar (**última etapa**) | 31 | XL | Tras 9.6 (o en carril B si hay capacidad, sin bloquear el lanzamiento); 7.16+ (gateway) tras 7.7; 7.25+ (web) tras 6.1 |
| 8 Infra Omen | 3 | S | Tras 1.x; cada tarea con OK de Jose |
| 9 Lanzamiento | 5 | M | 9.6 GATE (9.3 retirada) |
| 10 Newsletter (post-lanzamiento) | 7 | L | Tras 9.6; tarea 10.0 (spike) primero; gates de migraciones, secretos, Omen y DNS |

**Orden de ejecución de fases (v2.1, decisión 5/41: Radar es la última etapa):** 0 → 1a → 1b → 2 → **hito «contenido completo»** → 3 → 4 → 5 → 6 → 8.1 (Umami) → 9 (lanzamiento con válvula por fecha) → **7 Radar + 8.2/8.3** → 10 Newsletter. Los números de fase se conservan para no romper referencias. Radar se queda en el proyecto y su núcleo (7.1–7.8) puede adelantarse en un carril paralelo si hay capacidad, pero **lo público no espera por él**: la **fecha de válvula** se fija al cerrar la fase 2 con datos (velocidad real de las tareas 0–2 y estado del hito de contenido) y se anota en `ESTADO.md`; si llega sin Radar, 9.6 lanza sin Radar y Radar se completa sobre la misma producción (vive solo en `/admin`). Sustituye a la «válvula de escape» de v1/v2.0.

**Camino crítico real** (todo lo demás se solapa): 0.1 → 1.1 → **1.10** → 1.5 → 1.8 → 1.9 → 2.1 → 2.2 → 2.3 → 2.8 (espera a 2.5b + 2.6 + 2.7) → 2.10 → 2.13 → 2.14 → 2.15 → 2.16 → 2.17 → **hito de contenido** → 3.13 → 3.3 → 3.8 → 3.10 → 3.2 → 3.9 → 3.4 → 3.5 → 3.6 → 3.12 → 4.1 → 4.2 → 5.1 → 6.1 → 6.2 → 9.1 → 9.4 → 9.5 → 9.6. Radar (7.x, 8.2, 8.3) y la newsletter (10.x) van después de 9.6.

**Carriles de worktree** (una rama viva por carril; `superpowers:using-git-worktrees`): **A** web pública (`feat/shell-home` → `feat/public-pages` → `feat/generator-leads` → `feat/auth-blog-chat` → `feat/client-area` → `feat/admin` → `release/v1`); **B** paquetes sin UI en paralelo desde 1a (`feat/glyph-scene`, `packages/pricing` bilingüe, `radar-core` 7.1–7.5 si hay capacidad); **C** gateway (`chore/supabase`, 3.7–3.8, `feat/radar-api`, `feat/newsletter-api`); **D** infra (`infra/omen`). Nunca dos carriles tocan `tokens.css`, `messages/` de la misma pantalla ni `supabase/migrations/` a la vez. Radar es ≈ 40 % del total (spec §13.9) y va al final del camino; lo que lo acorta es arrancar `feat/radar-core` y `feat/radar-connectors` justo después de la fase 1, en paralelo con las fases 2–6.

**Válvula por fecha (spec D34, decidida):** ver «Orden de ejecución de fases». Si Radar llega parcialmente antes de la fecha, el corte limpio sigue siendo 7.1–7.8 + 7.16–7.19 + 7.25 (núcleo, migraciones, un conector y bandeja con Telegram).

## Insumos que faltan de Jose y dónde bloquean

| Insumo | Bloquea | Hasta entonces |
|---|---|---|
| **v3.0 — Aprobación del prototipo `ref/home-v7/` en el navegador** | **2.0 → toda la fase 2** | Nada se porta; `ui` itera el prototipo |
| **v3.0 — Contexto inicial del chat por caso** (4 casos × es/en: hechos que la IA puede decir a un cliente, una agencia, un reclutador y un curioso; disponibilidad, zona, stack, qué no hace, enlaces) | 4.4 (respuestas reales), 6.9 (primer contenido publicado) | 4.4 arranca con `chat_contexts` de seed (`{{DATO}}` visibles solo en dev); en producción el caso sin contexto publicado usa `curious` y el CRM lo marca |
| **v3.0 — Texto de `/partners`** (qué hago para agencias, cómo encajo, cuándo sí/no, FAQ, herramientas, plazo de estimación) y decisión **Q16** (precio o no en `/partners`) | 3.3 | `redactor` propone desde `agencias-mensajes.md` y `canales-captacion.md`; sin validación de Jose la página no se publica |
| **v3.0 — Titular, párrafo citable y una frase por vía de `/servicios`**; FAQ por vía (incluida contratación) | 3.2, 2.14 (escena Servicios) | Bloques con `{{DATO}}` no se renderizan |
| **v3.0 — Dos demos del lab** (elegidas entre las candidatas de spec §0.7) con nombre y texto corto es/en | 4.5, 2.15 (escena Lab/Blog) | `/lab` 404 y fuera de la navegación |
| **v3.0 — Tres guías largas del blog** (≥ 1.500 palabras; sustituye «tres artículos») | 4.2, 2.15 | Blog oculto |
| **v3.0 — Buzón `freelance@josecoded.com` activo** (Email Routing en Cloudflare; Q18) y URL de LinkedIn | 3.3, 3.12, 6.8 (remitente de los borradores) | `/partners` publica `hola@` o solo WhatsApp/Cal.com; borradores con `mailto:` genérico |
| **v3.0 — `Comercial/agencias.md` al día** (es la fuente de la importación 6.7) y OK para que los mensajes a agencias lleven enlace a `/partners` cuando esté en producción | 6.7; vault | Importación con la versión que haya |
| **v3.0 — Decisiones Q17 (mantener `/contacto`), Q19 (mentoría fuera), Q20 (Gmail: solo «Copiar»)** | 3.10, 3.2, 6.8 | Se aplican las recomendaciones de la spec §0.13 hasta que Jose diga otra cosa |
| Nombre a mostrar (UX §18.1; tildes, segundo apellido) | 2.7 (`h1` partido), 2.8 (presupuesto móvil), 2.11 (JSON-LD `Person`) | El `h1` usa "Jose Carlos Sánchez" del prototipo con `{{DATO}}` marcado en `messages/es.json`; la tarea 2.8 no se cierra sin el dato |
| Datos §18 de UX (2–15: ciudad, años, estado de 3catinfo/HazmeFila/Oportunix, webs de comercios, certificaciones, empleos, disponibilidad, WhatsApp y email, usuario GitHub, cuentas de stores) | 2.10 (celda Sobre mí), 2.15 (entradillas de proyectos), 3.1 (fichas), 3.2, 3.4, 3.5, 3.10 (WhatsApp), 3.11 | Los bloques sin dato no se renderizan; `usuario-ejemplo` los reporta como huecos en la puerta de la fase 3 |
| Decisión §13.20 del hero (A/B/nada) | 2.8 | **Resuelta en spec v1.5.2: alternativa B** (subtítulo por audiencia sin tecnologías, CTAs como el prototipo). La frase final la fija `redactor` con `voz.md` |
| Proteger `main` en GitHub (working-agreements §9; paso manual de Jose) | Primer merge de la fase 1 | Los agentes no hacen `push` a `main` en ningún caso |
| ~~Documento `ui` v3~~ → **tokens completos en `.impeccable/design.json`** (INV §5: alfas, sombras, desenfoques, duraciones y easings, capas, breakpoints en rem, degradados) | **1.10 → toda la fase 2** | Nada: 1.10 los completa antes de portar ninguna escena |
| Foto real de Jose y entregable por servicio (PANT §3.1) | 2.10 (celda Sobre mí), 2.14 (Servicios), 3.5, 3.2 | Bloques con `{{DATO}}` no se renderizan |
| Textos en inglés de todo lo que aporte Jose (historia, casos, FAQ, entregables) | cada tarea de pantalla (3.x, 5.x) | `redactor` traduce el copy de interfaz; los `{{DATO}}` de Jose quedan pendientes en ambos idiomas y `i18n:check` los lista |
| Capturas reales, reto/trabajo/resultado por proyecto (repo de josecoded: privado, decidido) | 3.4 (casos), 3.14 | El caso josecoded.com se escribe desde los documentos del repo; el resto queda bloqueado |
| CV maestro es/en (`content/radar/cv.master.*.md`, Q15) | 3.14 (PDF) y 7.21 | Sin PDF, el enlace «Descargar CV» no se renderiza |
| Datos del titular para el aviso legal (nombre legal, NIF, domicilio) | 3.6 | Legales con `{{DATO}}`: no se publican |
| Tres artículos reales para el blog (o los tres candidatos de PANT §3 escritos por Jose/`redactor`) | 4.2 (regla D33), 2.15 (escena Blog) | Blog oculto y `/blog` 404 |
| Cuenta de Cal.com | 3.2, 3.10, 2.16 | «Reservar 20 min» no se renderiza |
| **Newsletter (fase 10):** cuenta de Brevo y dominio autenticado, registros DNS, PAT fine-grained de GitHub, `claude setup-token` para Omen (Q1), lista de fuentes (Q6), política de privacidad revisada, 3–5 temas iniciales, respuestas a Q1–Q6 de su spec | 10.x | La fase no arranca |
| `Comercial/voz.md` con los tres ejemplos corregidos | 2.10, 3.x (copy), 7.5 (`voice.radar.md`) | Se usa la versión actual; `redactor` revisa el copy cuando Jose corrija los ejemplos |
| Textos legales (aviso, privacidad, cookies) | 3.6 | Se portan los de josedev con marca `josecoded`; Jose los valida |
| Retrato para Sobre mí (UX §13.4) | 3.5 | Sin foto, el bloque muestra solo texto |
| **v3.2 — Proyecto Supabase nuevo:** token de `supabase login` en el Mac, OAuth Google y GitHub (client id/secret), SMTP (Resend, Q5), decisiones Q1–Q6 de DATOS §12, `TELEGRAM_BOT_TOKEN` + `chat_id` | **1.9 (gate)**, 4.1 (login real) | Los E2E usan email + contraseña de seed; la prueba manual de OAuth queda para la puerta de la fase 4 |
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
| `design.json` incompleto: un componente necesita un token que no existe | **1.10** (lista obligatoria en el test de deriva) y stylelint en cada tarea | Se añade a `design.json` con nombre semántico + `pnpm tokens:build` en el mismo commit; nunca un literal en el `.module.css` |
| Deriva visual respecto al prototipo | **2.13** (capturas comparadas por escena) | Diff > 2 % bloquea la puerta; `deviation:` en el commit y decisión de Jose en el navegador |
| Safari sin `animation-timeline` o View Transitions | **2.15**, **2.17** (WebKit en Playwright) | Tabla de fallbacks de working-agreements §6; nunca detección por user agent |
| Paginado por gesto secuestra el scroll o pelea con la inercia del trackpad | **2.16** y `qa` en la puerta | Umbral 24 / bloqueo 700 ms del prototipo como tokens; desactivar el paginado (scroll nativo + snap) es una línea si Jose lo decide |
| Insumos de Jose tardíos (nombre, datos §18, CV maestro, OAuth, textos en inglés) | Cada tarea marca el insumo; `i18n:check` | Bloques no renderizados y estados `no_credentials`/`unauthorized` visibles; nunca datos inventados |
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

> **v2.1 (eng review), retirado en v2.4:** la medida de `cpuTime` ya no forma parte de 0.1. **Decisión de Jose (2026-10-02): `apps/web` en Workers Free, sin código de medición de CPU; el rendimiento se analiza con la web construida y en producción.**

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
- Crear: `packages/glyph-scene/package.json` (`three` fijado a la última 0.17x/0.18x estable en npm el día del spike; anotar la versión), `src/spike-entry.ts` (importa exactamente los símbolos de DT §1.6.2 y monta la escena del prototipo portada a módulos: copiar `ref/home-v6/scene.js` —**no** `hero-lab-3/app.js`— sin el código muerto de INV §4.1 y sustituir `Math.random` por mulberry32 con semilla 1), `scripts/measure-bundle.mjs`, `render/index.html`, `scripts/render-media.ts` (Playwright + ffmpeg + sharp, DT §1.6.3), `test/bundle-budget.test.ts`.
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
- [ ] 6. `pnpm --filter glyph-scene hero:media` → imprime tamaños y PSNR. Criterios: `video.webm` ≤ 700 KB, `video.mp4` ≤ 700 KB, `poster.avif` y `poster.webp` ≤ 60 KB, PSNR ≥ 35 dB. Si el vídeo supera 400 KB, repetir una vez a 640×640 y `crf +2`.
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
> **v2.3 (2026-09-30, Jose):** las tareas **0.3–0.6 (Radar) se mueven al inicio de la fase 7** y se ejecutan justo antes de construir Radar; la fase 0 queda en **0.1 y 0.2**. Resultado de 0.2 en `docs/superpowers/specs/2026-09-19-tarea0-resultados.md` (rama `spike/t0-hero`): chunk 139,7 KiB gz con bloom (tope 200), póster 25 KB; **tope del vídeo subido a 700 KB** (spec §12.2) porque a 400 KB los glifos salían borrosos.

> **v2.3 (resultados de fase 0, 2026-09-30):** **0.2 cerrada** (Jose aprueba el vídeo a 700 KB: webm crf 56 / mp4 crf 36; 2.5c y 2.6 parten de ahí). **0.1 local OK** (12/12 en `wrangler dev --local`, ~1,12 MiB gz); pendiente `cpuTime` p95 remoto con `wrangler login` + OK de Jose, **bloquea solo la decisión Workers/Vercel de 1.5**. Cambios que entran en tareas: **1.1/`preview.yml`/`deploy-production.yml`** usan `opennextjs-cloudflare upload`/`deploy` (incluyen `populateCache`), nunca `wrangler versions upload` a secas; **1.5** caché incremental `static-assets-incremental-cache`, **slugs traducidos en inglés** con `pathnames` de next-intl (`/en/business`, `/en/about`, `/en/contact`, `/en/projects`…; la variante sin traducir redirige, sin duplicados) y barra final con 308 → sin barra (se ajusta el test que esperaba 200 en `/en/`); **2.9** `check-hero-bundle` lee el HTML prerrenderizado y los source maps (`productionBrowserSourceMaps` solo en el build de la comprobación), fixture con un mini `.next` (prototipo en `spike/t0-opennext:apps/web/scripts/check-hero-bundle.mjs`).

> **v2.4 (2026-10-02, Jose): `apps/web` se despliega en Workers Free** (junto al gateway). **No se escribe código de medición de CPU** (fuera la medida de `cpuTime` de la 0.1 y cualquier script `cpu:measure`); el rendimiento se analiza con la web construida y en producción, y solo entonces se valoraría Paid. La fase 0 queda **cerrada** (0.1 local y 0.2). Hasta tener credenciales de Cloudflare en CI, las aprobaciones de Jose se hacen en local (`pnpm dev`/`opennextjs-cloudflare preview` en el navegador del panel) y `preview.yml`/`deploy-production.yml` quedan desactivados; el criterio de 1.5 «tests contra la URL de preview» pasa a «contra el preview local».

> **v2.4 (revisión de 1.1, 2026-10-02):** las carpetas `apps/web/messages/{es,en}/<pantalla>/` fusionadas en `i18n/request.ts` (adenda v2.1 de 1.1) **se hacen en la 1.5**, donde nace `apps/web`. Se mantiene ESLint 10 con `settings.react.version` leído de `react/package.json`; la 1.5 (`pnpm lint` sobre la `apps/web` real) es la prueba de fuego y solo si revienta una regla activa se reabre bajar a ESLint 9. jscpd fijado a versión exacta en CI.

## Fase 1 — Monorepo, `apps/api` movido, `packages/pricing`, CI · Estimación M · rama `chore/monorepo`

### Tarea 1.1 — Esqueleto del monorepo

**Agente:** implementador-web · **Gate:** no · **Depende de:** 0.1 (decide Workers o Vercel para `apps/web`, no afecta al esqueleto)

> **v2.2 (stack):** (a) crear **`packages/types`** (`@josecoded/types`, sin deps de runtime, `zod` como peer) con `src/index.ts` (barrel) y `src/{ui,content,api,i18n,tokens,db}.ts` vacíos salvo los tipos base (`Locale`, `Href`, `FormState<T>`), `src/schemas/index.ts` y `test/barrel.test.ts` (todo fichero de dominio está reexportado); `tsconfig.base.json` con `paths` → `@josecoded/types`. (b) `eslint.config.mjs` de `@josecoded/config` añade `eslint-plugin-import-x` (`import-x/order` con grupos builtin · external · `@josecoded/**` · parent/sibling · type, `no-duplicates`, `no-cycle` maxDepth 4) y `no-restricted-imports` con la lista de working-agreements §14.5 (messages JSON, `database.ts`, `tokens.css`, `three` fuera de glyph-scene, `@supabase/supabase-js` fuera de `lib/supabase/` y `apps/api/src/adapters/`, adaptadores desde rutas); test `packages/config/test/eslint.test.ts` que lint-ea un fixture con cada import prohibido y espera error. **No** se añaden `consistent-type-imports`, `no-explicit-any` como error ni prohibiciones de `React.FC`/enums (Jose no las marcó). (c) `ci.yml`: paso `pnpm dlx jscpd@latest apps packages --min-lines 30 --min-tokens 120 --threshold 0 --ignore "**/*.test.*,**/database.ts,**/tokens.*,**/content/**"` dentro del job `lint`. (d) `devDependencies` de `apps/web` (cuando exista, 1.5): `vitest-axe`, `@axe-core/playwright` (lista blanca de working-agreements §11).

> **v2.1 (eng review):** la fase 1 se parte en dos ramas: **`chore/monorepo-base`** (1.1, 1.4, 1.5, 1.10; `revisor` sobre la rama, sin puerta) y **`chore/supabase`** (1.2, 1.3, 1.6, 1.7, 1.8, 1.9; con puerta). Esta tarea añade `apps/web/messages/{es,en}/` como **carpetas por pantalla** (`common`, `home`, `business`, `companies`, `about`, `projects`, `blog`, `contact`, `proposal`, `auth`, `area`, `newsletter`) fusionadas en `i18n/request.ts`. Ningún `package.json` usa `npm`/`npx`.

**Objetivo:** raíz pnpm + turbo con scripts únicos, `packages/config` compartido (eslint, **stylelint**, tsconfig, prettier) y el esqueleto de `packages/design-tokens` (DT §1.1, §1.2, §1.9; working-agreements §12).

**Ficheros:**
- Crear: `package.json` (raíz), `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` (`22`), `.gitignore` (añadir `.open-next/`, `.next/`, `.wrangler/`, `.dev.vars`, `.env.local`, `**/pending/`, `*.eml`, `frames/`, `apps/web/e2e/visual/__diff__/`), `.prettierrc`, `packages/config/package.json` (`@josecoded/config`), `packages/config/{eslint.config.mjs,stylelint.config.mjs,tsconfig.base.json,tsconfig.next.json,tsconfig.worker.json,prettier.config.mjs}` (stylelint con las reglas de working-agreements §1: `declaration-property-value-disallowed-list`, `unit-disallowed-list: ['px']` con excepciones por propiedad, `declaration-no-important`, `selector-max-compound-selectors: 2`, `property-disallowed-list` para `border`), `packages/config/test/stylelint.test.ts`, `packages/design-tokens/package.json` (`@josecoded/design-tokens`, scripts `build` y `test`; el contenido llega en 1.10), `README.md` (comandos).
- Modificar: `CLAUDE.md` del repo (sección Comandos: confirmar `pnpm dev|test|lint|typecheck|build|e2e`).
- Test: `packages/config/test/tsconfig.test.ts`.

**Interfaces:** produce los scripts raíz `lint` (eslint + stylelint), `typecheck`, `test`, `build`, `e2e`, `pricing:sync`, `pricing:sync-db`, `hero:media`, `hero:media:check`, `check:hero-bundle`, `lhci`, **`tokens:build`, `visual`, `i18n:check`** (los ocho últimos se rellenan en sus tareas; aquí se declaran como `turbo run <x>`), y `packageManager: "pnpm@11.2.2"`. Nunca `npm` ni `npx` en ningún script.

**Pasos:**
- [ ] 1. Tests que fallan (no existe `packages/config`):
```ts
// packages/config/test/stylelint.test.ts
import { it, expect } from 'vitest';
import stylelint from 'stylelint';
import config from '../stylelint.config.mjs';
async function lint(code: string) { const r = await stylelint.lint({ code, config }); return r.results[0].warnings.map(w => w.rule); }
it('rejects color literals, px outside exceptions, !important and border', async () => {
  expect(await lint('.a { color: #fff; }')).toContain('declaration-property-value-disallowed-list');
  expect(await lint('.a { padding: 24px; }')).toContain('unit-disallowed-list');
  expect(await lint('.a { border: 1px solid red; }')).toContain('property-disallowed-list');
  expect(await lint('.a { color: red !important; }')).toContain('declaration-no-important');
});
it('accepts tokens and the px exceptions', async () => {
  expect(await lint('.a { color: var(--text); padding: var(--pad-cell); box-shadow: inset 0 0 0 1px var(--line); filter: blur(6px); }')).toEqual([]);
});
```
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
- [ ] 4. `pnpm --filter @josecoded/config test` → PASS (stylelint + tsconfig); `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → en verde (sin paquetes aún, turbo termina sin error).
- [ ] 5. Commit: `git commit -m "chore: monorepo skeleton (pnpm workspaces, turbo, shared eslint/stylelint/ts config, design-tokens package)"`.

**Hecho cuando:** los cuatro comandos raíz pasan, `pnpm --filter @josecoded/config test` está en verde y `grep -rn "npx \|npm " package.json packages/*/package.json` no devuelve nada.

### Tarea 1.2 — Mover `josecoded-api` a `apps/api` sin cambiar contratos

**Agente:** implementador-web · **Gate:** no · **Depende de:** 1.1

> **v2.2 (stack):** el código heredado se mueve **tal cual** (sin puertos ni adaptadores: working-agreements §17.1 solo aplica a módulos nuevos). Crear vacíos `src/adapters/`, `src/deps.ts` (`buildDeps(env): Deps` con solo `clock` por ahora) y el middleware `withDeps` que deja `c.var.deps`; se registra pero ninguna ruta heredada lo usa. `no-restricted-imports` excluye `src/modules/{v1,v1-protected,forum,admin-chat,health,system}/**` y `src/services/*` heredados mediante `overrides` con comentario «heredado, intocable».

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

> **v2.2 (stack):** además de la migración Jest → Vitest, crear `apps/api/test/fakes/` con `clock.fake.ts` y el patrón de sobreescritura de `deps` en tests (`env.__deps` leído por `withDeps` solo cuando `env.TEST === '1'`) con un test que lo demuestra sobre `health`. Las falsas de Supabase, Telegram, AI, Turnstile y Brevo llegan con cada adaptador (3.7, 3.8, 7.16+, 10.2).

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

> **v3.4 (D54, 2026-11-01; lo ejecuta 3.1c):** la fuente deja de ser `tarifas.md`. `pricing.json` se mueve a **`content/pricing.json`** (`git mv`, valores intactos) y `data.ts` lo importa de ahí; `scripts/sync-from-tarifas.ts` y el test `pricing.json equals tarifas.md` **se retiran**; `sync-db.ts` pasa a ser **carga inicial con guarda** (se niega si `pricing_price_history` tiene filas) y aparece `pull.ts` (`pricing:pull`: `pricing_catalog_snapshot()` → `content/pricing.json`, uso local). `schema.ts` añade `visible?: boolean` y `active?: boolean` opcionales por pack/extra (compatibles con el fichero actual) y un test «el snapshot de la RPC valida con `pricingSchema`» (fixture JSON exportado por el seed). Todo lo demás de la tarea (reglas `priceForProposal`, `computeUpgrade`, afiliados) no cambia.

> **v3.0 (D37; tarea ya hecha en 1a, cambio aditivo que ejecuta 3.2):** `packs` pasa a **cinco**: `P5 = { code:'P5', kind:'app', price:4000, weeks:6, options:[{ code:'plus', price:6000, weeks:8 }] }` leído de la tabla «Packs móvil» de `tarifas.md`; `apps` se mantiene como alias derivado (`pricing.apps = [P5, P5.plus]`) hasta que 3.7 y 3.9 usen `P5`; `AppCode` del contrato `ai_proposal` admite `P5` con `option?: 'plus'`; `pack_codes`/`pricing-sync.sql` añaden la fila P5 (`sync-db` genera el SQL; se aplica con OK en 9.4). Test: cinco packs, `P5.options[0].price === 6000`.

**Agente:** implementador-web · **Gate:** no (escribe solo el repo) · **Depende de:** 1.1

> **v2.1 (eng review):** (a) **`pricing.json` bilingüe**: `name`, `includes[]`, `label`, `description`, `forWhom` como `{ es, en }` (textos de `redactor`), con un test que exige los dos idiomas en cada pack, extra y app; `parseTarifas` lee las columnas es/en de `tarifas.md` (o `tarifas.md` + `tarifas.en.md`, decide `comercial`); (b) **contrato único del código de afiliado** en `src/affiliate-code.ts` (`AFFILIATE_CODE_RE = /^[A-Z0-9]{3,12}-[A-Z0-9]{6}$/`, `normalizeCode`, `isValidCode`, `suggestPrefix(name)`) exportado para gateway, web y SQL (la regex se copia literal a la migración con un test que compara ambas); (c) **contrato `ai_proposal`** en `src/proposal.ts` (zod: `{ pack: PackCode | AppCode, priceFrom, isApp, pricingVersion, extras, source, summary, scope }`) con fixture compartido; (d) `scripts/sync-db.ts` **genera `supabase/generated/pricing-sync.sql`** (UPDATE por `code` de `pack_templates`/`pack_extras`) en lugar de escribir en la BD; sin service role en disco; (e) `computeAffiliateReward` recibe `level: 'client'|'standard'|'premium'` donde `client` lo deriva la RPC `admin_close_lead_paid` (afiliado con fila en `clients`).

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

> **v2.2 (stack):** (a) los esquemas de `env` viven en `@josecoded/types/schemas/env.ts` y `lib/env.ts` solo los ejecuta; `EnvClient`/`EnvServer` por `z.infer`. (b) `apps/web/global.d.ts` declara `AppConfig` de next-intl (`Locale: 'es' | 'en'`, `Messages: typeof import('./messages/es').default`) sobre un `messages/es.ts` que compone las carpetas por pantalla; test de tipos `tests/i18n-keys.test-d.ts` (`expectTypeOf`) en el que `t('nav.nope')` no compila. (c) `env.client.NEXT_PUBLIC_DEV_UI` opcional (`'1'` en `.dev.vars` de ejemplo y en `preview.yml`, ausente en producción) para el catálogo `/dev/ui` de 2.2.

> **v2.1 (eng review):** `env.server` **sin** `SUPABASE_SERVICE_ROLE_KEY`; `env.client` sin cambios. La rama es `chore/monorepo-base`.

**Objetivo:** promover el spike 0.1 a `apps/web` real: configuración de DT §1.3–§1.4, validación de env con zod, y la matriz de URLs como test E2E permanente.

**Ficheros:**
- Crear: `apps/web/package.json` (`@josecoded/web`; deps de DT §1.2 salvo `three`, `gsap`, `@calcom/embed-react`, `@marsidev/react-turnstile`, que llegan en sus tareas), `next.config.ts` (rewrites/redirects de DT §1.4, `images.unoptimized: true`, `serverExternalPackages` mínimos), `open-next.config.ts`, `wrangler.jsonc` (DT §1.3, `name: "josecoded-web"`, **sin** `routes` hasta 9.6), `lib/env.ts`, `i18n/routing.ts`, `i18n/request.ts`, `app/[locale]/layout.tsx` (`generateStaticParams`, `setRequestLocale`, `<html lang>`), `app/[locale]/page.tsx` (placeholder "josecoded"), `app/[locale]/not-found.tsx`, `messages/{es,en}.json` (vacíos salvo `site.name`), `vitest.config.ts` (happy-dom), `playwright.config.ts` (webServer: `wrangler dev` sobre `.open-next`), `e2e/url-matrix.spec.ts`, `tests/env.test.ts`, `.env.example`.
- Modificar: `turbo.json` (`build` de web ejecuta `next build && opennextjs-cloudflare build`).

**Interfaces (produce):** `env` (`apps/web/lib/env.ts`): `env.server.{TURNSTILE_SECRET_KEY,SERVER_KEY,CALCOM_WEBHOOK_SECRET}` y `env.client.{NEXT_PUBLIC_SITE_URL,NEXT_PUBLIC_JOSECODED_API_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,NEXT_PUBLIC_TURNSTILE_SITE_KEY,NEXT_PUBLIC_UMAMI_WEBSITE_ID?,NEXT_PUBLIC_CF_BEACON_TOKEN?,NEXT_PUBLIC_CAL_LINK,NEXT_PUBLIC_WHATSAPP_NUMBER,NEXT_PUBLIC_HERO_MEDIA_VERSION}` (v2.0: sin `NEXT_PUBLIC_HERO_LIVE_MOBILE`); `routing` y `Link`/`redirect`/`usePathname` de `i18n/navigation.ts`.

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

### Tarea 1.6 — `supabase/` desde cero: config local, migración base (`private`, helpers, roles, catálogo, contadores, jobs, outbox), seed de cuentas y tests de migraciones (v3.2)

**Agente:** implementador-web · **Rama:** `chore/supabase` · **Gate:** no (solo local) · **Depende de:** 1.1 · **Insumos:** DATOS §2, §3, §4.1, §4.2, §4.7, §6, §10

> **v3.2:** sustituye por completo a la 1.6 de v2.2 (baseline de solo lectura). **No hay dump de producción**: el proyecto nuevo está vacío y las migraciones del repo son la fuente. Lo que ya existe en la rama se reutiliza o se borra según el changelog v3.2.

**Objetivo:** que `supabase start && supabase db reset` levante un esquema vacío pero completo en su base (esquemas, extensiones, privilegios por defecto, helpers, `staff_members`, `user_profiles`, catálogo de precios, `private.quota_counters`, `private.scheduled_jobs`, `private.outbox` y sus RPC) con las cuatro cuentas del seed, `database.ts` regenerado y un test de migraciones que vigila las reglas de DATOS §2.

**Ficheros:**
- Borrar: `supabase/schema/` (vacío), `scripts/supabase-baseline.sh`, `supabase/scripts/baseline-meta.ts`, `supabase/test/baseline.test.ts`, `supabase/functions/notify/`, las 13 migraciones `202609*`/`202610*` existentes (su SQL se recicla en 1.8a/1.8b).
- Modificar: `supabase/config.toml` (quitar `[db.migrations] schema_paths` y `[functions.notify]`; `[api] schemas = ["public"]`, `max_rows = 200`; `[auth] enable_signup = true`, `site_url = "http://127.0.0.1:3000"`; `[auth.email] enable_confirmations = true`, `otp_length = 6`; `[auth.mfa.totp] enroll_enabled = true, verify_enabled = true`; `[auth.external.google]`/`[auth.external.github]` `enabled = false` en local con `env(...)` para los secretos; `[auth.captcha]` comentado en local), `supabase/test/migrations.test.ts` (reescrito), `supabase/seed/seed.sql` (reescrito: solo las cuatro cuentas de `auth.users`/`auth.identities`, `staff_members` de Jose, `packs` P1–P5 + `pack_options(P5, plus)` + `extras` con los valores de `pricing.json`, `test_set_email_confirmed()`; el resto del seed llega en 1.8a/1.8b), `.github/` nada (1.9).
- Crear: `supabase/migrations/20261028100000_base.sql`:
  - `create extension if not exists citext with schema extensions; create extension if not exists unaccent with schema extensions;` (`pgcrypto` ya viene).
  - `create schema private; revoke all on schema private from public, anon; grant usage on schema private to authenticated, service_role;`
  - `alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated; … on sequences …; … on functions …;` (P1).
  - Enums de DATOS §4.1 y §4.2: `staff_role`, `locale`, `audience_signal`.
  - `private.set_updated_at()`, `private.is_admin()`, `private.assert_email_confirmed()`, `private.enqueue(event, payload)`, `private.handle_new_user()` + trigger `on auth.users after insert`, `private.user_profiles_guard()`.
  - Tablas `staff_members`, `user_profiles`, `packs`, `pack_options`, `extras` con RLS, políticas y grants exactos de DATOS §4.1–§4.2 (grant por columnas en `user_profiles`).
  - `private.quota_counters` + `public.increment_quota` (copiar literal de `20260930100000_quota_counters.sql`), `private.scheduled_jobs` + `scheduled_jobs_due/mark_ran/disable` (copiar de `20260930100100_scheduled_jobs.sql` **cambiando las filas sembradas** por `outbox.drain '* * * * *'` (corrección v3.2: DATOS §4.7 manda; con `*/5` el despachador, que calcula `nextRun(cron, now)` con el reloj real, puede saltarse un tick), `chat.notify_digest '*/10 * * * *'`, `chat.purge_anonymous '0 4 * * *'`, `crm.due_digest '0 8 * * 1-5' Europe/Madrid`), `private.outbox` + `outbox_claim/ack/fail` (DATOS §4.7; corrección v3.2: `outbox_claim` cuenta el intento al reclamar, de modo que un evento venenoso que tumba el Worker antes de `outbox_fail` llega igualmente a los 10 intentos y a `system.outbox_dead`, marcado una sola vez con `dead_at`; `outbox_ack(p_ids, p_worker)` y `outbox_fail(p_id, p_worker, p_error)` solo actúan sobre filas reclamadas por `p_worker`), `public.system_health() returns jsonb` service_role (outbox atrasado, jobs deshabilitados).
- Tipos: `pnpm --filter types db:types` → `packages/types/src/database.ts` commiteado.

**Pasos:**
- [ ] 1. Test que falla (`supabase/test/migrations.test.ts`, sustituye al de 1.8):
```ts
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const dir = new URL('../migrations/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const read = (n: string) => readFileSync(new URL(n, dir), 'utf8').replace(/--.*$/gm, '');
describe('migrations (DATOS §10.2)', () => {
  it('starts with the base migration and has no legacy files', () => {
    expect(files[0]).toBe('20261028100000_base.sql');
    expect(files.some((f) => /^202609|^20260930/.test(f))).toBe(false);
  });
  it('every security definer fixes search_path and revokes public/anon/authenticated', () => {
    for (const f of files) for (const m of read(f).matchAll(/create (?:or replace )?function\s+([\w.]+)\s*\(([\s\S]*?)\)[\s\S]*?language[\s\S]*?(?=;\s*$|\$\$)/gim)) {
      const body = m[0];
      if (!/security definer/i.test(body)) continue;
      expect(body, m[1]).toMatch(/set search_path = ''/);
      expect(read(f), m[1]).toMatch(new RegExp(`revoke all on function ${m[1].replace('.', '\\.')}[\\s\\S]*?from public, anon, authenticated`, 'i'));
    }
  });
  it('every public table enables RLS and has no `for all` policy', () => {
    for (const f of files) {
      const sql = read(f);
      for (const t of sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)) expect(sql, t[1]).toMatch(new RegExp(`alter table public\\.${t[1]} enable row level security`, 'i'));
      expect(sql).not.toMatch(/create policy[\s\S]*?for all/i);
    }
  });
  it('never uses bare auth.uid() in a policy and never creates a view', () => {
    for (const f of files) { const sql = read(f); expect(sql).not.toMatch(/(?<!\(select )auth\.uid\(\)/); expect(sql).not.toMatch(/create (or replace )?view/i); }
  });
  it('is additive after the base migration', () => {
    for (const f of files.slice(1)) expect(read(f)).not.toMatch(/\b(drop table|truncate|delete from)\b/i);
  });
});
```
- [ ] 2. `pnpm --filter supabase test` → FAIL. Borrar los ficheros listados; escribir `20261028100000_base.sql` y el `config.toml`.
- [ ] 3. `supabase start && supabase db reset` → OK; `supabase status` imprime las claves locales que usa `supabase-test-clients.ts`.
- [ ] 4. Reescribir `seed.sql` (sección 1 y 2 del actual se mantienen; sección 3 con `packs`/`pack_options`/`extras`; sección 10 `test_set_email_confirmed`). `supabase db reset` → OK.
- [ ] 5. `pnpm --filter types db:types`; `pnpm --filter types test -- database-drift` PASS; `pnpm --filter supabase test` PASS.
- [ ] 6. Prueba manual: `psql` local → `set role anon; select * from public.packs;` → `permission denied`; `set role authenticated; select private.is_admin();` → `false`.
- [ ] 7. Commit: `git commit -m "feat(supabase): schema from scratch (base migration: private schema, helpers, staff, profiles, catalogue, quotas, jobs, outbox), local config and seed accounts"`.

**Hecho cuando:** `db reset` en verde, `database.ts` regenerado, test de migraciones en verde, y en el repo no queda ninguna referencia a `baseline`, `nrgrmymsjtgayzejtawa` ni a la Edge Function `notify` salvo en documentos históricos.

### Tarea 1.7 — Gateway: CORS con comodín, `routes-manifest`, `scheduled` y deuda menor

**Agente:** implementador-web · **Gate:** no · **Depende de:** 1.3

> **v2.1 (eng review):** (a) **CORS de previews**: la lista es `https://josecoded.com,https://www.josecoded.com,https://*-josecoded-web.jose.workers.dev,http://localhost:3000`; `isAllowedOrigin` acepta `https://*-<resto>` como «prefijo `[a-z0-9]+` + guion + resto exacto» y `https://*.<host>` como sufijo con punto; tests de límite: `https://josecoded-web.jose.workers.dev` → false, `https://evil-josecoded-web.jose.workers.dev` → true (es un preview real; los previews no tienen datos de producción), `https://x.jose.workers.dev` → false, `https://abc-josecoded-web.jose.workers.dev.evil.com` → false; (b) **un único Cron Trigger `*/5 * * * *`** en `wrangler.jsonc` y `src/scheduled.ts` como despachador sobre `private.scheduled_jobs` con `nextRun` (parser de `radar-core/src/cron.ts` con `tz`; hasta 7.3, una copia mínima en `apps/api/src/utils/cron.ts` que 7.3 sustituye) y presupuesto de ≤ 40 subpeticiones por invocación (`SubrequestBudget` que envuelve `fetch` y `env.AI.run` y lanza `budget_exhausted`); test: dos trabajos vencidos se ejecutan en orden y el tercero espera si el presupuesto se agota; (c) `wrangler.jsonc` con `env.preview` = Worker **`josecoded-api-preview`** (secretos, `RADAR_KV` y rate limiters propios); `worker.service.ts` acepta `WORKER_INTERNAL_TOKEN` o `WORKER_INTERNAL_TOKEN_PREV`; (d) `envSchema` sin `QUOTA_KV` (sustituido por la RPC `increment_quota`, 1.8) y con `AI_GATEWAY_ID` **obligatorio** desde 3.7, `GITHUB_APP_*`, `WORKER_INTERNAL_TOKEN_PREV`.

**Objetivo:** cambios aditivos del gateway que todas las rutas nuevas necesitan (DT §3.6).

**Ficheros:**
- Crear: `apps/api/src/routes-manifest.ts` (`export const routes = [...] as const` con `{ method, path, module }` de cada ruta registrada; lo lee `build-info.ts` de la web), `apps/api/src/scheduled.ts` (`export async function scheduled(event, env, ctx) {}` que despacha por `event.cron` a handlers registrados en un `Map`; vacío hasta 7.17), `apps/api/src/utils/cors-origins.ts`, `apps/api/src/utils/cors-origins.test.ts`, `apps/api/src/routes-manifest.test.ts`.
- Modificar: `apps/api/src/index.ts` (usar `isAllowedOrigin` en el CORS; `export default { fetch: app.fetch, scheduled }`; `app.onError` sin `error.message` en `details` fuera de `API_MODE=development`), `apps/api/src/utils/*` donde esté `toUpstreamFail` (quitar "Android emulator" del texto), `apps/api/src/config/env.ts` (`envSchema` con `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `NOTIFY_SHARED_SECRET`, `N8N_LEAD_WEBHOOK_ENABLED`, `PROPOSALS_DAILY_LIMIT_IP`, `PROPOSALS_DAILY_LIMIT_ALL`, `AI_PROPOSAL_MODEL`, `AI_GATEWAY_ID`, `ALLOWED_TURNSTILE_HOSTNAMES`, `LEADS_RATE_LIMITER`, `AFFILIATE_RATE_LIMITER`, `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`, `WORKER_INTERNAL_TOKEN_PREV` — todos opcionales por ahora; **sin `QUOTA_KV`**, v2.1), `apps/api/wrangler.jsonc` (`ratelimits` 1002, 1003 y 1004 de DT §3.6/§0b; `triggers.crons: ['*/5 * * * *']`; `env.preview` con `name: josecoded-api-preview`).

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

### Tarea 1.8a — Migraciones del CRM, leads, área de clientes, afiliados y comentarios + seed + tests RLS (local) (v3.2)

**Agente:** implementador-web · **Rama:** `chore/supabase` · **Gate:** no (solo local) · **Depende de:** 1.6 · **Insumos:** DATOS §4.3–§4.5, §5, §6, §7, §8.3; `Comercial/agencias.md` (estados de agencia), `Comercial/agencias-mensajes.md` (reglas de las plantillas, sin datos personales); `pricing.json` (P5 y `plus`)

> **v3.2:** sustituye a la 1.8 de v2.1 y absorbe la parte CRM de la 1.11. Las tablas se crean **en su forma final** (DATOS): sin mapeo a tablas heredadas, sin vistas. El SQL de las migraciones de la rama se recicla donde DATOS lo indica.

**Objetivo:** existen en local, con RLS probada con las cuatro cuentas, las 17 tablas de DATOS §4.3–§4.5 (`crm_organizations`, `crm_contacts`, `leads`, `crm_interactions`, `crm_message_templates`, `crm_message_drafts`, `clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_extras`, `upgrade_requests`, `affiliates`, `affiliate_rewards`, `blog_comments`) y el bucket `client-assets`, con sus RPC (`create_lead`, `admin_close_lead_paid`, `crm_import_organizations`, `request_upgrade`, `claim_client_access`, `area_lead_summary`, `affiliate_leads`, `admin_counters`) y los triggers de outbox.

**Ficheros:**
- Crear (una migración por bloque, SQL con los campos exactos de DATOS §4; cada una termina con sus `grant`):
  - `20261028100100_crm.sql`: enums de §4.3; `private.contact_status_ok`; `crm_organizations`, `crm_contacts`, `crm_interactions`, `crm_message_templates`, `crm_message_drafts`; trigger `private.crm_contact_status_change`; RLS admin (4 políticas por tabla con `(select private.is_admin())`); seed de plantillas (reglas y estructura de `agencias-mensajes.md`, **sin nombres ni empresas**).
  - `20261028100200_leads.sql`: enums `lead_status`, `lead_source`, `contact_via`; tabla `leads`; RPC `create_lead(p jsonb)` (service_role; `enqueue('lead.created')`); política admin; `affiliate_code` FK se añade en la migración de afiliados (`alter table leads add constraint` allí).
  - `20261028100300_clients.sql`: enums `project_phase`, `task_status`, `asset_source`, `client_extra_status`, `upgrade_status`; `private.client_id_of()`; `clients` (grant por columnas sin `notes_internal`), `client_tasks`, `client_task_comments`, `client_extras`, `upgrade_requests`; RPC `request_upgrade` (reciclar `20260917100500_upgrade_requests.sql`: precio = `packs.price` destino − origen + `extras.price`; `assert_email_confirmed()`; `enqueue('upgrade.requested')`), `claim_client_access` (reciclar `20260917100600_client_access_claim.sql`; además `update crm_contacts set user_id`), `area_lead_summary` (reciclar de `20260929100000_user_profiles.sql`; lee `leads` + `crm_contacts.email`).
  - `20261028100400_client_assets.sql`: tabla + bucket `client-assets` (`insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)`) + políticas en `storage.objects` (DATOS §8.3) + trigger `enqueue('asset.uploaded')`.
  - `20261028100500_affiliates.sql`: enums `affiliate_level`, `reward_type`, `reward_status`; `affiliates` (reciclar trigger `set_affiliate_code` de `20260917100300_affiliates.sql`), `affiliate_rewards`; FK `leads.affiliate_code → affiliates(code)`; RPC `affiliate_leads()`; RPC `admin_close_lead_paid` (reciclar `20260917100650_admin_close_lead_paid.sql` + crear `clients` si no existe + `crm_contacts.status = 'active_client'` + interacción `lead_won`).
  - `20261028100600_blog_comments.sql`: reciclar `20260917100200_blog_comments.sql` con `post_slug`, `comment_status`, `private.comment_parent_ok`, grant `anon: select`, trigger `enqueue('comment.pending')`.
  - `20261028100700_admin_counters.sql`: `admin_counters()` con los 7 contadores de DATOS §6.
- Modificar: `supabase/seed/seed.sql` (añadir: organización «Agencia Test» `fit=4`; contactos: Marta `kind='lead'` con un lead `open` P2 vía `web_proposal` y `affiliate_code='ANA-TEST01'`, Ana `kind='client'` `active_client` con su `client` P2 (`user_id` de Ana) y un lead `won` pagado, agencia `pending`, reclutador `new`, cliente invitado `invite_email='sin@test'` sin `user_id`; 2 tareas de Ana, 1 comentario interno y 1 no interno; `client_extras` `seo_basic` incluido; Ana afiliada `standard` `ANA-TEST01`, Bob `premium` `BOB-TEST01`; recompensa `pending` de Bob por el lead de Ana; comentarios: uno aprobado de Bob, uno pendiente de Ana y otro de Bob), `apps/web/tests/rls.test.ts` (reescrito: una aserción por celda de DATOS §5; reutilizar `clientFor`, `SEED`), `apps/web/tests/helpers/supabase-test-clients.ts` (añadir ids nuevos a `SEED`: `contacts`, `clients`, `leads`, `orgs`).
- Tipos: `pnpm --filter types db:types`; `packages/types/src/crm.ts` (`ContactKind`, `ContactStatus` por kind, `LeadStatus`, … como `Enums<>`), `packages/types/src/schemas/crm.ts` (zod: `createLeadInput`, `interactionPayload`, `importOrganizationsRow`), barrel.

**Pasos:**
- [ ] 1. Tests que fallan (`apps/web/tests/rls.test.ts`, extracto; completar hasta cubrir §5):
```ts
describe('crm', () => {
  it('ana, bob and anon read 0 rows of every crm_* table and of leads', async () => {
    for (const c of [ana, bob, anon]) for (const t of ['crm_organizations','crm_contacts','crm_interactions','crm_message_templates','crm_message_drafts','leads']) {
      const { data, error } = await c.from(t).select('id'); expect(error ? true : data!.length === 0, `${t}`).toBe(true);
    }
  });
  it('contact status must match its kind', async () => {
    const { error } = await jose.from('crm_contacts').insert({ kind:'agency', display_name:'X', status:'won', source:'manual' }); expect(error).toBeTruthy();
  });
  it('changing a status without next action fails; with it, logs an interaction', async () => {
    const { error } = await jose.from('crm_contacts').update({ status:'contacted' }).eq('id', SEED.contacts.marta); expect(error?.message).toMatch(/next_action/);
    await jose.from('crm_contacts').update({ status:'contacted', next_action:'call', next_action_at: new Date().toISOString() }).eq('id', SEED.contacts.marta);
    const { data } = await jose.from('crm_interactions').select('kind,payload').eq('contact_id', SEED.contacts.marta).eq('kind','status_change'); expect(data![0].payload).toMatchObject({ from:'new', to:'contacted' });
  });
  it('create_lead is idempotent and reuses the contact by email', async () => {
    const p = { email:'nuevo@test', display_name:'Nuevo', source:'web_form', via:'client', locale:'es', idempotency_key:'k1', message:'hola' };
    const a = await service.rpc('create_lead', { p }); const b = await service.rpc('create_lead', { p });
    expect(a.data![0].created).toBe(true); expect(b.data![0].lead_id).toBe(a.data![0].lead_id);
    const { count } = await jose.from('crm_contacts').select('*', { count:'exact', head:true }).eq('email','nuevo@test'); expect(count).toBe(1);
    const { data: ob } = await service.rpc('outbox_claim', { p_limit: 50, p_worker: 'test' }); expect(ob!.some((e: any) => e.event === 'lead.created')).toBe(true);
  });
  it('ana cannot call create_lead nor crm_import_organizations', async () => {
    expect((await ana.rpc('create_lead', { p: {} })).error).toBeTruthy();
    expect((await ana.rpc('crm_import_organizations', { p_rows: [] })).error?.message).toMatch(/forbidden|permission/);
  });
  it('import is idempotent by normalized name', async () => {
    const rows = [{ name:'Agencia  Test', kind:'agency', fit:5 }];
    const a = await jose.rpc('crm_import_organizations', { p_rows: rows }); expect(a.data![0]).toMatchObject({ created:0, updated:1 });
    const { count } = await jose.from('crm_organizations').select('*', { count:'exact', head:true }).eq('name_normalized','agencia test'); expect(count).toBe(1);
  });
});
describe('area', () => {
  it('ana reads her client without notes_internal', async () => { const { data, error } = await ana.from('clients').select('id, pack_code, notes_internal'); expect(error).toBeTruthy(); const ok = await ana.from('clients').select('id, pack_code'); expect(ok.data).toHaveLength(1); });
  it('bob (no client) reads 0 clients/tasks; ana reads her tasks and only non-internal comments', async () => { /* … */ });
  it('ana inserts a non-internal comment; an internal one fails', async () => { /* … */ });
  it('upgrade only through request_upgrade; price computed in DB (P2→P3 = 1100)', async () => { /* … */ });
  it('sin@test cannot claim_client_access nor read area_lead_summary; ana gets her lead summary', async () => { /* … */ });
  it('storage: ana uploads under clients/<her id>/<asset id> only', async () => { /* … */ });
});
describe('affiliates and comments', () => {
  it('ana cannot change her level; affiliate_leads() returns referred leads without contact data', async () => { /* … */ });
  it('admin_close_lead_paid creates client, reward and active_client status; rejects ana', async () => { /* … */ });
  it('anon reads only approved comments; ana sees her pending; ana cannot insert approved', async () => { /* … */ });
});
```
- [ ] 2. `supabase db reset` → FAIL en seed; `pnpm --filter web test -- rls` → FAIL.
- [ ] 3. Escribir las 7 migraciones, el seed y los tipos; `pnpm --filter types db:types`.
- [ ] 4. `supabase db reset` OK; `pnpm --filter web test -- rls` PASS (≥ 35 aserciones); `pnpm --filter supabase test` PASS; `pnpm --filter types test` PASS.
- [ ] 5. Script de carga local **no commiteado** (`supabase/scripts/load-local.sql`, en `.gitignore`): 1.000 contactos, 10.000 interacciones, 500 hilos; `explain (analyze, buffers)` de C2, C3 y P10 (DATOS §7) → sin `Seq Scan`; pegar los planes en el PR.
- [ ] 6. Test de repo `apps/api/test/no-gmail-send.test.ts` (DATOS §10.7): `grep -r "messages.send\|users.messages.send" apps packages` vacío.
- [ ] 7. Commit: `git commit -m "feat(supabase): crm, leads, client area, affiliates and blog comments with RLS, outbox triggers and RPCs"`.

**Hecho cuando:** `db reset` + RLS + migraciones + deriva en verde; planes de `explain` adjuntos; `database.ts` commiteado.

### Tarea 1.8b — Migraciones del chat por casos (`chat_contexts`, `chat_threads`, `chat_messages`), Realtime, RPC y tests RLS (local) (v3.2)

**Agente:** implementador-web · **Rama:** `chore/supabase` · **Gate:** no (solo local) · **Depende de:** 1.8a · **Insumos:** DATOS §4.6, §6, §8.6; spec v2.0 §0.4

> **v3.2:** absorbe la parte de chat de la 1.11. `anon` no tiene grants: el visitante anónimo opera siempre por el gateway.

**Ficheros:**
- Crear: `supabase/migrations/20261028100800_chat.sql` (enums `chat_case`, `context_status`, `thread_status`, `chat_sender`, `chat_message_type`; tablas con índices de DATOS §4.6; `uq (case, locale) where status='published'`; trigger `private.chat_message_after_insert`; RLS: admin todo, `authenticated` `select` de sus hilos y mensajes, admin `insert` mensajes `jose`; `alter publication supabase_realtime add table public.chat_messages`; RPC `chat_context_published(p_case, p_locale)` stable service_role; RPC `chat_purge_anonymous(p_older_than)` service_role; `admin_counters()` ya cuenta `chat_unread`).
- Modificar: `supabase/seed/seed.sql` (dos `chat_contexts` publicados `client/es` y `curious/es` con `{{DATO}}` visibles, uno en borrador `partner/es`; un hilo anónimo `case='partner'` con 2 mensajes y uno de Ana `case='client'` con `user_id`, enlazado a su contacto), `apps/web/tests/rls.test.ts` (`describe('chat')`), `packages/types/src/chat.ts` + `schemas/chat.ts` (`ChatContextFacts` zod).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
describe('chat', () => {
  it('only one published context per case and locale', async () => { const { error } = await jose.from('chat_contexts').insert({ case:'client', locale:'es', version:9, status:'published', body_md:'x' }); expect(error?.message).toMatch(/unique|duplicate/); });
  it('chat_context_published is callable only by service role and returns null when unpublished', async () => {
    expect((await ana.rpc('chat_context_published', { p_case:'client', p_locale:'es' })).error).toBeTruthy();
    expect((await service.rpc('chat_context_published', { p_case:'client', p_locale:'es' })).data).toMatchObject({ version: 1 });
    expect((await service.rpc('chat_context_published', { p_case:'partner', p_locale:'es' })).data).toBeNull();
  });
  it('ana reads only her thread and its messages; bob and anon read none; jose reads the anonymous one', async () => { /* … */ });
  it('a visitor message marks the thread unread and enqueues chat.visitor_message', async () => { /* … service insert, then jose reads unread_for_admin, outbox_claim … */ });
  it('chat_purge_anonymous deletes only anonymous threads without contact older than the interval', async () => { /* … */ });
});
```
- [ ] 2. `db reset` FAIL → migración + seed → `db reset` OK; `pnpm --filter web test -- rls` PASS (≥ 10 nuevas); `db:types`; `pnpm --filter types test` PASS.
- [ ] 3. Realtime manual: `supabase status` → con el cliente de Ana, `channel('chat').on('postgres_changes', { table:'chat_messages' })` recibe el insert de su hilo y **no** el del hilo anónimo.
- [ ] 4. Commit: `git commit -m "feat(supabase): case-based chat tables with realtime, published-context RPC and anonymous purge"`.

**Hecho cuando:** RLS en verde; Realtime verificado; `database.ts` commiteado.

### Tarea 1.8c — Gateway sobre el proyecto nuevo: adaptador Supabase, drenaje del outbox, retirada de `forum/*` y `admin-chat/*` (v3.2)

**Agente:** implementador-web · **Rama:** `chore/supabase` · **Gate:** no · **Depende de:** 1.7, 1.8b; **decisiones Q1 y Q2 de DATOS §12** (se aplican las recomendaciones si Jose no dice otra cosa) · **Insumos:** DATOS §8.4, §9; WA §17.1

**Objetivo:** el gateway deja de depender de tablas heredadas y habla con el proyecto nuevo a través de un adaptador; el cron drena el outbox; las rutas sin tabla desaparecen.

**Ficheros:**
- Crear: `apps/api/src/adapters/supabase.ts` (puerto `SupabaseGateway { verifyUser(jwt): Promise<User|null>; isAdmin(userId): Promise<boolean>; admin(): SupabaseClient<Database> }`, único fichero que importa `@supabase/supabase-js` junto a `scheduled-jobs.ts`), `apps/api/src/adapters/outbox.ts` (`OutboxRepo { claim, ack, fail }` sobre las RPC), `apps/api/src/jobs/outbox-drain.ts` (handler `outbox.drain`: por evento → `telegram.send` o `email.send`; `lead.created` y `chat.*` con clave de idempotencia `payload.id`), `apps/api/src/adapters/telegram.ts` (`sendMessage` con `TELEGRAM_BOT_TOKEN` y `TELEGRAM_ADMIN_CHAT_ID`), `apps/api/test/outbox-drain.test.ts` (fetchMock: ack tras 200, fail tras 500, `attempts ≥ 10` → `system.outbox_dead`).
- Borrar: `apps/api/src/modules/forum.routes.ts`, `services/forum.store.ts`, `forum.pg-store.ts`, `forum.mock-store.ts`, `modules/admin-chat.routes.ts`, `modules/admin-chat-admin.routes.ts`, `services/admin-chat-assistant.service.ts`, `services/admin-chat.pg-store.ts`, `services/supabase.service.ts`, sus tests y fixtures.
- Modificar: `apps/api/src/deps.ts` (`buildDeps(env)` añade `supabase`, `outbox`, `telegram`), `middlewares/auth.middleware.ts` (usa `deps.supabase.verifyUser`; `requireAdmin` exige `deps.supabase.isAdmin` **y** `aal === 'aal2'` si `env.ADMIN_REQUIRE_MFA !== 'false'`), `modules/v1-protected.routes.ts` (`auth/me` devuelve `{ id, email, is_admin }` vía `deps`), `modules/v1.routes.ts` (desmonta `forum` y `admin-chat`), `scheduled.ts` (registra `outbox.drain`), `env.ts` (`envSchema`: fuera `FORUM_*`, `ADMIN_SUPERUSER_*`, `N8N_CHAT_WEBHOOK_*`; dentro `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `RESEND_API_KEY` opcional, `CHAT_SID_SECRET`), `wrangler.jsonc` (vars limpias; `env.preview` igual), `test/routes-manifest.test.ts` (snapshot nuevo), `DEPLOY.md`, `README.md` de `apps/api`, `packages/config/eslint.config.mjs` (fuera la lista literal de excepciones heredadas: ya no hace falta), `docs/architecture.md` («inherited routes» → `health`, `system`, `v1-protected`).

**Pasos:**
- [ ] 1. Tests que fallan: snapshot de rutas sin `forum`/`admin-chat`; `auth/me` devuelve `is_admin`; `outbox-drain.test.ts`; test de ESLint (`packages/config/test/eslint.test.ts`): `@supabase/supabase-js` solo en `adapters/`.
- [ ] 2. Implementar; `pnpm --filter api test` PASS (workerd); `pnpm lint && pnpm typecheck` PASS sin excepciones heredadas.
- [ ] 3. `wrangler dev` contra Supabase local (`SUPABASE_URL=http://127.0.0.1:54321`, claves de `supabase status` en `.dev.vars`): `curl /api/v1/auth/me` con el JWT de `jose@test` → `is_admin: true`; disparar `scheduled` (`--test-scheduled`) tras insertar un evento → Telegram falso (fetchMock) recibe el mensaje y la fila queda `delivered_at`.
- [ ] 4. Commit: `git commit -m "refactor(api): supabase adapter, outbox drain job, retire forum and admin-chat modules"`.

**Hecho cuando:** gateway sin importaciones de `supabase-js` fuera de `adapters/`, sin rutas huérfanas, cron drena el outbox, snapshot y DEPLOY.md actualizados. **Cierre de la 1b:** `revisor` sobre la rama; `/puerta-calidad` reducida (`qa`: `db reset` + RLS + `wrangler dev`; `revisor-seguridad`: grants, `security definer`, RLS, `anon` sin acceso, secretos).

### Tarea 1.8d — Gateway sin Omen: `WORKER_*` opcionales, 503 `worker_not_configured`, sin sonda pública (hecha)

**Agente:** implementador-web · **Rama:** `main` (autorizado por Jose) · **Gate:** no · **Depende de:** 1.8c · **Insumos:** `docs/superpowers/design/2026-10-31-omen-rol.md` (decisión Q1 de Jose, 2026-10-31)

**Objetivo:** la web y el gateway funcionan en producción sin Omen configurado. Omen se conserva fuera del producto (Umami, Radar, newsletter y, si el estudio sale bien, chat de IA) y la integración con el worker sigue disponible pero opcional.

**Hecho:** `envSchema` con `WORKER_URL` y `WORKER_INTERNAL_TOKEN` opcionales y acoplados (`refine`: los dos o ninguno), sin placeholders locales; fuera `WORKER_INTERNAL_TOKEN_PREV`, `WORKER_TIMEOUT_MS` y `N8N_LEAD_WEBHOOK_ENABLED`; `callWorker` lanza `WorkerNotConfiguredError` (503 `worker_not_configured`) sin llamar a la red; `GET /system/status` público **borrado** (cerraba el pendiente de seguridad: llamaba a Omen con el token interno sin auth; también `modules/system.routes.ts` y el módulo `system` del manifiesto); `GET /api/v1/system/status` (con sesión) responde 503 `worker_not_configured` sin Omen y 502 si Omen cae; `/api/dev/worker/*` responde 404 salvo con `WORKER_URL` + `DEV_API_KEY` y `API_MODE=development`; `wrangler.jsonc` sin `WORKER_URL` (desaparece el aviso de `env.preview.vars`); snapshot, `DEPLOY.md`, `README.md`, `docs/architecture.md` y tests actualizados.

**Verificación:** `pnpm --filter josecoded-api test`, `pnpm lint`, `pnpm typecheck`, `pnpm --filter josecoded-api build` (dry-run). **Commit:** `feat(api): gateway runs without Omen (1.8d): optional coupled worker env, 503 worker_not_configured, no public status probe`.

**Notas de ajuste a otras tareas (una línea cada una, sin reescribirlas):** 1.9 paso 9: en producción y preview **no se fija** `WORKER_INTERNAL_TOKEN` ni `WORKER_URL`; el `.env` de Omen solo se limpia de `SUPABASE_*` (higiene, sin OK adicional) · 6.1: la tarjeta «Infra» muestra salud de Supabase y Workers AI y «Omen» solo si `WORKER_URL` existe · 9.4 paso 3: sin rotación de `WORKER_INTERNAL_TOKEN` (no hay token en producción) · 9.4 paso 4: `/api/dev/worker/*` no existe en producción y `blog-ai.ts` local solo funciona con `WORKER_URL` + `DEV_API_KEY` en el gateway de desarrollo · el script de Umami (8.1) debe cargar asíncrono y tolerar fallo, porque Omen puede caer sin que caiga la web · D22: el respaldo en Omen de Workers AI queda a la espera del estudio de coste/latencia/fiabilidad previo a 4.4.

### Tarea 1.9 — CI/CD + **GATE**: proyecto Supabase nuevo en producción (esquema, Auth, secretos de web, gateway y Omen) (v3.2)

**Agente:** implementador-web (workflows, checklist) + **controlador** (todo lo que toca el proyecto `echlwywbucgbhwpncviy`, con OK de Jose en cada paso) · **Gate:** **SÍ** · **Depende de:** 1.5, 1.7, 1.8a–c · **Insumos de Jose:** cliente IDs/secretos de OAuth Google y GitHub; cuenta SMTP (Resend, Q5) y dominio verificado; decisiones Q3–Q6 de DATOS §12; token de Supabase en su Mac (`supabase login`); `TELEGRAM_BOT_TOKEN` y su `chat_id`

> **v3.2:** sustituye a la 1.9 de v2.1. **Sin baseline**: el repo es la fuente y el proyecto está vacío. Se aplica con `supabase db push` (queda registrado en `supabase_migrations.schema_migrations`), no con `apply_migration` fichero a fichero. Mantiene de v2.1: `preview.yml` con `josecoded-api-preview`, `supabase-ping.yml` con Telegram directo, `deploy-production.yml` **nunca migraciones**, job `newsletter-content-only` y `deploy-content.yml`.

**Objetivo:** CI reproducible (Supabase local en cada run) y el proyecto nuevo configurado y poblado con el esquema, con Jose como admin con TOTP, y todos los consumidores (web, gateway prod y preview, Omen) apuntando a él.

**Ficheros:**
- Crear: `.github/workflows/ci.yml` (install → `turbo lint typecheck test` → `pnpm --filter web build` → `supabase start && supabase db reset` → `rls.test.ts` + `database-drift` → Playwright contra `wrangler dev` (web + api con `.dev.vars` locales) → Lighthouse CI (2.9) → `visual` (2.13)), `preview.yml`, `deploy-production.yml` (smoke tras el deploy del api: `GET /api/v1/health` 200, `GET /api/v1/auth/me` sin JWT → 401; **sin** rutas `forum`/`admin-chat`), `supabase-ping.yml` (semanal: `GET ${SUPABASE_URL}/rest/v1/` con publishable key + `POST /rest/v1/rpc/system_health` con la clave secreta desde un secreto de Actions **o**, mejor, `GET https://api.josecoded.com/api/v1/system/health` que lo hace el gateway → si falla o hay outbox atrasado, Telegram directo con `TELEGRAM_PING_TOKEN`), `supabase/templates/{confirmation,magic_link,otp,recovery,email_change}.{es,en}.html` (plantillas de Auth versionadas; `redactor` revisa el texto), `docs/runbooks/supabase-gate.md` (checklist de abajo para repetirlo en 7.7 y 10.1).
- Modificar: `ESTADO.md` (fecha, advisors), `apps/web/wrangler.jsonc` y `apps/api/wrangler.jsonc` (`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` nuevas), `.env.example`/`.dev.vars.example`.

**Pasos (cada uno de 3 a 11 con OK explícito de Jose en la sesión; el controlador ejecuta, nunca un subagente):**
- [ ] 1. `implementador-web`: escribir los cuatro workflows y las plantillas; abrir el PR de `chore/supabase` → `ci.yml` y `preview.yml` en verde.
- [ ] 2. **Pedir OK a Jose** mostrando: lista de migraciones (`ls supabase/migrations`), ajustes de Auth/API/Storage que se van a tocar, lista de secretos a crear/rotar y en qué Worker, y que **no hay nada que migrar del proyecto viejo**.
- [ ] 3. **Esquema:** en el Mac de Jose, `supabase link --project-ref echlwywbucgbhwpncviy` → `supabase db push --dry-run` (debe listar exactamente las migraciones del repo, nada más) → `supabase db push` → `supabase migration list` coincide con el repo. **Nunca** `db reset` ni `db push --include-seed` contra producción.
- [ ] 4. **Advisors:** `get_advisors` security + performance → **cero hallazgos** (DATOS §10.4). Si aparece alguno: se corrige con una migración nueva en la rama, `db push`, repetir. `list_tables` → las 24 tablas de `public` y ninguna más; `private` no expuesto (`curl …/rest/v1/quota_counters` con publishable key → 404).
- [ ] 5. **API:** dashboard → Settings → API: exposed schemas `public` solo (quitar `graphql_public`), max rows 200. Comprobar `curl …/rest/v1/packs` con publishable key → `permission denied` (anon sin grants).
- [ ] 6. **Auth:** proveedores Google y GitHub (client id/secret de Jose; redirect `https://echlwywbucgbhwpncviy.supabase.co/auth/v1/callback`), email con OTP (**sin contraseña** si Q4 = recomendación: deshabilitar «Email password sign-in»), «Confirm email» **on**, SMTP propio (Q5) con remitente `cuenta@josecoded.com` y prueba de envío, plantillas es/en pegadas desde `supabase/templates/` (una sola plantilla por tipo con bloque es + en), CAPTCHA Turnstile con la site key de la web, MFA TOTP habilitado, `site_url = https://josecoded.com`, redirect allowlist (DATOS §8.1), «Leaked password protection» on (solo aplica si hay contraseñas), rate limits por defecto.
- [ ] 7. **Jose admin:** Jose entra en `https://echlwywbucgbhwpncviy.supabase.co` no, en la web de preview (`/auth`) con Google → el controlador copia su `auth.users.id` → SQL en el editor del dashboard (o `psql` con la contraseña de Jose) `insert into public.staff_members (user_id, role, display_name, telegram_chat_id) values (…)` → Jose **enrola TOTP** (Q3) desde `/perfil` cuando exista o desde la API de MFA del dashboard → `GET /api/v1/auth/me` devuelve `is_admin: true`.
- [ ] 8. **Storage:** confirmar en el dashboard que `client-assets` existe (lo creó la migración) y es privado; subir y descargar un fichero de prueba con la cuenta de Jose y borrarlo.
- [ ] 9. **Secretos y variables** (`wrangler secret put` / `wrangler.jsonc`; valores de Settings → API Keys, formato nuevo): **web** (`josecoded-web` y su preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; **gateway** `josecoded-api` **y** `josecoded-api-preview`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `CHAT_SID_SECRET` (nuevo, `openssl rand -hex 32`), y **borrar** `ADMIN_SUPERUSER_ID`, `ADMIN_SUPERUSER_EMAIL`, `N8N_CHAT_WEBHOOK_URL`, `N8N_CHAT_WEBHOOK_SECRET`, `FORUM_*`, `NOTIFY_SHARED_SECRET`; **Omen** (`josecoded-worker`): revisar su `.env` y **eliminar** cualquier `SUPABASE_*` heredada (el código no las usa; no se sustituyen) y reiniciar el contenedor con `implementador-infra` (servicios preexistentes intactos); **GitHub Actions**: `TELEGRAM_PING_TOKEN`, `TELEGRAM_PING_CHAT_ID` (ya previstos), `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` del proyecto nuevo para `supabase-ping.yml`. **Edge Function:** ninguna (Q2). Las claves del proyecto viejo no se pueden revocar (sin acceso): se eliminan de todos los sitios donde estuvieran y se anota.
- [ ] 10. **Precios:** `pnpm pricing:sync-db` → revisar `supabase/generated/pricing-sync.sql` → aplicarlo con `apply_migration` (MCP) o `psql` → `select code, price from packs` coincide con `pricing.json` (P1–P5 y `plus`). **v3.4 (D54):** si este paso aún no se ha hecho cuando llegue 1.9c, se hace **allí** con la migración 7 ya aplicada (nombres es/en y extras incluidos); si ya se hizo, 1.9c solo completa las columnas nuevas. Es la **única** vez que el fichero escribe en la base; después la base es la fuente.
- [ ] 11. **Smoke:** `wrangler deploy` del gateway (preview primero, luego prod con OK) → `curl https://api.josecoded.com/api/v1/health` 200; `auth/me` sin JWT 401 y con el JWT de Jose `is_admin: true`; `wrangler tail` durante un tick del cron → `outbox.drain` sin errores; `get_advisors` de nuevo → cero.
- [ ] 12. Anotar en `ESTADO.md` («Decisiones recientes»: fecha, migraciones aplicadas, advisors, qué secretos se rotaron, Q1–Q6 tal como quedaron) y en el ADR de codebase-memory cuando se indexe el repo (`manage_adr get` + copia antes de `index_repository`). Commit: `git commit -m "ci: ci, preview, production dispatch and supabase ping workflows; auth templates and supabase gate runbook"`.

**Hecho cuando:** CI verde en el PR; `supabase migration list` igual al repo; advisors a cero; Jose entra en la preview como admin con TOTP; web, gateway (prod y preview) y Omen sin ninguna referencia al proyecto viejo (`grep -r nrgrmymsjtgayzejtawa` vacío en repo, `wrangler secret list` y `.env` de Omen); runbook escrito.

### Tarea 1.10 — **BLOQUEANTE de la fase 2**: tokens completos en `.impeccable/design.json`, `pnpm tokens:build` → `tokens.css` y test de deriva

**Agente:** implementador-web (con `ui` para nombrar los tokens) · **Rama:** `chore/monorepo` · **Gate:** no · **Depende de:** 1.1 · **Insumos:** INV §5 (lista de tokens que faltan), `DESIGN.md` (nombres y reglas), prototipo `home-v6/{base,v6}.css` (valores), DT §1.9, working-agreements §2

> **v2.2 (stack):** `packages/design-tokens/src/emit.ts` emite también `apps/web/styles/tokens.ts`: `export type TokenName = '--bg' | …` (todas las custom properties emitidas) y `export function readToken(name: TokenName): string` (`getComputedStyle(document.documentElement).getPropertyValue(name).trim()`), más `export const tokens = { bg: '--bg', … } as const satisfies Record<string, TokenName>`. El test de deriva cubre los tres ficheros (`tokens.css`, `breakpoints.ts`, `tokens.ts`). `@josecoded/types/tokens.ts` reexporta `TokenName`; `lib/motion/` solo lee tokens con `readToken` (test de que ningún módulo de motion contiene `getPropertyValue` directo).

> **v2.1 (eng review):** rama `chore/monorepo-base`. **`tokens.css` lo regenera solo su tarea dueña** (esta y, después, la tarea que añade un token con `deviation:`); cualquier otra tarea que lo modifique falla en revisión (regla en `CLAUDE.md`).

**Objetivo:** que `.impeccable/design.json` contenga **todos** los tokens que los componentes de la home necesitan, con nombre semántico por uso (no por porcentaje), y que `apps/web/styles/tokens.css` se genere desde él con un test de deriva. Ningún componente de la fase 2 se porta antes, porque los CSS Modules solo pueden consumir tokens.

**Ficheros:**
- Modificar: `.impeccable/design.json` (añadir en `extensions`: `alphas` —violeta 6/8/10/12/14/16/18/20/30/60 % como `tint-hover`, `tint-chip`, `tint-kbd`, `tint-icon`, `tint-selected`, `tint-palette-selected`, `tint-ghost-hover`, `tint-cell-hero`, `pager-idle`, `pager-active`; blanco 5/7/9/10/28 % como `edge-*`; índigo 50/60/70/72 % como `bg-segmented`, `bg-prompt`, `header-scrolled`, `scrim`; `palette-backdrop`—, `shadows` consumibles —`shadow-button`, `shadow-key`, `shadow-keycap`, `shadow-keycap-down`, `shadow-overlay`, `shadow-card`, `shadow-card-hover`, `shadow-card-focus`—, `blurs` —4, 6, 14, 18, 24 px, `blur-beam` 5vmax—, `motion` como tokens —`dur-key` 90, `dur-fast` 150, `dur-press` 160, `dur-menu` 180, `dur-arrow` 200, `dur-slide` 240, `dur-pager` 250, `dur-slide-lg`/`dur-swap`/`dur-underline` 260, `dur-card` 360, `dur-vt` 380, `dur-draw` 420 ms, `dur-float` 6 s, `dur-marquee-a` 38 s, `dur-marquee-b` 44 s, `stagger-draw` 120 ms, `ease-out`, `ease-slide`, `ease-vt`, `glide-min` 600, `glide-max` 950, `wheel-threshold` 24, `wheel-lock` 700—, `layers` —`z-canvas` 0, `z-field` 1, `z-content` 2, `z-pager` 20, `z-header` 30, `z-menu` 31, `z-scrim` 35, `z-open` 40—, `breakpoints` **en rem** —`bp-login-icon` 22.5, `bp-hero-stack` 43.75 (alto), `bp-compact` 56.25, `bp-menu` 67.5— y de contenedor —`cq-card-stack` 15, `cq-prompt-stack` 24, `cq-list-meta` 26, `cq-bento-2` 34, `cq-packs-dividers` 40, `cq-bento-12` 52—, `gradients` —`grad-keycap`, `grad-photo`, `grad-cell-tint` (160°, 14 %), `grad-cell-hero` (135°, 20 %), `glow-art` (22 %)—; en `rounded`: `pill` → `9999rem`; en `spacing`: `gap-cell`, `size-dot` 0.375rem, `r-bubble-tail` 0.25rem, `light-cell` 22rem / `light-cell-hero` 26rem con `light-alpha` 9 %), `DESIGN.md` (documentar cada token nuevo en su apartado; lo hace el documentador de impeccable a partir del build).
- Crear: `packages/design-tokens/scripts/build.ts`, `packages/design-tokens/src/{schema,emit}.ts` (zod del `design.json` + emisión de `:root` y `breakpoints.ts`), `packages/design-tokens/test/{drift,required,emit}.test.ts`, `packages/design-tokens/required-tokens.json` (la lista obligatoria de INV §5, en kebab-case), `apps/web/styles/tokens.css` (generado), `apps/web/styles/breakpoints.ts` (generado).

**Interfaces (produce):** `pnpm tokens:build`; `tokens.css` con `:root { --bg; --ink; --text; --text-2; --text-3; --line; --line-2; --card; --card-line; --overlay; --violet; --violet-hi; --violet-soft; --beam; --green; --font-*; --r-*; --sp-*; --tint-*; --edge-*; --scrim; --header-scrolled; --shadow-*; --blur-*; --dur-*; --ease-*; --glide-*; --wheel-*; --z-*; --cq-*; --grad-*; --light-* }`; `bp` exportado desde `styles/breakpoints.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/design-tokens/test/required.test.ts
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitTokens } from '../src/emit';
const design = JSON.parse(readFileSync(new URL('../../../.impeccable/design.json', import.meta.url), 'utf8'));
const required: string[] = JSON.parse(readFileSync(new URL('../required-tokens.json', import.meta.url), 'utf8'));
it('every required token exists in design.json and is emitted', () => {
  const css = emitTokens(design).css; const missing = required.filter(t => !css.includes(`--${t}:`));
  expect(missing).toEqual([]);
});
it('breakpoints are in rem and pill radius is 9999rem', () => {
  const css = emitTokens(design).css; expect(css).toMatch(/--bp-menu: 67\.5rem/); expect(css).not.toMatch(/--bp-[a-z-]+: \d+px/); expect(css).toMatch(/--r-pill: 9999rem/);
});
```
```ts
// packages/design-tokens/test/drift.test.ts
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emitTokens } from '../src/emit';
const design = JSON.parse(readFileSync(new URL('../../../.impeccable/design.json', import.meta.url), 'utf8'));
it('committed tokens.css equals a fresh build', () => {
  expect(readFileSync(new URL('../../../apps/web/styles/tokens.css', import.meta.url), 'utf8')).toBe(emitTokens(design).css);
  expect(readFileSync(new URL('../../../apps/web/styles/breakpoints.ts', import.meta.url), 'utf8')).toBe(emitTokens(design).breakpointsTs);
});
```
- [ ] 2. `pnpm --filter @josecoded/design-tokens test` → FAIL (tokens ausentes; ficheros generados inexistentes).
- [ ] 3. Completar `design.json` con `ui` (un valor que el prototipo tiene en dos sitios con el mismo número es un token; nombres por uso); implementar `emit.ts` (kebab-case, cabecera `GENERATED`, tipografías como grupos `--font-<rol>-{size,weight,leading,tracking}`) y `build.ts`; ejecutar `pnpm tokens:build`; el documentador de impeccable actualiza `DESIGN.md`.
- [ ] 4. `pnpm --filter @josecoded/design-tokens test` → PASS; `pnpm lint` (stylelint no toca `tokens.css`, excluido); editar a mano `tokens.css` y comprobar que `drift` falla; revertir.
- [ ] 5. Commit (`design.json`, `tokens.css`, `breakpoints.ts` y `DESIGN.md` en el mismo commit): `git commit -m "feat(design-tokens): complete design.json for home-v6 and generate tokens.css with drift test"`.

**Hecho cuando:** `required.test.ts` pasa con la lista completa de INV §5, el test de deriva protege los ficheros generados y `ui` da por buenos los nombres. **Ninguna tarea 2.x con UI arranca sin esta.**

**Cierre de la fase 1:** `revisor` sobre `chore/monorepo`; `/puerta-calidad` (sin UI: `qa` prueba `wrangler dev` de api y web, `revisor-seguridad` revisa CORS, `envSchema`, RLS —incluida `user_profiles`— y workflows). **Jose protege `main` en GitHub antes del primer merge** (working-agreements §9). Merge a `main`. Arrancan en paralelo `feat/radar-core` (7.1–7.6) y `feat/glyph-scene` (2.5a).

---
> **v2.4 (decisiones de `ui` sobre tokens, 2026-10-02) para los componentes de la fase 2:** barra deslizante de packs = JS solo escribe `--pack-y` (offsetTop + offsetHeight en px) y el CSS suma el hueco con `top: calc(var(--pack-y) + var(--sp-1-5))` (sin `+6` en JS); umbral del indicador de sección medido sobre el botón (`right * 2 < button.offsetWidth`), sin constante 36; trazos de 2–3 px (pager, ciclo, raíl, packs) con `border-radius: var(--r-pill)`; `outline-offset` de los packs = `calc(var(--sp-1-5) - var(--focus-ring-width))`; tiempos del ciclo de glifos y parámetros de `scene.js` son configuración de `packages/glyph-scene`, no tokens. **Para Jose / `revisor-accesibilidad` (decidir en el navegador):** pulgar de la barra de scroll `#2c2660` sobre fondo da 1,49:1 (1.4.11 pide 3:1 si cuenta como control propio) y zona táctil del botón del pager 2,25 × 1,125rem (comprobar 2.5.8 o subir el alto sin cambiar la línea).


## Fase 1c — Esquema del CRM y del chat por casos · **(v3.0, superada por v3.2: fundida en 1.8a/1.8b/1.9; la rama `chore/crm-schema` no se crea)**

> **v3.2:** el contenido de 1.11 vive en 1.8a (CRM) y 1.8b (chat) con las tablas en su forma final de DATOS (sin mapeo a `leads`/`clients` heredados ni `crm_contacts_view`); el gate 1.12 es el 1.9. Se conserva el texto como historial.

> Nueva en v3.0 (spec v2.0 §0.6, D39–D41). **No se añade a `chore/supabase`**: la 1b se cierra como estaba y esta rama arranca al mergearla. Todo aditivo; nada heredado se altera (`leads`, `clients`, `admin_chat_*` intactos). Convenciones de 1.8: SQL literal en la tarea, `supabase db reset`, tests RLS con las cuatro cuentas del seed, `pnpm --filter types db:types` al terminar.

### Tarea 1.11 (v3.0, superada por 1.8a/1.8b) — Migraciones `crm_*` y `chat_*`, vista `crm_contacts_view`, RPC, seed y tests RLS (local)

**Agente:** implementador-web · **Rama:** `chore/crm-schema` · **Gate:** no (solo local) · **Depende de:** 1.8 (mergeada), 1.6 · **Insumos:** spec v2.0 §0.6 (tablas y campos), `agencias.md` (estados de agencia), `agencias-mensajes.md` (reglas para las plantillas)

**Objetivo:** que existan, en local y con RLS probada, las ocho tablas aditivas del CRM y del chat, la vista que une leads y clientes heredados sin duplicarlos, las RPC `crm_import_organizations` y `chat_context_published`, la publicación realtime de `chat_messages` y el seed con un contacto por `kind`, dos contextos publicados (`client`/es y `curious`/es) y un hilo anónimo.

**Ficheros:**
- Crear: `supabase/migrations/20261028100000_crm_organizations.sql`, `20261028100100_crm_contacts.sql` (tabla + check de estados por `kind` + FK nullable `lead_id`/`client_id`/`user_id` + vista `crm_contacts_view` `security_invoker` que une `leads.estado, leads.monto, leads.ai_proposal, clients.pack_template_id`), `20261028100200_crm_interactions.sql`, `20261028100300_crm_message_templates.sql` (+ seed de plantillas desde `agencias-mensajes.md`: reglas y estructura, **sin nombres ni empresas**), `20261028100400_crm_message_drafts.sql`, `20261028100500_chat_contexts.sql` (índice parcial único `(case, locale) where status='published'`; RPC `chat_context_published(p_case text, p_locale text) returns jsonb` `security definer`, `revoke from public, anon, authenticated` — solo service role), `20261028100600_chat_threads_messages.sql` (tablas + `alter publication supabase_realtime add table public.chat_messages` + RLS: admin todo; `authenticated` select de hilos con su `user_id` y de sus mensajes; `anon` nada), `20261028100700_crm_import_rpc.sql` (`crm_import_organizations(p_rows jsonb) returns table(created int, updated int)` solo admin, upsert por `name_normalized = lower(unaccent(trim(name)))`; si `unaccent` no está instalada, normalización en TS y la RPC recibe `name_normalized`), `20261028100800_admin_counters_crm.sql` (`create or replace function public.admin_counters()` **aditivo**: añade `contacts_due`, `chat_unread`, `agencies_replied` sin quitar campos).
- Modificar: `supabase/seed/seed.sql` (organización «Agencia Test» `fit=4`; contactos: lead enlazado a uno de los dos leads del seed, cliente enlazado a Ana (`client_id`), agencia `status='pending'`, reclutador; dos `chat_contexts` publicados y uno en borrador (`partner`/es); un `chat_thread` anónimo con 2 mensajes y uno de Ana con `user_id`), `apps/web/tests/rls.test.ts` (añadir `describe('crm')` y `describe('chat')`).
- Tipos: `pnpm --filter types db:types` → `packages/types/src/database.ts`; `packages/types/src/crm.ts` (`ContactKind`, `ContactStatus` por kind, `ChatCase`, `ChatContextFacts` con zod en `schemas/crm.ts`).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/tests/rls.test.ts (añadir)
describe('crm (v3.0)', () => {
  it('ana (client) reads 0 rows of every crm_* table', async () => {
    for (const t of ['crm_organizations','crm_contacts','crm_interactions','crm_message_drafts','crm_message_templates']) {
      const { data, error } = await ana.from(t).select('id'); expect(error ?? data).toSatisfy((r: any) => Array.isArray(r) ? r.length === 0 : !!r);
    }
  });
  it('jose reads contacts joined with legacy leads and clients through the view', async () => {
    const { data } = await jose.from('crm_contacts_view').select('kind, lead_estado, client_pack_code');
    expect(data!.find(c => c.kind === 'lead')!.lead_estado).toBe('nuevo');
    expect(data!.find(c => c.kind === 'client')!.client_pack_code).toBe('P2');
  });
  it('contact status must match its kind', async () => {
    const { error } = await jose.from('crm_contacts').insert({ kind:'agency', display_name:'X', status:'won' }); expect(error).toBeTruthy();
  });
  it('import is idempotent by normalized name', async () => {
    const rows = [{ name:'Agencia  Test', kind:'agency', fit:5 }];
    const a = await jose.rpc('crm_import_organizations', { p_rows: rows }); const b = await jose.rpc('crm_import_organizations', { p_rows: rows });
    expect(a.data![0]).toMatchObject({ created:0, updated:1 }); expect(b.data![0]).toMatchObject({ created:0, updated:1 });
    const { count } = await jose.from('crm_organizations').select('*', { count:'exact', head:true }).eq('name_normalized','agencia test'); expect(count).toBe(1);
  });
  it('ana cannot call crm_import_organizations', async () => { const { error } = await ana.rpc('crm_import_organizations', { p_rows: [] }); expect(error?.message).toMatch(/forbidden|permission/); });
});
describe('chat (v3.0)', () => {
  it('only one published context per case and locale', async () => {
    const { error } = await jose.from('chat_contexts').insert({ case:'client', locale:'es', version:9, status:'published', title:'dup', body_md:'x', facts:{} }); expect(error?.message).toMatch(/unique|duplicate/);
  });
  it('chat_context_published is not callable by authenticated', async () => { const { error } = await ana.rpc('chat_context_published', { p_case:'client', p_locale:'es' }); expect(error).toBeTruthy(); });
  it('ana reads only her own threads and messages; anon reads none', async () => {
    const { data } = await ana.from('chat_threads').select('user_id'); expect(data!.length).toBe(1); expect(data![0].user_id).toBe(ana.userId);
    const { data: m } = await ana.from('chat_messages').select('thread_id'); expect(new Set(m!.map(x => x.thread_id)).size).toBe(1);
    const { data: a } = await anon.from('chat_threads').select('id'); expect(a).toHaveLength(0);
  });
  it('jose reads the anonymous thread', async () => { const { data } = await jose.from('chat_threads').select('id, visitor_id').is('user_id', null); expect(data!.length).toBeGreaterThan(0); });
});
```
- [ ] 2. `supabase db reset` → FAIL en seed; `pnpm --filter web test -- rls` → FAIL.
- [ ] 3. Escribir las migraciones (campos exactos de spec §0.6), el seed y los tipos; `pnpm --filter types db:types`.
- [ ] 4. `supabase db reset` OK; `pnpm --filter web test -- rls` → PASS (≥ 10 aserciones nuevas); `pnpm --filter types test -- database-drift` PASS; `get_advisors` local sin hallazgos nuevos salvo el `security_definer` de la RPC de importación (esperado, documentar).
- [ ] 5. Commit: `git commit -m "feat(supabase): additive crm_* and chat_* tables, contacts view over legacy leads/clients, import and context RPCs, RLS tests"`.

**Hecho cuando:** `db reset` + RLS en verde; `database.ts` regenerado y commiteado; el test de 1.6 actualizado a 34 tablas (26 + 8) y el número de políticas nuevo en `baseline.meta.json` **solo tras 1.12** (hasta entonces el baseline sigue siendo el de 1.9).

### Tarea 1.12 (v3.0, superada por 1.9) — **GATE**: aplicar las migraciones del CRM y del chat en producción

**Agente:** controlador con OK de Jose (las migraciones las aplica el controlador, nunca un subagente) · **Rama:** `chore/crm-schema` · **Gate:** **SÍ** · **Depende de:** 1.11, 1.9 (aplicada)

**Pasos (cada uno con OK de Jose en la sesión):**
- [ ] 1. **Pedir OK a Jose** listando las 9 migraciones de 1.11 y que `admin_counters()` se reemplaza de forma aditiva.
- [ ] 2. `list_tables`: confirmar que no existe ninguna tabla `crm_*` ni `chat_*`, ni la vista ni las RPC; `get_advisors` (security + performance) y guardar la salida.
- [ ] 3. `apply_migration` una a una en orden; `get_advisors` de nuevo: ningún hallazgo nuevo salvo el `security_definer` de `crm_import_organizations` y `chat_context_published` (esperados).
- [ ] 4. `scripts/supabase-baseline.sh` → baseline regenerado; actualizar `baseline.meta.json` y el test de 1.6 (34 tablas).
- [ ] 5. Anotar en `ESTADO.md` (fecha, advisors antes/después) y en el ADR de codebase-memory (`manage_adr get` + copia antes de cualquier `index_repository`).
- [ ] 6. Commit: `git commit -m "chore(supabase): baseline after crm/chat migrations"`.

**Cierre de la fase 1c:** `revisor` sobre `chore/crm-schema`; `revisor-seguridad` (RLS de `crm_*` y `chat_*`, `security definer`, grants) + `qa` (`db reset` y tests). Merge.

---

## Fase 2 — Shell público, **home v7** («bento por escenas»), i18n es/en, SEO + GEO · Estimación XL · ramas `design/home-v7`, `feat/shell-home` y `feat/glyph-scene`

> **v3.0 (2026-10-28, D45):** la referencia de la home pasa a ser **`docs/superpowers/design/ref/home-v7/`**, que produce la tarea 2.0 y **Jose aprueba en el navegador antes de portar ninguna escena**. Cambian las escenas (Sobre mí · **Servicios** · Proyectos · **Lab/Blog** · «¿Empezamos?») y los enlaces de la cabecera; **no cambian** el sistema visual, los tokens, el hero (salvo el subtítulo), la mecánica de paginado, el carrusel ni las celdas ampliables. Donde una tarea 2.x diga «home-v6», léase «home-v7»; las adendas «v3.0» de 2.3, 2.14, 2.15, 2.16 y 2.17 dicen qué cambia en cada una. El resto de la fase se ejecuta como estaba.

### Tarea 2.0 — Prototipo `ref/home-v7/` y **GATE de aprobación de Jose** (v3.0)

**Agente:** `ui` (prototipo, con `impeccable` y `taste-skill`) + `ux` (flujo de la escena Servicios) + `usuario-ejemplo` (Marta, Dani, Nuria, Pablo sobre el prototipo) + `revisor` (lectura) · **Rama:** `design/home-v7` · **Gate:** **SÍ (aprobación de Jose en el navegador; no es gate de producción)** · **Depende de:** nada de código (1.10 ya mergeada) · **Insumos:** `ref/home-v6/` (base), `DESIGN.md`, `.impeccable/design.json`, spec v2.0 §0.8, PANT v2.0 P20, `pricing.json` (cinco packs), titular y frase por vía de `/servicios` (`redactor`; si faltan, `{{DATO}}` visibles)

**Objetivo:** un prototipo HTML/CSS/JS estático **1:1 con lo que se va a portar**, derivado de la v6 (copiar la carpeta y modificar; no empezar de cero), con: hero con subtítulo de identidad única y CTAs `[Ver proyectos]` + «Cómo trabajo conmigo →» (→ escena Servicios); escena **Servicios** (titular a dos tonos; bento de tres celdas: **hero** con `SlidingList` de las vías —por hora · proyecto cerrado · packs · contratación— que al seleccionar cambia el texto y la acción de la celda; celda **Packs** con `PackStrip` de **cinco** (P1–P4 + P5 App móvil, destacado inicial P2); celda **Tarifas** con `SegmentedControl` 40 €/h · desde 150 €); escena **Lab/Blog** (celda hero con una demo estática del lab que cobra vida al hover/foco, dos `PostTeaser`); Sobre mí, Proyectos y cierre como la v6; cabecera con **Sobre mí · Servicios · Proyectos · Lab/Blog** y «Partners» solo en el menú ☰ y en ⌘K; paleta ⌘K con comandos nuevos («Servicios», «Packs desde 900 €», «40 €/h», «Para agencias», «Descargar CV», «Lab»). Indicador de sección con 5 escenas. Todo con tokens de `design.json` (si falta uno, se añade a `design.json` con nombre semántico y se anota para 1.10-bis dentro de 2.2).

**Ficheros:** `docs/superpowers/design/ref/home-v7/{index.html,base.css,v7.css,base.js,v7.js,scene.js}` (scene.js sin cambios respecto a v6), `docs/superpowers/design/ref/home-v7/README.md` (qué cambia respecto a v6, lista de desvíos, decisiones pendientes de Jose), `.impeccable/surfaces/docs-superpowers-design-ref-home-v7-index-html.md` (contrato), `DESIGN.md` (solo si se añade un token).

**Pasos:**
- [x] 1. `ux`: `/impeccable shape` de la escena Servicios y Lab/Blog (wireframe en el README); `usuario-ejemplo` recorre el wireframe como Marta (¿ve los packs y el precio antes del segundo gesto?), Dani (¿llega a «por hora» y reservar?), Nuria (¿encuentra «Partners» en < 20 s?), Pablo (¿encuentra el CV?). Hallazgos al README.
- [ ] 2. `ui`: copiar `home-v6/` → `home-v7/`, aplicar los cambios, servir con `python3 -m http.server 8765 --directory docs/superpowers/design/ref` → `http://localhost:8765/home-v7/`; `/impeccable audit` y `/impeccable critique`; probar de 360×640 a 1920×1080 y con `prefers-reduced-motion`.
- [ ] 3. `revisor` (lectura): el prototipo no introduce literales fuera de tokens nuevos documentados, no usa WebGL fuera del hero, no añade métricas ni badges, y conserva la a11y de la v6 (selector con semántica de tabs o radios, filas enlazables).
- [ ] 4. **Jose abre `home-v7` en el navegador y decide** (capturas de las dos escenas nuevas a 360/900/1440 en el README como registro). Iterar hasta el OK. **Anotar la fecha del OK en `ESTADO.md`** («prototipo home-v7 aprobado el …»).
- [ ] 5. Merge de `design/home-v7` a `main` (solo documentación y prototipo). Commit: `git commit -m "design(home-v7): services and lab/blog scenes prototype approved by Jose"`.

**Hecho cuando:** `ESTADO.md` registra la aprobación de Jose; el contrato de `.impeccable/surfaces/` existe; `home-v6/` pasa al histórico de prototipos («no usar como base») en `ESTADO.md`. **Ninguna tarea 2.x de escena arranca antes.**


> **v2.0 (2026-09-29): fase reescrita contra `ref/home-v6/`.** Referencia obligatoria y única: el prototipo `docs/superpowers/design/ref/home-v6/` (`index.html`, `base.css`, `v6.css`, `base.js`, `v6.js`, `scene.js`), que se porta **1:1** (working-agreements §4); sistema visual `DESIGN.md` + `.impeccable/design.json`; inventario de componentes `2026-09-29-componentes-home-v6.md` (en adelante **INV**, con `fichero:línea` del prototipo por componente); UX v4.0 §4.1; DT v1.3 §1.6, §1.9–1.11. Antes de portar una escena, el implementador sirve el prototipo (`python3 -m http.server 8765 --directory docs/superpowers/design/ref`) y lee el DOM real. Las escenas se portan **en el orden del prototipo** (hero → Sobre mí → Empresas → Negocios → Proyectos → Blog → cierre) y no se abre la siguiente sin cerrar la validación visual (2.13) de la anterior.
>
> Reglas de toda tarea con UI de esta fase (working-agreements §1, §5, §7, §8, §10): CSS Modules que consumen solo `var(--token)` de `styles/tokens.css` (1.10); ningún literal de texto en JSX (`messages/{es,en}.json`, ambos idiomas en la misma tarea); unidades relativas y breakpoints en `rem`; **sin unit test en componentes sin comportamiento** (los cubren E2E, capturas y accesibilidad); cada tarea termina con `pnpm --filter web visual` (desde 2.13) adjuntando al PR las capturas a 360/900/1440 y el % de diff por escena, y con `web-design-guidelines`; los desvíos del prototipo se marcan `deviation:` en el commit y los decide Jose en el navegador. Sin Tailwind, sin shadcn, sin GSAP, **pnpm siempre** (`pnpm dlx`, nunca `npx`).

### Tarea 2.1 — i18n: catálogos `messages/{es,en}.json`, `pathnames`, metadatos con `alternates` e `i18n:check`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 1.5

> **v2.1 (eng review):** los catálogos son carpetas por pantalla (`messages/{es,en}/<pantalla>.json`, 1.1); `i18n-check` compara fichero a fichero y lista el fichero que falta en un idioma.

**Objetivo:** estructura de `messages/{es,en}.json` por pantalla y componente (claves en inglés, `home.scenes.about.title`), hechos bajo `facts.*` (sin `facts.json`), helper único de metadatos con canonical y `alternates` es/en + `x-default` (spec §8, DT §1.4), rutas localizadas de UX v4.0 §2 (área incluida) y el script `i18n:check` (DT §1.11).

**Ficheros:**
- Crear: `apps/web/lib/seo/page-metadata.ts`, `page-metadata.test.ts`, `apps/web/i18n/navigation.ts` (`createNavigation(routing)`), `apps/web/i18n/pathnames.ts` (UX v4.0 §2.1–2.2: `/empresas`↔`/companies`, `/negocios`↔`/business`, `/propuesta`↔`/proposal`, `/proyectos`↔`/projects`, `/sobre-mi`↔`/about`, `/contacto`↔`/contact`, `/chat`, `/legal/aviso-legal`↔`/legal/notice`, `/legal/privacidad`↔`/legal/privacy`, `/legal/cookies`, `/auth/registro`↔`/auth/sign-up`, `/auth/codigo`↔`/auth/code`, `/perfil`↔`/profile`, `/area-clientes`↔`/client-area`, `/area-clientes/tareas`↔`/client-area/tasks`, `.../material`↔`.../files`, `.../pack`↔`.../plan`, `.../pack/ampliar`↔`.../plan/upgrade`, `.../recomiendame`↔`.../referrals`), `apps/web/scripts/i18n-check.ts`, `apps/web/scripts/i18n-check.test.ts`, `apps/web/lib/content/dato.ts` (`hasDato(value)`: `false` si empieza por `{{DATO`), `dato.test.ts`.
- Modificar: `messages/es.json`, `messages/en.json` (grupos `nav.*`, `footer.*`, `hero.*`, `home.scenes.{about,companies,business,projects,blog,closing}.*`, `palette.*`, `facts.*`; los `{{DATO}}` como `"{{DATO: qué es}}"` en los dos idiomas), `i18n/routing.ts` (`pathnames`), `package.json` de `apps/web` (script `i18n:check`), raíz (`i18n:check` → `turbo run i18n:check`), `.eslintrc` de `@josecoded/config` (`react/jsx-no-literals` con excepciones `josecoded`, `⌘K`, códigos).

**Interfaces (produce):** `pageMetadata({ locale, pathname, title, description, hasTranslation = true, ogImage? }): Metadata`; `hasDato(v: string): boolean`; `checkMessages(es, en): { pendingDato: string[]; missingInEs: string[]; missingInEn: string[] }`.

**Pasos:**
- [ ] 1. Tests que fallan:
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
it('area routes are localized too', () => {
  expect(pageMetadata({ locale:'en', pathname:'/area-clientes/tareas', title:'t', description:'d' }).alternates?.canonical).toBe('https://josecoded.com/en/client-area/tasks');
});
it('no alternates when the page has no translation', () => {
  expect(pageMetadata({ locale:'es', pathname:'/blog/solo-es', title:'t', description:'d', hasTranslation:false }).alternates?.languages).toBeUndefined();
});
it('rejects long titles', () => { expect(() => pageMetadata({ locale:'es', pathname:'/', title:'x'.repeat(61), description:'d' })).toThrow(/60/); });
```
```ts
// apps/web/scripts/i18n-check.test.ts
import { it, expect } from 'vitest';
import { checkMessages } from './i18n-check';
it('lists pending facts and keys missing in either locale', () => {
  const r = checkMessages({ a:'x', facts:{ city:'{{DATO: ciudad}}' }, onlyEs:'y' }, { a:'x', facts:{ city:'{{DATO: city}}' }, onlyEn:'z' });
  expect(r.pendingDato).toEqual(['facts.city']);
  expect(r.missingInEn).toEqual(['onlyEs']); expect(r.missingInEs).toEqual(['onlyEn']);
});
```
- [ ] 2. `pnpm --filter web test -- page-metadata i18n-check dato` → FAIL.
- [ ] 3. Implementar; `i18n-check.ts` imprime la tabla y sale con código 1 si hay claves faltantes (los `{{DATO}}` solo se listan). ESLint `react/jsx-no-literals` en `@josecoded/config`.
- [ ] 4. `pnpm --filter web test -- page-metadata i18n-check dato` → PASS; `pnpm --filter web i18n:check` imprime la lista; `pnpm --filter web e2e -- url-matrix` sigue en verde (añadir `/en/business`, `/en/companies`, `/en/client-area` a la matriz).
- [ ] 5. Commit: `git commit -m "feat(web): localized pathnames incl. client area, message catalogs, metadata helper and i18n:check"`.

**Hecho cuando:** los tests pasan, `/en/business` renderiza con `<html lang="en">` y `pnpm --filter web i18n:check` funciona desde la raíz.

### Tarea 2.2 — `globals.css`, fuentes Geist, `Backdrop` v6 y primitivas `components/ui`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 1.5, **1.10** (tokens completos) · **Insumo:** INV §1.1 (primitivas), `DESIGN.md` (Colors, Typography, Shapes, Elevation), `base.css:1-45, 85-96, 137-144, 155-161, 179-191, 215-216`

> **v2.2 (stack):** (a) **Contrato de variantes** (working-agreements §15): `ButtonVariant`, `ButtonSize`, `IconTileSize`, `IconTileTone`, `SurfaceRadius`, `SurfaceLayer`, `ArrowLinkEmphasis`, `TwoToneHeadingLevel/Size`, `LangSwitchVariant` en `@josecoded/types/ui.ts`; cada primitiva vuelca `data-variant`/`data-size`/`data-tone` y su `.module.css` selecciona por atributo; sin CVA ni `clsx`; una clase raíz por componente; test de tipos de que `variant: 'primary'` no compila. (b) **Polimorfismo por `href`** en `Button`, `ArrowLink`, `ChatTrigger` y `CommandItem` con la unión discriminada de §15.3 (test de tipos: `onClick` con `href` no compila; test de render: con `href` es `<a>` de next-intl, sin él `<button type="button">`). (c) **`lib/a11y/`**: `focus-trap.ts`, `inert-others.ts`, `roving-tabindex.ts`, `return-focus.ts`, `announce.ts` con tests de Vitest (Tab/Shift+Tab cíclicos, `inert` restaurado, flechas con `loop`, foco devuelto al disparador, una sola región `aria-live`). (d) **Contrato a11y** por primitiva (bloque «A11y» de §16.1) copiado de INV §1.1 y §4.5; `vitest-axe` en los tests de las primitivas con comportamiento (`KeyCap`, `LangSwitch` segmented). (e) **`ShellProvider`** (`components/layout/shell-provider.tsx`, `useShell()`: `palette`, `menu`, `openCell` + acciones) con test de reducer; 2.3, 2.10 y 2.16 lo consumen en lugar de estado propio. (f) **Catálogo `/dev/ui`**: `app/[locale]/(dev)/ui/page.tsx` monta cada primitiva × variantes × tamaños × estados (`data-hover`, focus-visible, disabled, reduced motion); `notFound()` si `env.client.NEXT_PUBLIC_DEV_UI !== '1'`; excluida del `sitemap`; E2E `e2e/dev-ui.spec.ts` con `AxeBuilder` (wcag2a/aa, 2.1, 2.2) sin violaciones `serious`/`critical` y `toHaveScreenshot` por primitiva a 360 y 1440. Toda primitiva o variante nueva de tareas posteriores se añade aquí en su misma tarea.

> Sustituye a la tarea 2.2 de la v1 («Tokens de diseño, tipografías, Tailwind v4, shadcn base y `Backdrop`»), obsoleta por working-agreements §12. Los tokens ya no se escriben aquí: los genera 1.10.

**Objetivo:** `globals.css` mínimo (working-agreements §1), Geist y Geist Mono con `next/font` (autoalojadas, `display: 'swap'`, `font-feature-settings: "ss01", "cv11"`), el `Backdrop` de la v6 (campo de luz + grano, quieto fuera de la home) y las primitivas sin lógica de INV §1.1 como CSS Modules que solo consumen tokens.

**Ficheros:**
- Crear: `apps/web/styles/globals.css` (`@import './tokens.css'`; reset; `prefers-reduced-motion`; `:focus-visible`; `::selection`; `.sr-only`; `.skip`; `[hidden]`), `apps/web/styles/typography.module.css` (`.lead`, `.muted`, `.small` con `composes`), `apps/web/lib/fonts.ts` (`next/font/google` o local: Geist 400/500/550/600, Geist Mono 500), `components/layout/backdrop/{backdrop.tsx,backdrop.module.css,index.ts}` (`.field` con `.field__pool` + tres `.beam` en `mix-blend-mode: screen` y `.grain` al 4,5 %; `aria-hidden`; sin JS aquí: en la home lo mueve la escena, 2.8), `components/ui/{button,arrow-link,icon,icon-tile,kbd,chip,surface,two-tone-heading,live-dot,pending}/…` con las variantes y estados de INV §1.1 (Button `variant` solid/ghost, `size` sm/md/lg, `iconOnly`, polimórfico `<a>`/`<button>`; ArrowLink `emphasis` regular/strong con icono Lucide que avanza 3 px solo con puntero fino; IconTile `size` md/sm, `tone` soft/solid; Surface `radius`/`layer` con `@supports (backdrop-filter: blur(1px))` y fallback opaco; TwoToneHeading con `lead`/`tail` desde messages; Pending solo en desarrollo), `components/ui/button/button.test.tsx` (**solo** el polimorfismo y `disabled`, que sí es comportamiento).
- Modificar: `app/[locale]/layout.tsx` (importa `globals.css`, aplica las variables de fuente al `<html>`).

**Pasos:**
- [ ] 1. Test que falla (comportamiento, no estilo):
```tsx
// apps/web/components/ui/button/button.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Button } from '.';
it('renders a link when href is given and a disabled button otherwise', () => {
  render(<><Button href="/proyectos">Ver proyectos</Button><Button disabled>Enviar</Button></>);
  expect(screen.getByRole('link', { name: 'Ver proyectos' }).getAttribute('href')).toBe('/proyectos');
  expect((screen.getByRole('button', { name: 'Enviar' }) as HTMLButtonElement).disabled).toBe(true);
});
```
- [ ] 2. `pnpm --filter web test -- button` → FAIL.
- [ ] 3. Implementar portando los valores de `base.css` **como tokens** (si un valor no tiene token, se añade a `design.json` con nombre semántico + `pnpm tokens:build` en el mismo commit); `999px` → `var(--r-pill)`; el punto del chat `6px` → `var(--size-dot)`. Estado `disabled` del Button (no existe en el prototipo): opacidad reducida sin hover, marcado `deviation: button disabled state (not in prototype)` para que Jose lo valide.
- [ ] 4. `pnpm --filter web test -- button` → PASS; `pnpm lint` (stylelint) sin literales; `pnpm --filter web build` OK; `web-design-guidelines`.
- [ ] 5. Commit: `git commit -m "feat(web): globals, Geist fonts, v6 backdrop and token-only ui primitives"`.

**Hecho cuando:** tests y stylelint en verde; un `kit` temporal en `app/[locale]/kit/page.tsx` (solo dev, eliminado antes del merge) muestra las primitivas y `ui` las compara con `home-v6` en el navegador.

### Tarea 2.3 — `SiteHeader`, `MobileMenu` (disclosure), `LangSwitch`, `SearchTrigger`, `ChatTrigger`, `UserMenu`, `SiteFooter`, layout público y `PageTransition`

> **v3.0 (D45):** `NavLinks` = **Sobre mí · Servicios · Proyectos · Lab/Blog** (la etiqueta del último la da `navLabel()` de 4.5 según exista blog, lab o ambos; con ninguno, desaparece). «Partners» va en el menú ☰ («Para agencias») y en ⌘K, no en la barra. `ChatTrigger` enlaza a `/chat` (sin `?case`; el selector decide). Pie: añade «Para agencias» y «Lab». Referencia: `ref/home-v7/`.

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.1, 2.2 · **Insumo:** INV §1.2 (`NavLinks`, `LangSwitch`, `SearchTrigger`, `ChatTrigger`) y §1.3 (`SiteHeader`, `MobileMenu`, `SiteFooter`); `base.css:51-82, 115-119, 148-152, 194-207`; `base.js:7-16`; `v6.js:76-82`; DT §1.6.1, §1.10 (`disclosure.ts`, `active-section.ts`)

> **v2.1 (eng review):** `UserMenu` **no importa `@supabase/supabase-js` en el chunk inicial**: lo carga con `import()` al abrir el menú o al montar si existe la cookie `sb-*-auth-token`; `check-hero-bundle` (2.9) falla si `supabase-js` aparece en un chunk inicial de la home.

> Sustituye a la 2.3 de la v1 (cabecera con «Contacto» y hoja shadcn). La paleta ⌘K se monta en 2.16.

**Objetivo:** cabecera v6 (orden Sobre mí · Empresas · Negocios · Proyectos · Blog; derecha idioma → ⌘K → Chat → Login; **sin Contacto**; `is-scrolled` tras 80 px por sentinela; ≤ 67.5rem menú ☰ con idioma dentro y Contacto destacado por prop; ≤ 56.25rem buscador y chat solo icono; ≤ 22.5rem Login solo icono), menú móvil como disclosure nativo con todas las vías de cierre, pie v6, layout público y `template.tsx` con `ViewTransition`.

**Ficheros:**
- Crear: `app/[locale]/(public)/layout.tsx` (`<Backdrop/>` + `<SiteHeader/>` + `<a class="skip" href="#main">` + `<main id="main">` + `<SiteFooter/>`), `app/[locale]/template.tsx`, `components/layout/site-header/…` (RSC + isla `header-scroll-state.tsx`), `components/layout/mobile-menu/…` (isla; `contactHighlighted` por prop), `components/layout/nav-links/…` (RSC; en la home la isla `active-section` marca `aria-current` por escena visible), `components/layout/lang-switch/…` (`variant` inline/segmented; `Link` de next-intl a la ruta localizada), `components/layout/search-trigger/…`, `components/layout/chat-trigger/…` (enlace a `/chat` con `LiveDot`), `components/layout/user-menu/…` (pinta «Login» en SSR; tras montar, `createBrowserClient` de `lib/supabase/browser.ts`), `components/layout/site-footer/…` (secciones, Área de clientes, Legal, «Revisado el {fecha}» desde `build-info.json`; hasta 2.4, ejemplo commiteado), `lib/motion/disclosure.ts`, `lib/motion/disclosure.test.ts`, `lib/motion/active-section.ts`, `lib/motion/active-section.test.ts`, `components/layout/mobile-menu/mobile-menu.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/motion/disclosure.test.ts
import { it, expect, vi } from 'vitest';
import { createDisclosure } from './disclosure';
function setup() {
  document.body.innerHTML = '<button id="b" aria-expanded="false" aria-controls="p"></button><nav id="p" hidden><a href="/x">x</a></nav><input id="out">';
  const button = document.getElementById('b') as HTMLButtonElement, panel = document.getElementById('p') as HTMLElement;
  return { button, panel, d: createDisclosure(button, panel, { closeOnWheel: true, closeAboveRem: 67.5 }) };
}
it('opens, closes on Escape and returns focus to the button', () => {
  const { button, panel, d } = setup(); d.open();
  expect(button.getAttribute('aria-expanded')).toBe('true'); expect(panel.hidden).toBe(false);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(panel.hidden).toBe(true); expect(document.activeElement).toBe(button);
});
it('closes when choosing a link, focusing outside or wheeling', () => {
  const { panel, d } = setup(); d.open(); panel.querySelector('a')!.click(); expect(panel.hidden).toBe(true);
  d.open(); (document.getElementById('out') as HTMLInputElement).focus(); document.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); expect(panel.hidden).toBe(true);
  d.open(); window.dispatchEvent(new WheelEvent('wheel')); expect(panel.hidden).toBe(true);
});
```
```tsx
// apps/web/components/layout/mobile-menu/mobile-menu.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect } from 'vitest';
import { MobileMenu } from '.';
const links = [{ href:'/sobre-mi', label:'Sobre mí' }, { href:'/negocios', label:'Negocios' }];
it('is a disclosure with aria-controls, marks current page and highlights contact', () => {
  render(<MobileMenu links={links} currentPath="/negocios" contact={{ href:'/contacto', label:'Contacto' }} />);
  const btn = screen.getByRole('button', { name: 'Menú' });
  expect(btn.getAttribute('aria-controls')).toBeTruthy(); fireEvent.click(btn);
  expect(btn.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('link', { name: 'Negocios' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('link', { name: 'Contacto' }).dataset.highlighted).toBe('true');
});
```
- [ ] 2. `pnpm --filter web test -- disclosure active-section mobile-menu` → FAIL.
- [ ] 3. Implementar portando `base.css:51-82` y `base.js:7-16` (breakpoints `1080px`/`900px`/`700px` → `67.5rem`/`56.25rem`/`43.75rem` como tokens `--bp-*`; `aria-label` de `messages`). Header en la home transparente y `is-scrolled` por `IntersectionObserver` sobre un sentinela de 80 px (excepción de px de working-agreements §8). `template.tsx`: `ViewTransition` 120/160 ms con tokens; sin animación con reduced motion.
- [ ] 4. `pnpm --filter web test -- disclosure active-section mobile-menu` → PASS; `pnpm --filter web build` OK; `web-design-guidelines`; capturas de la cabecera a 360/900/1440 (a mano hasta 2.13).
- [ ] 5. Commit: `git commit -m "feat(web): v6 header with native disclosure menu, lang switch, search/chat triggers, footer and page transition"`.

**Hecho cuando:** tests en verde; en `wrangler dev` la cabecera se ve en `/` y `/en`, el menú ☰ cierra por las cinco vías y devuelve el foco, «Saltar al contenido» es el primer tabulable y no hay ningún «Contacto» en la barra.

### Tarea 2.4 — Datos del build: `build-info.ts` y `content/generated`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 1.7 (`routes-manifest`), 1.8 (migraciones)

> **v2.1 (eng review):** `build-info` mantiene el recuento de tablas (26 tras 1.9) y políticas solo para el pie y `llms.txt`; no se muestra como cifra en ninguna página (NOT in scope).

**Objetivo:** `content/generated/build-info.json` con rama, commit, fecha, versión de Next, número de rutas del gateway y de tablas/políticas; la build **falla** si falta un campo (DT §2.1). **v2.0:** ya no alimenta ninguna franja de métricas (no existen `BuildFacts` ni «Esta web»): lo consumen la fecha de revisión del pie, el caso de estudio de josecoded.com (3.4) y `llms.txt`. `test-counts.ts` y `perf.json` **se retiran** (sin métricas en la web).

**Ficheros:** `apps/web/scripts/build-info.ts`, `build-info.test.ts`, `apps/web/content/generated/build-info.json`, `apps/web/lib/content/build-info.ts` (`getBuildInfo()` con zod). Modificar `apps/web/package.json` (`prebuild: "tsx scripts/build-info.ts"`).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/scripts/build-info.test.ts
import { it, expect } from 'vitest';
import { computeBuildInfo } from './build-info';
it('computes all mandatory fields from repo sources', async () => {
  const info = await computeBuildInfo({ repoRoot: new URL('../../..', import.meta.url).pathname, env: { GITHUB_REF_NAME:'feat/x', GITHUB_SHA:'abcdef1234567' } });
  expect(info.branch).toBe('feat/x'); expect(info.commit).toBe('abcdef1'); expect(info.nextVersion).toMatch(/^16\./);
  expect(info.gatewayRoutes).toBeGreaterThan(20); expect(info.supabase.tables).toBeGreaterThanOrEqual(26);
  expect(info.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
it('throws when a source is missing', async () => { await expect(computeBuildInfo({ repoRoot: '/nonexistent', env: {} })).rejects.toThrow(/routes-manifest|baseline/); });
```
- [ ] 2. → FAIL. 3. Implementar (rama/commit de `GITHUB_*` o `git rev-parse`; Next de `pnpm-lock.yaml`; rutas importando `apps/api/src/routes-manifest.ts`; tablas/políticas contando en `baseline.sql` + `migrations/*.sql`; `reviewedAt` = fecha del último commit). 4. → PASS; `pnpm --filter web build` genera el JSON y el pie muestra «Revisado el …». 5. Commit: `git commit -m "feat(web): build-info generated at prebuild (build fails when missing)"`.

**Hecho cuando:** `build-info.json` se regenera en cada build y el pie (2.3) lo consume.

### Tarea 2.5a — `packages/glyph-scene`: `params`, `rng`, `clouds`, `glyphs`, `paramsHash` (módulos puros, valores de la v6)

**Agente:** implementador-web · **Rama:** `feat/glyph-scene` · **Gate:** no · **Depende de:** 0.2 (versión de `three`, decisión del bloom) · **Referencia:** `ref/home-v6/scene.js:11-135` (**no** `hero-lab-3/app.js`)

> **v2.1 (eng review):** `paramsHash()` = sha256 corto de `params.ts` + `clouds.ts` + `shaders.ts` + **`scene.ts` + `atlas.ts` + los parámetros de captura (`CAPTURE`) + la versión de `three` del lockfile**; `params.test.ts` comprueba que cambiar `CAPTURE` cambia el hash.

**Objetivo:** geometría determinista sin WebGL, portada de `scene.js` de la v6, para que póster, vídeo, arte de Proyectos y escena viva compartan las mismas nubes (DT v1.3 §1.6.2).

**Ficheros:**
- Crear: `packages/glyph-scene/package.json` (`@josecoded/glyph-scene`, `sideEffects: false`, `exports`), `src/params.ts` (`PARAMS = { hold: 3.5, morph: 1.6, rot: 0.18, size: 16, green: 0, scatter: 0.6, breath: 0.025, wperiod: 4, wamp: 0.6, bloom: <0.22 o 0 según 0.2>, bloomth: 0.72, focus: 6.2, mirror: 0.35 }`, `COUNT = { desktop: 9000, video: 5000 }`, `paramsHash()`), `src/rng.ts` (`mulberry32`), `src/clouds.ts` (`cloudPhone`, `cloudWeb`, `cloudChipBrain` con `cloudBrain` interna, portadas de `scene.js:28-135` con `rng()` en vez de `Math.random()`; **sin `cloudCode`**), `src/glyphs.ts` (`CHARS` de `scene.js:16` y `GL` de `scene.js:427`), tests `test/clouds.test.ts`, `test/rng.test.ts`, `test/params.test.ts`.

**Interfaces (produce):** `PARAMS`, `COUNT`, `paramsHash(): string`, `mulberry32(seed)`, `clouds = { phone, web, chip }` con firma `(n, rng) => Float32Array` de longitud `n*3`, `CHARS`, `GL`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/glyph-scene/test/clouds.test.ts
import { it, expect } from 'vitest';
import { clouds } from '../src/clouds';
import { mulberry32 } from '../src/rng';
for (const name of ['phone','web','chip'] as const) {
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
it('has the v6 values', () => { expect(PARAMS.hold).toBe(3.5); expect(PARAMS.morph).toBe(1.6); expect(PARAMS.green).toBe(0); expect(PARAMS.mirror).toBe(0.35); expect([0, 0.22]).toContain(PARAMS.bloom); expect('directedMorph' in PARAMS).toBe(false); });
it('hash is stable and 16 hex chars', () => { expect(paramsHash()).toMatch(/^[0-9a-f]{16}$/); expect(paramsHash()).toBe(paramsHash()); });
```
- [ ] 2. `pnpm --filter @josecoded/glyph-scene test` → FAIL.
- [ ] 3. Portar las funciones de nube de `scene.js` sustituyendo cada `Math.random()` por `rng()`; **no** portar `compileBurst`, `perimeterPoints` ni nada de `scene.js:234-305` (INV §4.1).
- [ ] 4. `pnpm --filter @josecoded/glyph-scene test` → PASS.
- [ ] 5. Commit: `git commit -m "feat(glyph-scene): deterministic params, rng and v6 glyph clouds"`.

**Hecho cuando:** 6 tests en verde y el paquete no importa `three` todavía.

### Tarea 2.5b — `packages/glyph-scene`: `atlas`, `shaders`, `scene`, `intro`, `worker`, `index` (port de `scene.js` sin código muerto)

**Agente:** implementador-web · **Rama:** `feat/glyph-scene` · **Gate:** no · **Depende de:** 2.5a · **Referencia:** `scene.js:17-26, 137-233, 306-423`

**Objetivo:** `createGlyphScene()` con la API pública de DT v1.3 §1.6.2, importación selectiva de `three`, nubes en Web Worker, bucle `hold/morph` de tres estados, arrastre con puntero fino, inclinación al cursor, campo de luz que sigue a la nube (solo `transform`), pausa, `targetFor` reducido a `cycle`/`off`, intro (`uIntroT`).

**Ficheros:**
- Crear: `src/atlas.ts` (16×8 × 64 px, `500 46px "Geist Mono"`, espera `document.fonts.load`; respaldo `ui-monospace`), `src/shaders.ts` (`scene.js:160-228` como strings, sin la rama `vCol < uGreen`), `src/scene.ts` (renderer con `setClearColor(--bg)`, composer con `UnrealBloomPass(PARAMS.bloom, 0.3, PARAMS.bloomth)` solo si `bloom > 0`, `Points` + clones de onda y reflejo, máquina de estados, arrastre, inclinación, `field` con amortiguado `k = 1 − e^(−3.2·dt)` y desvío al cursor, `targetFor('cycle'|'off')`, `pause/resume`, `layout`, `dispose`, `debug()`), `src/intro.ts`, `src/worker.ts`, `src/index.ts`, `test/scene.test.ts`.

**Interfaces (produce; las consumen 2.6 y 2.8):** la API de DT §1.6.2 (`createGlyphScene(o): Promise<GlyphScene>`; `GlyphScene = { start, stop, pause, resume, playIntro(t0), skipIntro, step(dt), layout, dispose, debug, setMode('cycle'|'off') }`; `onState(index, progress)`; `capture: true` → dt fijo, sin intro, `rot 0`, vaivén 5,1 s, respiración 3 ciclos / 15,3 s, ondas 3,825 s).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// packages/glyph-scene/test/scene.test.ts
import { it, expect, vi } from 'vitest';
vi.mock('three', async (orig) => ({ ...(await orig<any>()), WebGLRenderer: class { setSize(){} setPixelRatio(){} setClearColor(){} render(){} dispose(){} getPixelRatio(){ return 1; } domElement = document.createElement('canvas'); getContext(){ return {}; } } }));
vi.mock('three/addons/postprocessing/EffectComposer.js', () => ({ EffectComposer: class { addPass(){} render(){} setSize(){} dispose(){} } }));
vi.mock('three/addons/postprocessing/RenderPass.js', () => ({ RenderPass: class {} }));
vi.mock('three/addons/postprocessing/UnrealBloomPass.js', () => ({ UnrealBloomPass: class { strength = 0; } }));
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
  s.step(3.4); expect(s.debug().phase).toBe('hold'); s.step(0.2); expect(s.debug().phase).toBe('morph'); s.step(1.6); expect(states).toEqual([1]);
  for (let t = 0; t < 2 * 5.1; t += 0.1) s.step(0.1);
  expect(states.at(-1)).toBe(0); expect(s.debug().uProg).toBeCloseTo(0, 1);
});
it('off mode dims the cloud and keeps it in place; skipIntro sets uIntroT to 100', async () => {
  const { s } = await make(); s.setMode('off'); for (let i = 0; i < 30; i++) s.step(0.1); expect(s.debug().bright).toBeLessThan(0.05);
  s.playIntro(0); expect(s.debug().uIntroT).toBeLessThan(100); s.skipIntro(); expect(s.debug().uIntroT).toBe(100);
});
```
- [ ] 2. `pnpm --filter @josecoded/glyph-scene test -- scene` → FAIL.
- [ ] 3. Implementar el port; **no** portar `doorTarget`, `doorsScale`, ramas `doors`/`dim`/`phone` de `targetFor`, `P.directedMorph`, `streams`/`SM`, `scene:ready` (INV §4.1). Worker con `new Worker(new URL('./worker.ts', import.meta.url), { type:'module' })`.
- [ ] 4. `pnpm --filter @josecoded/glyph-scene test` → PASS; `pnpm --filter @josecoded/glyph-scene test -- bundle-budget` (del spike, sobre `src/index.ts`) → ≤ 200 KB gz.
- [ ] 5. Commit: `git commit -m "feat(glyph-scene): v6 three.js scene ported to TypeScript without dead code"`.

**Hecho cuando:** tests en verde, bundle ≤ 200 KB gz y `render/index.html` (2.6) muestra la escena idéntica a `home-v6/` con `?debug=1`.

### Tarea 2.6 — Medios generados desde la escena: vídeo, póster y arte de Proyectos (`render-media.ts`, `media.json`, `hero:media:check`)

**Agente:** implementador-web · **Rama:** `feat/glyph-scene` · **Gate:** no · **Depende de:** 2.5b, 0.2

> **v2.1 (eng review):** el **póster se genera con `count: 9000`** (el vídeo con 5 000); `render-media.ts` **solo regenera si `paramsHash` cambia** respecto a `media.json` (`--force` para forzar); `check-media` valida el hash ampliado.

**Objetivo:** producir y commitear `apps/web/public/hero/{video.webm,video.mp4,poster.avif,poster.webp,media.json}` y `apps/web/public/art/{glyph-phone,glyph-web}.avif` (≤ 60 KB; sustituyen a los `glyph-*-alpha.png` de 250–300 KB del prototipo) con los topes de DT §1.6.3 y un check de frescura en CI. **v2.0:** ya no hay sprites de `PathPanel`.

**Ficheros:** `packages/glyph-scene/render/index.html`, `scripts/render-media.ts` (captura 459 frames a 720×720 con `count: 5000` para el vídeo, PSNR, vídeo VP9/H.264, póster frame 15, arte de proyectos en reposo 801×722 con alfa, `media.json`), `scripts/check-media.ts`, `test/check-media.test.ts`; los medios.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// packages/glyph-scene/test/check-media.test.ts
import { it, expect } from 'vitest';
import { checkMedia } from '../scripts/check-media';
it('fails when paramsHash differs or a file exceeds its limit', () => {
  const ok = { generatedAt:'2026-09-30', paramsHash:'deadbeefdeadbeef', seed:1, files:{ 'hero/video.webm':300000, 'hero/video.mp4':350000, 'hero/poster.avif':40000, 'hero/poster.webp':55000, 'art/glyph-phone.avif':50000, 'art/glyph-web.avif':52000 } };
  expect(checkMedia(ok, 'deadbeefdeadbeef')).toEqual({ ok:true, errors:[] });
  expect(checkMedia({ ...ok, paramsHash:'0000000000000000' }, 'deadbeefdeadbeef').errors[0]).toMatch(/paramsHash/);
  expect(checkMedia({ ...ok, files:{ ...ok.files, 'hero/video.webm': 400001 } }, 'deadbeefdeadbeef').errors[0]).toMatch(/video\.webm.*400/);
  expect(checkMedia({ ...ok, files:{ ...ok.files, 'art/glyph-web.avif': 61441 } }, 'deadbeefdeadbeef').errors[0]).toMatch(/glyph-web.*60/);
});
```
- [ ] 2. → FAIL. 3. Implementar (topes 400/400/60/60/60/60 KB; el script comprueba también que cada fichero existe con esos bytes); ejecutar `pnpm hero:media` en el Mac (ffmpeg por Homebrew). 4. → PASS; `pnpm hero:media:check` OK. 5. Commit (medios incluidos): `git commit -m "feat(hero): generated video, poster and project glyph art from the v6 scene with freshness check"`.

**Hecho cuando:** `hero:media:check` pasa, los seis ficheros cumplen sus topes y el arte de proyectos se ve igual que `glyph-phone-alpha.png` en `home-v6/`.

### Tarea 2.7 — `FallText`, gate inline de la intro e `IntroFall` (`lib/motion/intro-fall.ts`)

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.3, 2.5a (`GL`) · **Insumo:** UX §3.6; DT §1.6.4; `scene.js:425-481`

> Sustituye a la 2.7 de la v1: **sin `CompileReveal` ni `gsap.ts`** (los `h2` de las escenas entran ligados al scroll, 2.10).

**Objetivo:** intro de caída sin dependencias, con texto partido en el servidor, gate en `<head>` antes del primer paint, portada de `scene.js:425-481` con PRNG de semilla y tokens de duración.

**Ficheros:** `components/hero/fall-text/…` (RSC), `components/hero/intro-gate-script.tsx` (inline ≤ 400 bytes, solo `/` y `/en`), `components/hero/intro-fall/…` (isla), `lib/motion/intro-fall.ts` (`planFall`, `runIntro`, `finish`), `styles/globals.css` (`[data-intro=pending] .ch { visibility:hidden }`, `.is-falling`, `.is-wet`), tests `fall-text.test.tsx`, `intro-fall.test.ts`.

**Interfaces (produce):** `<FallText as="h1"|"p"|"span" text={string} />`; `planFall(chars, seed, innerHeight): { el, start, landT, glyph }[]` con `landT ∈ [0.4, 1.2]`; `runIntro({ root, sceneReady?, onDone })`.

**Pasos:**
- [ ] 1. Tests que fallan (los de la v1, sin `compile-reveal`):
```tsx
// apps/web/components/hero/fall-text/fall-text.test.tsx
import { render } from '@testing-library/react';
import { it, expect } from 'vitest';
import { FallText } from '.';
it('keeps accessible text and splits visible chars into indivisible words', () => {
  const { container } = render(<FallText as="h1" text="Jose Carlos Sánchez" />);
  expect(container.querySelector('h1 .sr-only')?.textContent).toBe('Jose Carlos Sánchez');
  const hidden = container.querySelector('h1 [aria-hidden="true"]')!;
  expect(hidden.querySelectorAll('.w')).toHaveLength(3); expect(hidden.querySelectorAll('.ch')).toHaveLength(17);
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
  const onDone = vi.fn(); runIntro({ root, onDone });
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })); vi.advanceTimersByTime(200);
  for (const el of root.querySelectorAll<HTMLElement>('.ch')) { expect(el.textContent).toBe(el.dataset.ch); expect(el.classList.contains('is-falling')).toBe(false); expect(el.style.transform).toBe(''); }
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ skipped: true }));
  expect(document.documentElement.dataset.intro).toBeUndefined();
});
```
- [ ] 2. `pnpm --filter web test -- fall-text intro-fall` → FAIL.
- [ ] 3. Implementar según DT §1.6.4 (bucle rAF de `tickChars`; `finish` ante `pointerdown|keydown|wheel|touchstart|scroll`; espera `min(sceneReady, 1200 ms)`; destello `var(--green)`; solo muta `style`, `class`, `textContent` de `.ch`). Gate inline en `try/catch`.
- [ ] 4. `pnpm --filter web test -- fall-text intro-fall` → PASS.
- [ ] 5. Commit: `git commit -m "feat(web): server-split FallText, pre-paint intro gate and IntroFall ported from v6"`.

**Hecho cuando:** tests en verde y, en `wrangler dev`, la primera visita a `/` muestra la caída y la segunda no; `?intro` la fuerza.

### Tarea 2.8 — `HeroSplit`, `HeroStage` (escena · vídeo · póster), `HeroSceneGate`, `CycleBars` y `Backdrop` animado

**Agente:** implementador-web · **Rama:** `feat/shell-home` (tras mergear `feat/glyph-scene`) · **Gate:** no · **Depende de:** 2.5b, 2.6, 2.7 · **Insumos:** nombre a mostrar (`facts.displayName`), subtítulo alternativa B fijado por `redactor`; INV §1.3 (`HeroSplit`, `HeroStage`, `GlyphScene`, `CycleBars`, `Backdrop`); `index.html:34-50`; `base.css:100-112, 195-200, 208`; `scene.js:306-423`

> **v2.1 (eng review):** **desvío aceptado por Jose (28): WebGL en tablets grandes** (≥ 56.25rem, puntero grueso) recibe modo `scene`; se registra en `apps/web/e2e/visual/deviations.json`; `qa` lo prueba en iPad en la puerta de la fase 2 y, si no rinde, se añade `(pointer: fine)` al gate. Añadir `performance.mark('scene:import-start')` justo antes del `import()` en `load-scene.ts`.

**Objetivo:** la escena 0 de UX v4.0 §4.1 con **tres modos**: `scene` (escritorio ≥ 56.25rem con WebGL2), `video` (todo móvil y tablet: **WebGL solo en escritorio**, decisión 4 de INV §3), `poster` (reduced motion, `saveData`, sin JS); póster en el HTML en todos los viewports; `three` por `import()` tras el LCP; canvas con fundido; campo de luz que sigue a la nube. **Sin badge**, sin `HERO_LIVE_MOBILE`, sin `?hero=live`.

**Ficheros:** `components/hero/hero-split/…` (RSC: `h1` con `FallText`, subtítulo con las dos audiencias en `text` 500, `Button` «Ver proyectos» → `#proyectos`, `ArrowLink` «Una web para mi negocio» → `/negocios`), `components/hero/hero-stage/…` (markup de DT §1.6.3: `<picture>` póster `fetchpriority="high"`, `<video hidden preload="none">` sin `<source>`, `<canvas hidden>`, `role="img"` con `aria-label` de messages; `min(38svh, 100%)` bajo 56.25rem, 34svh bajo 43.75rem de alto), `components/hero/hero-scene-gate/…` (isla ~1 KB), `components/hero/cycle-bars/…`, `lib/motion/hero-gate.ts` (`decideHeroMode`), `lib/motion/hero-gate.test.ts`, `lib/hero/load-scene.ts` (LCP → `import('@josecoded/glyph-scene')` → idle → `createGlyphScene` → fundido 1 s → póster `visibility:hidden`; `IntersectionObserver` + `visibilitychange`; `setMode('off')` fuera del hero; mueve `.field` por `transform`; `scene_drag` una vez), `app/[locale]/page.tsx` (home con `HeroSplit` + `IntroGateScript` + `IntroFall`), `messages/*.json` (`hero.*`).

**Pasos:**
- [ ] 1. Test que falla (tabla de UX v4.0 §4.1):
```ts
// apps/web/lib/motion/hero-gate.test.ts
import { it, expect } from 'vitest';
import { decideHeroMode } from './hero-gate';
const desktop = { webgl2:true, desktop:true, reducedMotion:false, saveData:false, deviceMemory:8 };
it.each([
  [desktop, 'scene'],
  [{ ...desktop, desktop:false }, 'video'],
  [{ ...desktop, webgl2:false }, 'video'],
  [{ ...desktop, deviceMemory:2 }, 'video'],
  [{ ...desktop, saveData:true }, 'poster'],
  [{ ...desktop, reducedMotion:true }, 'poster'],
  [{ ...desktop, desktop:false, reducedMotion:true }, 'poster'],
])('%o → %s', (ctx, mode) => expect(decideHeroMode(ctx)).toBe(mode));
```
- [ ] 2. `pnpm --filter web test -- hero-gate` → FAIL.
- [ ] 3. Implementar; en modo `video`, tras el LCP: `<source>` webm y mp4, `load()` en idle, `play()`, ocultar póster en `canplay` sin fundido; `CycleBars` alimentadas por `onState(index, progress)` o por `currentTime` del vídeo; `touch-action: pan-y` en el `stage`. `deviation:` si algún valor de `base.css:100-112` no cabe como token.
- [ ] 4. `pnpm --filter web test -- hero-gate` → PASS; `pnpm --filter web build` OK; en `wrangler dev` escritorio: póster al instante, canvas ≤ 3 s, arrastre gira, campo de luz sigue; móvil (390×844): vídeo reproduce, sin canvas; `web-design-guidelines`.
- [ ] 5. Commit: `git commit -m "feat(web): v6 hero split with scene/video/poster stage, cycle bars and light field"`.

**Hecho cuando:** los 7 casos del gate pasan; verificación manual de los tres modos; a 320×812 y 360×640 el hero no desborda (revisión de acabado 2026-09-29).

### Tarea 2.9 — `check-hero-bundle`, Lighthouse CI y `lhci:assert-lcp-element`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.8

> **v2.1 (eng review):** `check-hero-bundle` comprueba también que **`@supabase/supabase-js` no está en ningún chunk inicial** de la home (2.3) y funciona sobre el manifiesto de Turbopack validado en 0.1.

Sin cambios respecto a la v1 salvo el elemento LCP admitido (`h1` o `img.hero-stage__poster`) y las URLs (`/`, `/en`; las de la fase 3 cuando existan). Ficheros: `apps/web/scripts/check-hero-bundle.ts` + test sobre `tests/fixtures/app-build-manifest.json`, `apps/web/lighthouserc.json` (móvil 4G ×3: `performance ≥ 0.9`, `accessibility ≥ 0.95`, `seo == 1`, `best-practices ≥ 0.9`, LCP ≤ 2500, CLS ≤ 0.1, TBT ≤ 200; escritorio LCP ≤ 1200), `apps/web/scripts/lhci-assert-lcp-element.ts`; `ci.yml` con `check:hero-bundle`, `hero:media:check`, `lhci autorun`, `lhci:assert-lcp-element`.

**Pasos:** 1. Test de `analyzeManifest` (falla si un chunk inicial contiene `WebGLRenderer`/`three.module`; pasa y reporta `sceneGz`/`homeGz` si `three` solo está en chunks `import()`). 2. FAIL. 3. Implementar (`zlib.gzipSync` por chunk). 4. PASS; `pnpm --filter web build && pnpm check:hero-bundle` → `sceneGz ≤ 204800`, `homeGz ≤ 358400`; `pnpm lhci` contra `wrangler dev` en verde. 5. Commit: `git commit -m "ci(web): hero bundle budget, Lighthouse CI thresholds and LCP element assertion"`.

**Hecho cuando:** CI del PR ejecuta los tres checks y pasan.

### Tarea 2.10 — `Scene`, `Bento`, `BentoCell`, `CursorLight`, `ExpandedCell` (View Transitions) y escena **Sobre mí** (`Marquee`, `MiniChat`, `AboutSummary`)

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.2, 2.3, **1.10** · **Insumos:** INV §1.2–1.3 (`Scene`, `Bento`, `BentoCell`, `CursorLight`, `ExpandedCell`, `Marquee`, `Chip`, `ChatBubble`, `MiniChat`, `AboutSummary`) y §3 (decisiones 1 y 2); `index.html:53-69`; `v6.css:22-59, 62-65, 89-109, 151-172, 209`; `v6.js:84-123, 149-161`; `base.js:53-56`; DT §1.10

**Objetivo:** el marco de escena y el bento **por composición JSX** (decisión 2: `<Bento><BentoCell span={7} tall>…</BentoCell></Bento>`, sin JSON de layout), el bento por **container queries** (1 → 2 col desde 34rem → 12 col desde 52rem; celdas con `--span`), las entradas y salidas ligadas al scroll con `@supports (animation-timeline: view())`, la **celda ampliada genérica** con hueco `more` (decisión 1) sobre `lib/motion/expand-cell.ts` y View Transitions (380 ms; sin soporte, cambio inmediato), la luz bajo el cursor con **un listener delegado por bento**, y la primera escena completa (Sobre mí) como patrón de todas las demás.

**Ficheros:** `components/scenes/scene/…` (prop `fill` para 100svh, solo en la home), `components/scenes/bento/…`, `components/scenes/bento-cell/…` (`span`, `tall`, `wide`, `hero`, `tone`, `expandable`, slots `icon`/`title`/`action`/`body`/`more`), `components/scenes/cursor-light/…` (isla), `components/scenes/expanded-cell/…` (isla; `role="dialog"`, `aria-modal`, `inert`, velo, Esc/Cerrar/velo cierran, bloqueo de scroll, oculta el indicador), `components/scenes/marquee/…` (CSS puro, `aria-label` con la lista, copias `aria-hidden`), `components/scenes/chat-bubble/…`, `components/scenes/mini-chat/…` (isla), `components/scenes/about-summary/…`, `components/home/about-scene.tsx` (composición de la escena 1), `lib/motion/{expand-cell,cursor-light,typewriter}.ts` + tests, `components/scenes/bento/bento.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/scenes/bento/bento.test.tsx
import { render } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Bento, BentoCell } from '..';
it('composes three cells whose spans sum 12 per row', () => {
  const { container } = render(<Bento><BentoCell span={7} tall title="a">a</BentoCell><BentoCell span={5} title="b">b</BentoCell><BentoCell span={5} title="c">c</BentoCell></Bento>);
  const cells = [...container.querySelectorAll('[data-span]')];
  expect(cells).toHaveLength(3);
  expect(cells.map(c => Number((c as HTMLElement).dataset.span))).toEqual([7, 5, 5]); // 7 (tall, 2 filas) + 5 / 7 + 5 = 12 por fila
});
```
```ts
// apps/web/lib/motion/expand-cell.test.ts
import { it, expect } from 'vitest';
import { openCell } from './expand-cell';
it('opens as a modal dialog, inerts the rest, traps focus and returns it on close', () => {
  document.body.innerHTML = '<header id="h"><a href="/">x</a></header><main><article id="c"><button id="open">Ampliar</button><button id="close">Cerrar</button><a href="/y">y</a></article><p id="p">other</p></main>';
  const cell = document.getElementById('c')!, opener = document.getElementById('open') as HTMLButtonElement; opener.focus();
  const h = openCell(cell, { opener });
  expect(cell.getAttribute('role')).toBe('dialog'); expect(document.getElementById('h')!.hasAttribute('inert')).toBe(true); expect(document.getElementById('p')!.closest('[inert]')).toBeTruthy();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(cell.getAttribute('role')).toBeNull(); expect(document.getElementById('h')!.hasAttribute('inert')).toBe(false); expect(document.activeElement).toBe(opener);
  h.destroy();
});
```
```ts
// apps/web/lib/motion/typewriter.test.ts
import { it, expect, vi } from 'vitest';
import { createTypewriter } from './typewriter';
it('types at typeMs per char and stops when paused', () => {
  vi.useFakeTimers(); const el = document.createElement('span');
  const t = createTypewriter(el, ['hola'], { typeMs: 22, eraseMs: 16, pauseMs: 700 }); t.start();
  vi.advanceTimersByTime(22 * 2 + 1); expect(el.textContent).toBe('ho'); t.pause(); vi.advanceTimersByTime(1000); expect(el.textContent).toBe('ho');
});
```
- [ ] 2. `pnpm --filter web test -- bento expand-cell typewriter cursor-light` → FAIL.
- [ ] 3. Implementar portando `v6.css` y `v6.js` a tokens; la celda ampliada usa `view-transition-name` por celda y `document.startViewTransition` bajo comprobación de existencia; con reduced motion, sin transición. `Scene` fuera de la home no fuerza 100svh (prop `fill`). Corregir al portar: `<span class="plist__hl">` fuera del `<ul>` no aplica aquí (es de Empresas, 2.14). `deviation:` por cada valor sin token.
- [ ] 4. → PASS; `pnpm lint` (stylelint); `pnpm --filter web build`; `web-design-guidelines`; capturas comparadas de la escena Sobre mí a 360/900/1440 (2.13 si ya existe; si no, a mano) y **aprobación de Jose en preview** antes de portar la siguiente escena.
- [ ] 5. Commit: `git commit -m "feat(web): scene, bento, expandable cell with view transitions, cursor light and About scene"`.

**Hecho cuando:** tests en verde; en `wrangler dev` la escena Sobre mí es 1:1 con el prototipo a los tres anchos (diff ≤ 2 %) y la celda se amplía y cierra por teclado.

### Tarea 2.11 — SEO/GEO base: JSON-LD, `sitemap`, `robots`, OG generadas, `llms.txt`

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.1, 2.10 · **Insumos:** nombre, usuario de GitHub, cuentas de stores, LinkedIn (`facts.*`)

> **v2.1 (eng review):** JSON-LD de packs con `priceSpecification: { '@type':'PriceSpecification', minPrice, priceCurrency:'EUR', valueAddedTaxIncluded:false }` (sin `price`); la tarifa por horas como `UnitPriceSpecification` con `price: 40`, `unitCode: 'HUR'`, `valueAddedTaxIncluded:false`; el test comprueba `minPrice === 1400` y `unitCode === 'HUR'`.

Sin cambios de fondo respecto a la v1: `apps/web/lib/seo/jsonld.ts` (`personJsonLd`, `organizationJsonLd`, `webSiteJsonLd` con `SearchAction`, `profilePageJsonLd`, `serviceOfferJsonLd(pack)` con `priceSpecification` desde `pricing`, `faqJsonLd`, `softwareApplicationJsonLd` (solo nombre y enlaces), `blogPostingJsonLd`), `tests/jsonld.test.ts` (snapshots + shapes), `app/sitemap.ts`, `app/robots.ts` (permite `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`; bloquea `/admin`, `/area-clientes`, `/auth`), `scripts/og.ts` (satori + resvg → `public/og/<slug>.png`, con la tipografía Geist y los colores de `tokens.css`), `scripts/llms.ts` (`public/llms.txt` y `llms-full.txt` desde `messages`, `content/` y `blog-index`, sin `{{DATO`), `components/seo/json-ld.tsx`; `app/[locale]/layout.tsx` con `Person` + `Organization` + `WebSite`; `prebuild` encadena `build-info`, `og`, `llms`.

**Pasos:** 1. Test `jsonld.test.ts` (Person con `sameAs` https y sin «Jose Dev»; `WebSite.potentialAction = SearchAction`; `serviceOfferJsonLd(pricing.packs[1]).offers.priceSpecification.price = 1400`, `areaServed = 'ES'`; snapshots). 2. FAIL. 3. Implementar. 4. PASS; `robots.txt` y `sitemap.xml` correctos en `wrangler dev`; `llms.txt` sin `{{DATO`. 5. Commit: `git commit -m "feat(web): site-wide JSON-LD, sitemap, robots, generated OG images and llms.txt"`.

**Hecho cuando:** tests y snapshots en verde; el validador de schema.org (`qa`, manual) no da errores en `/`.

### Tarea 2.12 — Analítica en cliente: `lib/analytics.ts` y eventos de la home

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.8, 2.10

> **v2.1 (eng review):** el `EventMap` tiene **12 nombres**: `whatsapp_click {origin, pack?, ref?}`, `contact_submit`, `proposal_generated`, `proposal_sent`, `chat_started`, `call_booked`, `intro_played`, `scene_open`, `scene_drag`, `booking_open`, `referral_copy`, `palette_open` (DT §5.6 v1.4).

**Objetivo:** `track()` seguro sin Umami cargado y los eventos de la home v6: `intro_played {skipped, reduced, mode}`, `scene_drag`, `scene_open {scene}` (al ampliar una celda; sustituye a `path_open`), `palette_open`, `whatsapp_click {origin:'home'}`, `booking_open {origin:'home'}` (DT §5.6 + UX v4.0 §4.1). El `EventMap` tiene 12 nombres (los 11 de DT §5.6 con `path_open` → `scene_open`, más `palette_open`).

**Ficheros:** `apps/web/lib/analytics.ts`, `apps/web/lib/analytics.test.ts`; modificar `intro-fall`, `expanded-cell`, `load-scene.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/lib/analytics.test.ts
import { it, expect, vi } from 'vitest';
import { track } from './analytics';
it('is a no-op without umami and forwards when present', () => {
  expect(() => track('intro_played', { skipped: true, reduced: false, mode: 'full' })).not.toThrow();
  (window as any).umami = { track: vi.fn() };
  track('scene_open', { scene: 'business' });
  expect((window as any).umami.track).toHaveBeenCalledWith('scene_open', { scene: 'business' });
});
it('rejects unknown event names at type level', () => { // @ts-expect-error
  track('unknown_event'); });
```
- [ ] 2. → FAIL. 3. Implementar con `EventMap`. 4. → PASS. 5. Commit: `git commit -m "feat(web): typed analytics tracker and home events"`.

**Hecho cuando:** test en verde; Playwright (2.17) intercepta `POST /api/send` con `intro_played`.

### Tarea 2.13 — Capturas comparadas app/prototipo: `pnpm --filter web visual` (working-agreements §5, DT §8.8)

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.10 (primera escena que comparar), `preview.yml`

> **v2.1 (eng review):** (a) cada objetivo de `targets.ts` lleva **`mask: string[]`** (selectores) para los bloques con `{{DATO}}` y para los desvíos aceptados, registrados en **`apps/web/e2e/visual/deviations.json`** (`{ target, selector, commit, approvedBy:'jose', date }`); (b) las fuentes del prototipo (Geist, Geist Mono) se sirven **en local** desde `docs/superpowers/design/ref/fonts/` (copiarlas allí en esta tarea; sin CDN); (c) el job `visual` de `ci.yml` corre **solo en PR que tocan** `apps/web/components/**`, `apps/web/styles/**`, `apps/web/app/**` o `apps/web/messages/**`; (d) **solo la home se compara contra el prototipo**; los objetivos de páginas interiores usan `toHaveScreenshot` contra su primera versión aprobada por Jose (referencias en `e2e/visual/__refs__/`, commiteadas) y no contra `ref/`.

> Sustituye a la 2.13 de la v1 («Medición del hero en móvil, `HERO_LIVE_MOBILE`»), superada: móvil es siempre vídeo + póster.

**Objetivo:** script Playwright que captura, por escena de la home (y por pantalla interior con prototipo en `ref/`), la app en `wrangler dev` y el prototipo servido, a **360×812, 900×1100 y 1440×900**, con `prefers-reduced-motion: reduce`, fuentes cargadas y `{{DATO}}` idénticos, y compara con pixelmatch escribiendo el diff en `apps/web/e2e/visual/__diff__/` (ignorado) y una tabla `escena × ancho → %` en la salida. Tolerancia **fijada por Jose el 2026-09-30: `maxDiffPixelRatio: 0.02` (2 %)**; solo cambia con su OK (working-agreements §5).

**Ficheros:** `apps/web/e2e/visual/visual.spec.ts`, `apps/web/e2e/visual/targets.ts` (lista `{ id, appUrl, protoUrl, selector }` por escena), `apps/web/e2e/visual/compare.ts` (`compare(a, b): { ratio, diffPng }`), `apps/web/e2e/visual/compare.test.ts`, `apps/web/playwright.visual.config.ts` (proyecto aparte; `webServer` doble: `wrangler dev` y `python3 -m http.server 8765 --directory ../../docs/superpowers/design/ref`), `.gitignore` (`__diff__/`), `package.json` (`visual`), raíz (`visual` → `turbo run visual`), `.github/workflows/ci.yml` (job `visual` informativo: sube el diff como artefacto; no bloquea el commit, sí la puerta).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/e2e/visual/compare.test.ts
import { it, expect } from 'vitest';
import { PNG } from 'pngjs';
import { compare } from './compare';
function png(w: number, h: number, fill: number) { const p = new PNG({ width: w, height: h }); p.data.fill(fill); return PNG.sync.write(p); }
it('reports 0 for identical images and the changed ratio otherwise', () => {
  expect(compare(png(10, 10, 0), png(10, 10, 0)).ratio).toBe(0);
  const a = new PNG({ width: 10, height: 10 }); a.data.fill(0); const b = new PNG({ width: 10, height: 10 }); b.data.fill(0); for (let i = 0; i < 40; i++) b.data[i] = 255; // 10 px
  expect(compare(PNG.sync.write(a), PNG.sync.write(b)).ratio).toBeCloseTo(0.1, 2);
});
```
- [ ] 2. `pnpm --filter web test -- compare` → FAIL.
- [ ] 3. Implementar (`pixelmatch` + `pngjs` como devDependencies, justificadas: solo en tests); el spec espera `document.fonts.ready` y `networkidle`, oculta el canvas y fija `{{DATO}}` iguales en ambos lados (los del prototipo son literales; la app usa `messages`).
- [ ] 4. `pnpm --filter web test -- compare` → PASS (añadir un caso: `ratio > 0.02` marca la escena como «no pasa»); `pnpm --filter web visual` produce la tabla para la escena Sobre mí (≤ 2 %) y el hero.
- [ ] 5. Commit: `git commit -m "test(web): visual comparison of app scenes against the v6 prototype at three widths"`.

**Hecho cuando:** la tabla se genera en local y en CI como artefacto; a partir de aquí toda tarea con UI la adjunta al PR.

### Tarea 2.14 — Escena **Servicios** (v3.0; antes Empresas y Negocios): `SlidingList`, `SegmentedControl`, `RateFigure`, `PackStrip`, `ProposalPrompt`, `CheckList`, `CtaRow`

> **v3.0 (D45): una sola escena «Servicios»** en lugar de Empresas y Negocios, 1:1 con `ref/home-v7/`: celda hero con `SlidingList` de las **cuatro vías** (por hora · proyecto cerrado · packs · contratación; cada fila es un enlace a su ancla de `/servicios` y al seleccionarla cambia texto y acción de la celda), celda Packs con `PackStrip` de **cinco** (P5 incluido; destacado inicial P2), celda Tarifas con `SegmentedControl` + `RateFigure` (40 €/h · desde 150 €). Los componentes de la tarea no cambian; cambian la composición (un `Bento` en vez de dos) y los tests de escena (una escena, tres celdas, `span` suman 12; `PackStrip` muestra cinco cifras de `pricing`). El «Ampliar» lleva a `/servicios` con la ancla de la vía seleccionada.

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.10, 2.13, 1.4 · **Insumos:** INV §1.2; `index.html:71-105`; `v6.css:67-88, 170-198`; `v6.js:125-147, 163-166`; `base.css:162-174, 218-220`; `base.js:74-81`; pantallas §5.3 (las filas enlazan a `/empresas#<servicio>` y `/negocios#p<n>`)

**Objetivo:** escenas 2 y 3 de UX v4.0 §4.1 con sus componentes vivos, corrigiendo la accesibilidad de INV §4.5: `SegmentedControl` como tablist con `aria-controls` y tabindex itinerante (o radios), filas de Servicios y Packs como **enlaces**, `<span class="plist__hl">` fuera del `<ul>`, `ProposalPrompt` como `<input>` real con ejemplos decorativos que se paran al enfocar y envío a `/propuesta?q=`. Precios desde `@josecoded/pricing` con `formatPrice`, nunca en `messages`. Tarifas de Empresas: **40 €/h y feature cerrada desde 150 €** (confirmado 2026-09-29; sin packs en esta escena).

**Ficheros:** `components/scenes/{sliding-list,segmented-control,rate-figure,pack-strip,check-list,cta-row}/…`, `components/forms/proposal-prompt/…`, `components/home/{companies-scene,business-scene}.tsx`, `lib/motion/slide-marker.ts` + test, `lib/motion/in-view-once.ts` + test, `components/scenes/segmented-control/segmented-control.test.tsx`, `components/forms/proposal-prompt/proposal-prompt.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/scenes/segmented-control/segmented-control.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect } from 'vitest';
import { SegmentedControl } from '.';
it('is a tablist with roving tabindex, arrow keys and aria-controls', () => {
  render(<SegmentedControl label="Tarifa" options={[{ id:'hour', label:'Por horas', panel:'p-hour' }, { id:'feature', label:'Feature cerrada', panel:'p-feature' }]} defaultId="hour" />);
  const tabs = screen.getAllByRole('tab'); expect(tabs[0].getAttribute('aria-selected')).toBe('true'); expect(tabs[0].getAttribute('aria-controls')).toBe('p-hour'); expect(tabs[1].getAttribute('tabindex')).toBe('-1');
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight' }); expect(tabs[1].getAttribute('aria-selected')).toBe('true'); expect(document.activeElement).toBe(tabs[1]);
});
```
```tsx
// apps/web/components/forms/proposal-prompt/proposal-prompt.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect } from 'vitest';
import { ProposalPrompt } from '.';
it('is a real input; examples stop on focus; submit navigates with the text', () => {
  render(<ProposalPrompt examples={['Una web para mi clínica']} action="/propuesta" />);
  const input = screen.getByRole('textbox'); fireEvent.focus(input);
  expect(screen.getByTestId('examples').getAttribute('data-running')).toBe('false');
  fireEvent.change(input, { target: { value: 'Reservas para mi restaurante' } });
  expect((screen.getByRole('form') as HTMLFormElement).getAttribute('action')).toBe('/propuesta');
  expect((input as HTMLInputElement).name).toBe('q');
});
```
```ts
// apps/web/lib/motion/slide-marker.test.ts
import { it, expect } from 'vitest';
import { markerFor } from './slide-marker';
it('computes marker offset and size from the target rect relative to the list', () => {
  expect(markerFor({ left: 100, top: 40, width: 400, height: 200 }, { left: 220, top: 40, width: 80, height: 200 }, 'x', 6)).toEqual({ offset: 120, size: 80, gap: 6 });
});
```
- [ ] 2. → FAIL. 3. Implementar portando 1:1; duraciones `--dur-slide` (240 ms), `--dur-slide-lg` (260 ms), `--dur-draw` (420 ms) y `--stagger-draw` (120 ms) como tokens; `PackStrip` con los cuatro packs de `pricing` y el segundo destacado al montar; `CheckList` con `in-view-once`. 4. → PASS; stylelint; build; `web-design-guidelines`; **`pnpm --filter web visual`** para las dos escenas (≤ 2 %) y aprobación de Jose en preview. 5. Commit: `git commit -m "feat(web): Companies and Business scenes with sliding list, segmented rates, pack strip, proposal prompt and checklist"`.

**Hecho cuando:** tests en verde; las dos escenas son 1:1 con el prototipo a los tres anchos; los precios de la escena coinciden con `pricing.json` (test).

### Tarea 2.15 — Escenas **Proyectos** (`ProjectsTour` fijado, `ProjectCard`) y **Lab/Blog** (v3.0; `DemoCard`, `PostTeaser`)

> **v3.0 (D44, D45):** la escena Blog pasa a **Lab/Blog**: celda hero con `DemoCard` del lab (miniatura estática que cobra vida al hover/foco: isla mínima; reduced motion → estática) y dos `PostTeaser`. Si solo existe blog o solo lab, la escena muestra ese; si ninguno (`blogEnabled && labEnabled` falsos), la escena no se renderiza (test). Datos desde `content-index` (4.2/4.5); hasta que existan, `{{DATO}}` y la escena oculta. Referencia `ref/home-v7/`.

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.14, 2.6 (arte) · **Insumos:** INV §1.2–1.3 (`ProjectCard`, `PostTeaser`, `ProjectsTour`) y §3 decisión 5 (carrusel = componente); `index.html:107-146`; `v6.css:80-81, 112-141, 201-206`; `v6.js:168-173`; working-agreements §6 (degradación: apilado)

**Objetivo:** escena 4 como **carrusel fijado** (sección de 420svh, contenido `sticky`, pista con `animation-timeline: scroll()`, tarjeta central activa por `lib/motion/center-active.ts`, raíl `aria-hidden` con nombres y progreso) bajo `@supports (animation-timeline: scroll()) and (orientation: landscape)` y sin reduced motion; **en cualquier otro caso, tarjetas apiladas en columna** (nunca `scroll-snap x`). `ProjectCard` con arte de glifos de 2.6 (`aria-hidden`, proporción 801/722 reservada), nombre, entradilla, tipo con icono y `ArrowLink`; datos desde `content/projects/*.json` (3.1; hasta entonces, los del prototipo con `{{DATO}}` en la entradilla → no se renderiza la entradilla). Escena 5 con tres `PostTeaser` desde `blog-index.json` (4.2); **si hay menos de 3 artículos, la escena no existe** (spec D33; hasta 4.2, no existe).

**Ficheros:** `components/scenes/{project-card,projects-tour,post-teaser}/…`, `components/home/{projects-scene,blog-scene}.tsx`, `lib/motion/center-active.ts` + test, `components/home/blog-scene.test.tsx`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/motion/center-active.test.ts
import { it, expect } from 'vitest';
import { pickCenterActive } from './center-active';
it('picks the card whose center is closest to the viewport center', () => {
  const cards = [{ left: 0, width: 400 }, { left: 500, width: 400 }, { left: 1000, width: 400 }];
  expect(pickCenterActive(cards, 720)).toBe(1); expect(pickCenterActive(cards, 100)).toBe(0);
});
```
```tsx
// apps/web/components/home/blog-scene.test.tsx
import { render } from '@testing-library/react';
import { it, expect } from 'vitest';
import { BlogScene } from './blog-scene';
const post = (slug: string) => ({ slug, locale:'es', title: slug, description:'d', date:'2026-09-20', tags:[], readingTime:3, hasTranslation:false });
it('renders nothing with fewer than three real posts', () => {
  expect(render(<BlogScene posts={[post('a'), post('b')]} locale="es" />).container.firstChild).toBeNull();
  expect(render(<BlogScene posts={[post('a'), post('b'), post('c')]} locale="es" />).container.querySelectorAll('article')).toHaveLength(3);
});
```
- [ ] 2. → FAIL. 3. Implementar; `--tour-height` (420svh), `--w-tcard`, `--h-tcard`, `--dur-card` (360 ms), `--float-offset` (8 px, excepción de motion) como tokens; orden de tarjetas por `projects-index.json` (3.1) con 3catinfo nunca primero y josecoded.com nunca primero. 4. → PASS; stylelint; build; `web-design-guidelines`; `pnpm --filter web visual` en Chromium **y WebKit** (apilado) para Proyectos; aprobación de Jose en preview. 5. Commit: `git commit -m "feat(web): pinned Projects tour with glyph art cards and Blog scene gated to three posts"`.

**Hecho cuando:** en Chromium escritorio el scroll vertical desplaza el carrusel una tarjeta por gesto (con 2.16) y en WebKit o en vertical las tarjetas se apilan; la escena Blog no aparece sin 3 artículos.

### Tarea 2.16 — Cierre «¿Empezamos?», `KeyCap`, `PagedScroll` (hook), `SectionIndicator` y `CommandPalette`

> **v3.0:** comandos de ⌘K desde `lib/commands.ts` tipado: «Ir a» Sobre mí · Servicios · Proyectos · Lab · Blog · Para agencias · Contacto; «Acciones» Packs desde 900 € (`/servicios#packs`), 40 €/h (`#por-hora`), Descargar CV (`#contratacion`), Abrir el chat, Pedir propuesta. `SectionIndicator` con **cinco** escenas. Cierre «¿Empezamos?» sin cambios.

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.15, 2.3 · **Insumos:** INV §1.2–1.3 (`Closing`, `KeyCap`, `PagedScroll`, `SectionIndicator`, `CommandPalette`, `CommandItem`) y §3 decisión 5 (paginado = hook); `index.html:148-168`; `base.css:122-135, 184-191`; `base.js:18-72`; `v6.css:17-20, 143-145, 219-235`; `v6.js:9-74, 176-202`; DT §1.10 (`paging.ts`, `palette.ts`, `active-section.ts`)

**Objetivo:** escena 6 (titular de cierre, `[[ WhatsApp ]]` sólido, `[ Reservar 20 min ]` fantasma, pista con `KeyCap` real oculta sin puntero fino), **`usePagedScroll`** montado en una isla sin markup (no hidrata `main`) sobre `lib/motion/paging.ts` (solo puntero fino y sin reduced motion: rueda con umbral 24 / bloqueo 700 ms, ↑↓, AvPág/RePág, Espacio, Inicio, Fin → `glide` 600–950 ms interrumpible; paradas cada 85 % en escenas altas y una por tarjeta en Proyectos; cede Espacio y flechas a controles; desactivado con menú, paleta o celda abiertos; sin puntero fino, `scroll-snap-type: y proximity` en CSS), `SectionIndicator` (líneas por escena, activa más larga; oculto en hero, carrusel y celda abierta; no se dibuja con margen < 2.25rem medido contra el token) y `CommandPalette` (`<dialog>` modal sin animación, grupos «Ir a» y «Acciones» desde `lib/palette/commands.ts` + `messages`, búsqueda sin tildes, ↑ ↓ ↵ Esc, ⌘K/Ctrl+K, clic fuera cierra, cierra la celda ampliada antes de saltar; import dinámico al primer ⌘K o clic en el buscador; en el layout global). WhatsApp con número `{{DATO}}` → si falta, el sólido pasa a Reservar y el formulario a enlace.

**Ficheros:** `components/scenes/closing/…`, `components/ui/key-cap/…` (isla), `components/home/paged-scroll.tsx` (isla), `components/home/section-indicator/…`, `components/layout/command-palette/…`, `lib/palette/commands.ts`, `lib/motion/{paging,palette,keycap}.ts` + tests, ampliar `lib/motion/active-section.test.ts` (`indicatorVisibility`).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/motion/paging.test.ts
import { it, expect } from 'vitest';
import { stops, nextStop, shouldHandleKey } from './paging';
it('adds intermediate stops every 85 % of viewport in tall scenes and one per card in the tour', () => {
  const s = stops([{ top: 0, height: 800 }, { top: 800, height: 2000 }, { top: 2800, height: 3360, cards: [2800, 3560, 4320, 5080] }], 800, 0.85);
  expect(s.slice(0, 4)).toEqual([0, 800, 1480, 2160]); expect(s).toContain(3560);
});
it('goes to the next/previous stop and ignores keys inside controls', () => {
  expect(nextStop([0, 800, 1600], 850, 1)).toBe(1600); expect(nextStop([0, 800, 1600], 850, -1)).toBe(800);
  const input = document.createElement('input'); expect(shouldHandleKey(new KeyboardEvent('keydown', { key: ' ' }), input)).toBe(false);
  expect(shouldHandleKey(new KeyboardEvent('keydown', { key: 'PageDown' }), document.body)).toBe(true);
});
```
```ts
// apps/web/lib/motion/palette.test.ts
import { it, expect } from 'vitest';
import { normalize, filter, reduce } from './palette';
const cmds = [{ id:'projects', group:'go', label:'Proyectos', keywords:['apps','webs'] }, { id:'price', group:'go', label:'Packs', hint:'desde 900 €', keywords:['precio'] }, { id:'wa', group:'act', label:'Escribir por WhatsApp', keywords:['whatsapp'] }];
it('filters without accents and across keywords', () => { expect(normalize('Sánchez')).toBe('sanchez'); expect(filter(cmds, 'PRECIO').map(c => c.id)).toEqual(['price']); expect(filter(cmds, '').length).toBe(3); });
it('keyboard moves the selection and wraps', () => { let s = { query:'', index:0 }; s = reduce(s, { type:'key', key:'ArrowUp' }, cmds); expect(s.index).toBe(2); s = reduce(s, { type:'key', key:'ArrowDown' }, cmds); expect(s.index).toBe(0); });
```
```ts
// apps/web/lib/motion/active-section.test.ts (añadir)
import { indicatorVisibility } from './active-section';
it('indicator is hidden in hero, tour and with an open cell, and when the margin is too narrow', () => {
  expect(indicatorVisibility({ inHero:true, inTour:false, cellOpen:false, marginRem:4 })).toBe(false);
  expect(indicatorVisibility({ inHero:false, inTour:true, cellOpen:false, marginRem:4 })).toBe(false);
  expect(indicatorVisibility({ inHero:false, inTour:false, cellOpen:false, marginRem:2 })).toBe(false);
  expect(indicatorVisibility({ inHero:false, inTour:false, cellOpen:false, marginRem:4 })).toBe(true);
});
```
- [ ] 2. → FAIL. 3. Implementar; `--glide-min`/`--glide-max`, `--wheel-threshold`, `--wheel-lock`, `--dur-pager`, `--dur-key` como tokens leídos en TS; comandos con etiquetas, pistas y palabras clave en `messages` por idioma; la pista «desde 900 €» sale de `pricing`. 4. → PASS; stylelint; build; `web-design-guidelines`; `pnpm --filter web visual` del cierre; aprobación de Jose en preview de **toda la home**. 5. Commit: `git commit -m "feat(web): closing scene, paged scroll hook, section indicator and command palette"`.

**Hecho cuando:** en escritorio un gesto lleva a una escena y en Proyectos a una tarjeta; en táctil el scroll es nativo con snap suave; ⌘K abre la paleta sin animación y Esc cierra en el orden menú → paleta → celda; el indicador nunca aparece en el hero.

### Tarea 2.17 — E2E de la home: hero, una prueba por escena, fallbacks y reduced motion

> **v3.0:** una prueba por escena de la **v7** (Sobre mí, Servicios, Proyectos, Lab/Blog, cierre); en Servicios, seleccionar «contratación» en la `SlidingList` cambia la acción a «Descargar CV»/«Reservar»; `pnpm --filter web visual` compara contra `ref/home-v7/`.

**Agente:** implementador-web · **Rama:** `feat/shell-home` · **Gate:** no · **Depende de:** 2.16, 2.12, 2.13

> **v2.2 (stack):** cada prueba de escena (y la del hero) termina con `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()` y `expect(violations.filter(v => ['serious','critical'].includes(v.impact))).toEqual([])`; las `moderate` se vuelcan al informe del PR (`test-results/axe-<escena>.json`). Se ejecuta en escritorio 1440, móvil 360 y con `prefers-reduced-motion: reduce`. Helper único `e2e/helpers/axe.ts` (`expectNoAxeViolations(page, { name })`) que reutilizan **todos** los E2E de pantallas (3.x), área (5.x), admin (6.x), Radar (7.30) y newsletter (10.4, 10.5): es bloqueante desde esta tarea, no informativo.

> **v2.1 (eng review):** (a) en escritorio, la prueba de orden compara la entrada LCP con **`performance.mark('scene:import-start')`** (2.8), no con el nombre del recurso; (b) en móvil se afirma que **no existe ningún `<canvas>`** y que el `<source>` del vídeo se añade después de la entrada LCP; (c) **E2E del paginado**: `page.mouse.wheel(0, 200)` en 1440×900 lleva exactamente a la escena siguiente y un segundo gesto contrario durante el `glide` lo interrumpe; en 390×844 la rueda no pagina.

**Objetivo:** las filas «Hero: intro y modos», «Home por escena», «Fallbacks» y «Reduced motion» de DT v1.3 §8.2 como tests Playwright (Chromium + WebKit), más la comprobación de que el chunk de `three` llega después del LCP.

**Ficheros:** `apps/web/e2e/hero.spec.ts`, `apps/web/e2e/home.spec.ts` (un `test` por escena: texto accesible real, `h1` único, teclado —Tab llega a cada enlace y celda, Esc cierra la celda, ⌘K abre—, sin errores de consola, indicador ausente en el hero, móvil sin paginado), `apps/web/e2e/fallbacks.spec.ts` (WebKit: Proyectos apilado, celda sin transición, cabecera opaca), `apps/web/e2e/helpers/{reduced-motion,save-data,umami}.ts`, `playwright.config.ts` (proyectos `chromium` y `webkit`).

**Pasos:**
- [ ] 1. Escribir los tests (fallan hasta ajustar detalles):
```ts
// apps/web/e2e/hero.spec.ts (extracto)
import { test, expect } from '@playwright/test';
test.describe('hero desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('first visit: pending before paint, letters land ≤ 1.5 s, three after LCP, canvas visible', async ({ page }) => {
    await page.addInitScript(() => { (window as any).__pending = []; new MutationObserver(() => (window as any).__pending.push(document.documentElement.dataset.intro)).observe(document.documentElement, { attributes: true }); });
    await page.goto('/');
    expect(await page.evaluate(() => (window as any).__pending[0])).toBe('pending');
    await expect.poll(async () => page.evaluate(() => [...document.querySelectorAll('.ch')].every(e => e.textContent === (e as HTMLElement).dataset.ch)), { timeout: 1500 }).toBe(true);
    const order = await page.evaluate(() => { const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1)?.startTime ?? 0; const three = performance.getEntriesByType('resource').find(r => /three|glyph/.test(r.name))?.startTime ?? Infinity; return { lcp, three }; });
    expect(order.three).toBeGreaterThan(order.lcp);
    await expect(page.locator('canvas.hero-stage__canvas')).toHaveCSS('opacity', '1', { timeout: 3000 });
  });
});
test.describe('hero mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });
  test('video after LCP and never a canvas; saveData → no video request; reduced-motion → poster only', async ({ page }) => { /* como DT §8.2 */ });
});
```
```ts
// apps/web/e2e/home.spec.ts (extracto)
import { test, expect } from '@playwright/test';
for (const scene of ['sobre-mi', 'empresas', 'negocios', 'proyectos', 'hablamos']) {
  test(`scene ${scene}: accessible text, keyboard and no console errors`, async ({ page }) => {
    const errors: string[] = []; page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`/#${scene}`);
    await expect(page.locator(`#${scene} h2`)).toBeVisible(); expect(await page.locator('h1').count()).toBe(1);
    await page.keyboard.press('Tab'); expect(await page.evaluate(() => document.activeElement?.closest('section')?.id)).toBeTruthy();
    expect(errors).toEqual([]);
  });
}
test('indicator is absent in the hero and present in scenes', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeHidden();
  await page.goto('/#empresas'); await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
});
```
- [ ] 2. `pnpm --filter web e2e -- hero home fallbacks` → corregir hasta PASS en Chromium y WebKit.
- [ ] 3. Commit: `git commit -m "test(web): e2e for hero modes, every home scene, Safari fallbacks and reduced motion"`.

**Hecho cuando:** los E2E pasan en CI en ambos navegadores y viewports.

**Cierre de la fase 2:** `revisor` sobre `feat/shell-home`; `ui` en modo revisión (`/impeccable audit` y `/impeccable critique`) sobre el diff de capturas de 2.13 y emite «fiel» / «desvío aceptable» / «no pasa» por escena; `/puerta-calidad` completa (`usuario-ejemplo` con Marta y Dani en la home; `revisor-accesibilidad` con la intro, `role="img"`, celda modal, teclado; `qa` con 60 fps en escritorio, vídeo en Android de gama media e iOS Safari con la tabla de fallbacks de working-agreements §6); **Jose aprueba la preview del PR en el navegador**; merge a `main`.

---
## Hito «contenido completo» (v2.1, hallazgo 39) · antes de la fase 3

> **v3.0:** la lista se **reduce** a lo que exige el lanzamiento D46: titular y frase por vía de `/servicios`, texto de `/partners` (y Q16), FAQ por vía, foto e historia de Sobre mí, CV maestro es/en, casos de HazmeFila/Oportunix/josecoded.com, legales, WhatsApp/Cal.com/buzón/LinkedIn, **dos demos del lab y tres guías del blog**, y los **ocho contextos iniciales del chat** (se publican en 6.9, pero se escriben aquí). Sale de la lista todo lo de Radar.

La fase 3 no arranca con huecos: **lista cerrada de insumos con responsable y fecha**, que el controlador convierte en tabla en `ESTADO.md` al cerrar la fase 2 y que la **fecha de válvula** tiene en cuenta. Mientras falte un insumo, su bloque no se renderiza (regla `{{DATO}}`), pero la puerta de la fase 3 no se cierra sin la lista completa o sin la decisión explícita de Jose de publicar sin ese bloque.

| Insumo | Responsable | Bloquea | Fecha (la fija Jose al cerrar la fase 2) |
|---|---|---|---|
| Nombre a mostrar, ciudad, años, disponibilidad, desde cuándo freelance | Jose | hero, Sobre mí, Empresas | |
| Foto real | Jose | celda Sobre mí, P6 | |
| Historia corta, principios y trayectoria (empleos, fechas) en es y en | Jose + `redactor` | P6 | |
| Entregable por servicio (es/en) y respuestas de la FAQ de Empresas | Jose + `redactor` | 2.14, 3.2 | |
| «Incluye» de cada pack y de las apps en lenguaje llano (es/en) | `redactor` (Jose valida) | 3.3, 3.9, `pricing.json` bilingüe | |
| Estado, enlaces, capturas, reto/trabajo/resultado de HazmeFila, Oportunix, 3catinfo y webs de comercios (es/en) | Jose + `redactor` | 3.4, 2.15 | |
| Caso josecoded.com (es/en) | `redactor` desde los documentos del repo (Jose valida) | 3.4 | |
| CV maestro es/en con `<!-- id: -->` y qué entra del stack; certificaciones con organismo y año | Jose | 3.14, 3.5, 7.x | |
| WhatsApp, email profesional, usuario de GitHub, enlaces de stores, plazo de respuesta | Jose | 3.3, 3.10, 2.16 | |
| Cuenta de Cal.com y evento «20 min» | Jose | 3.2, 3.10, 3.12 | |
| Datos del titular (nombre legal, NIF, domicilio) y textos legales validados (es/en) | Jose | 3.6 | |
| Cuenta SMTP para Auth (@josecoded.com) y dominio verificado en Resend | Jose | 3.12, 4.1 | |
| Tres artículos reales (o los tres candidatos escritos) | Jose + `redactor` | 4.2, 2.15 | |
| `Comercial/voz.md` con ejemplos reales | Jose | todo el copy | |

---

## Fase 3 — Páginas públicas (`/servicios`, `/partners`, proyectos, sobre mí, legales), generador, leads vía gateway, contacto, Cal.com, Turnstile · Estimación L · ramas `feat/public-pages` (3.1, 3.13, 3.2, 3.3, 3.4–3.6, 3.14) y `feat/generator-leads` (3.7–3.12)

> **v3.0 (D37, D38; PANT v2.0):** `/empresas` y `/negocios` no existen (301 en 3.2). **3.2 = `/servicios`** (cuatro vías, cinco packs), **3.3 = `/partners`**. Orden de construcción v3.0: 3.1 → 3.13 (componentes + **prototipo de P20 `/servicios`**, no de P1) → 3.2 → 3.7/3.8 → 3.10 (`/contacto` con cuatro vías) → 3.3 → 3.9 → 3.4 → 3.14 → 3.5 → 3.6 → 3.11 → 3.12. Prototipos de `ui`: home v7 (2.0), `/servicios` (3.13) y `/contacto` (3.13); el resto con `DESIGN.md` y aprobación en preview. Personas en la puerta: Marta, Dani, **Nuria, Pablo**.

> **v2.0.** Pantallas y contenidos: **PANT** §1–§3 (P1–P19) y UX v4.0 (§4.2–4.13 con sus notas «superado por»). Lenguaje de las interiores: escenas con **scroll libre** (`Scene` sin `fill`, sin `usePagedScroll`, sin indicador ni carrusel), titular a dos tonos y bentos; modo Leer y Operar con columna de lectura o herramienta. Componentes: los de INV reutilizados (PANT §2, columna R) y los nuevos (columna N) hechos una vez, antes de la primera página que los necesite (3.13). **Todo bilingüe**: cada tarea de pantalla entrega `messages/es.json` y `en.json` (copy de interfaz por `redactor`; los `{{DATO}}` de Jose en ambos idiomas) y termina con `pnpm --filter web i18n:check`. **v2.1 (hallazgo 40): solo Negocios (P1) y Contacto (P3) tienen prototipo de `ui` en `ref/`** (además de la home); `ux` hace `/impeccable shape` y wireframe de todas, y **el resto de pantallas se construye directamente con `DESIGN.md`, PANT y los componentes de 3.13**, con la aprobación de Jose en la preview como validación (working-agreements §4–§5 v1.1). Flujo con prototipo (P1, P3): `ux` → `usuario-ejemplo` → `ui` (prototipo) → Jose valida en el navegador → implementación 1:1 → `visual` contra su referencia → `ui` revisa → Jose aprueba en preview. Flujo sin prototipo: `ux` → implementación con `DESIGN.md` → captura de referencia propia (`__refs__/`) → `ui` revisa → Jose aprueba en preview. Precios solo desde `@josecoded/pricing`; sin métricas.
>
> **Orden de construcción (PANT §4; no es orden de lanzamiento, que sigue siendo todo junto):**
>
> | Orden | Pantalla | Tareas | Motivo |
> |---|---|---|---|
> | 1 | P1 Negocios | 3.1 → **3.13** (componentes compartidos + prototipo de P1) → 3.3 | Camino de Marta; fija el lenguaje de las interiores |
> | 2 | P3 Contacto | 3.7, 3.8 (gateway) → 3.10 | Salida de las dos personas; destino del cierre corto |
> | 3 | P4 Empresas | 3.2 | Camino de Dani; reutiliza P1 y P3 |
> | 4 | P2 Generador | 3.9 | Lead más cualificado de Marta |
> | 5 | P7 Proyectos + P8 Caso | 3.4 | Prueba de oficio; el caso josecoded.com se puede hacer ya |
> | 6 | P6 Sobre mí + Stack y CV | **3.14** (CV maestro + PDF) → 3.5 | Bloqueado por foto, historia, trayectoria y CV maestro |
> | 7 | P18 Legales + P19 Errores | 3.6 | Obligatorios |
> | — | Webhook Cal.com, afiliado, gate | 3.11, 3.12 | Cierre de `feat/generator-leads` |
>
> Si Jose aporta antes los datos de los proyectos, 3.4 sube al segundo puesto.

### Tarea 3.1 — Contenido versionado y scripts de build: proyectos, servicios, FAQ, GitHub y stores

> **v3.0:** `content/services.json` describe las **cuatro vías** (`code`, `anchor` es/en, `primaryAction`, `secondaryActions[]`, `faq[]`) y `content/partners.json` los bloques de `/partners`; el esquema zod en `packages/types/src/schemas/content.ts`. Las FAQ se agrupan por vía.

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 2.4 · **Insumos:** datos §18 (4–8, 12, 14, 15), `GITHUB_TOKEN` en Actions

> **v2.1 (eng review):** `rankProjects` y los JSON de proyectos: `stores.json` y `github.json` solo alimentan enlaces y JSON-LD. `content-refresh.yml` **sin `perf.ts`**.

**Objetivo:** `content/` como única fuente de fichas y textos largos, con esquema zod, y los datos externos (GitHub, stores) generados en build con respaldo commiteado (DT §5.1, §5.2).

**Ficheros:**
- Crear: `apps/web/content/projects/{tres-cat-info,hazmefila,oportunix,josecoded}.json` (+ `webs-*.json` si Jose aporta webs de comercios), `content/projects/schema.ts` (`{ slug, name, type:'app'|'web', oneLiner:{es,en}, status:'published'|'in-use'|'private', proofs:{ appStoreId?, playPackage?, webUrl?, repoUrl? }, hideMetrics?, hideStack?, stack?, year, screenshots[], art:'phone'|'web' }`), `content/projects/cases/<slug>.{es,en}.mdx` (caso de estudio medio con `export const metadata` validado: bloques `challenge`, `work`, `result`; PANT P8), `content/services/{companies,business}.{es,en}.md` (Empresas: tres servicios con `deliverable` `{{DATO}}`), `content/faq/{business,companies}.{es,en}.json`, `scripts/github.ts` (REST + GraphQL → `content/generated/github.json`; fallback al commiteado), `scripts/stores.ts` (iTunes Lookup + `google-play-scraper` → `content/generated/stores.json`; fallback), `scripts/content-index.ts` (esqueleto para blog; ordena proyectos por número de pruebas verificables → `content/generated/projects-index.json`), `.github/workflows/content-refresh.yml` (cron 04:00: scripts → commit `chore(content): refresh generated data` → build → **`wrangler deploy` web solo si el diff se limita a `content/generated/*`**, decisión P4), tests `content/projects/schema.test.ts`, `scripts/content-index.test.ts`.

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

**Hecho cuando:** tests en verde; `github.json` y `stores.json` con datos reales (o respaldo), usados solo para enlaces y JSON-LD (**ninguna cifra se muestra**: sin métricas); josecoded.com nunca ocupa la primera posición.

### Tarea 3.2 — `/servicios` (P20: cuatro vías, cinco packs) y 301 desde `/empresas` y `/negocios` (v3.0)

> **v3.4 (D54):** sin cambio de código: la página sigue consumiendo `@josecoded/pricing`, que desde 3.1c lee `content/pricing.json`. El test «los cinco precios coinciden con `pricing.json`» compara con ese fichero. Un pack oculto desde D2 **no llega** a la página porque no está en el fichero publicado (no hay que filtrar en React); `showPrices = false` (settings) oculta los «desde» como en 3.1b.

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13 (componentes compartidos + **prototipo `ref/servicios/` validado por Jose**), 3.1, 1.4 (adenda v3.0: `pricing.json` con P5), 2.11, 2.14 (`SlidingList`, `PackStrip`, `SegmentedControl`, `RateFigure`) · **Insumos:** PANT v2.0 P20 (bloques 1–9 y barra fija); titular y frase por vía (`redactor`, es/en); textos llanos del «incluye» de los cinco packs; FAQ por vía `{{DATO}}`; WhatsApp, Cal.com, CV (3.14) `{{DATO}}`

**Objetivo:** PANT v2.0 P20: `PageHead` + **`WayNav`** pegajosa (cuatro anclas con `aria-current` por `IntersectionObserver` en `lib/motion/active-section.ts`, reutilizado); cuatro **`WaySection`** (titular a dos tonos + párrafo citable + acción primaria + secundarias): (a) por hora con `RateFigure` 40 €/h y `[Reservar 20 min]`; (b) proyecto cerrado con «desde 150 €» y `[Pedir propuesta orientativa]`; (c) packs con `PackStrip` de **cinco**, **`PackCompare`** de cinco columnas (móvil: un pack por vista con selector, nunca tabla con scroll), **`PackOption`** «ampliada» dentro de P5, `ExtraList`, `ProposalPrompt`, «Precios desde, sin IVA. Dominio, hosting y cuentas de las stores a tu nombre.»; (d) contratación con **`HiringCard`** (CV es · en solo si existe el PDF, `[Reservar 20 min]`, «Preguntar al asistente» → `/chat?case=recruiter`, LinkedIn, email con `CopyField`); `ProcessSteps`; Pruebas (tres `ProjectCard` + GitHub + stores, sin contadores); `FAQ` con `FAQPage` (una por vía); cierre corto («¿No sabes por dónde empezar?» → `[Preguntar al asistente]`); **`StickyCtaBar`** móvil visible solo mientras la vía (c) está en pantalla. JSON-LD: `Service` ×4 + `Offer` con `priceSpecification` (`minPrice`, `valueAddedTaxIncluded:false`, `unitCode:'HUR'` en la vía a). **Redirecciones 301** en `next.config.ts`: `/empresas` → `/servicios#por-hora`, `/negocios` → `/servicios#packs`, `/en/companies` → `/en/services#hourly`, `/en/business` → `/en/services#packs` (Next no reenvía el fragmento en `redirects` si no se incluye en `destination`: incluirlo literal). ⌘K: comandos «Servicios», «Packs desde 900 €», «40 €/h», «Descargar CV».

**Ficheros:** `app/[locale]/(public)/servicios/page.tsx`, `components/services/{way-nav,way-section,pack-compare,pack-option,hiring-card,extra-list,sticky-cta-bar}/…`, `components/shared/whatsapp-button/…` (de la 3.3 v2.2, se mueve aquí), `packages/pricing` (adenda 1.4: `packs` pasa a cinco con `P5 = { code:'P5', price:4000, weeks:6, kind:'app', options:[{ code:'plus', price:6000, weeks:8 }] }`; `apps` se mantiene como alias derivado para el generador hasta 3.7), `messages/*.json` (`services.*` es/en), `next.config.ts` (redirects), `lib/commands.ts` (⌘K), tests `pack-compare.test.tsx`, `way-nav.test.ts`, `e2e/services.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/services/pack-compare/pack-compare.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { pricing } from '@josecoded/pricing';
import { PackCompare } from '.';
it('shows five "Desde" prices from pricing, the plus option inside P5, per-pack proposal links and never gifts or "recomendado"', () => {
  render(<PackCompare packs={pricing.packs} locale="es" />);
  for (const [code, price] of [['P1','900'],['P2','1.400'],['P3','2.500'],['P4','4.200'],['P5','4.000']]) {
    expect(screen.getByText(`Desde ${price} €`)).toBeTruthy();
    expect(screen.getByRole('link', { name: new RegExp(`propuesta.*${code}|${code}.*propuesta`, 'i') }).getAttribute('href')).toContain(`pack=${code}`);
  }
  expect(screen.getByText(/ampliada/i).closest('[data-pack="P5"]')).toBeTruthy(); expect(screen.getByText('Desde 6.000 €')).toBeTruthy();
  expect(screen.queryByText(/recomendado|regalo|gratis/i)).toBeNull();
  expect(screen.getByRole('tablist', { name: /pack/i })).toBeTruthy();
});
```
```ts
// apps/web/e2e/services.spec.ts
import { test, expect } from '@playwright/test';
for (const [from, to] of [['/empresas','/servicios#por-hora'],['/negocios','/servicios#packs'],['/en/companies','/en/services#hourly'],['/en/business','/en/services#packs']])
  test(`${from} → 301 ${to}`, async ({ request }) => { const r = await request.get(from, { maxRedirects: 0 }); expect(r.status()).toBe(301); expect(r.headers()['location']).toBe(to); });
test('four ways, one primary action each, prices before second scroll on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/servicios');
  for (const id of ['por-hora','proyecto','packs','contratacion']) { const s = page.locator(`#${id}`); await expect(s).toHaveCount(1); await expect(s.getByRole('link', { name: /reservar|propuesta/i }).first()).toBeVisible(); }
  await expect(page.getByText('Desde 900 €')).toBeVisible();
  await expect(page.getByText(/sin IVA/)).toBeVisible();
});
```
- [ ] 2. → FAIL. 3. Implementar con `Scene` (sin `fill`), `Bento`, los componentes de 3.13 y 2.14; `pageMetadata` + JSON-LD; `h1` único; párrafo de apertura 2–3 frases (spec §8); bloques con `{{DATO}}` no se renderizan; `pnpm pricing:sync` regenera `pricing.json` con P5 (`parseTarifas` lee la tabla «Packs móvil» como quinto pack con opción). 4. → PASS; `web-design-guidelines`; `pnpm --filter web visual` contra `ref/servicios/`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): services page with four ways, five packs comparator, hiring card, FAQ JSON-LD and 301 from legacy offer pages"`.

**Hecho cuando:** los cinco precios coinciden con `pricing.json` (test); los cuatro 301 pasan; `FAQPage` y `Offer` validan; en 390×844 un pack por vista; `usuario-ejemplo` como Marta ve los precios antes del segundo scroll, como Dani llega a «Reservar 20 min» y como Pablo encuentra el CV o la reserva en < 20 s.

### Tarea 3.2 (v2.2, superada) — `/empresas` (P4: solo trabajo y freelancing)

> **Superada en v3.0 por la 3.2 de arriba (D37).** `/empresas` ya no existe (301). Se conserva el texto por historial.


**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 3.10 (`ContactForm`, `CalEmbed`), 3.1, 2.11 · **Insumos:** PANT P4; entregable por servicio `{{DATO}}` (es/en); respuestas de la FAQ (disponibilidad, puesto fijo); enlaces de stores y GitHub; `NEXT_PUBLIC_CAL_LINK`; prototipo `ref/empresas/` validado por Jose

> **v2.1 (eng review):** sin prototipo propio en `ref/` (se construye con `DESIGN.md`, PANT P4 y los componentes de 3.13; aprobación de Jose en preview). Los textos de servicios y tarifas salen de `pricing.json` bilingüe.

**Objetivo:** PANT P4, bloques 1–8: `PageHead` con el titular de la escena («Trabajo con empresas. Web, móvil e IA para tu producto.») + párrafo citable + `[Reservar 20 min]` + «Descargar CV →» (solo si existe el PDF de 3.14); Servicios (Web · Apps · IA) con `SlidingList` de INV, entregable y enlace al caso de ejemplo; **Tarifas: `SegmentedControl` + `RateFigure` con 40 €/h y feature cerrada desde 150 € (confirmado 2026-09-29; sin packs de web ni de app: viven en Negocios)**; Cómo trabajo (`ProcessSteps`); Con qué trabajo (resumen + «Ver stack y formación →» a `/sobre-mi#stack`); Pruebas (enlaces a stores y «Código en GitHub», **sin contadores**); Preguntas (`FAQ` con `FAQPage`); cierre corto con `[Reservar 20 min]` + «Escribir por formulario →» (`/contacto?via=empresa`) + «Preguntar al asistente →». `Service` + `Offer` JSON-LD.

**Ficheros:** `app/[locale]/(public)/empresas/page.tsx`, `components/companies/{services-list,rates,proof-links}/…`, `messages/*.json` (`companies.*` es/en), `e2e/companies.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla (comportamiento: precios y ausencia de packs):
```tsx
// apps/web/components/companies/rates/rates.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Rates } from '.';
it('shows the two company rates from pricing and never a pack', () => {
  render(<Rates locale="es" />);
  expect(screen.getByText('40 €/h')).toBeTruthy(); expect(screen.getByText(/desde 150 €/)).toBeTruthy();
  expect(screen.queryByText(/900 €|4\.000 €|pack/i)).toBeNull();
});
```
- [ ] 2. → FAIL. 3. Implementar con `Scene` (sin `fill`), `Bento` y los componentes de 3.13; `pageMetadata` + JSON-LD; `h1` único; párrafo de apertura de 2–3 frases (spec §8); bloques con `{{DATO}}` no se renderizan. E2E: `/empresas` y `/en/companies` 200 con `h1`, sin la palabra «pack», Cal no cargado en el HTML inicial. 4. → PASS; `web-design-guidelines`; `pnpm --filter web visual` contra `ref/empresas/`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): companies page (work and freelancing only) with rates, services, proof links and FAQ"`.

**Hecho cuando:** Lighthouse móvil ≥ 90/95/100 en local, el embed no está en el HTML inicial, y `usuario-ejemplo` (Dani) llega a «Reservar 20 min» sin fricción.

### Tarea 3.3 — `/partners` (P21: agencias y consultoras) con `QuickContact` y `PartnerForm` (v3.0)

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 3.10 (`ContactForm`, `CalEmbed`, `CopyField`, Turnstile), 3.8 (`POST /leads` con `kind='agency'`, adenda), 3.4 (casos propios) · **Insumos:** PANT v2.0 P21 (bloques 1–8); texto de `/partners` validado por Jose (es/en); decisión **Q16** (sin precio, recomendación); WhatsApp, Cal.com, buzón `freelance@` (Q18), URL de LinkedIn `{{DATO}}`. **Sin prototipo propio** (se construye con `DESIGN.md`, PANT v2.0 y los componentes de P20; aprobación de Jose en preview)

**Objetivo:** PANT v2.0 P21: `PageHead` («Para agencias y consultoras. Un desarrollador externo que encaja en tu proceso.») + párrafo citable + **`QuickContact`** (componente compartido con el chat: WhatsApp · Reservar 20 min · email con copiar · LinkedIn; cada vía con su evento Umami `quick_contact {channel, page}`); «Qué hago para agencias» (tres celdas); «Cómo encajo» (`ProcessSteps`: brief → estimación 48 h → repo vuestro o mío → demo semanal → entrega; marca blanca; NDA); **`FitList`** (cuándo sí / cuándo no); Tarifa **sin precio** (Q16: «te paso tarifa y disponibilidad en 20 min») salvo que Jose decida otra cosa; casos propios (`ProjectCard` ×3, sin NDA); `FAQ` con `FAQPage`; **`PartnerForm`** (nombre, agencia, email, qué necesitáis; Turnstile; `POST /api/v1/leads` con `source:'web_partner'` → el gateway crea `lead` con `fuente='web_partner'` **y** `crm_contact` con `kind='agency'` + `crm_organization` por nombre normalizado, 3.8 adenda) y «Preguntar al asistente» → `/chat?case=partner`. `/partners` **no** va en la barra principal: pie («Para agencias»), menú ☰ y ⌘K («Para agencias»). JSON-LD `Service` (`audience: BusinessAudience`). `noindex: false` (es pública y debe posicionar «desarrollador react native freelance para agencias»).

**Ficheros:** `app/[locale]/(public)/partners/page.tsx`, `components/partners/{fit-list,partner-form}/…`, `components/shared/quick-contact/…` (+ `quick-contact.test.tsx`), `messages/*.json` (`partners.*`), `lib/commands.ts`, `e2e/partners.spec.ts`; gateway (adenda 3.8): `apps/api/src/schemas/leads.schema.ts` admite `source:'web_partner'` y `organization?: string`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/shared/quick-contact/quick-contact.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { QuickContact } from '.';
it('renders the channels that have data, copies the email and tracks each click', async () => {
  (window as any).umami = { track: vi.fn() }; Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  render(<QuickContact page="partners" locale="es" whatsapp="34600000000" calLink="jose/20min" email="freelance@josecoded.com" linkedin={undefined} />);
  expect(screen.queryByRole('link', { name: /linkedin/i })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /copiar/i })); expect(navigator.clipboard.writeText).toHaveBeenCalledWith('freelance@josecoded.com');
  expect((window as any).umami.track).toHaveBeenCalledWith('quick_contact', { channel:'email', page:'partners' });
});
```
```ts
// apps/web/e2e/partners.spec.ts
import { test, expect } from '@playwright/test';
test('partners page offers at least four quick contact ways and the partner chat case', async ({ page }) => {
  await page.goto('/partners'); await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByTestId('quick-contact').getByRole('link')).toHaveCount(3); // whatsapp, cal, linkedin (email es botón copiar)
  await expect(page.getByTestId('quick-contact').getByRole('button', { name: /copiar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /asistente/i })).toHaveAttribute('href', /\/chat\?case=partner/);
  await expect(page.getByText(/€/)).toHaveCount(0); // Q16: sin precio
});
test('partner form creates an agency contact', async ({ page, request }) => { /* con api en wrangler dev y Supabase local: enviar el formulario y leer crm_contacts con service role (helper readContact de 3.8) → kind 'agency', organization creada */ });
```
- [ ] 2. → FAIL. 3. Implementar; `QuickContact` no renderiza una vía sin dato; `PartnerForm` reutiliza `Form`/`Field` de 3.10. 4. → PASS; `web-design-guidelines`; `i18n:check`; captura de referencia propia en `__refs__/partners-*.png`; `ui` revisa; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web,api): partners page for agencies with quick contact, fit list, FAQ and agency lead intake"`.

**Hecho cuando:** `usuario-ejemplo` (Nuria) llega a una vía de contacto en < 30 s sin rellenar el formulario; el formulario crea `lead` + `crm_contact(kind='agency')` + `crm_organization` (test del gateway); Lighthouse móvil ≥ 90/95/100.

### Tarea 3.3 (v2.2, superada) — `/negocios` (P1: comparador de packs, «¿Necesitas una app?», barra fija)

> **Superada en v3.0 (D37):** el comparador, `AppOffer` (ahora `PackOption` dentro de P5), `ExtraList`, `StickyCtaBar` y `WhatsAppButton` pasan a la 3.2 (`/servicios`). `/negocios` → 301. Se conserva el texto por historial; sus tests de `PackCompare` y `WhatsAppButton` siguen válidos adaptados a cinco packs.


**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 3.1, 1.4 · **Insumos:** PANT P1 (bloques 1–9 y barra fija); textos llanos del «incluye» de cada pack y de las apps (`redactor` con `voz.md`, es/en; Jose valida); WhatsApp `{{DATO}}`; prototipo `ref/negocios/` validado por Jose

> **v2.1 (eng review):** (a) `WhatsAppButton`: el texto prellenado termina en «(ref XXX)» cuando hay código de afiliado aceptado y el evento `whatsapp_click` lleva `ref`; (b) `PackCompare` y `AppOffer` leen `name.{locale}`, `includes.{locale}` de `pricing.json` bilingüe (1.4); (c) el prototipo `ref/negocios/` de 3.13 es la referencia visual de esta pantalla.

**Objetivo:** PANT P1: `PageHead` (titular de la escena + párrafo citable + `[Escribir por WhatsApp]` + «Pedir propuesta orientativa →»); **`PackCompare`** con los cuatro packs desde `pricing` (qué incluye, plazo, precio «desde», «Pedir propuesta con este pack →» → `/propuesta?pack=P2`; **en móvil, un pack por vista con selector y `PackStrip` como índice**, nunca tabla con scroll horizontal; anclas `#p1`–`#p4` a las que enlaza la escena de la home); «Precios desde, sin IVA. Dominio y hosting a tu nombre.»; `ProposalPrompt` (INV) → `/propuesta?q=`; **`AppOffer`** («¿Necesitas una app?»: MVP desde 4.000 € · 6 semanas; ampliada desde 6.000 € · 8 semanas, desde `pricing.apps`, sin jerga, WhatsApp prellenado «app»); `ExtraList` (mantenimiento con selector mensual, SEO, GEO, seguridad); `ProcessSteps` (hablamos → presupuesto cerrado → 40/30/30 → publicada + 30 días); «Webs hechas» (`ProjectCard` de webs de comercios; sin datos, no se renderiza); `FAQ` con `FAQPage`; cierre corto con WhatsApp; **`StickyCtaBar`** móvil (WhatsApp + Propuesta; la única barra fija del sitio). Sin «recomendado» ni regalos.

**Ficheros:** `app/[locale]/(public)/negocios/page.tsx`, `components/business/{pack-compare,app-offer,extra-list,sticky-cta-bar}/…`, `components/shared/whatsapp-button/…` (`wa.me/<número>?text=` por origen e idioma; evento `whatsapp_click {origin, pack?}`), `packages/pricing` (ampliar `pricing.json` y `schema.ts` con `apps: [{ code:'APP_MVP', price:4000, weeks:6 }, { code:'APP_PLUS', price:6000, weeks:8 }]` + test), tests `pack-compare.test.tsx`, `whatsapp-button.test.tsx`, `e2e/business.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```tsx
// apps/web/components/business/pack-compare/pack-compare.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { pricing } from '@josecoded/pricing';
import { PackCompare } from '.';
it('shows four "Desde" prices from pricing, weeks, per-pack proposal links and never gifts or "recomendado"', () => {
  render(<PackCompare packs={pricing.packs} locale="es" />);
  for (const [code, price] of [['P1','900'],['P2','1.400'],['P3','2.500'],['P4','4.200']]) { expect(screen.getByText(`Desde ${price} €`)).toBeTruthy(); expect(screen.getByRole('link', { name: new RegExp(`propuesta.*${code}|${code}.*propuesta`, 'i') }).getAttribute('href')).toContain(`pack=${code}`); }
  expect(screen.queryByText(/recomendado|regalo|gratis/i)).toBeNull();
  expect(screen.getByRole('tablist', { name: /pack/i })).toBeTruthy(); // selector móvil: un pack por vista
});
```
```ts
// packages/pricing/test/pricing.test.ts (añadir)
it('exposes the two app packs from tarifas v2', () => { expect(pricing.apps.map(a => [a.code, a.price, a.weeks])).toEqual([['APP_MVP',4000,6],['APP_PLUS',6000,8]]); });
```
```tsx
// apps/web/components/shared/whatsapp-button/whatsapp-button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { WhatsAppButton } from '.';
it('links to wa.me with prefilled localized text and tracks the click', () => {
  (window as any).umami = { track: vi.fn() };
  render(<WhatsAppButton number="34600000000" origin="business" pack="P2" locale="en" />);
  const a = screen.getByRole('link', { name: /WhatsApp/ });
  expect(a.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/34600000000\?text=/); expect(decodeURIComponent(a.getAttribute('href')!)).toMatch(/P2/);
  fireEvent.click(a); expect((window as any).umami.track).toHaveBeenCalledWith('whatsapp_click', { origin:'business', pack:'P2' });
});
```
- [ ] 2. → FAIL. 3. Implementar; `pnpm pricing:sync` regenera `pricing.json` con los packs de app (actualizar `parseTarifas` para la tabla «Apps» de `tarifas.md`); sin número `{{DATO}}`, `WhatsAppButton` no se renderiza y la primaria pasa a «Pedir propuesta». 4. → PASS; `web-design-guidelines`; `pnpm --filter web visual` contra `ref/negocios/`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): business page with pack comparator, app offer, extras, FAQ JSON-LD, WhatsApp CTA and sticky bar"`.

**Hecho cuando:** los precios de la página coinciden con `pricing.json` (test), el `FAQPage` valida, en 390×844 el comparador muestra un pack por vista y `usuario-ejemplo` (Marta) ve los cuatro precios antes del segundo scroll.

### Tarea 3.4 — `/proyectos` (P7) y casos de estudio `/proyectos/[slug]` (P8), incluido josecoded.com

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 3.1, 2.15 (`ProjectCard`), 2.6 (arte) · **Insumos:** PANT P7–P8; capturas reales, reto/trabajo/resultado, estado y enlaces por proyecto (es/en); prototipos `ref/proyectos/` y `ref/caso/` validados por Jose. **Repo de josecoded privado (2026-09-30): el caso no lleva `repoUrl`**

**Objetivo:** índice con `PageHead`, filtro `SegmentedControl` (Todos · Apps · Webs, en la URL `?tipo=`), `ProjectCard` apilada (sin carrusel) ordenada por `projects-index.json` (3catinfo y josecoded.com nunca primero), `EmptyState`; **caso de estudio medio** por proyecto (`ProjectHead` con nombre, tipo, estado y enlace de prueba como primaria; `ScreenGallery` con capturas en `<picture>` AVIF/WebP generadas en build; `CaseSection` reto / qué hice (`CheckList`) / resultado verificable **sin métricas**; `Chip` de stack ocultable (`hideStack`); `StoreLinks` **sin valoración**; `PrevNext`; cierre corto → `/contacto`), `SoftwareApplication` JSON-LD (solo nombre y enlaces), `generateStaticParams` por slug y locale. **El caso josecoded.com** se escribe ya (`redactor` desde la spec, el DT, `DESIGN.md` y el contrato de la home; Jose valida): reto de dos audiencias; qué hice (escena de glifos, bento por escenas, gateway y backend propio, generador con IA y precio por reglas, Radar); stack; **sin enlace al código (repo privado): la prueba principal es la propia web y el caso explica la arquitectura en texto**. Sin capturas, un caso muestra el arte de glifos.

**Ficheros:** `app/[locale]/(public)/proyectos/page.tsx`, `app/[locale]/(public)/proyectos/[slug]/page.tsx`, `components/projects/{project-filter,project-head,screen-gallery,case-section,store-links,prev-next}/…`, `content/projects/cases/josecoded.{es,en}.mdx`, `scripts/images.ts` (sharp → AVIF/WebP y anchos fijos en `prebuild`), `components/projects/store-links/store-links.test.tsx`, `e2e/projects.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```tsx
// apps/web/components/projects/store-links/store-links.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { StoreLinks } from '.';
it('renders store links and never ratings, installs or counts', () => {
  render(<StoreLinks proofs={{ appStoreId:'1', playPackage:'x', repoUrl:'https://github.com/x/y' }} stores={{ '1': { rating:4.6, count:1200 } }} locale="es" />);
  expect(screen.getAllByRole('link')).toHaveLength(3);
  expect(screen.queryByText(/4,6|1\.200|valoraciones|descargas/)).toBeNull();
});
```
- [ ] 2. → FAIL. 3. Implementar; E2E: `/proyectos` y `/en/projects` 200; filtro por URL; `/proyectos/josecoded` 200 con `SoftwareApplication` y los tres bloques; 3catinfo sin stack ni cifras. 4. → PASS; `web-design-guidelines`; `visual`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): projects index with filter and medium case studies incl. josecoded.com"`.

**Hecho cuando:** las fichas con datos renderizan estáticas en ambos idiomas; las que tienen `{{DATO}}` en bloques obligatorios no se publican (test de build); josecoded.com tiene su caso completo.

### Tarea 3.5 — `/sobre-mi` (P6, profundidad media) con «Stack y formación» (`#stack`)

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 3.14 (PDF), 3.1 · **Insumos:** PANT P6; foto real, ciudad, historia (es/en), trayectoria (empleos, años, desde cuándo freelance), qué entra del stack, certificaciones con organismo y año; prototipo `ref/sobre-mi/` validado por Jose

**Objetivo:** `PageHead` con retrato (`AboutSummary` de INV: foto, nombre, «Desarrollador full-stack freelance · {{ciudad}}», frase de la celda v6); `Prose` con la historia corta (`{{DATO}}`, editada por `redactor`, nunca inventada); `Timeline` con fechas reales (Oportunix 2026-02, HazmeFila 2026-06, josecoded 2026-09, 3catinfo `{{DATO}}`, empleos); `PrinciplesList` (tres principios de `voz.md`); **sección `#stack` «Stack y formación»**: `StackGroups` (móvil · web · backend y datos · calidad y operaciones, `Chip` en bloque sin marquesina) + `CredentialList` (ITIL 4, DevOps & Cloud Computing, PSM, con estado) + «Descargar CV (PDF) →» al PDF del idioma (3.14; sin PDF, no se renderiza); `LinkRow` (LinkedIn, GitHub, stores, CV); cierre corto `[Hablamos]` + «Preguntar al asistente →»; `ProfilePage` JSON-LD. Sin pinning ni trayectoria ligada al scroll.

**Ficheros:** `app/[locale]/(public)/sobre-mi/page.tsx`, `components/about/{timeline,principles-list,stack-groups,credential-list,link-row}/…`, `components/about/timeline/timeline.test.tsx`, `e2e/about.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```tsx
// apps/web/components/about/timeline/timeline.test.tsx
import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Timeline } from '.';
it('renders only entries with a real date and in chronological order', () => {
  render(<Timeline entries={[{ label:'josecoded v2', date:'2026-09' }, { label:'3catinfo', date:'{{DATO: año}}' }, { label:'Oportunix', date:'2026-02' }]} locale="es" />);
  const items = screen.getAllByRole('listitem').map(li => li.textContent);
  expect(items).toHaveLength(2); expect(items[0]).toMatch(/Oportunix/); expect(items[1]).toMatch(/josecoded/);
});
```
- [ ] 2. → FAIL. 3. Implementar; `/sobre-mi#stack` y `/en/about#stack` con `scroll-margin-top` de la cabecera; E2E: ambas rutas 200, `#stack` existe, «Descargar CV» apunta al PDF del idioma. 4. → PASS; `web-design-guidelines`; `visual`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): about page with story, timeline, principles, stack and credentials section and CV download"`.

**Hecho cuando:** sin logos de terceros; sin frases de la lista negra de UX (test de microcopy en `lint`: `grep -E "soluciones|ayudo a|sin complicaciones|alto rendimiento|profesional|innovador" messages/es.json` vacío); tiempo en página medible (métrica de la spec) con Umami.

### Tarea 3.6 — `/legal/*` y `/404`, `/500` públicas

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 2.3 · **Insumos:** textos legales validados por Jose (se portan los de josedev con marca `josecoded`, en es y en); datos del titular

> **v2.1 (eng review):** política de **cookies**: la cookie `ref` solo se escribe **tras aceptación explícita** en `RefNotice` (3.11); sin ella, el código vive en `sessionStorage` y caduca con la sesión. Política de **privacidad**: finalidad «atribución de recomendaciones (afiliados) y detección de autoreferido» y «personalización del área». Sin prototipo propio.

**Objetivo:** PANT P18–P19 y UX §8: aviso legal, privacidad y cookies en es/en como MDX estático con `Prose` + `Toc` (privacidad con las finalidades nuevas: personalización del área por señal de origen, spec D32; la española es la que vale legalmente y la inglesa lo dice); `ErrorPage` v6 para 404, 410, 500, 403 y mantenimiento con el código sobre el título y enlaces útiles (`/contacto`, no «Contacto» de la cabecera); `OfflineBanner`. Con `{{DATO}}` del titular (nombre legal, NIF, domicilio) sin cubrir, las legales no se publican.

**Ficheros:** `content/legal/{aviso-legal,privacidad,cookies}.{es,en}.mdx`, `app/[locale]/(public)/legal/[doc]/page.tsx`, `app/[locale]/not-found.tsx`, `app/[locale]/error.tsx`, `app/global-error.tsx`, `components/shared/{error-page,offline-banner}.tsx`, `e2e/errors.spec.ts`.

**Pasos:**
- [ ] 1. E2E que falla: `/legal/privacidad` 200 con `h1`; `/en/legal/privacy` 200; `/no-existe` 404 con texto "404" y enlace a Inicio; `/en/no-existe` 404 en inglés.
- [ ] 2. → FAIL. 3. Implementar (`@next/mdx` ya configurado en 1.5/4.2: si 4.2 no ha llegado, configurar aquí `next.config.ts` con `withMDX` y `pageExtensions`). 4. → PASS. 5. Commit: `git commit -m "feat(web): legal pages, localized 404/500 and offline banner"`.

**Hecho cuando:** E2E en verde; `cookies` dice que no hay cookies de terceros ni banner (Umami sin cookies).

**Cierre de `feat/public-pages`:** ver tras la tarea 3.14 (v2.0: las tareas 3.13 y 3.14 pertenecen a esta rama).

### Tarea 3.7 — Gateway: `verifyTurnstile`, cuotas KV y `POST /api/v1/proposals/generate`

> **v3.4 (D54; lo ejecuta 3.7b):** los precios del generador, el prompt con `includes`, las cantidades permitidas de `guardModelOutput` y `pricingVersion` del `proposalToken` salen del catálogo **publicado** (`pricing_published()` vía puerto `PricingSource`, caché 5 min) con respaldo al fichero compilado. Los tests de esta tarea pasan a usar la falsa `pricing.fake.ts`.

> **v3.0 (D37):** el modelo y `classifyByRules` clasifican en **cinco packs** (`P1`–`P5`); `P5` con `option: 'plus'` cuando la petición pide notificaciones, pagos o integración con un sistema; `ai_proposal.pack` admite `P5` y `ai_proposal.option?`; `isApp` se deriva (`pack === 'P5'`) y se mantiene en el contrato por compatibilidad con `area_lead_summary()`. Tests de 3.7 alineados: «app con pagos» → `P5` + `plus` → `priceFrom 6000`; «app sencilla» → `P5` → `4000`. La guarda determinista se exporta (`utils/ai-guard.ts`) para 4.4 y 6.8.

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 1.7, 1.4

> **v2.2 (stack):** puertos `TurnstileVerifier`, `QuotaStore`, `AiClient`, `ProposalsRepo` en `@josecoded/types/api.ts`; adaptadores `turnstile.adapter.ts`, `kv-quota.adapter.ts` (+ RPC `increment_quota` vía `supabase.adapter.ts`), `workers-ai.adapter.ts` en `apps/api/src/adapters/`, cada uno con test de contrato en workerd (`fetchMock`) y falsa en `test/fakes/`. `createProposalsService(deps)` se testea con las falsas (clasificador determinista, cuota agotada, Turnstile inválido) sin HTTP; la ruta solo valida con `proposalRequestSchema` de `@josecoded/types/schemas/proposals.ts` y llama al servicio. `buildDeps` se amplía con estos adaptadores.

> **v2.1 (eng review):** orden y piezas nuevas (DT §0b): (1) `verifyTurnstile` **antes** que cualquier contador; (2) `nativeRateLimit`; (3) cuota por IP y global con la **RPC `increment_quota`** (1.8) en lugar de `QUOTA_KV`; si la RPC falla, **se deja pasar** y se registra `quota_unavailable` (test «el contador lanza un error → 200»); (4) `env.AI.run(..., { gateway: { id: env.AI_GATEWAY_ID } })` **obligatorio** con `cf-aig-metadata: { consumer:'proposals' }` y el presupuesto de DT §0b; (5) **guarda determinista** `guardModelOutput(output, locale)`: si la salida contiene `€`, cifras que parezcan precio, URLs, «gratis/regalo/free» o texto en otro idioma → cae a reglas (`source:'rules'`); (6) precio por reglas. **`proposalToken`** = HMAC-SHA256 con `SERVER_KEY` de `{ pack, extras, priceFrom, isApp, pricingVersion, locale, exp }` en la respuesta, sin KV. `isApp` y `APP_MVP`/`APP_PLUS` en el JSON schema del modelo y en `classifyByRules` (palabras clave **es y en**: «app», «aplicación móvil», «iOS», «Android», «store», «mobile app»); **precedencia P4 > P3 > P2 > P1** y los cuatro casos del test alineados (añadir «app para pedir cita» → `APP_MVP`). **Evals manuales**: `apps/api/evals/proposals.jsonl` (~30 casos es/en con 5 inyecciones) y script `pnpm --filter api eval -- evals/proposals.jsonl` contra `wrangler dev --remote`; resultado en el PR antes del merge.

**Objetivo:** el generador de propuestas de DT §3.2 en workerd, con clasificación por IA (JSON mode) y precio por reglas, fallback por reglas, Turnstile, rate limit y cuota diaria.

**Ficheros:**
- Crear: `apps/api/src/services/turnstile.service.ts` (`verifyTurnstile(env, token, ip, { action, hostnames })`), `src/services/quota.service.ts` (`checkQuota(env, key, limit, ttl)` → RPC `increment_quota`; deja pasar si falla), `src/services/output-guard.ts` (`guardModelOutput`), `src/services/proposal-token.ts` (HMAC), `src/services/proposal-classifier.ts` (prompt de sistema con `includes` de `pricing.json`; `classifyByRules(answers)`; JSON schema literal de DT §3.2), `src/modules/proposals.routes.ts`, `src/schemas/proposals.schema.ts`, tests `proposals.routes.test.ts`, `proposal-classifier.test.ts`, `turnstile.service.test.ts`.
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
- [ ] 2. → FAIL. 3. Implementar según DT §3.2 (pasos 1–6); `AI` falso en `vitest.config.ts` (`miniflare.bindings` o `wrappedBindings`) que devuelve `env.AI.__next`; `AI_GATEWAY_ID` **obligatorio** en `env.AI.run(..., { gateway:{ id } })`; la propuesta viaja como `proposalToken` firmado (sin KV). 4. → PASS (heredados + nuevos). 5. Commit: `git commit -m "feat(api): AI proposal generator with rule-based pricing, Turnstile, rate limit and daily quota"`.

**Hecho cuando:** tests en verde; una prueba de humo manual con el modelo real en `wrangler dev --remote` antes del merge (DT §8.7).

### Tarea 3.8 — Gateway: `POST /api/v1/leads`, `notifyLead`, `POST /notify/lead`, `GET /affiliates/validate`; Edge Function `lead.created`

> **v3.0 (D41):** `POST /leads` admite `source: 'web_partner'` (→ `fuente='web_partner'`) y `organization?`; tras insertar el `lead` **crea también `crm_contacts`** (`kind` por `source`: `web_partner`→`agency` (+ `crm_organizations` por nombre normalizado), resto→`lead`; `lead_id`, `email`, `phone`, `locale`, `status='new'`, `next_action='Responder'`, `next_action_at = now()+1 día`) y una `crm_interactions(kind='import'|'message_received', channel=web_form|web_proposal|calcom)`; **la respuesta `{ leadId, notified }` no cambia** (test de contrato). Si falla la escritura del CRM, el lead ya está creado y se registra `meta.crm = 'failed'` (el mapeo perezoso de 6.2 lo recupera). Puerto `CrmRepo` en `@josecoded/types/api.ts` con falsa en memoria.

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no (los secretos van en 3.12) · **Depende de:** 3.7, 1.8c, 1.9

> **v3.2 (DATOS §4.3, §8.4):** `POST /api/v1/leads` llama a la RPC `create_lead(p jsonb)` (service role), que crea o reutiliza el `crm_contact` por email, inserta el `lead` idempotente, la interacción `lead_created` y el evento `lead.created` en `private.outbox`; el gateway además avisa por Telegram en la misma petición (`deps.telegram`) con la misma clave de idempotencia. **Desaparecen** la Edge Function `notify`, `POST /notify/lead` y `NOTIFY_SHARED_SECRET`; `notifyLead` es una función interna del gateway. `GET /affiliates/validate` lee `affiliates.code`.

> **v2.2 (stack):** puertos `LeadsRepo`, `AffiliatesRepo`, `Notifier`; adaptadores `supabase.adapter.ts` (repos) y `telegram.adapter.ts`; `createLeadsService(deps)` (idempotencia, afiliado desconocido no bloquea, `notifyLead`) con tests sobre falsas en memoria; los tests contra `supabase start` de v2.1 quedan como tests de contrato de `supabase.adapter.ts`. Esquemas `leadSchema`, `leadResponseSchema` en `@josecoded/types/schemas/leads.ts`; `apps/web` importa el mismo tipo `Lead` (sin duplicar el contrato en la web).

> **v2.1 (eng review):** (a) tests **contra `supabase start`** (`SUPABASE_URL=http://127.0.0.1:54321`) con `fetchMock.enableNetConnect(/127\.0\.0\.1/)` y helper `readLead(id)` (service role solo en CI/local, `tests/helpers/db.ts`); (b) **`idempotency_key`** obligatoria (`calcom:<uid>` o UUID del cliente): repetida → 200 con el `leadId` existente; (c) `proposalToken` verificado (HMAC) y **re-tarificado** con `pricing`; `ai_proposal` con el contrato de 1.4 y **test de contrato** con la Edge Function (`supabase/functions/notify/index.test.ts` lee el mismo fixture); (d) **código de afiliado desconocido → 201 sin afiliado y `meta.invalid_ref`** (sustituye al 400 del test); autoreferido → 201 con `meta.self_referral_suspect` (sin 409); `GET /affiliates/validate` a 10/min por IP; (e) `notifyLead` deduplica por `lead_id` (`meta.notify.sent_at`) y el trabajo `leads.notify_retry` del cron único reintenta los `via='none'` de 24 h; (f) `leads.user_id` se rellena si llega JWT.

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
  const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead({ affiliateCode:'ANA-TEST01', contact:{ name:'Ana', email:'ana@test' } })) });
  expect(r.status).toBe(201); const row = await readLead((await r.json()).data.leadId); expect(row.affiliate_code).toBe('ANA-TEST01'); expect(row.meta.self_referral_suspect).toBe(true);
});
it('unknown affiliate code → 400', async () => { const r = await SELF.fetch('http://x/api/v1/leads', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(lead({ affiliateCode:'NOPE-0000' })) }); expect(r.status).toBe(400); });
it('GET /affiliates/validate', async () => { expect((await (await SELF.fetch('http://x/api/v1/affiliates/validate?code=ANA-TEST01')).json()).data.valid).toBe(true); expect((await (await SELF.fetch('http://x/api/v1/affiliates/validate?code=ZZZ-0000')).json()).data.valid).toBe(false); });
```
- [ ] 2. → FAIL. 3. Implementar según DT §3.3–3.4 (`fuente` mapeada, `monto` = `priceFrom` de la propuesta recuperada de KV y re-tarificada, `waitUntil(notifyLead)`, `notified:'pending'` si no termina en 3 s; `N8N_LEAD_WEBHOOK_ENABLED` opcional). `POST /notify/lead` con `assertAdmin` existente. 4. → PASS. 5. Commit: `git commit -m "feat(api): leads endpoint with Turnstile/server-key auth, affiliate attribution and edge-function notification"`.

**Hecho cuando:** tests en verde con `supabase start`; un lead creado en local aparece en `leads` con `meta.notify.via`.

### Tarea 3.9 — Web: generador de propuesta `/propuesta` (`GuidedChat` + `ProposalCard`)

> **v3.0 (D37):** `?pack=P1..P5` desde `/servicios`; `ProposalCard` muestra P5 con la opción «ampliada» cuando `option='plus'`; el «incluye» sale de `pricing.packs` (cinco). Enlace de vuelta a `/servicios#packs`.

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 3.7, 3.8, 2.3 · **Insumos:** `ui` (`GuidedChat`, `ProposalCard` §13.12), UX §4.4, §9.1, §10.3

> **v2.2 (stack):** el envío final (`sendProposal`) es un Server Action con `useActionState` y `FormState<SendProposalInput>`; los campos de contacto del último paso usan `Form`/`Field` de 3.10 (que se implementa **antes** o en la misma rama: reordenar si hace falta) y el esquema `sendProposalSchema` de `@josecoded/types/schemas/proposals.ts` (el mismo que valida el gateway). Estado de la máquina de pasos con `useReducer` local; nada en `ShellProvider`. `vitest-axe` en el test de `GuidedChat`; bloque «A11y» (pasos anunciados con `aria-live`, foco al primer control de cada paso).

> **v2.1 (eng review):** guarda el `proposalToken` en el estado de la máquina y lo envía en `sendProposal`; genera un `idempotencyKey` (UUID) al entrar en `sending` y lo reutiliza en reintentos; la `ProposalCard` muestra `AppOffer` si `isApp`.

**Objetivo:** chat guiado de 4 pasos (tipo de negocio con chips, necesidades multiselección, ¿vende o reserva?, plazo) → propuesta (pack, alcance, "desde X €", extras opcionales, preguntas) → enviar (nombre + email/teléfono + Turnstile `proposal_send`) → lead `web_proposal`. Nunca página en blanco; `?pack=` preselecciona; `?q=` (texto de `ProposalPrompt`) precarga la primera respuesta; **si la clasificación apunta a una app, la `ProposalCard` muestra el bloque de apps (`AppOffer` de 3.3) en vez de un pack web** (PANT P2; `ai_proposal.isApp`); **bilingüe**: el gateway recibe `locale` y responde en el idioma de la página; errores inline (429, 502, Turnstile). `ChatBubble` y `ChoiceChips` con el sistema v6 (INV). Prototipo `ref/propuesta/` validado por Jose antes de construir.

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

### Tarea 3.10 — Web: `/contacto` (P3: selector negocio/empresa, `ContactForm`, `CalEmbed`, `CopyField`) y `ClosingCompact` para todas las páginas

> **v3.0 (Q17, recomendación mantenerla): selector de cuatro vías** —Soy cliente (WhatsApp + propuesta + formulario plegado) · Soy agencia (`QuickContact` de 3.3 + `PartnerForm`) · Contratación (CV + reservar + email) · Otra cosa (formulario + chat)— con `?via=client|partner|recruiter|other`; `resolveAudience()` devuelve esos cuatro valores (y los antiguos `negocio|empresa` se mapean a `client`). `ClosingCompact` recibe `via` para la primaria de cada página (`/servicios`: asistente; `/partners`: QuickContact; `/sobre-mi`: Hablamos; casos: `via=client`).

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 3.8, 3.13, 3.3 (`WhatsAppButton`) · **Insumos:** PANT P3 y §1.3 («cierre corto»); WhatsApp, email, GitHub, plazo de respuesta y cuenta de Cal.com `{{DATO}}`; prototipo `ref/contacto/` validado por Jose

> **v2.2 (stack):** crea **`components/forms/form/`** y **`components/forms/field/`** (working-agreements §17.3): `Form` monta `useActionState`, `aria-live` de error general y botón con `pending`; `Field` con `kind: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio-group' | 'hidden'` (`FieldKind` en `@josecoded/types/ui.ts`) pinta label, ayuda, error, `aria-describedby`, `aria-invalid`, `autocomplete`. `submitContact` devuelve `FormState<ContactInput>` con `fieldErrors` desde `contactSchema` (`@josecoded/types/schemas/leads.ts`). Tests: `Field` con `vitest-axe` para cada `kind` y estado de error; `Form` sin JS (E2E con `javaScriptEnabled: false` envía y muestra errores del servidor). Ambos entran en `/dev/ui`. Sin react-hook-form.

> **v2.1 (eng review):** el formulario genera `idempotencyKey` por envío; sin prototipo en `ref/contacto/` no se construye (P3 sí tiene prototipo, 3.13).

**Objetivo:** PANT P3: cabecera «¿Empezamos? Cuéntame qué necesitas.»; `SegmentedControl` **Tengo un negocio / Somos una empresa** (segmento inicial por `?via` → `sessionStorage.audience` → negocio); vía negocio: `[Escribir por WhatsApp]` primario + «Pedir propuesta orientativa →» + `Disclosure` «Prefiero dejar mis datos» con el formulario plegado; vía empresa: `ContactForm` abierto (primaria Enviar) + `CalEmbed` (INV/DT §5.3, lazy) + `CopyField` con el email; datos (email, LinkedIn, GitHub, «Respondo en menos de {{DATO}}»); SA `submitContact` → gateway `POST /leads` (`source:'web_form'`, `locale`); si el gateway responde 5xx, fallback `mailto:` + WhatsApp. **`ClosingCompact`**: versión compacta de `Closing` (una frase, la primaria de la persona de la página, «Otras formas de hablar →» a `/contacto`), usada por 3.2–3.5 y 4.2. La misma señal `audience` la usa la personalización del área (5.1).

**Ficheros:** `app/[locale]/(public)/contacto/page.tsx`, `app/[locale]/(public)/contacto/actions.ts` (`submitContact(formData)`: zod, `turnstileToken`, `POST /leads`, `{ ok } | { error:'gateway_down'|'bot'|'invalid' }`), `components/contact/{contact-form,cal-embed,copy-field}/…`, `components/scenes/closing-compact/…`, `components/shared/disclosure/…` (sobre `lib/motion/disclosure.ts`), `lib/audience.ts` (`resolveAudience(search, session): 'business'|'company'`) + test, `components/contact/contact-form/contact-form.test.tsx`, `components/contact/cal-embed/cal-embed.test.tsx`, `e2e/contact.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/audience.test.ts
import { it, expect } from 'vitest';
import { resolveAudience } from './audience';
it('?via wins, then session memory, then business by default', () => {
  expect(resolveAudience('?via=empresa', null)).toBe('company'); expect(resolveAudience('', 'company')).toBe('company'); expect(resolveAudience('', null)).toBe('business');
});
```
```tsx
// apps/web/components/contact/contact-form/contact-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { ContactForm } from '.';
it('shows mailto and WhatsApp fallback when the gateway is down', async () => {
  const action = vi.fn().mockResolvedValue({ error: 'gateway_down' });
  render(<ContactForm action={action} email="hola@josecoded.com" whatsapp="34600000000" locale="es" />);
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Marta' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'm@x.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Enviar/ }));
  await waitFor(() => expect(screen.getByRole('link', { name: /hola@josecoded.com/ }).getAttribute('href')).toMatch(/^mailto:/));
});
```
```tsx
// apps/web/components/contact/cal-embed/cal-embed.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
vi.mock('@calcom/embed-react', () => ({ default: () => <div data-testid="cal-inline" />, getCalApi: async () => vi.fn() }));
import { CalEmbed } from '.';
it('does not load Cal until the user asks for it', async () => {
  render(<CalEmbed calLink="josecoded/20min" origin="contact" />);
  expect(screen.queryByTestId('cal-inline')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Reservar 20 min/ }));
  expect(await screen.findByTestId('cal-inline')).toBeTruthy();
});
```
- [ ] 2. → FAIL. 3. Implementar; eventos `contact_submit {via}` y `booking_open {origin:'contact'}`; E2E: contacto crea lead `web_form` con `locale` (Supabase local), `contact_submit` interceptado, `/en/contact?via=company` abre en empresa. 4. → PASS; `web-design-guidelines`; `visual`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): contact page with audience selector, contact form to gateway, lazy Cal embed, copy field and compact closing"`.

**Hecho cuando:** E2E en verde; sin `{{DATO}}` de WhatsApp el botón no aparece y el formulario es la primaria; `ClosingCompact` se usa en 3.2–3.5 sin copy nuevo.

### Tarea 3.11 — Web: webhook de Cal.com, `call_booked` y captura de afiliado (`RefCapture`, `RefNotice`)

**Agente:** implementador-web · **Rama:** `feat/generator-leads` · **Gate:** no · **Depende de:** 3.8

> **v2.1 (eng review):** (a) **`RefNotice` con aceptación explícita** («Aceptar» escribe la cookie `ref` de 30 días; «Ahora no» deja el código en `sessionStorage.ref` para esa sesión y no vuelve a preguntar); `captureRef` devuelve `{ pending: code }` y la cookie solo se escribe desde la acción de aceptar; test: sin aceptar no hay `Set-Cookie`; (b) Cal.com: **un solo campo `ref`** (metadata del embed → `responses.ref`; se elimina `notes`); `BOOKING_CANCELLED` y `BOOKING_RESCHEDULED` actualizan `leads.meta.calcom` sin crear lead; `idempotency_key = calcom:<uid>`; `call_booked` deduplicado por `uid`.

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
  expect(captureRef('?ref=ANA-3B7K2Q', undefined)).toEqual({ set:'ANA-3B7K2Q', notice:true });
  expect(captureRef('?ref=BOB-7F2KX9', 'ANA-3B7K2Q')).toEqual({ notice:false });
  expect(captureRef('?ref=<script>', undefined)).toEqual({ notice:false });
});
```
- [ ] 2. → FAIL. 3. Implementar; `RefCapture` consulta `GET /affiliates/validate` antes de escribir la cookie (`SameSite=Lax`, 30 días, `Secure` en https); el RH del webhook usa `await req.text()`, cabecera `x-cal-signature-256`, `attendees[0]`, `responses.notes`, `metadata.ref` → `affiliateCode`. E2E de DT §8.2 "Afiliado" (visita con `?ref=ANA-TEST01` → `RefNotice` → contacto → lead con `affiliate_code`; segundo `?ref` no sobrescribe; autoreferido marcado). 4. → PASS. 5. Commit: `git commit -m "feat(web): Cal.com webhook to gateway lead, call_booked event and affiliate ref capture"`.

**Hecho cuando:** tests y E2E en verde; el RH responde 401 con firma inválida.

### Tarea 3.12 — **GATE**: secretos, KV, Turnstile, Cal.com y Edge Function en producción

**Agente:** controlador (con OK de Jose); `implementador-web` prepara el checklist · **Gate:** **SÍ** · **Depende de:** 3.7–3.11 mergeadas o listas en la rama

> **v3.2:** sin `supabase functions deploy` ni `vault`. El SMTP de Auth, «Confirm email», OAuth, Turnstile en Auth y MFA ya se configuraron en **1.9**; aquí solo Turnstile de la web, Cal.com, KV/rate limiters y Email Routing (Q18).

> **v2.1 (eng review):** se adelantan a este gate: **alta de `api.josecoded.com`** como custom domain del gateway y `NEXT_PUBLIC_JOSECODED_API_URL` (antes en 9.4), **rotación del token de Telegram y de la key de Resend** (antes en 9.4), **SMTP propio en Supabase Auth** (`cuenta@josecoded.com`; insumo de Jose) y `AI_GATEWAY_ID` (AI Gateway creado en el dashboard con los presupuestos por consumidor de DT §0b). Los secretos van al Worker de producción **y** a `josecoded-api-preview` con valores distintos. Tras el deploy, el smoke de `v1`, `forum` y `admin-chat` (1.9).

**Pasos (cada uno con OK explícito de Jose en la sesión):**
- [ ] 1. Jose crea el widget Turnstile (dominios `josecoded.com`, `*.workers.dev`, `localhost`) y la cuenta Cal.com con el evento "20 min" y el webhook `BOOKING_CREATED` apuntando a `https://josecoded.com/api/webhooks/calcom` (la URL existirá al lanzar; hasta entonces, a la preview).
- [ ] 2. Crear el AI Gateway en el dashboard (`AI_GATEWAY_ID`) con los presupuestos por consumidor de DT §0b; alta de `api.josecoded.com`; rotar el token de Telegram y la key de Resend; SMTP propio en Supabase Auth (v2.1; sin `QUOTA_KV`).
- [ ] 3. `wrangler secret put` en `josecoded-api`: `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `NOTIFY_SHARED_SECRET` (mismo valor que `vault.notify_shared_secret`); en `josecoded-web`: `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `CALCOM_WEBHOOK_SECRET`. Vars públicas en ambos `wrangler.jsonc`.
- [ ] 4. `supabase functions deploy notify` (si no se hizo en 1.9) y `ADMIN_NOTIFY_EMAIL` en el env de la función (opcional, P8).
- [ ] 5. Anotar en `ESTADO.md` qué se configuró (nombres, nunca valores).

**Hecho cuando:** en la preview del PR, el generador y el contacto crean leads reales en Supabase y Jose recibe el Telegram en < 1 min (spec §10).

**Cierre de `feat/generator-leads`:** `revisor`; `/puerta-calidad` completa (Marta en generador y contacto; `revisor-seguridad` en Turnstile, `SERVER_KEY`, HMAC, cuotas, cookie `ref`); merge.

### Tarea 3.13 — Componentes compartidos de las páginas interiores y prototipo de P1 validado por Jose

> **v3.0:** el prototipo que `ui` hace en `ref/` es el de **P20 `/servicios`** (`ref/servicios/`), no P1; incluye `WayNav`, `WaySection`, `PackCompare` de cinco con `PackOption` y `HiringCard`. Los componentes compartidos añaden `QuickContact` (lo usan `/partners`, `/contacto` y el chat) y `CopyButton`. Lo demás igual.

**Agente:** `ux` (shape + wireframe) → `usuario-ejemplo` → `ui` (prototipo) → **Jose** → implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 2.10, 2.14, 2.16 (`Closing`), 2.13 · **Insumos:** PANT §2 («componentes nuevos compartidos»), §0 (lenguaje de las interiores), §8 (siguiente paso); INV §2 (reutilización fuera de la home)

> **v2.1 (eng review):** **alcance reducido (hallazgo 40)**: `ui` prototipa **solo P1 Negocios y P3 Contacto** (`ref/negocios/`, `ref/contacto/`); `ux` hace shape y wireframe de todas las pantallas; los componentes compartidos se construyen igual y sirven a las pantallas sin prototipo. Añadir a `deviations.json` cualquier desvío aceptado.

**Objetivo:** fijar el lenguaje de las páginas interiores con la primera pantalla (P1 Negocios) **antes de escribir su código**, y construir una sola vez los componentes que comparten todas: `PageHead` (cabecera de página interior con titular a dos tonos, párrafo citable y acciones), `FAQ` (acordeón nativo `<details>` con `FAQPage`), `ProcessSteps`, `EmptyState`, `ErrorState`, `Skeleton`, `Toast` (propio, sin Sonner: dependencia fuera del plan), `StatusBadge`, `Prose` (cuerpo MDX con los estilos del blog), `Toc`, `ErrorPage`, y la variante `Scene` sin `fill` + `Bento` en modo operar (sin `CursorLight`).

**Pasos:**
- [x] 1. `ux`: `/impeccable shape` de P1 y wireframe en `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` (anexo) o documento propio; `usuario-ejemplo` recorre P1, P3 y P2 como Marta y P4, P7 y P6 como Dani sobre los wireframes.
- [ ] 2. `ui`: prototipo `docs/superpowers/design/ref/negocios/index.html` (+ CSS con los mismos tokens de `design.json`; sin literales nuevos, o se añaden a `design.json`) con el sistema v6; capturas a 360/900/1440.
- [ ] 3. **Jose valida el prototipo en el navegador** (`http://localhost:8765/negocios/`). Sin su OK no se construye nada de la fase 3. Decisiones de Jose anotadas en `ESTADO.md`.
- [ ] 4. Tests que fallan (solo comportamiento): `faq.test.tsx` (un `<details>` por pregunta, `FAQPage` JSON-LD con las mismas preguntas), `toast.test.tsx` (aparece, se cierra sola con temporizador falso y por Esc, `role="status"`), `toc.test.tsx` (lista los `h2`/`h3` con anclas).
- [ ] 5. → FAIL. 6. Implementar en `components/shared/{page-head,faq,process-steps,empty-state,error-state,skeleton,toast,status-badge,prose,toc,error-page}/…` como CSS Modules con tokens, portando 1:1 el prototipo de `ui`. 7. → PASS; stylelint; `web-design-guidelines`; añadir los objetivos a `e2e/visual/targets.ts`.
- [ ] 8. Commit: `git commit -m "feat(web): shared interior components (page head, faq, steps, states, toast, prose, toc, error page) from the validated business prototype"`.

**Hecho cuando:** Jose ha aprobado el prototipo de P1 en el navegador, los tests pasan y `pnpm --filter web visual` incluye P1.

### Tarea 3.14 — CV maestro es/en → PDF descargable (`public/cv/`) compartido con Radar

**Agente:** implementador-web · **Rama:** `feat/public-pages` · **Gate:** no · **Depende de:** 3.13, 7.1 (`packages/radar-core/content/cv.master.{es,en}.md` con ids de sección; si 7.1 no ha llegado, esta tarea crea la plantilla en el mismo sitio y 7.1 la adopta) · **Insumos:** CV maestro de Jose es/en (Q15); qué entra del stack y certificaciones (PANT §3.1)

> **v2.1 (eng review):** (a) convención única del CV maestro: **`<!-- id: stack -->`, `<!-- id: formacion -->`, `<!-- id: experiencia -->`** (comentarios HTML); (b) **un solo analizador `loadCvMaster()` en `packages/radar-core/src/cv/load.ts`** (7.1 lo adopta; si 7.1 no existe aún, esta tarea lo crea allí con su test); (c) `packages/radar-core/cv/cv.css` compartido por este PDF y los de Radar; (d) **lista cerrada de campos públicos** (`PUBLIC_CV_FIELDS = ['name','email','linkedin','github']`) con test de que el PDF público no contiene teléfono, dirección ni NIF; (e) `X-Robots-Tag: noindex` para `/cv/*.pdf` (`_headers` de OpenNext) con test E2E.

**Objetivo:** una sola fuente de verdad (el CV maestro de Radar) para la sección «Stack y formación» (3.5), el PDF descargable y los materiales de Radar (7.21). Script de build que renderiza `cv.master.{es,en}.md` a HTML con los tokens (versión imprimible, A4) y a PDF con Playwright Chromium headless en el Mac/CI → `apps/web/public/cv/jose-carlos-sanchez.{es,en}.pdf` (commiteados; ≤ 300 KB) y `content/generated/cv-index.json` (secciones stack y formación para 3.5). Sin CV maestro real, se genera desde la plantilla con `{{DATO}}` y **no se publica** (el enlace de 3.2, 3.5 y la home no se renderiza).

**Ficheros:** `apps/web/scripts/cv.ts` (`pnpm --filter web cv:build`), `apps/web/scripts/cv.test.ts`, `apps/web/content/generated/cv-index.json`, `apps/web/public/cv/*.pdf`, `apps/web/lib/content/cv.ts` (`getCv(locale)` con zod; `hasDato` por sección).

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/scripts/cv.test.ts
import { it, expect } from 'vitest';
import { parseMasterCv } from './cv';
it('extracts stack groups and credentials by section id and flags pending facts', () => {
  const md = '## stack {#stack}\n### Móvil\n- React Native\n## formacion {#formacion}\n- ITIL 4 · {{DATO: año}}\n';
  const cv = parseMasterCv(md);
  expect(cv.stack.mobile).toEqual(['React Native']); expect(cv.credentials[0].pending).toBe(true); expect(cv.publishable).toBe(false);
});
```
- [ ] 2. → FAIL. 3. Implementar (`gray-matter` + parser por `{#id}`; HTML imprimible con `tokens.css`; PDF con `page.pdf({ format:'A4', printBackground:true })`; `publishable=false` si hay `{{DATO}}` → no se escribe el PDF). 4. → PASS; `pnpm --filter web cv:build` con el maestro real cuando exista. 5. Commit: `git commit -m "feat(web): CV PDFs and stack index generated from the Radar master CV"`.

**Hecho cuando:** `cv-index.json` alimenta 3.5, los PDF existen en los dos idiomas (o no se publican) y Radar 7.21 lee el mismo fichero.

**Cierre de `feat/public-pages`:** `revisor`; `/puerta-calidad` completa con Marta (Negocios) y Dani (Empresas, Proyectos, Sobre mí); `ui` sobre el diff de capturas de cada pantalla; **Jose aprueba la preview**; merge.

---
## Fase 4 — Auth, blog MDX (guías) + comentarios, `/lab`, chat por casos · Estimación L · ramas `feat/auth-blog-lab` (4.1, 4.2, 4.3, 4.5) y `feat/assistant-chat` (4.4) · **v3.0**

Pantallas: PANT P9–P15, P17 y UX v4.0 §5, §4.7–4.8, §4.11, §4.13, §9.4–9.6, §10.4. Componentes nuevos de PANT §2 (`AuthCard`, `AuthProviders`, `OtpInput`, `Banner`, `ChatThread`, `ChatComposer`, `StatusBand`, `AuthGateCard`, `MeetingSheet`, `CodeBlock`, `ReadingProgress`, `ShareRow`, `CommentThread`, `LoadMore`, `AccountCard`, `ConfirmDialog`) con el sistema v6; cada pantalla con prototipo de `ui` validado por Jose, `visual`, `i18n:check` y **todo bilingüe** (OTP y auth en es/en).

### Tarea 4.1 — Auth con `@supabase/ssr`: guards, login/registro/OTP, callback, perfil

**Agente:** implementador-web · **Gate:** no · **Depende de:** 2.3, **1.9** · **Insumos de Jose (para la prueba manual, no para los tests):** OAuth Google/GitHub en Supabase, plantilla OTP con `{{ .Token }}`, leaked password protection (DT P9)

> **v3.2 (DATOS §8.1):** login **sin contraseña** para visitantes (Google, GitHub, OTP por email de 6 dígitos / magic link; Q4): sin pantalla de registro con contraseña ni recuperación. `user_profiles` la crea el trigger `handle_new_user()` (la web no inserta; solo `update` de `first_audience` write-once y `locale`). `requireAdmin()` exige `staff_members.role = 'admin'` **y** `aal2` (TOTP, Q3): si el admin no tiene factor verificado, redirige a `/perfil/seguridad` para enrolarlo; `/perfil` incluye enrolar/quitar TOTP (`supabase.auth.mfa`). Los E2E leen el OTP de `http://127.0.0.1:54324` (Inbucket local) en vez de usar contraseña; las cuatro cuentas del seed conservan contraseña solo para los tests RLS.

> **v2.1 (eng review):** (a) plantillas de Supabase Auth (confirmación, OTP, recuperación) en es y en con el remitente **`cuenta@josecoded.com`** (SMTP propio configurado en 1.9/3.12; en local, Inbucket/Mailpit); (b) `ensureProfile` = `insert … on conflict do nothing` + `update … where first_audience is null`; la señal por `contact_email` solo cuenta con email confirmado (lo garantiza `area_lead_summary`); (c) **E2E de login por OTP leyendo el código del buzón local** (`http://127.0.0.1:54324`) y E2E de la señal de origen de extremo a extremo (`/negocios` → registro → `/area-clientes` con `PackStrip`).

**Objetivo:** una cuenta de visitante para chat, comentarios y área; guards sin middleware (DT §1.7); email por código OTP de 6 cifras (UX §5.3); **v2.0:** el callback y las SA de login registran la **señal de origen del área** (DT §1.12): si hay cookie `ref` → `first_audience='referral'`; si no, `sessionStorage.audience` enviada en `next`/`?audience=` → `business`/`company`/`blog`; solo si la fila de `user_profiles` no tiene valor (write-once).

**Ficheros:**
- Crear: `lib/area/profile.ts` (`ensureProfile(userId, signal)`: upsert de `user_profiles` respetando write-once), `lib/area/profile.test.ts`, `lib/supabase/{server,browser,route}.ts` (`createServerClient` con `cookies()`; `createBrowserClient`), `lib/auth/guards.ts` (`requireUser(): Promise<Session>` → `redirect('/auth/login?next=…')`; `requireAdmin(): Promise<Session>` → `notFound()` si `staff_members.role !== 'admin'`), `lib/auth/guards.test.ts`, `lib/auth/next-param.ts` (`safeNext(next)`: solo rutas internas relativas), `lib/auth/next-param.test.ts`, `app/[locale]/(public)/auth/{login,registro,codigo}/page.tsx`, `app/[locale]/(public)/auth/actions.ts` (`signInWithOtp`, `verifyOtp`, `signOut`, `claimClientAccess` tras login: `rpc('claim_client_access')`), `app/api/auth/callback/route.ts` (intercambia `code`, `redirect(safeNext(next))`), `app/[locale]/(public)/perfil/page.tsx`, `components/auth/{auth-providers,otp-form}.tsx`, `e2e/auth.spec.ts`.
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

> **v3.0 (D44):** los artículos son **guías técnicas largas** (`schema.ts` añade `kind: 'guide'|'note'`, `readingMinutes`, `labSlug?`); JSON-LD `TechArticle` (con `proficiencyLevel`) además de `BlogPosting`; al pie del artículo, «Probar la demo →» si `labSlug` y el botón **«Avísame de nuevas guías»** (formulario de solo email + Turnstile → `POST /leads` con `source:'web_notify'` → contacto `kind='other'`, `tags=['newsletter_interest']`; sin Brevo ni doble opt-in: es un contacto del CRM, no una lista de envío). La regla de 3 artículos (D33) cuenta solo `kind='guide'`. `navLabel()` de 4.5 decide la etiqueta de cabecera.

**Agente:** implementador-web · **Gate:** no · **Depende de:** 2.11, 2.1

> **v2.1 (eng review):** (a) **un único `content/blog/schema.ts`** valida tanto el frontmatter YAML de `.md` (`gray-matter`) como el `export const metadata` de `.mdx`; el `import()` por slug resuelve **las dos extensiones**; test de `content-index` con un `.md` de fixture; (b) el YAML del frontmatter se serializa y parsea con la librería `yaml` (nunca a mano); (c) los números de la newsletter cuentan para `blogEnabled`.

**Objetivo:** blog compilado en build con `@next/mdx` (DT §1.5), artículos en `content/blog/{es,en}/<slug>.mdx` (y `.md` puro para los que genere la newsletter, fase 10) con `export const metadata` validada por zod, índice en `prebuild`, RSS (`app/feed.xml/route.ts`), `llms-full.txt` con el contenido. **v2.0, regla de los 3 artículos (spec D33):** `content-index.ts` calcula `blogEnabled = artículos reales (sin {{DATO}}) ≥ 3` por sitio (no por idioma); con `false`, `/blog` y `/blog/[slug]` responden 404, y `NavLinks`, `MobileMenu`, `CommandPalette`, `SiteFooter` y la escena Blog de la home (2.15) omiten el blog. Artículos en un solo idioma marcados «Solo en inglés» / «Only in Spanish».

**Ficheros:** `next.config.ts` (`withMDX`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `rehype-pretty-code`), `mdx-components.tsx`, `content/blog/es/como-esta-hecha-esta-web.mdx` (primer artículo real: arquitectura, hero, Radar en una frase; lo redacta `redactor` o Jose; sin él, el listado queda vacío y el bloque de la home no se renderiza), `content/blog/schema.ts`, `scripts/content-index.ts` (completar: `blog-index.json` con `slug, locale, title, description, date, tags, readingTime, hasTranslation`), `app/[locale]/(public)/blog/page.tsx`, `app/[locale]/(public)/blog/[slug]/page.tsx` (`import()` dinámico por slug; `generateStaticParams`), `app/feed.xml/route.ts`, `components/blog/{post-card,post-header,toc}.tsx`, tests `scripts/content-index.test.ts` (ampliar), `e2e/blog.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/scripts/content-index.test.ts (añadir)
import { it, expect } from 'vitest';
import { buildBlogIndex } from './content-index';
it('enables the blog only with three real posts', async () => {
  const p = (d: string) => ({ title:'t', description:'d', date:d });
  expect((await buildBlogIndex({ es: { a:p('2026-09-20'), b:p('2026-09-21') }, en: {} })).blogEnabled).toBe(false);
  expect((await buildBlogIndex({ es: { a:p('2026-09-20'), b:p('2026-09-21') }, en: { c:p('2026-09-22') } })).blogEnabled).toBe(true);
  expect((await buildBlogIndex({ es: { a:p('2026-09-20'), b:p('2026-09-21'), c:{ title:'{{DATO: título}}', description:'d', date:'2026-09-22' } }, en: {} })).blogEnabled).toBe(false);
});
it('marks hasTranslation only when the same slug exists in both locales', async () => {
  const idx = await buildBlogIndex({ es: { 'a': { title:'A', description:'d', date:'2026-09-20' }, 'solo-es': { title:'S', description:'d', date:'2026-09-21' } }, en: { 'a': { title:'A', description:'d', date:'2026-09-20' } } });
  expect(idx.find(p => p.slug === 'a' && p.locale === 'es')?.hasTranslation).toBe(true);
  expect(idx.find(p => p.slug === 'solo-es')?.hasTranslation).toBe(false);
  expect(idx.posts.map(p => p.slug)).toEqual(['solo-es', 'a', 'a']); // más reciente primero
});
```
- [ ] 2. → FAIL. 3. Implementar; artículo con `BlogPosting` JSON-LD (`author.name` = nombre a mostrar), `pageMetadata({ hasTranslation })`, `Prose` + `Toc` + `ReadingProgress` + `ShareRow` + `ClosingCompact`. E2E: con 3 artículos de seed, `/blog/<slug>` tiene JSON-LD `BlogPosting` y `/feed.xml` es RSS válido; con 2, `/blog` → 404 y la cabecera no muestra «Blog». 4. → PASS; `visual`; `i18n:check`; aprobación de Jose en preview. 5. Commit: `git commit -m "feat(web): MDX blog compiled at build with index, RSS, BlogPosting JSON-LD and the three-posts rule"`.

**Hecho cuando:** el worker **no** contiene el compilador MDX (grep `compile` de `@mdx-js` en `.open-next/worker.js` vacío) y el tamaño sigue < 2,5 MiB.

### Tarea 4.3 — Comentarios con cola de aprobación

**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 4.2, 1.8a

> **v3.2:** columnas `post_slug`, `status` (`comment_status`), `author_name` del perfil; el aviso a Jose sale del outbox (`comment.pending`, trigger de 1.8a), no de una SA.

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

### Tarea 4.4 — Chat por casos sin cuenta: gateway `assistant/*` + web `/chat` (v3.0; D39, D40)

**Agente:** implementador-web · **Rama:** `feat/assistant-chat` · **Gate:** no (secretos y Turnstile reales en 3.12, ya hechos) · **Depende de:** **1.9** (tablas `chat_*` en producción; en local, **1.8b**), **1.8c** (adaptador Supabase, `CHAT_SID_SECRET`), 1.7 (`buildDeps`, rate limiters), 3.7 (`verifyTurnstile`, `increment_quota`, AI Gateway, guarda determinista), 3.10 (`QuickContact` de 3.3, Turnstile en cliente), 4.1 (opcional: asociar hilo a `user_id`) · **Insumos:** PANT v2.0 P11; copy del `CaseSelector` y de `QuotaNotice` (es/en, `redactor`); **contexto inicial por caso** (si no existe, seed con `{{DATO}}` en dev; en producción, el caso sin contexto publicado usa `curious`)

> Las rutas heredadas `admin-chat/*` **no se tocan ni se usan** (quedan como `forum/*`). `knowledge.json` deja de ser fuente del prompt: el contexto sale de `chat_context_published(case, locale)` (1.11). Puertos y adaptadores como 3.7: `ChatThreadsRepo`, `ChatContextsRepo`, `Ai`, `Turnstile`, `Quota`, `Notify` en `@josecoded/types/api.ts`; servicio `createAssistantService(deps)` testeado con falsas en memoria.

**Objetivo (gateway):** módulo `apps/api/src/modules/assistant.routes.ts` montado en `/api/v1/assistant` (añadir a `routes-manifest`): `POST /threads` (body `{ case, locale, originPath, turnstileToken }`: Turnstile → `increment_quota('chat:<ymd>:ip:<sha256(ip)>', 20, 86400)` → `increment_quota('chat:<ymd>:all', 500, 86400)` → crea `chat_threads` con `visitor_id` nuevo → `Set-Cookie: chat_sid=<visitor_id>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` → 201 `{ threadId, case, contextVersion }`); `GET /threads/current` (por cookie o JWT; devuelve hilo + mensajes); `POST /threads/:id/messages` (cookie o JWT propietaria del hilo; `nativeRateLimit` 10/min por `visitor_id` (binding 1004) + cuota por IP; guarda el mensaje `visitor`; si `ai_enabled`: contexto publicado del `case`/`locale` (caché 5 min por `(case, locale)`; si no hay, el de `curious` y `metadata.context_fallback=true`) → prompt del sistema = `body_md` + `facts` + reglas (idioma, sin precios fuera de `pricing`, sin URLs fuera de `facts.links`, ofrecer `quick_contact` si el visitante pide hablar con Jose) → `env.AI.run` vía AI Gateway `consumer:'assistant'` → **guarda determinista** (reutiliza la de 3.7: precios, URLs, «gratis», idioma) → guarda `assistant` y devuelve ambos; si la guarda rechaza, respuesta fija «te lo cuenta Jose» + `quick_contact`; si `ai_enabled=false`: solo guarda y `notify` agrupado a Jose); `POST /threads/:id/case` (cambia `case`, mensaje de sistema `case_switch`); `POST /threads/:id/claim` (JWT: `user_id` al hilo si estaba anónimo y la cookie coincide); `POST /threads/:id/quick-contact` (body `{ channel, name?, email?, phone? }`: crea o actualiza `crm_contacts` (`kind` por `case`: client→`lead`, partner→`agency`, recruiter→`recruiter`, curious→`other`) + `crm_interactions(kind='chat_thread')` + `chat_threads.contact_id`; `notify` `lead.created` si hay email o teléfono). Admin (JWT admin, `requireAdminJwt` del gateway): `GET /admin/threads?unread=1`, `GET /admin/threads/:id`, `POST /admin/threads/:id/messages` (`sender_role='jose'`, `ai_enabled=false` automático, `status='handed_over'`), `POST /admin/threads/:id/ai` (`{ enabled }`), `POST /admin/threads/:id/read`. Avisos Telegram agrupados: uno por hilo cada 10 min (`increment_quota('chatnotify:<thread>', 1, 600)`).

**Objetivo (web):** `app/[locale]/(public)/chat/page.tsx` **sin `requireUser`**: `CaseSelector` («¿Quién eres?», 4 opciones; preselección por `?case` o por `sessionStorage.audience`; cambiable), `ChatThread` (`ChatBubble`), `ChatComposer` (Turnstile invisible en el primer envío; después no), `QuotaNotice` (429 → texto amable + `QuickContact`), `SaveThreadHint` (login opcional; tras login, `claim`), banda «Jose ha entrado» cuando `ai_enabled` pasa a false (realtime en `chat_messages` solo si hay sesión —RLS—; sin sesión, sondeo cada 8 s mientras la pestaña está visible). `QuickContact` aparece cuando el asistente devuelve `message_type='quick_contact'` o tras 3 intercambios. Evento Umami `chat_started {case}` y `chat_case_switch`.

**Ficheros:** gateway: `apps/api/src/modules/assistant.routes.ts`, `apps/api/src/services/assistant.service.ts` (+ `.test.ts`), `apps/api/src/adapters/{chat-threads.supabase,chat-contexts.supabase}.adapter.ts`, `apps/api/src/schemas/assistant.schema.ts` (zod), `apps/api/src/routes-manifest.ts`, `apps/api/src/utils/ai-guard.ts` (si no está ya exportado por 3.7), `apps/api/test/fakes/{chat-threads,chat-contexts}.fake.ts`; web: `app/[locale]/(public)/chat/page.tsx`, `components/chat/{case-selector,thread,composer,quota-notice,save-thread-hint,handover-band}/…`, `lib/chat/api.ts` (`createThread`, `getCurrent`, `postMessage`, `switchCase`, `claim`, `quickContact`), `lib/chat/poll.ts` (sondeo con `visibilitychange`), `messages/*.json` (`chat.*`), `e2e/chat.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/api/src/services/assistant.service.test.ts
import { describe, it, expect } from 'vitest';
import { createAssistantService } from './assistant.service';
import { fakeDeps } from '../../test/fakes/assistant.fakes';
describe('assistant service', () => {
  it('uses the published context of the thread case and locale, never knowledge.json', async () => {
    const deps = fakeDeps({ contexts: { 'partner:es': { version: 3, body_md: 'Marca blanca sí. NDA sí.', facts: { links: {} } } } });
    const svc = createAssistantService(deps); const t = await svc.createThread({ case:'partner', locale:'es', ip:'1.1.1.1', originPath:'/partners' });
    await svc.postMessage({ threadId: t.id, visitorId: t.visitorId, content: '¿Firmas NDA?' });
    expect(deps.ai.lastPrompt).toContain('Marca blanca sí. NDA sí.'); expect(deps.ai.lastPrompt).not.toContain('Jose Dev');
    expect(t.contextVersion).toBe(3);
  });
  it('falls back to the curious context and flags it when the case has no published context', async () => {
    const deps = fakeDeps({ contexts: { 'curious:es': { version: 1, body_md: 'Soy Jose.', facts: {} } } });
    const svc = createAssistantService(deps); const t = await svc.createThread({ case:'recruiter', locale:'es', ip:'1.1.1.1', originPath:'/servicios' });
    const r = await svc.postMessage({ threadId: t.id, visitorId: t.visitorId, content: 'hola' });
    expect(r.assistant.metadata.context_fallback).toBe(true); expect(deps.threads.rows[0].context_version).toBe(1);
  });
  it('quota: the 21st message of the day from the same ip is rejected with quota_exceeded', async () => {
    const deps = fakeDeps({ quotaLimitIp: 20 }); const svc = createAssistantService(deps); const t = await svc.createThread({ case:'client', locale:'es', ip:'2.2.2.2', originPath:'/' });
    for (let i = 0; i < 20; i++) await svc.postMessage({ threadId: t.id, visitorId: t.visitorId, content: `m${i}` });
    await expect(svc.postMessage({ threadId: t.id, visitorId: t.visitorId, content: 'm21' })).rejects.toMatchObject({ code: 'quota_exceeded' });
  });
  it('guard rejects a price not in pricing and answers with the fixed text + quick_contact', async () => {
    const deps = fakeDeps({ aiReply: 'Una web básica cuesta 700 €.' }); const svc = createAssistantService(deps); const t = await svc.createThread({ case:'client', locale:'es', ip:'3.3.3.3', originPath:'/' });
    const r = await svc.postMessage({ threadId: t.id, visitorId: t.visitorId, content: '¿precio?' });
    expect(r.assistant.content).not.toMatch(/700/); expect(r.assistant.message_type).toBe('quick_contact');
  });
  it('a visitor cannot read or post to another visitor thread; admin reply disables ai and marks handed_over', async () => {
    const deps = fakeDeps(); const svc = createAssistantService(deps); const t = await svc.createThread({ case:'client', locale:'es', ip:'4.4.4.4', originPath:'/' });
    await expect(svc.postMessage({ threadId: t.id, visitorId: 'other', content: 'x' })).rejects.toMatchObject({ code: 'forbidden' });
    await svc.adminReply({ threadId: t.id, content: 'Hola, soy Jose' }); expect(deps.threads.rows[0]).toMatchObject({ ai_enabled: false, status: 'handed_over' });
  });
  it('quick-contact creates a crm contact with the kind derived from the case and links the thread', async () => {
    const deps = fakeDeps(); const svc = createAssistantService(deps); const t = await svc.createThread({ case:'partner', locale:'es', ip:'5.5.5.5', originPath:'/partners' });
    await svc.quickContact({ threadId: t.id, visitorId: t.visitorId, channel:'email', name:'Nuria', email:'nuria@agencia.test' });
    expect(deps.crm.contacts[0]).toMatchObject({ kind:'agency', email:'nuria@agencia.test' }); expect(deps.threads.rows[0].contact_id).toBe(deps.crm.contacts[0].id);
  });
});
```
```ts
// apps/api/src/routes.contract.test.ts (añadir)
it('the new web never depends on admin-chat routes; assistant routes exist', () => {
  const keys = routes.map(r => `${r.method} ${r.path}`);
  expect(keys).toContain('POST /api/v1/assistant/threads'); expect(keys).toContain('POST /api/v1/assistant/threads/:id/messages'); expect(keys).toContain('GET /api/v1/admin-chat/thread'); // heredada intacta
});
```
```ts
// apps/web/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';
test('anonymous visitor chats after Turnstile, switches case, hits the quota notice and sees quick contact', async ({ page }) => {
  await page.goto('/chat?case=partner'); await expect(page.getByRole('radio', { name: /agencia/i })).toBeChecked();
  await page.getByRole('textbox').fill('¿Trabajas en marca blanca?'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('bubble-assistant').first()).toBeVisible(); // AI falsa en wrangler dev devuelve el contexto
  await page.getByRole('radio', { name: /contratando/i }).check(); await expect(page.getByText(/ahora hablamos como/i)).toBeVisible();
  // cuota: el helper de e2e fuerza PROPOSALS_DAILY_LIMIT equivalente a 2 para el chat
  await page.getByRole('textbox').fill('otra'); await page.keyboard.press('Enter'); await page.getByRole('textbox').fill('y otra'); await page.keyboard.press('Enter');
  await expect(page.getByTestId('quota-notice')).toBeVisible(); await expect(page.getByTestId('quick-contact')).toBeVisible();
});
test('admin takeover is visible to the visitor and no request hits admin-chat', async ({ page, context }) => { /* segunda pestaña con sesión de jose → /admin/crm/chat/[id] (6.6) → responder; en la primera aparece la banda y el mensaje; interceptar **/api/v1/admin-chat/** y afirmar 0 peticiones */ });
```
- [ ] 2. → FAIL. 3. Implementar (los tests heredados de `admin-chat` siguen en verde: no se toca). Evals manuales `evals/chat-cases.jsonl` (5 preguntas trampa por caso: precios, disponibilidad inventada, URLs externas, idioma cruzado) antes del merge. 4. → PASS; `web-design-guidelines`; axe en el E2E; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(api,web): case-based assistant chat without account over chat_* tables with published contexts, quotas and admin takeover"`.

**Hecho cuando:** E2E en verde en Chromium y WebKit; `revisor-seguridad` confirma que la cookie `chat_sid` es HttpOnly, que un `visitor_id` no lee otro hilo, que la cuota por IP y el tope global funcionan y que **ninguna ruta de la web nueva llama a `admin-chat/*`**; el admin (6.6) ve el hilo.

> **Seguridad (revisión del gateway):** el contenido del chat (visitante, IA y Jose) se pinta **siempre como texto plano** (nodos de texto de React; nunca `dangerouslySetInnerHTML`, Markdown ni autolinks): la guarda del gateway rechaza enlaces y HTML, pero el render es la segunda barrera.

### Tarea 4.4 (v2.2, superada) — Chat `/chat` con takeover (gateway `admin-chat/*`) y `knowledge.json` nuevo

> **Superada en v3.0 (D39, D40):** el chat no exige cuenta ni usa `admin-chat/*`; el contexto sale del CRM. `knowledge.json` se conserva en el repo para las rutas heredadas (sin consumidor) y su test de marca sigue en verde. Texto original por historial.


**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 1.7

> **v2.1 (eng review):** (a) el gateway añade a `admin-chat/*` **`nativeRateLimit` 10/min por `user_id`** (binding 1004) y **cuota diaria por usuario** con `increment_quota` (`chat:<yyyymmdd>:<user_id>`, 60); (b) `env.AI.run` con AI Gateway y `consumer:'chat'`; (c) **`admin-chat-assistant.service.ts`** se actualiza aquí (prompt «josecoded», `locale`, sin «Jose Dev») con sus tests heredados; (d) avisos de Telegram del chat **agrupados** (un mensaje por conversación cada 10 min); (e) evals manuales `evals/chat.jsonl` (15 preguntas trampa) antes del merge.

**Objetivo:** UX §4.11, §9.6 y PANT P11: hilo (`ChatThread` con `ChatBubble` de la home), `ChatComposer`, `MeetingSheet`, `StatusBand`, antesala `AuthGateCard` sin cuenta con dos o tres intercambios reales de ejemplo (`{{DATO}}`), respuestas por realtime en `admin_chat_messages`; **bilingüe**: el asistente responde en el idioma de la página (`locale` en el body; cambio aditivo del prompt); el gateway conserva el contrato y solo cambia, de forma aditiva, `knowledge.json` (perfil nuevo con los `{{DATO}}` resueltos, sin "Jose Dev") y el prompt de `ai-reply.ts` (DT §7.8).

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

### Tarea 4.5 — `/lab`: índice y fichas de demo con `DemoFrame`, regla de 2 demos y JSON-LD (v3.0; D44)

**Agente:** implementador-web · **Rama:** `feat/auth-blog-lab` · **Gate:** no · **Depende de:** 4.2 (pipeline de contenido, `content-index`, `Prose`, `Toc`, `CodeBlock`), 3.13, 2.11, 2.14/2.16 (`lib/motion/paging.ts`, `slide-marker.ts` como demos candidatas) · **Insumos:** **dos demos reales** elegidas por Jose (spec v2.0 §0.7) con nombre y texto corto es/en; PANT v2.0 P22–P23

**Objetivo:** `content/lab/<slug>/{meta.(es|en).md, demo.tsx}` validado por `content/lab/schema.ts` (zod: `title`, `summary`, `tags` (`motion|tools|ai|a11y`), `publishedAt`, `articleSlug?`, `bundleBudgetKb` 60); `content-index.ts` cuenta las demos reales (sin `{{DATO}}`) y exporta `labEnabled = count >= 2` (misma mecánica que `blogEnabled`); con `labEnabled=false`, `/lab` y `/lab/*` responden 404 y desaparecen de cabecera, menú, ⌘K, pie y escena Lab/Blog (la cabecera muestra «Lab/Blog», «Lab» o «Blog» según lo que exista; `navLabel()` en `lib/content/nav.ts` con test). Índice (`PageHead`, `SegmentedControl` de etiquetas, `DemoCard` con miniatura estática ≤ 20 KB generada en build por Playwright desde la propia demo); ficha (`DemoFrame`: isla cliente cargada con `next/dynamic` tras la interacción o el viewport, estado estático SSR sin JS, botón «Reiniciar», `prefers-reduced-motion` → estado final; `DemoMeta`; `Prose` con «Qué muestra» y «Cómo está hecho» + `CodeBlock`; «Léelo largo →» si `articleSlug`; relacionadas; cierre corto → `/servicios#proyecto`). JSON-LD `SoftwareSourceCode` + `TechArticle`. Presupuesto: cada chunk de demo ≤ 60 KB gz (test `check-lab-bundle` en CI, mismo patrón que `check-hero-bundle`). Sin WebGL (D16). `llms.txt` incluye las fichas.

**Ficheros:** `content/lab/schema.ts`, `content/lab/<slug>/…` (dos demos), `scripts/content-index.ts` (ampliar), `scripts/lab-thumbs.ts`, `scripts/check-lab-bundle.ts`, `lib/content/nav.ts` (+ `nav.test.ts`), `app/[locale]/(public)/lab/page.tsx`, `app/[locale]/(public)/lab/[slug]/page.tsx`, `components/lab/{demo-card,demo-frame,demo-meta}/…`, `messages/*.json` (`lab.*`), `e2e/lab.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/content/nav.test.ts
import { it, expect } from 'vitest';
import { navLabel, labEnabledFrom } from './nav';
it('lab needs two real demos', () => { expect(labEnabledFrom([{ real: true }, { real: false }])).toBe(false); expect(labEnabledFrom([{ real: true }, { real: true }])).toBe(true); });
it('header label follows what exists', () => {
  expect(navLabel({ blog: true, lab: true }, 'es')).toBe('Lab/Blog'); expect(navLabel({ blog: false, lab: true }, 'es')).toBe('Lab'); expect(navLabel({ blog: true, lab: false }, 'en')).toBe('Blog'); expect(navLabel({ blog: false, lab: false }, 'es')).toBeNull();
});
```
```ts
// apps/web/e2e/lab.spec.ts
import { test, expect } from '@playwright/test';
test('lab index lists demos, a demo page works without JS and the bundle budget holds', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false }); const page = await ctx.newPage();
  await page.goto('/lab'); await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1); const cards = page.getByTestId('demo-card'); expect(await cards.count()).toBeGreaterThanOrEqual(2);
  await cards.first().getByRole('link').click(); await expect(page.getByTestId('demo-frame')).toBeVisible(); // estado estático SSR
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents(); expect(ld.join('')).toContain('SoftwareSourceCode');
});
```
- [ ] 2. → FAIL. 3. Implementar; `pnpm --filter web check:lab-bundle` falla si una demo pasa de 60 KB gz. 4. → PASS; axe; `web-design-guidelines`; `i18n:check`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): lab index and demo pages with static fallback, bundle budget, two-demo rule and JSON-LD"`.

**Hecho cuando:** con una sola demo real, `/lab` responde 404 y «Lab» no aparece en la navegación (test de build); con dos, el índice y las fichas pasan Lighthouse móvil ≥ 90/95/100 y axe; cada demo ≤ 60 KB gz.

**Cierre de la fase 4:** `revisor` por rama; `/puerta-calidad` completa (Dani en blog y lab; **Nuria y Pablo en el chat por casos**; `revisor-seguridad` en `safeNext`, cookies de sesión y `chat_sid`, Turnstile de comentarios y del chat, cuotas, lista blanca de URLs del contexto); merge.

---

## Fase 5 — Área de clientes, afiliados y ampliaciones · Estimación M · rama `feat/client-area`

Pantallas: PANT A1–A7 y §1.4 (personalización automática), UX v4.0 §2.2, §6.1–6.7, §3.8, §9.7–9.8, §10.5. Componentes: `AppShell` (barra lateral en escritorio, barra inferior en móvil), `PhaseSteps`, `TaskRow`, `FileList` + `Uploader`, `UpgradeSummary`, `ReferralLink`, `ProposalSummary`, `BentoCell` en modo operar (sin `CursorLight`), `SlidingList`, `PackStrip`, `SegmentedControl`, `ChatBubble`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast` (3.13). **Todo el área en es y en** (spec D31). Prototipo de `ui` validado por Jose antes de 5.1.

### Tarea 5.1 — Shell del área, inicio del área y reclamar acceso

**Agente:** implementador-web · **Gate:** no · **Depende de:** 4.1, 1.8a

> **v3.2 (DATOS §4.4):** nombres en inglés: `clients.project_phase` (`kickoff|design|build|review|delivered|maintenance`), `packs`/`pack_options`/`extras` (`code` PK), `client_extras`, `client_tasks.status` (`pending|in_progress|done`); el cliente nunca recibe `notes_internal` (grant por columnas). `claim_client_access()` y `area_lead_summary()` como en DATOS §6. La señal `first_audience` admite los valores de D32 v2.0. Aplica a 5.2–5.5 (A2–A7) la tabla de equivalencias del changelog v3.2.

> **v2.1 (eng review):** `resolveAreaVariant` sin cambios; la señal «lead» solo llega si `area_lead_summary()` la devuelve (email confirmado). E2E de la señal de origen de extremo a extremo (4.1).

**Objetivo:** `app/[locale]/(private)/area-clientes/layout.tsx` (`requireUser`, `AppShell` con Mi proyecto · Tareas · Material · Pack · Recomiéndame; las de proyecto solo si `clients.user_id = auth.uid()`), y la **portada personalizada automáticamente** (spec D32, DT §1.12, PANT §1.4): `resolveAreaVariant({ client, lead, profile })` → `client` (proyecto: fase, «Te toca a ti», novedades, hablar con Jose) · `proposal` («Tu propuesta»: pack o app recomendada, precio «desde», estado, WhatsApp; desde `area_lead_summary()`) · `referral` (Recomiéndame arriba + «¿Quieres una web?») · `business` (`PackStrip` resumido, Pedir propuesta, WhatsApp) · `company` (CV PDF, Reservar 20 min, chat, proyectos destacados) · `blog` (vuelve al artículo) · `neutral` (dos puertas del mismo peso). **Nunca oculta** Recomiéndame, Mi cuenta ni la vía de contacto. `claimClientAccess` ya llamado en 4.1.

**Ficheros:** el layout, `app/[locale]/(private)/area-clientes/page.tsx`, `components/area/{app-shell,project-summary,proposal-summary,referral-first,business-first,company-first,neutral-home}/…`, `lib/area/audience.ts` (`resolveAreaVariant`), `lib/area/audience.test.ts`, `lib/area/queries.ts` (`getMyClient()`, `getMyLeadSummary()` → `rpc('area_lead_summary')`, `getMyProfile()`, `getMyTasks()`, …), `e2e/client-area.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla (una aserción por señal y por prioridad, spec §10):
```ts
// apps/web/lib/area/audience.test.ts
import { it, expect } from 'vitest';
import { resolveAreaVariant } from './audience';
const lead = { pack_code:'P2', price_from:1400, estado:'nuevo', created_at:'2026-09-30', is_app:false };
it.each([
  [{ client:{ id:'c' }, lead, profile:{ first_audience:'referral' } }, 'client'],
  [{ client:null, lead, profile:{ first_audience:'referral' } }, 'proposal'],
  [{ client:null, lead:null, profile:{ first_audience:'referral' } }, 'referral'],
  [{ client:null, lead:null, profile:{ first_audience:'business' } }, 'business'],
  [{ client:null, lead:null, profile:{ first_audience:'company' } }, 'company'],
  [{ client:null, lead:null, profile:{ first_audience:'blog' } }, 'blog'],
  [{ client:null, lead:null, profile:null }, 'neutral'],
])('%o → %s', (input, out) => expect(resolveAreaVariant(input as any)).toBe(out));
```
- [ ] 2. → FAIL. 3. Implementar; las tres variantes con copy nuevo (`proposal`, `company`, `neutral`) en es y en. E2E: Ana (cliente) ve su proyecto; Bob (registrado con `?ref`, seed) ve Recomiéndame arriba; un usuario nuevo creado desde `/negocios` ve `PackStrip`; los tres ven Mi cuenta y contacto; `/en/client-area` en inglés. 4. → PASS; `visual`; `i18n:check`; aprobación de Jose en preview. 5. Commit: `git commit -m "feat(web): client area shell and auto-personalized home by client, lead, referral and origin signals"`.

**Hecho cuando:** E2E en verde; URL directa de Ana desde Bob → 404 (RLS + `notFound`); ninguna variante oculta Recomiéndame, Mi cuenta ni contacto.

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

> **v3.4 (D54):** el nombre y el precio **del pack contratado** y de los extras del cliente se leen de las **tablas** (`packs`/`extras` con `select` para `authenticated`; `name` jsonb es/en), no del fichero publicado, para que un pack oculto o borrado desde D2 siga mostrándose a quien lo tiene; `lib/area/packs.ts` pasa de `pricing.packs.find` a una consulta cacheada por petición. El precio de la ampliación sigue saliendo de `request_upgrade()` (tablas, solo `active`). Las opciones de destino que se ofrecen son las `active and visible`.

**Agente:** implementador-web · **Gate:** no · **Depende de:** 5.1, 1.4

> **v2.1 (eng review):** la SA llama a la **RPC `request_upgrade(p_to_pack_code, p_extras)`** (1.8), que calcula el precio en la BD; la web muestra el precio con `computeUpgrade` y un test comprueba que ambos coinciden (1100 para P2→P3). No hay insert directo en `upgrade_requests`.

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

> **v2.1 (eng review):** `ensureAffiliate` permite **elegir el prefijo** (3–12 alfanuméricos; por defecto el nombre de pila normalizado con `suggestPrefix`) y el trigger genera el sufijo de 6; el enlace copiado lleva `?ref=<código>`; test del contrato único (1.4).

**Objetivo:** UX §6.7: SA `ensureAffiliate` (insert `affiliates` propio; el código lo genera el trigger), enlace `https://josecoded.com/?ref=CODIGO` con copiar (`referral_copy`), leads atribuidos desde `affiliate_leads_view` (estado y fecha, sin contacto), recompensas (`affiliate_rewards`: pendiente/abonada), explicación de las tres reglas desde `pricing.json`.

**Ficheros:** `.../recomiendame/page.tsx`, `.../recomiendame/actions.ts`, `components/area/{referral-link,referral-leads,rewards-list}.tsx`, `components/area/referral-link.test.tsx`, `e2e/client-area.spec.ts` (ampliar).

**Pasos:** 1. Test: `ReferralLink` muestra la URL con el código y al pulsar "Copiar" llama a `navigator.clipboard.writeText` y a `track('referral_copy')`. 2. FAIL. 3. Implementar. 4. PASS; E2E: Bob (no cliente) entra, obtiene código `BOB-TEST02`, ve su recompensa `pending` de seed. 5. Commit: `git commit -m "feat(web): referral program page with code, attributed leads and rewards"`.

**Cierre de la fase 5:** `revisor`; `/puerta-calidad` completa (`usuario-ejemplo` como cliente Ana y como afiliado Bob; `revisor-seguridad` sobre RLS y URLs firmadas); merge.

---
## Fase 6 — CRM en `/admin` · Estimación L+ · ramas `feat/crm` (6.1, 6.2, 6.7, 6.8, 6.9), `feat/admin-modules` (6.3, 6.4, 6.5), `feat/crm-chat` (6.6) · **v3.0 (D41, D42)**

> **v3.0:** el admin pasa a ser el **CRM propio** de Jose (spec v2.0 §0.5–§0.6; PANT v2.0 C1–C11). Solo español. Modo Operar con el sistema v6 (`Scene` sin `fill`, `Bento` sin `CursorLight`, tablas y hojas propias con CSS Modules, `Form`/`Field`, `Toast`, `StatusBadge`, `EmptyState` de 3.13). **`ui` prototipa el shell, la bandeja de contactos (C2) y el detalle (C3) en `ref/admin/`** y Jose lo valida antes de 6.2. Navegación: **Contactos · Chat · Clientes · Más**. Regla dura de la fase: **el CRM nunca envía mensajes** (Gmail solo borradores si hay OAuth —Q20: no en el lanzamiento—, LinkedIn solo copiar/abrir); test negativo global en 6.8. Leads heredados: viven dentro de Contactos (mapeo por `lead_id`); la bandeja de leads de v2.2 (6.2 antigua) queda absorbida. Depende de **1.12** (tablas en producción; en local 1.11), 4.1 (auth), 4.4 (hilos del chat).

### Tarea 6.1 — Layout del admin, guard, shell y Resumen `/admin`

**Agente:** implementador-web · **Rama:** `feat/crm` · **Gate:** no · **Depende de:** 4.1, 1.7, **1.9** (v3.2)

> **v3.3 (D51; PANT v2.1 K1, D-nav; DATOS §14):** se construyen **dos shells** sobre un mismo componente `StaffShell` (`components/staff/staff-shell.tsx`, navegación por rol): **`/crm`** (`app/[locale]/(staff)/crm/layout.tsx` con `requireStaff()` de 6.0: admin o closer activo, `aal2`; 404 en otro caso) con barra **Contactos · Clientes · Comisiones · Más** y **`/admin`** (`requireAdmin()`) con **Resumen · Clientes · Equipo · Más**. `/admin/crm/*` **no se crea**: las rutas C2–C8 viven en `/crm/*`. Resumen de `/crm` (K1): `crm_my_counters()` + `crm_team_counters()` en una `Promise.all`; Resumen de `/admin` (C1): `admin_counters()` con los 11 contadores (añade `stories_proposed`, `commissions_pending`, `imports_failed_24h`, `content_pending`). Prototipo `ref/crm/` de **6.0b** validado por Jose. E2E añade: `carla@test` entra en `/crm` y ve «Equipo» sin nombres; `/admin` con Carla → 404; `dani@test` (desactivado) → 404 en `/crm`. Commit: `feat(web): staff shell with role-aware navigation for /crm and /admin, closer and admin summaries`. Lo demás de la tarea no cambia.

> **v3.2:** `admin_counters()` ya trae los 7 contadores desde 1.8a; el guard del admin exige `aal2` (DATOS §8.1); `/admin` responde 404 si el usuario no está en `staff_members`.

> **v3.0:** navegación **Contactos · Chat · Clientes · Más** (Más: organizaciones, importar, contextos, afiliados, moderación, ampliaciones); Resumen con los contadores de `admin_counters()` ampliada en 1.11 (`contacts_due`, `chat_unread`, `agencies_replied`, más los cinco de v2.2); «Radar hoy» desaparece hasta la fase 7 (placeholder fuera). La primaria del Resumen es «Ver vencidas» → `/admin/crm/contactos?due=1`. Prototipo `ref/admin/` validado por Jose. El resto de la tarea (adenda v2.1: `React.cache()`, `Promise.all`, una llamada a la RPC por render; `adminFetch` con JWT) no cambia.

> **v2.1 (eng review):** Resumen con **`React.cache()`** por petición (`getSession`, `getAdminCounters`), **`Promise.all`** y la RPC **`admin_counters()`** (1.8) en una sola consulta; test: una llamada a la RPC por render.

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

### Tarea 6.2 — Contactos: bandeja, detalle, siguiente acción, historial, mapeo de leads heredados y «Cerrar cobrado» (v3.0)

**Agente:** implementador-web · **Rama:** `feat/crm` · **Gate:** no · **Depende de:** 6.1, **1.9**, 1.4, 3.8

> **v3.3 (D51; PANT v2.1 K2–K3; DATOS §14.1, §14.3, §14.4):** rutas **`/crm/contactos`** y **`/crm/contactos/[id]`** (no `/admin/crm/...`). La bandeja no filtra por dueño en código: **RLS** devuelve la cartera del closer o todo al admin; el admin tiene además `?owner=<id>|mine|unassigned` (`OwnerFilter`) y columna `OwnerBadge`. Detalle: cabecera con dueño y **«Reasignar a…»** (solo admin; SA `reassignContact` → `update crm_contacts set owner_id`; confirmación), **«Habilitar acceso al portal»** (`InviteAccessSheet`, compartida con 6.12: visible si existe `clients` sin `user_id`; SA `inviteClientAccess` → `rpc('invite_client_access', {p_client_id, p_email})`; estados «Sin invitar · Invitado el … · Con acceso»), pestaña **Historias** (lista de `client_user_stories` del cliente, lectura; la decisión se hace en 6.12). El **closer no ve «Cerrar cobrado»**: ve «Pedir cierre» (SA `requestClose` → `rpc('crm_request_close', {p_lead_id})`, RPC de 1.8e que en una transacción fija `next_action='Jose: cerrar cobrado'` y `next_action_at=now()` en el contacto, deja la interacción `note` y encola `lead.close_requested` → Telegram al admin). `statusesFor(kind, role)` excluye `won`/`active_client` para `closer` (test nuevo). Nuevo contacto manual: `owner_id` = el usuario actual si es closer (la RLS lo exige); admin puede elegir dueño. E2E añade: Carla no ve el contacto de Jose por URL directa (404); Carla reasignar → 42501 (la SA ni existe para ella: `requireAdmin` dentro); Jose reasigna el contacto de Dani a Carla y Carla lo ve. Commit: `feat(web): crm contacts for staff — owner scope, reassignment, portal access invite and close request`.

> **v3.2 (DATOS §4.3):** **no hay leads heredados que mapear** ni `crm_contacts_view`: un lead es una oportunidad (`leads.contact_id`) de un contacto y se lista dentro de C3. «Cerrar cobrado» llama a `admin_close_lead_paid(p_lead_id, p_amount, …)` (crea `client`, recompensa y pasa el contacto a `active_client`). Cambiar de estado exige `next_action_at` (trigger) y queda como interacción `status_change`. Columnas en inglés (`status`, `source`, `amount`, `owner_note`). · **Insumos:** PANT v2.0 C2–C3; prototipo `ref/admin/` (C2, C3) validado por Jose

> Sustituye a la bandeja de leads de la 6.2 v2.2: lo que hacía (filtros por `estado`/`fuente`, `ProposalCard`, lead manual, «Cerrar cobrado» con recompensa vía `admin_close_lead_paid`, «Reenviar aviso») vive ahora dentro del contacto de `kind='lead'`. `buildClosePaidArgs` y su test se mantienen tal cual.

**Objetivo:** `/admin/crm/contactos` (`ContactTable` densa sobre `crm_contacts_view`; filtros en URL `kind`, `status`, `due=1`, `q`; orden por `next_action_at` vencida primero; acciones en fila: cambiar estado (`StatusSheet` con los estados válidos **para ese `kind`**, exige fijar o confirmar la siguiente acción al cambiar), fijar siguiente acción (`NextActionField`: texto + fecha)); `/admin/crm/contactos/[id]` (cabecera con `kind`, estado, organización, LinkedIn/web/`notion_url`, email con `CopyButton`, WhatsApp si hay teléfono; **siguiente acción** editable arriba; `InteractionTimeline` sobre `crm_interactions` (+ hilos de chat enlazados, 6.6); si `lead_id`: `ProposalCard`, `monto`, «Cerrar cobrado» (modal de v2.2 → RPC `admin_close_lead_paid`; al cerrar, el contacto pasa a `kind='client'` y `client_id` se rellena desde la fila que crea el trigger heredado `on_lead_close`), «Reenviar aviso»; si `client_id`: enlace a `/admin/clientes/[id]`; pestaña **Mensajes** (6.8)); **nuevo contacto** manual (`?nuevo=1`: hoja con `kind`, nombre, organización (autocompletar o crear), email, teléfono, LinkedIn, estado inicial, siguiente acción; si `kind='lead'`, además crea el `lead` heredado con la SA `createManualLead` de v2.2 y lo enlaza); **mapeo perezoso**: al abrir un `lead` heredado sin contacto (histórico anterior a 3.8), la SA `ensureContactForLead(leadId)` lo crea; igual `ensureContactForClient(clientId)` desde la ficha de cliente (6.4). Server Actions con `requireAdmin()` en cada una.

**Ficheros:** `app/[locale]/(private)/admin/crm/contactos/page.tsx`, `.../contactos/[id]/page.tsx`, `.../contactos/actions.ts` (`createContact`, `updateContactStatus`, `setNextAction`, `addNote`, `ensureContactForLead`, `ensureContactForClient`, `closeLeadPaid`, `resendLeadNotification`), `components/admin/crm/{contact-table,status-sheet,next-action-field,interaction-timeline,new-contact-sheet,copy-button}/…`, `lib/crm/status.ts` (`statusesFor(kind)`, `canTransition(kind, from, to)`), `lib/crm/status.test.ts`, `lib/admin/close-paid.ts` (sin cambios), `e2e/admin-crm.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/crm/status.test.ts
import { it, expect } from 'vitest';
import { statusesFor, canTransition, requiresNextAction } from './status';
it('each kind has its own status set', () => {
  expect(statusesFor('agency')).toEqual(['pending','invited','inmail_sent','replied','meeting','collaborating','discarded']);
  expect(statusesFor('lead')).toContain('proposal_sent'); expect(statusesFor('recruiter')).toContain('interview');
});
it('terminal states need no next action; the rest do', () => {
  expect(requiresNextAction('agency','discarded')).toBe(false); expect(requiresNextAction('agency','replied')).toBe(true); expect(requiresNextAction('lead','won')).toBe(false);
});
it('cannot move an agency to a lead status', () => expect(canTransition('agency','pending','won')).toBe(false));
```
E2E (`admin-crm.spec.ts`): Jose abre `/admin/crm/contactos?due=1` → ve el contacto del seed con acción vencida en rojo; cambia la agencia de `pending` a `invited` → la hoja exige siguiente acción → la fija → aparece en el timeline como `status_change` con `from/to`; abre el lead heredado del seed sin contacto (helper que borra su `crm_contact`) → se crea al abrir; «Cerrar cobrado» con 1 400 y afiliada `standard` → recompensa 140 `pending` (como v2.2) **y** el contacto pasa a `kind='client'` con `client_id`.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; `web-design-guidelines`; capturas contra `ref/admin/`; **aprobación de Jose en preview**. 5. Commit: `git commit -m "feat(web): crm contacts inbox and detail with next action, timeline, legacy lead mapping and close-paid"`.

**Hecho cuando:** E2E en verde; en 390 px la tabla pasa a tarjetas y la barra tiene 4 destinos ≥ 44 px; `usuario-ejemplo` (Jose operador) encuentra «qué tengo que hacer hoy» en un clic.

### Tarea 6.2 (v2.2, superada) — Leads: bandeja, detalle, lead manual, cerrar cobrado + recompensa

> **Superada en v3.0:** absorbida por la 6.2 de arriba (los leads son contactos de `kind='lead'`). `buildClosePaidArgs` y su test siguen vigentes.


**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 1.4, 1.8, 3.8

> **v2.1 (eng review):** «Cerrar cobrado» llama a `admin_close_lead_paid`, que deriva el nivel `client` comprobando `clients` del afiliado (DT §0b); test: afiliado con cliente → recompensa `maintenance_months`.

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

> **v3.0:** rama `feat/admin-modules`; ruta `/admin/comentarios` desde «Más». Sin más cambios.

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 4.3

**Objetivo:** UX §7.4: cola `pending` con contexto (artículo, autor, fecha), aprobar/rechazar (SA con RLS admin: `moderated_at`, `moderated_by`), historial.

**Ficheros:** `.../admin/comentarios/page.tsx`, `.../comentarios/actions.ts`, `components/admin/comment-queue.tsx`, `components/admin/comment-queue.test.tsx`.

**Pasos:** 1. Test: la cola muestra solo `pending` y los botones Aprobar/Rechazar llaman a la acción con `id` y estado. 2. FAIL. 3. Implementar. 4. PASS; E2E: aprobar → visible anónimo en `/blog/<slug>`. 5. Commit: `git commit -m "feat(web): admin comment moderation queue"`.

### Tarea 6.4 — Clientes, ficha con pestañas, tareas, material, extras y ampliaciones

> **v3.4 (D54):** los selectores de pack y extras del admin leen `packs`/`extras` de las tablas (incluidos los ocultos y, marcados «borrado», los `deleted_at` que ya tenga el cliente), nunca del fichero publicado.

> **v3.0:** rama `feat/admin-modules`; la ficha de cliente enlaza a su contacto del CRM (`ensureContactForClient`, 6.2) y muestra la siguiente acción. Sin más cambios.

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 5.x

**Objetivo:** UX §7.5–7.7: lista de clientes, ficha (resumen, tareas con hoja `?tarea=nueva|[id]`, material con subida de admin, pack y extras con `client_pack_extras`, `invite_email`), lista de ampliaciones con aprobar/rechazar (`admin_note`, `resolved_at`; aprobar añade `client_pack_extras` o actualiza `pack_template_id` por `code`).

**Ficheros:** `.../admin/clientes/page.tsx`, `.../clientes/[id]/page.tsx`, `.../clientes/actions.ts`, `.../admin/ampliaciones/page.tsx`, `.../ampliaciones/actions.ts`, `components/admin/clients/{client-table,client-tabs,task-sheet,asset-admin,pack-editor}.tsx`, `components/admin/upgrades/upgrade-table.tsx`, `lib/admin/apply-upgrade.ts` (`applyUpgrade(request, packs, extras)` → cambios a escribir), `lib/admin/apply-upgrade.test.ts`.

**Pasos:** 1. Test: `applyUpgrade({ to_pack_code:'P3', extras:['seo_full'] })` devuelve `{ packTemplateCode:'P3', extrasToAdd:['seo_full'] }` y con solo extras no cambia el pack. 2. FAIL. 3. Implementar. 4. PASS; E2E: Jose aprueba la ampliación de Ana → su área muestra P3. 5. Commit: `git commit -m "feat(web): admin clients, client file tabs and upgrade requests"`.

### Tarea 6.5 — Afiliados: lista, detalle, nivel, recompensas abonadas

> **v3.0:** rama `feat/admin-modules`; desde «Más». Sin más cambios.

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 5.5

**Objetivo:** UX §7.8–7.9: lista con nivel y recompensas pendientes; detalle con leads atribuidos y recompensas; cambiar `level` a `premium` (SA, RLS admin); "Marcar abonada" (`status='paid'`, `paid_at`).

**Ficheros:** `.../admin/afiliados/page.tsx`, `.../afiliados/[id]/page.tsx`, `.../afiliados/actions.ts`, `components/admin/affiliates/{affiliate-table,affiliate-detail,reward-row}.tsx`, `components/admin/affiliates/reward-row.test.tsx`.

**Pasos:** 1. Test: `RewardRow` `pending` muestra "Marcar abonada"; `paid` muestra fecha y sin botón. 2. FAIL. 3. Implementar. 4. PASS; E2E: marcar abonada → Bob la ve `paid` en su área. 5. Commit: `git commit -m "feat(web): admin affiliates with level and reward payout marking"`.

### Tarea 6.6 — Chat del CRM: hilos, takeover y enlace a contacto sobre `chat_*` (v3.0)

**Agente:** implementador-web · **Rama:** `feat/crm-chat` · **Gate:** no · **Depende de:** 6.1, 6.2, 4.4 (rutas `assistant/admin/*`) · **Insumos:** PANT v2.0 C7

> Sustituye a la 6.6 v2.2 (que leía `admin-chat/admin/*`). Ahora todo va por `assistant/admin/*` (4.4) y realtime en `chat_messages` (publicación añadida en 1.11), sin la migración opcional `20260917100800`.

**Objetivo:** `/admin/crm/chat` (`ThreadList`: caso, idioma, origen, último mensaje, sin leer, IA on/off, contacto enlazado o «anónimo»; filtros `unread=1`, `case`; realtime en `chat_threads` vía la fila de `chat_messages` nueva → refresco de la lista); `/admin/crm/chat/[id]` (hilo con `ChatBubble`, **`TakeoverSwitch`** (→ `POST /assistant/admin/threads/:id/ai`), respuesta manual (→ `…/messages`; desactiva la IA automáticamente), «Marcar leído», **«Crear contacto desde este hilo»** (hoja prellenada con nombre/email/teléfono detectados en el texto con una regex simple, `kind` por caso; → `createContact` de 6.2 + `chat_threads.contact_id`), «Enlazar a contacto existente» (buscador), enlace al contacto si ya existe; banda con `context_version` y aviso si `metadata.context_fallback`). Contador de mensajes desde el último aviso de Telegram.

**Ficheros:** `app/[locale]/(private)/admin/crm/chat/page.tsx`, `.../chat/[id]/page.tsx`, `.../chat/actions.ts` (`linkThreadToContact`, `createContactFromThread`), `components/admin/crm/chat/{thread-list,thread-view,takeover-switch,link-contact-sheet}/…`, `lib/crm/extract-contact.ts` (+ test: extrae email y teléfono del texto, nunca inventa nombre), `components/admin/crm/chat/takeover-switch.test.tsx`, `e2e/chat.spec.ts` (ampliar: el test de takeover de 4.4).

**Pasos:** 1. Tests: `TakeoverSwitch` con `aiEnabled=true` muestra «IA activa» y al pulsar llama a `onToggle(false)`; `extractContact('soy nuria@agencia.test, 600 000 000')` → `{ email, phone, name: null }`. 2. FAIL. 3. Implementar. 4. PASS; E2E de takeover de 4.4 completo (visitante ve la banda y el mensaje de Jose; 0 peticiones a `admin-chat/*`). 5. Commit: `git commit -m "feat(web): crm chat threads with takeover, context version and contact linking"`.

**Hecho cuando:** E2E de 4.4 en verde con el admin real; crear un contacto desde un hilo anónimo deja `contact_id` y una interacción `chat_thread`.

> **Seguridad (revisión del gateway):** los mensajes del hilo se pintan **siempre como texto plano**, sin Markdown, HTML ni autolinks, aunque los escriba el visitante o la IA.

### Tarea 6.6 (v2.2, superada) — Chat del admin con takeover

**Agente:** implementador-web · **Gate:** no · **Depende de:** 6.1, 4.4

> **v2.1 (eng review):** los avisos de Telegram de conversaciones llegan agrupados (4.4); el admin muestra el contador de mensajes desde el último aviso.

**Objetivo:** UX §7.10–7.11: conversaciones (`GET admin-chat/admin/conversations`), conversación con mensajes, respuesta manual (`POST …/messages`), interruptor IA (`POST …/ai`), marcar leído; realtime en `admin_chat_messages`. Opcional: migración `20260917100800_realtime_admin_chat_conversations.sql` si la bandeja necesita actualizarse sin recarga (se aplica en el gate 7.7 junto con Radar).

**Ficheros:** `.../admin/chat/page.tsx`, `.../chat/[id]/page.tsx`, `components/admin/chat/{conversation-list,conversation-view,takeover-switch}.tsx`, `components/admin/chat/takeover-switch.test.tsx`, `e2e/chat.spec.ts` (ampliar: admin ve la conversación y desactiva IA).

**Pasos:** 1. Test: `TakeoverSwitch` con `aiEnabled=true` muestra "IA activa" y al pulsar llama a `onToggle(false)`. 2. FAIL. 3. Implementar. 4. PASS; E2E. 5. Commit: `git commit -m "feat(web): admin chat conversations with human takeover"`.

### Tarea 6.7 — Organizaciones e importación de `Comercial/agencias.md` (v3.0)

**Agente:** implementador-web · **Rama:** `feat/crm` · **Gate:** no · **Depende de:** 6.2, 1.11 (`crm_import_organizations`) · **Insumos:** `Comercial/agencias.md` (tablas «Estado del contacto» e «Investigación completa»); PANT v2.0 C5–C6

**Objetivo:** `/admin/crm/organizaciones` (lista con `kind`, `fit`, ciudad, nº de contactos, estado agregado = el más avanzado de sus contactos) y `/[id]` (detalle con contactos, notas de investigación «Qué vende», «Señal», «Motivo»; «Añadir contacto» → hoja de 6.2 con la organización fijada); `/admin/crm/importar`: textarea o fichero `.md`/`.csv` → **parser puro** `parseAgenciasMd(md)` en `lib/crm/import-agencias.ts` (lee las dos tablas de `agencias.md` por cabeceras, une por nombre normalizado, produce `{ organizations: [{ name, website, city, size, fit, notes, kind:'agency' }], contacts: [{ organizationName, display_name, role, linkedin_url, status }] }`, mapea los estados del vault a `ContactStatus` de `agency` (pendiente→`pending`, invitación enviada→`invited`, InMail enviado→`inmail_sent`, respondido→`replied`, reunión→`meeting`, colaborando→`collaborating`, descartada→`discarded`), ignora filas de «Descartadas al verificar» salvo para marcar `discarded` si ya existen) → `ImportPreview` (crea / actualiza / sin cambios) → confirmar → RPC `crm_import_organizations` + inserts de contactos por SA con `requireAdmin()`; interacción `import` en cada contacto creado. **Idempotente**: repetir no duplica (test de 1.11) y no retrocede estados (si el CRM va más avanzado que el `.md`, se conserva el del CRM y la vista previa lo avisa).

**Ficheros:** `lib/crm/import-agencias.ts` (+ `import-agencias.test.ts` con un fixture de `agencias.md` **sintético**, sin nombres reales), `app/[locale]/(private)/admin/crm/{organizaciones,organizaciones/[id],importar}/page.tsx`, `.../importar/actions.ts` (`importAgencies`), `components/admin/crm/{org-table,org-detail,import-preview}/…`, `e2e/admin-crm.spec.ts` (ampliar).

**Pasos:** 1. Tests: `parseAgenciasMd(fixture)` devuelve 3 organizaciones y 4 contactos con los estados mapeados; una fila con «pendiente (confirmar …)» → `pending` y la nota en `notes`; una agencia en «Descartadas al verificar» → `discarded`. 2. FAIL. 3. Implementar. 4. PASS; E2E: pegar el fixture → vista previa «3 nuevas» → confirmar → repetir → «0 nuevas, 0 cambios». 5. Commit: `git commit -m "feat(web): crm organizations and idempotent import of the agencies list"`.

**Hecho cuando:** la importación del `agencias.md` real (en preview, con Jose) crea las 39 organizaciones y sus decisores sin duplicados; `revisor-seguridad` confirma que el fichero del vault no se commitea.

### Tarea 6.8 — Redactar mensajes con IA (borradores que Jose envía a mano): gateway `crm/drafts/generate` + `DraftComposer` con linter de reglas (v3.0)

**Agente:** implementador-web · **Rama:** `feat/crm` · **Gate:** no · **Depende de:** 6.2, 1.11 (`crm_message_templates`, `crm_message_drafts`), 3.7 (AI Gateway, guarda) · **Insumos:** `Comercial/voz.md`, reglas de `Comercial/agencias-mensajes.md` (sembradas en 1.11), decisión **Q20** (recomendación: solo «Copiar» + `mailto:`; sin Gmail)

> **Regla dura:** el sistema **nunca envía**. Test negativo global: ningún fichero de `apps/` ni `packages/` contiene `messages.send`, `users.messages.send`, `/send` de Gmail, `sendMail`, ni un cliente SMTP; el único verbo permitido es `drafts.create`, y solo si en el futuro hay OAuth (Q20).

**Objetivo (gateway):** `POST /api/v1/crm/drafts/generate` (JWT admin; body `{ contactId, channel: 'linkedin_invite'|'linkedin_inmail'|'email', templateCode?, locale, instructions? }`): lee contacto + organización + últimas 5 interacciones + plantilla (`crm_message_templates`) → prompt con la voz de `voz.md` y las **reglas** de la plantilla → `env.AI.run` (AI Gateway, `consumer:'crm'`) → **`lintDraft(text, rules, maxChars)`** determinista (sin emojis, sin «!», sin cifras con «€», sin «Alten», «3CatInfo» y «3Cat» no en la misma frase, ≤ `max_chars`, idioma); si falla, reintenta una vez con el error en el prompt; si vuelve a fallar, devuelve el borrador con `lint.errors` para que Jose lo edite → inserta `crm_message_drafts` (`generated_by:'ai'`, `model`, `prompt_version`, `char_count`) → 201. `PATCH /crm/drafts/:id` (editar; recalcula `lint`), `POST /crm/drafts/:id/mark-sent` (→ `status='marked_sent'`, `crm_interactions(kind='message_sent', channel, direction:'out')`, sugiere estado siguiente: invitación→`invited`, InMail→`inmail_sent`, correo→`contacted`). `POST /crm/drafts/:id/gmail-draft` → **501** hasta que exista OAuth (Q20), con test.

**Objetivo (web):** pestaña **Mensajes** en el contacto (`?mensaje=nuevo|<id>`): elegir canal y plantilla (filtradas por `kind`), «Generar con IA», `DraftComposer` (textarea con contador `n / max`, `RuleLinter` en vivo con las mismas reglas que el gateway —módulo puro compartido `packages/types`? no: `apps/web/lib/crm/lint-draft.ts` y `apps/api/src/utils/lint-draft.ts` **son el mismo fichero** en `packages/crm-rules` (paquete nuevo, sin dependencias, con test; justificar en `revisor`)—), **`CopyButton`**, «Abrir LinkedIn» (URL del contacto en nueva pestaña), «Abrir correo» (`mailto:` con asunto y cuerpo), **«Lo he enviado»** → `mark-sent` + `StatusSheet` con el estado sugerido. Lista de borradores del contacto con estado.

**Ficheros:** `packages/crm-rules/src/{lint-draft,index}.ts` (+ `test/lint-draft.test.ts`), gateway: `apps/api/src/modules/crm.routes.ts`, `apps/api/src/services/crm-drafts.service.ts` (+ `.test.ts`), `apps/api/src/adapters/crm.supabase.adapter.ts`, `apps/api/src/schemas/crm.schema.ts`, `routes-manifest.ts`; web: `components/admin/crm/messages/{draft-composer,draft-list,rule-linter}/…`, `.../contactos/[id]/messages.actions.ts`, `apps/web/tests/no-send.test.ts`, `apps/api/test/no-send.test.ts`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/crm-rules/test/lint-draft.test.ts
import { it, expect } from 'vitest';
import { lintDraft } from '../src';
const rules = ['no_emoji','no_exclamation','no_prices','no_alten','threecat_separate'];
it('passes a clean 280-char invite and fails each rule', () => {
  expect(lintDraft('Hola Luis. He visto que externalizáis apps a medida. Hago React Native y Next.js para agencias, en marca blanca si hace falta. ¿Te encaja una llamada de 20 minutos esta semana?', rules, 300).ok).toBe(true);
  expect(lintDraft('Hola! Qué tal', rules, 300).errors).toContain('no_exclamation');
  expect(lintDraft('Cobro 40 €/h', rules, 300).errors).toContain('no_prices');
  expect(lintDraft('Trabajé en Alten', rules, 300).errors).toContain('no_alten');
  expect(lintDraft('Hice 3CatInfo para 3Cat', rules, 300).errors).toContain('threecat_separate');
  expect(lintDraft('x'.repeat(301), rules, 300).errors).toContain('max_chars');
  expect(lintDraft('Hola 🙂', rules, 300).errors).toContain('no_emoji');
});
```
```ts
// apps/api/test/no-send.test.ts  (y el gemelo en apps/web/tests)
import { it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs'; import { join } from 'node:path';
function walk(d: string): string[] { return readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? (f === 'node_modules' ? [] : walk(p)) : p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : []; }); }
it('nothing in the repo can send an email or a message on behalf of Jose', () => {
  const offenders = walk(join(__dirname, '..', 'src')).filter(p => /messages\.send\(|users\.messages\.send|\/gmail\/v1\/users\/[^/]+\/messages\/send|sendMail\(|nodemailer|smtp:\/\//.test(readFileSync(p, 'utf8')));
  expect(offenders).toEqual([]);
});
```
```ts
// apps/api/src/services/crm-drafts.service.test.ts (extracto)
it('retries once with the lint error and returns errors if the model insists', async () => {
  const deps = fakeDeps({ aiReplies: ['Hola! Cobro 40 €/h', 'Hola! otra vez'] }); const svc = createCrmDraftsService(deps);
  const d = await svc.generate({ contactId: 'c1', channel: 'linkedin_invite', locale: 'es' });
  expect(deps.ai.calls).toBe(2); expect(d.lint.ok).toBe(false); expect(d.lint.errors).toContain('no_exclamation'); expect(d.status).toBe('draft');
});
it('mark-sent records an outbound interaction and suggests the next status', async () => {
  const deps = fakeDeps(); const svc = createCrmDraftsService(deps); const d = await svc.generate({ contactId: 'c1', channel: 'linkedin_inmail', locale: 'es' });
  const r = await svc.markSent(d.id); expect(deps.crm.interactions[0]).toMatchObject({ kind: 'message_sent', channel: 'linkedin_inmail', direction: 'out' }); expect(r.suggestedStatus).toBe('inmail_sent');
});
it('gmail-draft is 501 without OAuth', async () => { const svc = createCrmDraftsService(fakeDeps()); await expect(svc.gmailDraft('d1')).rejects.toMatchObject({ code: 'not_configured' }); });
```
- [ ] 2. → FAIL. 3. Implementar; `packages/crm-rules` sin dependencias (justificación para `revisor`: la misma regla debe correr en el navegador y en el gateway). Evals manuales `evals/crm-drafts.jsonl` (10 contactos sintéticos × 3 canales) antes del merge. 4. → PASS; `web-design-guidelines`; **aprobación de Jose en preview** (genera un borrador real para una agencia del seed y lo copia). 5. Commit: `git commit -m "feat(api,web,crm-rules): ai-assisted message drafts with rule linter, copy/open actions and manual mark-sent; nothing ever sends"`.

**Hecho cuando:** el test negativo de envío pasa en `apps/api` y `apps/web`; un borrador de invitación cumple ≤ 300 caracteres y las reglas (test); «Lo he enviado» crea la interacción y propone el estado; `revisor-seguridad` confirma que no hay credenciales de LinkedIn ni de correo en el repo ni en `wrangler.jsonc`.

### Tarea 6.9 — Contextos del chat por caso: editor, versiones, diff, probar y publicar (v3.0; D40)

**Agente:** implementador-web · **Rama:** `feat/crm` · **Gate:** no · **Depende de:** 6.1, 1.12, 4.4 (el gateway lee `chat_context_published`) · **Insumos:** PANT v2.0 C8; **contexto inicial por caso** de Jose (8 textos); `pricing.json` (para `facts.rates_ref`)

**Objetivo:** `/admin/crm/contextos` (`ContextGrid` 4 casos × 2 idiomas: estado «publicado v{n} · {fecha}», «borrador» o «sin contexto», con aviso si el publicado tiene > 60 días); `/admin/crm/contextos/[case]/[locale]`: `ContextEditor` con **hechos estructurados** (`facts`: `availability` (texto corto), `zone`, `stack[]` (chips), `links{}` (solo URLs permitidas: dominios propios, LinkedIn, GitHub, stores, Cal.com), `dos[]`, `donts[]`, `rates_ref` **fijo** `'pricing'` no editable) + `body_md` (texto libre que recibe la IA, `Prose` en preview) + `notes` internas; **guardar borrador** (nueva fila `status='draft'`, `version = max+1`); **`ContextDiff`** (borrador vs publicado, por líneas); **«Probar»** → abre `/chat?case=…&preview=<version>` en pestaña nueva (solo admin: el gateway acepta `preview` únicamente con JWT admin y lee ese borrador); **«Publicar»** → SA `publishContext(id)`: en una transacción (RPC `chat_context_publish(p_id)` **nueva, aditiva, solo admin**, añadida en esta tarea como migración `20261028100900_chat_context_publish.sql` y aplicada en el gate 1.12 si aún no se ejecutó o en un gate propio con OK de Jose) marca `archived` el publicado anterior y `published` el nuevo con `published_at/by`; el gateway invalida su caché de 5 min (`POST /assistant/admin/contexts/invalidate`); `VersionList` con «Volver a esta» (crea borrador copia). Validación zod de `facts` en servidor; URLs fuera de la lista blanca → error de campo.

**Ficheros:** `supabase/migrations/20261028100900_chat_context_publish.sql`, `app/[locale]/(private)/admin/crm/contextos/page.tsx`, `.../contextos/[case]/[locale]/page.tsx`, `.../contextos/actions.ts` (`saveDraft`, `publishContext`, `restoreVersion`), `components/admin/crm/contexts/{context-grid,context-editor,context-diff,version-list}/…`, `lib/crm/context-facts.ts` (zod + lista blanca de dominios; + test), `lib/crm/diff.ts` (+ test), gateway: `assistant.service.ts` (modo `preview` para admin; invalidación), `e2e/admin-crm.spec.ts` (ampliar), `apps/web/tests/rls.test.ts` (ampliar: la RPC solo admin; dos publicados imposibles).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/crm/context-facts.test.ts
import { it, expect } from 'vitest';
import { contextFactsSchema } from './context-facts';
it('rates_ref is always pricing and links must be allow-listed', () => {
  expect(contextFactsSchema.parse({ links: { linkedin: 'https://www.linkedin.com/in/x' }, stack: ['React Native'] }).rates_ref).toBe('pricing');
  expect(() => contextFactsSchema.parse({ rates_ref: 'free_text' })).toThrow();
  expect(() => contextFactsSchema.parse({ links: { evil: 'https://evil.com' } })).toThrow(/allow/);
});
```
```ts
// apps/web/tests/rls.test.ts (añadir)
it('chat_context_publish archives the previous published row atomically and is admin-only', async () => {
  const { data: draft } = await jose.from('chat_contexts').insert({ case:'client', locale:'es', version: 2, status:'draft', title:'v2', body_md:'nuevo', facts:{} }).select().single();
  const { error } = await ana.rpc('chat_context_publish', { p_id: draft!.id }); expect(error).toBeTruthy();
  await jose.rpc('chat_context_publish', { p_id: draft!.id });
  const { data } = await jose.from('chat_contexts').select('version,status').eq('case','client').eq('locale','es').order('version');
  expect(data).toEqual([{ version: 1, status: 'archived' }, { version: 2, status: 'published' }]);
});
```
E2E: editar `partner`/es → guardar borrador → «Probar» abre el chat con el borrador (AI falsa devuelve el contexto) → publicar → el chat público (otra pestaña sin sesión) responde con el texto nuevo tras la invalidación; el grid muestra «publicado v2».
- [ ] 2. → FAIL. 3. Implementar (migración + RPC con `security definer`, `search_path` fijo, `revoke from public, anon, authenticated` + `grant execute to authenticated` con comprobación `staff_role_of` dentro). 4. → PASS; `web-design-guidelines`; **aprobación de Jose en preview** (publica el contexto `client`/es real). 5. Commit: `git commit -m "feat(web,api,supabase): chat context editor with versions, diff, admin preview and atomic publish"`.

**Hecho cuando:** publicar cambia la respuesta del chat sin desplegar (E2E); nunca hay dos `published` por caso e idioma (test de BD); los ocho contextos iniciales de Jose están publicados antes de 9.5 (criterio del hito de contenido).

**Cierre de la fase 6 (v3.0):** `revisor` por rama; `/puerta-calidad` completa (`usuario-ejemplo` como Jose operador: importar agencias, cambiar estados con siguiente acción, generar y copiar un borrador, takeover de un hilo, publicar un contexto; `revisor-seguridad`: **test negativo de envío**, RLS `crm_*`/`chat_*`, `requireAdmin` en cada SA, lista blanca de URLs de `facts`, `preview` solo admin); merge.


> Cierre v2.2 (superado): `revisor`; `/puerta-calidad` completa (`usuario-ejemplo` como Jose operador en leads y cierre cobrado; `revisor-seguridad` en `requireAdmin` por acción, RPC y `adminFetch`); merge.

---
## Fase 6b — Closers, historias de usuario y contenido editable (v3.3; D51–D53) · Estimación L · 3 días + día 4 · carriles **F1** (CRM), **F2** (contenido), **F3** (equipo/notificaciones) + colgadas de **D** y **E**

> Normativa: spec v2.2 §0.14, **DATOS v1.3 §14** (tablas, RLS, RPC, eventos: el implementador copia de ahí, no reinterpreta), **PANT v2.1** (pantallas K1–K7, D1–D3, A8). Trabajo directo en `main` (excepción vigente del 2026-10-29) con `implementador-web` → `revisor` por tarea; CI de `main` con Supabase local es la red. Reglas duras: closers y admin con `aal2` (Q24); **ninguna** Server Action de dinero (aprobar/pagar comisión, cerrar cobrado) sin diálogo de confirmación y sin `requireAdmin()` dentro; el CRM sigue sin enviar mensajes comerciales (los tres correos transaccionales de DATOS §14.6 son plantillas fijas en `apps/api/src/templates/` y el test negativo de envío los admite por nombre). Ficheros disjuntos por carril: F1 `app/[locale]/(staff)/crm/**`, `components/crm/**`, `lib/crm/**`; F2 `app/[locale]/(private)/admin/contenido/**`, `components/content-admin/**`, `lib/content/overrides*`, `scripts/*overrides*`; F3 `app/[locale]/(private)/admin/{equipo,notificaciones}/**`, `components/team/**`; E `app/[locale]/(area)/area-clientes/historias/**`; D `apps/api/**`. Los `messages/es/{crm,admin}.json` son nuevos y **solo en español**: `i18n:check` los exime de la paridad es/en porque figuran en `ADMIN_ONLY_NAMESPACES` (`lib/content/namespaces.ts`, 3.1b), distinta de `EDITABLE_NAMESPACES` (los que el admin puede sobrescribir).

### Tarea 1.8e — Migraciones D51–D53, seed ampliado, tests de migraciones y RLS (local)

**Agente:** implementador-web · **Carril:** F1 · **Día:** 1 (mañana) · **Gate:** no · **Depende de:** 1.8c (esquema v1.2 en `main`)

**Objetivo:** las **siete** migraciones de DATOS §14.7 tal cual (nombres, orden, políticas reemplazadas con `drop policy` + `create policy` del mismo nombre, helpers §14.3, RPC §14.4 y **§14.12** con el patrón `private.*_impl` + wrapper invoker, filas sembradas de `notification_rules` y `scheduled_jobs` §14.6), incluidas `crm_request_close(p_lead_id)` (6.2), `admin_staff_list()` con `mfa_enrolled` (6.13), **`crm_import_conflicts` + `admin_import_conflicts` + `admin_import_conflict_resolve` (Q22, 6.10)**, **`staff_invites.commission_rate` obligatoria y `percent` congelado (Q21)** y **la migración 7 del catálogo de precios y presupuestos (D54: `20261101100600_pricing_catalog.sql`, para 3.1c, 3.7b, 6.16, 6.17)**; seed con `carla@test`, `dani@test` y los datos de §14.7 (conflicto pendiente, pack oculto, presupuesto `draft`); tests. **v3.4:** +2 h respecto a v3.3.

**Ficheros:** `supabase/migrations/20261101100000_staff_closer_role.sql` … `20261101100600_pricing_catalog.sql`; `supabase/seed.sql` (§3 regenerado desde `content/pricing.json` por `pricing:sync-db`, con nombres es/en); `supabase/test/migrations.test.ts` (reglas nuevas de §14.7); `supabase/test/pg/*.sql` (harness de la nube: aserciones de la matriz §14.3 y de los criterios §14.9 1–6 y **9–11**); `apps/web/tests/helpers/supabase-test-clients.ts` (+ `carla`, `dani`); `apps/web/tests/rls.test.ts` (+ ≥ 50 aserciones); `packages/types/src/database.ts` (regenerado con `pnpm --filter types db:types`); `packages/types/src/schemas/{crm,content,stories,pricing-admin,quotes}.ts` (zod: `CsvContactRow`, `ImportResult` con `conflicts`, `ConflictResolution`, `ContentEntry` por `kind`, `SiteSettings` sin `hiddenPacks`, `UserStoryInput`, **`PackInput`, `PackOptionInput`, `ExtraInput`, `PricingSettingsInput`, `QuoteInput`, `QuoteItemInput`**); `packages/types/src/{crm,content,pricing}.ts` (tipos inferidos + `EDITABLE_NAMESPACES`).

**Pasos:**
- [ ] 1. Tests que fallan (extracto; el resto sigue la matriz §14.3 celda a celda):
```sql
-- supabase/test/pg/closers.sql (harness run.sh; se ejecuta como cada cuenta con set_config('request.jwt.claims', …))
-- carla ve solo su cartera
select is((select count(*) from public.crm_contacts), 3::bigint, 'carla sees her 3 contacts');
-- dani (disabled) sees nothing although he owns one
select is((select count(*) from public.crm_contacts), 0::bigint, 'disabled closer sees 0 rows');
-- carla cannot reassign nor self-win
select throws_ok($$ update public.crm_contacts set owner_id = null where owner_id = auth.uid() $$, '42501');
select throws_ok($$ update public.crm_contacts set status = 'won', next_action_at = now() where owner_id = auth.uid() $$, '42501');
-- import idempotent and leak-free
select is((select (public.crm_import_contacts_csv(:rows, 'a.csv', 'sha1') ->> 'created')::int), 2);
select is((select (public.crm_import_contacts_csv(:rows, 'a.csv', 'sha1') ->> 'created')::int), 2, 'same checksum returns the previous result');
-- Q22: a row owned by jose goes to the conflict queue, nothing leaks, the contact is untouched
select is((select (public.crm_import_contacts_csv(:row_of_jose, 'b.csv', 'sha2') ->> 'conflicts')::int), 1);
select ok((public.crm_import_contacts_csv(:row_of_jose, 'b.csv', 'sha3'))::text not like '%jose%', 'no owner data leaks');
select throws_ok($$ select existing_contact_id from public.crm_import_conflicts $$, '42501', null, 'importer cannot read the other side');
-- Q22: admin resolves assign_importer → carla now owns it
select public.admin_import_conflict_resolve(:conflict_id, 'assign_importer', null);   -- as jose
select is((select owner_id from public.crm_contacts where id = :jose_contact), :carla_uid);  -- as carla: visible now
-- Q21: commission on close paid (as admin) freezes the rate
select public.admin_close_lead_paid(:carla_lead, 1400, now(), false, null);
select is((select (percent, amount) from public.closer_commissions where lead_id = :carla_lead), (10.00, 140.00));
select public.admin_staff_set(:carla_uid, false, 20, null);
select is((select percent from public.closer_commissions where lead_id = :carla_lead), 10.00, 'rate change does not rewrite history');
-- D54: pricing is edited by RPC only, hidden items never reach the snapshot, published lags until content_publish
select throws_ok($$ update public.packs set price = 1 where code = 'P1' $$, '42501');                    -- as jose
select public.admin_pricing_set_pack('{"code":"P2","price":1500}'::jsonb);
select is((select new_price from public.pricing_price_history where item_code = 'P2' order by changed_at desc limit 1), 1500.00);
select ok((public.pricing_catalog_snapshot()::text) not like '%"HIDDEN_PACK"%', 'hidden pack excluded');
select is((select (p->>'price')::int from jsonb_array_elements(public.pricing_published()->'packs') p where p->>'code' = 'P2'), 1400, 'published lags'); -- as service_role
-- D54: quotes sum extras; discount is admin-only
select public.quote_add_item(:quote, 'seo_full', 1); select public.quote_add_item(:quote, 'maintenance_basic', 12);   -- as carla
select is((select total from public.custom_quotes where id = :quote), 1188.00);
select throws_ok($$ update public.custom_quotes set discount_amount = 100 where id = :quote $$, '42501');
```
```ts
// apps/web/tests/rls.test.ts (añadido)
it('ana proposes a story and cannot change its status', async () => {
  const { data } = await ana.from('client_user_stories').insert({ client_id, title: 'Reservas', as_a: 'dueña', i_want: 'reservar online', so_that: 'no perder llamadas', acceptance_criteria: ['Formulario', 'Correo'] }).select().single();
  expect(data?.status).toBe('proposed');
  const upd = await ana.from('client_user_stories').update({ status: 'accepted' }).eq('id', data!.id);
  expect(upd.error?.code).toBe('42501');
});
it('content_publish rejects {{DATO}} and foreign namespaces', async () => {
  await jose.rpc('content_save_draft', { p_kind: 'message_override', p_key: 'auth.login.title', p_locale: 'es', p_draft: { value: 'x' } });
  expect((await jose.rpc('content_publish')).error?.message).toMatch(/namespace_not_editable/);
});
```
- [ ] 2. → FAIL. 3. Escribir las migraciones copiando DATOS §14 (enum en migración propia; `security definer` solo en `private`); seed; `pnpm --filter types db:types`. 4. `supabase db reset` (o `supabase/test/pg/run.sh` en la nube) → PASS; `pnpm test`. 5. Commit: `git commit -m "feat(db): closers (owner scope, imports, commissions), client user stories, site content and notification rules (DATOS v1.3)"`.

**Hecho cuando:** **17** migraciones aplican desde cero; `migrations.test.ts` y `rls.test.ts` en verde con seis cuentas; `supabase inspect db` local sin `multiple_permissive_policies`; `database.ts` sin diff; `explain` de K2/K5 sobre el dataset de carga sin `Seq Scan`; `pricing_catalog_snapshot()` del seed valida con `pricingSchema` y es idéntico (salvo `version`) a `content/pricing.json` (test en `packages/pricing`).

### Tarea 1.9c — **GATE**: aplicar las migraciones D51–D53 en producción y preparar la GitHub App

**Agente:** controlador con OK de Jose (nunca un subagente) · **Día:** 1 (tarde) · **Gate:** **SÍ** · **Depende de:** 1.8e con `revisor` PASA

**Pasos (cada uno con OK):**
- [ ] 1. `get_advisors` (seguridad y rendimiento) y `list_migrations` antes; comprobar que el esquema remoto coincide con `20261029100000` (sin drift).
- [ ] 2. Aplicar las **siete** migraciones **una a una** por la Management API (`database/query` en transacción + fila en `supabase_migrations.schema_migrations`, como en 1.9) o `supabase db push` desde el Mac si Jose está en él.
- [ ] 3. `get_advisors` después: **cero** hallazgos de seguridad; `multiple_permissive_policies`, `auth_rls_initplan`, `unindexed_foreign_keys` a cero; `unused_index` aceptado.
- [ ] 4. Comprobar las filas sembradas de `notification_rules` y `scheduled_jobs` (`content.poll_deploy`, `telegram.poll_updates`); `staff_members` de Jose intacta (`role='admin'`, `disabled_at null`, `commission_rate 0`).
- [ ] 4b. **Carga inicial del catálogo (D54, única vez):** `pnpm pricing:sync-db` → revisar `supabase/generated/pricing-sync.sql` (P1–P5, `plus`, seis extras, `pricing_settings` con 40/150, nombres es/en del fichero) → aplicarlo → `select count(*) from packs where deleted_at is null` = 5; `pricing_price_history` **vacía** (la carga inicial no es un cambio); `select md5(pricing_catalog_snapshot()::text)` anotado. **Después de este paso `pricing:sync-db` se niega a correr contra esta base** (guarda de 3.1c). La primera publicación real la hace Jose desde D2 en 9.4 paso 9; hasta entonces `pricing_published()` devuelve `null` y el gateway usa el fichero compilado (mismos valores).
- [ ] 5. **Jose** crea la GitHub App `josecoded-bot` (si no existe desde la fase 10): permisos `Contents: Read and write` **solo**, instalada en este repo; genera la clave privada. El controlador guarda `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY` con `wrangler secret put` en `josecoded-api` (producción y preview) tras 3.8c. La clave no se pega en el chat: Jose la introduce desde su terminal (`wrangler secret put` interactivo) o el controlador la lee de un fichero local que se borra.
- [ ] 6. `ESTADO.md`: «1.9c aplicada el <fecha>; advisors 0».

**Hecho cuando:** `select count(*) from information_schema.tables where table_schema='public'` = **36** (31 de v3.3 + `crm_import_conflicts`, `pricing_settings`, `pricing_price_history`, `custom_quotes`, `custom_quote_items`); advisors a cero; Jose sigue entrando en `/admin`; el catálogo cargado coincide con `content/pricing.json`.

### Tarea 6.0 — `requireStaff()`, `claim_staff_access` tras el login y grupo de rutas `(staff)`

**Agente:** implementador-web · **Carril:** F1 · **Día:** 1 (tarde) · **Gate:** no · **Depende de:** 4.1 (carril E: `requireAdmin`, `createServerSupabase`, SA de login), 1.8e

**Objetivo:** `requireStaff(): Promise<{ session, role: 'admin'|'closer' }>` en fichero propio para no tocar `lib/auth/guards.ts` de E: lee `staff_members` (propia fila por RLS), exige `role in ('admin','closer')`, `disabled_at is null` y `aal2` (como `requireAdmin`; si no hay factor, redirige a `/perfil/seguridad`); `notFound()` en cualquier otro caso. Tras el login (en la SA de 4.1 que ya llama a `claim_client_access`), añadir **una línea**: `await supabase.rpc('claim_staff_access')` ignorando `null`. Layout `app/[locale]/(staff)/crm/layout.tsx` con `requireStaff()` y placeholder; `/admin/layout.tsx` sigue con `requireAdmin()`.

**Ficheros:** `apps/web/lib/auth/staff.ts`, `lib/auth/staff.test.ts`, `app/[locale]/(staff)/crm/layout.tsx`, `app/[locale]/(staff)/crm/page.tsx` (placeholder hasta 6.1), `app/[locale]/(auth)/auth/actions.ts` (una línea; coordinar con E: si la tarea 4.1 no ha mergeado, se hace en 6.1), `e2e/staff.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla:
```ts
// apps/web/lib/auth/staff.test.ts
import { it, expect, vi } from 'vitest';
vi.mock('next/navigation', () => ({ redirect: vi.fn((u) => { throw new Error('REDIRECT ' + u); }), notFound: vi.fn(() => { throw new Error('NOT_FOUND'); }) }));
vi.mock('../supabase/server', () => ({ createServerSupabase: () => ({
  auth: { getUser: async () => ({ data: { user: globalThis.__user } }), mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: globalThis.__aal } }) } },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: globalThis.__staff }) }) }) }) }) }));
import { requireStaff } from './staff';
it('404 for a non-staff user', async () => { globalThis.__user = { id: 'u' }; globalThis.__staff = null; await expect(requireStaff()).rejects.toThrow('NOT_FOUND'); });
it('404 for a disabled closer', async () => { globalThis.__staff = { role: 'closer', disabled_at: '2026-11-01' }; globalThis.__aal = 'aal2'; await expect(requireStaff()).rejects.toThrow('NOT_FOUND'); });
it('redirects an active closer without aal2 to security', async () => { globalThis.__staff = { role: 'closer', disabled_at: null }; globalThis.__aal = 'aal1'; await expect(requireStaff()).rejects.toThrow(/REDIRECT .*perfil\/seguridad/); });
it('passes an active closer with aal2', async () => { globalThis.__aal = 'aal2'; await expect(requireStaff()).resolves.toMatchObject({ role: 'closer' }); });
```
- [ ] 2. → FAIL. 3. Implementar; E2E: anónimo `/crm` → redirige a login; `ana@test` → 404; `carla@test` → placeholder; `dani@test` → 404 (con `ADMIN_REQUIRE_MFA=false` en E2E, como el admin). 4. → PASS. 5. Commit: `git commit -m "feat(web): requireStaff guard with role, disabled and aal2 checks; staff route group"`.

**Hecho cuando:** tests y E2E en verde; `requireStaff` consulta `staff_members` una vez por petición (`React.cache`).

### Tarea 6.0b — Prototipo `ref/crm/` (shell, K2 bandeja con dueño, K3 detalle con acceso al portal e historias) y validación de Jose

**Agente:** `ui` (con `impeccable`) · **Día:** 1 (medio día) · **Gate:** **sí, de Jose en el navegador** (no de código) · **Depende de:** PANT v2.1, `DESIGN.md`

**Objetivo:** HTML estático en `docs/superpowers/design/ref/crm/` (`index.html` shell con las dos navegaciones conmutables por `?role=admin|closer`, `contactos.html`, `contacto.html`) con tokens de `tokens.css`, densidad de tabla, estados de dueño/acceso/historias, hoja «Habilitar acceso», móvil a 390 px con barra de 4. Sin JS salvo el conmutador. Jose lo abre con `python3 -m http.server … --directory docs/superpowers/design/ref` y decide. **Hecho cuando:** Jose dice OK (anotado en `ESTADO.md` con fecha); 6.1 y 6.2 toman valores de aquí.

### Tarea 6.10 — Importar contactos por CSV (K4): parser propio, mapeo de columnas, vista previa y RPC

**Agente:** implementador-web · **Carril:** F1 · **Día:** 2 · **Gate:** no · **Depende de:** 6.2, 1.8e

> **v3.4 (Q22 decidida):** la rama «omitir: ya está en el CRM» **desaparece**: la RPC devuelve `conflicts` (número) y el resultado dice «N pendientes de revisión del administrador» sin más datos; el historial muestra las filas en conflicto **propias** con su estado (lectura de `crm_import_conflicts` con las columnas permitidas, nunca `existing_*`). **Admin:** pestaña `?tab=conflictos` (`ConflictQueue`, solo con `requireAdmin()` en la página y en cada SA): `admin_import_conflicts('pending')` → dos caras lado a lado + cuatro acciones con `ConfirmDialog` → SA `resolveConflict(id, resolution, note)` → `rpc('admin_import_conflict_resolve')` → `revalidatePath('/crm/contactos')`. `lib/crm/conflicts.ts`: `resolutionLabel(resolution, importerName, ownerName)` y `conflictOutcomeForImporter(row)` (`pending | assigned | not_assigned`) con test. E2E cambia: el CSV de 30 filas (26 nuevas, 2 suyas repetidas, 1 de Jose, 1 inválida) → «26 creados · 2 actualizados · 1 inválida · **1 pendiente de revisión**»; Carla no ve nombre ni dueño de esa fila; Jose abre Conflictos → ve la fila de Carla y el contacto suyo → «Asignar a Carla» → Carla ve el contacto en K2 y en el historial «resuelta: asignada a ti». Ficheros añadidos: `components/crm/import/conflict-queue.tsx`, `lib/crm/conflicts.ts` + test, `e2e/crm-import.spec.ts` (ampliado). **+3 h**; si el día 2 no alcanza, la cola del admin va **primero** el día 3 (antes de 6.11).

**Objetivo:** `/crm/importar` según PANT v2.1 K4. Parser **propio** `lib/crm/csv.ts` (RFC 4180: comillas, comas y saltos dentro de comillas, separador `,` o `;` autodetectado por la cabecera, BOM, CRLF; límite 1 MB / 500 filas → error legible); `lib/crm/import-mapping.ts` (`guessMapping(headers)` con sinónimos es/en de PANT; `normalizeRow(row, mapping)` → `CsvContactRow` de zod; `linkedin_url` normalizada; `tags` por `;`/`,`); SA `previewImport` (parsea, mapea, valida, calcula veredicto local «inválida» y devuelve las primeras 20 + totales; **no** consulta duplicados: eso lo decide la RPC) y `importContacts` (zod de todas las filas, `checksum = sha256(texto normalizado)` con `crypto.subtle`, cuota **10 importaciones/hora por usuario** vía `rpc('increment_quota', {p_key: 'import:'+uid, p_limit: 10, p_ttl: '1 hour'})` antes de la RPC, `rpc('crm_import_contacts_csv')`, `revalidatePath('/crm/contactos')`); historial `crm_imports`.

**Ficheros:** `app/[locale]/(staff)/crm/importar/page.tsx`, `.../importar/actions.ts`, `components/crm/import/{csv-dropzone,column-mapper,import-preview,import-history}.tsx` + CSS Modules, `lib/crm/csv.ts`, `lib/crm/csv.test.ts`, `lib/crm/import-mapping.ts`, `lib/crm/import-mapping.test.ts`, `e2e/crm-import.spec.ts`, `e2e/fixtures/contacts-30.csv`, `messages/es/crm.json`.

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/lib/crm/csv.test.ts
import { it, expect } from 'vitest';
import { parseCsv } from './csv';
it('parses quoted fields, embedded separators and CRLF with BOM', () => {
  const out = parseCsv('﻿nombre;email;notas\r\n"Pérez, Ana";ana@x.es;"línea 1\nlínea 2"\r\n');
  expect(out.headers).toEqual(['nombre', 'email', 'notas']); expect(out.rows[0]).toEqual(['Pérez, Ana', 'ana@x.es', 'línea 1\nlínea 2']); expect(out.separator).toBe(';');
});
it('rejects more than 500 rows and more than 1 MB', () => {
  expect(() => parseCsv('a\n' + 'x\n'.repeat(501))).toThrow('too_many_rows');
  expect(() => parseCsv('a\n' + 'x'.repeat(1024 * 1024 + 1))).toThrow('too_large');
});
```
```ts
// apps/web/lib/crm/import-mapping.test.ts
import { guessMapping, normalizeRow } from './import-mapping';
it('maps spanish and english headers', () => expect(guessMapping(['Nombre', 'E-mail', 'LinkedIn', 'Empresa', 'Tipo'])).toMatchObject({ display_name: 0, email: 1, linkedin_url: 2, organization: 3, kind: 4 }));
it('normalizes linkedin and requires a reachable field', () => {
  expect(normalizeRow(['Ana', '', 'https://www.linkedin.com/in/ana/?x=1', '', 'lead'], guessMapping(['Nombre','Email','LinkedIn','Empresa','Tipo'])).data?.linkedin_url).toBe('https://linkedin.com/in/ana');
  expect(normalizeRow(['Ana', '', '', '', 'lead'], guessMapping(['Nombre','Email','LinkedIn','Empresa','Tipo'])).error).toBe('unreachable');
});
```
E2E: Carla sube `contacts-30.csv` (30 filas: 26 nuevas, 2 suyas repetidas, 1 de Jose, 1 inválida) → vista previa muestra 1 inválida → importa → «26 creados · 2 actualizados · 2 omitidos»; vuelve a subir el mismo fichero → «Ya importado el … (sin cambios)»; la bandeja `?import=<id>` lista 26.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; `web-design-guidelines`; axe en la página (tabla de vista previa con `<caption>`, errores por fila con `aria-describedby`). 5. Commit: `git commit -m "feat(web): csv contact import for staff with own parser, header mapping, preview and idempotent rpc"`.

**Hecho cuando:** E2E en verde; una fila con `=HYPERLINK(` se guarda como texto y se muestra escapada (sin ejecutar ni enlazar); ninguna respuesta de la SA incluye datos de contactos ajenos.

### Tarea 6.11 — Comisiones (K5): lista del closer, totales, aprobación, rechazo y pago registrado por el admin

**Agente:** implementador-web · **Carril:** F1 · **Día:** 3 · **Gate:** no (las acciones de dinero piden confirmación; el pago real es manual fuera de la web) · **Depende de:** 6.1, 1.8e

> **v3.4 (Q21 decidida):** la columna `%` muestra `closer_commissions.percent` (el congelado), no la tasa actual del closer; si difieren, `CommissionRow` añade el texto «tasa actual: N %» como ayuda. E2E añade: Jose cambia la tasa de Carla a 20 % en D1 → la comisión de 140 € sigue mostrando 10 %.

**Objetivo:** `/crm/comisiones` según PANT K5: tabla (`CommissionRow`), totales por estado (`CommissionTotals`, celdas), filtro `?status`; admin: filtro por closer y acciones `approveCommission`, `rejectCommission(reason)`, `markCommissionPaid(paid_at, note)` → RPC `admin_commission_*` tras `ConfirmDialog` (texto: importe, closer, «esto solo registra el pago»). `requireAdmin()` dentro de cada SA. `lib/crm/commissions.ts`: `canTransition(from, to)` y `totalsByStatus(rows)`.

**Ficheros:** `app/[locale]/(staff)/crm/comisiones/page.tsx`, `.../comisiones/actions.ts`, `components/crm/commissions/{commission-row,commission-totals}.tsx`, `lib/crm/commissions.ts`, `lib/crm/commissions.test.ts`, `e2e/crm-commissions.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla: `canTransition('pending','paid') === false`, `('pending','approved') === true`, `('approved','paid') === true`, `('rejected', *) === false`; `totalsByStatus` suma con dos decimales. E2E: Carla ve su comisión de 140 € `pendiente` y no ve botones; Jose aprueba → Carla la ve `aprobada`; Jose marca pagada con fecha → `pagada` y `paid_at`; Jose intenta pagar una `pending` → botón ausente y SA → error `invalid_transition`.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS. 5. Commit: `git commit -m "feat(web): closer commissions with totals and admin approve/reject/mark-paid"`.

**Hecho cuando:** E2E en verde; sin ninguna llamada a pasarelas ni envíos: solo registro.

### Tarea 6.12 — Clientes de la cartera (K6) y decisión de historias de usuario (aceptar · estimar · rechazar · convertir)

**Agente:** implementador-web · **Carril:** F1 · **Día:** 3 · **Gate:** no · **Depende de:** 6.2 (`InviteAccessSheet`), 1.8e, 5.2 (componentes `PhaseSteps`, `TaskRow` del carril E)

**Objetivo:** `/crm/clientes` y `/crm/clientes/[id]` (PANT K6) sobre `staff_clients()`; lista con acceso e historias por decidir; detalle con `PhaseSteps`, tareas (lectura), **Historias** (`StoryCard` + `StoryDecisionSheet`: Aceptar con horas, importe opcional, nota y casilla «Crear tarea» → `rpc('accept_user_story')`; Rechazar con motivo → `reject_user_story`; Convertir → `convert_user_story`), `InviteAccessSheet`. `lib/stories/status.ts`: `nextActions(status, role)`.

**Ficheros:** `app/[locale]/(staff)/crm/clientes/page.tsx`, `.../clientes/[id]/page.tsx`, `.../clientes/actions.ts`, `components/crm/clients/{client-table,client-detail}.tsx`, `components/stories/{story-card,story-decision-sheet}.tsx` (compartidos con 5.6: F1 los crea, E los consume), `lib/stories/status.ts`, `lib/stories/status.test.ts`, `e2e/crm-clients.spec.ts`.

**Pasos:**
- [ ] 1. Test que falla: `nextActions('proposed','closer')` → `['accept','reject']`; `('accepted','closer')` → `['convert']`; `('converted', *)` → `[]`; `('proposed','client')` → `['edit','delete']`. E2E: Carla abre su cliente (Ana, seed) → historia «Reservas» `propuesta` → acepta con 6 h y «Crear tarea» → historia `en tareas`, tarea nueva en la ficha; Carla abre por URL un cliente de Jose → 404.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; capturas 390/900/1440; aprobación de Jose en preview. 5. Commit: `git commit -m "feat(web): staff clients view with portal access invite and user story decisions"`.

**Hecho cuando:** E2E en verde; la decisión queda en `client_tasks.story_id` y Ana la ve en 5.6.

### Tarea 5.6 — Área: historias de usuario del cliente (A8) y «De tu historia» en Tareas

**Agente:** implementador-web · **Carril:** E · **Día:** 2 · **Gate:** no · **Depende de:** 5.1, 5.2, 1.8e; usa `StoryCard` de 6.12 si ya existe (si no, lo crea aquí con la misma API y 6.12 lo reutiliza)

**Objetivo:** `/area-clientes/historias` (lista + vacío con ejemplo), `?nueva=1` (`StoryForm` con `Form`/`Field`: título, Como, Quiero, Para, criterios como lista dinámica accesible ≤ 12), `/area-clientes/historias/[id]` (detalle, veredicto, enlace a la tarea; editar/borrar solo `proposed`); A1 celda «Tus historias»; A2 `TaskRow` con «De tu historia» cuando `story_id`. Todo es y en (`messages/{es,en}/area.json` `stories.*`). SA `createStory`, `updateStory`, `deleteStory` con zod `UserStoryInput` y `requireUser()`.

**Ficheros:** `app/[locale]/(area)/area-clientes/historias/{page,[id]/page}.tsx`, `.../historias/actions.ts`, `components/stories/story-form.tsx` (+ `story-card.tsx` si procede), `lib/stories/form.ts` (`normalizeCriteria(lines)`: quita vacías, recorta, máx. 12), `lib/stories/form.test.ts`, `e2e/client-stories.spec.ts`, `messages/{es,en}/area.json`.

**Pasos:**
- [ ] 1. Test que falla: `normalizeCriteria(['  a ', '', 'b'])` → `['a','b']`; 13 líneas → error `too_many`. E2E: Ana crea una historia con 2 criterios → aparece `propuesta`; la edita; Jose (seed/SA de admin) la acepta → Ana ve `aceptada` con 6 h y no puede editar; en Tareas aparece «De tu historia: Reservas». `/en/client-area/stories` en inglés.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; axe (lista dinámica: cada «Quitar» con nombre accesible «Quitar criterio N»; foco al añadir); `i18n:check`. 5. Commit: `git commit -m "feat(web): client user stories in the area with acceptance criteria and task linkage"`.

**Hecho cuando:** E2E en verde; Ana no ve historias de otro cliente por URL (404).

### Tarea 6.13 — Equipo (D1): invitar closers, activar/desactivar, tasa de comisión, reasignar cartera

**Agente:** implementador-web · **Carril:** F3 · **Día:** 2 · **Gate:** no · **Depende de:** 6.1, 1.8e

> **v3.4 (Q21, Q24):** la **tasa es obligatoria** en `InviteStaffSheet` (sin valor por defecto; ayuda «habitual 10 %»; zod `0..100` con dos decimales) y se muestra en la lista de invitaciones; `StaffRow` añade la columna **TOTP** (`mfa_enrolled`). E2E añade: invitar sin tasa → error de validación; la fila de Carla muestra «TOTP: no» en el seed.

**Objetivo:** `/admin/equipo` según PANT D1: `StaffRow` sobre `admin_staff_list()` (RPC de 1.8e: `user_id, role, display_name, email, disabled_at, commission_rate, telegram_linked, mfa_enrolled, contacts_count, commissions_pending`; el email sale de `auth.users` dentro del definer, nunca con el JWT), invitaciones pendientes (reenviar = `admin_staff_invite` de nuevo; anular = `delete`), `InviteStaffSheet` (email, rol, tasa **obligatoria**, nota), «Desactivar/Activar» (`admin_staff_set`), «Reasignar cartera a…» (`admin_reassign_contacts`), editar tasa. Cada SA con `requireAdmin()`.

**Ficheros:** `app/[locale]/(private)/admin/equipo/page.tsx`, `.../equipo/actions.ts`, `components/team/{staff-row,invite-staff-sheet,reassign-sheet}.tsx`, `lib/team/invite.ts` (zod del email + tasa 0..100), `lib/team/invite.test.ts`, `e2e/admin-team.spec.ts`, `messages/es/admin.json`.

**Pasos:** 1. Test: tasa `101` → error; email inválido → error. E2E: Jose invita `nuevo@test` como closer al 12 % → aparece pendiente; (helper) crea el usuario y hace login → `claim_staff_access` → `/crm` accesible → fila en Equipo con 12 %; Jose lo desactiva → su `/crm` → 404; Jose reasigna la cartera de Dani a Carla → Carla ve el contacto. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(web): admin team — staff invites, enable/disable, commission rate and portfolio reassignment"`.

**Hecho cuando:** E2E en verde; `staff_invites` caducadas no se pueden reclamar (test RLS de 1.8e).

### Tarea 6.14 — Reglas de notificación (D3) y ajustes del closer (K7: vincular Telegram)

**Agente:** implementador-web · **Carril:** F3 · **Día:** 3 · **Gate:** no · **Recortable** (las reglas quedan sembradas por migración) · **Depende de:** 6.1, 3.8b (gateway resuelve destinatarios y enlaza códigos)

**Objetivo:** `/admin/notificaciones` con `RuleMatrix` (evento × destinatario × canal; cada `Switch` con nombre accesible; «Añadir persona concreta»; «Enviar prueba» → `POST /api/v1/notify/test` del gateway con JWT admin); `/crm/ajustes` con `TelegramLinkCard` (`rpc('staff_telegram_begin')` → código, caducidad, estado vinculado por `staff_members.telegram_chat_id` propia) y lectura de las reglas que me afectan. SA `setRule(event, recipient, channel, enabled, recipient_user_id?)` (upsert) con `requireAdmin()`.

**Ficheros:** `app/[locale]/(private)/admin/notificaciones/page.tsx` + `actions.ts`, `app/[locale]/(staff)/crm/ajustes/page.tsx` + `actions.ts`, `components/team/rule-matrix.tsx`, `components/crm/telegram-link-card.tsx`, `lib/notifications/events.ts` (catálogo de eventos con descripción es), `lib/notifications/events.test.ts` (todo evento de DATOS §14.6 tiene descripción), `e2e/admin-notifications.spec.ts`.

**Pasos:** 1. Test del catálogo. E2E: Jose desactiva «Historia propuesta → Dueño» → fila `enabled=false`; Carla genera código en Ajustes → se muestra con caducidad. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(web): notification rules matrix for admin and telegram linking for staff"`.

**Hecho cuando:** E2E en verde; la matriz es una `<table>` navegable con teclado.

### Tarea 3.1b — Build con `content/overrides`: fusión de mensajes, FAQ, proyectos, settings y posts `.md`; `i18n:check` ampliado

**Agente:** implementador-web · **Carril:** F2 · **Día:** 1 · **Gate:** no · **Depende de:** 2.1 (`i18n:check`, catálogos), 3.1 (loaders de contenido; si 3.1 no ha mergeado, esta tarea crea `lib/content/overrides.ts` y 3.1 lo consume) · **Coordinación con A/B:** ficheros exclusivos; en `scripts/generate*` y `i18n/request.ts` solo **una línea** de integración cada uno

**Objetivo:** `content/overrides/{messages.es,messages.en,faq,projects,settings}.json` (vacíos y versionados: `{}`/`[]`) + `content/blog/*.md` del admin. `scripts/merge-overrides.ts`: `mergeMessages(base, overrides)` (solo claves existentes, solo `EDITABLE_NAMESPACES`; lo demás → error de build con la clave), salida `content/generated/messages.<locale>.json` que `i18n/request.ts` carga en lugar de los catálogos sueltos; `lib/content/overrides.ts`: `applyFaqOverrides`, `applyProjectOverrides` (textos + `published`), `readSiteSettings()` (zod `SiteSettings` con valores por defecto); `getSectionAvailability()` **lee `settings.sections`** además de la regla de producción (sección oculta si el admin la apaga aunque haya contenido); `pricing` display: `settings.prices.showPrices` consumido por `PackCompare`/`PackStrip` (**v3.4:** sin `hiddenPacks`/`visiblePacks`: lo oculto no está en `content/pricing.json`, tarea 3.1c). `i18n:check` añade: override con clave inexistente, namespace fuera de lista o valor con `{{DATO}}` → fallo; posts `.md` con frontmatter inválido → fallo; `.md` con JSX/HTML (`mdxJsxFlowElement`, `mdxjsEsm`, `html`) → fallo.

**Ficheros:** `content/overrides/*.json`, `apps/web/scripts/merge-overrides.ts`, `apps/web/scripts/merge-overrides.test.ts`, `apps/web/lib/content/overrides.ts`, `lib/content/overrides.test.ts`, `lib/content/namespaces.ts` (`EDITABLE_NAMESPACES`, `ADMIN_ONLY_NAMESPACES`), `apps/web/scripts/i18n-check.ts` (ampliación), `lib/content/sections.ts` (`getSectionAvailability` lee settings), `packages/types/src/schemas/content.ts` (compartido con 1.8e: quien llegue primero lo crea), `open-next.config.ts`/`package.json` (`generate` llama a `merge-overrides`).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// apps/web/scripts/merge-overrides.test.ts
import { it, expect } from 'vitest';
import { mergeMessages } from './merge-overrides';
const base = { services: { hero: { title: 'A' } }, auth: { login: { title: 'L' } } };
it('overrides an existing editable key', () => expect(mergeMessages(base, { 'services.hero.title': 'B' }).services.hero.title).toBe('B'));
it('rejects unknown keys, non-editable namespaces and {{DATO}}', () => {
  expect(() => mergeMessages(base, { 'services.hero.nope': 'x' })).toThrow('unknown_key services.hero.nope');
  expect(() => mergeMessages(base, { 'auth.login.title': 'x' })).toThrow('namespace_not_editable auth');
  expect(() => mergeMessages(base, { 'services.hero.title': '{{DATO}}' })).toThrow('dato_placeholder');
});
```
```ts
// apps/web/lib/content/overrides.test.ts
it('a section switched off by settings is unavailable even with content', () => expect(getSectionAvailability({ env: 'production', guides: 3, demos: 2, settings: { sections: { blog: false, lab: true, partners: true, projects: true, chat: true } } }).blog).toBe(false));
```
- [ ] 2. → FAIL. 3. Implementar; `pnpm build` genera y la home sigue estática (`.open-next` sin rutas dinámicas nuevas: comprobar con el manifiesto de OpenNext en un test de build existente de 2.4). 4. → PASS; `pnpm i18n:check`. 5. Commit: `git commit -m "feat(web): content overrides layered over messages, faq, projects and settings at build time with i18n checks"`.

**Hecho cuando:** con overrides vacíos la salida es idéntica a hoy (test de igualdad); con un override de prueba el HTML prerrenderizado de `/servicios` cambia; `i18n:check` falla ante cada caso inválido.

### Tarea 6.15a — Contenido (D2): textos es/en, secciones y precios visibles, vista previa (Draft Mode), publicar, publicaciones y versiones

**Agente:** implementador-web · **Carril:** F2 · **Día:** 2 · **Gate:** no · **Depende de:** 3.1b, 6.1, 1.8e; el commit real lo hace 3.8c (hasta entonces la publicación queda `queued` y la pantalla lo dice)

**Objetivo:** `/admin/contenido?tab=textos|secciones|publicaciones` según PANT D2. Paso 0 (1 h, **spike de riesgo**): `draftMode().enable()` en una SA, `i18n/request.ts` con `draftMode().isEnabled && isAdmin` → `rpc('content_draft_snapshot')` fusionado; probar en `wrangler dev` que la home muestra el borrador solo con la cookie **y** sesión admin; si OpenNext no lo honra, aplicar el respaldo de DATOS §14.5 (ruta dinámica de vista previa) y anotarlo. `ContentSearch` + `OverrideEditor` (base en gris desde `content/generated/messages.<locale>.json` servido por un loader de servidor, override editable es/en, estados), `SectionSwitches` (**v3.4:** solo secciones y `showPrices`; la lista de packs/extras ya no está aquí: pestaña Precios de **6.16**), `PublishSheet` (lista de entradas con `draft is distinct from published` → `rpc('content_publish')`; estado de la publicación con pasos; **v3.4:** añade la línea «Catálogo de precios» cuando `md5(pricing_catalog_snapshot()::text) <> pricing_settings.published_hash`), `VersionList` + `ContentDiff` por entrada con «Volver a esta versión» → `rpc('content_rollback')`. `DraftBanner` en el layout público (solo con Draft Mode). SA `saveDraft`, `discardDraft`, `publish`, `rollback`, `enablePreview`, `disablePreview` con `requireAdmin()`.

**Ficheros:** `app/[locale]/(private)/admin/contenido/page.tsx`, `.../contenido/actions.ts`, `components/content-admin/{content-search,override-editor,section-switches,publish-sheet,version-list,content-diff}.tsx`, `components/layout/draft-banner.tsx`, `lib/content/draft.ts` (`loadDraftMessages(locale)` con `React.cache`), `lib/content/draft.test.ts`, `i18n/request.ts` (una rama), `e2e/admin-content.spec.ts`.

**Pasos:**
- [ ] 1. Tests que fallan: `lib/content/draft.test.ts`: `mergeDraft(base, snapshot)` aplica `messages` del snapshot y deja intacto lo demás; snapshot `null` → base. E2E: Jose edita `services.hero.title` es → «1 cambio sin publicar» → Vista previa abre `/servicios` con el título nuevo y la banda; en otro contexto sin cookie el título sigue el viejo; Publicar → fila `queued` en Publicaciones; Volver a la versión 0 → nueva publicación.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; `web-design-guidelines`; axe. 5. Commit: `git commit -m "feat(web): admin content editor — message overrides, sections and price visibility, draft preview, publish, versions and rollback"`.

**Hecho cuando:** E2E en verde; la home de producción (sin cookie) **no** hace ninguna consulta a Supabase (test: `wrangler dev` con `SUPABASE_URL` roto → `/` sigue en 200); un visitante con la cookie `__prerender_bypass` robada pero sin sesión admin ve el contenido publicado.

### Tarea 6.15b — Contenido (D2): FAQ, proyectos y posts del blog en Markdown

**Agente:** implementador-web · **Carril:** F2 · **Día:** 3 · **Gate:** no · **Recortable** la pestaña Blog · **Depende de:** 6.15a, 3.1b, 4.2 (pipeline del blog)

**Objetivo:** pestañas FAQ (por vía, ordenar, es/en, publicar/ocultar → entradas `faq`), Proyectos (textos es/en + visible → entradas `project`) y Blog (`MarkdownEditor` con vista previa server-rendered por el pipeline de 4.2; frontmatter con zod; es y en como dos entradas enlazadas por slug; «Publicar/Despublicar»). La SA `saveBlogDraft` **compila** el Markdown con `@mdx-js/mdx` (dependencia ya presente por 4.2) y rechaza nodos `mdxJsxFlowElement`, `mdxJsxTextElement`, `mdxjsEsm` y `html` con mensaje «Sin componentes ni HTML».

**Ficheros:** `components/content-admin/{faq-editor,project-editor,markdown-editor}.tsx`, `lib/content/markdown-guard.ts`, `lib/content/markdown-guard.test.ts`, `e2e/admin-content.spec.ts` (ampliado).

**Pasos:** 1. Test: `assertPlainMarkdown('# Hola\n\n<Demo />')` lanza `jsx_not_allowed`; `'<script>'` lanza `html_not_allowed`; Markdown normal pasa. E2E: Jose crea un post es/en `kind: guide` y lo publica → publicación con dos ficheros `content/blog/<slug>.{es,en}.md` en el snapshot; oculta una FAQ → desaparece del snapshot `faq.json`. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(web): admin content — faq, project texts and markdown blog posts with guarded compilation"`.

**Hecho cuando:** E2E en verde; un post con JSX nunca llega a `site_content_entries`.

### Tarea 3.8b — Gateway: destinatarios por `notification_rules`, correos transaccionales de plantilla fija y vinculación de Telegram

**Agente:** implementador-web · **Carril:** D · **Día:** 1–2 · **Gate:** no (los secretos van en 1.9c/9.4) · **Depende de:** 1.8c (`outbox.drain`), 1.8e

**Objetivo:** en `outbox.drain`, sustituir la lista fija por `rpc('notification_recipients', {p_event, p_owner_id})` (caché 5 min por evento en memoria del isolate) y entregar por canal: Telegram (adaptador existente) o **email** con `adapters/email.ts` (Resend; puerto `EmailSender` en `@josecoded/types/api.ts`) **solo** para las plantillas fijas `apps/api/src/templates/{staff-invited,client-invited,story-decided}.{es,en}.ts` (sin cuerpo editable: test negativo de envío ampliado para que `sendEmail` solo acepte `templateId` del catálogo). Evento `client` → email del cliente via `auth.admin.getUserById` o `clients.invite_email` del payload. Job `telegram.poll_updates` (`getUpdates` con offset en `quota_counters` `telegram.update_offset`; solo `/start <code>` → `rpc('staff_telegram_link')`). Ruta `POST /api/v1/notify/test` (admin, `aal2`) → Telegram al admin. `lead.created` incluye `owner_id` en el aviso al dueño. **v3.4 (Q24):** middleware **`requireStaff`** en `middlewares/auth.middleware.ts` junto a `requireAdmin`: `staff_members` activo (`disabled_at null`) **y** `aal2` (misma excepción `ADMIN_REQUIRE_MFA === 'false'`), 403 `mfa_required` / 404 si no es staff; aún no lo usa ninguna ruta del lanzamiento (6.8 y Radar lo consumirán), pero queda con test para que ninguna ruta futura acepte un closer con `aal1`. Correo `staff-invited` menciona que el primer acceso pide un autenticador.

**Ficheros:** `apps/api/src/adapters/email.ts`, `adapters/email.contract.test.ts` (fetchMock), `src/services/notifications.service.ts` (`resolveRecipients`, `deliver`), `services/notifications.service.test.ts`, `src/templates/*.ts`, `src/jobs/telegram-poll.ts`, `jobs/telegram-poll.test.ts`, `src/modules/notify.routes.ts`, `routes-manifest.ts` + snapshot, `test/no-send.test.ts` (ampliado: `sendEmail` solo con `templateId`), `.dev.vars.example` (`RESEND_API_KEY`).

**Pasos:** 1. Tests que fallan: `resolveRecipients('story.proposed', {owner_id})` con reglas falsas devuelve admin + owner; sin reglas → `[]`; `deliver` con un `templateId` desconocido → lanza; `telegram-poll` enlaza un `/start ABCDEFGH` y ignora el resto. 2. FAIL. 3. Implementar. 4. PASS en workerd. 5. Commit: `git commit -m "feat(api): notification rules resolution, fixed transactional email templates and telegram linking job"`.

**Hecho cuando:** tests en verde; `grep -r "gmail" apps/api/src` vacío; `no-send.test.ts` prueba que ningún `send` acepta cuerpo libre.

### Tarea 3.8c — Gateway: publicación de contenido al repo con la GitHub App (`contentPublish`) y vigilancia del despliegue

**Agente:** implementador-web · **Carril:** D · **Día:** 2 · **Gate:** no (secretos en 1.9c/9.4) · **Depende de:** 1.8e, 3.8b

**Objetivo:** adaptador `adapters/github.ts` (puerto `RepoWriter`): JWT RS256 de la App con `crypto.subtle` (`importKey` PKCS8 desde `GITHUB_APP_PRIVATE_KEY`), token de instalación (caché 50 min), **Git Data API**: `getRef(main)` → `createBlob`×n → `createTree(base_tree, entries)` (entradas `sha: null` para borrar posts despublicados) → `createCommit(message, author: josecoded-bot[bot])` → `updateRef` (fast-forward; un reintento si 422); `getWorkflowRunForSha(sha)`. Handler del evento `content.publish_requested` en `outbox.drain`: lee la publicación (`service_role`), escribe los ficheros del snapshot, `rpc('content_publication_mark', {status:'committed', commit_sha, files})`; en error → `failed` + `content.deploy_failed`. Job `content.poll_deploy` (`*/5`): publicaciones `committed` → estado del run de `deploy-production.yml` para ese sha → `deployed` (+ `content.deployed`) o `failed`. Mensaje de commit `content: publish <n> entries (<publication_id>)` sin trailers de IA (es el bot). Límite: 60 ficheros por publicación.

**Ficheros:** `apps/api/src/adapters/github.ts`, `adapters/github.contract.test.ts` (fetchMock estricto: secuencia exacta de llamadas, cuerpo del árbol), `src/services/content-publish.service.ts` (`buildTree(snapshot)` puro: rutas permitidas solo bajo `content/overrides/`, `content/blog/` **y el fichero exacto `content/pricing.json`** (v3.4, D54); cualquier otra → lanza), `services/content-publish.service.test.ts`, `src/jobs/content-poll-deploy.ts` + test, `config/env.ts` (`GITHUB_APP_*` opcionales; sin ellos el handler marca `failed: github_not_configured`), `.dev.vars.example`.

**Pasos:** 1. Tests que fallan: `buildTree` rechaza `apps/web/x.ts` (`path_not_allowed`), produce `sha: null` para un post despublicado, serializa JSON con salto final; contrato: con fetchMock la secuencia es ref → blobs → tree → commit → ref y el `updateRef` lleva `force: false`. 2. FAIL. 3. Implementar. 4. PASS. 5. Commit: `git commit -m "feat(api): content publication to the repo via GitHub App (git data api) and deploy status polling"`.

**Hecho cuando:** tests en verde; `wrangler dev --test-scheduled` con secretos de un repo de prueba (opcional, Jose) crea el commit; sin secretos, la publicación queda `failed: github_not_configured` y D2 lo muestra.

### Tarea 3.1c — Fuente de precios publicada (D54): `@josecoded/pricing` lee `content/pricing.json`; `pricing:sync-db` como carga inicial; `pricing:pull`

**Agente:** implementador-web · **Carril:** F2 · **Día:** 1 (tarde, tras 3.1b) · **Gate:** no · **Depende de:** 1.4 (hecha), 3.1b (`content/` y `generate`), 1.8e (RPC `pricing_catalog_snapshot` para el test de paridad; si no ha llegado, el test usa el fixture del seed)

**Objetivo:** `git mv packages/pricing/pricing.json content/pricing.json` (valores intactos: es la «publicación cero»); `packages/pricing/src/data.ts` importa `../../../content/pricing.json` (ruta resuelta en `tsconfig` `paths`/`resolveJsonModule` como hoy) y valida con `pricingSchema`; `schema.ts` acepta `visible?`/`active?` opcionales; `scripts/sync-from-tarifas.ts` y el test `pricing.json equals tarifas.md` **se borran** (`pricing:sync` sale de `package.json` raíz y del paquete); `scripts/sync-db.ts` lee `content/pricing.json`, escribe `supabase/generated/pricing-sync.sql` con **todas** las columnas nuevas (`name`, `includes`, `for_whom`, `kind`, `billing`, `visible`, `pricing_settings`) y **se niega** (`exit 2`, mensaje «la base ya es la fuente: usa D2») si `select count(*) from pricing_price_history` > 0; `scripts/pull.ts` (`pricing:pull`): `rpc('pricing_catalog_snapshot')` con la clave secreta local → `content/pricing.json` formateado (2 espacios, salto final; mismo serializador que usará el bot: `stableStringify` compartido en `packages/pricing/src/serialize.ts`, que 3.8c **reutiliza** en `buildTree` para que el commit del bot y `pricing:pull` produzcan bytes idénticos). `supabase/seed.sql` §3 se regenera con `pricing:sync-db --seed` (salida a `seed.sql` en vez de `generated/`). Consumidores web (2.14, 3.2, 2.11, `llms`, área) **no cambian de código**: siguen importando `@josecoded/pricing`. Tests existentes que leen `../pricing.json` pasan a `content/pricing.json`.

**Ficheros:** `content/pricing.json` (movido), `packages/pricing/src/{data,schema,serialize}.ts`, `packages/pricing/scripts/{sync-db,pull}.ts`, `packages/pricing/test/*.test.ts` (rutas; test nuevo `snapshot matches pricingSchema and the published file` con fixture `supabase/test/fixtures/pricing-snapshot.json` exportado por 1.8e), `packages/pricing/package.json`, `package.json` raíz (`pricing:pull`; quitar `pricing:sync`), `turbo.json`, `supabase/seed.sql` (§3), `apps/web/components/home/services-data.test.ts` y `apps/web/lib/seo/jsonld.test.ts` (solo la ruta del fichero de referencia), `README.md` (scripts).

**Pasos:**
- [ ] 1. Tests que fallan:
```ts
// packages/pricing/test/published-file.test.ts
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { pricing } from '../src';
import { pricingSchema } from '@josecoded/types';
import { stableStringify } from '../src/serialize';
it('loads the published catalogue from content/pricing.json', () => {
  const file = JSON.parse(readFileSync(new URL('../../../content/pricing.json', import.meta.url), 'utf8'));
  expect(pricing).toEqual(pricingSchema.parse(file));
});
it('the seed snapshot has the same shape and values as the published file (except version)', () => {
  const snap = JSON.parse(readFileSync(new URL('../../../supabase/test/fixtures/pricing-snapshot.json', import.meta.url), 'utf8'));
  const { version: _a, ...a } = pricingSchema.parse(snap); const { version: _b, ...b } = pricing;
  expect(a).toEqual(b);
});
it('stableStringify is deterministic and ends with a newline', () => {
  expect(stableStringify({ b: 1, a: [2, 1] })).toBe('{\n  "a": [\n    2,\n    1\n  ],\n  "b": 1\n}\n');
});
```
```ts
// packages/pricing/test/sync-db.test.ts (añadido)
it('refuses to run when the database already has price history', async () => {
  await expect(syncDb({ countHistory: async () => 3, apply: async () => {} })).rejects.toThrow('db_is_source');
});
```
- [ ] 2. → FAIL. 3. Implementar; `pnpm -r test`, `pnpm build` (la home sigue estática y los precios de `/servicios` no cambian: test de 3.2 en verde). 4. → PASS; `grep -r "packages/pricing/pricing.json"` vacío en el repo. 5. Commit: `git commit -m "feat(pricing): published catalogue in content/pricing.json, initial-load guard for sync-db, pricing:pull and shared stable serializer (D54)"`.

**Hecho cuando:** tests en verde; `pnpm pricing:sync` ya no existe; `pnpm pricing:sync-db` contra la base local **recién reseteada** genera el SQL y, tras un cambio de precio por RPC, se niega; `pnpm pricing:pull` deja `content/pricing.json` sin diff respecto al seed.

### Tarea 3.7b — Gateway: puerto `PricingSource` sobre `pricing_published()` para el generador, la guarda de IA y `pricingVersion`

**Agente:** implementador-web · **Carril:** D · **Día:** 2 (antes de 3.8c) · **Gate:** no · **Depende de:** 3.7 (hecha), 1.8e (RPC `pricing_published`), 1.8c (adaptador Supabase con clave secreta)

**Objetivo:** el gateway deja de depender del fichero compilado para los precios **en producción**: puerto `PricingSource { get(): Promise<PricingData> }` en `@josecoded/types/api.ts`; adaptador `adapters/pricing.supabase.adapter.ts` (`rpc('pricing_published')` con la clave secreta, caché en memoria del isolate 5 min como `chat_context_published`; `null` o error → **respaldo** al `pricing` de `@josecoded/pricing` y log `pricing_unavailable`); falsa `test/fakes/pricing.fake.ts`. `buildDeps(env)` lo añade; `proposals.service` (`priceForProposal`, prompt del clasificador con `includes`), `ai-guard` (`allowedAmounts` = todos los `price` del catálogo publicado + `hourly` + `feature`, que hoy salen del fichero), `proposalToken.pricingVersion`, `assistant.service` (4.4) y `drafts` (6.8) reciben `deps.pricing` y llaman a `await deps.pricing.get()` **una vez por petición**. Las funciones puras de `@josecoded/pricing` (`priceForProposal(pack, extras, data?)`, `computeUpgrade(..., data?)`) ganan un último argumento opcional `data: PricingData` (por defecto el fichero) para poder recibir el catálogo publicado sin romper a la web.

**Ficheros:** `packages/types/src/api.ts` (`PricingSource`), `packages/pricing/src/{proposal-price,upgrade}.ts` (argumento opcional), `apps/api/src/adapters/pricing.supabase.adapter.ts` + `pricing.supabase.contract.test.ts` (fetchMock: una llamada, segunda desde caché, `null` → respaldo), `apps/api/test/fakes/pricing.fake.ts`, `apps/api/src/deps.ts`, `src/services/{proposals,assistant}.service.ts`, `src/utils/ai-guard.ts` (+ test: un importe que solo existe en el catálogo publicado pasa; uno que solo existe en el fichero compilado **no**), `src/services/proposal-token.ts` (`pricingVersion` del catálogo publicado), tests existentes de 3.7/4.4 con la falsa.

**Pasos:** 1. Tests que fallan: `createProposalsService({ pricing: fakePricing({ P2: 1500 }) })` → `priceFrom 1500`; `guardModelOutput('cuesta 1500 €', 'es', { allowed })` pasa con el catálogo publicado y cae a reglas con el compilado; adaptador: `pricing_published` → `null` → devuelve el fichero y registra `pricing_unavailable`. 2. FAIL. 3. Implementar. 4. PASS en workerd. 5. Commit: `git commit -m "feat(api): PricingSource port over pricing_published() with cache and compiled fallback for proposals, ai guard and token version (D54)"`.

**Hecho cuando:** tests en verde; con la base local y un precio cambiado **sin publicar**, el generador sigue devolviendo el publicado; tras `content_publish()` y ≤ 5 min, devuelve el nuevo.

### Tarea 6.16 — Contenido (D2): pestaña **Precios** — packs, opciones, extras, tarifa por hora, historial y publicación del catálogo

**Agente:** implementador-web · **Carril:** F2 · **Día:** 3 (antes de 6.15b) · **Gate:** no (**nunca recortable**: sin ella el admin no puede corregir un precio y la fuente ya no es el repo) · **Depende de:** 6.15a (`PublishSheet`, pestañas), 1.8e (RPC `admin_pricing_*`, `pricing_catalog_snapshot`), 3.1c

**Objetivo:** `/admin/contenido?tab=precios` según PANT v2.2 D2: `PriceTable` para packs (con opciones anidadas) y extras, `PriceItemSheet` (hoja de edición/alta: código, nombre es/en, incluye/descripción es/en, para quién, precio, semanas, facturación, en venta, visible, orden), borrar con `ConfirmDialog` (texto: «borrado lógico: los clientes que lo tienen lo siguen viendo») y restaurar desde «Borrados», tarifa por hora y «función», `PriceHistory` desplegable por fila (`pricing_price_history`), `PendingPricesBand` («Precios cambiados sin publicar») alimentada por `md5(pricing_catalog_snapshot()::text) <> published_hash`; **Publicar** es el de 6.15a (añade la línea «Catálogo de precios»). SA `savePack`, `saveOption`, `saveExtra`, `deletePriceItem`, `restorePriceItem`, `saveSettings` con zod (`PackInput`, …) y `requireAdmin()`; `lib/content/pricing-admin.ts`: `diffCatalog(snapshot, published)` (lista legible de cambios para la hoja de publicación: «P2: 1.400 → 1.500 €», «Nuevo extra: …», «Oculto: …») con test.

**Ficheros:** `app/[locale]/(private)/admin/contenido/precios/*.tsx` (o rama de `page.tsx` por `tab`), `.../contenido/pricing-actions.ts`, `components/content-admin/{price-table,price-item-sheet,price-history,pending-prices-band}.tsx` + CSS Modules, `lib/content/pricing-admin.ts` + test, `e2e/admin-pricing.spec.ts`, `messages/es/admin.json`.

**Pasos:**
- [ ] 1. Tests que fallan: `diffCatalog` con P2 1400→1500, extra nuevo y pack oculto → tres líneas en español; sin cambios → `[]`. E2E: Jose cambia P2 a 1.500 → historial muestra «1.400 → 1.500 €» y la banda aparece; `/servicios` **sigue** mostrando 1.400 (no publicado); Publicar → la hoja lista «Catálogo de precios: P2 1.400 → 1.500 €» → publicación `queued` cuyo snapshot contiene `content/pricing.json` con 1.500; crea el extra `copywriting` oculto → no aparece en el snapshot; borra `seo_basic` → confirmación, desaparece de la lista y del snapshot, sigue en «Borrados» y en los `client_extras` del seed; Carla en `/admin/contenido` → 404.
- [ ] 2. → FAIL. 3. Implementar. 4. → PASS; `web-design-guidelines`; axe (tablas con `<caption>`, hojas con foco gestionado); capturas 390/900/1440; Jose aprueba en preview. 5. Commit: `git commit -m "feat(web): admin pricing catalogue — packs, options, extras, hourly rate, price history and publication diff (D54)"`.

**Hecho cuando:** E2E en verde; ningún precio se escribe fuera de las RPC (`update packs` directo desde la SA no existe); el snapshot publicado valida con `pricingSchema`.

### Tarea 6.17 — Contacto (K3): **Presupuestos a medida** compuestos de extras, con descuento solo admin

**Agente:** implementador-web · **Carril:** F3 · **Día:** 3 (antes de 6.14) · **Gate:** no · **Recortable** (por detrás de 6.14, 6.15b Blog y Telegram de K7: el esquema y las RPC ya están en 1.8e; hasta que exista la pantalla el presupuesto se hace en Notion, D42) · **Depende de:** 6.2 (K3), 1.8e (RPC `quote_*`), 3.1c (nombres de extras desde las tablas, no del fichero: aquí sí se muestran los ocultos)

**Objetivo:** pestaña **Presupuestos** en `/crm/contactos/[id]` (PANT v2.2 K3): `QuoteList`, hoja «Nuevo presupuesto» con `QuoteComposer` (buscador de `extras where deleted_at is null and active` **incluidos los `visible = false`**, líneas con cantidad, subtotal, línea Descuento —editable solo para admin, en gris para el closer con «lo fija Jose»—, total «sin IVA»), `QuoteStatusActions` («Copiar texto» es/en con plantilla fija, «Marcar enviado», «Aceptado / Rechazado / Caducado»); los `sent` no se editan (botón «Duplicar»). SA `createQuote`, `addQuoteItem`, `removeQuoteItem`, `setQuoteQuantity`, `setQuoteDiscount` (**`requireAdmin()` dentro**), `markQuoteSent`, `decideQuote` → RPC `quote_*`/`admin_quote_set_discount`; `requireStaff()` en todas. `lib/crm/quotes.ts`: `quoteText(quote, items, locale)` (plantilla fija, importes con `formatEur`) y `canEditQuote(status)` con test.

**Ficheros:** `app/[locale]/(staff)/crm/contactos/[id]/presupuestos/*.tsx` (o pestaña dentro de la página de 6.2), `.../contactos/quote-actions.ts`, `components/crm/quotes/{quote-list,quote-composer,quote-status-actions}.tsx` + CSS Modules, `lib/crm/quotes.ts` + test, `e2e/crm-quotes.spec.ts`, `messages/es/crm.json`.

**Pasos:** 1. Tests que fallan: `quoteText` con dos líneas y descuento → texto con subtotal 1.188 €, descuento 100 €, total 1.088 € «sin IVA»; `canEditQuote('sent') === false`. E2E: Carla crea un presupuesto con `seo_full` × 1 y `maintenance_basic` × 12 → total 1.188 €; no puede poner descuento (campo deshabilitado; la SA con su sesión → error); Jose pone 100 € de descuento → total 1.088 €; Carla marca enviado → estado «enviado», Telegram al admin (outbox), no editable, «Duplicar» crea un `draft` igual; Carla por URL un presupuesto de un contacto de Jose → 404. 2. FAIL. 3. Implementar. 4. PASS; axe; capturas. 5. Commit: `git commit -m "feat(web): custom quotes built from extras with admin-only discount, copyable text and status flow (D54)"`.

**Hecho cuando:** E2E en verde; ningún importe se escribe a mano (todas las líneas vienen de `extras`); cambiar el precio de un extra después no altera un presupuesto existente.

### Tarea 9.7 — Día 4: puerta de calidad completa + pentest ligero (lista cerrada)

**Agente:** `/puerta-calidad` (qa, revisor-seguridad, revisor-accesibilidad, usuario-ejemplo, ui) + `revisor` sobre `main` del día · **Día:** 4 · **Gate:** no (9.6 es el gate) · **Depende de:** todo lo anterior mergeado y 9.4 cruzado

**Alcance del pentest (lo ejecuta `revisor-seguridad` con `qa`; herramientas: Playwright/curl/`pnpm audit`, sin dependencias nuevas; contra la preview con datos de seed, nunca contra producción):**
- [ ] **Autorización**: matriz RLS con seis cuentas (`rls.test.ts` + `pg/*.sql`); **IDOR** en toda ruta `[id]` (`/crm/contactos`, `/crm/clientes`, `/admin/*/[id]`, `/area-clientes/historias`) con ids ajenos → 404; closer desactivado → 404 en la siguiente petición; `aal1` en `/crm`/`/admin` → redirección a seguridad; Server Actions llamadas directamente con otra sesión (reproducir el `POST` con `Next-Action`) → error.
- [ ] **Entrada**: CSV con 501 filas, 1 MB+1, celdas de 100 KB, `=HYPERLINK()`/`+cmd`, UTF-16, separadores mixtos → errores controlados, nada ejecutado ni enlazado; Markdown con `<script>`, `<img onerror>`, `javascript:` en enlaces y JSX → rechazado; overrides con `{{DATO}}`, claves nuevas, namespaces `auth` → rechazados en SA y en `i18n:check`.
- [ ] **Vista previa**: cookie `__prerender_bypass` sin sesión admin → contenido publicado; con sesión de closer → publicado; cabecera `Cache-Control` de páginas en Draft Mode `private, no-store`.
- [ ] **Publicación**: `buildTree` no puede escribir fuera de `content/`; permisos de la App solo `contents`; `deploy-production.yml` no se dispara por `pull_request` de forks; commit del bot no lleva secretos.
- [ ] **Dinero**: aprobar/pagar comisión y «Cerrar cobrado» exigen admin + confirmación; un closer no puede llamar a las RPC (42501); importes con 2 decimales y sin negativos (check en BD: añadir si falta). **v3.4 (D54, Q21):** `update packs/extras/pricing_settings` directo como admin → 42501 (solo RPC, historial completo); un closer con `admin_pricing_*` o `admin_quote_set_discount` → `forbidden`; `discount_amount` por `update` directo → 42501; cambiar la tasa de un closer no altera `closer_commissions.percent` existentes; un presupuesto `sent` no admite `quote_add_item`.
- [ ] **Fichero público de precios (D54)**: `content/pricing.json` publicado y el snapshot de la última publicación **no** contienen ningún pack/extra con `visible = false` ni `deleted_at`, ni descuentos ni presupuestos (grep del snapshot con los códigos ocultos del seed); el repo es público (9.5b), así que esto es una fuga si falla. `pricing_published()` sin `service_role` → 42501.
- [ ] **TOTP de closers (Q24)**: Carla con `aal1` → `/crm` redirige a `/perfil/seguridad` y las SA de `/crm` llamadas directamente → error; middleware `requireStaff` del gateway con `aal1` → 403 `mfa_required`; `admin_staff_list().mfa_enrolled` coherente con `auth.mfa_factors`.
- [ ] **Notificaciones**: payloads de Telegram sin emails ni teléfonos de terceros (solo nombre e importes); correos transaccionales solo a emails ya registrados; `notify/test` solo admin.
- [ ] **Plataforma**: cabeceras de seguridad (carril B) presentes en `/crm`, `/admin`, `/area-clientes`; `pnpm audit --prod` sin críticas; `git grep` de secretos (patrón de 9.5b) vacío; `get_advisors` producción a cero (de 1.9c); rate limit del gateway en `notify/test` e `imports` (la SA está detrás de sesión; cuota 10 importaciones/h por usuario con `increment_quota` desde la SA → **añadir si falta**).
- [ ] **Puerta funcional**: `usuario-ejemplo` con las personas de 9.5 (v3.3) incluidas Carla y Ana-historias; `qa` E2E completos en Chromium y WebKit; `ui` sobre capturas de `/crm`, `/admin/contenido`, A8 a 390/900/1440; `revisor-accesibilidad` WCAG 2.2 AA en K2, K4, K6, A8, D2, D3.

**Pasos:** 1. `revisor` sobre el diff acumulado del día 1–3. 2. `/puerta-calidad` con la lista de arriba como insumo adicional de `revisor-seguridad`. 3. Hallazgos → `implementador-web` (por carril) → repetir hasta cinco PASA. 4. Informe de pentest en `docs/security/2026-11-pentest-launch.md` (hallazgos, severidad, estado; sin datos sensibles) y `ESTADO.md`. 5. Commit: `docs: launch quality gate and light pentest report`.

**Hecho cuando:** los cinco revisores PASA; ningún hallazgo alto o crítico abierto; los medios aceptados por Jose por escrito en `ESTADO.md`; Jose aprueba la preview en el navegador → 9.6.

---

## Fase 7 — Radar como **módulo del CRM** (post-lanzamiento, D43) · Estimación XL · ramas `feat/radar-core`, `feat/radar-connectors`, `feat/radar-api`, `feat/radar-admin`, `feat/radar-mail-calendar`

> **v3.0 (D43):** la fase completa va **después de 9.6**, sin válvula por fecha. Cambios aditivos al ejecutarla: (a) 7.6 añade `radar_applications.contact_id uuid references crm_contacts(id)` y, al preparar una candidatura, crea o enlaza el contacto `kind='recruiter'` (+ `crm_organizations` por empresa) y una `crm_interactions(kind='note', payload: {offer})`; los correos vinculados (7.22) crean `crm_interactions(kind='message_received', channel='email')`; (b) las pantallas 7.25–7.29 viven bajo **`/admin/crm/radar/*`** y la bandeja aparece en «Más» y en el Resumen («Radar hoy») solo cuando el módulo existe; (c) el borrador de seguimiento en Gmail (7.22) reutiliza `crm_message_drafts` y el OAuth de Google de 7.20 habilita también `POST /crm/drafts/:id/gmail-draft` (6.8, Q20); (d) `/seguimiento` de `claude-config` pasará a leer `next_action_at` del CRM (fuera de este repo). Todo lo demás de la fase (0.3–0.6, 7.1–7.31) sigue como en v2.2.

> **v2.3:** arranca con las comprobaciones **0.3–0.6** (InfoJobs, Browser Rendering, MCP de Indeed, Tecnoempleo), movidas desde la fase 0; sus «Hecho cuando» y fallbacks no cambian.

Fuente: spec §13, DT §11 (SQL, endpoints, cron, conectores, OAuth, Telegram, materiales, correo, tests), UX §7.12–7.18, §9.10–9.14, §10.8, §13.16–13.19. Decisiones a–j de UX §13.19 **cerradas en este plan como las resolvió el DT §11.11**: (a) perfil solo lectura + ajustes rápidos en `radar_settings`; (b) posponer = `next_action_at` + evento `snoozed`; (c) ~~`HERO_LIVE_MOBILE` medido en 2.13~~ superada en v2.0 (WebGL solo en escritorio); (d) reautorización de Google desde admin con token cifrado en KV; (e) `?correos=revisar`; (f) PDF con Browser Rendering + impresión de respaldo (según 0.4); (g) botones Confirmar · Posponer · Descartar + `url` "Ver y editar"; (h) confirmación por Telegram para envío por API solo con material visto y segundo paso "¿Seguro?" de 10 min (UX v3.2); (i) pausa con fecha y reanudación automática; (j) control de plantilla ≥ 2 referencias concretas para API. Orden pensado para la válvula de escape: 7.1–7.7 (paquetes + migraciones) → 7.8 (conectores base) → 7.16–7.19 (núcleo + Telegram) → 7.25 (bandeja) es el mínimo operativo.

Las ramas `feat/radar-core` (7.1–7.7) y `feat/radar-connectors` (7.8–7.15) **arrancan tras la fase 1**, en paralelo con las fases 2–6.

### Tarea 7.1 — `packages/radar-core`: tipos, esquemas zod, plantillas de perfil/CV/voz, `profile.meta`

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no · **Depende de:** 1.1 · **Insumos:** `profile.json` real (Q10) y CV maestro (Q15) de Jose — hasta entonces plantillas con `{{DATO}}`

> **v2.2 (stack):** los tipos y esquemas se escriben en `@josecoded/types` (`src/radar.ts`, `src/schemas/radar.ts`); `radar-core/src/types.ts` y `schemas.ts` solo reexportan (compatibilidad con el resto de la fase 7 tal como está escrita). Tras 7.6, regenerar `database.ts` (v2.2, 1.6).

> **v2.1 (eng review):** `packages/radar-core/src/cv/load.ts` (`loadCvMaster()`, convención `<!-- id: -->`) y `cv/cv.css` son la única fuente para 3.14, 7.5 y 7.21 (si 3.14 se hizo antes, ya existen aquí).

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

**Agente:** implementador-web · **Rama:** `feat/radar-core` · **Gate:** no (local) · **Depende de:** 1.6, 1.8a

> **v3.2:** `radar_applications.contact_id → crm_contacts` desde la primera migración; avisos `radar.*` por `private.outbox` (sin `notify_event`); las filas `radar.sweep/mail/daily` de `private.scheduled_jobs` se insertan en esta migración; nombres en inglés (DATOS §4.8). 7.7 aplica con `supabase db push`, sin baseline (runbook de 1.9).

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

> **v2.2 (stack), aplica a 7.16–7.24:** todo el módulo `radar/*` sigue working-agreements §17.1: puertos `RadarRepo`, `MailSource`, `CalendarClient`, `PlatformClient` (InfoJobs), `BrowserRenderer`, `Notifier`, `AiClient`, `Clock` en `@josecoded/types/api.ts`; adaptadores en `src/adapters/` (`supabase.adapter.ts` ampliado, `google.adapter.ts`, `infojobs.adapter.ts`, `browser-rendering.adapter.ts`, `n8n.adapter.ts`) con test de contrato en workerd y falsa en `test/fakes/`; los servicios (`ingest`, `sweep`, `applications`, `telegram`, `materials`, `mail`) son fábricas `create<X>Service(deps)` testeadas con las falsas; `scheduled.ts` y las rutas solo componen sobre `c.var.deps`. Los tests de `fetchMock` que ya describen 7.16–7.24 pasan a ser los tests de contrato de cada adaptador; los invariantes (`sent ⇒ confirmed_by_jose`, Gmail solo borradores, Calendar sin clic) se prueban además contra las falsas.

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

> **v2.1 (eng review):** (a) el `sweep` **no es un cron propio**: es el trabajo `radar.sweep` del despachador único (1.7) y comparte el presupuesto de ≤ 40 subpeticiones por tick; (b) **test que cuenta `fetch` y `env.AI.run` por tick** con fixtures (< 40) y **lotes dinámicos** (`RADAR_BATCH_SCORE` se calcula del presupuesto restante); (c) reducción de Radar a **tres trabajos** (DT §0b): `radar.sweep` */5, `radar.mail` cada 60 min con la lectura del calendario dentro, `radar.daily` a las 08:00 Madrid vía `nextRun` con `tz` (sin doble disparo).

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

> **v2.1 (eng review):** el cron diario y el de correo/calendario pasan a ser los trabajos `radar.daily` y `radar.mail` del despachador único (7.17); esta tarea solo implementa su contenido.

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

> **v2.1 (eng review):** evals manuales con casos repetibles en `apps/api/evals/radar.jsonl` (puntuación y redacción sobre 10 ofertas fijas) además de la validación de calidad de candidaturas.

**Ficheros:** `apps/web/e2e/radar.spec.ts` (las 5 filas de Radar de DT §8.2: confirmar desde admin asistida + marcar enviada + `mark-sent` directo → 409; confirmar desde Telegram con webhook simulado → recibo `4F7Q` + historial + reenvío idempotente + `from.id` ajeno; correo vinculado → evento propuesto → crear en Google simulado → "No era esto"; bandeja con filtros desde URL; plataformas: alta con `SecretRef` y `Probar` con fixture; perfil: umbral → toast; pausa/reanudar), `apps/web/tests/rls-radar.test.ts` (ya en 7.6; añadir `storage.objects` con Ana), `docs/superpowers/design/2026-09-xx-radar-candidaturas-validacion.md` (informe de `usuario-ejemplo` como reclutadora sobre 5 candidaturas generadas con el CV maestro real: veredicto por candidatura, hechos inventados = 0).

**Pasos:** 1. Escribir los E2E (fallan hasta ajustar). 2. `pnpm --filter web e2e -- radar` → PASS. 3. `usuario-ejemplo` (reclutadora) evalúa 5 candidaturas: si alguna tiene hechos inventados o carta genérica (< 2 referencias), se corrigen prompts/verificador (7.17/7.21) y se repite. 4. Commit: `git commit -m "test(web): radar e2e (admin, telegram, mail, calendar, platforms, pause) and recruiter validation report"`.

**Cierre de `feat/radar-admin`:** `revisor`; `/puerta-calidad` completa (`usuario-ejemplo` como Jose operador en §7.12–7.18 y §9.10–9.14, incluida la segunda pasada de §7.17/§9.11 que pide UX v3.2; `revisor-accesibilidad` en tabla, barra de decisión móvil, editor, calendario; `revisor-seguridad` en SA con `requireAdmin`, `SecretRef` sin valores); merge.

### Tarea 7.31 — **GATE**: Radar en producción (secretos, KV, crons, Telegram, Google, Mac)

**Agente:** controlador con OK de Jose (y Jose en consolas) · **Gate:** **SÍ** · **Depende de:** ramas de Radar mergeadas, 8.2–8.3 para Omen

> **v2.1 (eng review):** `api.josecoded.com` ya existe desde 3.12; aquí solo se añaden los secretos de Radar. Radar es la última etapa: este gate puede ir después del lanzamiento (D34).

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

## Fase 9 — Redirecciones desde josedev, analítica, puerta final y lanzamiento · Estimación M · rama `release/v2` (v3.0; antes `release/v1`)

### Tarea 9.1 — Redirecciones 301/410 y CORS de transición

> **v3.0:** los 301 de `/empresas`, `/negocios`, `/en/companies`, `/en/business` ya están en **3.2**; aquí quedan solo los de josedev: `/services` → `/servicios`, `/en/services` → `/en/services` (misma ruta; si josedev tenía otra, 301), `/sobre-mi` se mantiene, `/auth` → `/auth/login`, 410 de `/blog/<slug>` antiguos y `/foro/*`. El E2E cambia `/empresas` por `/servicios`. Rama `release/v2`.

**Agente:** implementador-web · **Gate:** no · **Depende de:** 3.x, 4.2; insumo P7 (URL `workers.dev` del gateway de josedev)

> **v2.1 (eng review):** sin cambios; se ejecuta en el carril A tras la fase 6, **antes** de Radar.

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

> **v2.1 (eng review):** **12 eventos** con `scene_open` y `palette_open` (2.12): la lista del E2E se actualiza; `path_open` no existe.

**Ficheros:** `app/[locale]/layout.tsx` (`<Script src="https://stats.josecoded.com/script.js" data-website-id data-domains="josecoded.com" strategy="afterInteractive" />`; beacon de CF solo si `NEXT_PUBLIC_CF_BEACON_TOKEN`), `lib/analytics.ts` (`window.onerror` → `client_error { message, source }` sin PII), `e2e/analytics.spec.ts` (intercepta `POST **/api/send` y comprueba que en un recorrido completo se emiten `intro_played`, `scene_open`, `palette_open`, `scene_drag`, `whatsapp_click`, `contact_submit`, `proposal_generated`, `proposal_sent`, `chat_started`, `booking_open`, `referral_copy`; `call_booked` se comprueba en el test del RH de Cal.com con `@umami/node` mockeado).

**Pasos:** 1. E2E que falla. 2. Implementar. 3. PASS. 4. Commit: `git commit -m "feat(web): Umami and Cloudflare Web Analytics scripts with event verification"`.

### Tarea 9.3 — ~~Primera medición de rendimiento y `perf.json`~~ (retirada en v2.0)

Sin métricas en la web (spec §12, `DESIGN.md`): no hay `ProofStrip` ni cifra de LCP que publicar. Lighthouse CI (2.9) y la puerta final (9.5) siguen midiendo; `content-refresh.yml` no ejecuta `perf.ts`. El número se conserva para no romper referencias.

### Tarea 9.4 — **GATE**: preparación del cutover

**Agente:** controlador con OK de Jose · **Gate:** **SÍ** · **Depende de:** todas las ramas mergeadas en `release/v1`

> **v3.3 (día 3, tarde; SEO medible + D51–D53):** pasos añadidos, cada uno con OK: (7) **Search Console** (propiedad de dominio por DNS) y **Bing Webmaster Tools** verificados, `sitemap.xml` enviado en ambos, **Crawler Hints / IndexNow** activado en la zona de Cloudflare (SEO A10); (8) comprobar que `robots.txt` de la preview sigue con `Disallow: /` y que producción permite los bots de IA de la lista (A5); (9) **GitHub App `josecoded-bot`** instalada en el repo con permiso **solo `contents: write`**; `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID` en `wrangler secret` del gateway (producción); prueba: publicar desde D2 un override inocuo → commit del bot → `deploy-production.yml` en verde → estado «Desplegado» en D2 y Telegram; (10) `RESEND_API_KEY` y remitente `cuenta@josecoded.com` verificados: un correo de prueba de `client.invited` a Jose; (11) Jose vincula su Telegram en `/crm/ajustes` y recibe «Enviar prueba» de D3; (12) **nota honesta anotada en `ESTADO.md`**: las posiciones no se garantizan; lo que se mide es GSC (impresiones/clics por consulta), citas del protocolo GEO (línea base en 9.6) y cadencia de una guía al mes. Sin estos pasos no se cruza 9.6.

> **v3.2:** sin Edge Function ni `vault`; `get_advisors` a cero como criterio; `grep -r nrgrmymsjtgayzejtawa` vacío en repo, secretos de Workers y `.env` de Omen; `supabase-ping.yml` activo.

> **v2.1 (eng review):** (a) `pricing:sync-db` ya no escribe: el controlador aplica **`supabase/generated/pricing-sync.sql`** con `apply_migration` tras revisar el diff; (b) `api.josecoded.com`, la rotación de Telegram/Resend y el SMTP ya se hicieron en 3.12; aquí solo se rota `WORKER_INTERNAL_TOKEN` (con `_PREV` 24 h) y se confirma `API_MODE`; (c) **fecha de válvula**: si Radar no está, se lanza sin él (D34) y `ESTADO.md` lo anota.

**Pasos (cada uno con OK):**
- [ ] 1. ~~`pricing:sync-db` (escribe `pack_templates`/`pack_extras` por `code` en producción; imprime diff y pide confirmación).~~ **v3.4 (D54):** la carga inicial ya se hizo en 1.9c paso 4b y el script se niega a correr contra una base con historial; aquí Jose hace la **primera publicación real desde D2** (paso 9 de la adenda v3.3: un cambio inocuo + «Publicar») y se comprueba que `content/pricing.json` del commit del bot es byte a byte igual a `pnpm pricing:pull` local y que `/servicios` en producción no cambia de precios.
- [ ] 2. Alta de `api.josecoded.com` como custom domain de `josecoded-api` (`wrangler.jsonc` `routes`) y `NEXT_PUBLIC_JOSECODED_API_URL=https://api.josecoded.com`; la URL `workers.dev` sigue respondiendo.
- [ ] 3. ~~Rotar `WORKER_INTERNAL_TOKEN` (gateway + Omen)~~ (retirado en 1.8d: no hay token en producción); rotar token del bot de Telegram (Edge Function + gateway) y key de Resend (Edge Function) en la misma sesión.
- [ ] 4. `API_MODE=production` en el gateway (deuda heredada `DEPLOY.md §4`): confirmar con Jose qué desactiva (`/api/dev/*`) y que `blog-ai.ts` local usa la vía directa a Omen.
- [ ] 5. Jose activa Cloudflare Web Analytics en la zona; Turnstile y Cal.com apuntan a `josecoded.com`.
- [ ] 6. Copia del ADR (`manage_adr get`) → `docs/adr-backup-<fecha>.md` (ignorado o commiteado, decisión del controlador) → `index_repository` del monorepo → restaurar/actualizar el ADR con las decisiones del Anexo del DT y de este plan.

### Tarea 9.5 — Puerta de calidad final sobre `release/v1`

> **v3.3:** la puerta final se ejecuta **como parte de 9.7 (día 4)**, con dos personas más para `usuario-ejemplo`: **Carla (closer)** —entra en `/crm`, importa un CSV de 30 filas con dos duplicados, abre su contacto, pide cierre, invita al portal a un cliente, ve su comisión `pending`→`approved`— y **Ana proponiendo una historia** que Carla convierte en tarea; y **Jose** publicando un cambio de texto desde D2 y viéndolo en producción. Lighthouse añade `/area-clientes/historias` no (privada); el resto igual.

> **v3.0:** rama `release/v2`. `usuario-ejemplo` con **Marta** (home → `/servicios#packs` → generador/WhatsApp), **Dani** (home → proyectos/lab → `/servicios#por-hora` → reservar), **Nuria** (`/partners` → contacto rápido y chat `partner`), **Pablo** (`/servicios#contratacion` → CV/reservar/chat `recruiter`) y **Jose operador** (CRM: importar, estados, borrador, takeover, publicar contexto). Sin Radar. Lighthouse también en `/servicios`, `/partners`, `/lab`, `/en/services`. Criterio nuevo: los **ocho contextos del chat publicados** y las **dos demos y tres guías** en producción.

**Agente:** `/puerta-calidad` (qa, revisor-seguridad, revisor-accesibilidad, usuario-ejemplo en paralelo) + `revisor` sobre la rama · **Gate:** no · **Depende de:** 9.1–9.4

**Pasos:**
- [ ] 1. `revisor` sobre `release/v1` completa.
- [ ] 2. `/puerta-calidad` contra la preview con datos de producción: `usuario-ejemplo` con Marta (home → negocios → generador/WhatsApp), Dani (home → proyectos → sobre mí → chat), Jose operador (bandeja de Radar en admin y Telegram) y reclutadora (5 candidaturas); `qa` con los E2E completos en Chromium y WebKit, 60 fps del hero en escritorio, vídeo del hero en Android de gama media e iOS Safari con la tabla de fallbacks de working-agreements §6, y `pnpm --filter web visual` con todas las escenas y pantallas ≤ 2 %; `revisor-seguridad` con cabeceras, RLS, secretos, superficie de Omen; `revisor-accesibilidad` WCAG 2.2 AA.
- [ ] 3. Lighthouse móvil sobre la preview: ≥ 90/95/100 en `/`, `/negocios`, `/empresas`, `/proyectos`, `/blog/<slug>` (si el blog está habilitado), `/en`, `/en/client-area`. `pnpm --filter web i18n:check` sin claves faltantes (bloqueante desde aquí).
- [ ] 4. Baseline GEO: ejecutar el protocolo de spec §8 (10 preguntas a ChatGPT, Perplexity, Claude, Google AI Overviews) y guardar `docs/geo/baseline-<fecha>.md`.
- [ ] 5. Repetir hasta que los cinco revisores (`qa`, `revisor-seguridad`, `revisor-accesibilidad`, `usuario-ejemplo`, `ui`) dan PASA y **Jose aprueba la preview en el navegador**.

### Tarea 9.5b — Repo público: limpieza y **GATE** «Jose cambia la visibilidad» (v3.1)

**Agente:** implementador-web (pasos 1–7) · `revisor-seguridad` (paso 8) · controlador con OK de Jose (paso 9) · **Gate:** **SÍ** (el cambio de visibilidad lo hace Jose en GitHub; ningún agente toca la configuración del repo) · **Depende de:** 9.5 (la puerta final ya pasada); **antes de 9.6** · **Rama:** `release/v2` (o `chore/public-repo` si se adelanta; no toca `main`)

**Objetivo.** Que el repo pueda pasar a público sin exponer identificadores de cuenta, correos personales, topología del servidor casero ni nombres de terceros bajo NDA, y con licencia y portada claras. El repo queda **privado hasta que este gate se cruza**; la decisión del 2026-09-30 («repo privado») se sustituye por esta tarea. Lo que no es secreto pero sí identifica infraestructura (UUIDs, `account_id`, túnel) sale del repo por higiene, no por riesgo directo.

**Qué hay que cambiar (lista cerrada; se marca cada ítem al hacerlo):**

*Secretos, identificadores y correos*
- [ ] `apps/api/wrangler.jsonc`: quitar `account_id` (pasa a `CLOUDFLARE_ACCOUNT_ID` en el entorno de quien despliega y en los secretos de Actions, que ya existen en `preview.yml`/`deploy-production.yml`); sacar `ADMIN_SUPERUSER_ID` y `ADMIN_SUPERUSER_EMAIL` de `vars` a `wrangler secret put` (el gateway ya los acepta como env; `env.ts` no cambia). Añadir bloque `env.production` con `API_MODE: "production"` y dejar el bloque raíz como desarrollo, o fijar `API_MODE` por entorno como decida 9.4 §4; **ningún deploy aquí**, solo el fichero y el test `test/wrangler-config.test.ts` ampliado (cada env tiene `define`, el raíz no tiene `account_id` ni correos, `env.production.vars.API_MODE === 'production'`).
- [ ] `apps/api/DEPLOY.md`: quitar el correo de la cuenta de Cloudflare y el `account_id` literal (sustituir por «la cuenta del proyecto», `wrangler whoami`); reescribir §4 ya resuelto con lo anterior. Mover el valor real al vault (`Proyectos/josecoded.md`, bloque «Infra»).
- [ ] `apps/api/src/services/supabase.service.ts` (`DEFAULT_ADMIN_SUPERUSER_EMAIL`) y `apps/api/src/services/admin-chat.pg-store.ts` (mensaje de error con el correo): quitar el correo literal; el valor viene solo de `ADMIN_SUPERUSER_EMAIL`. Es código heredado («intocable»): **desvío justificado** (privacidad), una línea cada uno, contrato de la ruta sin cambios; lo aprueba `revisor-seguridad` en el paso 8. Actualizar el test `supabase.service.test.ts` si lo referencia.
- [ ] `apps/api/infra/cloudflared/README.md`: quitar el UUID del túnel y la ruta del fichero de credenciales; dejar solo el procedimiento genérico. Valores al vault.
- [ ] `apps/api/README.md`: quitar las rutas de disco del servidor casero (`/Volumes/JosecodedData/...`) y las referencias a `josedev` que ya no aplican; apuntar a `docs/architecture.md`.
- [ ] `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` (§7 y Q11/Q20), `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` (§1.3 y P14): sustituir el correo de la cuenta de Cloudflare/Google y el `account_id` por «cuenta del proyecto (valor en el vault)». Los documentos de decisión se quedan; solo salen los identificadores.
- [ ] Barrido final con `git grep -n -i -E 'gmail|proton|account_id|25486629|c0dac20a|/Volumes/|192\.168'` en la rama: cero resultados salvo `.dev.vars.example` genéricos. **Historial:** el escaneo del 2026-10-28 no encontró tokens ni claves en ningún commit (`sb_secret_*`, JWT, `ghp_*`, tokens de Telegram); los correos e identificadores sí están en el historial. Decisión de Jose en el paso 9: aceptar que queden en el historial (recomendado: son identificadores, no credenciales) o reescribir con `git filter-repo` antes de publicar (rompe los clones; se haría una sola vez con OK explícito).

*Nombres de terceros y datos personales en documentos*
- [ ] «3catinfo» aparece en `PRODUCT.md`, `ESTADO.md`, spec §3, DT §2 y §5.2, PANT §3 y §4 con la nota «NDA» (nunca en primer lugar, métricas ocultas). Decidir con Jose: (a) mantener el nombre (la app es pública en las stores y el NDA afecta a métricas y detalles, no al nombre) o (b) sustituir por «app de un medio» en los documentos públicos. Recomendación: (a), y confirmar por escrito qué cubre el NDA antes de publicar. **Alten no aparece en el repo** (comprobado); las agencias de `Comercial/agencias.md` tampoco (viven en el vault). Comprobar que ninguna tarea futura las importa al repo (6.7 importa desde el vault a Supabase, no al repo: correcto).
- [ ] Datos personales: en el repo no hay WhatsApp, NIF ni domicilio (van como `{{DATO}}` y a Supabase/`messages`, nunca a `content/` sin revisión). El enlace al Figma privado en `ESTADO.md` no abre nada sin permiso; se queda.
- [ ] `apps/api/src/knowledge/knowledge.json`: contiene solo el nombre público y la descripción de servicios; se queda (y 4.4 lo sustituye por `chat_contexts`).

*Ficheros de herramientas*
- [ ] `.claude/` (en `chore/supabase`: agentes, skills vendorizadas, `settings.json`, `README.md`; en `main`: `launch.json`). Decisión por carpeta: `settings.json`, `launch.json` y `README.md` se quedan (describen cómo se trabaja; no hay rutas personales). `agents/*.md`: revisar que no contengan rutas del Mac ni del vault con nombre de usuario; si las tienen, parametrizar o sacar. `skills/vercel-react-best-practices/` lleva licencia MIT de Vercel (conservar su `README.md`/atribución); las cinco skills de Emil Kowalski (`animate`, `emil-design-eng`, `review-animations`, `improve-animations`, `find-animation-opportunities`) **no traen fichero de licencia**: comprobar la licencia de `emilkowalski/skills` y, si no permite redistribución, sacarlas del repo y dejarlas solo en `~/.claude` (las sesiones en la nube las perderían: anotarlo en `.claude/README.md`).
- [ ] `.impeccable/`: `design.json`, `config.json` y `surfaces/` se quedan (son el sistema de diseño). `review/`, `questions/` y `hook.cache.json` ya están ignorados: comprobar con `git ls-files .impeccable`.
- [ ] `graphify-out/`, `.gstack/`, `.claude/worktrees/`: ya ignorados; comprobar que no hay nada rastreado (`git ls-files | grep -E 'graphify-out|\.gstack'` vacío).

*Licencia y portada*
- [ ] `LICENSE` en la raíz. Recomendación: **MIT para el código** (`apps/`, `packages/`, `supabase/`, `.github/`) y **«todos los derechos reservados» para marca, textos, diseño y medios** (`DESIGN.md`, `.impeccable/design.json`, `docs/superpowers/design/ref/`, `messages/`, `apps/web/public/`, `content/`), declarado en `LICENSE` (dos secciones) y en una línea del `README.md` («Code: MIT. Brand, copy, design and media: all rights reserved»). Alternativa: todo «source-available, no license» (se puede leer, no reutilizar); menos útil para enseñar. **Decide Jose en el paso 9.**
- [ ] `README.md` (inglés, portada) y `docs/architecture.md` (inglés) ya escritos el 2026-10-28; revisar que las rutas *planned* reflejen el estado real en el momento de publicar. Añadir `SECURITY.md` (cómo reportar: correo `freelance@josecoded.com` si Q18 está activo; sin bug bounty) y, opcional, `CODEOWNERS` con `* @12joseca12`.

*Efectos de pasar a público (no son limpieza, pero se hacen en el mismo gate)*
- [ ] **Protección de `main`**: GitHub Free sí permite reglas de protección en repos públicos. Al cambiar la visibilidad, Jose activa la protección de `main` (working-agreements §9: PR obligatoria, squash, checks `ci` requeridos) que la decisión del 2026-10-03 dejó pendiente por ser privado. Excepción de auto-merge solo para `newsletter/*` (fase 10, si llega).
- [ ] **Workflows ante forks**: `ci.yml` usa solo variables públicas (bien). `preview.yml` y `deploy-production.yml` usan secretos: confirmar que solo corren en `push` a ramas del repo y nunca en `pull_request` de forks (`pull_request_target` prohibido). Dependabot y acciones fijadas por SHA (pendiente de la puerta 1a, B2) entran aquí si no se han hecho antes.
- [ ] `preview_urls: true` en `apps/web/wrangler.jsonc` (pendiente B5): con repo público las URLs de preview son adivinables por nombre; cerrar con Access o `noindex` + sin `/dev/ui` antes del gate.

**Pasos:**
- [ ] 1. Test que falla: ampliar `apps/api/test/wrangler-config.test.ts` (sin `account_id`, sin `@` en `vars`, `env.production.vars.API_MODE === 'production'`, `define` en todos los env) y un test nuevo `packages/config/test/no-secrets-in-repo.test.ts` que recorre `git ls-files` (excluye `docs/superpowers/design/ref/**` e imágenes) y falla ante `gmail.com|proton.me|account_id":|25486629|c0dac20a|/Volumes/|192\.168\.` fuera de `.dev.vars.example`/`.env.example`.
- [ ] 2. → FAIL. 3. Aplicar la lista de arriba (cada ítem un commit pequeño: `chore(api): move account and admin identifiers out of wrangler vars`, `docs: strip account identifiers from spec and technical design`, `chore: add LICENSE and SECURITY.md`...). Los desvíos en código heredado llevan `deviation:` en el cuerpo del commit.
- [ ] 4. → PASS. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde.
- [ ] 5. Actualizar `docs/architecture.md` y `README.md` si algo de la lista cambió rutas.
- [ ] 6. Mover los valores retirados al vault (`Proyectos/josecoded.md`, bloque «Infra»: `account_id`, correo de la cuenta, UUID del túnel, ruta de credenciales en Omen, `ADMIN_SUPERUSER_ID`). Lo hace el controlador, no el implementador (el vault está fuera del repo).
- [ ] 7. `git grep` del barrido final en la rama: vacío.
- [ ] 8. `revisor-seguridad` sobre la rama: confirma los desvíos del código heredado, el estado del historial y la configuración de workflows ante forks. Veredicto PASA.
- [ ] 9. **GATE — Jose:** decide licencia, 3catinfo y reescritura del historial; **cambia la visibilidad en GitHub** (Settings → General → Danger zone → Change visibility), activa la protección de `main` y comprueba que `ci` sigue en verde en el primer push posterior. Ningún agente ejecuta este paso.
- [ ] 10. `ESTADO.md`: «repo público desde <fecha>»; quitar el pendiente heredado de los correos en `wrangler.jsonc`/`DEPLOY.md`; anotar en el vault y en el ADR (`manage_adr`) la decisión de licencia.

**Hecho cuando:** el repo es público, `main` está protegida, el barrido devuelve cero resultados, `LICENSE` y `SECURITY.md` existen, el `README.md` en inglés es la portada y `revisor-seguridad` ha dado PASA.

### Tarea 9.6 — **GATE**: lanzamiento y cierre

> **v3.3 (día 4, tras 9.7 en PASA):** smoke añadido en producción: `/crm` con la cuenta de Jose (y 404 anónimo), invitación a un closer real si Jose la tiene (D1 → correo → claim → `/crm`), una historia propuesta por un cliente de prueba → Telegram al admin, una publicación desde D2 → commit → despliegue → texto cambiado en `/servicios`. **Línea base GEO** (SEO A13): las 10 preguntas × 4 sistemas registradas en `docs/geo/baseline-<fecha>.md` el mismo día. Radar arranca después (fase 7) como estaba.

> **v3.0 (D46):** `release/v2` → `main`; sin smoke de Radar; smoke añadido: `/servicios`, `/partners`, `/lab`, `/chat` anónimo (un mensaje → respuesta con el contexto publicado), un lead de `/partners` → contacto `agency` en el CRM + Telegram. Tras el lanzamiento arranca la fase 7 (Radar) y, a los 3 meses, la decisión sobre la fase 10 (spec §0.9). `ESTADO.md`, vault, canvas y ADR se actualizan con D36–D47. Anotar en el vault: **`agencias-mensajes.md` puede llevar enlace a `/partners`** desde este día.

**Agente:** controlador con OK de Jose · **Gate:** **SÍ** · **Depende de:** 9.5 y **9.5b** (v3.1: el repo se publica antes del lanzamiento o en el mismo gate; nunca después sin pasar 9.5b)

> **v2.1 (eng review):** el lanzamiento no espera a Radar (D34): el smoke de Radar solo si 7.x está mergeado; si no, el paso 2 lo omite y Radar se despliega después con su propio gate 7.31. Tras el deploy, `deploy-production.yml` mueve `last-deployed`.

**Pasos:**
- [ ] 1. Merge `release/v1` → `main`; `deploy-production.yml` con `web` y `api` (`routes` de `josecoded.com` en `apps/web/wrangler.jsonc`; el Worker antiguo de josedev deja de recibir la ruta).
- [ ] 2. Smoke en producción: `/`, `/en`, `/negocios`, `/api/v1/health`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`; un lead de prueba (formulario) → Telegram; una ingesta de prueba de Radar (`tecnoempleo`) → bandeja; `stats.josecoded.com` recibe eventos.
- [ ] 3. Activar `content-refresh.yml` (cron) y `supabase-ping.yml`.
- [ ] 4. Actualizar `ESTADO.md` (Ahora: en producción; Pendientes: conectores sin credenciales, Proton diferido, LinkedIn scraping tras 2 semanas, Upwork), la nota del vault `Proyectos/josecoded.md`, el nodo del canvas y el ADR; `/cerebro update`; `/cierre` de la etapa v1.
- [ ] 5. Post-lanzamiento (primera semana): revisar Workers Logs del `sweep` (tiempo por tick), Telegram entregados/fallidos, `google_status`, y anotar en `ESTADO.md`.

**Hecho cuando:** producción responde con la nueva web, Jose ha recibido el Telegram de prueba y el flujo de Radar ha corrido una vez sobre datos reales.

---

## Fase 10 — Newsletter semanal (post-lanzamiento, **aplazada y a reevaluar**, D44) · Estimación L · ramas de la spec de newsletter §14 · **después de 9.6 y de la decisión de Jose a los 3 meses**

> **v3.0 (D44, spec §0.9):** la fase **no arranca** hasta que Jose decida con datos (visitas orgánicas a las guías, citas en IA del protocolo GEO, nº de contactos `newsletter_interest` en el CRM ≥ 50). Si arranca, se ejecuta tal cual con un cambio: cada número **parte de una guía ya publicada** (reaprovechamiento: el runner redacta solo el email y el post de LinkedIn; `newsletter_issues.source_post_slug` deja de ser opcional) y los suscriptores iniciales se importan desde los contactos `newsletter_interest` **con doble opt-in** (son contactos, no consentimiento de lista). Si no arranca, los interesados reciben un correo manual de Jose y la fase se cancela.

> Fuente: `docs/superpowers/specs/2026-09-29-josecoded-newsletter.md` **v1.1** (**NL**), con las decisiones N1–N10 de Jose, S1–S16 del arquitecto y Q1–Q6 resueltas (2026-09-30: **bilingüe** S4, auto-merge acotado S16, n8n evaluado y descartado como orquestador §7.5). Este plan encaja sus ramas como tareas, en el orden de NL §14, y anota dónde se cruzan con working-agreements, PANT y la spec v1.6. Depende de: 4.2 (blog, RSS, `content-index`), 4.1 (auth), 6.1 (shell del admin), 3.8 y 3.10 (`POST /leads` y `/contacto`: casilla), 2.11 (OG del post), 1.7 (`scheduled` del gateway), 8.x (patrón de contenedores en Omen). Insumos de Jose antes de arrancar: NL §14 último párrafo y respuestas a NL Q1–Q6.
>
> **Notas de encaje (no reescriben NL):**
> 1. **Estilos y tokens.** Las pantallas de admin (`/admin/newsletter/*`), las públicas (`/newsletter/*`, `NewsletterForm`, casillas) y la plantilla del email usan el sistema v6: CSS Modules con `var(--token)` y, en el email, los **valores** de `tokens.css` copiados por el build de `renderEmailHtml` (los clientes de correo no leen custom properties). NL §8.3 habla de «fondo del sistema visual»: se entiende `--bg`, `--text`, `--violet` de `design.json`. Sin Tailwind, shadcn ni GSAP.
> 2. **Bilingüe (resuelto 2026-09-30, NL S4 v1.1).** Cada número genera post y email en `es` y `en` en el mismo trabajo; el suscriptor recibe el de su `locale` de alta; Jose marca «revisado» en los dos idiomas antes de aprobar; dos campañas de Brevo por número (segmento `LOCALE`, una lista); PR con dos ficheros `content/blog/{es,en}/<slug>.md`; ratio de edición por idioma. La interfaz pública (`/newsletter/*`, formularios, casillas) va en `messages/{es,en}.json` como el resto (D31). LinkedIn solo `es`.
> 3. **Blog `.md` puro (S8).** Compatible con 4.2: `@next/mdx` compila `.md` y `.mdx`; `content-index.ts` los cuenta igual para la regla de los 3 artículos (spec D33). El check de CI del PR `newsletter/*` (NL §10) se añade a `ci.yml` como job condicionado por rama.
> 4. **`main` protegida y auto-merge (S8/S16, resuelto 2026-09-30).** Auto-merge **solo** en ramas `newsletter/*` con `ci` y el check `newsletter-content-only` en verde; regla escrita en working-agreements §9 (PR obligatoria sin revisión humana requerida, sin bypass). El clic de Jose en «Aprobar y lanzar» es el OK de despliegue de contenido (anotar en el ADR). Configuración de la regla en GitHub: insumo de Jose (10.6).
> 5. **Telegram por la Edge Function `notify`** (S12): coincide con DT H3/P3; el evento `lead.created` y los `newsletter.*` conviven.
> 6. **Sin métricas en la web pública** (spec §12): NL §12 ya lo respeta (métricas solo en admin).
> 7. **Runner con `claude -p` en Omen** (S1, Q1 aceptada): contenedor **nuevo**, sin puertos; respeta la regla de servicios preexistentes intocables. **n8n evaluado y descartado como orquestador o bot (NL §7.5):** no puede ejecutar la CLI de Claude sin cambiar la configuración del contenedor de n8n (prohibido), y crons, PR, Brevo y Telegram ya viven gratis y sin depender de Omen en el gateway y en `notify`; n8n solo como workflows opcionales (`newsletter-notion`, disparo manual por webhook). Ahorro admitido: el runner como segundo servicio en el `compose.yml` de `radar-runner` (10.3).
> 8. **Cola de trabajos `newsletter_jobs`** (S2): mismo patrón que `radar_claim_work` (DT §11.3); no se generaliza a `claude_jobs` ahora (NL §5 fuera).
> 9. **pnpm y dependencias** (working-agreements §11): el parser Markdown de `packages/newsletter-core` y cualquier dependencia nueva se justifican en su tarea y las acepta `revisor`.
> 10. **Toca dinero e integraciones externas** (Brevo, GitHub REST, DNS, Claude CLI): `/plan-eng-review` obligatorio antes de ejecutar esta fase.

### Tarea 10.0 — Spike `spike/t10-claude-runner` (no se mergea)

**Agente:** implementador-web (+ `implementador-infra` para Omen) · **Gate:** no (solo lectura y pruebas; sin secretos en el repo) · **Depende de:** respuesta de Jose a NL Q1 · **Fuente:** NL §14.1, §7

> **v2.1 (eng review):** además del runner y Brevo: (a) comprobar el **plan de GitHub** del repo privado; si es Free (sin reglas por rama con auto-merge), la fusión la hará el gateway por API (10.2); (b) crear la **GitHub App `josecoded-bot`** (permisos `contents:write`, `pull_requests:write` solo en `josecoded`) y anotar `GITHUB_APP_ID`/`INSTALLATION_ID` (la clave privada va a `wrangler secret`, nunca al repo).

**Pasos:** 1. En Omen (con OK de Jose para un contenedor de prueba efímero) o en el Mac: `claude -p --output-format json` con token de `claude setup-token` en un contenedor sin TTY; medir tiempo y tamaño de una generación real con el prompt v1 de NL §7.4. 2. Comprobar que Brevo permite campañas por API en el plan gratuito con el remitente autenticado (llamada de prueba a `GET /v3/account`; sin enviar nada). 3. Documentar en `docs/superpowers/specs/2026-MM-DD-tarea10-resultados.md` (veredicto: Omen viable / solo Mac; tiempos; límites de Brevo). 4. Commit del documento en `main`.

**Hecho cuando:** hay veredicto sobre S1 (Omen o Mac) y sobre Brevo. **Fallback:** runner solo en el Mac (S1 invertido, como prevé NL §7.2).

### Tarea 10.1 — `feat/newsletter-core`: `packages/newsletter-core`, migraciones `newsletter_*`, tests RLS e invariantes + **GATE** migraciones

**Agente:** implementador-web + controlador (migraciones con OK de Jose) · **Gate:** **SÍ** (producción) · **Depende de:** 10.0, 1.8 · **Fuente:** NL §8.1, §9, §9.1–9.2, §13.5

> **v2.1 (eng review):** (a) **grants por columna**: `revoke update (status, reviewed, approved_at, approved_by, brevo_campaign_ids, blog_pr_number, blog_urls, blog_published_at, send_lock, error) on newsletter_issues from authenticated`; inserts en `newsletter_issue_events` y `newsletter_jobs` solo service role; (b) trigger **`private.newsletter_guard_transition()` `BEFORE UPDATE`** que valida cada transición de NL §9.1 y exige `reviewed.es && reviewed.en` para `approved`; (c) `send_lock uuid` en `newsletter_issues`; `unique (week_key) where status in ('approved','publishing_blog','blog_published','sending_email','sent')`; (d) `newsletter_jobs.claim_token uuid` y `attempt int`; (e) **tests negativos** de cada regla (edición directa de `status` → error; insert de evento como `authenticated` → error; `approved` sin doble revisión → error; dos `send_lock` simultáneos → uno solo gana); (f) `content/blog/schema.ts` único con `.md` (4.2) y `buildPostFile` serializa el frontmatter con `yaml`; (g) `lint` de cargas maliciosas en cada campo (`<script>`, `javascript:`, HTML crudo) y `renderEmailHtml` escapa siempre (tests con fixtures maliciosas); (h) evals manuales `evals/newsletter.jsonl` (5–6 temas con juez de traducción es→en).

**Ficheros:** `packages/newsletter-core/src/{types,schemas,state-machine,render-markdown,render-email,render-linkedin,build-post-file,lint}.ts` (esquemas con `post.{es,en}`, `email.{es,en}`, `slug` único; `renderEmailHtml(issue, locale)`, `buildPostFile(issue, locale)`, `lint(issue, locale)` + `lintParallelStructure(issue)`), `prompts/issue.v1.md` (bilingüe: español completo y después traducción fiel), tests; `supabase/migrations/2026MMDD_newsletter_*.sql` (tablas de NL §9, trigger `newsletter_guard_sent`, función `newsletter_claim_job`); ampliar `apps/web/tests/rls.test.ts` (cliente y anónimo no leen ninguna `newsletter_*`).

**Pasos:** 1. Tests que fallan: máquina de estados (todas las transiciones de NL §9.1 y las prohibidas; **test negativo**: ningún camino a `sent` sin `approved_by_jose`; ninguno a `approved` sin `reviewed.es && reviewed.en`; ninguno a `sending_email` sin `blog_published`), `lint` por idioma y de estructura paralela (150–250 palabras, sin `€`, «precio», «contrátame», «pack», emojis ni `!`; sin JSX ni `<script>`; slug `^[a-z0-9-]{3,80}$`), `renderEmailHtml` snapshot, RLS. 2. FAIL. 3. Implementar (parser Markdown con `html: false`, justificado según working-agreements §11). 4. PASS con `supabase start`. 5. **Pedir OK a Jose**; controlador: `list_tables` (ninguna `newsletter_*`), `get_advisors`, `apply_migration` una a una, `get_advisors`, regenerar baseline. 6. Commit: `git commit -m "feat(newsletter): core package (schemas, state machine, renderers, lint) and additive migrations with RLS tests"`.

### Tarea 10.2 — `feat/newsletter-api`: rutas del gateway, servicios (Brevo, GitHub, feeds), crons y eventos `newsletter.*` en `notify` + **GATE** función y secretos

**Agente:** implementador-web + controlador (deploy y secretos con OK) · **Gate:** **SÍ** · **Depende de:** 10.1, 1.7 · **Fuente:** NL §8.2, §6.2, §6.4, §8.4, §10, §11

> **v2.2 (stack):** `brevo.adapter.ts`, `github.adapter.ts`, `feeds.adapter.ts` (+ puertos `Mailer`, `ContentRepo`, `FeedSource` en `@josecoded/types/api.ts`), falsas en memoria y servicios `createIssuesService(deps)`, `createSendService(deps)` (respeta `send_lock`) testeados sin HTTP; las rutas de NL §8.2 componen sobre `c.var.deps`. Tipos y esquemas de la newsletter en `@josecoded/types/{newsletter.ts,schemas/newsletter.ts}` (10.1 los crea; `newsletter-core` reexporta).

> **v2.1 (eng review):** (a) `POST /issues/:id/review` (`locale`) es la única vía para `reviewed`; editar o regenerar un idioma lo pone a `false`; (b) **`send_lock` atómico** al entrar en `sending_email`, campañas de Brevo no `draft` = enviadas, **`GET /v3/account`** antes de enviar para comprobar el cupo de es+en, `approve` rechaza una segunda `week_key` y pasa el `auto` a `superseded` también desde `approved`; test con **dos barridos simultáneos**; (c) **GitHub App** (`github-content.service` firma el JWT de la app y pide token de instalación) y, si 10.0 dice que el plan no permite auto-merge, **`mergePullRequest()`** por API tras comprobar el diff (`GET /pulls/{n}/files` cumple el patrón) y los checks (`GET /commits/{sha}/check-runs` todos `success`); (d) los trabajos de la newsletter son entradas de `private.scheduled_jobs` del cron único (1.7), no `triggers.crons`; (e) `result` exige `claim_token` y `attempt`; `errorClass:'rate_limit'` con `retry_after` no cuenta como intento y avisa una vez; lock 30 min; (f) webhook de Brevo con secreto en **cabecera** si Brevo lo permite; (g) al aprobar, aviso en la respuesta si `blogEnabled` es falso.

**Ficheros:** `apps/api/src/modules/newsletter/*.routes.ts` (tabla de NL §8.2), `src/services/{brevo,github-content,feeds,issue-state}.service.ts`, `src/scheduled.ts` (lunes 07:00, jueves 09:00, domingo 22:00 Madrid; cada 6 h feeds; sweep */5; diario stats), `envSchema` (secretos de NL §10), `supabase/functions/notify/index.ts` (`newsletter.draft_ready`, `newsletter.failed`, `newsletter.sent`, sin botones), `content/newsletter/sources.json` (lista de NL §8.4 pendiente de Q6), tests en workerd con `fetchMock` estricto (Brevo, GitHub, feeds) y contra `supabase start`.

**Pasos:** 1. Tests que fallan (NL §13.1, 13.2, 13.6, 13.7, 13.9, 13.11, 13.12: `approve` exige `status='ready'`, `reviewed` en ambos idiomas, lint verde en ambos y sin `{{DATO}}`; el PR lleva exactamente dos ficheros; el sweep exige 200 en `/blog/<slug>` y `/en/blog/<slug>`; dos campañas por segmento `LOCALE` con `brevo_campaign_ids.<locale>` persistido antes de cada `sendNow` y un idioma sin suscriptores se salta; idempotencia de `claim`; runner no puede aprobar ni leer suscriptores; caducidad dominical devuelve el tema a `queued`). 2. FAIL. 3. Implementar. 4. PASS. 5. **Pedir OK a Jose**: `wrangler secret put` (`BREVO_API_KEY`, `BREVO_WEBHOOK_SECRET`, `NEWSLETTER_RUNNER_TOKEN`, `NEWSLETTER_TOKEN_KEY`, `GITHUB_CONTENT_TOKEN`), vars, `supabase functions deploy notify`, `triggers.crons`. 6. Commit: `git commit -m "feat(api): newsletter routes, Brevo/GitHub/feeds services, crons and notify events"`.

### Tarea 10.3 — `feat/newsletter-runner` + `infra/newsletter-runner`: paquete del runner, Dockerfile/compose, plist opcional + **GATE** Omen

**Agente:** implementador-web (paquete) + `implementador-infra` (Omen, con OK) · **Gate:** **SÍ** · **Depende de:** 10.2, 10.0 · **Fuente:** NL §7.2–7.4, §11

> **v2.1 (eng review):** **compose propio** `infra/omen/newsletter-runner/compose.yml` (aunque comparta la red de `radar-runner`); el runner limita cada trabajo a **20 min en total** (dos intentos de ≤ 9 min), envía `claim_token` y `attempt` en `result` y trata `rate_limit` con `retry_after` sin contar intento.

**Ficheros:** `packages/newsletter-runner/src/{index,claim,run-claude,report}.ts` + tests (bucle de sondeo cada 2 min, `timeout` 20 min, `claude -p "$(cat prompt.md)" --output-format json --allowedTools WebSearch,WebFetch --max-turns 12 [--model $NEWSLETTER_CLAUDE_MODEL]`, validación zod, un reintento estricto, `errorClass`), `infra/omen/newsletter-runner/{Dockerfile,compose.yml,.env.example,README.md,check.sh}` (sin `ports:`, `restart: unless-stopped`, volumen `/srv/josecoded-data/newsletter-runner/`; **opción de ahorro aceptada: declararlo como segundo servicio en `infra/omen/radar-runner/compose.yml` si 8.2 ya existe, misma red y logs**; n8n **no** interviene, NL §7.5), `infra/mac/com.jose.josecoded.newsletter-runner.plist` (no instalado por defecto).

**Pasos:** 1. Tests del runner con `claude` falso (salida válida, inválida, timeout, auth). 2. FAIL. 3. Implementar. 4. PASS. 5. `implementador-infra`: `check.sh` (estado previo), **OK de Jose**, `docker compose up -d`, latido visible en `GET /api/v1/newsletter/health`, `check.sh` final (preexistentes intactos). 6. Commit: `git commit -m "feat(newsletter): claude runner package and Omen container reference"`.

### Tarea 10.4 — `feat/newsletter-admin`: cola de temas, lista y detalle de números con tres pestañas, ajustes, RGPD (con `ux` y `ui` previos)

**Agente:** `ux` → `usuario-ejemplo` (Jose operador en móvil) → `ui` (prototipo `ref/admin-newsletter/`, Jose valida) → implementador-web · **Gate:** no · **Depende de:** 10.2, 6.1 · **Fuente:** NL §5.1, §5.3, §6.1, §6.3, §12

> **v2.1 (eng review):** (a) preview del email en `<iframe sandbox="" srcdoc>`; (b) **CSP estricta** en `/admin/newsletter/*` (`default-src 'self'; frame-src 'self'; script-src 'self' 'nonce-<n>'; img-src 'self' data: https:`) con test E2E de que la preview no ejecuta scripts; (c) «Marcar revisado» llama al gateway (10.2), nunca escribe `reviewed` desde la web; al guardar una edición, la UI muestra que el idioma vuelve a «sin revisar».

**Ficheros:** `app/[locale]/(private)/admin/newsletter/{page,[id]/page,temas/page,ajustes/page}.tsx`, Server Actions (edición con `version` optimista → `newsletter_issue_versions` con `locale`; `markReviewed(locale)`), `components/admin/newsletter/{issue-list,issue-detail,locale-switch,tab-blog,tab-email,tab-linkedin,this-week,topic-queue,subscriber-tools}/…` (CSS Modules v6; **selector es/en en Blog y Email con estado «revisado» por idioma**; preview del email en `iframe srcdoc` con `renderEmailHtml(issue, locale)`; botones Copiar / Descargar imagen / Abrir LinkedIn y Web Share API en móvil; «Aprobar y lanzar» activo solo con los dos idiomas revisados, segundo paso con N (es) + M (en) y 10 s de margen), tests de comportamiento (conflicto de versión, contador de palabras, segundo paso, **aprobar bloqueado sin doble revisión**) y E2E (NL §13.3, 13.4, 13.10).

**Pasos:** 1. `ux` + `ui` + validación de Jose. 2. Tests que fallan. 3. FAIL. 4. Implementar (solo español, como el resto del admin). 5. PASS; `web-design-guidelines`; `visual` contra el prototipo; aprobación de Jose en preview. 6. Commit: `git commit -m "feat(web): newsletter admin (topics queue, issues, three-tab preview, approve and launch, settings, GDPR tools)"`.

### Tarea 10.5 — `feat/newsletter-public`: casillas RGPD en `/contacto` y registro, `NewsletterForm` al pie del post, `/newsletter/*`, política de privacidad ampliada

**Agente:** `ui` (prototipo, Jose valida) → implementador-web · **Gate:** no · **Depende de:** 10.2, 3.10, 4.1, 4.2, 3.6 · **Fuente:** NL §5.5, §6.5, §10 (RGPD)

**Ficheros:** `components/forms/newsletter-consent/…` (casilla no premarcada con texto versionado `consent_version` en el idioma de la página; en `/contacto` viaja en `POST /leads` como `newsletter_opt_in` + `locale`; en el registro, SA tras crear la cuenta), `components/forms/newsletter-form/…` (Turnstile → `POST /api/v1/newsletter/subscribe` con `locale`), `app/[locale]/(public)/newsletter/{page,confirmar/page,baja/page,preferencias/page}.tsx` (`pathnames`: `/newsletter/confirmar`↔`/newsletter/confirm`, `/newsletter/baja`↔`/newsletter/unsubscribe`, `/newsletter/preferencias`↔`/newsletter/preferences`), `content/legal/privacidad.{es,en}.mdx` (finalidad, Brevo como encargado, conservación, derechos), `messages/{es,en}.json` (`newsletter.*`), tests (casilla no marcada por defecto; `locale` guardado; baja en un clic sin login; cambio de idioma actualiza `LOCALE`) y E2E (NL §13.8).

**Pasos:** 1. Tests que fallan. 2. FAIL. 3. Implementar. 4. PASS; `i18n:check`; `visual`; aprobación de Jose en preview. 5. Commit: `git commit -m "feat(web): newsletter consent checkboxes, subscribe form, confirm/unsubscribe pages and privacy policy update"`.

### Tarea 10.6 — **GATE final de la newsletter**: DNS (SPF/DKIM/DMARC), dominio en Brevo, lista y webhook, PAT de GitHub, primer número de prueba, puerta y cierre

**Agente:** controlador con OK de Jose · **Gate:** **SÍ** · **Depende de:** 10.1–10.5 mergeadas · **Fuente:** NL §14.6, §10 (correo saliente y DNS)

> **v2.1 (eng review):** sin PAT: la **GitHub App `josecoded-bot`** ya existe (10.0); si el plan de GitHub no admite la regla de auto-merge por rama, no se configura en GitHub y fusiona el gateway (10.2). `deploy-content.yml` y `last-deployed` ya están desde 1.9.

**Pasos (cada uno con OK explícito de Jose):** 1. Jose crea los registros DNS de NL §10 (SPF combinado, DKIM de Brevo, `_dmarc` con `p=none` el primer mes) y autentica el dominio en Brevo; anotar en `ESTADO.md` (nombres, nunca valores). 2. Lista de Brevo (`NEWSLETTER_BREVO_LIST_ID`) con el atributo `LOCALE`, dos plantillas transaccionales (es/en) y webhook firmado apuntando a `POST /api/v1/newsletter/brevo/webhook`. 3. GitHub App `josecoded-bot` instalada (10.0) con `GITHUB_APP_PRIVATE_KEY` en `wrangler secret`; regla de `main` con la excepción de auto-merge para `newsletter/*` exactamente como working-agreements §9 (0 revisiones requeridas, checks `ci` + `newsletter-content-only`, sin bypass). 4. Primer número real de prueba a una lista interna con un contacto `es` y otro `en` (Jose): revisar ambos → aprobar → PR con dos ficheros → auto-merge → posts vivos → dos campañas; comprobar que cada contacto recibe solo su idioma. 5. `/puerta-calidad` de la etapa (`revisor-seguridad` en tokens, webhooks, RLS, sanitización del Markdown y permisos de la GitHub App; `usuario-ejemplo` como Jose operador en móvil desde el Telegram hasta «Aprobar»). 6. `/cierre` de la etapa; `ESTADO.md`, nota del vault, ADR (NL §17).

**Hecho cuando:** los 13 criterios de NL §13 (v1.1, bilingües) pasan en producción y Jose ha recibido y aprobado un número real en los dos idiomas.

---

## Anotaciones que deja este plan (para el controlador)

**Añadido v3.0 (2026-10-28) al vault, `ESTADO.md` y ADR:** «Reposicionamiento: identidad única freelance (D36); `/servicios` con cuatro vías y cinco packs, `/empresas` y `/negocios` → 301 (D37); `/partners` para agencias (D38); chat por casos sin cuenta sobre `chat_*` y módulo `assistant`, `admin-chat/*` sin consumidor (D39); contexto del chat por caso editado y publicado desde el CRM (D40); CRM propio en `/admin` con leads/clientes heredados mapeados sin alterarlos y mensajes que Jose envía a mano (D41); Notion solo documentos (D42); Radar módulo del CRM post-lanzamiento (D43); blog técnico + `/lab`, newsletter aplazada (D44); home v7 con prototipo y gate (D45); lanzamiento = público + área + CRM (D46); vía contratación (D47)». Vault además: `agencias-mensajes.md` → permitir enlace a `/partners` cuando esté en producción; `canales-captacion.md` §1 → «el seguimiento de agencias va en el CRM (`/admin/crm`), Radar después»; `tarifas.md` → decidir Q16 (tarifa para agencias) y Q19 (mentoría). ADR: «Tablas `crm_*` y `chat_*` aditivas; FK nullable a `leads`/`clients`; vista `crm_contacts_view`» · «Un solo `published` por (`case`, `locale`) en `chat_contexts`; el gateway cachea 5 min e invalida al publicar» · «El CRM nunca envía: test negativo global en `apps/api` y `apps/web`» · «Fase 1c en rama propia; `chore/supabase` no crece».

**Nota del vault (`Proyectos/josecoded.md`):** plan v1 escrito el 2026-09-19 con 97 tareas en 10 fases; Radar ≈ 40 % del esfuerzo y al final del camino crítico, con las ramas `feat/radar-core` y `feat/radar-connectors` arrancando tras la fase 1; decisiones a–j de UX §13.19 cerradas como en DT §11.11 (perfil solo lectura + ajustes rápidos, evento `snoozed`, `HERO_LIVE_MOBILE` medido, reautorización de Google desde admin con KV cifrado, `?correos=revisar`, PDF con Browser Rendering + impresión, botones Confirmar · Posponer · Descartar + "Ver y editar", segundo paso "¿Seguro?" de 10 min, pausa con fecha, control de plantilla ≥ 2 referencias); hero: alternativa B (spec v1.5.2); orden de conectores: linkedin-email → Indeed (Mac) → InfoJobs → Tecnoempleo → Workana (Omen) → LinkedIn scraping apagado → Malt-email → Upwork opcional; válvula de escape de §13.9 anotada y no decidida.

**`ESTADO.md`:** "Ahora": plan v2.0 listo (2026-09-29), pendiente `/plan-eng-review`; después arrancan las tareas 0 (0.1–0.6 en paralelo) y la fase 1 con **1.10 (tokens) antes de cualquier UI**. "Pendientes" nuevos: los insumos de la tabla "Insumos que faltan" con la tarea que bloquean (incluidos los textos en inglés, la foto, los casos de estudio, el CV maestro y los de la fase 10); proteger `main` en GitHub. "Siguiente paso": `/plan-eng-review` → fase 0 → fase 1.

**Añadido v2.1 (2026-09-30) al vault y al ADR:** «Lanzamiento todo junto con válvula por fecha; Radar última etapa (D34)» · «Auth desde @josecoded.com con SMTP propio; RPC de usuario solo con email confirmado (D35)» · «Generador: Turnstile → cuota atómica en Supabase → IA con AI Gateway → guarda determinista → reglas; propuesta firmada con HMAC» · «Un único cron `*/5` con despachador `nextRun`; Radar en tres trabajos; presupuesto de 40 subpeticiones por tick» · «GitHub App `josecoded-bot`; auto-merge solo `newsletter/*`; `deploy-content.yml` con guarda `last-deployed`» · «Cookie `ref` solo con aceptación explícita» · «Hito de contenido completo antes de la fase 3» · «Prototipos solo home, Negocios y Contacto» · «WebGL en tablets grandes: desvío aceptado».

**Añadido v2.0 al vault y al ADR:** «Plan v2.0 (2026-09-29): fase 2 = port 1:1 de `home-v6` con tokens generados, motion CSS + `lib/motion/`, capturas comparadas y aprobación de Jose por escena; fase 3 en el orden de PANT §4 con prototipo validado por Jose antes de construir cada pantalla; todo bilingüe; área personalizada por señales con `user_profiles`; blog condicionado a 3 artículos; fase 10 newsletter post-lanzamiento con `/plan-eng-review` propio». ADR: «Tarea 1.10: `design.json` completo es precondición de toda UI» · «Sin `HERO_LIVE_MOBILE`: WebGL solo en escritorio» · «Sin métricas en la web: `perf.json`, `test-counts` y contadores retirados».

**ADR (codebase-memory, al indexar el monorepo tras la fase 1):** los del Anexo del DT más: "Plan v1: tareas 0 con fallback explícito (Vercel, bloom fuera, poster solo, asistido, impresión, Indeed manual, HTML de Tecnoempleo)" · "Migraciones en producción una a una con `apply_migration` por el controlador; baseline regenerado tras cada gate" · "Ramas de Radar por subsistema; mínimo operativo = 7.1–7.8 + 7.16–7.19 + 7.25 (válvula de escape)" · "Tests del gateway en workerd contra `supabase start`; `AI` falso con cola; `fetchMock` estricto con assert global de ausencia de `/send`".

## Auto-revisión del plan

- **Cobertura v3.0:** spec v2.0 §0.2 (vías) → 3.2, 2.14; §0.3 (personas) → puertas de 3, 4, 9.5; §0.4 (chat) → 1.11, 4.4, 6.6, 6.9; §0.5–§0.6 (CRM y modelo) → 1.11, 1.12, 3.8, 6.1, 6.2, 6.7, 6.8, 6.9; §0.7 (blog + lab) → 4.2, 4.5, 2.15; §0.8 (home v7) → 2.0, 2.3, 2.14–2.17; §0.9 (newsletter) → fase 10; §0.12 (criterios) → cada uno con test nombrado (301 en 3.2; cinco precios 3.2; `/partners` 3.3; cuota y fallback 4.4; publicar sin desplegar 6.9; `POST /leads` + contacto 3.8; importación idempotente 1.11/6.7; test negativo de envío 6.8; `/lab` 404 4.5; prototipo aprobado 2.0). PANT v2.0: P20 3.2, P21 3.3, P22–P23 4.5, P11 v2 4.4, P3 v2 3.10, C1–C8 6.x. D43: fase 7 tras 9.6 con `contact_id`. `chore/supabase` intacta (1.6, 1.8, 1.9 como estaban). Preguntas abiertas Q16–Q20 de la spec aplicadas con su recomendación por defecto.

- **Cobertura v2.1:** los 41 hallazgos tienen tarea (tabla del changelog v2.1); ninguna referencia a `QUOTA_KV`, `GITHUB_CONTENT_TOKEN`, `path_open`, `perf.ts` ni `HERO_LIVE_MOBILE` queda como vigente.
- **Cobertura v2.0:** spec v1.6 D27–D33 → 1.1/1.10 (tokens, stylelint), 2.x (home v6, Baseline 2024 con WebKit en 2.15/2.17), 3.x (pantallas de PANT: P1 3.3, P3 3.10, P4 3.2, P2 3.9, P7/P8 3.4, P6 3.5 + 3.14, P18/P19 3.6), 4.1 (señal de origen), 4.2 (D33), 5.1 (D32), todo bilingüe (2.1 `i18n:check` y cada tarea de pantalla), newsletter (fase 10). Working-agreements §12: 2.2 v1 eliminada; GSAP fuera (2.7, DT §1.6.6); `glyph-scene` desde `scene.js` (2.5a/2.5b); 2.3 y 2.10 reescritas; 2.14 v1 → 2.17 con capturas y fallbacks; 1.1 con `design-tokens`, stylelint y scripts. INV §6: 1.10 bloqueante y DT §1.6.2 reescrito. PANT §7: todas las filas tienen tarea (Contacto 3.10, Stack y CV 3.5/3.14, packs de app 3.3/3.9 + `pricing.apps`, tarifas de Empresas confirmadas en 3.2, comparador 3.3, personalización 1.8/4.1/5.1, bilingüe transversal, casos 3.4, blog 4.2/2.15, interiores con scroll libre 3.13).
- **Cobertura de la spec (v1):** §4 público (1–12) → fases 2–4 y 9.1; privado (13–15) → fases 5–7; transversal (Umami, Telegram, reduced-motion, AA) → 2.12/9.2, 3.8/7.19, 2.7–2.8, puertas; infra de Radar → fase 8; §8 SEO/GEO → 2.11, 3.x (JSON-LD por página), 4.2 (RSS, `BlogPosting`), 9.1, 9.5 (baseline GEO); §10 criterios de aceptación → cada uno tiene un test nombrado (hero 2.9/2.14; generador 3.9; chat 4.4/6.6; blog 4.2–4.3; portal 5.1; ampliación 5.4; afiliados 3.11/5.5/6.2; admin 6.1; Radar 7.6/7.18/7.19/7.22/7.23/7.30; SEO 9.1; Umami 9.2; comandos y Lighthouse 2.9/9.5); §13 Radar completo (§13.2 pasos 1–8 → 7.16, 7.17, 7.18, 7.19, 7.22, 7.23; §13.5 conectores → 7.8–7.15; §13.6 integraciones → 7.19–7.23; §13.9 orden y válvula). DT §1.6 hero → 2.5–2.9, 2.17. UX §2 mapa de sitio: todas las rutas tienen tarea (legales 3.6, perfil 4.1, `/chat` 4.4, área 5.x, admin 6.x, Radar 7.25–7.29). **Hueco conocido:** la migración opcional de realtime `20260917100800` se decide en 6.6 y se aplica en 7.7.
- **Placeholders:** ningún "TBD"/"TODO"; donde el contenido completo ya existe en el DT (SQL de §6.2 y §11.1, endpoints de §3 y §11.2, interfaces de §1.6.2, §11.4 y §11.8) el plan lo referencia como "copiar literalmente" con la sección exacta.
- **Consistencia de nombres:** `requireUser`/`requireAdmin` (4.1) usados en 5.x, 6.x, 7.25+; `adminFetch` (6.1) en 7.25–7.29; `track` y `EventMap` (2.12) en 2.10, 2.16, 3.3, 3.9, 3.10, 5.5, 9.2; `priceForProposal`/`computeUpgrade`/`computeAffiliateReward`/`pricing.apps` (1.4, 3.3) en 3.7, 3.9, 5.4, 6.2; `createGlyphScene`/`paramsHash`/`setMode` (2.5b) en 2.6, 2.8; `planFall`/`runIntro` (2.7) en 2.8; `decideHeroMode` (2.8) en 2.17; `emitTokens` (1.10) en 2.2+; `createDisclosure`/`indicatorVisibility` (2.3, 2.16) en 3.10; `openCell`/`createTypewriter`/`markerFor`/`stops`/`filter` (2.10, 2.14, 2.16) en sus islas; `hasDato`/`checkMessages` (2.1) en 2.10, 3.x, 4.2; `resolveAudience` (3.10) y `resolveAreaVariant`/`ensureProfile` (5.1, 4.1); `ClosingCompact` (3.10) en 3.2–3.5, 4.2; `PageHead`/`FAQ`/`ProcessSteps`/`Prose`/`Toc`/`Toast` (3.13) en 3.2–3.6, 4.2, 5.x, 10.4; `transition`/`hasConfirmation`/`revert` (7.2) en 7.18–7.19; `applyRules`/`fingerprint`/`findDuplicate`/`nextRun` (7.3) en 7.16–7.17; `encodeCallback`/`verifyCallback` (7.4) en 7.19; `assembleCv`/`verifyFacts`/`buildGmailQuery`/`linkByRules` (7.5) en 7.17, 7.21, 7.22; `connectors`/`RadarConnector`/`OfferDraft` (7.8) en 7.9–7.16, 7.24; `ingestRun`/`radarAuth` (7.16) en 7.17–7.24; `googleFetch`/`createCalendarEvent` (7.20) en 7.22–7.23.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | ISSUES_FOUND (Claude subagent; Codex not installed) | 8 findings, 7 decided and folded (crons, subrequests, api domain, Paid, content milestone, prototypes, Radar last stage) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 41 issues, 0 critical gaps; all decided by Jose and folded into plan v2.1 / DT v1.4 / spec v1.7 / newsletter v1.2 / working-agreements v1.1 |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CROSS-MODEL:** the outside voice agreed with the review on free-tier limits and added three verified constraints (Workers Free: 5 cron triggers per account, 50 subrequests per invocation, 10 ms CPU); strategic tension on scope resolved by Jose (launch together with date valve, Radar as last stage, stay on Free and decide Paid from the 0.1 measurement).
- **VERDICT:** ENG CLEARED — ready to implement (phase 0). Accepted deviation: WebGL on large tablets. Test plan: `~/.gstack/projects/12joseca12-josecoded/jose-main-eng-review-test-plan-20260930-100453.md`.

NO UNRESOLVED DECISIONS
