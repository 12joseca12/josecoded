# josecoded — convenciones de trabajo

> **Versión 1.2 (2026-09-30, tarde: batería de stack y metodologías de producción, 12 respuestas de Jose, todas la opción recomendada salvo las reglas TypeScript extra de lint, que no marcó).** Añade §14 Tipos, §15 Componentes con variantes, §16 Accesibilidad por componente, §17 Servicios, estado y formularios; amplía la lista blanca de §11 y las reglas duras 11–13 de §13. Impacto en el plan: v2.2 (changelog al inicio del plan).
> Versión 1.1 (2026-09-30: §4, §5 y §9 ajustados con las decisiones de Jose sobre `/plan-eng-review`; tolerancia 2 % y auto-merge de la newsletter). Versión 1.0, 2026-09-29. Decidido por Jose en la batería de preguntas del 2026-09-29 (12 respuestas, anotadas en `ESTADO.md`). Este documento es normativo: si una tarea del plan lo contradice, manda este documento y la tarea se corrige. Es el «cómo se trabaja»; el «qué» está en la spec y en la nota del vault.

## 0. Lo que ya estaba decidido (solo enlaces)

No se repite aquí. Se aplica tal cual:

- **Pipeline de agentes, gates de producción y skills obligatorias**: `~/.claude/CLAUDE.md` (global) y `CLAUDE.md` de este repo.
- **Stack y arquitectura**: spec `docs/superpowers/specs/2026-09-13-josecoded-plataforma.md` §5–§7 (Next 16 App Router en Cloudflare Workers vía OpenNext, sin middleware Node; monorepo pnpm + turbo con `apps/web`, `apps/api`, `packages/*`; gateway, worker de Omen y Supabase intocables salvo cambios aditivos).
- **Árbol del monorepo, i18n sin middleware, MDX, CI**: diseño técnico `docs/superpowers/design/2026-09-17-josecoded-diseno-tecnico.md` §1.1, §1.4, §1.5, §1.8.
- **Estrategia de tests y qué no se testea**: diseño técnico §8.
- **Restricciones globales de ejecución, Conventional Commits, ramas por feature, comandos raíz**: plan `docs/superpowers/plans/2026-09-19-josecoded-v1.md`, apartados «Restricciones globales», «Cómo se ejecuta este plan» y «Ramas sugeridas».
- **Producto, personas, presupuestos de rendimiento y rechazos visuales**: `PRODUCT.md`.
- **Sistema visual**: `DESIGN.md` y `.impeccable/design.json` (pendiente de volcar la v6; hasta entonces el prototipo manda, §4).
- **Precios**: solo desde `packages/pricing/pricing.json`, generado de `Comercial/tarifas.md`.

## 1. Estilos: CSS Modules que consumen solo tokens

**Decisión.** Cada componente lleva su `Component.module.css`. Los componentes consumen únicamente custom properties del fichero de tokens. **No hay shadcn ni Tailwind.** Las primitivas accesibles (diálogo, menú, hoja) se hacen con elementos nativos (`<dialog>`, `popover`) o, si hace falta, con Radix Primitives sin estilos, justificado según §11.

**Reglas.**

- En un `.module.css` está prohibido escribir literales de color, espacio, radio, tipografía, sombra, desenfoque o easing. Se escribe `var(--token)`. Los únicos literales permitidos son los de §8 (px en hairlines, trazos, sombras, desenfoques y offsets de motion) y los valores estructurales sin token (`0`, `auto`, `100%`, `1fr`, `minmax`, `span`).
- Un valor que el prototipo tiene en dos sitios con el mismo número es un token que falta: se añade a `design.json`, no se duplica.
- Selectores planos, sin anidamiento de más de un nivel; sin `!important`; sin `border` para contornos (regla «Inset Hairline» de `DESIGN.md`).
- Container queries (`@container`) para el layout interno de bento y celdas, como en la v6; media queries solo para lo que depende del viewport (cabecera, escena) y con breakpoints en `rem` (§8).
- `globals.css` solo contiene: importación del fichero de tokens generado, reset, fuentes (`next/font` autoalojado), reglas de `prefers-reduced-motion`, `:focus-visible`, `::selection`, `.sr-only` y `.skip`.

**Vigilancia.** `stylelint` en `pnpm lint` con una regla que prohíbe literales fuera de `apps/web/styles/tokens.css`:

- `declaration-property-value-disallowed-list` para `color`, `background*`, `border*-color`, `fill`, `stroke`, `box-shadow`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `border-radius`, `gap`, `padding*`, `margin*`, `transition*`, `animation*`: todo valor que contenga `#`, `rgb(`, `hsl(`, `oklch(`, un número seguido de `rem|em|ch|vw|vh|svh|vmin|vmax|ms|s` o un nombre de fuente, salvo que venga dentro de `var(` o `calc(` con solo tokens.
- `unit-disallowed-list: ["px"]` con las excepciones de §8 declaradas por propiedad (`box-shadow`, `filter`, `backdrop-filter`, `outline*`, `border-width`, `stroke-width`, `translate`, `transform`, `inset`/`top`/`left` dentro de keyframes).
- La configuración vive en `packages/config/stylelint.config.mjs` y la exporta `@josecoded/config`. El lint falla la CI.

**Estructura de componente.**

```
apps/web/components/<área>/<name>/
  <name>.tsx            # Server Component por defecto; 'use client' solo si hay interacción
  <name>.module.css     # solo var(--token)
  <name>.test.tsx       # solo si el componente tiene comportamiento (§7)
  index.ts              # export nombrado
```

