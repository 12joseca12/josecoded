# Estado — josecoded

## Ahora

Arquitectura cerrada (2026-11-02, `docs/arquitectura/decisiones.md`) con tres confirmaciones pendientes de Jose: reparto IA local/Groq (4.5), versión segura de «operar por mí» en Radar (8.3) y creación del proyecto `josecoded-dev` en Supabase (10.7). Hay propuesta de pantallas (`docs/arquitectura/pantallas.md`) y de datos (`docs/arquitectura/datos.md`) con sus preguntas marcadas.

## Siguiente paso

1. Jose revisa `pantallas.md` y `datos.md` y responde a las preguntas marcadas (resumen al final de cada documento).
2. Con eso cerrado: `ux` → `usuario-ejemplo` → `ui` prototipan la home en `prototipos/` (estilo B, hero animado, navegación, scroll); Jose decide en el navegador.
3. `arquitecto` escribe el plan del primer bloque (`infra/scaffold`: Next + OpenNext + lint sin comentarios + tokens + CI + preview) y rellena el tablón en el orden de 10.6.

## Pendientes

- **Jose:** crear el repo `josecoded-omen` y el proyecto Supabase `josecoded-dev`; proteger `main` en los dos repos; borrar `develop` y las ramas `chore/*`, `design/*`, `docs/*`, `claude/*` del remoto (se quedan las `archivo/*`); el dominio `josecoded.com` responde 521 (origen caído) hasta el primer despliegue.
- Confirmar 4.5, 8.3 y 10.7.
- `prototipos/estilo-b/` está sin versionar: se commitea cuando Jose lo dé por bueno.
- **Sincronizar desde el Mac:** nota del vault `Proyectos/josecoded.md` (reinicio, estilo B, dos repos, decisiones abiertas) y ADR en codebase-memory cuando haya código.

## Decisiones recientes

- **2026-11-02 — Arquitectura cerrada.** Dos repos (`josecoded` web + `josecoded-omen` backend), contrato por `database.ts` y `contracts/`, sin gateway, Omen solo sale, roles en `profiles.role`, OTP + TOTP, ramas `<area>/<tema>`, tablón en GitHub Issues, orden público → auth/admin → CRM → área → freelance → Radar → lab. Detalle y abiertas en `docs/arquitectura/decisiones.md`.
- **2026-11-02 — Estilo: opción B** (acero, carbón y coral). Pendiente: hero animado, navegación, scroll y barra lateral (ver `docs/brief.md`).
- **2026-11-02 — Supabase de producción limpio** (OK de Jose). Borrados esquema `private`, todas las tablas, funciones, tipos y políticas de `public`, las políticas de `storage.objects`, el trigger `on_auth_user_created`, el bucket `client-assets`, las extensiones `citext` y `unaccent` y el historial de `supabase_migrations`. No había usuarios ni ficheros. Advisors de seguridad: 0. Se mantienen los privilegios por defecto endurecidos (sin grants a `anon`/`authenticated` en objetos nuevos de `public`).
- **2026-11-02 — Ramas limpias.** Solo quedan `main`, `develop` y las de archivo (`archivo/v1-2026-11-02`, `archivo/chore-monorepo-base`, `archivo/chore-supabase`). Worktrees antiguos del Mac eliminados.
- **2026-11-02 — Reinicio.** Se vacía `main` con un commit (historial conservado), se archiva todo en `archivo/v1-2026-11-02` y se crea `develop` desde el `main` vacío.
