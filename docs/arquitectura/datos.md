# Propuesta de datos

**2026-11-02 · `arquitecto` · para que Jose la revise.** Entidades, campos clave, relaciones, principio RLS por tabla y qué vive en Supabase y qué en Omen. Nombres en inglés, `snake_case`. Columnas tipadas en SQL; `jsonb` solo donde se indica. El esquema real se escribe en `supabase/migrations/` bloque a bloque, con tests RLS, y se aplica a producción solo con OK de Jose. Las dudas van marcadas **Pregunta**.

## Principios

- **Esquemas:** `public` para las tablas de negocio con RLS; `private` para helpers, colas, latido, cuotas, auditoría y vectores (sin acceso desde el cliente); `storage` con políticas propias.
- **`anon` sin grants** salvo tres vistas de solo lectura: `public_packs`, `public_extras`, `public_settings` (solo filas visibles y claves públicas). Todo lo demás del público entra por RPC `security definer` con `search_path = ''`, Turnstile y cuota (`public_submit_contact`, `public_chat_send`).
- **Helpers en `private`:** `uid()`, `role()`, `is_admin()`, `is_staff()` (admin, closer o freelance **y** `aal2`), `owns_contact(contact_id)` (dueño o closer padre del dueño), `is_project_member(project_id)` (cliente, freelance asignado o admin).
- **Identidad:** `auth.users` de Supabase; `profiles.id = auth.users.id`. Rol en `profiles.role`.
- **Auditoría:** trigger a `private.audit_log` en `profiles`, `commissions`, `deals` (cambios de fase), `packs`, `site_settings`.
- **Borrado:** lógico (`archived_at`) en lo que se cita desde otro sitio (packs, contactos, proyectos); físico solo en borradores propios (historias `proposed`, documentos propios).

---

## 1. Usuarios y acceso

### `profiles`
- `id` (= auth.users), `role` enum `admin | closer | freelance | client`, `full_name`, `locale` `es | en`, `parent_closer_id` → profiles (solo closers; un nivel), `closer_rate` numeric (% sobre el importe cobrado), `parent_rate` numeric (% que recibe su closer padre sobre los cierres de este subcloser), `is_active`, `created_at`, `archived_at`.
- Telegram: `private.telegram_links(user_id, chat_id, linked_at)` y `private.telegram_codes(user_id, code, expires_at)`; nunca en `public`.
- **RLS:** cada uno lee y edita lo suyo (`full_name`, `locale`); admin lee y edita todo; closer lee nombre y rol de sus subclosers. Las tasas solo las cambia el admin.

### `invitations`
- `id`, `email`, `role`, `parent_closer_id`, `closer_rate`, `parent_rate`, `project_id` (si cliente), `token_hash`, `invited_by`, `expires_at` (7 días), `accepted_at`, `note`.
- **RLS:** solo admin. Aceptar por RPC `accept_invitation(token)` que crea `profiles` y enlaza el proyecto.

### `notification_prefs`
- `user_id`, `event` (enum de eventos), `telegram` bool, `email` bool. Reglas fijas en código; esta tabla solo apaga o enciende.
- **RLS:** cada uno las suyas; admin todas.

### `notifications`
- `id`, `user_id`, `event`, `title`, `body`, `href`, `read_at`, `created_at`.
- **RLS:** cada uno las suyas (leer y marcar leído); las escribe el servidor.

---

## 2. Catálogo público

### `packs`
- `id`, `code` (`P1`…), `name_es`, `name_en`, `price` numeric, `weeks` int, `includes_es`, `includes_en` (texto, líneas), `audience_es`, `audience_en`, `visible`, `sort`, `archived_at`.
### `extras`
- `id`, `code`, `name_es`, `name_en`, `price`, `billing` enum `once | monthly | yearly`, `visible`, `sort`, `archived_at`.
### `rates`
- `id`, `code` (`hourly`, `task_min`), `label_es`, `label_en`, `price`, `visible`.
### `price_changes`
- `id`, `table_name`, `row_id`, `field`, `before`, `after`, `changed_by`, `changed_at` (trigger).
### `site_settings`
- `key` (`blog`, `lab`, `public_chat`, `show_prices`, `maintenance`), `value` jsonb, `public` bool, `updated_by`, `updated_at`.
- **RLS de este bloque:** admin lee y escribe; `anon` y `authenticated` leen por las vistas `public_*` (solo `visible` y `public`).

