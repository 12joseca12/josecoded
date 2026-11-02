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

| Comando           | Qué hace                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`        | Servidor de desarrollo en el puerto 3000.                                                            |
| `pnpm build`      | Compilación de producción.                                                                           |
| `pnpm start`      | Sirve la compilación de producción.                                                                  |
| `pnpm lint`       | eslint: TypeScript estricto con tipos, orden de imports y cero comentarios.                          |
| `pnpm lint:css`   | stylelint sobre `src/**/*.css`: solo `var(--token)`, `px` solo en bordes, sombras y desplazamientos. |
| `pnpm lint:rules` | Prueba que las reglas fallan con los ficheros de `tests/lint/fixtures/`.                             |
| `pnpm format`     | prettier escribe el formato; `pnpm format:check` solo comprueba.                                     |
| `pnpm typecheck`  | `tsc --noEmit`.                                                                                      |
| `pnpm test`       | Vitest sobre la lógica (`src/**/*.test.ts`).                                                         |
| `pnpm e2e`        | Playwright de humo con axe bloqueante contra `next start` (requiere `pnpm build`).                   |
| `pnpm i18n:keys`  | Regenera `src/i18n/keys.generated.ts` desde `messages/es.json`.                                      |
| `pnpm i18n:check` | Falla si falta o sobra una clave entre idiomas, hay marcadores `{{DATO` o los tipos están viejos.    |

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
