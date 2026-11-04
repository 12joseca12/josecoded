# Plan de migraciones — interesados, chat de visitantes y salas privadas

**2026-11-04 · `arquitecto` · rama `docs/chat-rooms`.** Primer plan de migraciones del proyecto. Cubre tres funciones de principio a fin: (1) interesados y formulario de contacto (`datos.md` §11, decisiones 7.8–7.9), (2) chat de visitantes con purga (`datos.md` §10, 5.10–5.11) y (3) salas privadas closer/cliente/freelance con Nexo (5.12–5.17). No hay SQL aquí: cada migración se escribe en su bloque con TDD sobre los tests de la sección 4. Las decisiones **ABIERTA** (5.13, 5.15, 7.8) no bloquean el esquema: se diseñó con la recomendación y el cambio, si lo hay, cabe en una columna o en una política.

## 0. Reglas

- **Dónde corre:** Supabase local con Docker en el Mac (`pnpm db:reset`) para desarrollar; el proyecto `josecoded` (`echlwywbucgbhwpncviy`) solo con **OK de Jose por migración y en la misma sesión**, `supabase db push` tras comprobar drift, `get_advisors` antes y después, nunca `db reset` (10.7). La CI valida las migraciones en un Supabase local efímero (ver §4) y nunca hace `push`.
- **Ficheros:** `supabase/migrations/<timestamp>_<nombre>.sql`, una migración por bloque, idempotente hacia delante (sin `down`). Todo objeto nuevo en `public` nace con `revoke all from anon, authenticated` y `alter table … enable row level security` antes de la primera política. Funciones `security definer` siempre con `set search_path = ''` y `revoke execute from public`.
- **Tipos:** tras cada migración, `pnpm db:types` regenera `src/types/database.ts` y el test de deriva de W21 falla si no se hizo. Enums en SQL, no `text` con check, salvo donde se dice.
- **Nombres:** tablas y columnas en inglés `snake_case`; helpers en `private`; RPC públicas con verbo (`claim_lead`, `mark_read`).
- **Orden y dependencias:** el número es el orden. Una migración solo toca tablas creadas antes. Las que dependen de zonas aún no construidas (`projects`) van al final y se marcan.
- **Gate:** toda migración lleva en su issue el paso «pedir OK a Jose para `db push` a `josecoded`» y la salida de `get_advisors` antes/después pegada en el PR.

## 1. Migraciones en orden

| # | Fichero (sufijo) | Bloque / rama | Crea | Depende |
|---|---|---|---|---|
| M01 | `base_private_profiles` | `data/base` (nuevo, S) | esquema `private`, extensiones, helpers, `profiles`, `private.audit_log` | W05 |
| M02 | `leads` | `data/leads` (sustituye W33, M) | `leads`, `private.form_quota`, `private.submit_lead` | M01 |
| M03 | `crm_core` | `data/crm-core` (adelanta `data/crm-schema`, M) | `contacts`, `deals`, `activities`, `owns_contact`, `owns_lead` | M02 |
| M04 | `lead_claim` | `data/lead-claim` (S) | emparejado, `claim_lead`, `assign_lead`, `discard_lead`, `touch_lead` | M03 |
| M05 | `jobs_heartbeat` | `data/jobs` (S) | `private.jobs`, `private.heartbeat`, `omen_status` | M01 |
| M06 | `conversations` | `data/conversations` (sustituye W37, M) | `visitors`, `conversations`, `conversation_members`, `messages`, helpers, triggers, Realtime | M03, M05 |
| M07 | `visitor_chat` | `data/visitor-chat` (M) | `private.chat_quota`, `private.visitor_send`, `private.visitor_handoff`, `private.purge_conversations`, `pg_cron` | M06 |
| M08 | `private_rooms` | `data/private-rooms` (M) | `ensure_my_conversation`, `set_conversation_ai`, `set_ai_consent`, `mark_read`, `add_member`, `remove_member`, `archive_conversation`, archivado automático | M06 |
| M09 | `chat_attachments` | `data/chat-attachments` (S) | `message_attachments`, bucket `chat-attachments`, políticas de Storage | M08 |
| M10 | `outbox_notifications` | `infra/outbox-email` (W35, M) | `private.outbox`, `notifications`, triggers `lead_new`, `message_new` | M02, M06 |
| M11 | `client_rooms` | `data/client-rooms` (S, **después de `data/projects-schema`**) | trigger en `projects`, `ensure_project_conversation`, trigger de reasignación en `deals` | M08, `projects` |