Nombres de fichero en kebab-case, componentes en PascalCase, identificadores en inglés. Áreas: `layout`, `home`, `hero`, `scenes`, `ui` (primitivas propias), `forms`, `admin`, `radar`.

## 2. Tokens: `.impeccable/design.json` genera el CSS

**Decisión.** `.impeccable/design.json` es la única fuente de tokens. Un script genera `apps/web/styles/tokens.css` y un test de deriva impide editarlo a mano.

**Mecánica.**

- `pnpm tokens:build` → `packages/design-tokens/scripts/build.ts` lee `design.json` y escribe `apps/web/styles/tokens.css` (`:root { --bg: …; --text: …; }`) con cabecera «GENERATED, do not edit». Nombres de token = claves de `design.json` en kebab-case, sin prefijo de librería.
- Test de deriva `packages/design-tokens/test/drift.test.ts`: regenera en memoria y compara con el fichero commiteado; falla si difieren. Corre en `pnpm test` y en CI.
- Cambiar un token = editar `design.json`, ejecutar `pnpm tokens:build`, commitear ambos ficheros en el mismo commit.
- `DESIGN.md` se mantiene con el documentador de impeccable a partir del build; no se edita a mano el frontmatter de tokens.

**Guía de uso de tokens (qué token para qué).** Vive en `DESIGN.md`, en sus apartados «Colors» (reglas Indigo Floor, Lavender Text, Violet Action, Green Means Live), «Typography», «Elevation & Depth» (vocabulario de sombras) y «Shapes». Este documento no la duplica; la amplía con dos reglas de trabajo:

- Si un componente necesita un color, tamaño o sombra que no aparece en `DESIGN.md`, primero se pregunta si de verdad es nuevo. Si lo es, se añade a `design.json` con nombre semántico (`--card-line`, no `--violet-18`) y se documenta en `DESIGN.md` en el mismo commit.
- Los tokens de la v6 que `DESIGN.md` aún no recoge (`--card`, `--card-line`, `--pad-scene`, `--pad-top`, `--gap-bento`, `--pad-cell`, `--title`, `--ease-out`) se incorporan a `design.json` en la tarea de tokens de la fase 2 antes de portar ninguna escena.

## 3. Motion: CSS nativo primero, JS propio mínimo en TypeScript

**Decisión.** El movimiento se hace como en la v6: `scroll-snap`, transiciones por elemento ligadas al scroll (`animation-timeline`), View Transitions para ampliar celdas, `transition` con `var(--ease-out)`. Lo que CSS no puede hacer (paginado por gesto, paleta ⌘K, celda ampliada, luz bajo el cursor) se escribe en **TypeScript propio**, portado de `base.js` y `v6.js` del prototipo, sin librerías.

**Reglas.**

- GSAP solo entra para una pieza concreta que CSS y el JS propio no resuelvan, con justificación en la tarea (qué no se puede hacer, cuánto pesa gz) y aprobación del `revisor` (§11). La tarea 2.x de la spec que decía «GSAP + ScrollTrigger» queda superada (§12).
- El JS de motion vive en `apps/web/lib/motion/` como módulos puros con tests (§7): `paging.ts` (paradas, `glide`, interrupción), `palette.ts`, `expand-cell.ts`, `cursor-light.ts`. Los componentes los invocan desde `useEffect` en un Client Component pequeño; nunca se mezclan cálculo y DOM en el mismo módulo.
- Todo movimiento respeta `prefers-reduced-motion` como dice `PRODUCT.md`: fundidos, sin intro, sin morph, poster estático. El JS lee `matchMedia` una vez y expone `reduce` como en `base.js`.
- Duraciones, easings y distancias son tokens (`--ease-out`, `--dur-hover: 150ms`, `--dur-canvas-in: 1.2s`, etc.), también en TypeScript: se leen con `readToken()` de `apps/web/styles/tokens.ts` (generado), no se repiten como números en el código.
- Solo `transform` y `opacity` se animan en continuo; nada que provoque layout en cada frame.

## 4. Fidelidad al prototipo: estructura y valores 1:1

**Decisión.** La referencia es `docs/superpowers/design/ref/home-v6/` (`index.html`, `base.css`, `v6.css`, `base.js`, `v6.js`). El implementador porta la estructura del DOM, las clases y los valores tal cual; los valores pasan a tokens (§2) y React solo compone. **v1.1:** solo tienen prototipo en `ref/` la home (hecha), **Negocios** y **Contacto**; el resto de pantallas se construye directamente con `DESIGN.md`, el documento de pantallas y la aprobación de Jose en la preview (§5).

**Reglas.**

- No se «mejora» ni se reinterpreta el prototipo. Si al portar algo no encaja (un literal sin token, un px fuera de §8, un patrón que rompe accesibilidad), se corrige de la forma mínima y se **marca el desvío en el mensaje del commit** con el prefijo `deviation:` y una línea por desvío.
- Los desvíos los decide Jose en el navegador (§5), nunca por descripción. Hasta que los decide, se mantiene la versión del prototipo si es viable.
- Cuando `DESIGN.md` y el prototipo v6 discrepen (hoy `DESIGN.md` documenta la v4), manda el prototipo. Esto cambia cuando ESTADO.md marque hecha la tarea «Volcar la v6 a DESIGN.md».
- Las escenas se portan una a una y en el orden del prototipo: hero, Sobre mí, Empresas, Negocios, Proyectos, Blog, cierre. No se abre la siguiente sin cerrar la validación (§5) de la anterior.
- Antes de portar una escena, el implementador sirve el prototipo (`python3 -m http.server 8765 --directory docs/superpowers/design/ref`) y lo abre; lee el DOM real, no la memoria de otra sesión.

## 5. Validación visual: capturas comparadas y aprobación en preview

