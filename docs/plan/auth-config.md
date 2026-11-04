# Auth: ajustes de Supabase que necesitan el OK de Jose

**2026-11-04 · rama `auth/otp-totp`.** Nada de esto está aplicado. Son los ajustes del proyecto `josecoded` (`echlwywbucgbhwpncviy`, base compartida hasta el disparador de 10.7) que el código de `/entrar` da por hechos. El controlador los aplica con el OK de Jose en la misma sesión, tras guardar la configuración actual para poder deshacerlos.

Los nombres de campo son los de la Management API (`GET`/`PATCH /v1/projects/echlwywbucgbhwpncviy/config/auth`); antes de aplicar hay que comparar con el `GET` real, porque alguno puede haberse renombrado.

## Antes de tocar nada

1. `GET /config/auth` y guardar el resultado como copia para revertir (sin pegarlo en el repo si contiene secretos SMTP).
2. Advisors de seguridad y rendimiento antes y después (deben quedar a cero).
3. **Resend primero.** El SMTP integrado de Supabase solo envía unos pocos correos por hora y solo a miembros del equipo: sin SMTP propio nadie recibe el código. Es el único ajuste que bloquea todo lo demás.

## Lo que el código exige (si falta, el login se rompe)

| Ajuste                          | Campo API                                     | Valor          | Por qué                                                                                                               |
| ------------------------------- | --------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Longitud del código             | `mailer_otp_length`                           | `6`            | El formulario y `verifyCodeSchema` solo aceptan `^\d{6}$`.                                                            |
| Caducidad del código            | `mailer_otp_exp`                              | `600` (10 min) | El texto de la pantalla dice «caduca en 10 minutos». El valor por defecto es 3600 s, demasiado largo para un OTP.     |
| Registros nuevos                | `disable_signup`                              | `true`         | Solo por invitación (3.4). `shouldCreateUser: false` ya lo evita; esto es el segundo cerrojo. No bloquea la Admin API. |
| TOTP: alta                      | `mfa_totp_enroll_enabled`                     | `true`         | Pantalla de alta con QR.                                                                                              |
| TOTP: verificación              | `mfa_totp_verify_enabled`                     | `true`         | Pantalla de reto y paso a `aal2`.                                                                                     |
| MFA por teléfono                | `mfa_phone_enroll_enabled` / `_verify_enabled` | `false`        | No se ofrece; menos superficie.                                                                                       |
| Proveedor Email                 | `external_email_enabled`                      | `true`         | Es el que envía el OTP.                                                                                               |
| Confirmación de correo          | `mailer_autoconfirm`                          | `false`        | Las cuentas las crea el admin por invitación; no hay registro abierto.                                                |
| Plantilla del correo del código | ver abajo                                     | texto en español con `{{ .Token }}` | El código va en el cuerpo; sin `{{ .Token }}` el usuario no recibe nada que escribir. |

## URL

| Ajuste                  | Campo API       | Valor                                                                                                                                                                              |
| ----------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site URL                | `site_url`      | `https://josecoded.com`                                                                                                                                                            |
| Lista de redirecciones  | `uri_allow_list` | `https://josecoded.com/auth/callback`, `https://josecoded-preview.josecoded-api.workers.dev/auth/callback`, `http://localhost:3000/auth/callback`                                  |

El código por correo no usa redirecciones. La lista solo importa para el inicio con Google (ruta `/auth/callback`, hoy apagada con `features.googleSignIn`) y para el correo de invitación del bloque `auth/invitation`; conviene dejar las rutas exactas, sin comodines `**`. Cuando exista el dominio de previews por PR se añade cada uno aparte.

## Plantilla del correo (Magic Link, usada por `signInWithOtp`)

Dashboard: Authentication → Emails → plantilla **Magic Link**. Para un usuario existente Supabase manda esta plantilla; no usa `{{ .ConfirmationURL }}`, solo el código.

- Asunto (`mailer_subjects_magic_link`): `Tu código de acceso a josecoded`
- Cuerpo (`mailer_templates_magic_link_content`):

```html
<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #17191c">
  <p>Hola,</p>
  <p>Este es tu código para entrar en josecoded:</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.3em; margin: 24px 0">
    {{ .Token }}
  </p>
  <p>Caduca en 10 minutos. Escríbelo en la pantalla de acceso; no hace falta pulsar ningún enlace.</p>
  <p>
    Si no lo has pedido tú, ignora este correo: sin el código nadie puede entrar en tu cuenta.
  </p>
  <p>Jose</p>
</div>
```

Lo pasa por `redactor` en el Mac antes de aplicarse (voz de Jose). Las plantillas de **Invite** y **Confirm signup** se deciden en `auth/invitation`; con los registros cerrados la segunda no se usa.

## Límites de peticiones

Auth → Rate Limits. El código ya limita por IP y por correo con `AUTH_LIMITER` (5 por minuto y clave) y Turnstile en la petición; estos son los límites de Supabase como segunda barrera.