Tamaños: S ≤ 30 min, M ≤ 1 h (10.2). Las once caben en ocho PR: M03+M04, M06+M07 y M08+M09 pueden ir juntas si el diff no pasa de ~400 líneas con tests.

## 2. Detalle por migración

### M01 · `base_private_profiles`
- **Esquemas y extensiones:** `create schema private` (sin `usage` para `anon`/`authenticated`); `citext` y `pg_cron` en `extensions` (`pg_cron` ya viene en Supabase; en local se activa en `supabase/config.toml`).
- **Tablas:** `profiles` según `datos.md` §1 (`role` enum `admin | closer | freelance | client`, `parent_closer_id`, tasas, `is_active`, `archived_at`); `private.audit_log`.
- **Helpers:** `private.uid()`, `private.role()`, `private.is_admin()`, `private.is_staff()` (admin, closer o freelance **y** `aal2` leído de `auth.jwt() ->> 'aal'`), `private.audit()` (trigger genérico).
- **RLS `profiles`:** `select` lo propio, admin todo, closer el nombre y rol de sus subclosers (vista `team_profiles` con tres columnas); `update` lo propio solo `full_name` y `locale` (por RPC `update_my_profile` para no abrir columnas); admin todo.
- **Privilegios por defecto:** `alter default privileges in schema public revoke all on tables/functions/sequences from anon, authenticated` (ya endurecido en `josecoded`; se repite para el local).
- **Seed local:** un admin, dos closers (uno subcloser del otro), un freelance, un cliente, todos `@example.com` (10.7, regla 3).

### M02 · `leads`
- **Tablas:** `leads` con los campos de §11 (enums `lead_source`, `contact_via`, `lead_status`); `private.form_quota (ip_hash, day, count)`.
- **Función:** `private.submit_lead(p_source, p_via, p_pack_id, p_full_name, p_email, p_phone, p_organization, p_message, p_offer_url, p_company, p_wanted_by, p_has_domain, p_has_store_accounts, p_page_path, p_locale, p_consent, p_ip_hash)` → `uuid`; `security definer`, `search_path = ''`, `revoke execute from public, anon, authenticated` (solo `service_role`); lanza `form_quota_exceeded` (SQLSTATE propio `P0001` con `hint`) al pasar de 5/día por IP y `consent_required` si `p_consent` es falso.
- **RLS `leads`:** `enable rls`; **sin políticas para closers todavía** (llegan en M04 con `owns_lead`): en M02 solo `select`/`insert`/`update` para `private.is_admin()`.
- **Nota:** `pack_id` referencia `packs` de W20; si W20 no está, la columna se crea sin FK y M04 la añade.

### M03 · `crm_core`
- **Tablas:** `contacts` (`kind` enum `prospect | client | recruiter | partner | other`, `source` igual que `lead_source`, `lead_id`), `deals`, `activities` según `datos.md` §3; **sin** `commissions`, `imports` ni `win_deal` (van con `data/commissions`).
- **Helpers:** `private.owns_contact(contact_id)` (dueño o closer padre del dueño), `private.owns_lead(lead_id)` (asignado o closer padre del asignado).
- **RLS:** `contacts` `select`/`update` `owns_contact(id)` o admin; `insert` closer con `owner_id = auth.uid()` o admin; `owner_id` solo lo cambia el admin (trigger que rechaza si cambia y no `is_admin()`). `deals` como `contacts` vía `contact_id`; `stage = won` prohibido fuera de RPC (trigger; la RPC llega con comisiones). `activities` `select` como `contacts`; `insert` quien ve el contacto con `author_id = auth.uid()`; sin `update`/`delete`.
- **Auditoría:** trigger `private.audit()` en `contacts` (cambio de `owner_id`) y `deals` (cambio de `stage`).

