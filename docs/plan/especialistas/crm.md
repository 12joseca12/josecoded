# CRM de josecoded: análisis de huecos y funciones priorizadas

**2026-11-05 · especialista CRM (ventas para agencia/freelance con closers a comisión).** Base leída: `datos.md` (§1, §3, §5, §10, §11), `decisiones.md` (3.x, 5.12–5.17, 6.x, 7.x, 8.x), `pantallas.md` (D1–D8, K1–K8, A1–A5, F1–F3), `division-pantallas.md`, `ofertas.md` (§2–§4, offer/extras/offer_answers), `migraciones-chat.md` (M01–M11) y las migraciones aplicadas `base_private_profiles`, `leads`, `crm_core`. Propuesta, no decisión: lo que toca a Jose va en §5. Tamaños: **S** ≤ 30 min, **M** ≤ 1 h (un bloque, 10.2), **L** = 2–4 bloques.

---

## 1. Lo que ya hay (y está bien planteado)

- **Entrada única** `leads` → cartera `contacts` (7.9), reclamo atómico `claim_lead`, emparejado por email que protege la cartera de cada closer (7.8 a). Es justo lo que evita la pelea típica entre closers.
- **Visibilidad jerárquica** por RLS (`owns_contact`, `owns_lead`: dueño o padre), `aal2` obligatorio para personal, `owner_id` solo lo cambia el admin y queda auditado.
- **Pipeline fijo** `new → contacted → meeting → proposal → won | lost` con `won` solo por RPC (`deals_guard`), `lost_at` coherente.
- **Comisión con dos tasas sobre el cobrado**, congeladas por fila, estados `pending → approved → paid | rejected` (7.4–7.7).
- **Historial inmutable** (`activities` sin update/delete), `last_activity_at` por trigger, auditoría en `private.audit_log`.
- **Salas de chat por relación** (closer, cliente por proyecto, freelance) con Nexo y consentimiento del cliente (5.12–5.17); área con fases, tareas, historias fuera de presupuesto (6.8) y documentos.

## 2. Huecos frente a un CRM profesional para este negocio

| # | Hueco | Por qué duele aquí | Gravedad |
|---|---|---|---|
| G1 | **La comisión depende de un `won_amount` único** y se aprueba «al cobrar», pero un proyecto «A medida» se cobra por hitos (p. ej. 40/40/20) y el mantenimiento es mensual | No hay dónde registrar cobros parciales, devoluciones ni recurrentes; el closer no sabe qué parte le toca ya; el admin aprueba a ojo | **Crítica** |
| G2 | **Sin presupuestos/propuestas** ni versiones ni aceptación | El paso `proposal` no tiene objeto; el precio cerrado (`ofertas.md` §2.1) no queda firmado; el cliente acepta por email | **Crítica** |
| G3 | **Sin tareas ni recordatorios**: solo `contacts.next_action/_at` (uno por contacto) | Un closer a comisión vive de los seguimientos; sin cola de tareas ni cadencias los interesados se enfrían | Alta |
| G4 | **Sin probabilidad, fecha prevista de cierre ni historial de fases consultable** (el cambio de fase va a `private.audit_log`, no legible por el CRM) | No hay previsión ponderada, embudo, velocidad por fase ni antigüedad | Alta |
| G5 | **Sin atribución**: `leads` no guarda UTM, referente, enlace del closer ni campaña; `offer`/`extras`/`offer_answers` están propuestos (B6) pero no aplicados | No se sabe qué canal vende ni a quién atribuir un lead que trajo un closer por su cuenta | Alta |
| G6 | **Liquidaciones**: no hay lote de pago, extracto por closer, factura del closer ni retención | Pagar a 3–10 closers cada mes con filas sueltas acaba en disputas | Alta |
| G7 | **RGPD de la cartera**: `contacts` sin base jurídica, sin registro de consentimiento, sin plazo de conservación ni exportación/borrado por titular (solo hay purga del chat) | Contactos importados, de Radar o de WhatsApp sin base documentada; closers externos tratando datos sin contrato de encargado | Alta |
| G8 | **Duplicados**: solo `unique(owner_id, email)` y la cola de importación; sin teléfono normalizado ni fusión | El mismo cliente con dos dueños → dos comisiones reclamadas | Media |
| G9 | **Sin protección/caducidad de la propiedad**: un contacto reclamado es del closer para siempre aunque no lo trabaje | Bloquea la bandeja común; típico conflicto en redes de closers | Media |
| G10 | **Motivos de pérdida libres** (`lost_reason text`) | No se puede analizar por qué se pierde | Media |
| G11 | **Email y WhatsApp solo a mano** (`activities.kind = email | whatsapp` sin metadatos) | Historial incompleto; nadie registra todo | Media |
| G12 | **Sin objetivos ni cuadros de mando** más allá de contadores (K1, D1) | Jose no ve rendimiento por closer ni previsión | Media |
| G13 | **Sin exportación** y sin control de qué se lleva un closer al irse | Riesgo de fuga de cartera | Media |
| G14 | **Onboarding del closer** inexistente (argumentario, reglas de descuento, contrato, RGPD) | Calidad de venta desigual, promesas fuera de alcance | Media |
| G15 | **Portal del cliente sin puntos comerciales**: aceptar propuesta, ver pagos/facturas, convertir historia fuera de presupuesto en ampliación presupuestada | 6.8 dice «se presupuesta», pero no hay objeto que lo cierre ni comisión asociada | Media |
| G16 | **Nombre `tasks` ya usado por proyectos** (§5) | Las tareas del CRM necesitan otra tabla | Baja (de nombres) |

