# Runbook: gate del proyecto Supabase (plan 1.9, repetible en 7.7 y 10.1)

Proyecto `echlwywbucgbhwpncviy` (`josecoded`, eu-west-1, Postgres 17). Lo ejecuta **el controlador**, nunca un
subagente, y **cada paso 3 a 11 con OK explícito de Jose en la sesión**. Nada se migra del proyecto heredado
`nrgrmymsjtgayzejtawa` (sin acceso). Diseño normativo: `docs/superpowers/design/2026-10-28-datos-v2.md` (DATOS §8.1,
§8.3, §10). Gateway: `apps/api/DEPLOY.md`.

Reglas fijas: `supabase db push` y nunca `db reset` ni `--include-seed` contra producción; `get_advisors` antes y
después; las claves se escriben en el prompt de `wrangler secret put` o en el dashboard, nunca en el repo ni en chats.

## 0. Antes de empezar

- [ ] PR de `chore/supabase` con `ci.yml` y `preview.yml` en verde (paso 1 del plan, hecho por `implementador-web`).
- [ ] Insumos de Jose: client id/secret de OAuth Google y GitHub; cuenta Resend con `josecoded.com` verificado y
      clave SMTP; Turnstile (site key y secret); `TELEGRAM_BOT_TOKEN` y `chat_id`; `supabase login` en su Mac;
      decisiones Q1 a Q6 de DATOS §12 (tomadas el 2026-10-28).
- [ ] Variables y secretos de GitHub Actions (Settings → Secrets and variables → Actions):

  | Workflow | Secretos | Variables |
  |---|---|---|
  | `ci.yml` | ninguno | ninguna (usa valores locales) |
  | `preview.yml` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_JOSECODED_API_URL` (URL de `josecoded-api-preview`), opcionales `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CAL_LINK`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
  | `deploy-production.yml` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (entorno `production` con Jose como revisor requerido) | las de `preview.yml` con valores de producción (`NEXT_PUBLIC_JOSECODED_API_URL=https://api.josecoded.com`, `NEXT_PUBLIC_SITE_URL=https://josecoded.com`) |
  | `supabase-ping.yml` | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `TELEGRAM_PING_TOKEN`, `TELEGRAM_PING_CHAT_ID` | ninguna |

## 1. Mostrar a Jose y pedir OK (paso 2)

Mostrar: `ls supabase/migrations`; los ajustes de Auth/API/Storage de los pasos 5, 6 y 8; la lista de secretos a
crear o rotar y en qué Worker (paso 9); y que **no hay nada que migrar** del proyecto viejo. Sin OK, parar aquí.

## 2. Esquema (paso 3, Mac de Jose)

> Desde la nube no hay conexión directa a Postgres: allí la migración se aplica con la Management API (`POST /v1/projects/<ref>/database/query`) en una transacción que incluye `insert into supabase_migrations.schema_migrations(version, name, statements)`, para que `supabase migration list` siga coincidiendo. Advisors: `GET /v1/projects/<ref>/advisors/{security,performance}`.

```bash
supabase link --project-ref echlwywbucgbhwpncviy
supabase db push --dry-run     # debe listar exactamente las migraciones del repo y nada más
# antes de empujar: get_advisors (MCP o dashboard → Advisors) y guardar el resultado como «antes»
supabase db push
supabase migration list        # local y remoto coinciden fila a fila
```

Nunca `db reset` ni `db push --include-seed`. Si `--dry-run` lista algo que no está en `supabase/migrations/`, parar.

## 3. Advisors y superficie (paso 4)

- [ ] `get_advisors` security y performance: **cero hallazgos** (DATOS §10.4; `unused_index` se acepta). Si hay uno:
      migración nueva en la rama, `db push`, repetir.
- [ ] `list_tables`: las 24 tablas de `public` y ninguna más; `private` no expuesto.
- [ ] `curl -s -o /dev/null -w '%{http_code}\n' -H "apikey: $PUB" "$URL/rest/v1/quota_counters"` responde 404.

