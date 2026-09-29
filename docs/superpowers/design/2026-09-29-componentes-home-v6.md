# Componentes de la home v6 → app real

> Versión 1.0, 2026-09-29. Autor: agente `ui` (con `impeccable extract` como método: solo se extrae lo que tiene la misma intención en tres o más sitios; lo demás queda como pieza de su escena).
> Fuente: `docs/superpowers/design/ref/home-v6/` (index.html, base.css, v6.css, base.js, v6.js, scene.js). Sistema: `DESIGN.md`, `.impeccable/design.json`, contrato `.impeccable/surfaces/docs-superpowers-design-ref-home-v6-index-html.md`. Convenciones: `docs/working-agreements.md` v1.0 (manda sobre este documento si discrepan).
> Es análisis y propuesta. No se ha escrito código.
> v1.1, 2026-09-29: las cinco decisiones de §3 quedan cerradas (Jose eligió cuatro; la quinta, el coordinador) y se añaden los pendientes para el plan (§6).

## 0. Marco

Decisiones ya cerradas que este inventario respeta, sin volver a discutirlas:

- CSS Modules por componente, solo `var(--token)`; tokens generados desde `design.json` (`pnpm tokens:build` → `apps/web/styles/tokens.css`).
- Motion en CSS nativo; JS propio en TypeScript, en módulos puros de `apps/web/lib/motion/` invocados desde islas cliente pequeñas.
- Estructura, clases y valores 1:1 con el prototipo; desvíos con `deviation:`.
- Textos siempre en `messages/{es,en}.json` (incluidos `aria-label`, `alt`, placeholders y datos de la paleta).
- Baseline 2024 con los fallbacks de `working-agreements.md` §6.
- Áreas de componentes: `ui` (primitivas), `layout`, `hero`, `scenes`, `home`, `forms`.

Convenciones de este documento:

- **Origen**: `fichero:línea` del prototipo. `html` = index.html, `base` = base.css, `v6` = v6.css, `bjs` = base.js, `vjs` = v6.js, `scn` = scene.js.
- **RSC / Cliente**: Server Component por defecto. «Cliente» significa que lleva `'use client'` o que necesita una isla cliente hermana.
- **TDD**: «sí» si tiene comportamiento; entonces el cálculo va en un módulo puro con test de Vitest y el componente solo lo monta. «No» = visual; lo cubren E2E y captura comparada.
- **Tokens**: nombres de `design.json` en kebab-case. Los marcados con `*` **no existen todavía** en `design.json` y deben añadirse antes de portar (ver §5).

---

## 1. Inventario jerárquico

### 1.1 Primitivas (`components/ui/`)