**Decisión.** La **home** se valida con capturas automáticas de la app y del prototipo a **360, 900 y 1440 px**, comparadas por diff con tolerancia del 2 %; las **páginas interiores** (con prototipo —Negocios, Contacto— o sin él) se validan con la aprobación de Jose en la preview y con capturas de referencia propias (`toHaveScreenshot` contra la primera versión aprobada). En todos los casos `ui` revisa y **Jose aprueba en la URL de preview antes del merge** de la rama.

**Mecánica.**

- `pnpm --filter web visual` → Playwright captura, por escena, `wrangler dev` de la app y el prototipo servido, en los tres anchos y con alto fijo (`812`, `1100`, `900` respectivamente), `prefers-reduced-motion: reduce` para que la comparación sea determinista, y guarda el diff en `apps/web/e2e/visual/__diff__/` (ignorado por git). **Tolerancia fijada por Jose el 2026-09-30: `maxDiffPixelRatio: 0.02` (2 % por escena y ancho)**; se ajusta solo con OK de Jose y la tarea 2.13 del plan la codifica.
- Cada objetivo de `targets.ts` lleva `mask` (selectores) para los bloques con `{{DATO}}` y para los **desvíos aceptados**, que se registran en `apps/web/e2e/visual/deviations.json` con el commit `deviation:` y la fecha del OK de Jose. Las fuentes del prototipo se sirven en local (sin CDN). El job `visual` de CI corre solo en PR que tocan interfaz (`components`, `styles`, `app`, `messages`).
- Cada tarea con UI termina adjuntando al PR las tres capturas de la app y el porcentaje de diff por escena. Un diff por encima de la tolerancia no bloquea el commit, pero sí la puerta de la rama.
- En `/puerta-calidad`, `ui` (modo revisión con `/impeccable audit` y `/impeccable critique`) revisa el diff y emite «fiel», «desvío aceptable» o «no pasa». Después Jose abre la preview del PR (`preview.yml`) y aprueba en el navegador. Sin ese OK no hay merge.
- El estado por defecto de un desvío es «pendiente de Jose», no «aceptado por el agente».

## 6. Navegadores: Baseline 2024 con degradación por `@supports`

**Decisión.** Se dan por soportados los rasgos de Baseline 2024: container queries, `svh`/`dvh`, `:has()`, `inset`, `clamp()`, `scroll-snap`, `aspect-ratio`, `<dialog>`, CSS nesting no se usa (§1). Lo posterior se usa con `@supports` y la web funciona sin ello.

**Fallbacks obligatorios** (los comprueba `qa` en Safari de escritorio e iOS en la puerta de calidad):

| Rasgo | Con soporte | Sin soporte |
|---|---|---|
| `animation-timeline: view()` / `scroll()` | Entradas y salidas por elemento y carrusel de Proyectos ligados al scroll | Los elementos están en su estado final desde el principio; las tarjetas de Proyectos se apilan en columna, como en el prototipo (también en pantallas más altas que anchas y con reduced motion) |
| View Transitions (`document.startViewTransition`) | La celda grande se amplía con morph | La celda se amplía sin transición (cambio de estado inmediato); Esc sigue cerrando |
| `scroll-snap-type: y proximity` + paginado JS | Un gesto = una escena | Scroll nativo; el indicador de sección sigue funcionando por `IntersectionObserver` |
| `backdrop-filter` | Cabecera y paleta translúcidas | Fondo opaco con el mismo token (`--bg` al 100 %) |
| `popover` / `<dialog>` nativo | Paleta ⌘K y menú móvil | No hay fallback: son Baseline 2024 |
| `text-wrap: balance` | Titulares equilibrados | Sin equilibrado; sin efecto en layout |

Reglas: cada `@supports` lleva un comentario con el rasgo y el fallback; no se usa `@supports not` para «arreglar» un navegador concreto; nunca se detecta el navegador por user agent.

## 7. Tests: TDD solo en lo que tiene comportamiento

**Decisión.** Un componente sin lógica (celda, escena estática, indicador, tarjeta) **no lleva unit test**. Lo cubren el E2E de la escena, las capturas comparadas (§5) y la revisión de accesibilidad de la puerta. El TDD por tarea del plan aplica a lo que tiene comportamiento.

**Tiene comportamiento y lleva test de Vitest** (test que falla → implementación → verde): módulos de `lib/motion/` (§3), paleta ⌘K (filtrado, navegación por teclado), gate de la escena, `IntroFall`, formularios, generador, `RefCapture`, guards, `pageMetadata`, esquemas de contenido, script de tokens (§2), script de `{{DATO}}` (§10), reglas de precio y todo lo listado en el diseño técnico §8.1.

**No lleva unit test**: componentes de presentación sin estado, layouts, `globals.css`, `tokens.css` (lo cubre el test de deriva), iconos.

**E2E (Playwright, diseño técnico §8.2)**: una prueba por escena de la home que comprueba texto real accesible, `h1` único, navegación por teclado, sin errores de consola, y los modos reduced-motion y móvil.

Un test que solo comprueba clases CSS o valores de estilo se rechaza en revisión: eso lo mide la captura.

## 8. Unidades: relativas para todo lo que escala con el texto

**Decisión.** `rem`, `em`, `ch`, `%`, `vw`, `svh`, `vmin`, `clamp()` para todo lo que escala con el texto o el viewport, **incluidos los breakpoints de media y container queries, en `rem`** (`(min-width: 34rem)`, no `544px`).

**Excepciones escritas** (único uso permitido de `px`):

