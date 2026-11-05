# Propuesta de datos

**2026-11-02 · `arquitecto` · revisado por Jose el mismo día: aceptó todas las recomendaciones** (resumen al final; ids en `decisiones.md`). Entidades, campos clave, relaciones, principio RLS por tabla y qué vive en Supabase y qué en Omen. Nombres en inglés, `snake_case`. Columnas tipadas en SQL; `jsonb` solo donde se indica. El esquema real se escribe en `supabase/migrations/` bloque a bloque, con tests RLS, y se aplica a producción solo con OK de Jose. Lo que antes era **Pregunta** aparece como **Decidido**.

## Principios

- **Esquemas:** `public` para las tablas de negocio con RLS; `private` para helpers, colas, latido, cuotas, auditoría y vectores (sin acceso desde el cliente); `storage` con políticas propias.
- **`anon` sin grants** salvo tres vistas de solo lectura: `public_packs`, `public_extras`, `public_settings` (solo filas visibles y claves públicas). Todo lo demás del público (formulario de contacto, chat de visitantes) entra por **rutas de servidor de Next con la clave de servicio** que validan con zod, Turnstile y cuota y llaman a wrappers de `public` con `EXECUTE` solo para `service_role` que envuelven funciones de `private` (`public.submit_lead` → `private.submit_lead`, `private.visitor_send`; decisión 9.6); `anon` no ejecuta ninguna RPC (2026-11-04, sustituye a `public_submit_contact` y `public_chat_send`; coherente con 5.10).
- **Helpers en `private`:** `uid()`, `role()`, `is_admin()`, `is_staff()` (admin, closer o freelance **y** `aal2`), `owns_contact(contact_id)` (dueño o closer padre del dueño), `owns_lead(lead_id)` (asignado o closer padre del asignado), `is_project_member(project_id)` (cliente, freelance asignado o admin), `is_conversation_member(conversation_id)` y `can_write_conversation(conversation_id)` (§10).
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
- `id`, `owner_id` → profiles (null = sin dueño, bandeja del admin), `full_name`, `email` (citext, único por dueño), `phone`, `organization`, `role_title`, `city`, `kind` enum `prospect | client | recruiter | partner | other` (2026-11-04: `lead` pasa a `prospect` para no chocar con la tabla `leads` de §11), `source` enum `manual | import | form | nexo | whatsapp | radar`, `lead_id` → leads (el interesado de origen, si lo hubo), `linkedin_url`, `website`, `tags` text[], `notes`, `next_action`, `next_action_at`, `last_activity_at`, `import_id`, `radar_finding_id`, `created_at`, `archived_at`.
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
- **Decidido (7.6, 7.7):** los dos porcentajes se aplican sobre el importe cobrado (closer 10 % + subcloser 5 % = 15 % del total), fijados al invitar y congelados por fila; la fila nace en `pending` al ejecutar `win_deal` y el admin la aprueba al cobrar.

### `imports` y `import_conflicts`
- `imports`: `id`, `owner_id`, `file_name`, `file_hash` (único por dueño), `rows_total`, `rows_created`, `rows_updated`, `rows_invalid`, `rows_pending`, `created_at`.
- `import_conflicts`: `id`, `import_id`, `row_number`, `row` jsonb (contrato `contracts/import-row.json`), `existing_contact_id`, `status` enum `pending | kept | reassigned | merged | discarded`, `resolved_by`, `resolved_at`, `note`.
- **RLS:** el importador ve sus importaciones y el estado de sus conflictos (nunca el otro dueño); admin todo y resuelve por RPC.

---

## 4. Chat

**Sustituido el 2026-11-04 por §10 (conversaciones unificadas: visitantes y salas privadas; decisión 5.12).** `chat_threads` → `conversations`, `chat_messages` → `messages`, `anon_id` → `visitors.token_hash`, `kind = user` → `closer | client | freelance` con `conversation_members`. Las RPC `public_chat_send`/`public_chat_thread` desaparecen (5.10). `private.chat_quota` sigue, con `scope` por IP y por visitante (§10).

---

## 5. Proyectos y área