## 4. API (paso 5)

- [ ] Dashboard → Settings → API: exposed schemas solo `public` (quitar `graphql_public`), max rows 200.
- [ ] `curl -H "apikey: $PUB" "$URL/rest/v1/packs"` responde `permission denied` (anon sin grants).

## 5. Auth (paso 6)

- [ ] Proveedores **Google** y **GitHub** con las credenciales de Jose; redirect del proveedor
      `https://echlwywbucgbhwpncviy.supabase.co/auth/v1/callback`.
- [ ] Email con OTP de 6 dígitos; **sin contraseña** (Q4): desactivar «Email password sign-in». «Confirm email» **on**,
      `double_confirm_changes` y `secure_password_change` on.
- [ ] SMTP propio (Resend, Q5), remitente `cuenta@josecoded.com`; enviar una prueba y comprobar que llega.
- [ ] **Plantillas** (ver «Plantillas de Auth» abajo): pegar las cinco, con asunto.
- [ ] **CAPTCHA Turnstile activado en Supabase Auth** (Authentication > Attack Protection > Enable CAPTCHA protection,
      proveedor Turnstile, secret key de Cloudflare; site key = la de la web). Es la **única capa**: la web envía el token
      como `options.captchaToken` en `signInWithOtp` y Auth lo verifica; la acción de la web ya no llama a siteverify.
      Sin esto el login queda sin CAPTCHA en producción. `supabase/config.toml` lo deja `enabled = false` solo en local.
- [ ] **Límites de Auth**: `otp_expiry = 600` (Authentication > Providers > Email > Email OTP Expiration = 600 s; el
      `config.toml` local ya lo tiene) y Rate Limits (Authentication > Rate Limits): `token_verifications` ≤ 30 por 5 min
      por IP, `sign_in_sign_ups` ≤ 30, `email_sent` según el SMTP de Resend. Además la web limita la verificación del
      código por red (IPv4 / IPv6 /64) y por cuenta con el binding Workers Rate Limiting de `apps/web/wrangler.jsonc`
      (`AUTH_IP_RATE_LIMITER` 20/min, `AUTH_SUBJECT_RATE_LIMITER` 5/min; email o `user.id` en TOTP).
- [ ] MFA TOTP habilitado (enroll y verify).
- [ ] `site_url = https://josecoded.com`; redirect allowlist de DATOS §8.1: `https://josecoded.com/**` y
      `https://josecoded-web-preview.*.workers.dev/**` (solo previews; se revisa en 9.5b). **No** añadir
      `http://127.0.0.1:3000/**` en producción.
- [ ] `jwt_expiry = 3600`, rotación de refresh token con `refresh_token_reuse_interval = 10`, inactividad de sesión 30 días.
- [ ] «Leaked password protection» on (solo aplica si algún día hay contraseñas); rate limits por defecto.

### Plantillas de Auth

Los ficheros viven en `supabase/templates/{confirmation,magic_link,otp,recovery,email_change}.{es,en}.html`. En el
dashboard hay **una plantilla por tipo**, así que se pega el bloque es y el bloque en juntos. Correspondencia con
GoTrue (no existe un tipo `otp`):

| Fichero | Plantilla del dashboard (Auth → Emails) | Asunto (es / en) |
|---|---|---|
| `magic_link.*` | Magic link (usuario existente: **el código de 6 dígitos es la vía principal**) | josecoded: tu código de acceso / josecoded: your sign-in code |
| `confirmation.*` | Confirm sign up (usuario nuevo) | josecoded: confirma tu correo / josecoded: confirm your email |
| `otp.*` | Reauthentication | josecoded: código para confirmar la acción / josecoded: code to confirm the action |
| `recovery.*` | Reset password | josecoded: recupera el acceso / josecoded: recover your access |
| `email_change.*` | Change email address | josecoded: confirma el cambio de correo / josecoded: confirm the email change |

