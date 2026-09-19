# joseCoded — sistema visual (UI) v2

**Fecha:** 2026-09-17 · **Versión:** 2.0 (reescrita desde cero para la dirección R14; sustituye a la v1 y a las tres direcciones A/B/C, rechazadas) · **Perfil:** web · **Entradas:** spec v1.4 §12 UI (R14) y D12, UX v2.1 §3 (shell IDE-lite, §3.6 hero, §3.7 motion) y §4.1 (home), `Comercial/voz.md`, estudio de referencias `2026-09-17-referencias-ui.md`.
**Prototipo navegable:** `ref/home-v3/index.html` (+ `styles.css`, `app.js`). Se abre con doble clic o con `python3 -m http.server 8765 --directory docs/superpowers/design/ref` → `http://localhost:8765/home-v3/`. Capturas en `ref/home-v3/capturas/`.

Lo que Jose decide viendo el prototipo está marcado **PENDIENTE DE JOSE**. Todo lo demás es la propuesta cerrada de `ui`.

---

## 0. Qué cambia respecto a las rondas rechazadas

| Rechazado (v1, A/B/C, colores-v2) | v2 |
|---|---|
| Superficies planas: un `background` y un borde | Cuatro capas por superficie: canto superior de luz, sombra interna inferior, gradiente de material, grano global (§3) |
| Motion "de plantilla": fade + 8 px | La interfaz se transforma: FLIP del elemento pulsado hacia la cabecera de la sección; el resto entra con escala + desenfoque; el hero compila y viaja a la barra de título (§4) |
| Fondo negro casi puro, un acento de relleno | Neutros fríos con temperatura (`#0c1113` / `#0f0d16`), dos luces de esquina y un acento que ilumina, no rellena (§2) |
| Tipografía "de web normal" | Sora para titulares (geométrica, futurista sin ser fría), Geist para texto y UI, Geist Mono solo para datos y código (§1) |
| Tarjetas por todo | Índice de secciones y proyectos sin caja: el hover añade brackets, flecha y previsualización; las superficies solo donde se compara o se elige (packs) (§5) |
| Efectos de fondo generativos (ruido de dominio, retícula, partículas) | Código real del proyecto que se sobreescribe carácter a carácter, por zonas y despacio, en tres capas a distinta escala y desenfoque, con un haz de luz que lo atraviesa (§4.1) |

---

## 1. Tipografía (tres familias, tres roles)

| Rol | Familia | Pesos | Dónde | Por qué |
|---|---|---|---|---|
| Titulares | **Sora** | 600, 700 | `h1` del hero y de sección, nombres de sección/proyecto/pack, títulos de bloque, precios | Geométrica con ojo grande: lee "tecnológico" sin parecer un IDE; tracking −0.02/−0.035 em la hace elegante a 40–64 px |
| Texto y UI | **Geist** | 400, 500, 600 | Cuerpo, árbol, pestañas, botones, formularios, admin | Grotesca neutra y muy legible a 13–17 px; rasgo `ss01`/`cv11` activado |
| Datos y código | **Geist Mono** | 400, 500 | Línea de estado, metaetiquetas (`web · next.js 16`), precios de extras, código del hero, estado "compilando", prefijos `->` | Solo donde UX §3.1 lo permite: nunca en cuerpo |

Google Fonts: `family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Sora:wght@500;600;700`. En el repo: `next/font/google` con `display: swap` y `adjustFontFallback`.

Escala (rem sobre 16 px):

| Token | Valor | Uso |
|---|---|---|
| `--fs-0` | 0.75 (12) | mono: meta, estado, chips |
| `--fs-1` | 0.8125 (13) | etiquetas UI, árbol hijos, notas |
| `--fs-2` | 0.9375 (15) | cuerpo compacto, botones, hechos de índice |
| `--fs-3` | 1.0625 (17) | cuerpo, lead corto, nombres del índice |
| `--fs-4` | 1.25 (20) | títulos de bloque, nombres de proyecto, rol del hero |
| `--fs-5` | 1.5 (24) | h1 de sección en móvil, precio de pack |
| `--fs-6` | clamp(1.75rem, 1.2rem + 1.8vw, 2.5rem) | h1 de sección (28–40) |
| hero | clamp(2.25rem, 1rem + 3.6vw, 4rem) | título del hero (36–64), una línea, `white-space: nowrap` |

