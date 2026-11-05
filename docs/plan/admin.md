# Plan de la zona admin (y el mínimo del CRM que usa el admin)

**2026-11-05 · `arquitecto` · destino `docs/plan/admin.md`.** Plan para construir `/admin` completo con bloques que varios agentes implementan hoy en paralelo. Reutiliza sin reabrir: roles y `aal2` (3.1–3.7), CRM y comisiones (7.1–7.16), admin (8.1–8.5), seguridad (9.1, 9.6), Supabase compartido con OK por migración (10.7), pantallas D1–D8 y K1–K8 de `pantallas.md`, modelo de `datos.md` §1–§3 y §11, migraciones M01–M04 escritas (`supabase/migrations/`), M05–M11 del chat (`migraciones-chat.md`) y M12–M25 del plan maestro (§4.6). Donde este plan cambia el alcance de una migración ya numerada lo dice en §2.

Base de partida en `origin/main`: shell `/admin` (`AdminShell`, `AdminNav`, guarda `requireZone` con `aal2`), `/admin/interesados` con asignar y descartar (M04), mock de backend para E2E (`scripts/e2e-mock-backend.js`, OTP `123456`, TOTP `654321`, `admin@example.com`), pgTAP sin Docker (`pnpm db:test:local`). M04 escrita y **no aplicada** (sin credencial); M01–M03 aplicadas.

---

## 0. Decisiones de este plan (las toma `arquitecto`; reversibles con un PR)

| # | Decisión | Por qué |
|---|---|---|
| P1 | **El CRM del admin es `/crm`**, compartido con los closers (K2, K3, K4, K8); el admin ve lo exclusivo con `data-only="admin"` (dueño, reasignar, aprobar). En `/admin` viven solo D1–D5, D8, D9 Cobros, D10 Liquidaciones. `roles.ts` ya deja al admin entrar en las cuatro zonas. | Una pantalla por concepto (regla 3); `pantallas.md` ya dice «misma pantalla que K8 con todos los filtros». |
| P2 | **Un solo `StaffShell`** (`AdminShell` generalizado con `zone` `admin \| crm`): raíl lateral en escritorio, barra inferior de cuatro en móvil, nav desde un registro `src/lib/staff/nav.ts` con `ready` por entrada. | Hoy el nav está inline en `admin/layout.tsx`: cada bloque lo pisaría. Con el registro, cada bloque cambia una línea distinta. |
| P3 | **Numeración de migraciones:** M05–M11 (chat) y M12–M25 (plan maestro) conservan su número; las nuevas del admin son **M26–M31**. **El número identifica; el orden de aplicación lo da el timestamp del fichero y la columna Depende** (sustituye a «el número es el orden» de `migraciones-chat.md` §0). Tres ajustes de alcance: M10 pierde la base de `outbox`/`notifications` (pasa a M26) y queda solo con el trigger de `messages`; M12 se adelanta y fija la lista de claves; M19 y M20 se reescriben para 7.12–7.15 y dependen de M27, no de M18 (`quotes` sale del camino del admin; `accept_quote` llamará a `win_deal` cuando exista). | Evita renumerar tres documentos y `ESTADO.md`; el admin no espera al chat. |
| P4 | **`admin_counters()` devuelve `jsonb`** y cada migración posterior lo amplía con `create or replace`; el cliente lo parsea con zod y claves opcionales. | Un RPC con tipo de fila cerrado no se puede ampliar sin `drop`. |
| P5 | **Proforma como página imprimible** (`/admin/cobros/proformas/[id]/imprimir`, `@media print`, «no es factura», numeración `PF-AAAA-NNN`); sin librería PDF. La factura externa se adjunta como PDF subido al bucket privado `billing`. | Regla 10: una dependencia la decide `revisor`; en Workers generar PDF no es trivial. **Pregunta 3.** |
| P6 | **El admin no cobra comisión** cuando él mismo es el dueño de la oportunidad: `win_deal` no crea cabecera si el dueño es `admin`. | 7.4–7.7 hablan de closers; evita líneas a nombre de Jose. |
| P7 | **Recurrentes (7.14):** los 12 meses cuentan desde `deals.recurring_started_at` (fecha del primer cobro recurrente); `cancel_recurring(deal_id)` fija `recurring_cancelled_at`; los cobros posteriores no devengan. | «12 meses o hasta que el cliente cancele, lo que ocurra antes». |
| P8 | **Cadencia por defecto quincenal** (`payout.default_cadence = biweekly` en `site_settings`), sobrescribible por closer (`profiles.payout_cadence`); el periodo se calcula en código (`src/lib/crm/payout-periods.ts`). | 7.13 deja las tres preparadas; el valor por defecto se cambia en D4 sin migración. |
| P9 | **IVA por documento** con valor por defecto `billing.vat_rate = 21` en `site_settings`, editable por proforma (puede ser 0). Lo que diga el gestor (7.15) cambia un número, no el esquema. | Jose aún no está dado de alta; el campo lo absorbe. |
| P10 | **Alta del invitado:** el servidor crea `auth.users` al invitar (`auth.admin.createUser` con `email_confirm: true`, sin email de Supabase) y el enlace `/invitacion/[token]` sale por nuestro `outbox`; el invitado entra con el OTP normal y `accept_invitation` crea su `profiles`. | `signInWithOtp` tiene `shouldCreateUser: false` (3.4); la plantilla de Supabase no la controlamos. **Pregunta 1.** |
| P11 | **Ficheros compartidos con regla de inserción:** `messages/{es,en}.json` un espacio de claves por bloque (`admin.<pantalla>`, `crm.<pantalla>`, `invitation`), `database.ts` sincronizado a mano con inserción alfabética en `Tables`/`Views`/`Functions`/`Enums` (se regenera con `pnpm db:types` al aplicar), seed partido en `supabase/seed/NN_<dominio>.sql`, mock partido en `scripts/mock/<dominio>.js`, lista de funciones permitidas de `90_lint.test.sql` una por línea en orden alfabético. | Es lo que permite que seis agentes no se pisen hoy. Lo prepara A00. |

---

## 1. Alcance por pantalla

Común a todas: `requireZone("admin")` en layout y página (login → `/entrar`, sin `aal2` → `/entrar/totp`, otro rol → 404); RLS con `private.is_admin()` (exige `aal2`); Server Actions con zod en la entrada y `revalidatePath`; esqueleto por región en `Suspense`; `EmptyState` y `ErrorState` con reintento; cada botón que lanza acción con estado de carga y resultado anunciado (`Toast`/`role=status`); hojas con `<dialog>` nativo (foco devuelto al disparador); confirmación en lo destructivo; `mobile-native` en cada pantalla; una acción coral por vista. Textos en `messages/es.json` (y `en.json` con el mismo valor marcado para `redactor`).

### D1 Resumen `/admin`
- **Ve:** celdas `CounterCell` (interesados nuevos sin asignar · interesados que esperan al admin (`new` con `contact_id`) · invitaciones pendientes · comisiones devengadas sin aprobar (n e importe) · cobros vencidos · proformas enviadas sin cobrar · liquidaciones en borrador · trabajos fallidos · hilos sin leer, cuando exista M06), `OmenStatus` (semáforo: verde < 2 min, ámbar < 10, rojo o «sin latido»; versión; cola `queued/running/failed`), `RecentAudit` (últimas 10 filas de `admin_audit_log()` en texto).
- **Acciones:** cada celda enlaza a su lista filtrada. Sin más.
- **Estados:** esqueleto por celda; una celda cuya clave falta en el `jsonb` muestra «—» (migración aún no aplicada); error global con reintento.
- **Datos:** `admin_counters()` (M28, ampliada en M31 y M10), `omen_status()` (M05), `admin_audit_log(null, null, 10)` (M28).
- **Permisos:** admin `aal2`. **Auditoría:** solo lectura.