Asunto bilingüe en el dashboard (no admite condicionales por idioma): `es / en`, por ejemplo
`josecoded: tu código de acceso / your sign-in code`. Para generar el cuerpo combinado de un tipo y copiarlo:

```bash
t=magic_link   # confirmation | magic_link | otp | recovery | email_change
{ sed -n '/<!-- body:start -->/,/<!-- body:end -->/p' supabase/templates/$t.es.html \
    | sed '1d;$d'
  printf '<hr style="border:0;border-top:1px solid #d9d6ec;margin:0;">\n'
  sed -n '/<!-- body:start -->/,/<!-- body:end -->/p' supabase/templates/$t.en.html \
    | sed '1d;$d'
} | pbcopy
```

En local (`supabase start`) el CLI solo admite un `content_path` por tipo, así que `supabase/config.toml`
(`[auth.email.template.*]`) apunta a las versiones **es**. Los textos están marcados en cada fichero para revisión
de `redactor`, que solo corre en el Mac: **pasar los cinco por `redactor` antes de pegarlos en producción**.

## 6. Jose admin con TOTP (paso 7)

- [ ] Jose entra con Google en la **web de preview** (`/auth`). El controlador copia su `auth.users.id`.
- [ ] SQL en el editor del dashboard (o `psql` con la contraseña de Jose):
      `insert into public.staff_members (user_id, role, display_name, telegram_chat_id) values (…);`
- [ ] Jose **enrola TOTP** (Q3) desde `/perfil` si ya existe o desde la API de MFA del dashboard. El enrolamiento no
      puede depender de rutas admin del gateway (exigen `aal2` siempre; DATOS §8.1).
- [ ] `GET /api/v1/auth/me` con su JWT `aal2` devuelve `is_admin: true`.

## 7. Storage (paso 8)

- [ ] El bucket `client-assets` existe (lo creó la migración) y es privado; límite 25 MiB y lista de MIME explícita
      (nunca `image/*`, DATOS §8.3).
- [ ] Con la cuenta de Jose: subir un fichero de prueba, descargarlo con URL firmada de 60 s y borrarlo.
- [ ] **El trigger sobre `storage.objects` dispara.** La migración `20261101100300` crea `client_assets_object_uploaded`
      (`after insert on storage.objects`, bucket `client-assets`), que encola `asset.uploaded`. Supabase hospeda
      `storage.objects` con otro propietario y la migración corre como `postgres`: no se ha probado fuera de la plataforma
      (la prueba local de `supabase/test/pg` usa un `storage.objects` emulado). Comprobar tras subir el fichero de prueba:
      1. `select tgname, tgenabled from pg_trigger where tgrelid = 'storage.objects'::regclass and not tgisinternal;`
         lista `client_assets_object_uploaded` con `tgenabled = 'O'` (si el `create trigger` falló en `db push`, no estará).
      2. Subir con la cuenta de un cliente de prueba (no la de Jose) y mirar `select event, payload from private.outbox
         where event = 'asset.uploaded' order by id desc limit 1;`: debe aparecer una fila con ese `file_name`.
      **Plan B si no dispara o la plataforma no deja crear el trigger:** el cliente llama a un RPC tras subir (`client_asset_register(p_path)`
      invoker sobre un `private.*_impl` definer que comprueba que el objeto existe en `storage.objects` y que la fila de
      `client_assets` es suya, y encola `asset.uploaded` una sola vez), y `storage_client_asset_uploaded()` se queda como
      segunda vía idempotente. Se abre como tarea nueva (migración aditiva, con OK de Jose). No dar por cerrado el paso 8 sin una de las dos vías.

## 8. Secretos y variables (paso 9)