- Hairlines y filetes: `1px`, `2px` en `box-shadow: inset`, `outline`, `border-width` de trazos, `stroke-width`.
- Sombras de caída: offsets, desenfoque y extensión (`0 30px 60px -30px`).
- Desenfoques: `filter: blur()`, `backdrop-filter: blur()`.
- Offsets de motion: distancias de `translate`/`transform` en transiciones y keyframes (`translateY(12px)`), y el umbral de scroll de la cabecera (`80px`, en JS).
- El pseudo-valor `999px` de las píldoras se sustituye por el token `--r-pill` (`9999rem`); no es excepción.

Lo que el prototipo tenga en px fuera de esta lista (por ejemplo `24px` de padding o `40px` de alto) se convierte a `rem` al portar y se anota como desvío (§4) solo si cambia la apariencia a 16 px de base; si no la cambia, no es desvío.

## 9. Integración: PR por rama, squash, `main` protegida

**Decisión.** Una PR por rama de feature (las de «Ramas sugeridas» del plan). Merge por **squash** con título Conventional Commits (`feat(web): home scenes with paging`). Dentro de la rama, commits pequeños por tarea (ya decidido en el plan).

**Requisitos para mergear**: CI en verde (`lint`, `typecheck`, `test`, `build`, E2E, Lighthouse), capturas y diff adjuntos (§5), `revisor` sobre la rama completa, `/puerta-calidad` con los cinco revisores en verde, y OK de Jose en la preview.

**Paso manual de Jose (no lo hace ningún agente):** proteger `main` en GitHub → Settings → Branches → «Add rule» para `main`: *Require a pull request before merging*, *Require status checks to pass* (seleccionar el job `ci`), *Require branches to be up to date*, *Do not allow bypassing*, y desactivar *Allow force pushes* y *Allow deletions*. Hasta que esté hecho, los agentes no hacen `push` a `main` en ningún caso.

**Excepción única (decisión de Jose, 2026-09-30): auto-merge del bot de la newsletter en ramas `newsletter/*`.** El bot es una **GitHub App propia `josecoded-bot`** (no un PAT) con `contents:write` y `pull_requests:write` solo en este repo. La regla de `main` se completa así: *Require a pull request before merging* sigue activo para todo, pero **sin exigir revisión humana** (0 aprobaciones requeridas) para que el auto-merge por squash funcione cuando el job `ci` y el check **`newsletter-content-only`** están en verde; *Do not allow bypassing* se mantiene (el bot no salta nada: pasa por PR y checks). El check corre en **todos** los PR con la lógica en el YAML: si el autor es `josecoded-bot[bot]`, la rama debe empezar por `newsletter/` y el diff solo puede contener `apps/web/content/blog/{es,en}/*.md`; si el autor es humano, la rama **nunca** puede empezar por `newsletter/`. Si el plan de GitHub (Free con repo privado) no permite la regla por rama, **la fusión la hace el gateway por API** tras comprobar el diff y los checks (spec de newsletter v1.2). El despliegue de contenido lo hace `deploy-content.yml` (push a `main` con cambios en `content/blog/**`), que aborta y avisa si `main` lleva código sin desplegar respecto a la etiqueta `last-deployed`. El clic de Jose en «Aprobar y lanzar» del admin es la revisión y el OK de despliegue de contenido (spec de newsletter S8/S16). Cualquier otra rama sigue con `revisor`, `/puerta-calidad` y OK de Jose en preview antes del merge: eso lo garantiza el proceso, no la regla de GitHub, así que ningún agente mergea sin esos pasos aunque GitHub lo permita.

Nunca se hace `git push --force` sobre una rama compartida ni se reescribe historia de `main`.

## 10. Contenidos: un JSON de literales por idioma, ningún texto en componentes

**Decisión.** Todo texto visible vive en `apps/web/messages/es.json` y `apps/web/messages/en.json` (next-intl, diseño técnico §1.4). La interfaz carga el catálogo del `locale` y el conmutador es/en cambia en caliente sin recargar (navegación cliente a la ruta localizada, `pathnames` de la tarea 2.1). Los datos personales (nombre a mostrar, ciudad, años, contactos, usuario de GitHub, enlaces de stores) van dentro del mismo catálogo bajo la clave `facts.*`; **no se crea un `facts.json` aparte**.

**Reglas.**

- Ningún literal de texto en JSX ni en TypeScript: siempre `t('clave')` o `useTranslations`. Incluye `aria-label`, `alt`, `title`, placeholders y mensajes de error. Excepciones: identificadores no traducibles (marca `josecoded`, atajos `⌘K`, códigos).
- Claves por pantalla y componente (`home.scenes.about.title`), en inglés, sin abreviar. El mismo texto en dos sitios es una sola clave.
- Un `{{DATO}}` pendiente se escribe como valor `"{{DATO: qué es}}"` en ambos idiomas. El bloque que lo contiene no se renderiza en producción (plan, restricciones globales).
- Textos largos (fichas de proyectos, servicios, FAQ, blog) siguen en `content/` como decidió el diseño técnico; `messages/` es para la interfaz y los hechos.
- Jose edita los JSON directamente (commit o PR, sin tocar código). Cuando lo haga, `pnpm --filter web i18n:check` le dice qué falta.

**Vigilancia.** `apps/web/scripts/i18n-check.ts` con su test: lista (1) las claves con `{{DATO` en cualquier idioma y (2) las claves presentes en un idioma y ausentes en el otro. Corre en `pnpm test`; en CI es informativo mientras la web no esté en producción y bloqueante desde `release/v1`. ESLint con `react/jsx-no-literals` (permitiendo solo los símbolos de la excepción) falla la CI.

## 11. Dependencias: pnpm, solo las del plan