### D2 Usuarios `/admin/usuarios`
- **Ve:** `UserTable` (nombre, email, rol, estado activo/baja, closer padre, tasas proyecto y recurrente, cadencia, TOTP sí/no, contactos, oportunidades abiertas, comisión devengada pendiente) y debajo `InvitationList` (email, rol, invitado por, caduca, estado `pending \| accepted \| expired \| revoked`).
- **Acciones:** **Invitar** (acción coral; `InviteSheet`: email, rol, closer padre si subcloser, `closer_rate`, `parent_rate`, `closer_recurring_rate`, `parent_recurring_rate` con `check` recurrente < proyecto, cadencia, proyecto si cliente (vacío hasta `projects`), nota; previsualiza «sobre 1.000 € cobrados: closer X €, padre Y €») → Server Action: `auth.admin.createUser` + `invite_user(...)` → outbox email con el enlace; `UserSheet`: editar tasas (`set_user_rates`; aviso «se aplican a las oportunidades que se ganen a partir de ahora»), desactivar y reactivar (`set_user_active`; con subclosers activos falla `closer_has_subclosers` y la hoja dice qué hacer), `ReassignSheet` (`reassign_portfolio(from, to)`: contactos, oportunidades abiertas e interesados abiertos; muestra el recuento antes de confirmar), **Restablecer TOTP** (Server Action con clave de servicio: `auth.admin.mfa.deleteFactor` + `log_totp_reset(user_id)` + outbox email al usuario; confirmación), reenviar invitación (`renew_invitation` → token nuevo, outbox), anular (`revoke_invitation`).
- **Estados:** vacío inicial «Invita al primer closer»; `UserSheet` con pestaña «Historial» (`admin_audit_log('profiles', id)`); errores tipados: `invalid_parent_closer`, `rates_recurring_not_lower`, `last_admin_required`, `email_already_invited`, `email_already_member`.
- **Datos:** `admin_users()`, `invitations`, RPC de M27/M28. **Auditoría:** `profiles` (trigger existente), `invitations` (insert/update), `log_totp_reset` escribe `audit_log` con acción `update` y `after.totp_reset = true`.

### U4 Invitación `/invitacion/[token]` (zona pública con sesión)
- **Ve:** resumen («Jose te invita como closer», caduca el…), sin datos de nadie más. Sin sesión: botón «Entrar con mi correo» → `/entrar?email=…&next=/es/invitacion/<token>` (email prellenado y bloqueado; `safeNext` admite `invitacion`). Con sesión `aal1` sin perfil: formulario nombre + idioma → `accept_invitation(token, full_name, locale)` → si rol con TOTP → alta en `/entrar/totp` → zona; si cliente → `/area`. Con perfil ya creado → a su zona.
- **Estados:** token caducado, usado o anulado (pantalla propia con «pide una nueva invitación a Jose»); email de la sesión distinto del de la invitación (`invitation_email_mismatch`; pantalla con «sal y entra con el correo invitado»).
- **Datos:** `read_invitation(token)` (wrapper `service_role` para pintar la pantalla sin sesión), `accept_invitation` (`authenticated`). **Auditoría:** `invitations.accepted_at`, inserción en `profiles`.

### D3 Precios `/admin/precios`
- **Ve:** `Tabs` Niveles · Extras · Tarifas · Mantenimiento; `PriceTable` por pestaña (slug, nombre es/en, precio o «Precio en revisión» si `null`, semanas, facturación, visible, orden, archivado); `PriceHistory` desplegable por fila (`price_changes`: campo, antes, después, quién, cuándo).
- **Acciones:** editar en `PriceItemSheet` (precio, semanas, textos es/en, visible, orden); crear (solo extras y planes; los niveles y tarifas tienen slugs cerrados por `ofertas.md`); archivar lógico con confirmación; reordenar con botones «subir/bajar» (teclado) además de arrastrar. Guardar invalida la caché pública (`revalidateTag("catalog")`).
- **Estados:** esqueleto de tabla; `null` se muestra como `PriceState review`; conflicto de edición concurrente (`updated_at` distinto → «ha cambiado, recarga»).
- **Datos:** `offers`, `extras`, `rates`, `maintenance_plans`, `price_changes` (M29). La web pública los lee en un bloque aparte (`public/prices-from-db`): hasta entonces sigue en código. **Auditoría:** trigger `price_changes` por campo + `audit()`.

### D4 Sistema `/admin/sistema`
- **Ve:** `SwitchList` de `site_settings` agrupada: Secciones (`blog`, `lab`, `public_chat`, `show_prices`), Mantenimiento (`maintenance.on`, `maintenance.until`), Disponibilidad (`availability.*`, con «actualizado el», plan maestro Q3), Nexo (`nexo.reply_delay_min`, 5.15 b), Comisiones (`payout.default_cadence`, `billing.vat_rate`); `OmenStatus` ampliado (latido, versión, modelos) y `JobTable` (kind, estado, intentos, `run_after`, error truncado) con filtro por estado.
- **Acciones:** cambiar un ajuste (`set_setting(key, value)`; guardado inmediato por ajuste, con `role=status`; sin botón Guardar global); reintentar (`retry_job`) y cancelar (`cancel_job`) con confirmación.
- **Estados:** sin latido → banda ámbar «Omen no responde desde…»; `JobTable` vacía «Sin trabajos»; ajuste no permitido → `setting_key_not_allowed`.
- **Datos:** `site_settings` (M12), `omen_status()` (M05), `admin_jobs()`, `retry_job`, `cancel_job` (M30). **Auditoría:** `site_settings` (`audit()` por fila), `private.jobs` cambios manuales con `audit_log` (`table_name = 'jobs'`).

### D5 Notificaciones `/admin/notificaciones`
- **Ve:** `TelegramLinkCard` (no vinculado → código de 6 caracteres válido 15 min con el enlace `t.me/<bot>?start=<código>` → vinculado con fecha), `RuleMatrix` evento × canal (Telegram · email · campana) con los eventos de `notification_event`: `lead_new`, `lead_claimed`, `message_new` (sin efecto hasta M10), `commission_accrued`, `payment_recorded`, `payment_overdue`, `payout_paid`, `job_failed`, `omen_down`, `invitation_accepted`; «Enviar prueba» por canal.
- **Acciones:** generar código (`telegram_link_code()`), desvincular (`telegram_unlink()`), cambiar interruptor (`set_notification_pref(event, channel, enabled)`; inmediato), enviar prueba (`send_test_notification(channel)` → fila en `outbox`).
- **Estados:** sin bot configurado (`TELEGRAM_BOT_USERNAME` ausente) → la tarjeta explica qué falta y no genera código; drenador apagado → aviso «los envíos se encolan y no salen» (pregunta 6).
- **Datos:** `notification_prefs`, `private.telegram_*`, `private.outbox` (M26); drenador en Next (`infra/outbox-drain`). **Auditoría:** `telegram_links` insert/delete en `audit_log`.