### M04 · `lead_claim`
- **Trigger `before insert on leads`:** emparejado por `email` (§11): contacto con dueño → `assigned_to`, `status = assigned`, `contact_id`; contacto sin dueño → `contact_id` y sigue `new`.
- **RPC** (`security definer`, `search_path = ''`, `grant execute to authenticated`; dentro comprueban rol):
  - `claim_lead(lead_id)` → `contact_id`: `update leads set assigned_to = auth.uid(), status = 'converted', … where id = $1 and status = 'new' and assigned_to is null and contact_id is null returning *`; si no hay fila → `lead_already_claimed`; crea o enlaza `contacts`, crea `deals` (`new`, `via`, `pack_id`) y `activities`. Solo closers y admin.
  - `assign_lead(lead_id, user_id)` (admin): igual a nombre de otro; si ya tenía contacto con otro dueño, reasigna `contacts.owner_id` y `deals.owner_id` (auditado).
  - `discard_lead(lead_id, reason)` (admin o `owns_lead`): `status = discarded`.
  - `touch_lead(lead_id)` (`owns_lead`): `status = contacted`, `handled_at`.
- **RLS `leads` (completa, 7.8 a):** `select` admin **o** (`status = 'new' and assigned_to is null and contact_id is null` para cualquier closer con `is_staff()`) **o** `owns_lead(id)`; `insert` closer/admin con `source in ('whatsapp','manual')` y, si closer, `assigned_to = auth.uid()`; `update`/`delete` sin política (solo RPC).

### M05 · `jobs_heartbeat`
- **Tablas:** `private.jobs` (`kind` enum con `chat.reply`, `chat.summary`, `rag.index`, `radar.*`, `account.delete`; `payload`/`result` jsonb con contrato en `contracts/jobs/`), `private.heartbeat (service, seen_at, version, models)`.
- **Funciones:** `private.enqueue_job(kind, payload, run_after)`; `private.claim_jobs(worker, limit)` con `for update skip locked` (la usa Omen con la clave de servicio); RPC `omen_status()` (`select` para `authenticated` con `is_admin()`: último latido y contadores de cola).
- **RLS:** `private` sin acceso desde el cliente; solo `omen_status` expone datos.

### M06 · `conversations`
- **Enums:** `conversation_kind`, `conversation_status`, `member_role`, `author_kind`, `message_kind`, `system_event`.
- **Tablas:** `visitors`, `conversations`, `conversation_members`, `messages` con columnas, checks e índices de `datos.md` §10. FK `conversations.project_id → projects` se añade en M11 (hasta entonces columna uuid sin FK, con check que la obliga a null salvo `kind = 'client'`).
- **Helpers:** `private.is_conversation_member(conversation_id)` (fila activa con `user_id = auth.uid()`), `private.can_write_conversation(conversation_id)` (miembro activo, `can_write`, conversación `open`), `private.ai_active(conversation_id)`.
- **Triggers:**
  - `after insert on conversations` → inserta como `owner` a todo `profiles` con `role = 'admin' and is_active`.
  - `before insert on messages` → `mentions_nexo = body ~* '(^|\s)@nexo\M'`; rechaza `author_kind = 'system'` sin `system_event`.
  - `after insert on messages` → `conversations.last_activity_at = now()`; si `author_kind = 'human' and private.ai_active(conversation_id) and (kind = 'visitor' or mentions_nexo)` → `private.enqueue_job('chat.reply', …)`. (Si 5.15 acaba en b o c, cambia solo esta condición.)
- **RLS:**
  - `visitors`: `select` admin. Nada más.
  - `conversations`: `select` admin o `is_conversation_member(id)`. Sin `insert`/`update`/`delete` desde el cliente.
  - `conversation_members`: `select` admin o `is_conversation_member(conversation_id)`. Nada más (RPC en M08).
  - `messages`: `select` admin o miembro activo; `insert` `authenticated` con `is_conversation_member(conversation_id) and can_write_conversation(conversation_id) and author_kind = 'human' and author_id = auth.uid() and (private.role() = 'client' or private.is_staff())`. Sin `update`/`delete`.
- **Realtime:** `alter publication supabase_realtime add table messages, conversation_members`; política en `realtime.messages` para el canal `conversation:{id}` (Broadcast de «escribiendo») que exige `private.is_conversation_member(id)`.
- **Seed local:** una sala `closer` con el closer de prueba y seis mensajes (humano, Nexo, system).