### `projects`
- `id`, `client_id` → profiles, `contact_id` (origen), `deal_id`, `name`, `pack_id`, `brief` (markdown), `phase` enum `discovery | design | build | review | delivered | maintenance`, `status` enum `active | paused | closed`, `freelance_id` → profiles, `started_at`, `due_at`, `created_at`, `archived_at`.
- **RLS:** `is_project_member(id)` lee; admin escribe. El freelance no lee `deal_id`, `contact_id` ni importes (vista `freelance_projects` con las columnas permitidas). **Decidido (6.5, 6.7):** varios proyectos por cliente; el freelance no ve cliente ni importes.
### `tasks`
- `id`, `project_id`, `phase`, `title`, `description`, `status` enum `todo | doing | done`, `assignee_id` (freelance), `story_id`, `sort`, `done_at`, `created_at`.
- Avance del proyecto = `done / total`, calculado en una vista `project_progress`.
- **RLS:** miembros leen; admin escribe; el freelance cambia `status` solo de las suyas.
### `stories`
- `id`, `project_id`, `author_id`, `title`, `as_a`, `i_want`, `so_that`, `criteria` text[] (≤ 12), `status` enum `proposed | accepted | rejected | in_tasks`, `estimate_hours`, `estimate_amount`, `decision_note`, `decided_by`, `decided_at`, `task_id`, `created_at`.
- **RLS:** cliente crea y lee las de su proyecto, edita y borra solo `proposed` propias; admin lee todas y decide por RPC `decide_story`.
### `documents`
- `id`, `project_id`, `uploaded_by`, `name`, `mime`, `size_bytes`, `storage_path`, `visibility` enum `client | team`, `created_at`, `deleted_at`.
- Storage: bucket `project-documents` privado, ruta `projects/{project_id}/{document_id}`; subida y descarga con URL firmada desde el servidor tras comprobar `is_project_member` y `visibility`. Límites **decididos (6.6)**: 25 MB por fichero, 1 GB por proyecto, tipos cerrados (PDF, imágenes, vídeo corto, zip, Office).
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
- **RLS del bloque:** solo admin. Omen escribe con la clave de servicio. Las acciones de envío con API pasan por `private.jobs` (`radar.send`) y solo si la fuente tiene API oficial autorizada (decisión 8.3); `radar_drafts.sent_via = 'manual'` cubre el resto («Copiar» + «Marcar enviado»).

---

## 7. `private` (sin acceso desde el cliente)

- **`jobs`:** `id`, `kind` (`chat.reply`, `chat.summary`, `rag.index`, `radar.scan`, `radar.score`, `radar.draft`, `radar.send`, `account.delete`), `payload` jsonb (contrato por `kind` en `contracts/jobs/`), `status` `queued | running | done | failed`, `attempts`, `run_after`, `locked_by`, `result` jsonb, `error`, `created_at`, `finished_at`. Omen toma trabajos con `select … for update skip locked`. `chat.reply` lo encola un trigger de `messages` (§10), no la ruta de servidor.
- **`heartbeat`:** `service` (`omen`), `seen_at`, `version`, `models` jsonb. Omen escribe cada 30 s; el admin lo lee por RPC.
- **`outbox`:** `id`, `channel` `email | telegram`, `recipient`, `template`, `payload` jsonb, `status`, `attempts`, `sent_at`. Lo escriben triggers y RPC; **lo drena el servidor de Next con un cron de Cloudflare**, no Omen, para que email y Telegram funcionen con Omen apagado.
- **`audit_log`:** `id`, `actor_id`, `table_name`, `row_id`, `action`, `before`, `after`, `at`.
- **`chat_quota`**, **`form_quota`**, **`telegram_links`**, **`telegram_codes`**: §10, §11 y §1.
- **RAG (pgvector):** `rag_documents(id, source, ref, title, updated_at)` y `rag_chunks(id, document_id, chunk, embedding vector, position)`. Fuentes: `content/*` del repo (sobre mí, proyectos, servicios, FAQ, blog), `packs`/`rates` y los hechos que Jose quiera que el asistente sepa. Omen indexa (job `rag.index`, embeddings con el modelo local) y consulta. **Decidido (4.5, 4.6):** vectores en Supabase (Omen sin estado, copia de seguridad incluida); el chat público responde con Groq y cae al modelo local si Groq falla.

