# Deploy runbook — josecoded-api (Cloudflare Worker)

Este documento describe cómo desplegar el gateway `josecoded-api` a la cuenta
Cloudflare del proyecto (`d26022a34346cb759178a720bace386d`) y qué secretos
hay que fijar antes del primer deploy real. Desde el plan 1.8c (DATOS v1.2) el
gateway habla con el proyecto Supabase **nuevo** (`echlwywbucgbhwpncviy`) y ya
no monta `forum/*` ni `admin-chat/*` (retirados con sus tablas, DATOS §9, Q1).
Ningún valor secreto vive en el repo: los secretos se cargan con
`wrangler secret put` directamente contra la cuenta Cloudflare.

## 0. Prerrequisitos

```bash
cd apps/api
pnpm exec wrangler login    # una sola vez por máquina; abre el navegador
pnpm exec wrangler whoami   # confirma cuenta + account_id == d26022a34346cb759178a720bace386d
```

`wrangler.jsonc` ya fija `account_id` en la raíz, así que `wrangler deploy` no
pedirá seleccionar cuenta interactivamente.

## 1. Variables no secretas (`vars` en `wrangler.jsonc`)

`WORKER_URL` **no** está en `vars` (1.8d): el gateway funciona sin Omen y ninguna ruta de producción lo necesita. Si algún día se quiere la integración opcional, se fija como secreto junto con `WORKER_INTERNAL_TOKEN`, nunca uno solo (el esquema lo rechaza).

Estas viven en el repo porque no son sensibles (URLs públicas, CORS). **Ningún
correo ni identificador personal** va en `vars` (lo comprueba
`test/wrangler-config.test.ts`); el admin ya no se configura aquí: es una fila
de `public.staff_members` (gate 1.9).

| Var | Valor actual | Notas |
|---|---|---|
| `API_MODE` | `production` (raíz) · `development` (`env.preview`) | Ver sección 4. |
| `CORS_ORIGINS` | `https://josecoded.com,https://www.josecoded.com` (raíz) · previews y `http://localhost:3000` solo en `env.preview` | Lista separada por comas; el comodín de previews lleva guion, nunca punto. Producción no admite localhost ni `workers.dev` (lo comprueba `test/wrangler-config.test.ts`); en local, `.dev.vars` con `CORS_ORIGINS` propio. |
| `ALLOWED_TURNSTILE_HOSTNAMES` | `josecoded.com,www.josecoded.com` (raíz) · comodín de previews y `localhost` solo en `env.preview` | Mismo criterio que `CORS_ORIGINS`. |

El env `preview` (`josecoded-api-preview`) repite sus propias `vars` (sin cron
ni rutas de producción): no hereda nada de la raíz.

Los bindings nativos de rate limiting viven en `wrangler.jsonc` (infraestructura,
no secretos): `AI_RATE_LIMITER`, `LEADS_RATE_LIMITER`, `AFFILIATE_RATE_LIMITER`,
`RADAR_RATE_LIMITER`, con namespaces distintos en `preview`.

## 2. Secretos (`wrangler secret put`)

Fuente de verdad: `src/config/env.ts` (`envSchema`) y `src/types/env.types.ts`.
Los valores **no** se pegan en este archivo, ni en el repo, ni en chats: los
pone Jose directamente en el prompt de `wrangler secret put`. Se fijan en
**los dos** Workers: `josecoded-api` y `josecoded-api-preview` (`--env preview`).
Claves de Supabase en formato nuevo (Settings → API Keys, DATOS §8.1): la JWT
`service_role` heredada no se usa.

### Obligatorios