### M07 · `visitor_chat`
- **Tabla:** `private.chat_quota (scope, key_hash, day, count)`.
- **Funciones (`security definer`, solo `service_role`):**
  - `private.visitor_send(p_token_hash, p_body, p_page_path, p_locale, p_ip_hash)` → `(conversation_id, message_id)`: cuota IP (60/día) y visitante (20/día, 1 cada 3 s, con `last_activity_at`), crea `visitors` y la conversación si no existen, inserta el mensaje (`author_kind = human`, `author_id null`), renueva `last_activity_at`. Errores tipados `chat_quota_exceeded`, `chat_closed`.
  - `private.visitor_thread(p_token_hash, p_since)` → mensajes nuevos (para el SSE y para la recarga sin JS).
  - `private.visitor_handoff(p_token_hash, p_email, p_phone, p_name, p_consent)` → `lead_id`: crea `leads` (`source = nexo`, `conversation_id`, `consent_at`, `via` e `interest` de la conversación), rellena `visitors.lead_id`, `conversations.lead_id`, `consent_at`; mensaje `system` `handoff_done`.
  - `private.purge_conversations()` con los seis pasos de `datos.md` §10 (7/60/90 días, salas archivadas a 90, cuotas a 2).
- **Cron:** `select cron.schedule('purge-conversations', '0 4 * * *', $$select private.purge_conversations()$$)` en la migración, idempotente (`cron.unschedule` previo si existe).
- **Sin cambios de RLS:** los visitantes no tienen rol; todo entra por `service_role`.

### M08 · `private_rooms`
- **RPC para `authenticated`** (`security definer`, `search_path = ''`, comprueban rol dentro):
  - `ensure_my_conversation()` → `conversation_id`: closer o freelance con `aal2`; crea la sala `kind = closer | freelance` con `subject_user_id = auth.uid()` si no existe (el trigger añade a Jose; esta función añade al propio usuario con `role` según `profiles.role`). `accept_invitation` la llamará cuando exista.
  - `mark_read(conversation_id)`: `last_read_at = now()` en la fila propia.
  - `set_ai_consent(conversation_id, granted)`: solo miembro con `role = 'client'` de esa sala y `kind = 'client'`; escribe `ai_consent_at`/`ai_consent_by` o `ai_consent_revoked_at`; mensaje `system` `consent_granted | consent_revoked`; `private.audit_log`; al revocar, `update private.jobs set status = 'failed', error = 'consent_revoked' where kind = 'chat.reply' and status = 'queued' and payload->>'conversation_id' = $1`.
  - `set_conversation_ai(conversation_id, enabled)` (admin): `ai_enabled`, mensaje `system` `ai_on | ai_off`, auditoría.
  - `add_member(conversation_id, user_id, role, can_write)` y `remove_member(conversation_id, user_id)` (admin): fila o `left_at`, mensaje `system` `member_added | member_left`. No permiten añadir a un `client` a una sala que no sea la de su proyecto ni a nadie a una `visitor`.
  - `archive_conversation(conversation_id)` (admin): `status = archived`, `archived_at`, mensaje `system` `archived`.
- **Triggers:** `after update of is_active on profiles` → archiva las salas `closer | freelance` del usuario desactivado y pone `left_at` en todas sus membresías.
- **Vista `my_conversations`:** `security_invoker`, para listas (K7, A5, F3, D6): `id`, `kind`, `status`, `last_activity_at`, `unread_count` (mensajes posteriores a mi `last_read_at` de autor distinto), `ai_active`, nombre del otro lado (closer/freelance/proyecto; «visitante» en D6).

### M09 · `chat_attachments`
- **Tabla:** `message_attachments` según §10 con check `size_bytes <= 10 * 1024 * 1024` y `mime` en la lista cerrada (imágenes, PDF, zip, Office). Trigger `before insert` que rechaza si la conversación es `visitor` o si el mensaje ya tiene 5.
- **Bucket:** `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('chat-attachments', …, false, 10485760, …)`.
- **Políticas `storage.objects`:** `select` para `authenticated` si `bucket_id = 'chat-attachments' and private.is_conversation_member(split_part(name, '/', 2)::uuid)`; `insert`/`update`/`delete` sin política (el servidor firma la subida con la clave de servicio; la purga borra con la clave de servicio).
- **RLS `message_attachments`:** `select` como `messages`; `insert` solo `service_role`; sin `update`; `delete` solo desde `private.purge_conversations`.