---

## 8. Supabase frente a Omen

| | Supabase | Omen (`josecoded-omen`) |
|---|---|---|
| Datos canónicos | Todo lo de arriba | Nada: solo caché local de páginas rastreadas y ficheros de modelos |
| Auth, roles, MFA | Sí | No |
| Ficheros | Storage `project-documents`, `chat-attachments` | No |
| Tiempo real | Realtime de `messages` y `conversation_members` (salas privadas); SSE desde Next para visitantes | Escucha, no sirve |
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

## 10. Propuesta (2026-11-04): conversaciones, un solo modelo (decisiones 5.10, 5.12–5.17)

**No aplicada; se escribe con `docs/plan/migraciones-chat.md`.** Un único juego de tablas para el chat de visitantes con Nexo y las tres salas privadas (closer ↔ Jose, cliente ↔ Jose + closer que cerró, freelance ↔ Jose). Sustituye a §4 entero y a la primera versión de este §10 (`chat_visitors`/`chat_conversations`/`chat_messages`), que solo cubría visitantes. Lo que aquí es **ABIERTA** remite a `decisiones.md` (5.13, 5.15).

### Principios

- **Una conversación = una relación.** `kind` dice cuál: `visitor` (un visitante anónimo con Nexo), `closer` (un closer con Jose), `client` (un proyecto: el cliente con Jose y el closer que lo cerró; 5.13), `freelance` (un freelance con Jose). Quién está dentro lo dicen las filas de `conversation_members`; qué puede hacer Nexo lo dicen `ai_enabled` y el consentimiento (5.14).
- **Jose es un miembro más** (`role = owner`) en todas, también en las de visitantes: así su recibo de lectura y su «sin leer» salen de la misma columna que los de los demás. Un trigger lo añade al crear cualquier conversación (y a cualquier otro `admin` activo, si algún día lo hay).
- **El visitante nunca toca Supabase** (5.10): cookie `httpOnly` con token opaco, rutas de servidor con la clave de servicio, `anon` sin grants, el cliente no envía nunca `conversation_id`. Los usuarios con cuenta sí hablan con Supabase directamente bajo RLS (lectura, inserción de mensajes, Realtime).
- **Los mensajes no se editan ni se borran** por nadie salvo la purga. Un error se corrige con otro mensaje. Igual que `activities`.
- **Nexo no es un miembro**: es `author_kind = nexo`. Escribe Omen con la clave de servicio al cerrar un trabajo `chat.reply`. `system` son los avisos que genera la base (alguien entra o sale, consentimiento concedido o retirado, Nexo encendido o apagado, sala archivada).

### Tablas

#### `visitors`
- `id` uuid, `token_hash` text único (SHA-256 del token de la cookie; el token solo vive en la cookie), `locale`, `created_at`, `last_activity_at`, `lead_id` → leads (null hasta el consentimiento de `HandoffCard`), `consent_at`.
- Sin `ip`, sin `user_agent`, sin email ni teléfono: esos van a `leads` (§11) cuando el visitante acepta.
- **RLS:** admin lee; nadie más. Escribe solo el servidor.