| Componente | Origen | Variantes y estados | Tokens | TDD | RSC / Cliente |
|---|---|---|---|---|---|
| **Button** | `.btn` base:85-96; usos html:26, 43, 59, 77, 85, 95, 99, 151-152; icono solo base:207 y base:201-202 | `variant`: solid, ghost. `size`: sm (2.25rem), md (3rem), lg (3.5rem). `iconOnly` (2.75rem, cabecera ≤ 22.5rem). Estados: hover solo con puntero fino (solid → violet-hi; ghost → alpha 18 %), `:active` scale(0.97) 160 ms, focus-visible anillo global, disabled (**no existe en el prototipo**: se define como opacidad reducida y sin hover; pendiente de validar en navegador), reduced motion sin scale. Polimórfico: `<a>` (next-intl `Link`) o `<button>`. Icono Lucide opcional a la izquierda | violet, violet-hi, ink, text, `r-pill`*, label-button, `shadow-button`*, `violet-a10`*, `violet-a18`*, line-2, `dur-press`*, `dur-color`*, ease-out | No | RSC |
| **ArrowLink** («enlace con flecha») | `.link` base:91-92, 96 (hero, peso 500) y `.go` base:179-181 (celdas, peso 550); usos html:44, 59, 67, 77, 85, 103, 109, 113… | `emphasis`: regular (500) / strong (550). `icon`: arrow-right por defecto; download, message-circle. Hover: el icono avanza 3 px (solo puntero fino). **Unifica dos clases duplicadas** | violet-soft, `dur-arrow`* (200 ms), ease-out | No | RSC |
| **Icon** | `svg.lucide` base:35; `i[data-lucide]` en todo html | Tamaño 1.05em, trazo 1.75, monocromo, `aria-hidden` siempre salvo que se pase nombre. Se implementa con `lucide-react` por import nombrado (sin UMD de CDN, bjs:4) | — (hereda `currentColor`) | No | RSC |
| **IconTile** | `.cell__ic` v6:48-49; `.plist .ic` base:173 y v6:178-179 | `size`: md 2rem / r-sm (cabecera de celda), sm 1.75rem / r-icon (fila de lista). `tone`: soft (violeta 12 %, icono violet-soft) / solid (violet + ink: celda destacada y fila seleccionada). Transición de tono 160 ms | `violet-a12`*, violet-soft, violet, ink, `rounded.sm`, `rounded.icon` | No | RSC |
| **Kbd** | `kbd` base:37; html:24, 164, 166 | Una sola forma. Solo atajos reales (⌘K, ↑, ↓, ↵, esc). Oculto bajo 900 px en la cabecera (base:201) | mono-key, text-2, `violet-a10`*, line, `shadow-key`*, `rounded.key` | No | RSC |
| **KeyCap** (tecla grande) | `.key` base:190-191; html:154; bjs:60-65 | Estado `is-down` mientras ⌘/Ctrl y K están pulsadas de verdad. Oculta sin puntero fino (base:189) | text, `key-top`* / `key-bottom`* (degradado #1f1a44 → #151233), `shadow-keycap`*, `shadow-keycap-down`*, `rounded.md`, `dur-key`* (90 ms) | Sí (escucha keydown/keyup; lógica mínima en `lib/motion/keycap.ts`) | Cliente |
| **Chip** (pastilla de stack) | `.marquee__track span` v6:162; también `.chips li` base:159-160 (sin uso) | Una forma. `.chips` se descarta: la única pastilla viva es la de la marquesina | `violet-a08`*, line, text-2, label, `r-pill`*, padding de `components.chip` | No | RSC |
| **Surface** (lámina de vidrio índigo) | `.surface` base:161 | `radius`: cell / tcard. `layer`: card (reposo) / overlay (abierta, menú, paleta). Estados de sombra: reposo, hover (`shadow-card-hover`), foco (`shadow-card-focus`). Desenfoque 18 px con `@supports (backdrop-filter)` y fallback opaco | card, card-line, overlay, `shadow-card`, `shadow-card-hover`, `shadow-card-focus`, `blur-card`* | No | RSC |
| **TwoToneHeading** | `.sec-title` base:155-156 + v6:14, 25; `.close__title` base:185-186 + v6:145 | `level`: h2 / h1-like. `size`: headline / display-closing. Dos partes desde messages (`lead`, `tail`); tail en text-3. max 22ch, `text-wrap: balance` | typography.headline, typography.display-closing, text, text-3 | No | RSC |
| **LiveDot** | `.nav__chat .live` base:150 | Único estado «vivo». Verde solo aquí, en checks y en la intro | green, `size-dot`* (0.375rem) | No | RSC |
| **SkipLink** | `.skip` base:39-40; html:16 | Oculto hasta foco | text, bg, `rounded.sm`, ease-out | No | RSC (en `globals.css` según working-agreements §1) |
| **Text roles** (Lead, Muted, Small) | `.lead` base:215 + v6:15; `.muted` base:157; `.small` base:216 | No son componentes: tres clases de un `typography.module.css` compartido que otros módulos consumen con `composes`. `.lead` max 52ch | typography.lead, small, text-2, text-3 | No | RSC |
| **Pending** (`{{DATO}}`) | `.todo` base:38 y base:158 (duplicado) | Solo en desarrollo. En producción el bloque que lo contiene no se renderiza (working-agreements §10) | `todo`* (#e9c46a, solo dev), mono | No (lo cubre `i18n:check`) | RSC |

### 1.2 Componentes (`components/scenes/`, `components/forms/`, `components/layout/`)

| Componente | Origen | Variantes y estados | Tokens | TDD | RSC / Cliente |
|---|---|---|---|---|---|
| **BentoCell** | `.cell` v6:41-59, 152-156; html:56-60, 61-64, 65-68, 74-78… | `span`: 3, 5, 6, 7, 12 (`--span`, v6:36). `tall` (2 filas a 12 col, cuerpo repartido v6:45-46). `wide` y `hero` (ancho completo a 2 col, v6:32). `tone`: default / tint (160°, 14 %) / hero (135°, 20 %, icono sólido, texto atenuado sube a text-2, v6:43-44, 55). `expandable` (añade botón Ampliar y cursor, v6:42). Slots: `icon`, `title`, `action` (Ampliar/Cerrar), `body`, `more`. Estados: reposo, hover con puntero fino (filete line-2 y luz bajo el cursor 9 %, 22rem; 26rem en hero), abierta (ver ExpandedCell), inerte, reduced motion (sin luz, sin entrada ligada al scroll). Contenedor `cell` para container queries internas | card, card-line, `rounded.cell`, `pad-cell`, `gap-cell`*, `violet-a14`*, `violet-a20`*, `violet-a12`*, `light-cell`* (22rem/26rem, 9 %), cell-title, text-2 | No (la luz y la ampliación son módulos aparte) | RSC; luz bajo el cursor por isla delegada (ver `CursorLight`) |
| **CursorLight** | vjs:120-123; v6:151-156 | Solo con puntero fino y sin reduced motion. Escribe `--mx`/`--my` en la celda bajo el puntero | — | Sí (`lib/motion/cursor-light.ts`: coordenadas relativas, desactivado con reduce o sin puntero fino) | Cliente: **un solo listener delegado por bento**, no uno por celda |
| **ExpandedCell** (celda ampliada + velo) | `.cell.is-open` v6:89-94; `.scrim` v6:92; vjs:84-117; `overlay:close` bjs:53-56 | Abre por clic en la celda (salvo sus controles) o por el botón Ampliar; cierra con Esc, botón Cerrar, clic en velo o al saltar desde la paleta. `role="dialog"`, `aria-modal`, foco atrapado, todo lo demás `inert`, cabecera atenuada al 50 % (base:52), bloqueo de scroll, oculta el indicador. View Transition 380 ms; sin ella o con reduced motion, cambio inmediato. Muestra el slot `more` (v6:54, 91) | overlay, `scrim`* (rgb 7 6 15 / 0.72), `blur-scrim`* (6 px), `inset-open`* (márgenes fluidos v6:89), `z-scrim`*, `z-open`*, `vt-cell` (motion) | Sí (`lib/motion/expand-cell.ts`: shield/unshield, trampa de foco, retorno de foco, orden Esc menú → paleta → celda, coordinación con la paleta) | Cliente |
| **ProjectCard** | `.tcard` v6:117-123, 130-131, 201-202; html:111-126 | Arte de glifos (`aria-hidden`, proporción reservada 801/722) + copia: nombre, entradilla, tipo con icono (App / Web) y ArrowLink. Se apila bajo 15rem por columna. `state` en carrusel fijado: inactive (40 %, scale 0.96) / active (opacidad plena, `shadow-card-focus`, arte flota 8 px en 6 s). Fuera del carrusel: estado único sin atenuar. Reduced motion: sin flotación | card, card-line, `rounded.tcard`, `pad-cell`, typography.project-name, lead, small, text-3, `glow-art`* (beam al 22 %), `shadow-card-focus`, `dur-card`* (360 ms), ease-out, `float-offset` (8 px, excepción de motion) | No | RSC (el estado activo lo pone `ProjectsTour`) |
| **PackStrip** (fila de packs con barra) | `.packs--live` v6:71-74, 181-185; `.packs`/`.pack` base:162-167 (reglas sobrescritas); vjs:133-139; html:94 | Cuatro packs de `packages/pricing` (nombre + cifra «desde»). Destacado inicial: el segundo (vjs:138). Hover o foco en un pack: la barra de 2 px se desliza (260 ms) y los demás bajan al 55 %. Rejilla por contenedor: 4 → 2 columnas (`auto-fit` 8.5rem); separadores verticales solo desde 40rem de celda. Dentro de celda hero la cifra escala por cqi. Reduced motion: sin deslizamiento | typography.figure, caption, text-3, violet-soft, line-2, `dur-slide-lg`* (260 ms), ease-slide, `opacity-dim`* (0.55) | Sí (`lib/motion/slide-marker.ts`, compartido con SlidingList: posición y ancho del marcador, reposicionado en resize) | Cliente |
| **SlidingList** (lista con selección deslizante) | `.plist--live` v6:170-180; `.plist` base:170-174, v6:82-83; vjs:125-131; html:76 | Filas de 2.75rem: IconTile sm + nombre + entregable (`.svc`/`.give` v6:67-68) + metadato (se oculta bajo 26rem de celda). Resaltado violeta 14 % que sigue al puntero y al foco en 240 ms; la fila elegida pasa a icono sólido. Primera fila seleccionada al montar. Reduced motion: sin deslizamiento | list-item, list-item-selected, `violet-a14`*, `violet-a20`*, `rounded.md`, `dur-slide`* (240 ms), ease-slide | Sí (mismo `slide-marker.ts`) | Cliente |
| **SegmentedControl** | `.seg` v6:86, 188-191; vjs:141-147; html:81 | Dos (o más) opciones, pulgar violeta que se desliza 240 ms. Flechas izquierda/derecha cambian. **Semántica a corregir al portar**: tablist + tabpanel con `aria-controls` y tabindex itinerante, o grupo de radios; el prototipo tiene `role=tab` sin panel | segmented, segmented-thumb, `bg-a50`* (rgb 7 6 15 / 0.5), line-2, ink, text-2, `dur-slide`*, ease-slide | Sí (estado, teclado, sincronía con los paneles) | Cliente |
| **RateFigure** | `.rate-big` v6:75, 192-193; html:81 | Cifra grande en `aria-live="polite"` que cambia con el SegmentedControl; entra con desenfoque leve 260 ms. Reduced motion: sin animación | typography.figure, `dur-swap`* (260 ms), ease-out | No (el cambio lo gobierna SegmentedControl) | RSC dentro de la isla del selector |
| **Marquee** | `.marquee` v6:159-165, 209; html:63 | Dos bandas en sentidos opuestos (38 s y 44 s), máscara lateral, pausa en hover de la celda. `aria-label` con la lista completa, copias `aria-hidden`. Reduced motion: una sola banda en bloque, sin máscara | Chip, `dur-marquee-a`* (38 s), `dur-marquee-b`* (44 s) | No (CSS puro) | RSC |
| **ChatBubble** | `.bub` v6:169-172 | `from`: me (violeta 20 %, esquina inferior derecha 0.25rem) / jose (blanco 5 % + filete, esquina inferior izquierda). Entrada 240 ms (opacidad + 6 px). Reduced motion: visible sin transición | `violet-a20`*, `white-a05`*, line, text, text-2, `rounded.bubble`, `rounded.bubble-tail`* (0.25rem), ease-out | No | RSC |
| **MiniChat** | `.mini-chat` v6:168; vjs:149-161; html:67 | Dos burbujas que se escriben solas (22 ms por carácter, 700 ms entre ellas, repite cada 5 s) solo mientras están a la vista (umbral 0.4). Reduced motion: texto completo sin escribir. Textos desde messages | ChatBubble | Sí (`lib/motion/typewriter.ts`, con temporizadores falsos; parada fuera de vista) | Cliente |
| **ProposalPrompt** (campo de propuesta) | `.ask` base:168-169, 218-220; v6:84-85; bjs:74-81; html:99 | Píldora 3rem con icono, ejemplos que se escriben (38 ms) y borran (16 ms) con cursor parpadeante, y botón sólido. Bajo 24rem de celda apila el botón. **En el prototipo no es un campo** (label con span): en la app es un `<input>` real con los ejemplos como capa decorativa que se para al enfocar o escribir; el envío lleva al generador. Estados: reposo, foco, con texto (ejemplos ocultos), enviando, error (los define `ux` en el generador). Reduced motion: primer ejemplo fijo | `bg-a60`* (rgb 7 6 15 / 0.6), line-2, text-3, violet-soft (caret), `r-pill`*, `rounded.lg` (apilado) | Sí (typewriter + parada en foco/fuera de vista) | Cliente (`components/forms/`) |
| **CheckList** | `.checks--draw` v6:77-79, 196-198; vjs:163-166; html:103 | Checks verdes que se dibujan una vez al llegar (420 ms, escalonados 120 ms). Reduced motion: dibujados | green, text, body, `dur-draw`* (420 ms), `stagger-draw`* (120 ms), ease-out | Sí, mínimo (`lib/motion/in-view-once.ts`, reutilizable) | Isla cliente que solo añade la clase; markup RSC |
| **PostTeaser** | `.post__title` v6:80-81, 205-206; html:136, 140, 144 | `size`: lg (título fluido por cqi) / sm (1.125rem). Fecha (small), título, entradilla opcional, ArrowLink «Leer». Hover de la celda: subrayado de 1 px que crece 260 ms | typography.title, small, text-3, `dur-underline`* (260 ms), ease-out | No | RSC |
| **AboutSummary** | `.about`, `.photo` v6:62-65 (y `.about` base:212-214, sobrescrita); html:58 | Hueco de foto 4/5 junto al texto (nombre, rol · ciudad, entradilla). Mientras no haya foto: `{{DATO}}` | `photo-top`*/`photo-bottom`* (degradado #221d4d → #151233), line-2, `rounded.lg`, lead | No | RSC |
| **CtaRow** | `.strip` v6:76 y `.row-links` base:217; html:85 | Texto + Button sm + ArrowLink en fila que envuelve | gap tokens | No | RSC |
| **NavLinks** | `.nav__links` base:55-56, 66, 152; bjs:11-16 | Enlace activo en text con `aria-current`. En la home, activo por sección visible (IntersectionObserver); en el resto, por ruta | label, text-2, text, `dur-color`* | Sí solo el observador de la home (`lib/motion/active-section.ts`, compartido con SectionIndicator) | RSC + isla en la home |
| **LangSwitch** | `.nav__lang` base:58-59 y `.menu__lang` base:74-77; html:23, 31 | `variant`: inline (EN en mono, cabecera > 1080 px) / segmented (Español · English dentro del menú). Idioma actual con `aria-current`. next-intl `Link` a la ruta localizada | mono (0.75rem), text-2, text-3, `violet-a08`* | No | RSC |
| **SearchTrigger** | `.cmdk` base:60-61, 67; html:24 | Icono + «Buscar» + Kbd; bajo 900 px solo icono de 2.75rem. Abre la paleta | cmdk-trigger, line, line-2, text-3 | No (abre un diálogo; se prueba en la paleta) | Cliente (dispara la paleta) |
| **ChatTrigger** | `.nav__chat` base:149-151; html:25 | Píldora con LiveDot + icono + «Chat»; bajo 900 px solo icono. Destino: el chat IA (fuera de la home) | chat-pill, line-2, `violet-a10`*, `violet-a18`* | No | RSC (enlace) hasta que exista el chat |
| **CommandItem / MenuItem** | `.palette__list li` base:129-133; `.menu a` base:72-73, 78, 81 | Fila de 2.75rem con icono, etiqueta y pista a la derecha; seleccionada al 16 %. Cabecera de grupo (caption). Vacío (text-3) | list-item, list-item-selected, caption, `rounded.sm` | No | RSC dentro de sus contenedores |
| **CycleBars** | `.cycle` base:108-110; scn:368-371 | Tres trazos de 2 px; el activo se llena según el reposo (`--p`). Ocultos con reduced motion | `violet-a20`*, violet-soft | No (lo alimenta la escena) | Cliente dentro del hero |

### 1.3 Secciones y estructuras

| Estructura | Origen | Variantes y estados | Tokens | TDD | RSC / Cliente |
|---|---|---|---|---|---|
| **SiteHeader** (`layout/`) | `.nav` base:51-68, 148-152, 194-207; html:17-33; bjs:7-10 | Fija, 4rem. Transparente sobre el hero; `is-scrolled` tras 80 px (índigo 70 % + desenfoque 14 px + filete inferior). Orden a la derecha: LangSwitch → SearchTrigger → ChatTrigger → Button solid sm «Login». ≤ 1080 px: sin NavLinks, con botón ☰ y el idioma dentro del menú. ≤ 900 px: buscador y chat solo icono. ≤ 22.5rem: Login solo icono. Inerte y atenuada al 50 % con una celda ampliada | `header-scrolled`* (rgb 7 6 15 / 0.7), `blur-header`* (14 px), line, `z-header`*, `h-header`* (4rem), gutter | Sí, mínimo (umbral de scroll con sentinela e IntersectionObserver en vez de listener de scroll) | RSC + isla `HeaderScrollState` |
| **MobileMenu** | `.menu` base:71-82; html:27, 29-32; vjs:76-82 | Disclosure (`aria-expanded`, `aria-controls`), icono ☰ ↔ ✕. Panel overlay de 17rem bajo el botón, entra 180 ms (sin animación con reduce). Contacto destacado al final (hoy por posición `a:last-of-type`: al portar, por prop). Cierra con Esc (devuelve foco), al elegir, al tocar o enfocar fuera, al hacer rueda y al pasar de 1080 px. **Sustituye a la hoja shadcn del diseño técnico** | menu-panel, overlay, `shadow-overlay`, `blur-overlay`* (24 px), `violet-a12`*, `violet-a16`*, `z-menu`*, `dur-menu`* | Sí (`lib/motion/disclosure.ts`: todas las vías de cierre y el retorno de foco) | Cliente |
| **CommandPalette** | `.palette` base:122-135; html:162-168; bjs:18-72 | `<dialog>` modal, 40rem, a 14vh; sin animación. Grupos «Ir a» y «Acciones», búsqueda sin tildes, ↑ ↓ ↵, Esc cierra solo la paleta, ⌘K / Ctrl+K alternan, clic en el fondo cierra. Estado vacío con sugerencia. Si hay celda ampliada, la cierra antes de saltar. Comandos desde un fichero de datos tipado + messages (etiquetas, pistas y palabras clave por idioma) | palette, overlay, `shadow-overlay`, `palette-backdrop`* (rgb 8 6 22 / 0.6), `blur-backdrop`* (4 px), `violet-a16`*, list-item, caption, mono-key | Sí (`lib/motion/palette.ts`: filtrado normalizado, agrupación, índice seleccionado, atajo) | Cliente, montada en el layout global y cargada al primer intento (import dinámico al pulsar ⌘K o el buscador) |
| **Backdrop** (campo de luz + grano) | `.field`, `.beam`, `.field__pool` base:137-144; `.grain` base:44-45; html:34-35; scn:383, 410-413 | Tres haces y un charco en `screen`; en la home siguen a la nube y al cursor (solo `transform`); en el resto de páginas y con reduced motion quedan quietos en la posición de reposo (base:144). Grano al 4,5 % | beam, `beam-1..3`*, `pool`*, `grain-opacity`* (0.045), `blur-beam`* (5vmax), `z-field`* | No | RSC (la animación la hace la escena del hero) |
| **HeroSplit** (`hero/`) | `.hero` base:100-104, 195-200; html:38-46 | Split 5/7 a 100svh; ≤ 900 px una columna con el escenario encima. h1 (display), subtítulo con las dos audiencias en text 500, Button solid «Ver proyectos» + ArrowLink «Una web para mi negocio». Sin badge ni eyebrow | display, lede, text, text-2, gutter, container | No | RSC |
| **HeroStage** | `.hero__stage`, `.hero__static` base:105-107, 112, 197, 208; html:47-50 | Cuadrado con `role="img"` y descripción. Modos: escena viva (arrastre con puntero fino), póster estático (reduced motion). ≤ 900 px min(38svh, 100 %) o 34svh en pantallas bajas | — | Sí (el gate de modo) | Cliente (gate) + RSC (póster) |
| **GlyphScene** | scn:1-423 | Nube de 9 000 / 5 000 glifos que cicla móvil → web → chip (3,5 s + 1,6 s), bloom 0.22, reflejo 0.35, arrastre, inclinación al cursor, pausa con pestaña oculta, se apaga fuera del hero. Carga diferida tras el LCP | bg (clear color), violet, green | Sí (máquina de estados hold/morph, `step()` determinista) | Paquete sin React, montado desde el gate |
| **IntroFall** | scn:425-481 | Primera visita por sesión: los caracteres del hero caen y aterrizan con destello verde; cualquier interacción la termina. Sin reduced motion | violet-soft, green | Sí | Cliente |
| **Scene** (marco de escena) | `.scene`, `.scene__head` v6:22-25; html:53-54 y equivalentes | min 100svh, contenedor 82rem, pad-top, pad-scene, gap-scene. Cabecera con TwoToneHeading y acción opcional a la derecha (ArrowLink «Ver todos» en Proyectos, html:109). Entrada y salida ligadas al scroll (v6:96-109) con `@supports` | pad-top, pad-scene, gap-scene, container, `reveal-*`* (40 px, 0.985, 6 px de blur; salida 24 px, 0.97, 25 %) | No | RSC |
| **Bento** | `.bento-wrap`, `.bento` v6:27-38 | 1 columna; desde 34rem de contenedor 2 columnas (hero, wide y tall a lo ancho); desde 52rem 12 columnas con `span` por celda y tall de 2 filas. Tres celdas sin huecos | gap-bento, `cq-bento-2`* (34rem), `cq-bento-12`* (52rem) | No | RSC |
| **ProjectsTour** (carrusel fijado) | `.tour`, `.tour__sticky`, `.tour__track` v6:112-135; `.rail` v6:124, 132, 136-141; html:107-130; vjs:168-173 | Con `animation-timeline`, pantalla apaisada y sin reduced motion: sección de 420svh, contenido fijo, scroll vertical → desplazamiento horizontal, tarjeta del centro activa, raíl con nombres y barra de progreso. En otro caso (sin `animation-timeline`, pantalla vertical o reduced motion): tarjetas apiladas en columna, como el prototipo (working-agreements §6). El raíl es `aria-hidden` | `tour-height`* (420svh), `w-tcard`*, `h-tcard`*, gap-bento, pad-scene, violet-soft, `violet-a16`*, text-3 | Sí, mínimo (`lib/motion/center-active.ts`: índice activo por IntersectionObserver) | RSC + isla |
| **SectionIndicator** | `.pager` v6:219-235; vjs:176-202 | Líneas en el margen derecho, una por escena; activa más larga, 3 px, violet-soft. Oculto en el hero, durante el carrusel fijado y con celda ampliada; no se dibuja si el margen < 2.25rem. Cada línea es un botón de 2.25 × 1.125rem con nombre accesible que desliza a su escena. Reduced motion: solo funde | `violet-a30`*, `violet-a60`*, violet-soft, `z-pager`*, ease-out, `dur-pager`* (250 ms) | Sí (reglas de visibilidad y de margen en `lib/motion/active-section.ts`) | Cliente |
| **PagedScroll** | vjs:9-74; v6:17-20 | Solo con puntero fino y sin reduced motion: rueda (umbral 24, bloqueo 700 ms), flechas, AvPág/RePág, Espacio, Inicio y Fin → siguiente parada con `glide` (600-950 ms, cuártica). Paradas intermedias cada 85 % en escenas altas y una por tarjeta en el carrusel. Cede Espacio y flechas a controles; se desactiva con menú, paleta o celda abiertos. Anclas internas y el indicador usan el mismo `glide`. Sin puntero fino: `scroll-snap-type: y proximity` | `glide-min`* (600 ms), `glide-max`* (950 ms), `wheel-threshold`* y `wheel-lock`* como constantes de `lib/motion/paging.ts` leídas de tokens | Sí (`lib/motion/paging.ts`: `stops()`, `glide()`, interrupción, filtro de teclas) | Cliente (isla sin markup) |
| **Closing** | `.close` base:184-191, v6:143-145; html:148-155 | TwoToneHeading display-closing, Button solid lg «Escribir por WhatsApp» + Button ghost lg «Reservar 20 min», pista con KeyCap (oculta sin puntero fino). 100svh en la home | display-closing, text-3, gap tokens | No | RSC + KeyCap cliente |
| **SiteFooter** | `.foot` base:115-119; html:157-161 | Marca, navegación de pie (secciones, Área de clientes, Legal), revisión con fecha. La fecha sale de `build-info.json` | line, label, small, text, text-3, container, gutter | No | RSC |

---

## 2. Reutilización fuera de la home

| Componente | Sobre mí | Empresas / servicios | Negocios / tarifas | Proyectos y detalle | Blog y artículo | Contacto | Stack / CV | Área privada |
|---|---|---|---|---|---|---|---|---|
| Primitivas (Button, ArrowLink, Icon, IconTile, Kbd, Surface, TwoToneHeading, LiveDot, roles de texto) | sí | sí | sí | sí | sí | sí | sí | sí |
| SiteHeader, MobileMenu, CommandPalette, SiteFooter, SkipLink | sí | sí | sí | sí | sí | sí | sí | sí (cabecera con sesión) |
| Backdrop (quieto) | sí | sí | sí | sí | sí | sí | sí | sí |
| Scene + Bento + BentoCell | sí | sí | sí | resumen | índice | sí | sí | panel de inicio |
| CursorLight | sí | sí | sí | sí | sí | sí | sí | no (Operate: sin adorno) |
| SlidingList | — | lista de servicios | — | — | — | — | — | listas del panel |
| SegmentedControl + RateFigure | — | tarifas | mensual / puntual del mantenimiento | filtro App / Web | — | — | — | filtros |
| PackStrip | — | — | resumen arriba de los packs | — | — | — | — | pack contratado |
| CheckList | — | qué entrego | qué incluye cada pack | — | — | — | — | — |
| ChatBubble | — | — | — | — | — | — | — | chat IA y takeover (misma burbuja) |
| MiniChat | — | — | — | — | — | — | — | — |
| ProposalPrompt | — | — | entrada al generador | — | — | — | — | — |
| ProjectCard | — | — | — | listado (apilado) y relacionados en el detalle | — | — | — | — |
| PostTeaser | — | — | — | — | índice y relacionados | — | — | — |
| AboutSummary | cabecera de la página | — | — | — | — | — | — | — |
| Chip / Marquee | Chip | — | — | Chip (stack del proyecto) | Chip (etiquetas) | — | Chip en bloque (sin marquesina) | — |
| Closing | variante compacta | variante compacta | variante compacta | variante compacta | — | es la página | — | — |
| CtaRow | sí | sí | sí | sí | sí | sí | sí | — |

**Exclusivos de la home**: HeroSplit, HeroStage, GlyphScene, IntroFall, CycleBars, Backdrop animado, ProjectsTour fijado y su raíl, SectionIndicator, PagedScroll, ExpandedCell, MiniChat, Marquee (la única marquesina de la web, según `DESIGN.md`) y la variante 100svh de Closing y de Scene.

Nota para `ux`: en las páginas interiores el marco Scene no debe forzar 100svh (es un ritmo de la home). Se propone una prop `fill` activa solo en la home.

---

## 3. Decisiones cerradas (2026-09-29)

Resueltas. Las cuatro primeras las eligió Jose y la quinta el coordinador; en todos los casos se tomó la opción recomendada. Son vinculantes para el plan.

| # | Tema | Decisión | Consecuencia para la implementación |
|---|---|---|---|
| 1 | Celda ampliada | **Genérica, con un hueco `more`.** | Un solo `ExpandedCell` con la lógica modal en `lib/motion/expand-cell.ts`. Cada celda ampliable rellena `more` con un resumen y el enlace a su página. No se duplica la página interior dentro de la home. |
| 2 | Bento | **Composición manual en JSX.** | `<Bento><BentoCell span={7} tall>…</BentoCell></Bento>`. Sin JSON de layout ni registro de componentes. Un test por escena comprueba que hay tres celdas y que los `span` suman 12 por fila. |
| 3 | Escena de glifos | **Portar `scene.js` a `packages/glyph-scene` en TypeScript**, troceado según la API del diseño técnico §1.6.2, sin el código muerto de §4.1, con PRNG de semilla y los valores de la v6 (bloom 0.22, reflejo 0.35, Geist Mono). | Los parámetros de §1.6.2 son de la v4: se reescriben (ver §6). |
| 4 | Hero en móvil | **Vídeo y póster generados desde la misma escena; WebGL solo en escritorio.** | `HeroStage` tiene tres modos: escena (escritorio), vídeo (móvil) y póster (reduced motion, `saveData`, sin JS). Los medios los genera `packages/glyph-scene` con los valores de la v6. |
| 5 | Paginado y carrusel | **El paginado es un hook y el carrusel un componente.** | `usePagedScroll` se monta en una isla cliente sin markup (no hidrata `main`) y usa `lib/motion/paging.ts`. `ProjectsTour` es un componente con su pista y su raíl; la tarjeta activa sale de `lib/motion/center-active.ts`. |

Choques resueltos con `working-agreements.md`, corregidos en ese documento:

- **Degradación del carrusel (§6):** sin `animation-timeline`, las tarjetas se apilan en columna, como en el prototipo. No se usa `scroll-snap x`.
- **Grano y haces (§12):** la v6 sí los tiene (`.field` y `.grain`, html:34-35); el `Backdrop` se porta.

---

## 4. Deuda del prototipo que no se porta

### 4.1 Código muerto

| Qué | Dónde | Por qué es muerto |
|---|---|---|
| `compileBurst` y todo el sistema de chorros (`SM`, `sGeo`, `sMat`, `streams`, `perimeterPoints`) | scn:234-305; actualización por frame scn:414-415 | Nadie llama a `window.compileBurst`. **Además tiene coste**: `streams` se añade a la escena y se dibuja en cada frame con 9 000 puntos reservados |
| Puertas `.door`, `doorTarget`, `doorEl`, `doorsScale` | scn:310-316, 324-325, 335-336, 346-349 | No hay `.door` en la v6 (era de la v4, «Dos vías») |
| Ramas `doors`, `dim`, `phone` y el lado (`data-side`) en `targetFor`; estados dirigidos y `P.directedMorph` | scn:344-351, 355-366; `data-side="right"` html:38 | Solo existen `data-scene="cycle"` y `"off"`; `T.state` siempre es `null` |
| Evento `scene:ready` | scn:421 | Ningún listener |
| `P.green = 0` y la rama `vCol < uGreen` del shader | scn:11, 221 | Con 0 nunca se cumple |
| Comentarios de cabecera de la v4 y v5 | scn:1-4, base:1, bjs:1 | Describen una escena que recorre la home, «grafito» y «variantes» |
| `.chips`, `.posts`, `.nav__muted` | base:159-160, 175-178, 58, 66 | Sin uso en el HTML |
| Tokens sin uso `--bg-2`, `--surface-2`, `--r` | base:6-7, 26 | Sin uso |
| `glyph-chip-alpha.png` | carpeta home-v6 | No se referencia en ningún fichero |

### 4.2 Reglas duplicadas o sobrescritas

| Qué | Dónde | Qué se porta |
|---|---|---|
| `.rate-big b`: dos tamaños, uno con `!important` | v6:75 (clamp por cqi, `!important`) y v6:192 (clamp por vw) | Solo el de v6:75, sin `!important`, como token `figure` |
| `.todo` definido dos veces | base:38 y base:158 | Una vez (componente Pending) |
| `.packs` y `.pack` definidos en base y rehechos en v6 | base:162-167 frente a v6:71-73, 181-185 | Solo el comportamiento de v6 |
| `.about` definido en base y rehecho en v6 | base:212-214 frente a v6:62-63 | Solo v6 |
| `.lead`, `.sec-title` y `.close__title` con tamaño en base y otro en v6 | base:215 / v6:15; base:155 / v6:14; base:185 / v6:145 | Solo el de v6, como token tipográfico |
| `.plist li` con dos rejillas y fondo de la primera fila anulado con `!important` | base:171-172, v6:82, v6:176 | Solo la versión viva |
| `.seg` con `justify-self` dos veces | v6:86 y v6:188 | Una |
| `.surface` con radio 1.25rem que ninguna pieza usa | base:161 (lo sobrescriben v6:41 y v6:117) | Surface sin radio propio; lo recibe por variante |
| Fondos de `.cell--tint` y `.cell--hero` repetidos para apilar la luz del cursor | v6:43-44 y v6:154-155 | Un único `background-image` por capas con custom properties (`--cell-tone`, `--cell-light`) |
| `[hidden] { display: none !important }` | v6:217 | En el reset de `globals.css`, sin `!important` si no hace falta |

### 4.3 px fuera de las excepciones

Excepciones de `working-agreements.md` §8: hairlines y trazos, sombras, desenfoques y offsets de motion. Lo demás:

| Valor | Dónde | Al portar |
|---|---|---|
| `999px` en radios de píldora | base:85, 149, 160, 168; v6:162, 188, 189, 191 | Token `--r-pill` |
| Punto del chat `6px × 6px` | base:150 | `0.375rem` (token de tamaño) |
| Breakpoints `1080px`, `1081px`, `900px`, `700px` | base:80, 194, 195, 208 | `67.5rem`, `67.5625rem` (o `not (max-width: 67.5rem)`), `56.25rem`, `43.75rem`, como tokens de breakpoint. `design.json` los guarda aún en px |
| `margin-left: 2px` del cursor del campo | base:218 | `0.125rem` (el ancho de 2 px es trazo y se queda) |
| `outline-offset: 4px` de los packs | v6:182 | Token de anillo de foco (el global es 3 px, base:36); unificar |
| `+ 6` px para colocar la barra de packs | vjs:136 | Token `--gap-marker` leído en TS |
| `rg < 36` para ocultar el indicador | vjs:197 | Comparar con `2.25rem` leído del token, no con px que suponen 16 px de raíz |
| `min-height: 2.5rem` y demás medidas de burbuja | v6:169 | Ya en rem; se mantiene |

### 4.4 Literales de texto que pasan a messages

- **Todo el copy de index.html**: titulares, entradillas, etiquetas de celda, botones, enlaces, pie, fecha de revisión (sale de `build-info.json`).
- **Atributos**: todos los `aria-label` (html:18, 25, 26, 27, 29, 31, 47, 57, 63, 67, 75, 81, 93, 107, 135, 159, 162), `placeholder` de la paleta (html:164) y el `alt` del arte cuando deje de ser decorativo.
- **Datos embebidos**: `data-t` del mini chat (html:67), `data-examples` del campo de propuesta (html:99), lista de la marquesina y su `aria-label` (html:63; el stack es un dato, no copy, pero su etiqueta accesible sí se traduce).
- **JS**: `CMDS` completo con etiquetas, grupos, pistas y palabras clave (bjs:19-30), mensaje de «sin resultados» (bjs:40), nombres del indicador (vjs:180), `aria-label="Secciones"` (vjs:182).
- **Precios**: `900 €`, `1.400 €`, `2.500 €`, `4.200 €` (html:94), `40 €/h` y `desde 150 €` (html:81), y la pista `desde 900 €` de la paleta (bjs:22) salen de `packages/pricing`, formateados con `Intl.NumberFormat` por idioma, nunca escritos en messages.

### 4.5 Accesibilidad que el prototipo no resuelve y el port sí

- `<span class="plist__hl">` es hijo directo de `<ul>` (html:76): HTML inválido. Va fuera de la lista.
- Filas de Servicios y packs con `tabindex="0"` (vjs:129; html:94) que no hacen nada al activarse: foco sin acción. Hay que decidir con `ux` si cada fila enlaza a su detalle (propuesta: sí) o si deja de ser enfocable.
- SegmentedControl con `role="tab"` sin `tabpanel` ni `aria-controls` y sin tabindex itinerante (html:81).
- Enlaces `href="#"` (idioma, chat, login, CTAs): pasan a rutas reales.
- Contacto destacado en el menú por posición (`a:last-of-type`, base:73): pasa a variante explícita.

---

## 5. Tokens que faltan en `design.json`

**Tarea bloqueante de la fase 1 del plan** (ver §6). No se ha hecho todavía.

Los componentes solo pueden consumir tokens, así que esto bloquea el port. Hay que añadirlos en la tarea de tokens de la fase 2, con nombre semántico (working-agreements §2):

- **Alfas de violeta y blanco** que hoy son literales repetidos: violeta-luz al 6, 8, 10, 12, 14, 16, 18, 20, 30 y 60 %; blanco al 5, 7, 9, 10 y 28 % (brillos); índigo al 50, 60, 70 y 72 % (campo, selector, cabecera, velo); velo de la paleta. Se proponen nombres por uso (`--tint-hover`, `--tint-selected`, `--scrim`, `--header-scrolled`…), no por porcentaje.
- **Sombras** que `design.json` tiene en `extensions.shadows` pero no como tokens consumibles: botón, tecla, tecla grande y pulsada, capa superpuesta.
- **Desenfoques**: 4, 6, 14, 18 y 24 px, y el de los haces (5vmax).
- **Motion**: duraciones 90, 150, 160, 180, 200, 240, 250, 260, 360, 380 y 420 ms, 6 s, 38 s y 44 s; `ease-out`, `ease-slide` y `vt-cell` como tokens CSS (hoy son texto en `extensions.motion`); límites del glide y parámetros de la rueda para TS.
- **Capas** (z-index): 0, 1, 2, 20, 30, 31, 35 y 40.
- **Breakpoints** en rem (hoy en px en `extensions.breakpoints`) y los de contenedor (26, 24, 40 y 15rem, además de 34 y 52).
- **Degradados de superficie**: tecla grande y hueco de foto (#1f1a44 → #151233, #221d4d → #151233), tintes de celda (160° al 14 %, 135° al 20 %), resplandor del arte de proyecto.
- **`--r-pill`**, `--size-dot`, `--rounded-bubble-tail`, `--gap-cell` y la luz de celda (22 y 26rem, 9 %).

---

## 6. Pendientes para el plan (paso 5 del pipeline)

- **Fase 1, bloqueante:** completar en `.impeccable/design.json` los tokens de §5 (alfas, sombras, desenfoques, duraciones y easings, capas, breakpoints en rem y degradados) y regenerar `tokens.css`. Ningún componente de la home se porta antes, porque los CSS Modules solo pueden usar tokens.
- **Diseño técnico §1.6.2:** tiene los parámetros de la v4 (JetBrains Mono, bloom 0.3, reflejo 0.45, verde 14 %, `cloudCode`). Hay que reescribirlo con los de la v6 (`scene.js`: Geist Mono, bloom 0.22, reflejo 0.35, verde 0, nubes móvil, web y chip) y con la decisión 4 de §3 (vídeo en móvil y WebGL solo en escritorio).