**Decisión.** **pnpm, nunca npm ni npx**: ni en comandos, ni en scripts, ni en documentación (`pnpm dlx` en lugar de `npx`). Las dependencias de `apps/web` son las que lista el plan; añadir una requiere justificación.

**Regla para una dependencia extra.** En la tarea o el commit que la introduce: nombre y versión, tamaño gz que añade al bundle de la home (medido con `check:hero-bundle`), por qué no vale la alternativa nativa (CSS, plataforma, JS propio) y quién la mantiene. El `revisor` la acepta o la rechaza en la revisión de la tarea; sin aceptación explícita, se retira. Los presupuestos de bundle (350 KB gz home, 200 KB gz escena) siguen siendo el límite duro.

Una dependencia que trae estilos propios (kits de UI, librerías de componentes con CSS) se rechaza por defecto: choca con §1.

**Lista blanca añadida en v1.2** (decididas por Jose el 2026-09-30; no necesitan justificación en su tarea, solo fijar versión):

| Paquete | Dónde | Para qué | Bundle |
|---|---|---|---|
| `vitest-axe` | `devDependencies` de `apps/web` | Reglas de axe en los tests de Vitest de componentes con comportamiento (§16) | 0 (solo test) |
| `@axe-core/playwright` | `devDependencies` de `apps/web` | Auditoría axe en el E2E de cada escena y pantalla (§16) | 0 (solo test) |
| `eslint-plugin-import-x` | `@josecoded/config` | `import-x/order`, `no-duplicates`, `no-cycle` (§14.5) | 0 (lint) |
| `jscpd` | solo `pnpm dlx jscpd` en CI, sin instalar en el repo | Detector de bloques duplicados (§15.4) | 0 (CI) |

Siguen fuera y se descartaron con nombre: CVA / `class-variance-authority`, `clsx`, `@radix-ui/react-slot`, `react-hook-form`, `zustand`, Storybook. Si alguna vuelve, pasa por la regla general de este apartado.

## 12. Impacto en el plan (no se reescribe aquí; se hace en el paso de ajuste de la fase 2)

Tareas y decisiones que estas convenciones dejan obsoletas o abren:

- **Tarea 2.2 del plan** («Tokens de diseño, tipografías, Tailwind v4, shadcn base y `Backdrop`»): obsoleta. Contradice §1 (sin Tailwind ni shadcn), §2 (tokens generados desde `design.json`, no escritos en `@theme`) y las tipografías (Geist y Geist Mono según `DESIGN.md`, no Sora/Manrope/JetBrains). El `Backdrop` de la v4 (grano al 3,5 % y un rayo a 214°) no se porta. La v6 tiene su propio fondo, que sí se porta: el campo de luz `.field` (tres haces y un charco) y el grano `.grain` al 4,5 % (`home-v6/index.html:34-35`, `base.css:44-45` y `base.css:137-144`). Se sustituye por: tarea de `packages/design-tokens` + `tokens.css` + stylelint, y tarea de fuentes con `next/font`.
- **Spec §5 «GSAP + `@gsap/react` + ScrollTrigger»**: superado por §3. Se anota en la spec al alinearla con la v6.
- **`packages/glyph-scene` (tareas 2.5a, 2.5b, 2.6)**: decidido 2026-09-29 — se construye portando `scene.js` de la v6 a TypeScript (troceado según la API del diseño técnico, sin código muerto, valores de la v6). En móvil, vídeo + póster generados desde la misma escena; WebGL solo en escritorio. Los posters actuales (`glyph-*-alpha.png`, 250–300 KB) se regeneran dentro del presupuesto de 60 KB. Detalle en `docs/superpowers/design/2026-09-29-componentes-home-v6.md` §3.
- **Tareas 2.3 y 2.10** (cabecera, footer, `ProofStrip`, `PathPanel`): la estructura de la home ya no es esa; se reescriben contra las escenas de la v6.
- **Tarea 2.14** (E2E de la home): añadir la captura comparada de §5 y el fallback de §6.
- **Tarea 1.1** (esqueleto): añadir `packages/design-tokens`, `stylelint` en `@josecoded/config` y los scripts `tokens:build`, `visual`, `i18n:check`.
- **v1.2 (plan v2.2):** 1.1 crea `packages/types`, las reglas ESLint de §14.5 y el job `jscpd`; 1.5 añade `AppConfig` de next-intl; 1.6 genera `database.ts` con test de deriva; 1.10 emite `tokens.ts`; 1.2/1.3, 3.7, 3.8, 7.16–7.24 y 10.2 aplican puertos y adaptadores (§17.1) en los módulos nuevos; 2.2 fija el contrato de variantes, `lib/a11y/` y `/dev/ui`; 3.9/3.10 usan `Form`/`Field`; 2.17 y todo E2E de escena o pantalla pasan axe. La fase 0 no cambia.

## 13. Reglas duras (las que van en `CLAUDE.md`)