Valores de Settings → API Keys (formato nuevo). `wrangler secret put` los pide por prompt; en los dos Workers del
gateway (`josecoded-api` y, con `--env preview`, `josecoded-api-preview`).

- [ ] **Web** (`josecoded-web` y su preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (variables de build, también en Actions).
- [ ] **Gateway** (prod y preview): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
      `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `CHAT_SID_SECRET` (`openssl rand -hex 32`).
- [ ] **Borrar** del gateway (prod y preview): `ADMIN_SUPERUSER_ID`, `ADMIN_SUPERUSER_EMAIL`, `N8N_CHAT_WEBHOOK_URL`,
      `N8N_CHAT_WEBHOOK_SECRET`, `FORUM_*`, `NOTIFY_SHARED_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Omen** (`josecoded-worker`): revisar su `.env` y **eliminar** cualquier `SUPABASE_*` heredada (el código no las
      usa; no se sustituyen) y reiniciar el contenedor con `implementador-infra`, servicios preexistentes intactos.
- [ ] **GitHub Actions**: secretos y variables de la tabla de la sección 0 con los valores del proyecto nuevo.
- [ ] **Edge Function:** ninguna (Q2). Las claves del proyecto viejo no se pueden revocar: se eliminan de todos los
      sitios donde estuvieran y se anota.
- [ ] `grep -rn nrgrmymsjtgayzejtawa .` vacío en el repo; `wrangler secret list` (prod y preview) y `.env` de Omen sin referencias.

### GitHub App `josecoded-bot` (tarea 1.9c, paso 5)

- [ ] Permisos de la App: `Contents: Read and write` y `Actions: Read-only` (el gateway pide exactamente esos dos al emitir el token), solo sobre este repo.
- [ ] La App está en la **lista de bypass del ruleset de `main`** (Settings, Rules, Rulesets, «Bypass list»). Sin ello `main` protegida rechaza
      el commit del bot y cada publicación acaba `failed: github update ref 422/403`.
- [ ] Probar con una publicación de D2 de un cambio mínimo: commit del bot en `main` y run de `deploy-production.yml` encontrado.

## 9. Precios (paso 10)

- [ ] `pnpm pricing:sync-db`, revisar `supabase/generated/pricing-sync.sql`, aplicarlo (`apply_migration` por MCP o `psql`).
- [ ] `select code, price from packs` coincide con `pricing.json` (P1 a P5 y `plus`).

## 10. Smoke (paso 11)

- [ ] `wrangler deploy --env preview` del gateway primero; luego producción con OK de Jose (o `deploy-production.yml`
      desde `main`, que ya hace el smoke de abajo; **nunca incluye migraciones**).
- [ ] `curl https://api.josecoded.com/api/v1/health` responde 200; `auth/me` sin JWT 401 y con el JWT de Jose `is_admin: true`;
      `forum/*` y `admin-chat/*` no existen (401 del comodín o 404).
- [ ] `wrangler tail` durante un tick del cron: `outbox.drain` sin errores y
      `select count(*) from private.outbox where delivered_at is null` baja a 0.
- [ ] Lanzar `supabase-ping.yml` a mano (`workflow_dispatch`) y comprobar que pasa; forzar un fallo (secreto
      equivocado en una ejecución de prueba) y comprobar que llega el aviso a Telegram.
- [ ] `get_advisors` de nuevo: cero hallazgos.

## 11. Cierre (paso 12)

- [ ] `ESTADO.md`, «Decisiones recientes»: fecha, migraciones aplicadas, advisors, secretos rotados, Q1 a Q6 como quedaron.
- [ ] ADR de codebase-memory cuando se indexe el repo (`manage_adr get` y copia antes de `index_repository`).

**Hecho cuando:** CI verde en el PR; `supabase migration list` igual al repo; advisors a cero; Jose entra en la preview
como admin con TOTP; web, gateway (prod y preview) y Omen sin referencias al proyecto viejo; este runbook escrito.
