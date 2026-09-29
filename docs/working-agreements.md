# josecoded — convenciones de trabajo

> Versión 1.0, 2026-09-29. Decidido por Jose en la batería de preguntas del 2026-09-29 (12 respuestas, anotadas en `ESTADO.md`). Este documento es normativo: si una tarea del plan lo contradice, manda este documento y la tarea se corrige. Es el «cómo se trabaja»; el «qué» está en la spec y en la nota del vault.

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
- Duraciones, easings y distancias son tokens (`--ease-out`, `--dur-fast: 150ms`, `--dur-scene: 800ms`, etc.), también en TypeScript: se leen con `getComputedStyle(root).getPropertyValue`, no se repiten como números en el código.
- Solo `transform` y `opacity` se animan en continuo; nada que provoque layout en cada frame.

## 4. Fidelidad al prototipo: estructura y valores 1:1

**Decisión.** La referencia es `docs/superpowers/design/ref/home-v6/` (`index.html`, `base.css`, `v6.css`, `base.js`, `v6.js`). El implementador porta la estructura del DOM, las clases y los valores tal cual; los valores pasan a tokens (§2) y React solo compone.

**Reglas.**

- No se «mejora» ni se reinterpreta el prototipo. Si al portar algo no encaja (un literal sin token, un px fuera de §8, un patrón que rompe accesibilidad), se corrige de la forma mínima y se **marca el desvío en el mensaje del commit** con el prefijo `deviation:` y una línea por desvío.
- Los desvíos los decide Jose en el navegador (§5), nunca por descripción. Hasta que los decide, se mantiene la versión del prototipo si es viable.
- Cuando `DESIGN.md` y el prototipo v6 discrepen (hoy `DESIGN.md` documenta la v4), manda el prototipo. Esto cambia cuando ESTADO.md marque hecha la tarea «Volcar la v6 a DESIGN.md».
- Las escenas se portan una a una y en el orden del prototipo: hero, Sobre mí, Empresas, Negocios, Proyectos, Blog, cierre. No se abre la siguiente sin cerrar la validación (§5) de la anterior.
- Antes de portar una escena, el implementador sirve el prototipo (`python3 -m http.server 8765 --directory docs/superpowers/design/ref`) y lo abre; lee el DOM real, no la memoria de otra sesión.

## 5. Validación visual: capturas comparadas y aprobación en preview

**Decisión.** Cada escena o pantalla se valida con capturas automáticas de la app y del prototipo a **360, 900 y 1440 px**, comparadas por diff; `ui` revisa el diff y **Jose aprueba en la URL de preview antes del merge** de la rama.

**Mecánica.**

- `pnpm --filter web visual` → Playwright captura, por escena, `wrangler dev` de la app y el prototipo servido, en los tres anchos y con alto fijo (`812`, `1100`, `900` respectivamente), `prefers-reduced-motion: reduce` para que la comparación sea determinista, y guarda el diff en `apps/web/e2e/visual/__diff__/` (ignorado por git). Tolerancia inicial `maxDiffPixelRatio: 0.02`; la fija la tarea que monte el script y se ajusta solo con OK de Jose.
- Cada tarea con UI termina adjuntando al PR las tres capturas de la app y el porcentaje de diff por escena. Un diff por encima de la tolerancia no bloquea el commit, pero sí la puerta de la rama.
- En `/puerta-calidad`, `ui` (modo revisión con `/impeccable audit` y `/impeccable critique`) revisa el diff y emite «fiel», «desvío aceptable» o «no pasa». Después Jose abre la preview del PR (`preview.yml`) y aprueba en el navegador. Sin ese OK no hay merge.
- El estado por defecto de un desvío es «pendiente de Jose», no «aceptado por el agente».

## 6. Navegadores: Baseline 2024 con degradación por `@supports`