---

## 3. Funciones priorizadas

**MVP** = antes de invitar al primer closer real (coincide con el disparador de `josecoded-dev`, 10.7). **v2** = con 2+ closers activos o primeros cobros. **Después** = cuando el volumen lo pida.

### 3.1 Pipeline: probabilidades, fechas, historial y pérdidas — MVP · M
- **Pantallas:** K3 `DealCard` con `ProbabilityField` (por defecto de la fase, editable), `ExpectedCloseField`, `NextStepField`; `LostDialog` con `LostReasonSelect` + nota; vista K10 **Pipeline** `/crm/pipeline` (`PipelineBoard` columnas por fase con importe y ponderado; en móvil `PipelineList` agrupada) arrastrar = cambiar fase (teclado: menú «Mover a»).
- **Datos:** `deals` + `expected_close_at date`, `probability smallint` (0–100, null = la de la fase), `next_step text`, `lost_reason_code` enum `price | timing | no_response | competitor | scope | not_fit | other`, `stage_changed_at`. Tabla **`deal_stage_events`** (`deal_id`, `from_stage`, `to_stage`, `actor_id`, `at`) escrita por el trigger que ya audita (sustituye la lectura de `audit_log` para analítica; RLS como `deals`). Probabilidad por fase **en código** (`src/lib/crm/stages.ts`: 10/20/40/60/100/0), como las reglas de 8.4, no en tabla.
- Sin cambiar el enum de 7.2: la «negociación» la da el estado del presupuesto (3.5).

### 3.2 Tareas, recordatorios y cadencias — MVP (tareas) · M; v2 (cadencias) · M
- **Pantallas:** K11 **Hoy** `/crm/hoy` (sustituye `DueList` de K1: vencidas, hoy, próximas; completar en línea con «registrar resultado»); `TaskComposer` en K3 y tras registrar una actividad («¿siguiente paso?»); `CadencePicker` en K3 (v2); admin `CadenceEditor` en `/admin/crm/cadencias` (v2).
- **Datos:** **`crm_tasks`** (`id`, `contact_id`, `deal_id`, `owner_id`, `kind` `call | email | whatsapp | meeting | todo`, `title`, `due_at`, `remind_at`, `done_at`, `outcome`, `cadence_run_id`, `created_by`, `created_at`); RLS como `contacts`. `contacts.next_action/_at` pasa a ser **derivada** (vista o trigger: la próxima `crm_task` abierta) y deja de editarse. v2: `cadences` (`slug`, `name`, `via`), `cadence_steps` (`day_offset`, `kind`, `template_key`), `cadence_runs` (`deal_id`, `cadence_id`, `started_at`, `stopped_at`, `stop_reason`); se para sola al responder el contacto (actividad entrante) o al cambiar de fase.
- **Reglas fijas en código (MVP):** al reclamar un interesado → tarea «Primer contacto» a 2 h laborables; al pasar a `proposal` → seguimiento a 3 días; deal sin actividad 14 días → tarea «Reactivar». Recordatorio por Telegram/email desde `private.outbox` (cron de Cloudflare ya previsto).