Interlineado: titulares 1.04–1.12; cuerpo 1.5; hechos 1.4. Ancho de lectura `--read-w: 72ch`.

---

## 2. Color: dos variantes (PENDIENTE DE JOSE)

Ambas comparten neutros, jerarquía de texto por opacidad (Raycast R5) y reglas de contraste. Cambian el acento, la temperatura del fondo y las dos luces de esquina (activetheory A2). El prototipo lleva un conmutador `acento: verde · morado` en la línea de estado (escritorio) y en la hoja "Menú" (móvil); se recuerda en `localStorage.accent`.

### 2.1 Comunes

```css
--text: #edf1f5;                       /* 16.7:1 */
--text-2: rgba(237,241,245,.66);       /* 7.7:1 · secundario */
--text-3: rgba(237,241,245,.52);       /* 5.0:1 · terciario, mono 12 px (AA) */
--line: rgba(255,255,255,.07);         /* decorativo: separadores, bordes de superficie */
--line-strong: rgba(255,255,255,.34);  /* 3.1:1 · bordes de control (WCAG 1.4.11) */
--light-top: rgba(255,255,255,.11);    /* canto superior iluminado */
--light-top-hover: rgba(255,255,255,.22);
--shade-bottom: rgba(0,0,0,.38);       /* sombra interna inferior */
--focus: #ffffff;                      /* anillo de foco: 2 px, offset 3 px */
```

### 2.2 Verde (por defecto en el prototipo)

```css
--bg: #0c1113;  --bg-2: #10161a;  --bg-3: #151c21;
--accent: #46e3a3;        /* 11.6:1 sobre --bg: texto, marcadores, brackets */
--accent-strong: #2fcf8e; /* relleno del botón primario */
--accent-soft: #8ff0c8;   /* canto superior del botón primario */
--accent-ink: #071410;    /* texto sobre el primario: 9.4:1 */
--accent-a12/-a24/-a40: rgba(70,227,163,.12/.24/.40);   /* halos, luces */
--light-a: rgba(58,214,156,.16);   /* luz de esquina superior izquierda */
--light-b: rgba(96,120,220,.12);   /* luz de esquina inferior derecha (fría, complementaria) */
```

### 2.3 Morado

```css
--bg: #0f0d16;  --bg-2: #14111d;  --bg-3: #1a1624;
--accent: #b39cff;        /* 8.4:1 */
--accent-strong: #9d82ff; /* primario */
--accent-soft: #d2c4ff;
--accent-ink: #120c22;    /* 6.4:1 */
--accent-a12/-a24/-a40: rgba(179,156,255,.12/.24/.40);
--light-a: rgba(150,120,255,.17);
--light-b: rgba(70,200,190,.10);
```

Semánticos (iguales en ambas): éxito = el acento; aviso `#f5c451`; error `#ff7a7a` (ambos ≥ 7:1 sobre `--bg`); info = `--text-2`. Los estados nunca van solo por color (`StatusBadge` con texto).

**Regla de uso del color:** el acento aparece como luz (halos, cantos, marcadores de 6 px, brackets, línea de la pestaña activa, prefijos `->`) y en el relleno del único botón primario visible por pantalla. Nunca en texto corrido ni en fondos grandes. Las dos luces de esquina son fijas, muy desaturadas (`mix-blend-mode: screen`, `blur(60px)`) y no se mueven con el puntero (spec: sin foco de luz estático ni parallax de fondo; se mueven solo con el haz del hero).

Recomendación de `ui`: **verde**. Lee "publicado / ok / build en verde", conecta con la línea de estado y con la voz de Jose ("hecho", "publicado"); el morado queda más cerca de la estética IA que D12 prohíbe, aunque con estos neutros no parece plantilla. Es opinión: Jose decide en vivo con el conmutador.

---

## 3. Materiales

Cuatro materiales, cada uno con su receta exacta (todas en `styles.css`):