---

## 3. CRM

### `contacts`
- `id`, `owner_id` → profiles (null = sin dueño, bandeja del admin), `full_name`, `email` (citext, único por dueño), `phone`, `organization`, `role_title`, `city`, `kind` enum `lead | client | recruiter | partner | other`, `source` enum `manual | import | form | chat | radar`, `linkedin_url`, `website`, `tags` text[], `notes`, `next_action`, `next_action_at`, `last_activity_at`, `import_id`, `radar_finding_id`, `created_at`, `archived_at`.
- **RLS:** `owns_contact(id)` lee y escribe; admin todo; `owner_id` solo lo cambia el admin (reasignar). Un contacto sin dueño solo lo ve el admin.

### `deals`
- `id`, `contact_id`, `owner_id` (copia del dueño del contacto al crear), `stage` enum `new | contacted | meeting | proposal | won | lost`, `via` enum `pack | freelance | hiring`, `pack_id`, `amount` (estimado), `won_amount` (cobrado, al ganar), `currency` `EUR`, `lost_reason`, `won_at`, `lost_at`, `created_at`.
- **RLS:** como `contacts` a través de `contact_id`. Cambiar a `won` solo por RPC `win_deal(deal_id, won_amount)` que crea la comisión.

### `activities`
- `id`, `contact_id`, `deal_id`, `author_id`, `kind` enum `note | call | meeting | email | whatsapp | stage_change | form | chat | system`, `body`, `occurred_at`, `created_at`.
- **RLS:** leer como `contacts`; insertar quien ve el contacto; no se editan ni borran (historial).

### `commissions`
- `id`, `deal_id` único, `base_amount` (= `deals.won_amount`), `closer_id` (quien cerró), `closer_rate`, `closer_amount`, `subcloser_id`, `subcloser_rate`, `subcloser_amount`, `status` enum `pending | approved | paid | rejected`, `approved_at`, `paid_at`, `paid_note`, `rejected_reason`, `decided_by`, `created_at`.
- Cálculo al crear, congelado: si el que cierra no tiene padre → `closer_id = él`, `closer_amount = base × closer_rate`, campos `subcloser_*` nulos. Si tiene padre → `subcloser_id = él`, `subcloser_amount = base × su closer_rate`, `closer_id = padre`, `closer_amount = base × parent_rate` (la tasa que se fijó al invitar al subcloser).
- **RLS:** admin todo; closer lee las filas donde es `closer_id` o `subcloser_id`; estado solo por RPC `set_commission_status` (admin).
- **Pregunta (clave):** ¿los dos porcentajes se aplican sobre el importe cobrado (closer 10 % + subcloser 5 % = 15 % del total) o el subcloser cobra un porcentaje de la comisión del closer? Reco: ambos sobre el importe cobrado, fijados al invitar y congelados por fila; es lo que permite «campos separados» sin cálculo derivado.

### `imports` y `import_conflicts`
- `imports`: `id`, `owner_id`, `file_name`, `file_hash` (único por dueño), `rows_total`, `rows_created`, `rows_updated`, `rows_invalid`, `rows_pending`, `created_at`.
- `import_conflicts`: `id`, `import_id`, `row_number`, `row` jsonb (contrato `contracts/import-row.json`), `existing_contact_id`, `status` enum `pending | kept | reassigned | merged | discarded`, `resolved_by`, `resolved_at`, `note`.
- **RLS:** el importador ve sus importaciones y el estado de sus conflictos (nunca el otro dueño); admin todo y resuelve por RPC.

---

## 4. Chat