### M10 · `outbox_notifications` (W35)
- **Tablas:** `private.outbox`, `notifications`, `notification_prefs` (§1, §7).
- **Triggers:** `after insert on leads` → outbox email a la bandeja de la vía (2.23) y Telegram a Jose; `notifications` a todos los closers activos si cae en la bandeja común, solo al asignado si no. `after insert on messages` → `notifications` a cada miembro humano activo distinto del autor; Telegram a Jose si él no es el autor. Sin email por mensaje de chat (ruido); se revisa con uso.
- **RLS `notifications`:** cada uno las suyas (`select`, `update` de `read_at` por RPC `mark_notifications_read`).
- **Gate:** activar Resend real solo con OK de Jose (W35) y, por 10.7, eso dispara `josecoded-dev`.

### M11 · `client_rooms` (tras `data/projects-schema`)
- **FK:** `conversations.project_id → projects(id) on delete cascade`.
- **Triggers:** `after insert on projects` → crea la sala `client` con el cliente (`projects.client_id`), Jose (por el trigger de M06) y el closer dueño de `projects.deal_id → deals.owner_id` si existe. `after update of owner_id on deals` → en la sala del proyecto de ese deal, `left_at` al anterior y fila al nuevo, dos mensajes `system`. `after update of archived_at on projects` → `archive_conversation`.
- **RPC:** `ensure_project_conversation(project_id)` (admin) para proyectos creados sin oportunidad.
- **Contrato:** `contracts/jobs/chat.reply.json` añade `kind`, `members[] {role}` y `project_id`.

## 3. Lo que no está en este plan

`commissions` y `win_deal` (`data/commissions`), `invitations` y `accept_invitation` (`auth/invitation`; llamará a `ensure_my_conversation`), `imports`, `radar_*`, RAG (`W38`), `packs`/`rates` (W20), `site_settings`. Cuando `accept_invitation` exista, M08 no cambia: la RPC ya es idempotente.

## 4. Plan de tests RLS (`supabase/tests/`)

### Herramienta
- **pgTAP** con `supabase test db` (corre `supabase/tests/*.sql` sobre el local tras `db reset`). Un fichero por migración, nombrado `NN_<nombre>.test.sql`, más `00_helpers.sql` con funciones de prueba: `tests.login_as(email)` (fija `request.jwt.claims` con `sub`, `role = authenticated`, `aal`), `tests.login_aal1(email)`, `tests.login_service()`, `tests.logout()` (→ `anon`), `tests.fixture_*` que crean filas con la clave de servicio.
- **Por qué pgTAP y no Vitest + supabase-js:** los tests viven junto al SQL, no necesitan servidor Next ni claves, corren en 10 s y prueban exactamente la política (incluido `aal2`, que con supabase-js obligaría a enrolar TOTP de verdad). Vitest queda para la lógica de las rutas de servidor (cookies, SSE, zod) con la base simulada.
- **CI (W05):** job `db` con `supabase start` (Docker en el runner), `supabase db reset`, `supabase test db`, `pnpm db:types --check`. Tiempo objetivo < 4 min. Advisors locales: `supabase inspect` no cubre advisors; se pega la salida de `get_advisors` de `josecoded` en el PR tras el `push` con OK.
- **Patrón de cada caso:** `select tests.login_as('closer-a@example.com'); select results_eq($$select count(*) from leads$$, $$values (2::bigint)$$, 'closer A ve solo la bandeja común y los suyos');` y para escrituras `throws_ok($$insert …$$, '42501')` (RLS) o el SQLSTATE del error tipado.

### Casos por fichero