| Secreto | Para qué | Validación en `env.ts` |
|---|---|---|
| `SUPABASE_URL` | `https://echlwywbucgbhwpncviy.supabase.co` (no es credencial; se fija como secreto por entorno). | `z.string().url()`, obligatorio |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…`: `apikey` de `/auth/v1/user` al verificar la sesión. (`SUPABASE_ANON_KEY` solo como alternativa heredada.) | una de las dos (`.refine()`) |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (salta RLS). Solo la usa `src/adapters/supabase.ts`: RPC del outbox, `scheduled_jobs_*`, `increment_quota` y la lectura de `staff_members` (`is_admin`). Sin ella el cron no ejecuta nada y `auth/me` responde 502. | `min(20)`, opcional en el esquema, **necesaria** en producción y preview |
| `TELEGRAM_BOT_TOKEN` | Bot que avisa a Jose de los eventos del outbox (`outbox.drain`). | `min(10)`, opcional en el esquema; sin él (o sin el chat) el drenaje **no reclama** eventos |
| `TELEGRAM_ADMIN_CHAT_ID` | `chat_id` de Jose con el bot (numérico, negativo en grupos). | `^-?\d+$` |
| `CHAT_SID_SECRET` | Firma de la cookie `__Host-chat_sid` del chat por casos (4.4), con una subclave derivada (HMAC de la clave y la etiqueta `chat-cookie`; igual `SERVER_KEY` para el `proposalToken` y el pepper de IP). `openssl rand -hex 32`. | `min(32)`, opcional hasta 4.4 |

```bash
pnpm exec wrangler secret put SUPABASE_URL
pnpm exec wrangler secret put SUPABASE_PUBLISHABLE_KEY
pnpm exec wrangler secret put SUPABASE_SECRET_KEY
pnpm exec wrangler secret put TELEGRAM_BOT_TOKEN
pnpm exec wrangler secret put TELEGRAM_ADMIN_CHAT_ID
pnpm exec wrangler secret put CHAT_SID_SECRET
# y lo mismo con --env preview para josecoded-api-preview
```

### Módulos públicos (3.7 propuestas, 3.8 leads, 4.4 chat por casos)

| Secreto/var | Para qué |
|---|---|
| `TURNSTILE_SECRET_KEY` | Secreto de Turnstile (propuestas `proposal`, leads `contact`/`proposal_send`/`partner`, chat `chat`). Sin él esas rutas responden 503 (nunca "sin comprobación"). En local: `1x0000000000000000000000000000000AA`. |
| `SERVER_KEY` | `openssl rand -hex 32`. Firma el `proposalToken` y autentica `POST /leads` servidor a servidor (cabecera `x-josecoded-server-key`, webhook de Cal.com vía `apps/web`). El mismo valor en `apps/web`. |
| `ALLOWED_TURNSTILE_HOSTNAMES` (var) | Hostnames que Turnstile puede reportar. Obligatoria en producción (`wrangler.jsonc`); admite `*-sufijo`. |
| `AI_GATEWAY_ID` (var) | AI Gateway por el que pasa **toda** llamada a Workers AI (`cf-aig-metadata: {consumer}`); sin él el modelo no se llama y se usan reglas / respuesta fija. |
| `PROPOSALS_DAILY_LIMIT_IP` / `_ALL` | Cuotas diarias del generador (por defecto 10 y 300). |
| `CHAT_DAILY_THREADS_IP` / `_ALL`, `CHAT_DAILY_MESSAGES_IP` / `_ALL` / `_VISITOR` | Cuotas diarias del chat (por defecto 20/500 hilos, 40/2000 mensajes y 60 por visitante). Las IPv6 cuentan por su /64. Los contactos rápidos tienen tope fijo: 3 por hilo y 5 por IP al día. |
| `AI_PROPOSAL_MODEL`, `AI_ASSISTANT_MODEL` | Modelo de cada consumidor (por defecto `@cf/meta/llama-3.3-70b-instruct-fp8-fast`). |

Los contadores usan la RPC `increment_quota` (sin KV); si no responde, la petición pasa, se registra `quota_unavailable` y Jose recibe un aviso de Telegram (como mucho uno por hora y isolate). Mientras dura, el único tope de coste es el presupuesto del AI Gateway.

**Presupuesto del AI Gateway (obligatorio antes de abrir el chat y las propuestas).** En el dashboard de Cloudflare, AI → AI Gateway → `josecoded` (y `josecoded-preview`) → Settings: activar **Rate limiting** (fixed window, por ejemplo 120 peticiones por hora) y **Cache** de respuestas, y fijar un tope de gasto mensual con aviso al 80 % (Billing → Notifications). El gateway es la red de seguridad cuando los contadores de Supabase caen o una cookie reparte mensajes entre muchas IPs; sin tope ahí, el coste de Workers AI no tiene techo. Bindings nuevos: `ASSISTANT_RATE_LIMITER` (1005 / preview 2005). El chat necesita contextos publicados (`chat_contexts`, tarea 6.9) o responde con el texto fijo.

### Opcionales

| Secreto/var | Cuándo |
|---|---|
| `RESEND_API_KEY` | Canal email (Resend, DATOS Q5): solo las plantillas fijas `staff-invited`, `client-invited` y `story-decided` (tarea 3.8b). Sin él, esos eventos fallan en el outbox (y acaban en `system.outbox_dead`), no se pierden en silencio. |
| `EMAIL_FROM` | Remitente de esos correos (`Nombre <dirección@dominio-verificado>`); por defecto `josecoded.com <no-reply@josecoded.com>`. El dominio debe estar verificado en Resend. |
| `TELEGRAM_WEBHOOK_SECRET` | Modo webhook del bot: el `secret_token` de `setWebhook` (cabecera `X-Telegram-Bot-Api-Secret-Token`), 16–256 caracteres `A-Za-z0-9_-`. Con él, `POST /api/v1/telegram/webhook` vincula chats y el job `telegram.poll_updates` no hace nada (Telegram rechaza `getUpdates` con webhook activo). Sin él, el job vincula por sondeo. `setWebhook` es un paso de producción con OK de Jose. |
| `ADMIN_REQUIRE_MFA` | Solo `false` desactiva la exigencia de `aal2` (TOTP) en `requireAdmin`; **nunca** en producción ni preview (DATOS Q3). Pensado para `wrangler dev` contra Supabase local, cuyas cuentas del seed no tienen TOTP. |
| `WORKER_URL` + `WORKER_INTERNAL_TOKEN` | Integración opcional con el worker de Omen (1.8d). **Los dos o ninguno** (`refine` en `env.ts`). **No se fijan en producción ni en preview.** Sin ellos, `GET /api/v1/system/status` responde 503 `worker_not_configured` y `/api/dev/worker/*` no existe. `WORKER_INTERNAL_TOKEN` debe ser idéntico a `BACKEND_INTERNAL_TOKEN` del worker. |
| `DEV_API_KEY` | Con `WORKER_URL` y `API_MODE=development`, monta `/api/dev/worker/*` (proxy de desarrollo). Sin alguno de los tres, esa ruta responde 404. |
| `TURNSTILE_SECRET_KEY`, `SERVER_KEY`, `AI_GATEWAY_ID`, `GITHUB_APP_*`, … | Los añade la tarea que usa cada uno (plan 1.7). |

### Secretos que hay que **borrar** (plan 1.9, paso 9)

`ADMIN_SUPERUSER_ID`, `ADMIN_SUPERUSER_EMAIL`, `N8N_CHAT_WEBHOOK_URL`,
`N8N_CHAT_WEBHOOK_SECRET`, `FORUM_*`, `NOTIFY_SHARED_SECRET` y
`SUPABASE_SERVICE_ROLE_KEY` (sustituida por `SUPABASE_SECRET_KEY`). El esquema
ya no los conoce (`parseEnv` los descarta), así que dejarlos no rompe nada,
pero son credenciales y correos que no deben seguir en la cuenta:

```bash
pnpm exec wrangler secret list
pnpm exec wrangler secret delete ADMIN_SUPERUSER_EMAIL   # uno por uno, también con --env preview
```

### Notificaciones: outbox + cron (DATOS §8.4, Q2)

Sin Edge Function `notify`, sin `pg_net`, sin `vault`. Triggers y RPC escriben
en `private.outbox`; el único Cron Trigger (`*/5 * * * *`) ejecuta el job
`outbox.drain` (fila `* * * * *` de `private.scheduled_jobs`: vence en cada
tick), que llama a `outbox_claim(limit, worker)`, envía cada evento a Telegram
y cierra con `outbox_ack(ids, worker)` u `outbox_fail(id, worker, error)`. Al
10.º intento la propia base marca la carta muerta y encola
`system.outbox_dead`, que llega a Jose en el tick siguiente. Por tick se
reclaman como mucho 12 eventos (presupuesto de 40 subpeticiones). Los avisos
de `lead.created` y `chat.*` que la petición ya envió (marca en
`increment_quota`, clave `notice:<evento>:<payload.id>`) se confirman sin
reenviarse. Comprobación: `wrangler tail` durante un tick → sin errores de
`scheduled`; `select count(*) from private.outbox where delivered_at is null`
baja a 0.

## 3. Omen es opcional (1.8d)

Producción y preview se despliegan **sin** `WORKER_URL` ni `WORKER_INTERNAL_TOKEN`; no hay nada que rotar ni
sincronizar con `BACKEND_INTERNAL_TOKEN`. Omen sigue existiendo para Umami, Radar, newsletter y un posible chat de IA,
pero el gateway no lo necesita para arrancar. Se retiraron `WORKER_INTERNAL_TOKEN_PREV` (rotación de 24 h),
`WORKER_TIMEOUT_MS` (10 s fijos) y `N8N_LEAD_WEBHOOK_ENABLED` (el aviso de lead ya sale por el outbox), y la ruta pública
`GET /system/status`, que llamaba a Omen con el token interno sin autenticación. Si se borraron antes secretos con
esos nombres de la cuenta, `wrangler secret delete` los limpia; `parseEnv` los descarta aunque sigan ahí.

Si en el futuro se activa la integración: fijar **los dos** secretos con `wrangler secret put`, el mismo valor que
`BACKEND_INTERNAL_TOKEN` del worker, y comprobar `GET /api/v1/system/status` con sesión (200 en vez de 503).

## 4. `API_MODE=production` — cerrado (P8)

La raíz de `wrangler.jsonc` (el Worker de producción) fija `API_MODE=production`;
`test/wrangler-config.test.ts` lo comprueba. Con `development`, `onError`
devolvería `error.message` y `/api/dev/worker/*` se montaría si existen
`WORKER_URL` y `DEV_API_KEY`, así que producción nunca debe ir en ese modo.

`env.preview` conserva `API_MODE=development` (DEPLOY §1: previews contra
Supabase local o una branch; no apuntan a datos de producción). En producción
los placeholders locales de `normalizeEnvBindings` no se rellenan: si falta
`SUPABASE_URL` o una clave publishable/anon,
`parseEnv` lanza `Invalid environment` (la API responde 500 `API misconfigured`).
Por eso los secretos de la sección 2 deben estar fijados en `josecoded-api`
**antes** del próximo deploy de producción.

## 5. Deploy

```bash
cd apps/api
pnpm exec wrangler deploy
```

Esto compila y sube el Worker a la cuenta fijada por `account_id`, usando los
`vars` de `wrangler.jsonc` y los `secret` ya cargados vía
`wrangler secret put`.

### Verificación en seco (dry-run, no sube nada)

```bash
pnpm exec wrangler deploy --dry-run --outdir=dist
```

Confirma que:
- el build compila sin errores,
- los bindings (`AI_RATE_LIMITER`, `vars`) se listan correctamente,
- no hay errores de validación de entorno (`parseEnv` en `src/config/env.ts`
  solo se ejecuta en runtime, así que el dry-run valida el build/bindings,
  no el contenido de los secretos — para eso hace falta un deploy real o
  `wrangler dev` con `.dev.vars`).

## 6. Checklist antes de un deploy real a producción

- [ ] `wrangler whoami` confirma la cuenta correcta.
- [ ] `WORKER_URL` y `WORKER_INTERNAL_TOKEN` **no** están fijados (sección 3); `GET /system/status` responde 404.
- [ ] Todos los secretos obligatorios (sección 2) están fijados en `josecoded-api` y en `josecoded-api-preview` (`wrangler secret list`), y los de la lista «borrar» ya no están.
- [ ] `ADMIN_REQUIRE_MFA` **no** está fijado (o vale `true`) en ninguno de los dos.
- [ ] Smoke: `GET /api/v1/health` 200; `GET /api/v1/auth/me` sin JWT 401 y con el de Jose `is_admin: true`; ninguna ruta `forum`/`admin-chat` (responden 401 del comodín, no existen).
- [x] `API_MODE=production` en la raíz de `wrangler.jsonc` (sección 4, P8 cerrado).
- [ ] `pnpm test` y `pnpm typecheck` en verde.
- [ ] `wrangler deploy --dry-run --outdir=dist` sin errores.