### 3.3 Línea de tiempo de actividad — MVP · S (ampliar) ; v2 · M (unificada)
- **Pantallas:** K3 `ActivityTimeline` con filtros por tipo y **eventos unificados** (actividades, cambios de fase, tareas hechas, presupuestos enviados/vistos/aceptados, cobros, mensajes de la sala de cliente resumidos, historias del área); `ActivityComposer` con plantillas rápidas («Llamada sin respuesta», «Reunión hecha»).
- **Datos:** `activities` + `direction` enum `in | out | internal`, `duration_min`, `outcome` enum `reached | no_answer | voicemail | meeting_set | not_interested`, `channel_ref text` (id externo de email/WhatsApp para no duplicar), `quote_id`, `payment_id`. `activity_kind` + `quote | payment | task`. Vista **`contact_timeline`** (`union all` bajo RLS) para v2.

### 3.4 Registro de email y WhatsApp — MVP (manual guiado) · S; v2 (email BCC) · M; después (WhatsApp API) · L
- **MVP:** botones `mailto:`/`wa.me` en `ContactHead` que abren el canal **y** crean la actividad `out` con un clic al volver («¿Lo enviaste? Registrar»). WhatsApp de entrada: `NewLeadSheet` ya cubre `source = whatsapp`.
- **v2 email:** dirección de registro por closer (`log+<token>@josecoded.com`) vía **Cloudflare Email Routing → Email Worker** (mismo proveedor, sin servidor nuevo) que parsea, empareja por email con `contacts` visibles para ese closer y crea `activities` (`email`, `in|out`, `channel_ref = Message-ID`); cuerpo truncado a 10.000. **Necesita decisión de dependencias** (parser MIME) por `revisor`.
- **Después:** WhatsApp Business Cloud API (número de Jose, 2.9): webhook → `activities`; solo con plantillas aprobadas y opt-in. No automatizar cuentas personales (misma regla que 8.3).
- **Datos:** `profiles.log_token_hash` (en `private`), sin tablas nuevas.