1. CSS Modules por componente; solo `var(--token)`; sin Tailwind ni shadcn.
2. `.impeccable/design.json` genera `tokens.css`; test de deriva; nunca se edita el CSS generado.
3. Motion en CSS nativo; JS propio en TypeScript; GSAP solo justificado.
4. Baseline 2024 y `@supports` con los fallbacks de la tabla de §6.
5. Prototipo `home-v6` 1:1; los desvíos se marcan con `deviation:` y los decide Jose en el navegador.
6. Capturas comparadas a 360/900/1440 en cada tarea con UI; `ui` revisa; Jose aprueba en preview antes del merge.
7. TDD solo en lo que tiene comportamiento; sin unit tests de componentes visuales.
8. Unidades relativas, breakpoints en `rem`; `px` solo en hairlines, sombras, desenfoques y offsets de motion.
9. PR por rama, squash, `main` protegida por Jose; nunca push a `main`; auto-merge solo del bot de la newsletter en `newsletter/*` con checks en verde.
10. Textos solo en `messages/{es,en}.json`; pnpm siempre; dependencias solo las del plan.
11. Tipos compartidos solo en `@josecoded/types` (un fichero por dominio, barrel único); zod es la fuente en las fronteras y los tipos se infieren; `database.ts`, claves de `messages` y nombres de token tipados y generados (§14).
12. Un componente por concepto con variantes (`variant`, `size`, `tone` como uniones de `@josecoded/types` volcadas a `data-*`); polimorfismo por `href`; se parte solo si cambia el rol, el elemento raíz o los slots; catálogo `/dev/ui` fuera de producción (§15).
13. Accesibilidad por componente: contrato a11y en la tarea, helpers en `lib/a11y/`, axe en Vitest (comportamiento) y en E2E (escenas y pantallas) como bloqueante; gateway nuevo con puertos y adaptadores (`buildDeps(env)`); estado en cliente sin librería; formularios con Server Actions + `Form`/`Field` (§16, §17).

## 14. Tipos: `@josecoded/types` como única fuente, zod en las fronteras

**Decisión (2026-09-30).** Todo tipo que use más de un fichero vive en `packages/types` (`@josecoded/types`). Es un paquete sin dependencias de runtime (solo `zod` como peer para los esquemas), con un barrel `src/index.ts` y **un fichero por dominio**: `ui.ts` (props y variantes de primitivas), `content.ts` (proyectos, servicios, FAQ, blog, CV), `api.ts` (contratos web↔gateway: `ai_proposal`, leads, afiliados, chat), `database.ts` (generado), `i18n.ts` (locales, `Href`, claves), `tokens.ts` (reexporta el generado por design-tokens), `radar.ts` (a partir de la fase 7; sustituye a `radar-core/src/types.ts`, que pasa a reexportar) y `newsletter.ts` (fase 10). Un solo import en todo el monorepo: `import type { ButtonProps, Lead } from '@josecoded/types'`.

**Reglas.**

1. **Ninguna `interface` ni `type` exportada fuera de `packages/types`** salvo tipos privados de un módulo (no exportados) y los `Props` de un componente que solo usa ese componente; en cuanto un segundo fichero lo necesita, se mueve al paquete. `no-restricted-syntax` no lo puede vigilar del todo: lo revisa `revisor` en cada tarea con la pregunta «¿este tipo existe ya?».
   Excepción: tipos de composición interna de una app (p. ej. `Deps`/`AppEnv` del gateway) pueden vivir en esa app; lo compartido, en `@josecoded/types`.
2. **zod es la fuente en las fronteras.** Todo lo que entra de fuera del proceso (JSON de `content/`, `pricing.json`, `design.json`, formularios, `env`, cuerpos y respuestas del gateway, frontmatter MDX, webhooks) tiene su esquema en `packages/types/src/schemas/<dominio>.ts` y su tipo es `export type Lead = z.infer<typeof leadSchema>` en el fichero de dominio. Los tipos puramente internos (props de UI, estados de `lib/motion/`, uniones de variantes) se escriben a mano. Nunca dos definiciones del mismo contrato; nunca `satisfies z.ZodType<X>` para «enlazar» un tipo a mano (elegido y descartado).
3. **`database.ts` se genera**, no se escribe: `supabase gen types typescript --local > packages/types/src/database.ts` en la tarea 1.6 contra `supabase start`, **nunca contra producción**; se commitea y `packages/types/test/database-drift.test.ts` regenera en memoria (con Supabase local arrancado; en CI ya lo está para los tests RLS) y compara. Nadie importa `database.ts` directamente: `packages/types/src/db.ts` expone `Database`, `Tables<'leads'>`, `TablesInsert<…>`, `Enums<'radar_status'>`, y los clientes se crean como `createServerClient<Database>(…)`. Cada migración nueva (1.8, 4.x, 7.6, 10.1) regenera el fichero en la misma tarea.
4. **Claves tipadas.** next-intl con `AppConfig` global en `apps/web/global.d.ts`: `declare module 'next-intl' { interface AppConfig { Locale: 'es' | 'en'; Messages: typeof import('./messages/es').default; } }` (con la fusión por pantalla de la tarea 1.1 expuesta como un `es.ts` que compone las carpetas) → `t('home.scenes.about.title')` autocompleta y una clave inexistente no compila. `packages/design-tokens` emite además `apps/web/styles/tokens.ts` con `export type TokenName = '--bg' | '--dur-fast' | …` y `readToken(name: TokenName): string`; `lib/motion/` solo lee tokens por esa función. Ambos se reexportan desde `@josecoded/types` (`i18n.ts`, `tokens.ts`).
5. **Lint de fronteras** en `@josecoded/config` (`eslint.config.mjs`), decidido por Jose (tres de las cuatro opciones; las reglas TypeScript extra —`consistent-type-imports`, `no-explicit-any` como error, prohibir `React.FC` y enums— **no** entran; se mantiene lo que trae `eslint-config-next` + `typescript-eslint` recomendado):
   - `no-restricted-imports`: prohibido importar `**/messages/*.json` (usar `useTranslations`/`getTranslations`), `@josecoded/types/src/database` (usar `db.ts`), `**/styles/tokens.css` fuera de `globals.css`, `three` y `three/addons/*` fuera de `packages/glyph-scene`, `@supabase/supabase-js` fuera de `lib/supabase/` y de los adaptadores del gateway (§17.1), y cualquier `apps/api/src/adapters/*` desde una ruta (las rutas reciben `deps`).
   - `eslint-plugin-import-x`: `import-x/order` con grupos `builtin`, `external`, `@josecoded/**`, `parent`/`sibling`, `type` al final, líneas en blanco entre grupos y orden alfabético; `import-x/no-duplicates`; `import-x/no-cycle` (maxDepth 4). Prettier no ordena imports; esta regla evita diffs ruidosos entre agentes.
   - Todo falla la CI en `pnpm lint`.