### `chat_threads`
- `id`, `kind` enum `public | user`, `user_id` (null en público), `anon_id` (hash de la cookie firmada), `locale`, `ai_enabled` bool (público: true; usuario: false hasta que el admin lo active), `contact_id` (si se convirtió), `status` enum `open | archived`, `last_message_at`, `admin_unread` int, `user_unread` int, `created_at`.
- Un hilo `user` por usuario (`unique(user_id) where kind = 'user'`).
### `chat_messages`
- `id`, `thread_id`, `sender` enum `visitor | user | assistant | admin`, `body`, `model` (si `assistant`: `groq:…` o `local:…`), `created_at`, `read_at`.
- **RLS:** usuario con cuenta lee y escribe en su hilo; admin todo; público solo por RPC `public_chat_send(anon_id, body, turnstile)` y lectura por RPC `public_chat_thread(anon_id)`; Realtime filtrado por las mismas políticas. Purga: job diario borra hilos `public` sin actividad en 90 días.
### `private.chat_quota`
- `ip_hash`, `day`, `count`. Límite por IP y día en la RPC pública.

---

## 5. Proyectos y área

### `projects`
- `id`, `client_id` → profiles, `contact_id` (origen), `deal_id`, `name`, `pack_id`, `brief` (markdown), `phase` enum `discovery | design | build | review | delivered | maintenance`, `status` enum `active | paused | closed`, `freelance_id` → profiles, `started_at`, `due_at`, `created_at`, `archived_at`.
- **RLS:** `is_project_member(id)` lee; admin escribe. El freelance no lee `deal_id`, `contact_id` ni importes (vista `freelance_projects` con las columnas permitidas). **Pregunta:** confirmar que el freelance no ve cliente ni importes.
### `tasks`
- `id`, `project_id`, `phase`, `title`, `description`, `status` enum `todo | doing | done`, `assignee_id` (freelance), `story_id`, `sort`, `done_at`, `created_at`.
- Avance del proyecto = `done / total`, calculado en una vista `project_progress`.
- **RLS:** miembros leen; admin escribe; el freelance cambia `status` solo de las suyas.
### `stories`
- `id`, `project_id`, `author_id`, `title`, `as_a`, `i_want`, `so_that`, `criteria` text[] (≤ 12), `status` enum `proposed | accepted | rejected | in_tasks`, `estimate_hours`, `estimate_amount`, `decision_note`, `decided_by`, `decided_at`, `task_id`, `created_at`.
- **RLS:** cliente crea y lee las de su proyecto, edita y borra solo `proposed` propias; admin lee todas y decide por RPC `decide_story`.
### `documents`
- `id`, `project_id`, `uploaded_by`, `name`, `mime`, `size_bytes`, `storage_path`, `visibility` enum `client | team`, `created_at`, `deleted_at`.
- Storage: bucket `project-documents` privado, ruta `projects/{project_id}/{document_id}`; subida y descarga con URL firmada desde el servidor tras comprobar `is_project_member` y `visibility`. Límites: 25 MB por fichero, 1 GB por proyecto, tipos cerrados (**Pregunta**, ver pantallas A3).
- **RLS:** miembros leen según visibilidad; cada uno borra lo suyo; admin todo. Política equivalente en `storage.objects`.

---

## 6. Radar

### `radar_sources`
- `id`, `kind` enum `job_board | freelance_platform | business_directory | custom`, `name`, `enabled`, `schedule` (cron), `config` jsonb (contrato `contracts/radar-source.json`; sin credenciales: esas van al `.env` de Omen y aquí solo `has_credentials` bool), `last_run_at`, `last_error`.
### `radar_profile`
- Una fila: `criteria` jsonb (stack, tarifas mínimas, ciudad, remoto, exclusiones; base en `content/cv.json`), `updated_at`.
### `radar_findings`
- `id`, `source_id`, `kind` enum `job | business | project`, `external_id` (único por fuente), `url`, `title`, `organization`, `summary`, `score` numeric 0–1, `reasons` text[], `status` enum `new | shortlisted | drafted | sent | converted | discarded`, `discard_reason`, `contact_id`, `raw` jsonb (lo que devolvió la fuente, para reprocesar), `found_at`, `decided_at`.
### `radar_drafts`
- `id`, `finding_id`, `kind` enum `application | proposal | message`, `body`, `model`, `status` enum `draft | approved | sent`, `sent_via` enum `manual | api`, `sent_at`, `created_at`.
- **RLS del bloque:** solo admin. Omen escribe con la clave de servicio. Las acciones de envío con API pasan por `private.jobs` (`radar.send`) y solo si la fuente lo permite (decisión 8.3, abierta).