### 3.5 Presupuestos/propuestas desde «A medida» con versiones y aceptación — MVP · L
- **Pantallas:** K3 pestaña **Propuestas**; `QuoteBuilder` `/crm/propuestas/[id]` (elige nivel de `offers`, extras de `extras` con unidades, líneas libres, descuento, calendario de pagos por fases de 2.14, validez, condiciones; precarga desde `leads.offer/extras/offer_answers`); `QuotePreview` (misma plantilla que el cliente); `QuoteVersionList` (diff entre versiones). Página pública **P9 `/propuesta/[token]`** (sin índice, `noindex`, token opaco como el visitante de 5.10): ver, descargar PDF, «Aceptar» con nombre, cargo, casilla de condiciones y **OTP al email del contacto**; «Pedir cambios» (abre actividad + notificación). PDF generado en servidor (o en Omen si pesa) y guardado en Storage privado `quotes`.
- **Datos:** **`quotes`** (`id`, `deal_id`, `number` `P-2026-0001`, `version` int, `status` enum `draft | sent | viewed | accepted | rejected | expired | superseded`, `offer_slug`, `subtotal`, `discount_amount`, `total_once`, `total_monthly`, `valid_until`, `terms_version`, `snapshot jsonb` (contrato `contracts/quote-snapshot.json`: nombres y precios congelados), `pdf_path`, `public_token_hash`, `sent_at`, `first_viewed_at`, `accepted_at`, `accepted_name`, `accepted_role`, `accepted_email`, `acceptance_evidence jsonb` (hash del PDF, `ip_hash`, user agent resumido, OTP verificado), `rejected_reason`, `created_by`); `unique(deal_id, version)`, solo una `accepted` por deal (índice parcial). **`quote_lines`** (`quote_id`, `kind` `offer | extra | custom | discount`, `ref_slug`, `label`, `qty`, `unit_price`, `billing` `once | monthly | per_unit`, `sort`). **`quote_milestones`** (`quote_id`, `phase` (las cinco), `percent`, `amount`, `due_rule` `on_accept | on_phase_start | on_delivery | date`). RLS: como `deals`; el cliente nunca lee por RLS (todo por servidor con token); al aceptar, editar está prohibido (trigger) y cualquier cambio exige nueva versión (`superseded`).
- **Efectos de `accept_quote` (RPC servidor):** deal → `won` con `won_amount = total_once` (sustituye el importe tecleado de `win_deal`), crea `payment_schedule` (3.6), invitación `client` + `projects` + sala `client` (M11), actividad `quote` y aviso Telegram a Jose.
- **Firma:** firma electrónica **simple** (eIDAS) con OTP + evidencias basta para un contrato de servicios B2B/B2C de este tamaño; firma avanzada con proveedor (Signaturit, Docusign) queda en «Después» y solo si un cliente lo exige. Reglas de descuento (3.6) se comprueban al enviar.

### 3.6 Cobros, facturas y comisiones por cobro; liquidaciones — MVP · L (núcleo); v2 · M (extractos y factura del closer)
- **Decisión de fondo (corrige G1 sin romper 7.6/7.7):** la comisión sigue naciendo al ganar (cabecera `commissions` en `pending`, con tasas congeladas), pero **se devenga por cobro**: cada pago registrado genera líneas para el closer y, si lo hay, para el padre. Así «sobre el importe cobrado» es literal, los hitos y el mantenimiento mensual funcionan y una devolución anula su parte.
- **Facturación legal fuera del CRM:** España obliga a software de facturación conforme a VeriFactu (calendario aplazado; verificar fechas con el gestor). Recomendación: Jose emite en su programa de facturación y el CRM **registra** número, fecha, importe y PDF (o lo trae por API en «Después»). El CRM no numera facturas fiscales.
- **Pantallas:** K3 pestaña **Cobros** (`PaymentSchedule` con hitos, estado, vencido); admin **D9 Cobros** `/admin/cobros` (`ReceivableTable`: pendiente, vencido, cobrado; `RecordPaymentSheet`: importe, fecha, método, factura asociada, PDF); K4 rehecha: `CommissionTotals` (devengado, aprobado, pagado, revertido), `CommissionLineTable` (por cobro), `PayoutList`; admin **D10 Liquidaciones** `/admin/liquidaciones` (`PayoutBuilder` por mes y beneficiario → extracto, `PayoutSheet` marcar pagada con referencia, subir factura del closer); `StatementPdf` (extracto mensual del closer).
- **Datos:**
  - **`payment_schedule`** (`deal_id`, `quote_milestone_id`, `label`, `amount`, `due_at`, `status` `scheduled | invoiced | paid | cancelled`).
  - **`invoices`** (`deal_id`, `external_number`, `issued_at`, `amount_net`, `vat_amount`, `amount_gross`, `pdf_path`, `status` `issued | paid | partially_paid | void`). Las comisiones se calculan sobre **base imponible** (sin IVA): decisión explícita en §5.
  - **`payments`** (`invoice_id`, `deal_id`, `amount_net`, `received_at`, `method` `transfer | card | stripe | other`, `reference`, `kind` `payment | refund`, `recorded_by`). RLS: admin escribe; closer lee los de sus deals (importe neto y fecha).
  - **`commission_lines`** (`commission_id`, `payment_id`, `beneficiary_id`, `role` `closer | parent`, `rate`, `base`, `amount` (negativo en `refund`), `status` `accrued | approved | paid | reversed`, `payout_id`, `approved_at`). Trigger `after insert on payments` las crea con las tasas congeladas de la cabecera. `commissions` queda como cabecera (las columnas `*_amount` pasan a «previsto»).
  - **`payouts`** (`beneficiary_id`, `period` (mes), `total`, `status` `draft | issued | paid`, `statement_path`, `closer_invoice_path`, `paid_at`, `paid_reference`, `withholding_rate` (retención IRPF si el closer es profesional; verificar con gestor), `created_by`). RLS: el beneficiario lee los suyos; admin todo; estados por RPC `set_payout_status` (audita).