### D8 Interesados `/admin/interesados` y ficha `/admin/interesados/[id]`
- **Ve (lista, ya existe):** añade `FilterBar` en la URL (`?status&via&source&owner&q`), columnas origen y organización, contador por pestaña (Nuevos · Esperan al admin · Asignados · Convertidos · Descartados) y botón **Añadir** (`NewLeadSheet`: `source` `whatsapp \| manual`, vía, nombre, email, teléfono, organización, mensaje, asignado a; inserción directa con el grant por columnas de M04).
- **Ve (ficha):** `LeadDetail` con mensaje completo, campos por vía (`offer`, `extras`, `offer_answers` con las etiquetas de `ofertas.md`), consentimiento, página y idioma, origen y fecha; `OwnerCard` (asignado, por quién, cuándo; contacto enlazado → `/crm/contactos/[id]`, oportunidad y fase); `AuditList` (`admin_audit_log('leads', id)`); conversación de origen cuando exista M06.
- **Acciones:** asignar, reclamar para mí (`claim_lead`), descartar con motivo, cambiar asignación (`assign_lead` a otro); todas con el patrón de `LeadActions` actual (`stale` → recarga).
- **Estados:** 404 propia si el id no existe o no es uuid; ficha de descartado en lectura con el motivo y quién.
- **Datos:** `leads`, `profiles`, `contacts`, `deals` (M02–M04). Sin migración nueva. **Auditoría:** ya en M04.

### K2 Contactos `/crm/contactos` (admin: filtro de dueño)
- **Ve:** `ContactTable` densa (nombre, organización, tipo, fase de la oportunidad abierta, siguiente acción y fecha, último contacto, origen; admin: dueño) que bajo 46rem de contenedor se apila en tarjetas con llamada y WhatsApp de un toque; `FilterBar` (`?kind&stage&due=1&q&owner`).
- **Acciones:** **Nuevo contacto** (coral; `NewContactSheet` → insert bajo RLS con `owner_id = auth.uid()`), abrir ficha, `StageSheet` (cambio rápido de fase salvo `won`).
- **Estados:** esqueleto; vacío inicial «Añade o importa tu primer contacto» (importar enlaza a K5 cuando exista); vacío por filtro.
- **Datos:** `contacts`, `deals`, `profiles` (M03). Sin migración nueva.

### K3 Contacto `/crm/contactos/[id]` (admin: reasignar, ganar)
- **Ve:** `ContactHead` (datos, copiar email, dueño), `DealCard` por oportunidad (fase, vía, oferta, importe estimado; ganada: importe cobrado, recurrente mensual, inicio y cancelación), `ActivityTimeline` (`activities` + cambios de fase desde `audit_log` del admin) y `ActivityComposer`; pestañas Actividad · Oportunidades · Cobros y comisión (admin ve `payment_schedule`, proformas, pagos y líneas; el closer, importes netos y sus líneas).
- **Acciones:** nota/llamada/reunión (`activities`), nueva oportunidad, cambiar fase, **Marcar ganada** (`win_deal(deal_id, won_amount, recurring_monthly)`; la hoja muestra la comisión prevista con las tasas congeladas), perder con motivo, cancelar recurrente (`cancel_recurring`), reasignar (admin, `assign_contact_owner` existente por `update` bajo RLS admin), invitar al área (`InviteSheet` con `project_id` vacío hasta `projects`).
- **Estados:** 404 si no es de mi cartera; conflicto de fase (`deals.updated_at`) → recarga.
- **Datos:** M03, M19, M20. **Auditoría:** `deals` fase y dueño (existente), `commissions` insert.

### D9 Cobros `/admin/cobros`
- **Ve:** `ReceivableTable` (contacto, oportunidad, hito o mes, importe, vence, estado `scheduled \| proforma_sent \| invoiced \| paid \| overdue \| cancelled`), pestañas Pendientes · Vencidos · Cobrados · Proformas · Facturas; `DocumentTable` (kind, número, fecha, neto, IVA, bruto, estado, PDF).
- **Acciones:** **Registrar cobro** (coral; `RecordPaymentSheet`: oportunidad, hito o «sin hito», importe neto, fecha, método, referencia, tipo `payment \| refund`, naturaleza `project \| recurring`, factura asociada) → `record_payment(...)`; crear calendario de hitos (`set_payment_schedule(deal_id, items[])`: etiqueta, %, importe, vence; plantilla 40/40/20 de `ofertas.md`); emitir proforma (`issue_proforma(schedule_id, vat_rate)` → número `PF-AAAA-NNN` y página imprimible); registrar factura externa (`record_invoice(...)` + subida de PDF por el servidor al bucket `billing`); cancelar hito.
- **Estados:** vacío «Nada que cobrar todavía»; vencido en coral; `payment_exceeds_schedule` y `refund_exceeds_paid` en línea.
- **Datos:** M20. **Auditoría:** `payments`, `invoices`, `payment_schedule` con `audit()`.

### K4 Comisiones `/crm/comisiones` (admin aprueba; closer lee)
- **Ve:** `CommissionTotals` (devengado · aprobado · pagado · revertido; en K4 son filtros), `CommissionLineTable` (fecha del cobro, contacto, oportunidad, naturaleza, base neta, beneficiario y papel, %, importe (negativo en devolución), estado, liquidación). El closer padre ve también las de sus subclosers (7.10). Pestaña «Cabeceras» (`commissions`: deal, tasas congeladas, previsto, devengado hasta hoy).
- **Acciones:** admin: aprobar selección (`approve_commission_lines(ids)`), rechazar línea con motivo (`reject_commission_line(id, reason)`). Closer: solo lectura.
- **Estados:** vacío por estado; `line_not_accrued` si ya cambió.
- **Datos:** M19, M20. **Auditoría:** `commission_lines` cambios de estado.

### D10 Liquidaciones `/admin/liquidaciones`
- **Ve:** `PayoutList` (beneficiario, periodo, cadencia aplicada, total, retención, neto a pagar, estado `draft \| issued \| paid`, referencia), `PayoutBuilder` (beneficiario → periodo sugerido por su cadencia → líneas aprobadas sin liquidar → total), detalle con `StatementPrint` (extracto imprimible) y «Subir factura del closer».
- **Acciones:** crear borrador (`build_payout(beneficiary_id, period_start, period_end)`), emitir (`set_payout_status(id, 'issued')`), marcar pagada con fecha y referencia (`set_payout_status(id, 'paid', paid_at, reference)` → líneas `paid`; **el pago se registra, no se ejecuta**, 7.4), anular borrador (`delete_payout_draft`).
- **Estados:** vacío; «sin líneas aprobadas en el periodo».
- **Datos:** M31. **Auditoría:** `payouts` con `audit()`.

**Fuera de este plan (v2 o chat):** D6 bandeja de chat, D7 proyectos, K5 importar, K7/K9/K10/K11, propuestas (`quotes`, M18), D11–D14, analítica.

---

## 2. Migraciones