**`01_base.test.sql` (M01)**
- `anon` no ve `profiles` ni puede llamar a ninguna función de `private`.
- Un closer ve su fila y las de sus subclosers por `team_profiles`, no las de otros closers ni clientes.
- `update_my_profile` cambia `full_name` y no puede cambiar `role` ni `closer_rate`.
- `is_staff()` es falso para un closer con `aal1` y verdadero con `aal2`; siempre falso para `client`.

**`02_leads.test.sql` (M02, M04)**
- `anon` y `authenticated` no pueden ejecutar `private.submit_lead` ni insertar en `leads`; `service_role` sí.
- Sexto envío del mismo `ip_hash` en el día → `form_quota_exceeded`; al día siguiente vuelve a pasar.
- Sin `consent` → `consent_required`.
- Emparejado: un lead con el email de un contacto del closer A nace `assigned` a A y el closer B no lo ve; con el email de un contacto sin dueño nace `new` y solo lo ve el admin.
- Bandeja común: closers A y B ven el mismo lead `new` sin asignar; el cliente y el freelance no ven ninguno.
- `claim_lead` por A → B deja de verlo, A lo ve `converted` con `contact_id`, `deals.stage = new` con `via` y `pack_id`, una `activity`; `claim_lead` por B después → `lead_already_claimed`.
- Dos `claim_lead` concurrentes (dos transacciones, `pg_advisory`-free): solo una gana (test con `dblink` o con dos sesiones de pgTAP; si no es viable en CI, se cubre con el `returning` + `found` en un test unitario de la función).
- Closer padre ve los leads asignados a su subcloser y puede `discard_lead`; el subcloser no ve los del padre.
- `assign_lead` solo admin; un closer que lo intenta recibe `42501` o el error tipado `admin_only`.
- Un closer puede insertar `source = whatsapp` solo con `assigned_to = auth.uid()`; `source = form` por `authenticated` falla.

**`03_crm_core.test.sql` (M03)**
- Closer A lee y edita sus contactos; no lee los de B; el padre lee los de su subcloser.
- Un closer no puede cambiar `owner_id` (trigger); el admin sí y queda en `audit_log`.
- `activities` se insertan con `author_id = auth.uid()` y no se pueden actualizar ni borrar.
- `deals.stage = 'won'` por `update` directo falla.

**`04_jobs.test.sql` (M05)**
- `authenticated` no ve `private.jobs`; `omen_status()` solo responde al admin.
- `claim_jobs` entrega cada trabajo una sola vez con dos llamadas seguidas.

**`05_conversations.test.sql` (M06)**
- Al crear una conversación de cualquier `kind` aparece Jose como `owner`.
- Checks: `kind = closer` sin `subject_user_id` falla; dos salas `closer` para el mismo usuario fallan; segunda sala `visitor` abierta para el mismo visitante falla.
- Closer A ve su sala y sus miembros; no ve la sala de B ni la de ningún cliente; `select` de `messages` de una sala ajena devuelve 0 filas.
- Closer A inserta un mensaje en su sala con `aal2`; con `aal1` falla; con `author_id` de otro falla; con `author_kind = nexo` falla; en una sala `archived` falla; con `can_write = false` falla.
- El cliente inserta sin `aal2` (no es personal) en su sala y no puede en ninguna otra.
- Un miembro con `left_at` no lee mensajes nuevos ni antiguos (política por fila activa; el historial lo conserva la base, no él).
- Trigger: insertar mensaje actualiza `last_activity_at`; `@Nexo` pone `mentions_nexo`; en sala `visitor` cada mensaje humano encola `chat.reply`; en sala `closer` solo si menciona; en sala `client` sin consentimiento no encola aunque mencione; con `ai_enabled = false` no encola.
- `update`/`delete` de `messages` falla para todos los roles, admin incluido.
- Realtime: `messages` y `conversation_members` están en `supabase_realtime` (consulta a `pg_publication_tables`).