#### `conversations`
- `id`, `kind` enum `visitor | closer | client | freelance`, `visitor_id` → visitors (solo `visitor`), `subject_user_id` → profiles (el closer o el freelance de la sala; solo `closer | freelance`), `project_id` → projects (solo `client`), `locale`, `ai_enabled` bool (interruptor de Jose; por defecto `true` en todos los `kind`), `ai_consent_at`, `ai_consent_by` → profiles, `ai_consent_revoked_at` (solo `client`), `lead_id` → leads y `contact_id` → contacts (visitante convertido), `interest` bool null (5.7), `first_page_path`, `status` enum `open | archived`, `archived_at`, `last_activity_at` (trigger al insertar mensaje), `created_at`.
- **Checks:** exactamente una de `visitor_id | subject_user_id | project_id` según `kind`. **Únicos parciales:** `(subject_user_id) where kind in ('closer','freelance')`, `(project_id) where kind = 'client'`, `(visitor_id) where kind = 'visitor' and status = 'open'`.
- **Nexo activo** = `ai_enabled and (kind <> 'client' or (ai_consent_at is not null and ai_consent_revoked_at is null))`; función `private.ai_active(conversation_id)` usada por el trigger que encola y por la interfaz (`NexoAvatar` en `offline`/oculto cuando no está activo).
- Índice parcial para la purga: `(last_activity_at) where kind = 'visitor'`.
- **RLS:** `select` admin o miembro activo; `insert`/`update`/`delete` nadie desde el cliente: crean los triggers y las RPC (abajo); Jose cambia `ai_enabled` y `status` por RPC `set_conversation_ai` y `archive_conversation`; el cliente concede o retira el consentimiento por RPC `set_ai_consent` (solo si es miembro con `role = client` de esa sala).

#### `conversation_members`
- `conversation_id`, `user_id` → profiles, `role` enum `owner | closer | client | freelance`, `can_write` bool default true, `joined_at`, `left_at` (null = activo; un closer reasignado se queda con `left_at` y conserva el historial sin leerlo más), `last_read_at` (recibo de lectura; **sin leer** = mensajes con `created_at > last_read_at` cuyo autor no soy yo), `added_by`. PK `(conversation_id, user_id)`.
- Los visitantes **no** tienen fila (no son `auth.users`); su conversación los identifica por `visitor_id`.
- **RLS:** `select` miembros activos de la misma conversación y admin (así cada uno ve quién está); `update` solo por RPC `mark_read(conversation_id)` (actualiza `last_read_at` de la fila propia); `insert`/`delete` solo por RPC de admin `add_member` / `remove_member` (que escriben el mensaje `system`).

#### `messages`
- `id`, `conversation_id`, `author_kind` enum `human | nexo | system`, `author_id` → profiles (humano con cuenta; **null + `human` = el visitante de la conversación**; null en `nexo` y `system`), `kind` enum `text | handoff | reference` (tarjetas de P7; `reference` lleva `ref_contact_id`, `ref_task_id` o `ref_story_id` nulos salvo uno), `system_event` enum `member_added | member_left | ai_on | ai_off | consent_granted | consent_revoked | archived | handoff_done` (solo `system`), `body` text (check ≤ 4.000; el servidor limita a 2.000 a los visitantes), `page_path`, `mentions_nexo` bool (lo calcula el servidor o un trigger `before insert` buscando `@nexo`), `sources` text[] (refs de `private.rag_documents` cuando `nexo`), `model` (`groq:…` o `local:…`), `created_at`.
- Sin `read_at`: el recibo está en el miembro.
- **Triggers:** `after insert` → `conversations.last_activity_at = now()`; si `author_kind = human` y `private.ai_active(conversation_id)` y (`kind = visitor` **o** `mentions_nexo`, según 5.15) → encola `private.jobs` `chat.reply` `{ conversation_id, message_id, page_path }`; si hay miembros humanos distintos del autor → fila en `notifications` y, para Jose, `private.outbox` Telegram (bloque posterior).
- **RLS:** `select` admin o miembro activo; `insert` solo `authenticated` que es miembro activo con `can_write`, con `author_kind = 'human'`, `author_id = auth.uid()`, conversación `open` y, si es personal, `aal2` (`is_staff()`); visitantes, Nexo y `system` entran con la clave de servicio o desde triggers. Sin `update` ni `delete`.
- **Realtime:** `messages` y `conversation_members` en la publicación `supabase_realtime`; el cliente se suscribe a `postgres_changes` con filtro `conversation_id=eq.{id}` y RLS decide qué le llega (5.4). «Está escribiendo» por Broadcast en el canal privado `conversation:{id}` con política en `realtime.messages` que exige `private.is_conversation_member(id)`. Los visitantes reciben por SSE (abajo).