Reglas: una migración por bloque, idempotente hacia delante, todo objeto nuevo en `public` con `revoke all from anon, authenticated` y RLS antes de la primera política; funciones `security definer` con `set search_path = ''` y `revoke execute from public`; RPC para `authenticated` comprueban rol dentro y lanzan errores tipados (`P0001` con mensaje `snake_case`; `42501` para permisos); grants por columna donde el cliente escribe directo; `private.audit()` en lo que se cita en §1. Cada bloque `data/*`: SQL + `supabase/tests/NN_<nombre>.test.sql` + `supabase/seed/NN_<dominio>.sql` + entradas en `database.ts` (a mano, alfabético) + nombres nuevos en la lista de `90_lint.test.sql`; verde en `pnpm db:test:local`; termina con el paso **«pedir OK a Jose para `supabase db push` a `josecoded` (drift y advisors antes y después)»**, que hoy no se ejecuta por falta de credencial. La interfaz se prueba con el mock (§3).

Orden de aplicación (timestamps): M05 · M12 · M26 · M27 · M28 · M29 · M30 · M19 · M20 · M31. Hoy pueden escribirse en paralelo M05, M12, M26, M29 (dependen solo de M01–M04).

| # | Fichero (sufijo) | Rama | Depende | Tam. |
|---|---|---|---|---|
| M05 | `jobs_heartbeat` | `data/jobs-heartbeat` | M01 | S |
| M12 | `site_settings` | `data/site-settings` | M01 | S |
| M26 | `outbox_notifications_base` | `data/outbox-base` | M04 | M |
| M27 | `invitations` | `data/invitations` | M26 | M |
| M28 | `users_admin` | `data/users-admin` | M27 | M |
| M29 | `catalog_prices` | `data/catalog-prices` | M01 | M |
| M30 | `jobs_admin` | `data/jobs-admin` | M05 | S |
| M19 | `commissions_core` | `data/commissions` | M03, M27 | M |
| M20 | `payments_proformas` | `data/payments` | M19, M12 | M |
| M31 | `payouts` | `data/payouts` | M20 | M |

### M05 · `jobs_heartbeat` (número del plan del chat; contrato fijado aquí)
- **Tablas:** `private.jobs` (`id`, `kind` enum `job_kind` con `chat.reply`, `chat.summary`, `rag.index`, `radar.scan`, `radar.score`, `radar.draft`, `radar.send`, `account.delete`, `notify.send`; `payload jsonb`, `status` enum `queued \| running \| done \| failed \| cancelled`, `attempts`, `max_attempts` default 3, `run_after`, `locked_by`, `locked_at`, `result jsonb`, `error`, `created_at`, `finished_at`), `private.heartbeat` (`service` pk, `seen_at`, `version`, `models jsonb`).
- **Funciones:** `private.enqueue_job(kind, payload, run_after)`; `private.claim_jobs(worker, limit)` con `for update skip locked`; `private.finish_job(id, result, error)`; wrappers `public.omen_claim_jobs`, `public.omen_finish_job`, `public.omen_heartbeat(version, models)` con `EXECUTE` solo `service_role` (9.6). **`public.omen_status()`** → `jsonb` `{seen_at, version, models, queued, running, failed}` para admin.
- **RLS/grants:** `private.*` sin acceso; `omen_status` `authenticated` con `is_admin()` dentro.
- **Tests `05_jobs.test.sql`:** `authenticated` no ve `private.jobs`; `omen_status()` falla para closer y responde al admin con los contadores; `claim_jobs` entrega cada trabajo una vez en dos llamadas; `service_role` ejecuta los wrappers y `authenticated` no.

### M12 · `site_settings` (número del plan maestro; alcance fijado aquí)
- **Tabla:** `site_settings` (`key` pk, `value jsonb`, `public bool`, `updated_by`, `updated_at`) con `check (key in (…))` sobre la lista cerrada: `blog`, `lab`, `public_chat`, `show_prices`, `maintenance`, `availability.next_project_month`, `availability.weekly_hours`, `availability.from`, `nexo.reply_delay_min`, `payout.default_cadence`, `billing.vat_rate`. Seed con los valores por defecto (`blog=false`, `lab=false`, `public_chat=false`, `show_prices=true`, `maintenance={"on":false}`, `nexo.reply_delay_min=10`, `payout.default_cadence="biweekly"`, `billing.vat_rate=21`).
- **Vista:** `public_settings` (`security_invoker`? no: la vista filtra `public = true` y necesita leer la tabla con RLS que `anon` no pasa → vista **`security_definer`**-equivalente no existe; solución: política `select` para `anon` en la tabla **restringida a `public = true`** y vista `security_invoker` sobre ella con grant a `anon`). Única excepción documentada a «`anon` sin grants» junto a `public_offers/extras/rates`; `00_anon_grants.test.sql` actualiza su lista.
- **RPC:** `set_setting(key, value)` admin: valida tipo por clave (bool, int, texto `YYYY-MM`, enum cadencia) → `setting_key_not_allowed`, `setting_value_invalid`; actualiza `updated_by/at`; trigger `audit()`.
- **Tests `12_site_settings.test.sql`:** `anon` lee solo filas `public`; closer no escribe; admin cambia `blog`; clave fuera de lista falla; valor de tipo erróneo falla; fila en `audit_log`.

### M26 · `outbox_notifications_base` (parte de M10 adelantada; M10 queda con el trigger de `messages`)
- **Tablas:** `private.outbox` (`id`, `channel` enum `email \| telegram`, `recipient` text, `template` text, `payload jsonb`, `status` `queued \| sending \| sent \| failed`, `attempts`, `last_error`, `created_at`, `sent_at`); `notifications` (`id`, `user_id`, `event`, `title`, `body`, `href`, `read_at`, `created_at`); `notification_prefs` (`user_id`, `event`, `telegram bool`, `email bool`, `bell bool`, pk `(user_id, event)`); enum `notification_event` (lista de D5); `private.telegram_links(user_id pk, chat_id bigint unique, linked_at)`, `private.telegram_codes(user_id pk, code text unique, expires_at)`.
- **Funciones:** `private.notify(user_id, event, title, body, href)` (consulta prefs; inserta `notifications` si `bell`, `outbox` email si `email`, `outbox` telegram si hay `telegram_links` y `telegram`); trigger `leads_notify_new` `after insert on leads` → email a la bandeja de la vía (2.23: `hola@`, `freelance@`, `proyectos@`) y `notify` al admin (`lead_new`) y al asignado (`lead_claimed` cuando `assigned_to` no es nulo); RPC `authenticated` con `is_staff()`: `telegram_link_code()` → código, `telegram_unlink()`, `set_notification_pref(event, channel, enabled)`, `send_test_notification(channel)`, `mark_notifications_read(ids[])`; wrappers `service_role`: `outbox_claim(limit)` (`for update skip locked`, `status = sending`), `outbox_mark(id, ok, error)`, `telegram_confirm_link(code, chat_id)`.
- **RLS:** `notifications` cada uno las suyas (`select`, `update` solo `read_at` por RPC); `notification_prefs` las suyas y admin todas; `private.*` sin acceso.
- **Tests `26_outbox.test.sql`:** lead en bandeja → una fila email a `hola@` por vía `hiring`, `notify` al admin; lead asignado → también al asignado; `telegram_link_code` caduca a 15 min y `telegram_confirm_link` con código caducado falla; closer no lee `notifications` ajenas; `set_notification_pref` con evento inválido falla; `outbox_claim` no entrega dos veces.