---

## 7. `private` (sin acceso desde el cliente)

- **`jobs`:** `id`, `kind` (`chat.reply`, `rag.index`, `radar.scan`, `radar.score`, `radar.draft`, `radar.send`, `account.delete`), `payload` jsonb (contrato por `kind` en `contracts/jobs/`), `status` `queued | running | done | failed`, `attempts`, `run_after`, `locked_by`, `result` jsonb, `error`, `created_at`, `finished_at`. Omen toma trabajos con `select … for update skip locked`.
- **`heartbeat`:** `service` (`omen`), `seen_at`, `version`, `models` jsonb. Omen escribe cada 30 s; el admin lo lee por RPC.
- **`outbox`:** `id`, `channel` `email | telegram`, `recipient`, `template`, `payload` jsonb, `status`, `attempts`, `sent_at`. Lo escriben triggers y RPC; **lo drena el servidor de Next con un cron de Cloudflare**, no Omen, para que email y Telegram funcionen con Omen apagado.
- **`audit_log`:** `id`, `actor_id`, `table_name`, `row_id`, `action`, `before`, `after`, `at`.
- **`chat_quota`**, **`telegram_links`**, **`telegram_codes`**: arriba.
- **RAG (pgvector):** `rag_documents(id, source, ref, title, updated_at)` y `rag_chunks(id, document_id, chunk, embedding vector, position)`. Fuentes: `content/*` del repo (sobre mí, proyectos, servicios, FAQ, blog), `packs`/`rates` y los hechos que Jose quiera que el asistente sepa. Omen indexa (job `rag.index`) y consulta. **Pregunta** (dentro de 4.5): vectores en Supabase (reco: Omen sin estado, copia de seguridad incluida) o en Omen.

---

## 8. Supabase frente a Omen

| | Supabase | Omen (`josecoded-omen`) |
|---|---|---|
| Datos canónicos | Todo lo de arriba | Nada: solo caché local de páginas rastreadas y ficheros de modelos |
| Auth, roles, MFA | Sí | No |
| Ficheros | Storage `project-documents` | No |
| Tiempo real | Realtime de `chat_messages` | Escucha, no sirve |
| IA | — | Modelo local, Groq, embeddings, RAG, borradores |
| Radar | Tablas `radar_*` | Rastreo, puntuación, borradores, envío por API |
| Trabajos | `private.jobs` | Ejecutor |
| Email y Telegram | `private.outbox` | — (lo drena el servidor de Next) |
| Latido | `private.heartbeat` | Escribe |

Omen usa la clave de servicio y nunca abre un puerto. Lo que Omen necesita saber se modela como fila; lo que produce, también.

---

## 9. Contenido en el repo (no es base de datos)

- `content/projects/*.mdx`, `content/blog/*.mdx`, `content/about.mdx`, `content/legal/*.mdx`, `content/cv.json`, `content/lab/*.mdx`. Frontmatter validado con zod en build; `cv.json` alimenta Sobre mí, el PDF y el criterio de Radar.
- `messages/es.json` (y `en.json` preparado).

---

## Resumen de preguntas de este documento

| # | Tabla | Pregunta | Recomendación |
|---|---|---|---|
| 1 | `commissions` | ¿Dos porcentajes sobre el importe cobrado o el subcloser cobra parte de la comisión del closer? | Ambos sobre el importe cobrado, congelados por fila |
| 2 | `deals`/`commissions` | ¿Comisión al marcar ganada o al registrar cobro? | Al ganar (`pending`); aprobar al cobrar |
| 3 | `projects` | ¿El freelance ve cliente e importes? | No (vista con columnas permitidas) |
| 4 | `projects` | ¿Varios proyectos por cliente? | Sí |
| 5 | `documents` | Límites y tipos | 25 MB, 1 GB por proyecto, tipos cerrados |
| 6 | `chat_threads` | ¿Un hilo por usuario? | Sí |
| 7 | RAG | ¿Vectores en Supabase o en Omen? | Supabase (pgvector, `private`) |