| Material | Receta | Dónde |
|---|---|---|
| **surface** (superficie sólida) | `background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015) 60%, rgba(255,255,255,.02))` · `border: 1px solid --line` · `box-shadow: inset 0 1px 0 --light-top, inset 0 -1px 0 --shade-bottom, 0 1px 2px rgba(0,0,0,.35)` · radio 14 px. Hover: canto a `--light-top-hover`, borde a .11, halo `0 0 0 1px --accent-a12, 0 18px 40px -22px --accent-a40` (elevación por luz y sombra, sin escala) | `PackCard`, capas de arquitectura, `ProposalCard`, tablas del admin |
| **glass** | `background: linear-gradient(137deg, color-mix(--bg-2 78%, transparent), color-mix(--bg 90%, transparent))` · `backdrop-filter: blur(10px) saturate(140%)` · `border: 1px solid --line` · `inset 0 1px 0 --light-top` | Solo `TitleBar`, `StatusLine` y los paneles de la hoja "Menú". Nunca en tarjetas |
| **frame** (marco de producto) | `aspect-ratio 4/3`, gradiente `--bg-3 → --bg-2`, `inset 0 1px 0 --light-top, inset 0 0 0 1px --line`; dentro, un "teléfono"/"ventana" con `0 0 0 1px rgba(255,255,255,.12)` y sombra larga. Hover: halo del acento por debajo (`radial-gradient` al 12 %) y el teléfono sube 6 % | `ProjectCard`, cabecera de ficha |
| **grano + viñeta** | Capa fija global con `feTurbulence` (baseFrequency .9, 2 octavas) al 2,8 % y dos luces de esquina | Todo el sitio; `aria-hidden` |

Botones (Raycast R3, cuatro sombras):

| Variante | Receta | Estados |
|---|---|---|
| **primary** | Relleno `linear-gradient(180deg, --accent-soft, --accent-strong 55%)`, texto `--accent-ink`, `box-shadow: 0 0 0 1px rgba(0,0,0,.45), 0 0 18px --accent-a24, inset 0 -1px .5px rgba(0,0,0,.28), inset 0 1px .5px rgba(255,255,255,.8)`, radio 10 px, alto 36 (44 en `--lg`) | hover: halo a `--accent-a40` y canto a .95 · active: `translateY(1px)` + sombra interna · focus-visible: anillo blanco 2 px / offset 3 · disabled: opacidad .45 · loading: etiqueta oculta + spinner de 14 px |
| **secondary** | `linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04))`, `0 0 0 1px --line-strong, inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.3)` | hover: gradiente a .13/.06 y sombra larga · resto igual |
| **ghost** | Sin fondo; texto `--text-2` → `--text` | igual |
| **textlink** | Subrayado de 1 px al 30 % que en hover pasa al acento y a 1,5 px | focus-visible: anillo |

Solo hay un `primary` visible por pantalla: en la barra de título ("Contacto", CTA global) y, en la vista, la primaria de esa vista (WhatsApp en Negocios; enlace de prueba en la ficha). En la home la única primaria es la de la barra.

---

## 4. Vocabulario de motion

Duraciones y easings únicos (tokens en `styles.css`; GSAP usa `power3.out` / `power3.inOut`):

| Token | Valor | Uso |
|---|---|---|
| `--t-micro` | 160 ms · `cubic-bezier(.2,.7,.2,1)` | hover, foco, active, cambio de color/sombra |
| `--t-state` | 220 ms · mismo | roll de texto (clon), despliegue del árbol, pestaña activa, chips de previsualización |
| `--t-morph` | 520 ms · `power3.inOut` | FLIP entre secciones |
| `--t-reveal` | 640 ms · `power3.out` | entrada de bloques por scroll (stagger 70 ms) |
| Lenis | `lerp: .11`, `smoothWheel`, `syncTouch: false` | scroll suave solo con rueda; táctil nativo; barra propia de 4 px que aparece al hacer scroll |

### 4.1 Hero de presentación (UX §3.6, tiempos respetados: 3,3 s escritorio / 2,3 s móvil)