- **Reglas en código:** recurrentes (mantenimiento) comisionan **N meses** (decisión §5); cambios de alcance (3.13) comisionan solo si el closer los gestionó (decisión §5); `via = hiring` sin comisión salvo que Jose diga otra cosa.
- **Descuentos:** `profiles.max_discount_pct` (por closer, lo fija el admin); por encima, la propuesta queda `pending_approval` y Jose aprueba desde Telegram/D1 (v2: enlace de un clic).

### 3.7 Objetivos y cuadros de mando — v2 · M (por closer, embudo); v2 · S (previsión)
- **Pantallas:** K1 ampliado (`TargetProgress` del mes, `ForecastCell` ponderado y comprometido, `AgingCell` deals parados); admin **D11 Ventas** `/admin/ventas` (`FunnelChart` lead → reclamado → reunión → propuesta → ganado por fuente/vía/closer; `WinRateTable`; `CycleTimeChart` días por fase de `deal_stage_events`; `CloserLeaderboard` solo para el admin; `ForecastTable` por mes con `expected_close_at × probabilidad`; `CommissionLiability` (devengado sin pagar)). El closer padre ve agregados de sus subclosers sin nombres (como `TeamCell`).
- **Datos:** **`targets`** (`user_id` null = equipo, `period` mes, `metric` enum `won_amount | deals_won | meetings | quotes_sent`, `value`), RLS el propio y admin. Vistas/RPC `crm_funnel(from, to, group_by)`, `crm_forecast(months)` `security definer` que respetan la cartera. Sin tablas de agregados: el volumen cabe en consultas directas.

### 3.8 Puntuación de interesados — v2 · S (reglas); después · M (Omen)
- **Pantallas:** `ScoreBadge` en K8/D8 y K2 (0–100 con «por qué»: `ScoreReasons`), orden por puntuación en la bandeja.
- **Datos:** `leads` + `score smallint`, `score_reasons text[]`, `scored_at`. Reglas puras en `src/lib/crm/lead-score.ts` (como el recomendador): vía, nivel elegido, extras, `wanted_by` cercano, organización con web, `interest` de Nexo, fuente, completitud; se calcula en `submit_lead`/`visitor_handoff` (servidor) y se guarda. Después: Omen ajusta con histórico de ganados (job `lead.score`) solo como sugerencia.

