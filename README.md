# josecoded

Monorepo pnpm + turbo de la plataforma josecoded (web, gateway, paquetes compartidos). Qué y por qué: nota del vault `Proyectos/josecoded.md`. Cómo: `CLAUDE.md` y `docs/working-agreements.md` (normativo).

## Requisitos

- Node 22 (`.nvmrc`; en local corre también Node 26).
- pnpm 11.2.2 (`packageManager`). **pnpm siempre, nunca `npm` ni `npx`** (`pnpm dlx` en su lugar).

## Comandos

| Comando                                                              | Qué hace                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm install`                                                       | Instala todo el workspace                                          |
| `pnpm dev`                                                           | `turbo run dev` (apps con servidor de desarrollo)                  |
| `pnpm lint`                                                          | ESLint + stylelint por paquete (`@josecoded/config`)               |
| `pnpm typecheck`                                                     | `tsc --noEmit` por paquete (`strict` + `noUncheckedIndexedAccess`) |
| `pnpm test`                                                          | Vitest por paquete                                                 |
| `pnpm build`                                                         | `turbo run build`                                                  |
| `pnpm e2e`                                                           | Playwright (llega con `apps/web`, tarea 1.5)                       |
| `pnpm tokens:build`                                                  | `design.json` → `tokens.css` (esqueleto; llega en la 1.10)         |
| `pnpm visual`                                                        | Capturas comparadas app/prototipo (esqueleto; tarea 2.13)          |
| `pnpm i18n:check`                                                    | Claves faltantes y `{{DATO}}` (esqueleto; tarea 2.1)               |
| `pnpm pricing:sync`, `pnpm pricing:sync-db`                          | Precios desde `Comercial/tarifas.md` (tarea 1.4)                   |
| `pnpm hero:media`, `pnpm hero:media:check`, `pnpm check:hero-bundle` | Medios y presupuesto del hero (fase 2)                             |
| `pnpm lhci`                                                          | Lighthouse CI (tarea 2.9)                                          |

Por paquete: `pnpm --filter <nombre> test -- <patrón>`.

## Estructura

```
apps/            web (Next 16 + OpenNext) y api (gateway), en tareas 1.5 y 1.2
packages/
  config/        eslint, stylelint, tsconfig y prettier compartidos
  design-tokens/ design.json -> tokens.css (generador en la 1.10)
  types/         @josecoded/types: barrel + un fichero por dominio
```

## CI

`.github/workflows/ci.yml` corre lint, jscpd, typecheck, test y build en cada push y PR. `preview.yml` y `deploy-production.yml` están desactivados hasta que haya credenciales de Cloudflare en CI; cuando se activen usarán `opennextjs-cloudflare upload` / `deploy`, nunca `wrangler versions upload` a secas.