### M27 · `invitations`
- **Columnas en `profiles`:** `closer_recurring_rate numeric(5,2)`, `parent_recurring_rate numeric(5,2)` con `check` recurrente `<` proyecto cuando ambas no nulas (7.14); `payout_cadence` enum `payout_cadence` `per_payment \| weekly \| biweekly` nullable (7.13); `invited_by uuid`.
- **Tabla:** `invitations` (`id`, `email citext`, `role user_role`, `parent_closer_id`, `closer_rate`, `parent_rate`, `closer_recurring_rate`, `parent_recurring_rate`, `payout_cadence`, `project_id uuid` sin FK hasta `projects`, `token_hash text unique`, `auth_user_id uuid`, `invited_by`, `note`, `expires_at` (7 días), `accepted_at`, `revoked_at`, `created_at`); índice único parcial `(email) where accepted_at is null and revoked_at is null` (`email_already_invited`); mismos checks de tasas que `profiles`.
- **RPC:** `invite_user(p_email, p_role, p_parent_closer_id, p_closer_rate, p_parent_rate, p_closer_recurring_rate, p_parent_recurring_rate, p_payout_cadence, p_project_id, p_note, p_auth_user_id)` admin → `(invitation_id, token)` (token aleatorio 32 bytes devuelto una vez; se guarda `sha256`); falla `email_already_member` si existe perfil activo con ese `auth_user_id`; encola `outbox` email `invitation` con el enlace. `renew_invitation(id)` admin → token nuevo y `expires_at` nuevo. `revoke_invitation(id)` admin. `read_invitation(p_token)` wrapper `service_role` → `(role, invited_by_name, expires_at, status)` sin email. `accept_invitation(p_token, p_full_name, p_locale)` `authenticated`: comprueba `auth.jwt()->>'email'` = `email` (`invitation_email_mismatch`), vigencia (`invitation_expired`, `invitation_used`), inserta `profiles` con rol y tasas, fija `accepted_at`, `notify` admin `invitation_accepted`. **M08 la reemplaza** para llamar a `ensure_my_conversation`.
- **RLS:** `invitations` solo admin (`select`); nada más desde el cliente.
- **Tests `27_invitations.test.sql`:** admin invita y recibe token; closer no puede; segunda invitación al mismo email abierto falla; recurrente ≥ proyecto falla; `accept_invitation` con el email correcto crea el perfil con las tasas y marca aceptada; con otro email falla; caducada falla; `read_invitation` solo `service_role`; fila email en `outbox`.

### M28 · `users_admin`
- **RPC admin:** `admin_users()` → filas (`id`, `email` desde `auth.users`, `full_name`, `role`, `is_active`, `parent_closer_id`, tasas, `payout_cadence`, `has_totp` desde `auth.mfa_factors` con `status = 'verified'`, `contacts_count`, `open_deals`, `accrued_pending` (0 hasta M19; `create or replace` en M31)); `set_user_rates(user_id, …)` (mismos checks; `audit()` existente); `set_user_active(user_id, active)` (desactivar un closer con subclosers activos → `closer_has_subclosers`; `last_admin_required` del guard; fija `archived_at`); `reassign_portfolio(from_user, to_user)` → `(contacts, deals, leads)` movidos (contactos todos, oportunidades no cerradas, interesados `assigned \| contacted`; `to_user` debe ser closer o admin activo → `invalid_assignee`); `log_totp_reset(user_id)` → fila en `audit_log` (`table_name = 'profiles'`, `action = 'update'`, `after = {"totp_reset": true}`); `admin_audit_log(p_table, p_row_id, p_limit)` → filas de `private.audit_log` con nombre del actor; **`admin_counters()`** v1 → `jsonb` `{leads_new, leads_waiting_admin, invitations_pending, users_active}`.
- **Tests `28_users_admin.test.sql`:** `admin_users` devuelve email y `has_totp`; closer no la ejecuta; `reassign_portfolio` mueve y audita (`audit_log` de `contacts.owner_id`); desactivar padre con subcloser activo falla; `admin_counters` cuenta los `new` sin asignar y los `new` con `contact_id` por separado.

### M29 · `catalog_prices`
- **Tablas:** `offers` (`slug` pk, texto de `ofertas.md`: `web-presencia`, `web-negocio`, `web-plataforma`, `app-primera-version`, `app-producto`; `platform` enum `web \| app`, `name_es`, `name_en`, `price numeric(10,2)` nullable, `weeks_min`, `weeks_max`, `includes_es text[]`, `includes_en text[]`, `visible`, `sort`, `archived_at`, `updated_at`); `extras` (`slug` pk, `name_es/en`, `price` nullable, `billing` enum `once \| monthly \| yearly`, `visible`, `sort`, `archived_at`); `rates` (`code` pk `hourly \| task_min`, `label_es/en`, `price` nullable, `visible`); `maintenance_plans` (`slug` `s \| m \| l`, `name_es/en`, `price_monthly` nullable, `includes_es/en`, `visible`, `sort`); `price_changes` (`id`, `table_name`, `row_id text`, `field`, `before`, `after`, `changed_by`, `changed_at`) por trigger genérico `private.track_price_change()` en `price`, `price_monthly`, `visible`, `archived_at`.
- **Vistas para `anon`:** `public_offers`, `public_extras`, `public_rates`, `public_maintenance_plans` (solo `visible and archived_at is null`, columnas públicas). Política `select` para `anon` en las tablas restringida a esas filas; grant `select` en las vistas; `00_anon_grants.test.sql` actualiza la lista (sustituye `public_packs`).
- **RLS escritura:** admin `insert/update` (sin `delete`: archivado lógico); `authenticated` no admin nada.
- **Seed:** los slugs actuales de `src/lib/services/*` con `price = null` (→ `PriceState review` en la web).
- **Tests `29_catalog.test.sql`:** `anon` lee la vista y no la tabla entera ni filas ocultas; admin actualiza precio y aparece en `price_changes` con `before/after`; closer no actualiza; slug fuera de lista en `offers` falla (`check`); archivar oculta en la vista.

### M30 · `jobs_admin`
- **RPC admin:** `admin_jobs(p_status, p_limit)` → filas de `private.jobs` (sin `payload` completo: `kind`, `status`, `attempts`, `run_after`, `error` truncado a 500, fechas); `retry_job(id)` (`failed \| cancelled` → `queued`, `attempts = 0`, `run_after = now()`); `cancel_job(id)` (`queued` → `cancelled`); ambas escriben `audit_log` (`table_name = 'jobs'`).
- **Tests `30_jobs_admin.test.sql`:** closer no ejecuta; `retry_job` sobre `done` falla `job_not_retryable`; `cancel_job` sobre `running` falla.

