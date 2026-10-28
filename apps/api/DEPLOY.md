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

Estas viven en el repo porque no son sensibles (URLs públicas, CORS). **Ningún
correo ni identificador personal** va en `vars` (lo comprueba
`test/wrangler-config.test.ts`); el admin ya no se configura aquí: es una fila
de `public.staff_members` (gate 1.9).

| Var | Valor actual | Notas |
|---|---|---|
| `API_MODE` | `production` (raíz) · `development` (`env.preview`) | Ver sección 4. |
| `WORKER_URL` | `https://worker.josecoded.com` | URL pública del Cloudflare Tunnel hacia el Fastify worker en Omen. |
| `CORS_ORIGINS` | `https://josecoded.com,https://www.josecoded.com,https://*-josecoded-web.jose.workers.dev,http://localhost:3000` | Lista separada por comas; el comodín de previews lleva guion, nunca punto. |

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
| `WORKER_INTERNAL_TOKEN` | Token compartido con el Fastify worker (Omen). | `z.string().min(10)`, obligatorio |
| `SUPABASE_URL` | `https://echlwywbucgbhwpncviy.supabase.co` (no es credencial; se fija como secreto por entorno). | `z.string().url()`, obligatorio |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…`: `apikey` de `/auth/v1/user` al verificar la sesión. (`SUPABASE_ANON_KEY` solo como alternativa heredada.) | una de las dos (`.refine()`) |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` (salta RLS). Solo la usa `src/adapters/supabase.ts`: RPC del outbox, `scheduled_jobs_*`, `increment_quota` y la lectura de `staff_members` (`is_admin`). Sin ella el cron no ejecuta nada y `auth/me` responde 502. | `min(20)`, opcional en el esquema, **necesaria** en producción y preview |
| `TELEGRAM_BOT_TOKEN` | Bot que avisa a Jose de los eventos del outbox (`outbox.drain`). | `min(10)`, opcional en el esquema; sin él (o sin el chat) el drenaje **no reclama** eventos |
| `TELEGRAM_ADMIN_CHAT_ID` | `chat_id` de Jose con el bot (numérico, negativo en grupos). | `^-?\d+$` |
| `CHAT_SID_SECRET` | Firma de `chat_sid` del chat por casos (4.4). `openssl rand -hex 32`. | `min(32)`, opcional hasta 4.4 |

```bash
pnpm exec wrangler secret put WORKER_INTERNAL_TOKEN
pnpm exec wrangler secret put SUPABASE_URL
pnpm exec wrangler secret put SUPABASE_PUBLISHABLE_KEY
pnpm exec wrangler secret put SUPABASE_SECRET_KEY
pnpm exec wrangler secret put TELEGRAM_BOT_TOKEN
pnpm exec wrangler secret put TELEGRAM_ADMIN_CHAT_ID
pnpm exec wrangler secret put CHAT_SID_SECRET
# y lo mismo con --env preview para josecoded-api-preview
```

### Opcionales

| Secreto/var | Cuándo |
|---|---|
| `RESEND_API_KEY` | Canal email (Resend, DATOS Q5). Ningún evento del lanzamiento se envía por email todavía. |
| `ADMIN_REQUIRE_MFA` | Solo `false` desactiva la exigencia de `aal2` (TOTP) en `requireAdmin`; **nunca** en producción ni preview (DATOS Q3). Pensado para `wrangler dev` contra Supabase local, cuyas cuentas del seed no tienen TOTP. |
| `DEV_API_KEY` | Proteger `/api/dev/*` (solo existe con `API_MODE=development`). |
| `WORKER_TIMEOUT_MS` | Override del timeout hacia el worker. |
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

## 3. Rotación de `WORKER_INTERNAL_TOKEN` (acción pendiente, post-migración ngrok → Tunnel)

Con la migración del túnel (Task 3, `WORKER_URL` ahora apunta a
`https://worker.josecoded.com` en vez de una URL ngrok efímera), corresponde
**rotar** `WORKER_INTERNAL_TOKEN` como buena práctica — el valor anterior
pudo haber quedado expuesto en configuraciones de ngrok o pegado en chats
durante el desarrollo.

Pasos (coordinar ambos lados en la misma ventana, si no quedan desincronizados
y el gateway recibirá 401 del worker):

1. Generar un token nuevo (ej. `openssl rand -hex 32`).
2. En el Fastify worker (Omen), actualizar `BACKEND_INTERNAL_TOKEN` en su
   `.env` con el nuevo valor y reiniciar el proceso.
3. En Cloudflare, fijar el mismo valor:
   ```bash
   pnpm exec wrangler secret put WORKER_INTERNAL_TOKEN
   ```
4. Verificar con una llamada real al gateway que dependa del worker (p. ej.
   `/ai/chat` o el healthcheck) que no devuelve 401.

**Invariante:** `WORKER_INTERNAL_TOKEN` (gateway, Cloudflare secret) y
`BACKEND_INTERNAL_TOKEN` (worker Fastify, Omen `.env`) deben ser
**exactamente el mismo string** en todo momento. Este cierre formal de
credenciales pegadas en chat durante el desarrollo se completa en P3
(seguridad); aquí solo se deja documentado y se rota el token como primer
paso.

## 4. `API_MODE=production` — cerrado (P8)

La raíz de `wrangler.jsonc` (el Worker de producción) fija `API_MODE=production`;
`test/wrangler-config.test.ts` lo comprueba. Con `development`, `onError`
devolvería `error.message` y `/api/dev/worker/*` se montaría si existe
`DEV_API_KEY`, así que producción nunca debe ir en ese modo.

`env.preview` conserva `API_MODE=development` (DEPLOY §1: previews contra
Supabase local o una branch; no apuntan a datos de producción). En producción
los placeholders locales de `normalizeEnvBindings` no se rellenan: si falta
`WORKER_INTERNAL_TOKEN`, `SUPABASE_URL` o una clave publishable/anon,
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
- [ ] `WORKER_INTERNAL_TOKEN` rotado y sincronizado con `BACKEND_INTERNAL_TOKEN` en Omen (sección 3).
- [ ] Todos los secretos obligatorios (sección 2) están fijados en `josecoded-api` y en `josecoded-api-preview` (`wrangler secret list`), y los de la lista «borrar» ya no están.
- [ ] `ADMIN_REQUIRE_MFA` **no** está fijado (o vale `true`) en ninguno de los dos.
- [ ] Smoke: `GET /api/v1/health` 200; `GET /api/v1/auth/me` sin JWT 401 y con el de Jose `is_admin: true`; ninguna ruta `forum`/`admin-chat` (responden 401 del comodín, no existen).
- [x] `API_MODE=production` en la raíz de `wrangler.jsonc` (sección 4, P8 cerrado).
- [ ] `pnpm test` y `pnpm typecheck` en verde.
- [ ] `wrangler deploy --dry-run --outdir=dist` sin errores.