| Límite                                  | Campo API                    | Propuesta                         | Nota                                                                                       |
| --------------------------------------- | ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| Intervalo mínimo entre correos al mismo usuario | `smtp_max_frequency`  | `60` s                            | Coincide con la cuenta atrás del botón «Reenviar» (`resendCooldownSeconds`).               |
| Correos enviados por hora               | `rate_limit_email_sent`      | `30`                              | Solo se puede subir con SMTP propio. Con una sola persona entrando, 30 sobra.              |
| OTP/magic link por hora y IP            | `rate_limit_otp`             | `30`                              | Valor por defecto; se deja.                                                                |
| Verificaciones de token en 5 min y IP   | `rate_limit_verify`          | `30`                              | Por defecto. Bajarlo a 10 si molesta el ruido; el código además limita 5 por minuto y correo. |
| Altas y accesos en 5 min y IP           | `rate_limit_sign_in_sign_ups` | `30`                             | Por defecto.                                                                               |
| Refrescos de token en 5 min y IP        | `rate_limit_token_refresh`   | `150`                             | Por defecto.                                                                               |
| Usuarios anónimos por hora y IP         | `rate_limit_anonymous_users` | `30` (y `external_anonymous_users_enabled` = `false`) | No se usan sesiones anónimas.                                    |

## SMTP con Resend

No se guarda ninguna clave en el repo.

| Campo API                 | Valor                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `smtp_host`               | `smtp.resend.com`                                                                           |
| `smtp_port`               | `465`                                                                                       |
| `smtp_user`               | `resend`                                                                                    |
| `smtp_pass`               | Clave de API de Resend con permiso solo de envío (la pega Jose en el panel; no pasa por el chat ni por el repo). |
| `smtp_admin_email`        | `acceso@josecoded.com` (buzón de envío; Resend envía desde el dominio verificado, no hace falta que exista como buzón). |
| `smtp_sender_name`        | `josecoded`                                                                                 |

Requisito previo (W35, pendiente de Jose): dominio `josecoded.com` verificado en Resend con SPF, DKIM y DMARC. Mientras el dominio devuelva 521 solo importa el DNS de correo, no la web. Activar Resend en modo real es uno de los disparadores de `josecoded-dev` (10.7): conviene tenerlo en cuenta antes de aplicar esto sobre la base compartida.

## Sesión y claves

| Ajuste                                  | Campo API                                  | Valor                                  | Nota                                                                                                       |
| --------------------------------------- | ------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Caducidad del JWT                       | `jwt_exp`                                  | `3600` (por defecto)                   | Con una hora, un cambio de rol o una desactivación tarda como mucho una hora en llegar a las políticas RLS. |
| Rotación de refresh token               | `refresh_token_rotation_enabled`           | `true` (por defecto)                   |                                                                                                            |
| Intervalo de reutilización              | `security_refresh_token_reuse_interval`    | `10` s (por defecto)                   |                                                                                                            |
| Claves de firma del JWT                 | Dashboard → Settings → JWT Signing Keys    | **Asimétrica (ES256)** si aún no lo es | `getClaims()` verifica la firma en local con las claves públicas; con una clave simétrica llama a Auth en cada petición. Funciona igual, es más lento. Migrar es reversible. |
| Clave pública para el navegador/Worker  | Dashboard → Settings → API Keys            | Crear/usar la clave `sb_publishable_…` | Va en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de `wrangler.jsonc` (ahora `placeholder`, por entorno `preview` y producción). Es pública. No usar nunca `sb_secret_` ahí: el código la rechaza. |

Las sesiones con límite de tiempo o de inactividad (`sessions_timebox`, `sessions_inactivity_timeout`) y «una sola sesión por usuario» (`sessions_single_per_user`) son de plan Pro; no se piden ahora. Si Jose quiere cerrar las sesiones del personal cada día, es una decisión aparte.

## Lo que se deja apagado a propósito

- **Protección con CAPTCHA de Supabase** (`security_captcha_enabled`): `false`. Turnstile se verifica en el servidor antes de llamar a Auth. Un token de Turnstile solo sirve una vez, así que activar también el de Supabase obligaría a pedir un segundo token (`captchaToken` en `signInWithOtp`) y a cambiar el flujo. Se decide más adelante si compensa.
- **Google** (`external_google_enabled`): `false` hasta encender `features.googleSignIn`. Entonces hacen falta el ID y el secreto de cliente de Google, y en Google Cloud la redirección autorizada `https://echlwywbucgbhwpncviy.supabase.co/auth/v1/callback`.
- **Contraseña, teléfono y enlace mágico** no se ofrecen en la interfaz. Con los registros cerrados nadie puede crear cuenta con contraseña; los usuarios los crea el admin.
- **Hooks de Auth** (`hook_*`): ninguno.

## Comprobación después de aplicar

1. Un correo del personal real recibe el código en menos de un minuto, con el asunto y el texto de arriba.
2. Un correo que no es de ninguna cuenta muestra la misma pantalla de «Revisa tu correo» y no recibe nada.
3. `/es/entrar` → código → alta del autenticador (primer acceso) → `/es/admin` abre con `aal2`.
4. `select auth.jwt() ->> 'aal'` desde una sesión `aal2` devuelve `aal2` y `/es/admin/interesados` lista los interesados (la política `leads_select` exige admin y `aal2`).
5. Advisors a cero.

## Pendiente de los bloques siguientes (no entra ahora)

- `auth/invitation`: plantilla **Invite**, RPC `accept_invitation`, alta del primer admin (hoy no existe ninguna fila en `profiles`; sin ella nadie entra en `/admin`).
- `admin/users`: restablecer el TOTP de otra persona con la Admin API (`mfa.deleteFactor`).
- Si se activa CAPTCHA en Supabase o Google, volver a revisar esta página.
