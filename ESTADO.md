# Estado — josecoded

## Ahora

Reinicio desde cero (decisión de Jose, 2026-11-02). Se guardan solo la animación de glifos, las decisiones de pantallas (documento y prototipos) y la configuración de agentes en `.claude/`. Todo lo anterior queda en la rama `archivo/v1-2026-11-02`.

## Siguiente paso

Jose vuelve a describir lo que quiere crear. A partir de ahí, en este orden y con su aprobación en cada paso:
1. Estilo: explorar un par de opciones que Jose tiene en mente (aunque ya había estilos).
2. Arquitectura de la página y del repositorio.
3. Pantallas, componentes por pantalla, funciones y esquema de datos.
4. Construir pantalla por pantalla.

El arquitecto convierte eso en el tablón (https://claude.ai/artifact/VQd4B9VtsaxjY5hoKcNk9D, se vacía y se rellena cuando las decisiones estén cerradas): tareas claras, concisas y que resuelvan un bloque concreto, nada desmesurado.

## Pendientes

- Ninguno abierto.

## Decisiones recientes

- **2026-11-02 — Supabase de producción limpio** (OK de Jose). Borrados esquema `private`, todas las tablas, funciones, tipos y políticas de `public`, las políticas de `storage.objects`, el trigger `on_auth_user_created`, el bucket `client-assets`, las extensiones `citext` y `unaccent` y el historial de `supabase_migrations`. No había usuarios ni ficheros. Advisors de seguridad: 0. Se mantienen los privilegios por defecto endurecidos (sin grants a `anon`/`authenticated` en objetos nuevos de `public`).
- **2026-11-02 — Ramas limpias.** Solo quedan `main`, `develop` y las de archivo (`archivo/v1-2026-11-02`, `archivo/chore-monorepo-base`, `archivo/chore-supabase`). Worktrees antiguos del Mac eliminados.
- **2026-11-02 — Reinicio.** Se vacía `main` con un commit (historial conservado), se archiva todo en `archivo/v1-2026-11-02` y se crea `develop` desde el `main` vacío.