### M19 · `commissions_core` (reescrita para 7.12 y 7.14)
- **Columnas en `deals`:** `recurring_monthly numeric(10,2)`, `recurring_started_at date`, `recurring_cancelled_at date`.
- **Tablas:** `commissions` (cabecera: `id`, `deal_id unique`, `closer_id`, `closer_rate`, `closer_recurring_rate`, `subcloser_id`, `subcloser_rate`, `subcloser_recurring_rate`, `expected_base` (= `won_amount`), `expected_closer_amount`, `expected_subcloser_amount`, `created_at`); `commission_lines` (`id`, `commission_id`, `payment_id` (FK en M20, aquí columna uuid), `beneficiary_id`, `role` enum `closer \| parent`, `nature` enum `project \| recurring`, `rate`, `base`, `amount` (negativo en devolución), `status` enum `accrued \| approved \| rejected \| paid \| reversed`, `rejected_reason`, `payout_id` uuid (FK en M31), `approved_at`, `approved_by`, `created_at`).
- **Función de cálculo:** `private.commission_rates_for(owner_id)` → las tasas congeladas según `datos.md` §3 (dueño sin padre → `closer_id = él`; con padre → `subcloser_id = él`, `closer_id = padre`, `closer_rate = parent_rate`, recurrentes igual); `private.accrue_commission(payment)` (la llama el trigger de M20): por cada beneficiario con tasa, `amount = base × rate` (recurrente solo si `nature = recurring`, `received_at < recurring_started_at + 12 months` y no cancelado; P7); devolución → líneas negativas con las mismas tasas y `status = accrued`.
- **RPC:** `win_deal(p_deal_id, p_won_amount, p_recurring_monthly)` (dueño o admin con `is_staff()`): `stage = won`, `won_at`, `won_amount`; crea `commissions` salvo dueño `admin` (P6) o `via = hiring` (sin comisión salvo acuerdo; plan maestro Q7); `activities` `stage_change`. `cancel_recurring(p_deal_id)` (admin). `approve_commission_lines(p_ids uuid[])`, `reject_commission_line(p_id, p_reason)` (admin). El guard de `deals` sigue impidiendo `won` por `update`.
- **RLS:** `commissions` y `commission_lines` `select` admin o `beneficiary_id = uid` o `is_own_or_sub(beneficiary_id)` (7.10); sin escritura directa. `audit()` en `commission_lines` (cambio de `status`).
- **Tests `19_commissions.test.sql`:** `win_deal` por el subcloser crea cabecera con `closer_id = padre`, `closer_rate = parent_rate` del subcloser y recurrentes; por el admin no crea cabecera; closer A no ve las líneas de B, el padre sí las de su subcloser; `approve` por closer falla `42501`; `update` directo de `deals.stage` sigue fallando.

### M20 · `payments_proformas` (reescrita para 7.12 y 7.15)
- **Tablas:** `payment_schedule` (`id`, `deal_id`, `label`, `kind` enum `milestone \| recurring`, `percent`, `amount`, `due_at date`, `status` enum `scheduled \| proforma_sent \| invoiced \| paid \| cancelled`, `sort`); `invoices` (`id`, `deal_id`, `schedule_id`, `kind` enum `proforma \| invoice`, `number text`, `issued_at`, `amount_net`, `vat_rate`, `vat_amount`, `amount_gross`, `pdf_path`, `status` enum `draft \| sent \| paid \| void`, `created_by`; `unique (kind, number)`; check `kind = 'proforma'` ⇔ `number like 'PF-%'`; **el CRM nunca numera `invoice`**: `number` externo obligatorio); `payments` (`id`, `deal_id`, `schedule_id`, `invoice_id`, `kind` enum `payment \| refund`, `nature` enum `project \| recurring`, `amount_net`, `received_at`, `method` enum `transfer \| card \| stripe \| other`, `reference`, `recorded_by`, `created_at`); `private.counters(key pk, value)` para `PF-AAAA-NNN`.
- **Triggers:** `after insert on payments` → `private.accrue_commission(new)`, fija `recurring_started_at` en el primer cobro recurrente, pasa el hito a `paid` cuando la suma neta cubre el importe y la factura a `paid`; `audit()` en las tres tablas.
- **RPC admin:** `set_payment_schedule(p_deal_id, p_items jsonb)` (contrato `contracts/payment-schedule.json`: suma 100 % o importes que suman `won_amount`; sustituye los `scheduled` no cobrados); `issue_proforma(p_schedule_id, p_vat_rate)` → `invoices` `proforma` numerada y hito `proforma_sent`; `record_invoice(p_deal_id, p_schedule_id, p_number, p_issued_at, p_net, p_vat_rate, p_pdf_path)`; `record_payment(p_deal_id, p_schedule_id, p_invoice_id, p_kind, p_nature, p_amount_net, p_received_at, p_method, p_reference)` con `payment_exceeds_schedule` y `refund_exceeds_paid`; `cancel_schedule_item(p_id)`; `void_invoice(p_id)`.
- **Storage:** bucket privado `billing` (`file_size_limit` 10 MB, `allowed_mime_types` PDF); política `select` en `storage.objects` para admin; subida solo por el servidor con la clave de servicio.
- **RLS:** admin todo; closer `select` de `payment_schedule` y `payments` (`amount_net`, `received_at`, `kind`, `nature`) de deals que `owns_contact`; `invoices` solo admin.
- **Tests `20_payments.test.sql`:** hitos 40/40/20 sobre 1.000 €: cobro de 400 → dos líneas (closer 10 % = 40, padre 5 % = 20 con el seed) y hito `paid`; devolución de 400 → líneas de −40 y −20; segundo cobro recurrente dentro de 12 meses devenga con la tasa recurrente; el 13.º mes no; tras `cancel_recurring` no; proforma numerada `PF-2026-001` y `PF-2026-002`; `invoice` con número `PF-…` falla; closer lee importes netos de sus deals y no `invoices`; `anon` nada.

### M31 · `payouts`
- **Tabla:** `payouts` (`id`, `beneficiary_id`, `period_start`, `period_end`, `cadence payout_cadence`, `total`, `withholding_rate` default 0, `net_total`, `status` enum `draft \| issued \| paid`, `statement_note`, `closer_invoice_path`, `issued_at`, `paid_at`, `paid_reference`, `created_by`); FK `commission_lines.payout_id → payouts`.
- **RPC admin:** `build_payout(p_beneficiary_id, p_period_start, p_period_end, p_withholding_rate)` → id (recoge líneas `approved` sin `payout_id` con cobro en el periodo; `no_lines_in_period`); `set_payout_status(p_id, p_status, p_paid_at, p_reference)` (`issued` → `paid` pone las líneas `paid`); `delete_payout_draft(p_id)` (libera líneas). `admin_counters()` v2 añade `accrued_pending_count`, `accrued_pending_amount`, `payments_overdue`, `proformas_unpaid`, `payouts_draft`, `jobs_failed`; `admin_users()` v2 rellena `accrued_pending`.
- **RLS:** admin todo; beneficiario `select` los suyos; padre los de sus subclosers.
- **Tests `31_payouts.test.sql`:** `build_payout` agrupa solo aprobadas del periodo; pagar marca líneas `paid`; borrar borrador libera; closer ve el suyo y no otros; contadores v2.

**Pendiente para el chat:** M10 pasa a `chat_notifications` (trigger `message_new` → `private.notify`), depende de M06 y M26. M08 reemplaza `accept_invitation`. M11 rellena `invitations.project_id → projects`.

---

## 3. Bloques

Reglas: ≤ ~400 líneas y ≤ 1 h; rama `<area>/<tema>`; `implementador-web` → `revisor` → fixes; `/puerta-calidad` una vez por pantalla antes del merge; pantalla nueva con prototipo aprobado por Jose en el navegador (pregunta 5 decide cómo); PR por bloque con la issue del tablón. Los bloques `data/*` llevan `revisor-seguridad` en la revisión. Cada bloque de interfaz entrega: componentes en `src/components/<zona>/<Nombre>/`, tipos zod en `src/types/<dominio>.ts`, textos `admin.<pantalla>.*` o `crm.<pantalla>.*` en `es.json` y `en.json`, módulo del mock `scripts/mock/<dominio>.js` con fixtures, E2E `tests/e2e/<pantalla>.spec.ts` (humo + axe + estados vacío/error/carga) y una línea `ready: true` en `src/lib/staff/nav.ts`.