#### `message_attachments`
- `id`, `message_id`, `conversation_id` (copia, para la política de Storage), `uploaded_by`, `name`, `mime`, `size_bytes`, `storage_path`, `created_at`.
- Storage: bucket `chat-attachments` privado, ruta `conversations/{conversation_id}/{attachment_id}`; subida por URL firmada que crea el servidor tras validar tipo, tamaño (≤ 10 MB, ≤ 5 por mensaje) y pertenencia; descarga por URL firmada de 60 s. **Sin adjuntos en `kind = visitor`** (5.17). Política en `storage.objects`: `private.is_conversation_member(split_part(name, '/', 2)::uuid)`.
- **RLS:** `select` como `messages`; `insert` solo el servidor (la validación vive en un sitio); sin `update`; `delete` por la purga.

#### `private.chat_quota`
- `scope` enum `ip | visitor`, `key_hash`, `day`, `count`. Límites: 60 mensajes/día por IP, 20/día por visitante, ráfaga de 1 cada 3 s. Error tipado `chat_quota_exceeded` → 429 y `QuotaNotice`. Filas de más de 2 días se borran en la purga.

### Quién entra en cada sala

| `kind` | Miembros al crearse | Quién la crea | `ai_enabled` por defecto | Nexo habla |
|---|---|---|---|---|
| `visitor` | Jose (`owner`) | ruta de servidor en el primer mensaje del visitante | `true` | a todo (5.7) |
| `closer` | Jose, el closer (`closer`) | `accept_invitation` del closer (o `ensure_my_conversation()` si falta) | `true` | 5.15 |
| `client` | Jose, el cliente (`client`), el dueño de la oportunidad ganada del proyecto (`closer`) | trigger `after insert on projects` (o `ensure_project_conversation(project_id)` para proyectos sin oportunidad) | `true`, pero sin efecto hasta `ai_consent_at` | 5.15, solo con consentimiento |
| `freelance` | Jose, el freelance (`freelance`) | `accept_invitation` del freelance | `true` | 5.15 |

Fuera siempre, salvo que Jose los añada a mano con `add_member` (y quede un mensaje `system`): el closer padre de un subcloser (5.16), el freelance asignado al proyecto (6.7), otros clientes de la misma organización.

### Flujos

