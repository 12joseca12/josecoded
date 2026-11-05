# supabase

Fuente única del esquema (decisión 9.1 y `docs/plan/migraciones-chat.md`). Nada de lo que hay aquí se aplica a `josecoded` sin el OK de Jose en la sesión (decisión 10.7).

## Contenido

- `migrations/`: una migración por bloque, sin `down`. `anon` no recibe ningún privilegio; todo lo público entra por rutas de servidor con la clave de servicio.
- `seed/NN_<dominio>.sql`: datos de prueba solo para el entorno local (`db reset`, en orden alfabético; un fichero por dominio); `db push` no lo ejecuta.
- `tests/`: pgTAP. `00_anon_grants.test.sql` es el test genérico de `anon`; `support/helpers.sql` (esquema `tests`) se carga con `\ir` dentro de la transacción de cada fichero y se descarta con su `rollback`, sin grants para `anon` ni `authenticated`; `NN_<nombre>.test.sql` cubre cada migración; `90_lint.test.sql` reproduce los avisos del linter de Supabase que se pueden comprobar en SQL. Cada fichero empieza con `tests.clean()`, que aborta salvo que la base tenga `app.test_db = 'on'` (lo fija `local/shim.sql`), y se puede ejecutar con o sin seed.
- `local/`: lo necesario para validar sin Docker ni Supabase.

## Comprobación local sin Docker (`pnpm db:test:local`)

Levanta un clúster PostgreSQL efímero, emula lo mínimo de Supabase (`local/shim.sql`: roles `anon`, `authenticated`, `service_role`, esquemas `auth` y `extensions`, `auth.users`, `auth.uid()`, `auth.jwt()` y los privilegios por defecto de `public`), aplica todas las migraciones desde cero y ejecuta `pg_prove` sobre `tests/`, primero sin seed y después con él. No toca ninguna base remota y borra el clúster al terminar.

Requisitos: binarios de PostgreSQL (`pg_config` en el `PATH` o `PGBIN`), la extensión pgTAP y `pg_prove`. En Debian y Ubuntu: `apt-get install postgresql postgresql-16-pgtap libtap-parser-sourcehandler-pgtap-perl`. Como root usa el usuario `postgres` del sistema. El puerto se cambia con `PGPORT_LOCAL`.

La emulación usa la versión de PostgreSQL instalada (16 en el entorno de pruebas); Supabase usa 17. Para la validación definitiva, en el Mac con Docker: `pnpm db:reset` y `supabase test db`.

## Seguridad de los tests

Los tests borran datos con `tests.clean()`. No se ejecutan nunca con `--linked`, contra una URL remota ni contra `josecoded` (`echlwywbucgbhwpncviy`); solo contra el clúster efímero de `pnpm db:test:local` o contra el Supabase local de Docker (`supabase test db` sin `--linked`), donde hay que activar `alter database postgres set app.test_db to 'on'` antes. Los ficheros usan `\ir support/helpers.sql`: con `pg_prove` y `psql` funciona, pero hay que comprobar que `supabase test db` ejecuta `psql` desde el directorio de los tests (pendiente en el Mac).

## CI

El job `db` de `.github/workflows/ci.yml` instala PostgreSQL 16 y pgTAP con apt y ejecuta `supabase/local/run-tests.sh`, igual que `pnpm db:test:local`; el job `checks` depende de él. Una validación contra la imagen real `supabase/postgres` (`supabase start`, `db reset`, `supabase test db`) queda pendiente de que Jose confirme el presupuesto de runners con Docker.

## Tipos

`pnpm db:types` regenera `src/types/database.ts` y se ejecuta después de aplicar cada migración, nunca contra un esquema sin aplicar.