### 3.9 Fuentes y atribución — MVP · S
- **Pantallas:** `LeadDetail` y K3 `SourceCard` (fuente, campaña, página de entrada, respuestas del recomendador, conversación de Nexo, closer que refirió); admin filtros por campaña en D11.
- **Datos:** `leads` + `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `referrer_host`, `landing_path`, `first_seen_at`, **`referred_by`** → profiles; aplicar ya B6 (`offer`, `extras`, `offer_answers`). `contacts` + `first_lead_id` (ya existe `lead_id`) y copia de `utm_campaign`/`referred_by` al reclamar. `profiles.referral_code` (closers).
- **Enlaces de closer** `?ref=<code>`: el interesado entra **asignado a ese closer** (salta la bandeja común) y la atribución queda en el lead. La UTM y el `ref` viajan en la URL y en el estado del formulario/recomendador hasta el envío (sin cookie de seguimiento, coherente con la política de 5.10); si se guardan en cookie, va a la política como técnica o se pide consentimiento (decisión §5).

### 3.10 Duplicados, fusión y propiedad — v2 · M
- **Pantallas:** `DuplicateHint` en `NewContactSheet` y K3 («Puede ser el mismo que…», solo si lo ves); admin **D12 Duplicados** `/admin/crm/duplicados` (`DuplicatePairList`, `MergeSheet` campo a campo); `OwnershipBadge` (protegido hasta…).
- **Datos:** `contacts` + `phone_e164` (normalizado en servidor), índice por `lower(organization)`; **`contact_merges`** (`kept_id`, `merged_id`, `actor_id`, `snapshot jsonb`, `at`). RPC admin `merge_contacts(keep, drop)` mueve deals, actividades, tareas, leads y presupuestos; archiva el otro. Coincidencia con otro dueño → nunca se fusiona sin el admin. **Protección:** `contacts.owner_since`, regla en código «sin actividad en 90 días y sin deal abierto → aviso al dueño; a los 120 → vuelve a la bandeja común» (job diario), con excepción para clientes ganados.

### 3.11 Importar/exportar CSV — importar ya planificado (K5, 7.5) · M; exportar v2 · S
- **Exportar:** `ExportButton` en K2 y D11 → ruta de servidor que genera CSV de lo que RLS deja ver, con límite y **fila en `exports`** (`actor_id`, `scope`, `filters jsonb`, `rows`, `at`) + aviso Telegram a Jose. Recomendación: closers exportan solo su cartera propia (no la de subclosers) y Jose puede apagarlo por closer (`profiles.can_export`).
- **Importar:** añadir columnas de base jurídica y origen a la plantilla (3.15) y `phone_e164`.

### 3.12 Permisos por rol y auditoría — MVP · S (matriz y tests) ; v2 · S (pantalla)
| Recurso | admin | closer | closer padre | client | freelance |
|---|---|---|---|---|---|
| Interesados | todo | sin asignar + suyos | + subclosers | — | — |
| Contactos, deals, tareas, actividades | todo | suyos | + subclosers (lectura y escritura, 7.3) | — | — |
| Propuestas | todo | suyas (crear, enviar dentro del descuento) | lectura subclosers | la suya por token / área | — |
| Cobros, facturas | todo | lectura de sus deals | lectura subclosers | las suyas en el área | — |
| Comisiones, liquidaciones | todo | las suyas | + las de subclosers y tasas (7.10) | — | — |
| Proyecto (fase, avance) | todo | **lectura de fase y avance de sus clientes ganados** (nuevo) | — | el suyo | asignados (6.7) |
| Exportar | todo | su cartera si `can_export` | — | sus datos (3.15) | — |
- **Datos:** extender `private.audit()` a `quotes` (estado), `payments`, `commission_lines`, `payouts`, `crm_tasks` (reasignación), `contact_merges`, `exports`, `leads` (reclamo/asignación). Pantalla admin **D13 Auditoría** `/admin/auditoria` (filtro por tabla, actor, fila) por RPC `security definer`. Test pgTAP por fila de la matriz.

### 3.13 Notificaciones (Telegram para Jose) — MVP · M (sobre M10)
- **Eventos nuevos** (enum en `notification_prefs.event`): `quote_viewed`, `quote_accepted`, `quote_changes_requested`, `discount_approval`, `payment_due`, `payment_overdue`, `payment_recorded` (al closer: «has devengado X»), `task_due` (resumen diario 08:30 por usuario, no uno por tarea), `lead_aging` (sin tocar 24 h), `ownership_expiring`, `story_out_of_scope`, `payout_paid`, `export_done`.
- **Pantallas:** D5 y K6 con `SwitchList` por evento y canal; `NotificationBell` común. Telegram para Jose con **botones inline** (v2): «Aprobar descuento», «Abrir». Reglas fijas en código (8.4).

### 3.14 Portal del cliente: puntos comerciales — MVP (aceptar) · incluido en 3.5; v2 · M (ampliaciones y pagos)
- **Aceptar propuesta:** P9 (3.5); tras aceptar, el email de invitación al área sale solo.
- **Ampliaciones (6.8):** una historia «fuera de presupuesto» que el cliente confirma genera un **presupuesto de ampliación** (`quotes.kind` enum `initial | change_order | renewal`, `story_id`) que el cliente acepta **dentro del área** (A4 `StoryCard` → `QuoteAcceptCard`, sin OTP: ya tiene sesión `aal1` + confirmación); al aceptar, la historia pasa a `in_tasks` y nace su hito de cobro.
- **Pagos y facturas:** **A6 Facturas** `/area/facturas` (`InvoiceList`, descarga por URL firmada, próximo hito). Pago con Stripe en «Después» (extra `payments` del propio catálogo como caso).
- **Ficheros:** ya existen (A3); la propuesta aceptada y el contrato aparecen ahí como documentos `client` automáticamente.
- **Closer:** ve en K3 «Proyecto» (fase y avance, sin tareas internas) para poder hacer seguimiento y vender ampliaciones.

### 3.15 RGPD — MVP · M; v2 · M (automatización)
- **Base jurídica por contacto:** `contacts` + `legal_basis` enum `consent | contract | legitimate_interest | pre_contract`, `basis_note`, `informed_at` (deber de informar del art. 14 cuando el dato no viene del interesado: Radar, importación, referido). Obligatorio al crear/importar.
- **Registro de consentimientos:** **`consents`** (`subject_email`, `contact_id`, `lead_id`, `purpose` enum `contact | marketing | ai_chat`, `granted_at`, `withdrawn_at`, `source`, `text_version`, `evidence jsonb`). `leads.consent_at` y `set_ai_consent` escriben aquí también.
- **Conservación:** job mensual: prospectos sin deal ni actividad en 24 meses → anonimizar (`full_name = 'Contacto anonimizado'`, nulos en email/teléfono/notas, conservar ids y agregados); clientes con facturas → datos fiscales 6 años (Código de Comercio; verificar con gestor). Plazos en código, mostrados en la política.
- **Derechos:** admin **D14 Privacidad** `/admin/privacidad`: buscar por email → `DsarResult` (todas las filas: leads, contactos, actividades, mensajes, documentos) → «Exportar JSON/ZIP» (job) y «Borrar/anonimizar» (respeta lo fiscal, deja `audit_log`). Plazo de respuesta 1 mes: tarea automática al registrar la solicitud.
- **Closers como encargados:** aceptación en el onboarding del **contrato de encargado del tratamiento** (art. 28) y del acuerdo comercial (3.16); sin aceptación no reclaman leads.

### 3.16 Onboarding y formación de closers — MVP · S (contrato + checklist); v2 · M (academia)
- **Pantallas:** **K9 Empezar** `/crm/empezar` (`OnboardingChecklist`: aceptar acuerdo y DPA, vincular Telegram, leer reglas de comisión y descuento, primer contacto de prueba); v2 **K12 Aprende** `/crm/aprende` (argumentario por nivel y extra, objeciones, «qué no prometer» (alcance, plazos, IA), guiones de primera llamada y WhatsApp, cómo usar el recomendador con el cliente, casos). Contenido en **MDX en el repo** (`content/crm/*.mdx`, validado por zod) como el blog: publicar es un PR. Textos marcados para `redactor`/`comercial` en el Mac.
- **Datos:** **`agreements`** (`slug`, `version`, `body_path`, `published_at`), **`agreement_acceptances`** (`user_id`, `agreement_id`, `accepted_at`, `ip_hash`); **`onboarding_progress`** (`user_id`, `item_slug`, `done_at`). Guard en `claim_lead`: exige acuerdo vigente aceptado (error tipado `onboarding_required`).

### 3.17 Uso en móvil — MVP · S (criterios en cada pantalla); v2 · M (acciones rápidas)
- K2 en móvil como **lista de tarjetas** (container queries) con llamada/WhatsApp de un toque; K11 Hoy como pantalla de entrada en móvil; tras `tel:` o `wa.me`, al volver a la pestaña (`visibilitychange`) aparece `QuickLogSheet` («¿Cómo fue?» con los `outcome` de 3.3 y siguiente tarea). `ActivityComposer` con dictado nativo del teclado (sin librería). PWA instalable (manifest + iconos) para closers, sin modo sin conexión. Skill `mobile-native` en cada pantalla CRM.
- Después: bot de Telegram con comandos para Jose (`/hoy`, `/cobros`, aprobar descuentos) desde el mismo drenador de `outbox`.

---

## 4. Orden propuesto de bloques (sobre `migraciones-chat.md`)

| Orden | Rama | Contenido | Tamaño |
|---|---|---|---|
| 1 | `data/leads-attribution` | B6 (`offer`, `extras`, `offer_answers`) + UTM, `referred_by`, `referral_code` | S |
| 2 | `data/deal-pipeline` | Campos de 3.1, `deal_stage_events`, `lost_reason_code` | S |
| 3 | `data/crm-tasks` | `crm_tasks`, `next_action` derivado, reglas de tareas automáticas | M |
| 4 | `data/quotes` | `quotes`, `quote_lines`, `quote_milestones`, `accept_quote` | M |
| 5 | `data/payments-commissions` | `payment_schedule`, `invoices`, `payments`, `commission_lines`, `payouts`, reescritura de `win_deal` | M (2 PR) |
| 6 | `data/gdpr-base` | `legal_basis`, `consents`, `agreements`, `agreement_acceptances`, `onboarding_progress` | S |
| 7 | `crm/pipeline`, `crm/today`, `crm/quote-builder`, `public/quote-accept`, `admin/payments`, `crm/commissions`, `admin/payouts`, `crm/onboarding` | Pantallas MVP (cada una con prototipo en `prototipos/` aprobado por Jose) | M c/u |
| 8 | v2 | cadencias, email BCC, dashboards/objetivos, puntuación, duplicados/fusión, exportar, A6 + ampliaciones, D13/D14, academia | M c/u |

Todas las migraciones con el gate de 10.7 (OK de Jose por migración, advisors antes/después, nunca `db reset`) y tests pgTAP por política.

## 5. Preguntas para Jose (con recomendación)

1. **Comisión por cobro** (líneas por pago, reversión en devolución) en vez de aprobar la fila entera al cobrar. *Recomendada: sí.*
2. **Base de la comisión**: neto sin IVA. *Recomendada: neto.*
3. **Recurrentes** (mantenimiento, IA mensual): comisión durante N meses. *Recomendada: 12 meses.*
4. **Ampliaciones** (historias fuera de presupuesto): comisionan al closer del proyecto. *Recomendada: sí, con la misma tasa, solo si la ampliación se acepta en los 12 meses siguientes al cierre.*
5. **Vía `hiring`** (contratarte como empleado): ¿comisión? *Recomendada: no, o tarifa fija aparte decidida caso a caso.*
6. **Protección de cartera**: 90 días sin actividad → aviso; 120 → vuelve a la bandeja común. *Recomendada: sí, salvo clientes ganados.*
7. **Descuento máximo por closer** sin aprobación. *Recomendada: 10 %; por encima, tu aprobación desde Telegram.*
8. **Facturación**: registrar en el CRM las facturas emitidas en tu programa conforme a VeriFactu, sin emitir desde aquí. *Recomendada: sí.*
9. **Exportación por closers**: solo su cartera propia y desactivable por persona. *Recomendada: sí.*
10. **Atribución `?ref=`**: en URL y formulario, sin cookie. *Recomendada: sin cookie en MVP.*
11. **Firma**: simple con OTP y evidencias; avanzada solo bajo demanda. *Recomendada: simple.*
12. **El closer ve fase y avance del proyecto** de sus clientes ganados. *Recomendada: sí (no tareas, no documentos).*