**Decisión.** Se dan por soportados los rasgos de Baseline 2024: container queries, `svh`/`dvh`, `:has()`, `inset`, `clamp()`, `scroll-snap`, `aspect-ratio`, `<dialog>`, CSS nesting no se usa (§1). Lo posterior se usa con `@supports` y la web funciona sin ello.

**Fallbacks obligatorios** (los comprueba `qa` en Safari de escritorio e iOS en la puerta de calidad):

| Rasgo | Con soporte | Sin soporte |
|---|---|---|
| `animation-timeline: view()` / `scroll()` | Entradas y salidas por elemento y carrusel de Proyectos ligados al scroll | Los elementos están en su estado final desde el principio; Proyectos es un scroll horizontal nativo con `scroll-snap-type: x mandatory` |
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

## 12. Impacto en el plan (no se reescribe aquí; se hace en el paso de ajuste de la fase 2)

Tareas y decisiones que estas convenciones dejan obsoletas o abren:

- **Tarea 2.2 del plan** («Tokens de diseño, tipografías, Tailwind v4, shadcn base y `Backdrop`»): obsoleta. Contradice §1 (sin Tailwind ni shadcn), §2 (tokens generados desde `design.json`, no escritos en `@theme`) y las tipografías (Geist y Geist Mono según `DESIGN.md`, no Sora/Manrope/JetBrains). El `Backdrop` con grano y rayo es de la v4; la v6 no lo tiene. Se sustituye por: tarea de `packages/design-tokens` + `tokens.css` + stylelint, y tarea de fuentes con `next/font`.
- **Spec §5 «GSAP + `@gsap/react` + ScrollTrigger»**: superado por §3. Se anota en la spec al alinearla con la v6.
- **`packages/glyph-scene` (tareas 2.5a, 2.5b, 2.6) frente a `scene.js` de la v6**: decisión pendiente. Los dos son Three.js, pero el plan prevé un paquete con `params`, `atlas`, `worker`, `render-media` y presupuesto de 200 KB gz, y la v6 usa un `scene.js` monolítico derivado de hero-lab-3 con posters PNG (`glyph-*-alpha.png`, 250–300 KB cada uno, fuera del presupuesto de poster de 60 KB). Hay que decidir si el paquete se construye desde `scene.js` (portarlo y trocearlo) o desde el plan, y regenerar los medios. Lo decide el arquitecto al ajustar la fase 2, con Jose si cambia lo visible.
- **Tareas 2.3 y 2.10** (cabecera, footer, `ProofStrip`, `PathPanel`): la estructura de la home ya no es esa; se reescriben contra las escenas de la v6.
- **Tarea 2.14** (E2E de la home): añadir la captura comparada de §5 y el fallback de §6.
- **Tarea 1.1** (esqueleto): añadir `packages/design-tokens`, `stylelint` en `@josecoded/config` y los scripts `tokens:build`, `visual`, `i18n:check`.

## 13. Reglas duras (las que van en `CLAUDE.md`)

1. CSS Modules por componente; solo `var(--token)`; sin Tailwind ni shadcn.
2. `.impeccable/design.json` genera `tokens.css`; test de deriva; nunca se edita el CSS generado.
3. Motion en CSS nativo; JS propio en TypeScript; GSAP solo justificado.
4. Baseline 2024 y `@supports` con los fallbacks de la tabla de §6.
5. Prototipo `home-v6` 1:1; los desvíos se marcan con `deviation:` y los decide Jose en el navegador.
6. Capturas comparadas a 360/900/1440 en cada tarea con UI; `ui` revisa; Jose aprueba en preview antes del merge.
7. TDD solo en lo que tiene comportamiento; sin unit tests de componentes visuales.
8. Unidades relativas, breakpoints en `rem`; `px` solo en hairlines, sombras, desenfoques y offsets de motion.
9. PR por rama, squash, `main` protegida por Jose; nunca push a `main`.
10. Textos solo en `messages/{es,en}.json`; pnpm siempre; dependencias solo las del plan.