| Estado | Escritorio | Qué se ve |
|---|---|---|
| `boot` | 0 ms | Shell atenuado al 35 %. Tres capas de código real (gateway Hono, página RSC, migración SQL con RLS) a escala 1 / .82 / .66, desenfoque 0 / 1,2 / 2,6 px y opacidad .22 / .13 / .08, enmascaradas en radial. Semilla mono `build("Jose Carlos Sánchez")`. Enlace "Saltar" arriba a la derecha, primero en el orden de tabulación tras "Saltar al contenido" |
| `compiling` | 50–1.200 ms | Cada carácter del título cicla dos glifos y resuelve de izquierda a derecha en ≤ 900 ms; al resolver, pasa de Geist Mono (`--text-2`) a Sora (`--text`). Etiqueta mono `compiling…` → `ok · 1200 ms`. El haz de luz (`.hero-beam`, `mix-blend-mode: screen`, blur 20 px) recorre el código en 16 s ida y vuelta, rotado 16–22°; nunca estático |
| `typing` | 1.200–2.000 ms | Línea de rol con barrido de luz (máscara `linear-gradient` de 0 → 100 %, 560 ms), tres hechos escalonados 80 ms, CTAs "Proyectos" (primary) y "Contacto" (secondary): lo más nítido y estable de la pantalla |
| `hold` | 2.000–2.600 ms | Sin cambios |
| `minimizing` | 2.600–3.300 ms | `Flip.fit` del título hacia el nombre de la barra de título (transform + scale, 700 ms `power3.inOut`); rol, hechos y CTAs se atenúan en 180 ms; el fondo de código se apaga; el shell recupera brillo; **la home entra desde abajo mientras el título viaja** (stagger 70 ms, y 36 → 0) |
| `ready` | ≥ 3.300 ms | Idéntico a una visita repetida. `localStorage.hero_seen = AAAA-MM-DD` |

Código de fondo (implementación, `CodeLayer` en `app.js`): cada capa es un `<pre>` de 38 líneas × 96 columnas (34 × 60 en móvil) con un `<span>` por línea. Cada 110–190 ms (distinto por capa) avanza hasta 5 "cabezales" que reescriben un tramo de 6–22 caracteres de una línea hacia el siguiente snippet, dejando 1–2 glifos "en vuelo" en el acento. Solo se tocan las líneas afectadas (≤ 5 por tick, `textContent`), nunca la capa entera; medido en el prototipo: ~100 fps en Chromium con GPU durante el hero y el scroll.

Saltar: cualquier `pointerdown`, `wheel`, `touchstart` o `keydown` → `ready` en 180 ms. Repetir: "Repetir presentación" al final del bloque Presentación y clic en el nombre desde la home (no toca `hero_seen`). `prefers-reduced-motion` (y `?motion=reduce` para probar): sin hero, sin Lenis, sin scramble, sin FLIP; "Repetir presentación" no se muestra.

### 4.2 Morph entre secciones (Home → Negocios · Home → Proyectos → ficha · árbol → cualquier sección)

1. Antes de desmontar la vista, `Flip.getState` de todos los `[data-flip-id]` visibles (nombre y hecho de cada entrada del índice; nombre y marco de cada proyecto; la etiqueta del nodo del árbol pulsado, que recibe el id al vuelo).
2. La vista saliente pasa a `position:absolute` en su misma posición visual y se va con `opacity 0 + blur(8px) + y −10` en 240 ms; sus anclas se ocultan para que no haya dobles.
3. La vista entrante se monta arriba (`lenis.scrollTo(0, immediate)`); `Flip.from(state, { targets: '[data-flip-id]', duration: .52, ease: power3.inOut, scale: true })` hace que el **nombre del índice se convierta en el `h1`** (y el marco del proyecto en el marco grande de la ficha). La cabecera dibuja su línea de acento en 300 ms; el resto de bloques entra con `opacity 0, scale .97, blur(8px), y 16 → 1, 1, 0, 0` en 420 ms, stagger 50 ms (activetheory A7).
4. Foco al `h1` (`tabindex=-1`), `document.title`, pestaña y nodo del árbol sincronizados, `pushState` con hash de ruta (`#/negocios`, `#/proyectos/oportunix`). El botón atrás deshace la navegación con la misma transición.

Solo se animan `transform`, `opacity` y `filter`. Las anclas tienen `width: fit-content` para que el escalado no deforme el texto.

### 4.3 Scroll

- **Revelado por capas**: cada `.reveal` entra al 92 % del viewport, una vez: hijos con `y 18, opacity 0, blur(6px)` → limpio, stagger 70 ms. El `h2` hace `CompileReveal`: 260 ms mostrando `section: <título>` en mono/acento y luego el título.
- **Cómo está hecha esta web**: cinco placas (`.arch-layer`) con `rotateX(7deg)` y `translateZ` negativo por profundidad; al hacer scroll (scrub 0,6 s entre el 75 % y el 55 % del viewport) la separación pasa de 14 a 52 px y una "espina" de acento crece uniendo las etiquetas `01–05` (igloo I4/I5). Sin pinning.
- **Paralaje de profundidad mínimo**: los marcos de proyecto se desplazan ±10 px respecto a su texto (solo escritorio). Nada de parallax de fondo ni scroll horizontal.

