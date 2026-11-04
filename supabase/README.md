# supabase

Fuente única del esquema (decisión 9.1 y `docs/plan/migraciones-chat.md`). Nada de lo que hay aquí se aplica a `josecoded` sin el OK de Jose en la sesión (decisión 10.7).

## Contenido

- `migrations/`: una migración por bloque, sin `down`. `anon` no recibe ningún privilegio; todo lo público entra por rutas de servidor con la clave de servicio.
- `seed.sql`: datos de prueba solo para el entorno local (`db reset`); `db push` no lo ejecuta.
- `tests/`: pgTAP. `00_helpers.sql` crea el esquema `tests` y contiene el test genérico de `anon`; `NN_<nombre>.test.sql` cubre cada migración; `90_lint.test.sql` reproduce los avisos del linter de Supabase que se pueden comprobar en SQL. Cada fichero empieza con `tests.clean()` y se puede ejecutar con o sin seed.
- `local/`: lo necesario para validar sin Docker ni Supabase.

## Comprobación local sin Docker (`pnpm db:test:local`)

Levanta un clúster PostgreSQL efímero, emula lo mínimo de Supabase (`local/shim.sql`: roles `anon`, `authenticated`, `service_role`, esquemas `auth` y `extensions`, `auth.users`, `auth.uid()`, `auth.jwt()` y los privilegios por defecto de `public`), aplica todas las migraciones desde cero y ejecuta `pg_prove` sobre `tests/`, primero sin seed y después con él. No toca ninguna base remota y borra el clúster al terminar.

Requisitos: binarios de PostgreSQL (`pg_config` en el `PATH` o `PGBIN`), la extensión pgTAP y `pg_prove`. En Debian y Ubuntu: `apt-get install postgresql postgresql-16-pgtap libtap-parser-sourcehandler-pgtap-perl`. Como root usa el usuario `postgres` del sistema. El puerto se cambia con `PGPORT_LOCAL`.

La emulación usa la versión de PostgreSQL instalada (16 en el entorno de pruebas); Supabase usa 17. Para la validación definitiva, en el Mac con Docker: `pnpm db:reset` y `supabase test db`.

## Propuesta de CI

Un job `db` con `supabase start`, `supabase db reset` y `supabase test db` valida contra la imagen real `supabase/postgres` y no necesita la emulación. Queda sin cablear hasta que Jose confirme que los runners de GitHub con Docker entran en el presupuesto de CI.

## Tipos

`pnpm db:types` regenera `src/types/database.ts` y se ejecuta después de aplicar cada migración, nunca contra un esquema sin aplicar.