1. **Visitante, primer mensaje:** Turnstile en el servidor → `private.visitor_send(token_hash, body, page_path, locale, ip_hash)` crea `visitors`, `conversations` (`visitor`, con el trigger que añade a Jose) y el mensaje, comprobando la cuota en la misma transacción; cookie `jc_visitor` (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age` = 7 días renovados en cada envío). Antes no existe ni cookie ni fila: el saludo de Nexo es texto de `messages/es.json`.
2. **Respuesta de Nexo:** el trigger encola `chat.reply`; Omen responde con `author_kind = nexo`, `sources`, `model` y `interest` (contrato `contracts/jobs/chat.reply.json`). Para salas privadas el contrato lleva también `kind` y los `member` roles para que el prompt sepa con quién habla; para `client` incluye `project_id` y Omen solo lee lo que `is_project_member` permitiría al cliente.
3. **Recibir (visitante):** `GET /api/chat/stream` con SSE emite los mensajes nuevos de su conversación y el estado del trabajo (`thinking`/`speaking`, 5.9); sin JS, `/chat` recarga y pinta el hilo. **Recibir (con cuenta):** Realtime bajo RLS.
4. **Handoff (visitante):** `HandoffCard` → `private.visitor_handoff(token_hash, email, phone, name, consent)` crea `leads` (`source = nexo`, `conversation_id`, `consent_at`) y rellena `lead_id` y `consent_at` en `visitors` y `conversations`; mensaje `system` `handoff_done`. El `contact` nace cuando un closer o Jose reclama el interesado (§11).
5. **Jose o un closer entran** en cualquier sala: insertan `messages` bajo RLS; Nexo pasa a `handoff` en la interfaz del visitante. En salas privadas Nexo solo interviene según 5.15.
6. **Consentimiento del cliente:** `set_ai_consent(conversation_id, granted)` → columnas, mensaje `system`, `private.audit_log`. Al retirarlo se cancelan los `chat.reply` en cola de esa sala.
7. **Reasignación de oportunidad** (admin, 7.3): trigger en `deals.owner_id` → en la sala `client` del proyecto, el closer anterior recibe `left_at` y el nuevo una fila nueva; dos mensajes `system`.
8. **Archivar:** `archive_conversation(id)` (admin) o automático cuando el perfil del `subject_user_id` se desactiva o el proyecto se archiva (trigger). Una sala archivada se lee pero no admite mensajes.

### Purga con `pg_cron`

Función `private.purge_conversations()` `security definer` con `search_path = ''`, programada a diario a las 04:00 UTC (`cron.schedule` en la migración). Plazos de 5.11:

1. `visitor` **sin** `lead_id` y `last_activity_at < now() - 7 días` → se borra la conversación (mensajes en cascada).
2. `visitor` **con** `lead_id` y `last_activity_at < now() - 60 días` → se borra; el `lead` y, si existe, el `contact` con su resumen en `activities` se quedan.
3. `visitor` cuyo `contact_id` tiene un `deal` `won` y `last_activity_at < now() - 90 días` → se borra (tiene prioridad sobre 2).
4. `visitors` sin conversación y `last_activity_at < now() - 7 días` → se borra.
5. Salas privadas `archived` con `archived_at < now() - 90 días` → se borran con sus adjuntos (`storage.objects` por prefijo, desde la misma función).
6. `private.chat_quota` con `day < hoy - 2`.

La cookie caduca sola a los 7 días sin actividad; si vuelve un visitante cuya fila ya no existe, es nuevo. Derecho de borrado: el servidor borra por `token_hash`, por `lead_id` o por `user_id`.

### Lo que cambia en otros sitios

- `pantallas.md`: P7 y D6 con los nombres nuevos; K7, A5 y F3 pasan a ser «mi sala» (`kind` según zona) y A5 muestra el consentimiento de Nexo; D6 lista todas las salas con «sin leer» por `last_read_at`.
- `bloques.md`: W37 y W39 según `migraciones-chat.md`; O07 lee `kind`, `member` roles y `project_id` del contrato.
- Política de privacidad (W42): cookie técnica de 7 días, plazos de 5.11, Groq como encargado también en salas privadas (solo con Nexo activo), consentimiento revocable del cliente.

---

## 11. Propuesta (2026-11-04): interesados (decisiones 7.8, 7.9)

**No aplicada.** Entrada única de todo lo que llega de fuera con intención de contratar: formulario de `/contacto` (2.21), handoff de Nexo (5.7), WhatsApp (a mano), Radar convertido y altas manuales. La bandeja «Interesados» (D8 en admin, K8 en CRM) lee esta tabla; `contacts` sigue siendo la cartera.

### `leads`
- `id`, `source` enum `form | nexo | whatsapp | radar | manual`, `via` enum `hiring | freelance | pack` (null si Nexo no lo infirió), `pack_id` → packs, `full_name`, `email` citext, `phone`, `organization`, `message` text (check ≤ 4.000), **campos por vía** (tipados, nulos cuando no aplican): `offer_url` y `company` (contratación), `wanted_by` date (freelance), `has_domain` bool y `has_store_accounts` bool (packs); `page_path`, `locale`, `consent_at` (acepta la política; obligatorio en `form` y `nexo`), `conversation_id` → conversations (si vino de Nexo; se pone a null cuando la purga borra la conversación: `on delete set null`), `radar_finding_id`, `status` enum `new | assigned | contacted | converted | discarded`, `assigned_to` → profiles, `assigned_at`, `assigned_by`, `contact_id` → contacts, `deal_id` → deals, `discard_reason`, `created_at`, `handled_at`.
- Índices: `(status, created_at)` para la bandeja; `(email)` para el emparejado.
- **Emparejado al insertar** (trigger `before insert`): si `email` coincide con un `contacts.email` con `owner_id` no nulo → `assigned_to = owner_id`, `status = assigned`, `contact_id` = ese contacto (el interesado nunca entra en la bandeja común: no se le quita un contacto a nadie). Si coincide con un contacto sin dueño → queda `new` con `contact_id` prefijado y solo lo ve el admin.
- **RLS (7.8 a):** `select` admin todo; closer: `status = 'new' and assigned_to is null and contact_id is null` (bandeja común) **o** `owns_lead(id)` (asignado a mí o a un subcloser mío). `insert` solo el servidor (`private.submit_lead`) y el admin/closer en `source = whatsapp | manual` (con `assigned_to = auth.uid()` si es closer). `update` solo por RPC. `delete` nadie (se descarta, no se borra).
- **RPC:** `claim_lead(lead_id)` (closer o admin): `update … where status = 'new' and assigned_to is null` (el primero gana; si no actualiza fila, error tipado `lead_already_claimed`), crea o enlaza `contacts` (`owner_id = yo`, `kind = prospect`, `source` = el del lead, `lead_id`), crea `deals` (`stage = new`, `via`, `pack_id`) y `activities` (`kind = form | chat | whatsapp`, cuerpo = mensaje o resumen de la conversación), deja `status = converted`. `assign_lead(lead_id, user_id)` (admin): igual, a nombre de otro; también reasigna. `discard_lead(lead_id, reason)` (admin o asignado). `touch_lead(lead_id)` → `contacted`.
- **Notificaciones:** trigger `after insert` → `private.outbox` Telegram a Jose y email a la bandeja de la vía (2.23: `hola@`, `freelance@`, `proyectos@`); fila en `notifications` para cada closer activo si cae en la bandeja común, o solo para el asignado.

**Implementado en la migración `20261105100000_lead_claim.sql` (M04, sin aplicar a producción):** `contact_via` pasa de `pack` a `project` (2.28); `leads` gana `offer` (uno o dos slugs separados por coma, uno por plataforma), `extras text[]` (≤ 12 slugs) y `offer_answers jsonb` (contrato de `ofertas.md` §4.8, solo con vía `project` o `freelance`), y `pack_id` se conserva hasta que exista `offers`. Un lead con email de un contacto **con relación real** (creado por conversión de un lead, por importación o por el admin, o con deal o actividad con autor) cuyo dueño está activo nace `assigned` a ese dueño con una `activity`; si el contacto con relación real no tiene dueño o su dueño está inactivo, nace `new` con `contact_id` y solo lo ve el admin; si solo coincide con contactos sin relación real (los que crea un closer a mano), el lead entra a la bandeja normal. `contacts.created_by_admin` lo fija un trigger (no se puede falsificar) y cada contacto nuevo cuyo email coincide con un lead abierto deja en `audit_log` la acción `contact_email_matches_lead` para el admin. `leads_before_insert` rechaza (`invalid_assignee`) un `assigned_to` que no sea un perfil closer o admin activo. Los closers no leen los `new` sin dueño: los ven enmascarados por `list_lead_inbox()` (7.11). `claim_lead` solo toma leads `new`, sin dueño y sin contacto; `assign_lead` (admin) reasigna también el contacto y sus deals; `discard_lead` exige motivo y solo vale en `new | assigned | contacted`; `touch_lead` pasa `assigned` a `contacted` y en `converted` solo fija `handled_at`; `discard_lead` rechaza los leads con deal y guarda `discarded_by`. `assign_lead` lanza `contact_conflict` si ya hay un contacto activo con ese email de otro dueño (el admin sí adopta contactos sin dueño y mueve sus deals). `claim_lead` no revela el conflicto: devuelve `null`, saca el lead de la bandeja y lo asigna al admin para que decida. `claim_lead` tiene un tope de 25 reclamaciones al día por usuario (`private.claim_quota`, `private.claim_daily_limit()`); la reclamación 26 lanza `claim_quota_exceeded`, al llegar a 25 se escribe `claim_quota_reached` en `audit_log` y el admin no tiene tope. `list_lead_inbox()` sustituye emails, URL y secuencias de 7 o más dígitos del extracto por `[…]` antes de recortarlo a 140 caracteres. Los cambios de `owner_id` de `deals` también quedan en `audit_log`. Reglas: decisión 7.16. Los cambios de `assigned_to` y `status` quedan en `audit_log`. Los closers solo insertan `source = whatsapp | manual` con `assigned_to = auth.uid()` (permiso de inserción por columnas); nadie tiene `UPDATE` ni `DELETE` sobre `leads`.

### `private.form_quota`
- `ip_hash`, `day`, `count`, clave `(ip_hash, day)`. Tres contadores diarios en la misma tabla, comprobados en este orden dentro de `submit_lead` (todo se revierte si alguno falla):
  - Por IP: 5 envíos/día; error `form_quota_exceeded`. `ip_hash` = HMAC-SHA256(secreto del servidor, `CF-Connecting-IP`) con las IPv6 normalizadas a su /64, calculado siempre en el servidor de Next; la base nunca recibe la IP ni calcula el hash.
  - Por correo: 3 envíos/día; clave `email:` + md5(minúsculas del email); error `form_email_quota_exceeded`.
  - Global: 200 envíos/día; fila `ip_hash = '__global__'`; error `form_global_quota_exceeded`.
  Todos son `P0001` con `hint = contact_alternatives` → 429 con las vías alternativas (P6). Se limpia en la misma purga que `chat_quota`.

### `public.submit_lead(...)` y `private.submit_lead(...)`
- `private.submit_lead` es `security definer` con `search_path = ''` y sin `EXECUTE` para nadie salvo su dueño. `public.submit_lead` (mismos parámetros) es un wrapper `security definer` con `search_path = ''` y `EXECUTE` solo para `service_role`: es la única función de `public` que no ejecuta `authenticated`. Comprueba consentimiento, cuotas (arriba), inserta `leads` (`source = form`) y devuelve el `id`. La Server Action de `/contacto` valida con zod, verifica Turnstile, calcula `ip_hash` y la llama. Sustituye a `public_submit_contact`.

### Relación con el CRM

- `leads` → `contacts` es 1 → 0..1 (`contacts.lead_id`) y `contacts` ← `leads` puede ser 1 → n (la misma persona escribe dos veces: el segundo se asigna solo al dueño y añade una `activity`).
- K3 muestra «Interesados de este contacto» (sus `leads`) y, mientras exista, la conversación de origen.
- El pipeline (7.2) no cambia: el `deal` nace en `new` al reclamar.


### Baja de usuario y retención de auditoría (propuesta, sin código todavía)
- **Baja:** primero se desactiva (`profiles.is_active = false`, `archived_at`), lo que corta el acceso sin perder historial; el borrado real (`auth.users`, que cascada a `profiles`) lo ejecuta el job `account.delete` en Omen, nunca un cliente. Antes de borrar: reasignar o archivar sus `contacts`, `deals` y `leads` (el admin decide), comprobar que no es el último admin y que no tiene subclosers (`on delete restrict`). Las FK de autoría (`activities.author_id`, `leads.assigned_to`, etc.) pasan a `null` y el hecho queda en `audit_log`.
- **Auditoría:** `private.audit_log.actor_id` no tiene FK, así que sobrevive a la baja. Propuesta: conservar 24 meses y purgar en el job mensual; las filas de `profiles` con datos personales (`before`/`after`) se anonimizan a los 30 días de la baja (se conserva `row_id`, `action` y `at`). A confirmar con Jose antes de implementarlo.

---

## Resumen de decisiones de este documento (Jose, 2026-11-02)

| # | Tabla | Pregunta | Decisión | Id |
|---|---|---|---|---|
| 1 | `commissions` | ¿Dos porcentajes sobre el importe cobrado o el subcloser cobra parte de la comisión del closer? | Ambos sobre el importe cobrado, congelados por fila | 7.6 |
| 2 | `deals`/`commissions` | ¿Comisión al marcar ganada o al registrar cobro? | Al ganar (`pending`); aprobar al cobrar | 7.7 |
| 3 | `projects` | ¿El freelance ve cliente e importes? | No (vista con columnas permitidas) | 6.7 |
| 4 | `projects` | ¿Varios proyectos por cliente? | Sí | 6.5 |
| 5 | `documents` | Límites y tipos | 25 MB, 1 GB por proyecto, tipos cerrados | 6.6 |
| 6 | `chat_threads` | ¿Un hilo por usuario? | Sí | 5.6 |
| 7 | RAG | ¿Vectores en Supabase o en Omen? | Supabase (pgvector, `private`) | 4.6 |