### 4.4 Micro-detalle (todo ≤ 220 ms)

| Elemento | Hover | Foco visible | Active / estado |
|---|---|---|---|
| Nodo del árbol | fondo .045 + canto de luz; la etiqueta hace roll de una línea (clon, lusion L6) | anillo | `aria-current`: gradiente, marcador de 6 px en acento con halo, caret girado; rama abierta con `max-height` + `visibility` (los hijos plegados no reciben foco) |
| Pestaña | color + roll de la etiqueta; "×" aparece | anillo | activa: canto de luz y línea de 1 px en acento con halo; cierre por "×" |
| Entrada del índice | fondo .035, brackets de esquina en acento (igloo I6), flecha `->` entra desde −6 px, previsualización (chips con hechos) se despliega 34 px | mismo que hover + anillo | active: fondo .05 |
| Proyecto | marco: canto a .22, halo del acento, el teléfono sube; nombre: `->` de 16 px; chips de prueba se aclaran | anillo en el enlace | — |
| Botón primario | halo a `--accent-a40` | anillo blanco (visible sobre el acento) | `translateY(1px)` + sombra interna |
| Línea de estado | ítems del build pasan de `--text-3` a `--text-2`; enlaces con roll | anillo | punto verde del build con halo |
| Barra de título | nombre estable; rol de `--text-3` a `--text-2` al pasar por el nombre | anillo | clic en el nombre: Inicio (o repetir el hero desde la home) |
| Hoja "Menú" (móvil) | — | anillo; foco atrapado; Escape y deslizar hacia abajo cierran | tres paneles en cascada (y 24 → 0, stagger 60 ms, lusion L5) |
| Control segmentado | texto a `--text-2` | anillo | activo: cápsula con gradiente y canto de luz |

---

## 5. Inventario de componentes (mapeo a shadcn)

Base: Tailwind 4 + shadcn (estilo `new-york`, `--radius: 0.625rem`), tokens de §2 en `@theme` de `globals.css`. Se usa el componente de shadcn cuando existe; los de abajo marcados "propio" no tienen equivalente y se escriben sobre primitivas de Radix.

| Componente (UX §3.10) | shadcn / base | Notas de `ui` y estados |
|---|---|---|
| `AppShell` | propio (grid CSS) | Filas `titlebar 56 · tabs 40 · panel 1fr · status 40`; columnas `264px 1fr`. El panel es el único con scroll (Lenis con `wrapper`). Móvil: `52 · 1fr · 56` |
| `TitleBar` | propio, material **glass** | Nombre en Sora 20/600 (destino del FLIP), rol 13/`--text-3`, `Button` primary "Contacto", `Button` icon (chat), enlace "Entrar", `LangSwitch` |
| `SiteTree` | propio sobre `nav > ul[role=tree]` (sin `Accordion`: el estado accesible se lleva con `aria-expanded` y `max-height`) | Nodos de 36 px (hijos 32), marcador de 6 px, caret de 6 px; flechas ↑↓ Home End entre nodos visibles; plegado a iniciales (pendiente de implementar en el prototipo) |
| `Tabs` (rutas abiertas) | propio (enlaces, no `role=tablist`) | Máximo 6, `sessionStorage`; degradable a migas si estorban |
| `StatusLine` | propio, material **glass**, `footer[role=contentinfo]` | Mono 12: rama · commit · fecha · LCP; derecha: conmutador de acento (solo prototipo), Chat, Entrar, ES. Móvil: tres objetivos de 44 px con separadores |
| `HeroIntro` | propio (GSAP core + Flip) | Estados §4.1; `aria-label` del nombre desde 0 ms; `aria-live=off` |
| `CompileReveal`, `FocusLight` | propio (ScrollTrigger) | `FocusLight` de UX se sustituye por el haz del hero + las luces de esquina fijas (spec R14: sin foco estático); el "foco" de bloque es el revelado por capas |
| `SectionIndex` | propio (`ul > li > a`) | Dos columnas en escritorio, una en móvil; previsualización oculta en móvil (ya es el acceso de un toque) |
| `FactList` | propio | Numeración mono en acento (`01`), sangría 40 px |
| `ProofStrip` | chips `.proof` (`Badge` variante `outline` de shadcn con estos tokens) | Mono 11, canto de luz |
| `PackCard` | `Card` de shadcn con material **surface** | Sin "recomendado"; `PriceTag` dentro |
| `ExtraCard` | fila con `border-top` (sin tarjeta) | Nombre llano + sigla, precio mono en acento |
| `PriceTag` | propio | "Desde" 13/`--text-3`, valor Sora 24/600, "sin IVA" mono 12; sin tachados |
| `ProjectCard` | propio, material **frame** | Sin caja: marco 4:3, meta mono, nombre Sora 20, hecho, chips de prueba |
| `PostCard` | propio | Fila con flecha `->` que entra al hover |
| `Button` | `Button` de shadcn con variantes `primary` / `secondary` / `ghost` / `link` reescritas con las recetas de §3 | 36 px (44 en CTA y móvil) |
| `Segmented` (filtros) | `ToggleGroup` de shadcn | Cápsula con canto de luz |
| `Sheet` (Menú móvil) | `Sheet`/`Dialog` de shadcn (Radix) para foco y Escape; contenido en tres paneles **glass** en cascada | ≤ 86 vh, cierre deslizando |
| `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` (generador, contacto) | shadcn tal cual | Borde `--line-strong`, foco: anillo blanco; error: borde `#ff7a7a` + texto; los chips del generador son `ToggleGroup`/`RadioGroup` reales |
| `Toast`, `Skeleton`, `DataTable`, `Badge`, `Tooltip`, `DropdownMenu`, `Avatar` | shadcn tal cual (`sonner` para toasts) | `Skeleton` con el gradiente de **surface**; `StatusBadge` = `Badge` + texto |
| `GuidedChat`, `ProposalCard`, `CalEmbed`, `AuthProviders`, `RefNotice`, `OfflineBanner` | propios sobre shadcn | Fuera de este prototipo; heredan materiales y motion de §3–§4 |