**Vigilancia.** `pnpm typecheck` con `strict` + `noUncheckedIndexedAccess` (ya en 1.1); test de deriva de `database.ts`; `revisor` comprueba en cada tarea que no aparece un tipo compartido fuera del paquete ni un esquema zod sin su `z.infer` exportado.

## 15. Componentes: uno por concepto, variantes por `data-*`, polimorfismo por `href`

**Decisión (2026-09-30).** Un concepto de interfaz = un componente con variantes; nunca `PrimaryButton` y `GhostButton`. Las variantes son **uniones de tipos** en `@josecoded/types` (`ButtonVariant = 'solid' | 'ghost'`, `ButtonSize = 'sm' | 'md' | 'lg'`), el componente las vuelca a atributos `data-variant`, `data-size`, `data-tone` y el CSS Module selecciona por atributo (`.btn[data-variant='ghost']`). Sin CVA, sin `clsx`, sin concatenar clases; una sola clase raíz por componente. Valores por defecto en un solo sitio (la firma del componente), nunca repetidos en el CSS.

**Reglas.**

1. **Antes de crear un componente se busca el concepto** en el inventario (`docs/superpowers/design/2026-09-29-componentes-home-v6.md` §1) y en `components/ui/`. Si existe, se añade una variante; la tarea lo dice explícitamente («añade `tone: 'danger'` a `Button`»). Un componente nuevo con el mismo rol y el mismo elemento raíz que otro se rechaza en revisión.
2. **Regla de partición.** Un componente se divide solo cuando una «variante» cambiaría (a) el rol ARIA o la semántica, (b) el elemento raíz, o (c) los slots que acepta. Nunca por estilo. Por eso `Button` y `ArrowLink` son dos componentes (rol distinto), y `IconTile` con `tone: soft | solid` es uno.
3. **Polimorfismo por `href`, con unión discriminada.** `type ButtonProps = ButtonBase & ({ href: Href; type?: never; onClick?: never; disabled?: never } | { href?: never; type?: 'button' | 'submit'; onClick?: …; disabled?: boolean })`. Con `href` renderiza `Link` de next-intl; sin él, `<button>`. El tipo impide `onClick` en un enlace y `disabled` en un `<a>` (un enlace «deshabilitado» se expresa con `aria-disabled` y sin `href`, decisión de `ux` caso a caso). Sin prop `as` genérica ni `asChild`/`Slot` (descartados). Mismo patrón para `ArrowLink`, `ChatTrigger`, `CommandItem` y `NavLinks`.
4. **Catálogo `/dev/ui` en la propia app**, sin Storybook: `app/[locale]/(dev)/ui/page.tsx` monta cada primitiva de `components/ui` y de `components/forms` con todas sus variantes × tamaños × estados (reposo, hover forzado con `data-hover`, `:focus-visible`, disabled, `aria-invalid`, reduced motion) y datos de ejemplo con `{{DATO}}`. Solo existe cuando `env.client.NEXT_PUBLIC_DEV_UI === '1'` (activa en `wrangler dev` y en la preview de PR; ausente en producción: la ruta devuelve 404 y no entra en el `sitemap`). Sirve para la aprobación de Jose en preview (§5), para axe (§16) y para una captura de referencia por primitiva (`toHaveScreenshot`). Cada primitiva nueva o variante nueva se añade al catálogo en la misma tarea; es su documentación junto con el JSDoc de sus props.
5. **Duplicación vigilada por `jscpd`** en CI (`pnpm dlx jscpd apps packages --min-lines 30 --min-tokens 120 --threshold 0 --ignore '**/*.test.*,**/database.ts,**/tokens.*,**/content/**'`): un bloque duplicado falla el job `lint`. Un `Field` o un `Button` copiado se detecta antes de la revisión.

## 16. Accesibilidad por componente, no al final

**Decisión (2026-09-30).** WCAG 2.2 AA (ya en el plan) se asegura **en cada tarea de componente**, no solo en la puerta. Tres capas: contrato a11y escrito en la tarea, helpers compartidos en `lib/a11y/`, y axe automatizado en Vitest y Playwright. `revisor-accesibilidad` en `/puerta-calidad` sigue siendo la última red, no la primera.

**Reglas.**