**Prueba de la interfaz sin Supabase aplicado:** el mock (`playwright.config.ts` ya apunta `NEXT_PUBLIC_SUPABASE_URL` al mock) emula por módulo las rutas PostgREST que use la pantalla (`GET /rest/v1/<tabla>` con el subconjunto de filtros `eq.`, `in.`, `order`, `limit` que el código pida; `POST /rest/v1/rpc/<fn>` con los errores tipados `P0001`/`42501`) y los endpoints `/__auth/*` para forzar vacío y error. El mock no sustituye a pgTAP: la RLS se prueba en SQL.

### Hoy: dos enablers primero (en paralelo, 30–60 min), luego seis carriles

| Id | Rama | Qué | Tam. | Depende | Ficheros compartidos |
|---|---|---|---|---|---|
| A00 | `infra/mock-modules` | Partir `scripts/e2e-mock-backend.js` en `scripts/mock/index.js` (servidor + registro `route(method, pattern, handler)`) y `scripts/mock/{turnstile,auth,profiles,leads}.js` sin cambiar comportamiento (E2E actuales verdes); helper `tests/e2e/support/staff.ts` (`signInAdmin`, `signInCloser`, `withTag`) extraído de `auth.spec.ts`; `supabase/seed/` con `config.toml` `sql_paths = ["./seed/*.sql"]` y `run-tests.sh` recorriendo la carpeta; lista de `90_lint.test.sql` una función por línea en orden alfabético. | S–M | — | mock, `playwright.config.ts`, `config.toml`, `run-tests.sh`, `90_lint` |
| A01 | `admin/shell-nav` | `StaffShell` (de `AdminShell`; `zone` admin/crm; raíl en escritorio ≥ 64rem, barra inferior de cuatro en móvil, «Más» en hoja; una acción coral por vista; tokens estilo B); registro `src/lib/staff/nav.ts` con todas las entradas de este plan (`ready: false` salvo Resumen e Interesados); layout `(private)/crm/layout.tsx` y K1 placeholder (`EmptyState`); `safeNext` admite `/invitacion/`; textos `admin.nav.*`, `crm.nav.*` completos. | M | — | `admin/layout.tsx`, `AdminShell`, `messages` (solo nav) |

Prototipos (si pregunta 5 = a): **A01b `admin/prototypes`** (M, en paralelo con A01): `prototipos/admin/{resumen,usuarios,invitacion,precios,sistema,notificaciones,interesado,contactos,contacto,cobros,comisiones,liquidaciones}.html` portando la estructura de `archivo/decisiones-pantallas/prototipo-crm/*.html` (equipo → D2, contenido/precios → D3, notificaciones → D5, comisiones → K4, contactos/contacto → K2/K3) a `prototipos/estilo-b/css/tokens.css`, con variantes conmutables en `:root`; Jose aprueba en una sesión y cada carril arranca su pantalla al tener el OK.

### Carriles (un agente por carril; dentro del carril, en orden)

| Carril | Bloque | Rama | Qué | Tam. | Depende |
|---|---|---|---|---|---|
| **1 Usuarios** | A02 | `data/outbox-base` | M26 + tests + seed + `database.ts` | M | A00 |
| | A03 | `data/invitations` | M27 | M | A02 |
| | A04 | `data/users-admin` | M28 | M | A03 |
| | A05 | `admin/users-invite` | D2 lista (`UserTable`, `InvitationList`) + `InviteSheet` con previsualización + Server Action (`createUser` + `invite_user`) + reenviar/anular | M | A01, A04 |
| | A06 | `admin/users-manage` | `UserSheet` (tasas, activar/desactivar, historial), `ReassignSheet`, restablecer TOTP | M | A05 |
| | A07 | `auth/invitation` | U4 `/invitacion/[token]` con los tres estados y el enlace al alta de TOTP existente | M | A03, A01 |
| **2 Precios** | A08 | `data/catalog-prices` | M29 | M | A00 |
| | A09 | `admin/prices` | D3 pestañas, `PriceTable`, `PriceItemSheet`, `PriceHistory`, reordenar, archivar | M | A01, A08 |
| | A10 | `public/prices-from-db` | La web lee `public_*` con `unstable_cache` y tag `catalog`; `null` → `PriceState review`; recomendador y comparador sin cambios de interfaz | S–M | A08 |
| **3 Sistema** | A11 | `data/jobs-heartbeat` | M05 (contrato de `omen_status`) | S | A00 |
| | A12 | `data/site-settings` | M12 | S | A00 |
| | A13 | `data/jobs-admin` | M30 | S | A11 |
| | A14 | `admin/system` | D4 `SwitchList` por grupos, `OmenStatus`, `JobTable` con reintentar/cancelar | M | A01, A11–A13 |
| **4 Notificaciones** | A15 | `admin/notifications` | D5 `TelegramLinkCard`, `RuleMatrix`, «Enviar prueba» | M | A01, A02 |
| | A16 | `infra/outbox-drain` | Ruta `/api/cron/outbox` (cron de Cloudflare en `wrangler.jsonc`, cabecera secreta), envío Resend y Telegram con reintentos y límite, plantillas `invitation`, `lead_new`, `test`, `totp_reset`; `/api/telegram/webhook` (`/start <código>` → `telegram_confirm_link`); interruptor `OUTBOX_DRAIN` (pregunta 6) | M | A02 |
| **5 Interesados y Resumen** | A17 | `admin/leads-detail` | D8 ficha `/admin/interesados/[id]`, `FilterBar` en la URL, pestañas por estado, `NewLeadSheet`, `AuditList` | M | A01 (y A04 para `admin_audit_log`; sin ella la ficha omite el historial) |
| | A18 | `admin/overview` | D1 celdas desde `admin_counters()` (claves opcionales), `OmenStatus`, `RecentAudit` | S–M | A01, A04, A11 |
| **6 CRM y dinero** | A19 | `crm/contacts-list` | K2 tabla densa y tarjetas en móvil, filtros en URL, `NewContactSheet`, `StageSheet` | M | A01 |
| | A20 | `crm/contact-detail` | K3 `ContactHead`, `ActivityTimeline`, `ActivityComposer`, `DealCard` (fase, perder, reasignar admin) | M | A19 |
| | A21 | `data/commissions` | M19 | M | A03 (columnas de tasas) |
| | A22 | `data/payments` | M20 | M | A21, A12 |
| | A23 | `data/payouts` | M31 | M | A22 |
| | A24 | `crm/deal-win` | «Marcar ganada» con comisión prevista, recurrente, cancelar recurrente; pestaña Cobros y comisión en K3 (lectura) | M | A20, A21, A22 |
| | A25 | `admin/payments` | D9 `ReceivableTable`, `RecordPaymentSheet`, `set_payment_schedule` con plantilla 40/40/20, registrar factura con PDF | M | A01, A22 |
| | A26 | `admin/proforma-print` | Emitir proforma y página imprimible `PF-AAAA-NNN` «no es factura» (P5) | S | A25 |
| | A27 | `crm/commissions` | K4 totales, `CommissionLineTable`, aprobar/rechazar (admin) | M | A21, A22 |
| | A28 | `admin/payouts` | D10 `PayoutList`, `PayoutBuilder` con periodo por cadencia, `StatementPrint`, marcar pagada, factura del closer | M | A23, A27 |