Iconografía: un solo set de trazo (Lucide, 1,4–1,5 px, 18–20 px), sin duotono ni relleno; usos: chat, cerrar, caret, proveedores de auth, stores, WhatsApp.

---

## 6. Accesibilidad y rendimiento (comprobado en el prototipo)

- Contraste: `--text` 16,7:1, `--text-2` 7,7:1, `--text-3` 5,0:1 (también sobre `--bg-3`), acento 11,6:1 (verde) / 8,4:1 (morado), texto sobre primario 9,4:1 / 6,4:1, bordes de control 3,1:1.
- Foco visible en todo: anillo blanco de 2 px con offset de 3 px; probado con Tab sobre árbol, índice, enlaces y pestañas. Los hijos plegados del árbol no reciben foco (`visibility: hidden`).
- Objetivos ≥ 44 px en móvil (línea de estado, CTAs, hoja de menú); 36 px mínimos en escritorio para botones secundarios.
- `prefers-reduced-motion`: sin hero, sin Lenis, sin scramble, sin FLIP, sin revelados; las capas de arquitectura se muestran ya separadas.
- 375 px: sin desbordamiento horizontal (`scrollWidth` = 375 en `html` y en el panel).
- Rendimiento: solo `transform` / `opacity` / `filter` en animaciones; el código de fondo actualiza ≤ 5 líneas por tick con `textContent`; ~100 fps medidos en Chromium con GPU durante el hero y el scroll (1440×900). Presupuesto para el repo: hero ≤ 60 KB de JS (GSAP core + Flip + ScrollTrigger + Lenis ≈ 55 KB gzip) cargado tras el LCP. En el repo, el estado `ready` debe llegar renderizado en servidor (sin JS se ve la home completa); en el prototipo el contenido lo monta JS.
- Consola limpia en escritorio y móvil.

---

## 7. Limitaciones del prototipo y siguientes pasos

- Las secciones Empresas, Blog, Sobre mí, Contacto, Chat y Propuesta son cabeceras con morph y un párrafo; el resto del contenido se diseña tras aprobar esta dirección.
- El árbol no tiene aún el estado plegado a iniciales ni recuerda su estado; las pestañas no capturan Ctrl/Cmd+W.
- Capturas de producto en los marcos: son abstracciones (barras y bloques); las reales llegarán de las apps.
- Los `{{DATO}}` van con subrayado punteado y `data-placeholder` (nombre, ciudad, estados de HazmeFila/Oportunix, certificaciones, número de artículos, métricas del build).
- Reduced motion probado con el override `?motion=reduce`, no con la preferencia del sistema.
- La previsualización del índice empuja las filas siguientes 34 px al desplegarse; si molesta, se convierte en superposición.