1. **Contrato a11y en la tarea.** Toda tarea del plan que crea o cambia un componente lleva un bloque «A11y» con: rol y elemento raíz, nombre accesible (de dónde sale: `messages`, `aria-labelledby`), teclado (teclas y orden de tabulación), gestión del foco (dónde entra, dónde vuelve), estados anunciados (`aria-expanded`, `aria-current`, `aria-live`, `aria-invalid` + `aria-describedby`), comportamiento con `prefers-reduced-motion`, y contraste (tokens usados, ya validados en `DESIGN.md`). `revisor` lo comprueba punto por punto contra el código. Para las primitivas de la home el contrato sale del inventario (§1.1–1.2 y §4.5).
2. **`apps/web/lib/a11y/`**: módulos puros con test de Vitest, únicos en el repo: `focus-trap.ts` (`trapFocus(container) → release`), `inert-others.ts` (`inertSiblings(el) → restore`), `roving-tabindex.ts` (`createRovingTabindex(list, { orientation, loop })`, para `SegmentedControl` tablist, paleta y menú), `return-focus.ts`, `announce.ts` (región `aria-live` única). `lib/motion/expand-cell.ts` y `disclosure.ts` los consumen; ningún componente reimplementa una trampa de foco.
3. **axe en Vitest** (`vitest-axe`, `expect(await axe(container)).toHaveNoViolations()`) en el test de todo componente con comportamiento (§7): paleta, celda ampliada, `SegmentedControl`, `MobileMenu`, `Form`/`Field`, `ProposalPrompt`, `GuidedChat`, componentes del admin y de Radar. Los componentes sin test (visuales) se cubren en E2E.
4. **axe en E2E** (`@axe-core/playwright`): cada prueba de escena de la home (2.17), cada pantalla interior, el área privada, el admin y `/dev/ui` ejecutan `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()` y fallan con violaciones `serious` o `critical`; las `moderate` se listan en el informe del PR. Se ejecuta con y sin `prefers-reduced-motion` y en 360 px. Es bloqueante desde la primera escena (no informativo).
5. **Sigue vigente**: `jsx-a11y` de `eslint-config-next`; E2E por escena con navegación por teclado y `h1` único (§7); `revisor-accesibilidad` navega la app real en la puerta. La prueba manual con VoiceOver es opcional y la hace Jose en la preview cuando quiera; no sustituye a lo anterior.

## 17. Servicios, estado en cliente y formularios

### 17.1 Gateway nuevo con puertos y adaptadores (solo módulos nuevos)

**Decisión (2026-09-30).** Los módulos **nuevos** del gateway (`proposals`, `leads`, `notify`, `affiliates`, `radar/*`, `newsletter/*`) se escriben con puertos y adaptadores ligeros; los heredados (`v1`, `v1-protected`, `forum`, `admin-chat`, `health`, `system`) **no se tocan** (restricción global). Sin contenedor DI ni clases: funciones y objetos.

- **Puertos** (interfaces) en `@josecoded/types` (`api.ts`): `LeadsRepo`, `ProposalsRepo`, `QuotaStore`, `Notifier` (Telegram), `Mailer` (Brevo/Resend), `AiClient` (Workers AI / AI Gateway), `TurnstileVerifier`, `Clock`, `RadarRepo`, `MailSource`, `CalendarClient`, `ContentRepo` (GitHub).
- **Adaptadores** en `apps/api/src/adapters/<nombre>.adapter.ts`: `supabase.adapter.ts` (implementa los repos con `@supabase/supabase-js`), `kv-quota.adapter.ts`, `telegram.adapter.ts`, `brevo.adapter.ts`, `workers-ai.adapter.ts`, `turnstile.adapter.ts`, `google.adapter.ts`, `github.adapter.ts`, `system-clock.ts`. Son los únicos ficheros que importan SDKs o hacen `fetch` a terceros (lo vigila `no-restricted-imports`, §14.5). Cada uno tiene su **test de contrato** en workerd con `fetchMock` (lo que hoy hace el plan), y una **doble falsa en memoria** en `apps/api/test/fakes/<nombre>.fake.ts` que respeta el mismo puerto.
- **`apps/api/src/deps.ts`**: `buildDeps(env: Env): Deps` construye una vez por petición el objeto con todos los adaptadores reales; un middleware de Hono lo deja en `c.var.deps`. Las rutas solo componen: leen la petición, validan con zod (`@josecoded/types/schemas`), llaman a un servicio y devuelven. Los **servicios** son fábricas `createLeadsService(deps: Pick<Deps, 'leads' | 'notifier' | 'clock'>)` con funciones puras respecto a `deps`; se testean en Vitest normal con las falsas (rápido, sin HTTP), y las rutas con `SELF.fetch` y `buildDeps` sobrescrito por `env.__deps` de test.
- Las reglas de negocio ya puras (cuotas, máquina de estados de Radar, precios) siguen en sus módulos sin `deps`.

### 17.2 Estado en cliente: sin librería

- Datos: URL, RSC y Server Actions con `revalidatePath`; nunca se duplica en cliente lo que ya sabe el servidor. Estado local con `useState`/`useReducer` dentro de la isla. Estado compartido del shell en **un solo `ShellProvider`** (`components/layout/shell-provider.tsx`) con `{ palette, menu, openCell }` y sus acciones; se consume con `useShell()`. Nada más va en Context; Zustand y contextos múltiples quedan descartados (el hero no puede pagar re-renders del árbol). `lib/motion/` sigue gestionando su propio estado interno.

### 17.3 Formularios: Server Actions + `Form`/`Field`

- Todo formulario (contacto, generador, newsletter, auth, área, admin, Radar) es un Server Action con `useActionState`, validación **solo en servidor** con el esquema zod de `@josecoded/types/schemas` y respuesta tipada `FormState<T> = { status: 'idle' | 'ok' | 'error'; fieldErrors?: Partial<Record<keyof T, string>>; formError?: string }`. Funciona sin JS; con JS muestra estado `pending` y errores por campo sin recargar.
- `components/forms/form/` y `components/forms/field/`: `Form` monta `useActionState`, el `aria-live` de errores generales y el botón de envío con `pending`; `Field` es **un componente con variantes** (`kind: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio-group' | 'hidden'`) que pinta label, ayuda, error, `id`/`name`, `aria-describedby`, `aria-invalid` y `autocomplete` siempre igual. Ninguna pantalla escribe un `<input>` fuera de `Field` (salvo `ProposalPrompt`, que es un campo especial del inventario y consume los mismos helpers). react-hook-form queda descartado también para el admin y Radar.