Después (sin bloquear): A29 `admin/audit` D13 mínimo (S, tras A04); A30 `crm/settings` K6 con `TelegramLinkCard` reutilizado (S, tras A15); A31 `infra/notifications-money` eventos `commission_accrued`, `payment_overdue` (cron diario), `payout_paid` (S, tras A23, A16).

**Qué puede arrancar ya, sin pisarse** (tras A00 y A01, que tardan menos de una hora): A02, A08, A11, A12 (datos, cuatro agentes) · A17, A19 (interfaz sobre M01–M04 ya escritas) · A01b (prototipos) si pregunta 5 = a. Ficheros que tocan todos y su regla (P11): `messages/{es,en}.json` (espacio de claves propio), `database.ts` (inserción alfabética; `data/*` lo escribe, la interfaz lo consume), `src/lib/staff/nav.ts` (una línea por bloque), `scripts/mock/index.js` (una línea de `import` por módulo), `00_anon_grants` y `90_lint` (listas alfabéticas), `supabase/seed/` (fichero propio). Antes de cada PR: `git rebase origin/main`, `pnpm lint typecheck test i18n:check`, `pnpm db:test:local` si tocó SQL, `pnpm e2e --grep <pantalla>`.

**Gates por bloque:** `data/*` termina con «pedir OK a Jose para `db push`» (hoy no se ejecuta: sin credencial; se anota en el PR); A16 no activa envíos reales sin OK (y activarlos dispara `josecoded-dev`, 10.7); A06 restablecer TOTP y A28 marcar pagada son acciones con confirmación y auditoría, no tocan dinero real.

---

## 4. Preguntas para Jose (solo las que bloquean; recomendación primero)

1. **Alta del invitado (bloquea A03, A05, A07).** a) **El servidor crea la cuenta al invitar sin email de Supabase; el enlace `/invitacion/<token>` lo envía nuestro outbox; el invitado entra con el OTP normal y crea su perfil al aceptar** · b) Usar «Invite user» de Supabase con su plantilla y `/auth/callback` · c) Crear la cuenta solo al aceptar (requiere abrir `shouldCreateUser` para ese correo).
2. **Precios en la base ya (bloquea A08–A10).** a) **Sí: D3 edita `offers/extras/rates/maintenance_plans` con historial; la web los lee de Supabase con caché y muestra «Precio en revisión» mientras estén a `null`; hasta aplicar M29 la web sigue en código** · b) D3 espera a la ronda de tarifas; hoy solo interruptores.
3. **Proformas y PDF (bloquea A25, A26).** a) **Proforma como página imprimible («Guardar como PDF» del navegador), factura externa adjunta como PDF subido; sin librería** · b) Generar PDF en servidor (dependencia nueva, la decide `revisor`, +1 bloque y riesgo en Workers).
4. **Base de la comisión e IVA (bloquea M19, M20).** a) **Comisión sobre el neto cobrado sin IVA; IVA por defecto 21 % en la proforma, editable por documento (0 mientras no haya alta)** · b) Sobre el bruto con IVA · c) Sin IVA en ninguna proforma hasta el alta.
5. **Prototipos (bloquea el arranque de la interfaz hoy).** a) **Una tanda de prototipos HTML de las doce pantallas (A01b, estructura del prototipo CRM antiguo en estilo B) que revisas en una sesión; cada pantalla se implementa al tener tu OK** · b) Implementar directamente sobre esa estructura y revisar en la preview de cada PR (más rápido; el gate pasa a la preview).
6. **Envíos reales (bloquea A16).** a) **Drenador apagado (`OUTBOX_DRAIN=off`) y «Enviar prueba» solo en local hasta que exista `josecoded-dev`; el código queda listo** · b) Crear `josecoded-dev` ahora y activar Resend y el bot de Telegram en `josecoded` (dispara 10.7).

Decididas aquí sin preguntar (P1–P11): CRM del admin en `/crm`; `StaffShell` único con registro de nav; numeración M26–M31 con «el número identifica, el timestamp ordena»; `admin_counters()` en `jsonb`; el admin no cobra comisión; recurrentes 12 meses desde el primer cobro recurrente; cadencia por defecto quincenal; IVA como ajuste; reglas de ficheros compartidos.

---

## 5. Qué anotar al cerrar

- **`decisiones.md`:** P1–P11 como 8.6–8.9 (admin: CRM en `/crm`, `StaffShell`, counters `jsonb`, proforma imprimible), 7.17–7.19 (admin sin comisión, 12 meses desde el primer cobro recurrente, cadencia quincenal por defecto e IVA como ajuste) y 10.11 (numeración de migraciones: el número identifica, el timestamp ordena; M10 partida en M26); las respuestas de §4 con fecha.
- **`ESTADO.md`:** este plan en «Ahora»; A00–A28 en «Siguiente paso» por carriles; las seis preguntas en «Pendientes → Jose»; en el disparador de 10.7, que A16 no activa envíos; «Sincronizar desde el Mac»: aplicar M05, M12, M26–M31, M19, M20 con OK por migración y `pnpm db:types` después.
- **`migraciones-chat.md` y `plan-maestro.md` §4.6:** nota de que M10 queda como `chat_notifications`, M12 y M19/M20 con el alcance de aquí, M18 fuera del camino del admin.
- **Vault `Proyectos/josecoded.md` (Mac):** «admin y closers comparten `/crm`; comisión devengada por cobro con líneas por beneficiario y devoluciones negativas; proformas imprimibles sin librería; invitaciones con cuenta creada por el servidor y enlace propio; drenador de outbox apagado hasta `josecoded-dev`».
- **ADR en codebase-memory (cuando haya código):** «`StaffShell` con registro de navegación por zona»; «`admin_counters()` jsonb ampliable por migración»; «`commission_lines` por pago sobre cabecera congelada; recurrentes 12 meses desde `recurring_started_at`»; «`invoices.kind proforma|invoice`: el CRM numera solo proformas»; «mock de E2E por módulos y seed por carpeta para trabajo en paralelo».

## 6. Respuestas de Jose (2026-11-05)

1. Alta del invitado: **a)** cuenta creada por el servidor, enlace `/invitacion/<token>` por nuestro outbox y OTP normal.
2. Precios en la base: **a)** sí, ya; la web los lee de Supabase con caché y muestra «Precio en revisión» con `null`.
3. Proformas: **a)** página imprimible, sin librería PDF (recomendación adoptada; Jose puede cambiarla).
4. Base de comisión e IVA: **a)** neto sin IVA; IVA editable por documento, 0 mientras no haya alta (recomendación adoptada, coherente con 7.15; Jose puede cambiarla).
5. Revisión: **b)** directo a la preview, sin prototipos previos.
6. Envíos reales: **a)** código listo y `OUTBOX_DRAIN=off` hasta `josecoded-dev`.

Además: Jose autoriza seguir fusionando con verificación local mientras GitHub Actions no tenga minutos. Las migraciones se escriben y prueban en local; aplicarlas en Supabase sigue necesitando su OK y una credencial válida.
