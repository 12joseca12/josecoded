# josecoded

Web personal de Jose: Next 16 (App Router), React 19 y TypeScript estricto, con pnpm. Un único paquete, sin monorepo.

## Arranque

Requiere Node 22 (`.nvmrc`) y pnpm 10.

```
pnpm install
pnpm dev
```

`http://localhost:3000` muestra «josecoded».

## Comandos

| Comando                  | Qué hace                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`               | Servidor de desarrollo en el puerto 3000.                                                            |
| `pnpm build`             | Compilación de producción.                                                                           |
| `pnpm start`             | Sirve la compilación de producción.                                                                  |
| `pnpm cf:build`          | Compila con OpenNext para Cloudflare Workers (`.open-next/`).                                        |
| `pnpm cf:preview`        | Sirve en local el Worker compilado con `wrangler dev` (entorno `preview`).                           |
| `pnpm cf:deploy:preview` | Despliega el Worker `josecoded-preview` (solo con credenciales de Cloudflare).                       |
| `pnpm lint`              | eslint: TypeScript estricto con tipos, orden de imports y cero comentarios.                          |
| `pnpm lint:css`          | stylelint sobre `src/**/*.css`: solo `var(--token)`, `px` solo en bordes, sombras y desplazamientos. |
| `pnpm lint:rules`        | Prueba que las reglas fallan con los ficheros de `tests/lint/fixtures/`.                             |
| `pnpm format`            | prettier escribe el formato; `pnpm format:check` solo comprueba.                                     |
| `pnpm typecheck`         | `tsc --noEmit`.                                                                                      |
| `pnpm test`              | Vitest sobre la lógica (`src/**/*.test.ts`).                                                         |
| `pnpm e2e`               | Playwright de humo con axe bloqueante contra `next start` (requiere `pnpm build`).                   |
| `pnpm i18n:keys`         | Regenera `src/i18n/keys.generated.ts` desde `messages/es.json`.                                      |
| `pnpm i18n:check`        | Falla si falta o sobra una clave entre idiomas, hay marcadores `{{DATO` o los tipos están viejos.    |

## Preview en Cloudflare

Cada PR sube una versión del Worker `josecoded-preview` con el alias `pr-<número>` (workflow `.github/workflows/preview.yml`: `pnpm cf:build` y `wrangler versions upload --preview-alias`). La URL, con forma `https://pr-<número>-josecoded-preview.<subdominio>.workers.dev/es`, se comenta en el PR y se mantiene al empujar más commits. No hay Worker de producción ni dominio: llegan en W46.

Si faltan los secretos, el job se omite con un aviso y no falla (también en PR de forks).

Jose debe añadir en GitHub, Settings → Secrets and variables → Actions → Repository secrets:

| Secreto                 | Valor                                                    |
| ----------------------- | -------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token con permiso Workers Scripts: Edit sobre la cuenta. |
| `CLOUDFLARE_ACCOUNT_ID` | Id de la cuenta de Cloudflare.                           |

Además, la cuenta necesita un subdominio `workers.dev` registrado, y el primer despliegue puede requerir `pnpm cf:deploy:preview` una vez para crear el Worker.

Variables públicas del entorno `preview` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`): valores de relleno en `wrangler.jsonc` y en el workflow hasta que existan los proyectos reales. `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (clave pública del widget) ya son reales.

## Formulario de contacto

`/contacto#formulario` envía por una Server Action que valida con zod, verifica Turnstile contra `siteverify`, calcula `ip_hash` (HMAC-SHA256 de la IP de `CF-Connecting-IP`, IPv6 al /64) y llama a `public.submit_lead` con la clave de servicio.

Secretos del Worker (nunca en el repo; `wrangler secret put <NOMBRE> --env preview`):

| Secreto                     | Para qué                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Llamar a `submit_lead` (solo servidor).                                                                   |
| `TURNSTILE_SECRET_KEY`      | Verificar el token de Turnstile.                                                                          |
| `FORM_IP_HASH_SECRET`       | Clave del HMAC de la IP. Cambiarla reinicia las cuotas por IP.                                            |
| `CRON_SECRET`               | Cabecera `x-cron-secret` de `/api/cron/money` (avisos de cobros vencidos). Sin ella la ruta responde 401. |

`/api/cron/money` solo crea avisos (`notifications` y su fila en `private.outbox`); no envía nada. Mientras el drenador esté apagado (`OUTBOX_DRAIN=off`, decisión 10.7) los correos quedan en cola y los avisos se ven dentro del CRM.

Si falta alguno, el formulario muestra «no disponible» con el correo de cada vía.

En local copia `.dev.vars.example` a `.dev.vars` (para `pnpm cf:preview`) o a `.env.local` (para `pnpm dev`) y rellena la clave de servicio. Las claves de prueba de Cloudflare (sitekey `1x00000000000000000000AA`, secreto `1x0000000000000000000000000000000AA`) siempre pasan, pero solo se aceptan cuando `NEXT_PUBLIC_SUPABASE_URL` apunta a `localhost` o `127.0.0.1` (Supabase local, mock de e2e): con cualquier otra URL el formulario las trata como no disponibles. Los overrides `TURNSTILE_VERIFY_URL` y `TURNSTILE_SCRIPT_URL` también solo valen en ese modo, y la URL de Supabase en producción debe tener la forma `https://<20 caracteres>.supabase.co`. Además, el servidor exige que Turnstile devuelva `action: "contact"` y un hostname permitido (`josecoded.com`, `www.josecoded.com`, el Worker de preview; `localhost` solo en modo local).

Antes de verificar Turnstile hay un límite de 10 envíos por minuto y por IP (binding `CONTACT_LIMITER` en `wrangler.jsonc`, ids de namespace `1001` y `1002`, a ajustar si chocan con otros de la cuenta). Si el binding no existe (local, CI) el límite no se aplica; si falla en ejecución, el formulario sigue abierto y quedan las cuotas de la base de datos.

Las subidas de preview por PR (`preview.yml`) solo corren con la variable de repositorio `PREVIEW_UPLOADS=true` además de los secretos de Cloudflare. Las versiones de un Worker comparten sus secretos, así que una preview por PR escribiría en la base compartida `josecoded` con la clave de servicio: no se activa hasta que exista `josecoded-dev` (decisión 10.7). El e2e no toca servicios reales: `scripts/mock/index.js` simula Supabase y Turnstile y el servidor de pruebas apunta a él con `NEXT_PUBLIC_SUPABASE_URL`, `TURNSTILE_VERIFY_URL` y `TURNSTILE_SCRIPT_URL`.

Tipos de base de datos: `pnpm db:types` regenera `src/types/database.ts` con la CLI de Supabase (`supabase gen types --project-id echlwywbucgbhwpncviy`, requiere sesión iniciada); el fichero es generado y no se edita.

Cuando haya CSP, el formulario necesita `script-src` y `frame-src` para `https://challenges.cloudflare.com`; el script se carga solo en esta página, de forma diferida, con `render=explicit`.

## Estructura

| Ruta            | Contenido                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/app/`      | Rutas del App Router: `layout.tsx` y `page.tsx`.                                                           |
| `tools/eslint/` | Regla local `no-comments`.                                                                                 |
| `tests/lint/`   | Ficheros de prueba que deben fallar o pasar el lint.                                                       |
| `docs/`         | Brief, arquitectura, decisiones y plan de bloques.                                                         |
| `archivo/`      | Material del proyecto anterior (animación de glifos, pantallas y prototipos). Solo referencia: no compila. |
| `prototipos/`   | Prototipos HTML de estilo, servibles con `python3 -m http.server`. Solo referencia.                        |
| `.claude/`      | Agentes, skills y reglas de trabajo.                                                                       |

## Acceso (`/entrar`) y zona privada

Código de 6 dígitos por correo (sin enlace mágico) y TOTP obligatorio para `admin`, `closer` y `freelance`. Solo cuentas invitadas: `shouldCreateUser: false` y un correo desconocido recibe el mismo mensaje neutro que uno válido. Todo el flujo corre en Server Actions con `@supabase/ssr` (cookies `httpOnly`, sin cliente de navegador, nunca la clave de servicio). `src/proxy.ts` solo refresca la sesión en `/entrar`, `/admin`, `/crm`, `/area`, `/freelance`, `/cuenta` e `/invitacion`; la guarda por rol y `aal2` vive en el servidor (`requireZone`) y devuelve 404 si la zona no es tuya.

| Variable                               | Para qué                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Ya existente. Misma regla: forma de proyecto o loopback.                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave `sb_publishable_…` (pública, va en `wrangler.jsonc`). Una clave `sb_secret_` se rechaza.    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | Ya existente. El login manda el token a Supabase Auth (`captchaToken`); allí va la clave secreta. |

Bindings `AUTH_LIMITER` (5 por minuto y clave) y `AUTH_EMAIL_LIMITER` (20 por minuto y clave), ids `1003` a `1006`: fuera de local, si faltan, el acceso se deniega y se registra `limiter_missing`. Los ajustes de Supabase Auth que hacen falta están en `docs/plan/auth-config.md`. El inicio con Google está detrás de `features.googleSignIn` (apagado).

## Historia

El proyecto se reinició el 2026-11-02. La rama `archivo/v1-2026-11-02` en GitHub conserva el proyecto completo anterior (web, CRM, admin, gateway, migraciones y planes).
