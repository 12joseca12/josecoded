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

Variables públicas del entorno `preview` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`): valores de relleno en `wrangler.jsonc` y en el workflow hasta que existan los proyectos reales.

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

## Historia

El proyecto se reinició el 2026-11-02. La rama `archivo/v1-2026-11-02` en GitHub conserva el proyecto completo anterior (web, CRM, admin, gateway, migraciones y planes).