**`06_visitor_chat.test.sql` (M07)**
- `visitor_send` crea visitante, conversación y mensaje en el primer envío y reutiliza en el segundo; `authenticated` no puede ejecutarla.
- Cuotas: 21.º mensaje del visitante → `chat_quota_exceeded`; 61.º de la misma IP → igual; dos mensajes en menos de 3 s → igual.
- `visitor_handoff` crea `leads` con `source = nexo`, `conversation_id` y `consent_at`, y rellena `lead_id` en visitante y conversación; sin consentimiento falla.
- Purga: fixtures con `last_activity_at` a 8 días sin lead (se borra), 8 días con lead (se queda), 61 días con lead (se borra, el `lead` sigue y su `conversation_id` queda null), 61 días con lead cuyo contacto tiene deal `won` (se queda), 91 días con deal `won` (se borra), sala `closer` archivada hace 91 días (se borra), sala `closer` abierta sin actividad en un año (se queda), cuotas de hace 3 días (se borran).
- El trabajo está programado: `select count(*) from cron.job where jobname = 'purge-conversations'` = 1.

**`07_private_rooms.test.sql` (M08)**
- `ensure_my_conversation` crea una sala al closer con `aal2`, es idempotente, falla para `client` y para closer con `aal1`.
- `mark_read` actualiza solo mi fila; `unread_count` de `my_conversations` baja a 0 y vuelve a subir con un mensaje ajeno; mis propios mensajes no cuentan.
- `set_ai_consent`: el cliente concede (mensaje `system`, `audit_log`), revoca (segundo `system`, trabajos en cola marcados `failed`), el closer de la sala no puede, el admin tampoco; en una sala `closer` falla.
- `set_conversation_ai` solo admin; deja `system` `ai_off`.
- `add_member`/`remove_member`: admin añade al closer padre a una sala `client` (mensaje `system`, ahora lee); un closer no puede; añadir a una `visitor` falla.
- Desactivar un closer archiva su sala y pone `left_at` en sus membresías; ya no lee.
- `my_conversations` para closer A devuelve solo la suya; para el admin todas con el nombre del otro lado y «visitante» sin datos personales.

**`08_attachments.test.sql` (M09)**
- `authenticated` no inserta en `message_attachments`; `service_role` sí; sexto adjunto del mismo mensaje falla; adjunto en sala `visitor` falla; `mime` fuera de lista falla; 11 MB falla.
- `storage.objects`: un objeto `conversations/{sala de A}/x.pdf` lo lee A y no B; nadie `authenticated` lo inserta ni lo borra.

**`09_outbox.test.sql` (M10)**
- Lead en bandeja común → una fila `outbox` email al buzón de la vía, una Telegram a Jose, una `notifications` por closer activo; lead asignado → solo al asignado.
- Mensaje de A en su sala → `notifications` para Jose y no para A; mensaje de Jose → para A; Telegram solo si el autor no es Jose.
- Cada uno lee solo sus `notifications`.

**`10_client_rooms.test.sql` (M11)**
- Crear un proyecto con `deal_id` crea la sala `client` con cliente, Jose y el closer dueño; sin `deal_id`, solo cliente y Jose.
- El closer padre del subcloser que cerró **no** lee la sala; el freelance asignado tampoco; el cliente de otro proyecto tampoco.
- Reasignar `deals.owner_id` → el anterior queda con `left_at` y el nuevo lee; dos mensajes `system`.
- Archivar el proyecto archiva la sala; insertar falla después.

### Criterio de hecho por migración
`supabase db reset` verde · `supabase test db` verde con los casos de su fichero · `pnpm db:types` sin deriva · `anon` sin ningún privilegio nuevo (`00_helpers` incluye un test genérico que recorre `information_schema.role_table_grants` para `anon` y falla si aparece algo fuera de `public_packs`, `public_extras`, `public_settings`) · advisors de `josecoded` a cero tras el `push` con OK de Jose.

## 5. Orden de trabajo propuesto

1. M01 → M02 → M03+M04: la bandeja «Interesados» se puede ver en admin y CRM con datos de prueba (pantallas D8/K8 en sus bloques `admin/leads-inbox` y `crm/leads-inbox`, después de esto).
2. M05 → M06+M07: el chat de visitantes funciona con Nexo (O04–O07 en Omen) y la purga corre.
3. M08+M09: salas de closer y freelance (K7, F3) con adjuntos.
4. M10: avisos.
5. M11 cuando exista `projects` (zona área): salas de cliente (A5).

Cada paso termina con «pedir OK a Jose» para el `push` a `josecoded` (10.7) y con `ESTADO.md` actualizado.
