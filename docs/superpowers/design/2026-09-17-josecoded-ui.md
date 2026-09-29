# joseCoded — sistema visual (UI) v3

> **SUPERADO (2026-09-29).** El sistema visual vigente es `DESIGN.md` + `.impeccable/design.json` (v6, «El lanzador de código»: índigo `#07060F`, Geist/Geist Mono, violeta `#7C6CFF`, tokens generados con `pnpm tokens:build`) y el contrato `.impeccable/surfaces/docs-superpowers-design-ref-home-v6-index-html.md`. Este documento (derivado de `hero-lab-3`, Sora/Manrope/JetBrains Mono, `ui-v3/`) se conserva como histórico; no se usa como insumo de ninguna tarea del plan.

**Fecha:** 2026-09-17 · **Versión:** 3.0 (2026-09-19, reescrita desde cero a partir del hero aprobado `ref/hero-lab-3/`; sustituye a la v2 y a las direcciones A/B/C) · **Perfil:** web · **Entradas:** spec v1.5.2 (§12 D16, §13 Radar), UX v3.2 (§3 navegación clásica, §4.1 home con la alternativa B del subtítulo, §4.2–4.13, §5, §6, §7 con Radar §7.12–7.18, §8, §12, §13), diseño técnico v1.2.1 (§1.6 `GlyphScene`, `HeroMedia`, `IntroFall`; sin Lenis; P11–P15), `Comercial/voz.md`.
**Referencia navegable:** `docs/superpowers/design/ref/ui-v3/index.html` (+ `tokens.css`, `styles.css`, `ui.js`). Se abre con doble clic (todo es `file://`-compatible: CSS y JS clásico enlazados, la escena Three.js va inline con importmap a jsDelivr) o con `python3 -m http.server 8765 --directory docs/superpowers/design/ref` → `http://localhost:8765/ui-v3/`. Vistas: `#home` (home completa, 8 bloques), `#radar` (bandeja), `#radar-detalle` (detalle de candidatura), `#kit` (estados de los primitivos). `?intro=1` fuerza la intro; `?live=1` fuerza la escena viva en móvil (stand-in de `HERO_LIVE_MOBILE`).

Regla de este documento: **todo deriva del hero aprobado**. Cada token cita de dónde sale en `hero-lab-3/styles.css` o `app.js`; lo que no está en el prototipo se deduce de él (mismo material, misma luz, misma monoespaciada) y se marca como decisión de `ui`.

---

## 0. Qué se toma del hero y qué se extiende

| Pieza del prototipo | Token o regla derivada | Dónde se extiende |
|---|---|---|
| `--bg: #050510` (CSS) / `setClearColor(0x05060f)` (renderer) | `--bg: #05060f` (se toma el del renderer: es el que pinta el 60 % de la home) | Toda la web, área y admin |
| `--text` `#f2eefc` con jerarquía por opacidad `.66` / `.4` | `--text`, `--text-2` (.66), **`--text-3` sube a .56** porque el .40 del prototipo da 3,4:1 y no pasa AA; el .40 queda como `--text-dim`, solo decorativo | Todo texto secundario y etiquetas mono |
| `--accent #a78bfa` + `--green #34d399` | `--violet` (acción, foco, halo) y `--green` (OK, activo, aterrizaje). Se añaden `--amber` y `--red` con el mismo tratamiento (chip al 14 %, texto pleno) | Semánticos de área, admin y Radar |
| Botón primario: relleno `--accent`, texto `#12062a`, canto superior de luz + sombra interna inferior + halo | `--edge-primary` (idéntico) y su versión hover; el mismo patrón de "canto de luz" se aplica a superficies (`--edge-surface`) y al badge (`--edge-halo`) | Botones, paneles, tarjetas, modales |
| Badge píldora con `inset 0 0 0 1px` de acento y halo | `--edge-halo`; los chips de filtro y contadores son la misma píldora sin halo | Chips, contadores, segmentos |
| `border-radius: 999px` en botones y badge; `12px` en el panel de ajustes | `--r-pill` (botones, chips), `--r-md 12` (filas, popovers), `--r-lg 16` (paneles), `--r-xl 18` (PathPanel, HeroMedia, hojas) | Todo |
| Sora 700 −.04em / Manrope / JetBrains Mono 11 px `.08em` mayúsculas (`.stateLabel`) | Roles tipográficos y `.eyebrow` | Etiquetas mono de ProofStrip, PathPanel, pie, tablas del admin |
| `--ease: cubic-bezier(.2,.7,.2,1)`, `.18s` en hover, `1s` de fundido del canvas, `.25s` del destello `is-wet` | `--t-hover 180`, `--t-flash 250`, `--t-fade 1000`, `--t-fast 120`, `--t-enter 160`, `--t-reveal 300` | Motion de §2 |
| Grano SVG 180 px al 3,5 % `overlay`; rayo 214° / 14 % / blur 48 px / 10 % con máscara al 55 % | `Backdrop` (§1.6), sin JS, común a lo público | Público, auth, errores; el admin lo conserva atenuado |
| `.ch.is-falling` (acento .8) → `.ch.is-wet` (verde con halo 14 px) | Vocabulario de `IntroFall` y `CompileReveal` v3 | Home (intro) y `h2` públicos |
| Intro: caída 0,4–1,2 s, `is-forming` en badge y botones | `IntroFall` con los mismos números (diseño técnico §1.6.4) | Solo `/` y `/en` |

Lo que **no** se extiende: retícula de puntos y deriva de brillo (existen en el prototipo, apagadas; no se implementan), el panel de ajustes (`.panel`) y la etiqueta con texto "móvil · web · IA · chip" (fuera de producción, §5.21).

---

## 1. Tokens definitivos

Fuente de verdad en código: `docs/superpowers/design/ref/ui-v3/tokens.css` (bloque `:root`). En el repo van a `apps/web/app/globals.css` tal cual, seguidos del puente `@theme inline` de §1.8.

### 1.1 Color

Contraste calculado (WCAG 2.x) sobre `--bg #05060f` y sobre las superficies compuestas (`surface-1` ≈ `#0c0d16`, `surface-3` ≈ `#191a22`, `popover #10111c`). Umbral: 4,5:1 para texto, 3:1 para bordes y elementos gráficos.

| Token | Valor | Sobre bg | Sobre surface-3 | Uso |
|---|---|---|---|---|
| `--bg` | `#05060f` | — | — | Fondo de página (renderer del prototipo) |
| `--bg-2` | `#090a15` | — | — | Zonas hundidas: pie, barra lateral del admin, barras inferiores (con `.9` + blur) |
| `--surface-1` | `rgb(255 255 255 / .03)` | — | — | Panel en reposo (badge del prototipo) |
| `--surface-2` | `rgb(255 255 255 / .05)` | — | — | Panel hover, fila activa, burbuja del asistente |
| `--surface-3` | `rgb(255 255 255 / .08)` | — | — | Pulsado, tag neutro, pista del switch |
| `--popover` | `#10111c` | — | — | Opaco: menús, hojas, modales, toasts, tooltips |
| `--line` / `--line-2` / `--line-3` | texto al .10 / .16 / .24 | — | — | Separadores y bordes (reposo / hover o input / foco) |
| `--text` | `#f2eefc` | 17,7 | 15,2 | Texto principal; `h1` del hero en `#fff` como el prototipo |
| `--text-2` | texto al .66 | 7,8 | 6,7 | Secundario: subtítulo, hechos, meta |
| `--text-3` | texto al .56 | 5,8 | 5,0 | Mínimo para texto: etiquetas mono de 11 px, ayudas, datos del build |
| `--text-dim` | texto al .40 | 3,4 | — | **Nunca texto informativo**: flechas `›`, `→` decorativas, placeholders de la referencia |
| `--text-inverse` | `#12062a` | 7,1 sobre `--violet` | — | Texto del botón primario |
| `--violet` | `#a78bfa` (`--violet-rgb: 167 139 250`) | 7,4 | 6,4 | Acción primaria, foco, halo, enlace activo, `mark` de referencias |
| `--violet-text` | `#c4b5fd` | 10,9 | 9,4 | Texto sobre `--violet-soft`; enlaces del admin al hover |
| `--violet-soft` | violet al .14 | — | — | Fondo de chip activo, tag "Preparada", aviso informativo |
| `--green` | `#34d399` (`52 211 153`) | 10,5 | 9,0 | OK, activo, aterrizaje, tramo alto, "Nuevo" |
| `--green-soft` / `--green-ink` | green al .14 / `#04140d` | — | 9,8 sobre green | Tag "Enviada", control de plantilla OK / texto sobre verde pleno |
| `--amber` | `#fbbf24` (`251 191 36`) | 12,1 | 10,4 | Aviso, plazo < 48 h, tramo medio, "Pausado", badge "Agenda completa" |
| `--amber-soft` | amber al .14 | — | 9,7 (texto amber) | Tag y alerta de aviso |
| `--red` | `#f87171` (`248 113 113`) | 7,3 | 6,3 | Error, plazo < 24 h, "Detenido", destructivo |
| `--red-soft` / `--red-ink` | red al .14 / `#2a0a0a` | — | 6,3 (texto red) / 6,6 sobre red | Tag y alerta de error |

Reglas:
- **Nunca solo color**: cada estado lleva texto (tag, `score__t`, `DeadlineTag`). El color refuerza.
- El acento **ilumina, no rellena**: solo el botón primario y el `mark` de referencias tienen relleno violeta pleno. Todo lo demás usa `-soft` (14 %) o borde/halo.
- Un solo verde pleno por pantalla como máximo con halo (`--glow-green`: punto del badge, switch activo). El resto de verdes son texto o `-soft`.
- Fondos con alfa sobre `--bg` en lugar de hexadecimales: así las superficies encajan sobre el `Backdrop` y sobre el canvas sin costuras. Los overlays (`--popover`) son opacos para que el desenfoque del fondo no los ensucie.

### 1.2 Tipografía

Tres familias, tres roles, cargadas con `next/font/google` (`display: swap`, `adjustFontFallback`); en la referencia, Google Fonts.

| Rol | Familia y pesos | Dónde | Regla |
|---|---|---|---|
| Titulares | **Sora** 600, 700 | `h1` (hero 700), `h2` de bloque, `h3` de tarjeta y panel, precio de pack (600), número grande de `ScoreBadge` | `letter-spacing` −.04em en el hero, −.03em en `h2`/`h1` interior, −.02em de 20 a 24 px. Interlineado .98 (hero) / 1.08 |
| Texto y UI | **Manrope** 400, 500, 600, 700 | Cuerpo, botones (600), navegación, formularios, admin, burbujas | Interlineado 1.5 (cuerpo), 1.65 (lectura del blog), 1.35 (UI compacta). 600 para acciones y nombres; 700 solo en `.rcard h3` |
| Datos, código y etiquetas | **JetBrains Mono** 400, 500, 600 | Marca `josecoded`, `.eyebrow` (11 px, mayúsculas, `.08em`), tags, `ScoreBadge`, `DeadlineTag`, `MailTag`, meta de `PostCard`, esquema de `BuildFacts`, "Esta web" del pie, cabeceras de tabla, versión de material, editor Markdown, OTP, atlas de la escena (600) | Nunca en cuerpo ni en botones. La mayúscula con tracking solo en `.eyebrow` y `th` |

Escala (rem sobre 16 px; nombres = tokens de `tokens.css`):

| Token | px | Uso |
|---|---|---|
| `--fs-2xs` | 11 | mono: eyebrow, `score__t`, cabeceras de tabla, "Esta web", `saved` |
| `--fs-xs` | 12 | mono: tags, `DeadlineTag`, `MailTag`, meta, `kv dt` |
| `--fs-sm` | 13 | UI compacta: admin, chips, ayudas, errores de campo, notas, `ProjectCard p` |
| `--fs-base` | 15 | UI: botones, inputs, hechos de panel, ProofStrip, cuerpo compacto |
| `--fs-md` | 17 | Cuerpo de lectura: blog, fichas, `block__lead`, `h2` de sección del detalle |
| `--fs-lg` | 20 | Subtítulo del hero en escritorio (`clamp(16px, 1.4vw, 20px)`), `h3` de tarjeta, título de modal |
| `--fs-xl` | 24 | `h3` de PathPanel y PostCard, precio de pack, `h2` del kit |
| `--fs-2xl` | 32 | `score__n` grande; `h2` de bloque en móvil (mínimo del clamp es 28) |
| `--fs-h2` | `clamp(28, 1.2rem + 1.8vw, 40)` | `h2` de bloque (home y públicas) |
| `--fs-h1` | `clamp(36, 1.5rem + 2.6vw, 56)` | `h1` de página interior |
| `--fs-hero` | `clamp(48px, 6.4vw, 104px)` escritorio · `clamp(40px, 11vw, 64px)` móvil | `h1` del hero (prototipo). A 375 px = 41 px, que es lo que asume el presupuesto de UX §4.1 |
| admin `h1` | 26 (22 en móvil) | Título de sección del admin; el admin no usa `--fs-h1` |

Ancho de lectura `--read: 72ch`; hero izquierda `--hero-left: 620px` (prototipo); contenedor `--container: 1440px` con `--gutter: clamp(20px, 4vw, 56px)` (prototipo) y `--gutter-m: 16px` en móvil.

### 1.3 Espaciado (escala de 4 px)

`--sp-1 4 · 2 8 · 3 12 · 4 16 · 5 20 · 6 24 · 8 32 · 10 40 · 12 48 · 16 64 · 20 80 · 24 96 · 32 128`.

| Contexto | Valor |
|---|---|
| Bloque de la home / página pública | `padding: 96px gutter` escritorio · `64px 16px` móvil; `ProofStrip` 48 px arriba y abajo |
| Cabecera | 64 px de alto (`--header-h`); hero `padding-top` 96 (escritorio) / 88 (móvil) |
| Hero (prototipo) | badge → `h1` 28 px (20 móvil) · `h1` → subtítulo 26 (16) · subtítulo → CTA 36 (24) · gap entre CTA 22 (16) · gap de columnas 24 |
| Panel (`.panel`, `.sect`) | 28/24 px escritorio (PathPanel), 18–22 px en tarjetas y secciones del admin, 20 en móvil |
| Tarjetas en rejilla | gap 24 (paths), 20 (proyectos), 16 (móvil); listas del admin gap 10 |
| Tabla del admin | celdas `10px 12px`, filas 52 px; primera columna 16 px |
| Formularios | gap entre label y campo 6; entre campos 16; acciones 18 por encima |
| Overlays | modal `22px 22px 18px`; hoja `12px 20px 24px` (móvil) / 24 (escritorio) |
| Objetivo táctil | `--tap: 44px` en móvil para todo lo pulsable (botones `btn--md`, chips `chip--tap`, enlaces de nav, acciones de fila) |

### 1.4 Radios

| Token | px | Uso |
|---|---|---|
| `--r-pill` | 999 | Botones, badge, chips, contadores, segmento, switch, skip-link |
| `--r-sm` | 8 | Inputs, textarea, select, tags rectangulares, celdas OTP, `pre` de código, `mark` (3) |
| `--r-md` | 12 | Tarjetas de lista (`.card`, `.rcard`, `PostCard` del blog), popovers, toasts, alertas, `.inbox`, miniatura de PathPanel |
| `--r-lg` | 16 | Paneles (`.panel`, `.sect`), PackCard, ProposalCard, ProjectCard, modales, retrato |
| `--r-xl` | 18 | PathPanel, `HeroMedia`, hojas móviles (esquinas superiores), marco de móvil (18/12 interior) |

Regla: el radio crece con el tamaño de la pieza; nunca un radio grande en un elemento pequeño (los tags son 8, no píldora, para distinguirlos de los chips pulsables).

### 1.5 Cantos de luz y sombras

Todo sale del botón primario del prototipo: **un anillo de 1 px, un canto superior claro, una sombra interna inferior y un halo de color por debajo**. Sin sombras negras proyectadas en superficies (solo en overlays).

| Token | Valor | Uso |
|---|---|---|
| `--edge-primary` | `0 0 0 1px violet/.6, inset 0 1px 0 #fff/.35, inset 0 -1px 0 #000/.18, 0 10px 30px -10px violet/.7` | Botón primario (idéntico al prototipo) |
| `--edge-primary-hover` | anillo .9, canto .45, halo `0 14px 40px -10px violet/.9` | Hover del primario |
| `--edge-surface` | `inset 0 0 0 1px line, inset 0 1px 0 #fff/.04` | Paneles y tarjetas en reposo: borde fino + canto superior apenas visible |
| `--edge-surface-hover` | `inset 0 0 0 1px violet/.45, inset 0 1px 0 #fff/.06, 0 0 24px -8px violet/.6` | Hover/focus-within de panel-enlace (PathPanel, ProjectCard, PostCard, PackCard); también `ProposalCard` en reposo (es la pieza que se mira más tiempo) |
| `--edge-halo` / `-hover` | badge del prototipo | Badge del hero |
| `--shadow-overlay` | `0 24px 60px -20px #000/.75, inset 0 0 0 1px line, inset 0 1px 0 #fff/.05` | Modal, hoja, toast, tooltip, menú |
| `--glow-green` | `0 0 10px green/.9` | Punto del badge, switch activo, destello `is-wet` (14 px) |
| Foco | `outline: 2px solid var(--violet); outline-offset: 3px` (2 px en inputs) | Todo lo enfocable; en tabla, la fila con foco añade `inset 2px 0 0 violet` |

### 1.6 `Backdrop` (grano + rayo), fijo

Dos `div` `aria-hidden` en `position: fixed`, `z-index: 1`, sin JS ni scroll-driven (diseño técnico §1.6.1):
- Grano: ruido SVG `feTurbulence .85 / 2 octavas`, `background-size: 180px`, `opacity: .035`, `mix-blend-mode: overlay`.
- Rayo: `linear-gradient(214deg, transparent 36%, violet/.9 50%, transparent 64%)`, `filter: blur(48px)`, `transform: scale(1.3)`, `opacity: .10`, `mix-blend-mode: screen`, máscara vertical que lo desvanece del 55 % al 100 %.
- `body`: dos radiales del prototipo (violet .08 arriba a la derecha, green .05 abajo a la izquierda) con `background-attachment: fixed`.
- Ámbito: todas las páginas públicas, auth y errores. En admin y área se mantiene (es el mismo producto) pero la barra lateral y las barras inferiores son opacas al 90 % con blur para que la densidad no compita con el rayo.

### 1.7 Capas

`--z-canvas 0` (escena, `fixed`, `pointer-events: none`) · `--z-backdrop 1` · `--z-content 2` (hero, bloques, admin) · `--z-header 10` · `--z-bar 15` (barra de `/negocios`, barra inferior del área/admin, barra de decisión del detalle) · `--z-overlay 40` (menú, hojas, modales) · `--z-toast 50`.

Regla que costó una tarde en la referencia: **ningún ancestro de un `fixed` puede llevar `transform`, `filter` ni `will-change`**. `PageTransition` anima el contenedor con `opacity` + `translateY` y **quita la animación al terminar** (`is-entering` → fuera a los 200 ms); la cabecera y las barras viven fuera del `template` que se anima (diseño técnico §1.6.6).

### 1.8 Puente Tailwind 4 → shadcn

`globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

:root { /* bloque :root de ref/ui-v3/tokens.css, tal cual */ }

/* nombres que shadcn espera (sus componentes usan bg-background, text-muted-foreground, ring, etc.) */
:root {
  --background: var(--bg);            --foreground: var(--text);
  --card: var(--surface-1);           --card-foreground: var(--text);
  --popover: var(--popover);          --popover-foreground: var(--text);
  --primary: var(--violet);           --primary-foreground: var(--text-inverse);
  --secondary: var(--surface-1);      --secondary-foreground: var(--text);
  --muted: var(--surface-2);          --muted-foreground: var(--text-3);
  --accent: var(--surface-2);         --accent-foreground: var(--text);       /* OJO: el "accent" de shadcn es la superficie de hover, no el violeta */
  --destructive: var(--red);          --destructive-foreground: var(--red-ink);
  --border: var(--line-2);            --input: var(--line-2);                 --ring: var(--violet);
  --chart-1: var(--violet); --chart-2: var(--green); --chart-3: var(--amber); --chart-4: var(--red); --chart-5: var(--violet-text);
  --sidebar: var(--bg-2); --sidebar-foreground: var(--text-2); --sidebar-primary: var(--violet); --sidebar-primary-foreground: var(--text-inverse);
  --sidebar-accent: var(--surface-2); --sidebar-accent-foreground: var(--text); --sidebar-border: var(--line); --sidebar-ring: var(--violet);
  --radius: 12px;
}

@theme inline {
  --color-background: var(--background); --color-foreground: var(--foreground);
  --color-card: var(--card); --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover); --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary); --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary); --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted); --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent); --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive); --color-border: var(--border); --color-input: var(--input); --color-ring: var(--ring);
  --color-sidebar: var(--sidebar); /* … resto de sidebar-* igual */
  /* marca: utilidades propias bg-violet, text-green, bg-amber-soft… */
  --color-violet: var(--violet); --color-violet-text: var(--violet-text); --color-violet-soft: var(--violet-soft);
  --color-green: var(--green); --color-green-soft: var(--green-soft); --color-green-ink: var(--green-ink);
  --color-amber: var(--amber); --color-amber-soft: var(--amber-soft);
  --color-red: var(--red); --color-red-soft: var(--red-soft); --color-red-ink: var(--red-ink);
  --color-surface-1: var(--surface-1); --color-surface-2: var(--surface-2); --color-surface-3: var(--surface-3);
  --color-text-2: var(--text-2); --color-text-3: var(--text-3); --color-line: var(--line); --color-line-2: var(--line-2);
  --font-sans: var(--font-body); --font-heading: var(--font-title); --font-mono: var(--font-mono);
  --radius-sm: var(--r-sm); --radius-md: var(--r-md); --radius-lg: var(--r-lg); --radius-xl: var(--r-xl); --radius-pill: var(--r-pill);
  --shadow-edge-primary: var(--edge-primary); --shadow-edge-surface: var(--edge-surface); --shadow-edge-surface-hover: var(--edge-surface-hover); --shadow-overlay: var(--shadow-overlay);
  --ease-jc: var(--ease); --ease-out-jc: var(--ease-out);
  --text-2xs: var(--fs-2xs); --text-xs: var(--fs-xs); --text-sm: var(--fs-sm); --text-base: var(--fs-base); --text-md: var(--fs-md); --text-lg: var(--fs-lg); --text-xl: var(--fs-xl); --text-2xl: var(--fs-2xl);
  --text-h2: var(--fs-h2); --text-h1: var(--fs-h1); --text-hero: var(--fs-hero);
}
```

Notas: solo modo oscuro (spec D12): no hay bloque `.dark`, `color-scheme: dark` en `html`. `components.json` con `style: "new-york"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "lucide"`; los componentes de shadcn se instalan y se retocan **solo** en `className` por defecto (`buttonVariants`, `badgeVariants`), nunca copiando estilos a mano en cada uso. `scrollbar-color: violet/.35 transparent` en `html` (P13: scroll nativo).

---

## 2. Motion

Cinco recursos (UX §3.7), todos derivados del hero, todos con `prefers-reduced-motion` resuelto (spec §12.4). Curva única `--ease: cubic-bezier(.2,.7,.2,1)`; `--ease-out` solo para el toast al entrar.

| Recurso | Valores | Reduced motion |
|---|---|---|
| **`IntroFall`** (una vez por sesión, solo `/` y `/en`) | Igual que el prototipo y el diseño técnico §1.6.4: cada carácter arranca entre 0,35 y 1,10 vh por encima, velocidad constante, aterriza entre **0,4 y 1,2 s**; glifos `{}[]()<>=;:/*+-_$#@!?&|0-9a-z` en `violet/.8` cambiando en ~30 % de los frames; destello `is-wet` (verde + halo 14 px) 0,14–0,30 s; `is-forming` apaga fondo y sombra de badge y botones hasta el último carácter. Partículas con la misma regla (`uIntroT`). Letras y escena comparten `t0`; las letras esperan a la escena ≤ 1.200 ms. Salto con cualquier interacción ≤ 200 ms. Móvil sin escena viva: solo letras | Sin intro, texto en su sitio desde 0 ms |
| **`GlyphScene`** | Parámetros aprobados: `hold 3.5, morph 1.6, rot .18, size 16, bright 1, green 14 %, scatter .6, breath .025, wperiod 4, wamp .6, bloom .3 / .72, focus 6.2, mirror .45`; 9.000 / 5.000 partículas; fundido del canvas 1 s; pausa fuera de viewport y con pestaña oculta; arrastre con inercia (`touch-action: pan-y`) y paralaje .25 / .18 rad | Poster estático |
| **Respiración y ondas** | En la escena y en los sprites de PathPanel; nada más respira | Fuera |
| **`CompileReveal` v3** (`h2` públicos) | Al entrar en viewport (`threshold .4`, una vez): todos los caracteres muestran glifos en `violet/.8`; el carácter `i` de `n` se resuelve a los `i·300/n` ms con destello `is-wet` de 140 ms. **Total ≤ 300 ms**, de izquierda a derecha, sin caída ni desplazamiento. No en área, admin ni auth | El `h2` se pinta sin animación |
| **`PageTransition`** | Saliente: opacidad 1 → 0 en **120 ms**. Entrante: opacidad 0 → 1 y `translateY(8px → 0)` en **160 ms**, y la animación se retira al terminar (§1.7). Cabecera y barras fuera del contenedor animado. La hoja "Menú" usa la misma curva (160 ms con `translateY(8px)`) | Cambio directo |

**Micro-detalle** (el puntero solo resalta; todo ≤ 180 ms): halo y anillo (`--edge-*-hover`), texto secundario → pleno, flecha `→` que avanza 3 px (`.arrow`), `translateY(1px)` al pulsar. Prohibido: escala, inclinación, gradiente animado, parallax, retícula, deriva. Estados de carga: spinner de 16 px en el propio botón (`is-loading`, texto transparente para no cambiar el ancho) y `Skeleton` con brillo lento (1,4 s) en listas.

**Sprites de PathPanel** (escritorio): tira de 24 fotogramas a 12 fps con `steps(24)` al hover o foco del panel, y vuelta; en la referencia, crossfade de 600 ms entre dos stills (estado y mitad del morph) capturados de la misma escena. Móvil y reduced motion: fotograma 0.

**Indicador del ciclo** (§5.21): tres segmentos de 22 × 2 px bajo la escena; el activo se rellena en verde durante los 3,5 s de hold (`transform: scaleX` con transición lineal de 3,5 s); con vídeo se sincroniza con `currentTime`; con poster, el primero fijo al 55 %.

**Presupuesto** (spec §12.3, diseño técnico §1.6.7): la referencia no mide nada; el implementador aplica `check-hero-bundle` (≤ 200 KB gz), Lighthouse CI y la regla "LCP = `h1` o poster ≤ 1,2 s escritorio / ≤ 2,5 s móvil". GSAP solo núcleo + ScrollTrigger, cargado tras el primer paint y envuelto en `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`; la referencia demuestra que `IntroFall`, `CompileReveal` y `PageTransition` no necesitan GSAP (rAF + CSS), así que **GSAP queda para "Cómo trabajo" con pinning, la galería scroll-driven de las fichas y la trayectoria horizontal de Sobre mí**, nada más.

---

## 3. Componentes

Convenciones para todos:
- **Estados obligatorios**: reposo · hover · focus-visible (anillo violeta 2 px, offset 3) · active (`translateY(1px)`) · disabled (`opacity .45`, `cursor: not-allowed`, sin halo) · loading (spinner en sitio, `aria-busy`) · error (borde `red/.8` + texto `--red` con icono) · vacío (`EmptyState`) · carga (`Skeleton`).
- **Tamaños**: botón `lg` 50 px (hero y primarias de página), `md` 44 px (móvil, formularios, admin en móvil), `sm` 38 px (cabecera, acciones de fila en escritorio; 34 px dentro de tablas). En móvil nada pulsable baja de 44 px (`chip--tap`, `seg--tap`, enlaces de nav con `min-height: 44`).
- **Base shadcn** = componente que se instala; **clases** = las de `tokens.css`/`styles.css` que el implementador traslada a `className` por defecto del componente (o a un `variants` de `cva`).

### 3.1 Primitivos (shadcn re-tematizado)

| Componente | Base shadcn | Variantes | Estados y notas |
|---|---|---|---|
| `Button` | `button` | `primary` (violet, `--edge-primary`), `secondary` (surface-1 + anillo `line-2`; hover anillo violet .6 + halo), `outline` (solo anillo), `ghost` (texto `text-2` → `text`, fondo surface-1 al hover), `destructive` (texto y anillo rojos; relleno `red-soft` al hover), `link` (sin caja, `text-2` → `text`, flecha `.arrow`); tamaños `lg/md/sm/icon` (44 × 44) | `is-loading` con spinner (color del texto); `disabled` gris (`surface-3`, `text-2`) en primario; `btn--wide` en hojas móviles. Un primario por pantalla |
| `Badge` (hero) | `badge` (variante propia `hero`) | Píldora 34 px, `--edge-halo`; punto verde / ámbar / gris (`dot--amber`, `dot--off`) | Hover: halo más fuerte. Es un `a`; `is-forming` durante la intro |
| `Chip` (toggle, filtro, contador) | `toggle` / `toggle-group` (radio o checkbox reales en el generador, UX §12) | Píldora 36 px (44 con `chip--tap`), `aria-pressed`; activo = `violet-soft` + anillo violet .5 + texto `violet-text`; contador `chip__n` mono | `disabled` .45. El contador anuncia cambios con `aria-live` solo al filtrar |
| `Tag` (`StatusBadge`) | `badge` | Rectangular 24 px, radio 8, mono 12: neutro (`surface-3`), `violet`, `green`, `amber`, `red`, `outline`, `new` (borde verde, sin fondo) | Siempre con texto; nunca solo icono |
| `Input`, `Textarea`, `Select` | `input`, `textarea`, `select` | Fondo `#000/.25`, anillo `line-2` (hover `line-3`), radio 8, 44 px; `textarea--mono` para Markdown; `select--sm` 36 px para filtros | Foco: anillo violet .6 + outline; `aria-invalid` → anillo rojo + `.error` debajo con icono; `disabled` .5; `help` en `text-3` |
| `Checkbox`, `Radio` | `checkbox`, `radio-group` | 18 px, radio 5 (círculo en radio), relleno violet al marcar, tick en `text-inverse` | Etiqueta ≥ 28 px de alto pulsable, 44 en móvil |
| `Switch` | `switch` | Pista 40 × 22, pulgar 16; activo = `green/.3` + anillo green .6 + pulgar verde con halo; siempre con etiqueta de texto ("Radar activo" / "En pausa hasta el 26 sep") | `role="switch"`, `aria-checked` |
| `InputOTP` | `input-otp` | 6 celdas 44 × 52, mono 22, radio 8, `autocomplete="one-time-code"`, pegado permitido | Error inline bajo el grupo |
| `Slider` (umbral) | `slider` | `accent-color: violet`, 44 px de alto, valor visible a la derecha en mono | Texto de ayuda con hechos debajo |
| `Segment` | `tabs` (lista) | Píldora contenedora `surface-1` + anillo `line`; opción activa `surface-3` con canto superior; 34 px (38 con `seg--tap`) | `aria-selected` / `aria-current` para `RadarSubnav` |
| `Tabs` (subrayado) | `tabs` | Línea inferior 2 px violet bajo la activa, 44 px, `overflow-x: auto` | Para `MaterialEditor` y ficha de cliente |
| `DataTable` | `table` (+ `@tanstack/react-table`) | `th` mono 11 px mayúsculas `text-3`; filas 52 px, separador `line`; hover `surface-1`; `focus-within` `inset 2px 0 0 violet`; columna de acciones alineada a la derecha; el contenedor `.inbox` desplaza en horizontal por debajo de 1.280 px (`min-width: 880px`), **nunca la página** | Vacío: `EmptyState` dentro de la caja; carga: 6 filas `Skeleton` |
| `Alert` / banner | `alert` | Barra izquierda de 3 px (violet / amber / red / green), fondo `surface-1`, una acción a la derecha (`btn--outline btn--md`) | `role="status"`; en `RadarAlerts` máximo tres visibles + "y {n} más" |
| `Skeleton` | `skeleton` | Gradiente `surface-1 → surface-3`, 1,4 s | Respeta la forma final (píldora para botones) |
| `EmptyState` / `ErrorState` | — (propio) | Caja con borde discontinuo `line-2`, texto `text-2` 15 px, una acción `secondary md`; `ErrorState` = mismo con `Alert red` arriba y `[ Reintentar ]` | Solo texto: sin ilustración ni motivo (§5.10) |
| `Toast` | `sonner` | `popover` opaco, `--shadow-overlay`, 48 px, radio 12, abajo centrado; con acción (Deshacer, Entrar) no se cierra solo; sin acción, 6 s | `aria-live="polite"` |
| `Dialog` | `dialog` (`alert-dialog` para destructivos) | Fondo `bg/.7` + blur 4; caja 520 px, `popover`, radio 16, entra con `translateY(8px)` 160 ms; título 20 px, `modal__meta` mono, cuerpo `text-2` con listas en `text`, acciones a la derecha (Cancelar `ghost` + primaria) | Escape cancela, nunca confirma; `aria-describedby` al texto de consecuencia |
| `Sheet` | `sheet` (`drawer` en móvil) | Móvil: desde abajo, ≤ 90 svh, asa de 36 × 4, radio 18 arriba, 220 ms; escritorio: lateral derecha 480 px, sin radio | Foco atrapado; cierre con Escape, asa/deslizar o botón |
| `Tooltip` | `tooltip` | `popover` opaco, mono 12, radio 8; solo para enriquecer (fecha completa bajo "hace 3 h", motivo de un botón desactivado) | Nunca contiene la única explicación |
| `DropdownMenu` (avatar) | `dropdown-menu` | `popover`, radio 12, ítems 40 px | Mi cuenta · Área de clientes · Admin (si procede) · Salir |
| `Avatar` | `avatar` | 28 px (admin) / 32 (cabecera), `violet-soft` + iniciales mono si no hay imagen del proveedor | — |
| `Accordion` (FAQ) | `accordion` | Filas de 52 px con separador `line`, chevrón Lucide; contenido `text-2` 15 px | `FAQPage` JSON-LD lo lee del mismo contenido |
| `Popover` (calendario) | `popover` | Igual que tooltip pero con acciones | — |

### 3.2 Shell público (UX §3)

| Componente | Base | Composición y estados |
|---|---|---|
| `SiteHeader` | `navigation-menu` **no** (es una lista plana); `header` propio + `dropdown-menu` | Fija, 64 px, `padding: 0 gutter`. Marca `josecoded` mono 14 (`min-height: 44`). Cinco enlaces Manrope 14 `text-2`, 44 px de alto, radio 6; **activo**: `text` + línea de 1 px violet a 8 px del borde inferior (`aria-current="page"`). Derecha: `EN` mono 12, `Entrar` (o avatar), `[Contacto]` `primary sm` 38 px. **Transparente sobre el hero; a partir de 80 px de scroll**: `bg/.72` + `backdrop-filter: blur(12px)` + línea inferior `line` (180 ms). Móvil: marca · `[Contacto]` 44 px · `Menú` 44 px con icono de tres líneas, gap 2 px, sin tocarse. Durante la intro, sus letras caen (`data-fall`) |
| `MobileMenuSheet` | `sheet` (side `top`, pantalla completa) | Fondo `bg` opaco; lista plana Sora 600 22 px, 52 px por fila; separador; `[Contacto]` primario ancho; enlaces secundarios 16 px `text-2` 48 px; pie con `Entrar` y `ES · EN`. Entra con la curva de página (160 ms + 8 px). Foco atrapado, Escape, retorno al botón. Sin iconos |
| `SiteFooter` | `footer` propio | `bg-2` + línea superior; cuatro columnas (2 en móvil); títulos `.eyebrow`; enlaces 15 px `text-2` de 32 px; columna "Esta web" en **mono 12** (`main · a1b2c3d`, publicado, LCP, stack, dos enlaces en `text`); línea de copyright 13 px `text-3` con separador |
| `Backdrop` | — | §1.6 |
| `Skip link` | — | Píldora violet fija arriba a la izquierda, visible solo con foco; primer elemento del orden de tabulación |
| `OfflineBanner` | `alert amber` fijo bajo la cabecera | "Sin conexión. Cuando vuelva la red, sigo donde estabas." |
| `RefNotice` | `sonner` persistente inferior | Texto + `[ Entendido ]` |

### 3.3 Home (UX §4.1, ocho bloques)

| Bloque / componente | Base | Composición, variantes, estados |
|---|---|---|
| 1 `HeroSplit` | propio | Grid `1fr / 1.05fr` (prototipo), `align-items: center`, `min-height: 100svh`, `padding: 96px gutter 48px`; izquierda `max-width: 620px`. Badge → `h1` (Sora 700, `#fff`, −.04em, .98) → subtítulo **alternativa B** ("Hago apps y webs que se publican y se usan. Para empresas: desarrollo web, móvil e IA. Para tu negocio: una web con precio cerrado.", `text-2`, ≤ 48ch, `clamp(16px, 1.4vw, 20px)`) → fila de CTA: `[[ Ver proyectos ]]` `primary lg` + `> Una web para mi negocio →` `link` con `.arrow`. **Móvil**: columna de escena `order: -1`, `max-height: 38svh` (34 svh si alto ≤ 700), `h1` 41 px a 375, CTA y enlace **en la misma fila** (botón `padding 0 20px`, enlace 14 px, gap 16). Comprobado en la referencia a 375 × 667: la fila de CTA termina a **636 px** (UX presupuestaba 661) |
| 1 `HeroMedia` + `GlyphScene` | propio (diseño técnico §1.6.2–1.6.3) | Caja `aspect-ratio: 1/1`, `max-height: 78svh`, radio 18, `cursor: grab`, `touch-action: pan-y`. Dentro: poster (`img` con `fetchpriority="high"`, **AVIF con alfa** para que se funda con el fondo sin cuadro visible durante el fundido del canvas: la referencia lo demuestra con un still transparente), vídeo `hidden` (móvil), canvas `fixed` a pantalla completa con `opacity 0 → 1` en 1 s tras el cual el poster pasa a `visibility: hidden`. Indicador del ciclo (§2). `role="img"` + `aria-label` en la caja |
| 2 `ProofStrip` | propio | Fila de 5 (2 columnas en móvil) entre dos líneas `line`, 48 px de aire; cada hecho: `.eyebrow` + valor Manrope 500 15 px `text`; si es enlace, `→` en `text-dim` y hover `surface-1`; celdas de 44 px mínimo. Si falta un dato, no se pinta y la fila se reparte |
| 3 `PathPanel` × 2 | `card` (variante `panel--hover`) | Radio 18, `padding 28`, `min-height 300`, grid `1fr / 160px`; `.eyebrow` (`empresas` / `negocios`) → `h3` Sora 24 → tres hechos con punto violeta → `path__main` (600, flecha que avanza) → `path__sec` (enlace independiente, `z-index: 2`, 44 px). **El panel entero es el enlace** (pseudoelemento del `a` del `h3`); foco visible en el panel (`outline` en `focus-within`); hover: `--edge-surface-hover` + `surface-2` + morph corto de la miniatura. Miniatura 160 px (88 en móvil), radio 12, radial violeta de fondo, sprite/still transparente. Móvil: Negocios primero (`order: -1`), grid `1fr / 88px`, `padding 20` |
| 4 `ProjectCard` × 3 | `card` (`panel--hover`) | Grid `96px / 1fr` (80 px por debajo de 1.200), radio 16, `padding 20`; `.eyebrow` tipo · estado; `h3` 20; línea de hechos 13 `text-2`; badges de prueba `tag--outline` (App Store, Google Play, Código, Web publicada); la tarjeta entera es enlace. **Marco de móvil** (§5.5): 96 × 190, radio 18, `bg-2` + anillo `line-2`, pantalla radio 12 con anillo `line`; la captura hace `translateY(-40px)` en 1,8 s al hover (escritorio); sin notch brillante, sin sombra proyectada, sin reflejo. Tres columnas / una |
| 5 `BuildFacts` | propio | Frase para Marta en `block__lead`; dos columnas `1.2fr / 1fr` (una en móvil): `pre` mono 13 (12 móvil) en caja `#000/.25` + anillo `line`, nodos en `text` 500 y dominio en `violet-text`, `overflow-x: auto`; **versión corta del esquema en móvil** (5 líneas, la misma información sin rutas) con dos `pre` conmutados por CSS; `FactList` con punto violeta, 15 px `text-2`, `code` mono 13 en `text`; dos enlaces `link` con flecha |
| 6 `PostCard` (último artículo) | `card` (`panel--hover`) | Radio 16, `padding 22 24`, `max-width 720`; meta mono 12 `text-3` con `tag--outline` para etiquetas e idiomas; `h3` 24; extracto 15 `text-2`; tarjeta entera enlace; `> Ver el blog →` al lado (debajo en móvil) |
| 7 "Hablamos" | propio + `card` | Dos columnas `1.2fr / 1fr`: `h2` + dos `secondary lg` (`Escribir por WhatsApp`, `Reservar 20 min`; ancho completo en móvil) + dos `link` + nota `text-2`. **"Quién te responde"**: `panel` radio 16 con retrato 96 × 96 (§5.4: foto real en B/N con `mix-blend-mode: luminosity` sobre `violet-soft`, anillo `line-2`, radio 16; sin foto, se omite el retrato) + nombre Sora 20 + rol · ciudad 13 `text-2` + `> Sobre mí →` |
| 8 `SiteFooter` | §3.2 | — |

`h2` de los bloques 4–7 con `CompileReveal`; los bloques 2 y 3 no llevan `h2` (UX). Espaciado entre bloques 96 / 64 px.

### 3.4 Páginas públicas (UX §4.2–4.13)

| Componente | Base | Composición y estados |
|---|---|---|
| Cabecera de página interior | propio | `h1` `--fs-h1`, `FactList` citable 17 px `text-2` con puntos violeta; sin hero ni escena; `padding-top` 112 px |
| `ServiceCard` × 3 (Empresas) | `card` | Radio 16, `.eyebrow` (web / móvil / ia), `h3` 20, lista de tecnologías `tag--outline`, "un proyecto de ejemplo" como `link`; sin hover de enlace (no es enlace) |
| "Cómo trabajo" / "Cómo es el proceso" | propio (GSAP pin en escritorio) | Pasos numerados en mono 12 `text-3` + título 17 + línea 15 `text-2`; el paso activo al hacer scroll pasa a `text` con la cifra en `violet-text` (sin luz); en móvil, lista simple |
| `GitHubActivity`, `StoreBadges` | propio | Datos en caja `surface-1` con anillo, mono para cifras; badges de stores como `secondary md` con icono monocromo (Lucide/simple-icons), nunca los badges oficiales en color |
| FAQ | `accordion` | §3.1 |
| `#hablamos` con `CalEmbed` | propio + iframe | `CalEmbed` inline en escritorio a la derecha (caja radio 16 con anillo, `color-scheme: dark`, fondo `bg`); en móvil, modal. Caído/bloqueado: `secondary` a Cal.com en pestaña nueva + frase de UX |
| `PackCard` × 4 (Negocios) | `card` (`panel--hover`) | Radio 16, `padding 22`; `.eyebrow` en `violet-text` (P1…P4); `h3` 20; "para quién / incluye" 14 `text-2`; `PriceTag`; plazo mono 12; `> Pedir propuesta con este pack →` 14 500. Cuatro iguales, misma altura (`grid`), **sin "recomendado", sin tachados** |
| `PriceTag` (§5.6) | propio | `Desde` 13 `text-2` + cifra **Sora 600 24** (−.02em) + `sin IVA` mono 11 `text-3` en la misma línea base; en extras, cifra 20; en `ProposalCard`, 28 |
| `ExtraCard` × 6 | `card` | Radio 12, nombre llano 15 600 + `(SEO)` en `text-2`, una línea 13 `text-2`, `PriceTag` pequeño; tres columnas / una |
| Barra fija de `/negocios` (móvil) (§5.7) | propio | 64 px + `safe-area`, `bg-2/.9` + blur 12 + línea superior; `[[ WhatsApp ]]` `primary md` flexible + `[ Propuesta ]` `secondary md`; **siempre visible, no se oculta al hacer scroll** (Marta necesita la salida estable; ocultarla exige JS y produce saltos). El contenido lleva `padding-bottom: 80px`. Solo existe en esa ruta |
| `GuidedChat` (generador) | propio + `toggle-group` + `input` | Columna de lectura; burbujas del asistente `surface-2` + anillo, radio `16 16 16 4`, 15 px; las de Marta `violet-soft`, radio `16 16 4 16`, a la derecha; chips (`chip`, radio/checkbox reales) bajo la burbuja; campo de texto `input` con botón `icon` de enviar; progreso "1 de 4" mono 12 arriba a la derecha. Generando: burbuja con tres puntos y "Preparando tu propuesta"; > 8 s añade "Está tardando más de lo normal"; error: burbuja con `Alert red` y `[[ Reintentar ]]` + `[ WhatsApp ]`. Escritorio: panel derecho sticky con resumen editable y la `ProposalCard` |
| `ProposalCard` (§5.12) | `card` | La única tarjeta con `--edge-surface-hover` **en reposo** (halo violeta): es la pieza que Marta mira más tiempo. Radio 16, `padding 22`: `.eyebrow` "propuesta orientativa" → `h3` 20 (pack) → una línea 14 `text-2` → lista de 3–5 → `PriceTag` 28 → plazo mono → nota `text-3` 13 → separador → "Extras que te recomiendo" con cada extra en fila (nombre / `+250 €` mono) y `tag--outline` "Opcional · no incluido". Debajo, fuera de la tarjeta: `[[ Enviar a Jose ]]`, `[ Cambiar respuestas ]`, `> WhatsApp con esta propuesta`. Legible en 390 px sin scroll horizontal |
| Filtro de proyectos | `toggle-group` | Chips `chip--tap`, uno activo |
| Ficha de proyecto | propio | Cabecera con `tag` de tipo y estado; enlace de prueba principal como `primary lg`; galería de capturas en marcos de móvil (§5.5) con scroll-driven en escritorio (GSAP) y `scroll-snap` táctil en móvil; "Stack" y "Resultados" como `FactList`; anterior/siguiente como `link`; cierre `[ Hablar de un proyecto así ]` `secondary` |
| Blog: lista | `card` | `PostCard` de §3.3 en una columna, `[ Cargar más ]` `secondary md` |
| Artículo | propio (MDX) | Barra de progreso de lectura de 2 px violet bajo la cabecera; columna 70ch, 17 px / 1.65; `h2` con `CompileReveal`; código en caja `#000/.25` + anillo, mono 13, botón `[Copiar]` `ghost sm` arriba a la derecha; callouts = `Alert`; índice como `details` en móvil y lista sticky 13 px en escritorio; compartir = dos `secondary sm` |
| `CommentThread` | propio + `textarea` | Comentario en `card` radio 12: nombre 600 + fecha mono 12 + texto 15; `> Responder` `link` 13; el propio pendiente lleva `tag--amber` "Pendiente de revisión"; caja de escribir con la nota fija **visible antes de escribir** en `help`; sin cuenta: caja con `alert` + `[[ Entrar para comentar ]]` |
| Contacto | `tabs` (segmento) + `form` | Segmento "Tengo un negocio / Somos una empresa" (`seg--tap`, 2 opciones iguales); vía negocio: `[[ WhatsApp ]]` primario, `link` a propuesta, `ContactForm` plegado en `details`; vía empresa: `ContactForm` con los campos de §3.1 (chips de "Qué necesitas" como `toggle-group`), casilla de privacidad, Turnstile en caja `surface-1`, `[[ Enviar ]]` + `[ Reservar 20 min ]`. Tarjeta lateral con email + `[Copiar]` `icon`, LinkedIn, GitHub, horario. Estados: `is-loading` "Enviando", éxito sustituye el formulario por `Alert green` + `[ WhatsApp ]`, errores inline, caída con `mailto:` |
| `WhatsAppButton` | `button` | `secondary` con icono WhatsApp monocromo; en `/negocios` y barra fija es `primary`. Nunca verde de marca de WhatsApp |
| Chat `/chat` | propio | Como `GuidedChat` con banda de estado arriba (`tag` "Responde el asistente" / `tag--violet` "Jose está respondiendo"), burbuja de Jose con `.eyebrow` "Jose" y anillo violet .45; antesala sin cuenta = dos intercambios atenuados (`opacity .6`) + `card` con `AuthProviders` |
| Legales | MDX | Columna de lectura, índice `details`, fecha mono |
| Mi cuenta | `card` + `form` | Tarjeta con `Avatar` 48, `input` de nombre, email solo lectura en `text-2`, segmento de idioma; `[[ Guardar ]]` desactivado sin cambios; "Borrar cuenta" como `link` rojo (`text-red`) → `alert-dialog` |
| `ErrorPage` (UX §8) | propio | Código mono 12 `text-3` sobre `h1` `--fs-h1`; frase 17 `text-2`; `primary lg`; alternativas como `link` en fila; cabecera y pie del ámbito; `Backdrop` sí, ilustración no |

### 3.5 Autenticación (UX §5)

| Componente | Base | Composición y estados |
|---|---|---|
| Plantilla auth | propio | Cabecera reducida (marca · idioma · `< Volver`); tarjeta 440 px centrada (`card` radio 16, `padding 32`; en móvil sin tarjeta, `padding 24 16`); pie solo con enlaces legales |
| `AuthProviders` | `button` × 2 | `[[ Continuar con Google ]]` `primary lg` ancho y `[ Continuar con GitHub ]` `secondary lg` ancho, mismo tamaño y posición, iconos monocromos 18 px a la izquierda; `is-loading` "Abriendo Google" |
| Separador "o con email" | `separator` | Línea `line` con texto mono 12 `text-3` centrado |
| Email + código | `input` + `button secondary` + `input-otp` | Explicación 15 `text-2` **antes** del campo; `[ Enviarme un código ]` `secondary lg` ancho; en `/auth/codigo` el OTP de §3.1, `[[ Entrar ]]` primario ancho, `[ Reenviar código ]` `ghost` con cuenta atrás mono ("60 s") desactivado, `> Usar otro email` |
| Banners | `alert` | `reason=expired` → `alert amber`; OAuth cancelado → `alert red`; Supabase caído → `alert red` + botones `disabled` |
| Callback | `skeleton` | "Entrando…" 15 `text-2` + `Skeleton` de tarjeta |

### 3.6 Área de clientes (UX §6)

Shell: cabecera reducida (`josecoded · Área` mono + avatar) y **barra inferior** (Proyecto · Tareas · Material · Pack · Recomiéndame) en móvil: 56 px + `safe-area`, `bg-2/.9` + blur, etiquetas de texto 11 px con icono Lucide 20 encima, activa en `violet-text`; en escritorio, barra lateral 208 px como la del admin (§3.7). Todo el contenido en `card`/`panel` con la misma piel que la home; sin `CompileReveal`; sin escena.

| Componente | Base | Composición y estados |
|---|---|---|
| Tarjeta de proyecto | `card` + `progress` | Radio 16; nombre Sora 20 + `tag` del pack; **fases** como cinco puntos unidos por una línea `line-2`: hechas en verde, actual en violet con halo, futuras `text-dim`, cada una con su etiqueta 12 debajo; entrega prevista mono 12; `> Ver pack y extras` |
| "Te toca a ti" + `TaskRow` | `card` radio 12 | Fila 60 px: título 15 600 + `tag` de estado + "tú / Jose" + límite mono 12 + contador de comentarios; toda la fila es enlace; la primera pendiente del cliente es la primaria (halo `--edge-surface-hover` en reposo) |
| Novedades | lista | Punto violeta + texto 14 + fecha mono 12 |
| "Hablar con Jose", "Recomiéndame" resumido | `card` | Con `[ WhatsApp ]` `secondary md` y email `link` |
| Detalle de tarea | propio | `< Tareas` `link`; título Sora 24; `tag` + asignación + límite; descripción 15; adjuntos como filas 44 px con `[Descargar]` `ghost sm`; `[ Adjuntar archivo ]` `secondary md` con barra de progreso (`progress` violet 4 px) y error inline rojo; comentarios como en el blog; `[[ Marcar como hecha ]]` primario ancho al final (solo si le toca) |
| `AssetCard` (Material) | `card` radio 12 | Icono de tipo Lucide 20, nombre 15 600, `tamaño · quién · fecha` mono 12, acciones `ghost sm` (Descargar, Eliminar rojo); subiendo: barra de progreso; error: anillo rojo + `[ Reintentar ]` `[ Quitar ]`; `[[ Subir material ]]` primario abre `Sheet` con `input file` múltiple, nota, tarea asociada (`select`) |
| Pack y extras | `card` + lista | Tarjeta del pack como `PackCard` sin enlace; extras como filas con `tag--green` "Activo" / neutro "Finalizado"; solicitudes con `tag` Pendiente (amber) · Aceptada (green) · Rechazada (red); `[[ Solicitar ampliación ]]` primario; nota `help` |
| Solicitar ampliación | `radio-group` + `checkbox` + resumen fijo | Radios de pack (actual marcado y `disabled`, superiores con `+1.100 €` mono a la derecha); checkboxes de extras con precio; **resumen fijo abajo** (móvil: barra `bg-2/.92` + blur con dos líneas 13 y `[[ Enviar solicitud ]]` ancho; escritorio: `card` sticky a la derecha); botón desactivado sin selección y resumen "Elige un pack superior o un extra" |
| Recomiéndame | `card` × 2 + listas | "Tu enlace": código mono 20 `violet-text`, enlace mono 13 en caja `#000/.25`, `[[ Copiar enlace ]]` primario ancho + `[ Compartir por WhatsApp ]` `secondary`; "Qué ganas" en 15 `text` con nota `text-2`; leads y recompensas como filas mono 12 + `tag` de estado; toast "Enlace copiado" |

### 3.7 Admin: shell y secciones comunes (UX §7.1–7.11)

| Componente | Base | Composición y estados |
|---|---|---|
| `AdminSidebar` (escritorio) | `sidebar` | 208 px, `bg-2` + línea derecha, sticky 100 svh; marca mono 13 con `admin` en `text-3`; ítems 40 px radio 8, 14 px `text-2`, hover `surface-1`, activo `surface-2` + `inset 2px 0 0 violet` + `text`; contadores píldora mono 11 (`surface-3`; **verde con tinta oscura** para "Radar: pendientes de ti"); usuario abajo con `Avatar` 28 |
| `AdminBottomBar` (móvil) | propio | 56 px + `safe-area`, cuatro pestañas de texto 11 (Leads · Radar · Clientes · Más), contador verde de 16 px arriba a la derecha del texto, activa `violet-text` |
| Densidad (§5.8) | — | Texto base 13–14 px; `h1` de sección 26 (22 móvil) con línea meta mono 12 `text-3`; listas como `DataTable` de 52 px en escritorio y `card` de `padding 14 16` en móvil; hojas laterales de 480 px para crear/editar; modales solo para confirmar |
| Resumen | `card` × 5 + listas | Contadores como tarjetas 96 px: cifra Sora 32 + etiqueta 13; "Servicios": puntos `dot` verde / ámbar / rojo **con texto** |
| Leads: tabla y detalle | `table`, `sheet`, `dialog`, `select` | Columnas: fecha mono · nombre + negocio (`title-cell`) · origen `tag` · pack y "desde" · afiliado mono · estado `tag` · no leído `tag--new`; detalle en dos columnas con `ProposalCard` reutilizada (sin halo) y JSON en `details` + `pre`; afiliado en `card` con `alert amber` si posible autoreferido; `[[ Marcar cerrado y cobrado ]]` primario → `alert-dialog` con la regla calculada |
| `CommentModerationRow` | `card` radio 12 | Autor 600 · email mono 12 · artículo `link` · fecha; texto completo 14; `[[ Aprobar ]]` `primary sm` + `[ Rechazar ]` `ghost sm` (rojo al hover); al actuar la fila se desliza (opacidad + altura, 160 ms) y sale el toast con Deshacer |
| Clientes, ficha, ampliaciones, afiliados, chat | `table`, `tabs`, `sheet`, `switch` | Ficha con `Tabs` subrayadas (Resumen · Tareas 4 · Material · Pack); "Ver como cliente" abre el área con `alert violet` fijo arriba "Estás viendo como cliente · solo lectura"; takeover del chat con `Switch` etiquetado ("Responde el asistente" / "Respondes tú") y campo `disabled` con ayuda hasta activarlo |

### 3.8 Radar (UX §7.12–7.18, §13.16–13.18)

| Componente | Base | Composición, variantes, estados |
|---|---|---|
| Cabecera de Radar | propio + `switch` | `h1` "Radar" + línea "Última pasada: **InfoJobs** hace 2 h · …" mono 12 (`b` en `text-2`); a la derecha `RadarPauseSwitch` |
| `RadarPauseSwitch` | `switch` + `dialog` | Etiqueta cambia entre "Radar activo" (verde) y "En pausa hasta el 26 sep" (pista gris); apagar abre `Dialog` "¿Hasta cuándo?" con chips 3 días · 1 semana · 2 semanas · Fecha · Sin fecha y `[[ Pausar ]]`; en pausa, `alert amber` fijo en bandeja, plataformas y perfil con `[ Reanudar ]` |
| `RadarSubnav` | `tabs` (segmento `seg--tap`) | Bandeja `4` · Calendario · Plataformas · Perfil; `aria-current`; `overflow-x: auto` sin barra en móvil |
| `RadarAlerts` | `alert` apilados (gap 8) | Rojo (conector detenido, Omen sin respuesta, Google caducado), ámbar (correos por clasificar, plazos < 24 h, Telegram sin entregar); una acción `outline md` por banner; máximo tres + "y {n} más" plegado |
| `StatusCounters` | `toggle-group` de `chip--tap` | "Pendientes de ti" primero; activo `violet-soft`; número mono siempre; `aria-live="polite"` al filtrar |
| `FilterBar` | `select--sm` × 4 + `checkbox` + `input search` + `select` de orden | Escritorio: una fila con `flex-wrap`; **móvil: `[ Filtros · 2 ]` `outline md` que abre `Sheet` con los mismos controles, y el select de orden visible**. Filtros en la URL |
| `RadarInbox` (`DataTable`) | `table` | **Cinco columnas** (decisión de `ui` para que quepa a 1.280 px sin desplazar): Punt. (`ScoreBadge`) · Candidatura (título 14 600 enlace + `empresa · hace 3 h` en 12 `text-3`, con `title` de fecha completa) · Oferta (chips `tag`: plataforma, Empleo/Freelance, modalidad, salario corto; `Dup.` con `title`; esta columna envuelve, `max-width 260`) · Estado · plazo · correo (`tag` de estado + subestado 12 `text-3` + fila de señales `DeadlineTag` y `MailTag`) · Acciones (`[[ Confirmar ]]` `primary` 34 px + `Posponer` y `Descartar` `ghost` 34 px; en otros estados `[ Abrir ]` `outline`, `[ Clasificar ]` `secondary`, `[[ Marcar enviada ]]` `primary`). Cabeceras `th` con `scope`; nombre accesible de cada acción con el título ("Confirmar Senior React Native en Acme"). Fila con foco: `inset 2px 0 0 violet`. Por debajo de 1.280 px el `.inbox` desplaza en horizontal (`min-width 880`) |
| `RadarCard` (móvil) | `card` radio 12 | `padding 14 16`: fila superior `ScoreBadge` + `MailTag`/`DeadlineTag` a la derecha → título 16 600 → meta 13 `text-2` (empresa · plataforma · tipo · modalidad · salario) → fila de estado (`tag` + subestado + señales) → **acciones de 44 px**: primaria flexible + `outline` + `ghost` |
| `ScoreBadge` (§5.16) | propio (mono) | Número 600 15 px + tramo mono 11 mayúsculas: **alto ≥ 80 verde · medio 60–79 ámbar · bajo < 60 `text-3`**; en el detalle `score--lg`: cifra Sora 32 en columna con "alto · 82/100" debajo (en móvil, en línea) |
| `DeadlineTag` | propio (mono 12) | "Vence en 5 d" `text-2` · "Vence en 2 d" **ámbar (< 48 h)** · "Vence hoy / en 5 h" **rojo (< 24 h)** · "Caducada" `text-3` tachado · "Sin plazo" `text-2`. Siempre texto; en la cabecera del detalle también como `tag--amber`/`tag--red` |
| `MailTag` | propio (mono 12) | Punto de 6 px con halo + texto: "1 correo nuevo" violeta · "Por clasificar" ámbar. Se apaga al abrir el detalle |
| `StatusBadge` de candidatura | `tag` | Descubierta neutro · Preparada / Por confirmar `violet` · Confirmada `green` · Enviada neutro · En contacto `violet` · Entrevista `green` · Oferta `green` · Rechazada / Descartada `outline`; subestados en texto 12 debajo ("por marcar enviada", "Pospuesta hasta el 22 sep", "Enviando…", "Error de envío" en rojo, "Preparando…") |
| `ConfirmSendModal` | `dialog` | Título "Confirmar envío"; `modal__meta` mono (candidatura · plataforma · puntuación · plazo); cuerpo: "Al confirmar se enviará por la API de InfoJobs con:" + lista (CV vN → PDF, carta vN, formulario n campos, m sin valor) + **"No se puede deshacer en la plataforma."** en 600 + control de plantilla en caja `green-soft` ("Visto hace 10 min · 3 referencias a Acme · sin bloqueos") o `red-soft` con el motivo y **primaria desactivada** + `> Ver el material antes`; acciones `[ Cancelar ]` `ghost` + `[[ Confirmar y enviar ]]` con `is-loading` hasta la respuesta (≤ 30 s). Variante asistida: texto "se abrirá la oferta en {plataforma}…" y `[[ Confirmar y abrir ]]`, sin bloqueo. Escape cancela; `aria-describedby` al cuerpo. **Mismo modal en fila, detalle y Telegram-web** |
| `SnoozeSheet` | `sheet` (abajo en móvil, lateral en escritorio) | "¿Hasta cuándo?" + chips `chip--tap` (Mañana 08:00 · 3 días · Lunes · Fecha…) + `alert amber` si el plazo vence antes + `[ Cancelar ]` `[[ Posponer ]]`; toast "Pospuesta hasta mañana 08:00." con Deshacer 10 s. En modo recordatorio ("Editar en el portátil"): chips Hoy 18:00 · Mañana 09:00 · Hora… |
| `DiscardSheet` | `sheet` | Chips de motivo + `textarea` en "Otra" + casilla "No volver a mostrar ofertas de {empresa}" + `[[ Descartar ]]` `destructive`; toast con Deshacer |
| Detalle: cabecera | propio | `< Radar` `link`; `h1` 26; "Acme · `tag`"; chips de la oferta (`tag`, `tag--outline` para "publicada hace 3 d", `DeadlineTag` como tag de color); `> Ver la oferta en InfoJobs ↗` `link`; `ScoreBadge` grande a la derecha (dos columnas `1fr / auto`) |
| `ScoreReasons` | `.sect` (`panel` radio 16) | Lista 14 px: signo mono (`+` verde / `−` ámbar) + motivo + peso mono 12 `text-3` a la derecha; línea "puntuada con perfil v4 · Llama 3.3 70B · 18 sep 07:12" en `saved` (mono 11); `[ Repuntuar ]` `ghost sm` en el título; `[ No me interesa ]` `outline md` + `> Ajustar umbral`. Sin barras ni gráficos |
| Oferta | `.sect` | Descripción 14 `text-2` con `-webkit-line-clamp: 6` (12 líneas en producción) + `[ Ver completa ]` `ghost sm`; requisitos como `tag--outline`; "Datos originales" en `details` + `pre` |
| `MaterialEditor` (§5.17) | `.sect` + `tabs` + `select` + `textarea--mono` + `details` | Título con `[ Editar en el portátil ]` `outline sm` **solo en móvil** (`edit-laptop`); `Tabs` subrayadas (CV adaptado · Carta/Propuesta · Formulario `8` · Respuestas); `versionbar`: `select--sm` de versión ("v2 · tú · hace 10 min" / "v1 · IA · hace 3 h") + `[ Regenerar ]` `ghost sm` + "⌘S guarda" mono a la derecha; **editor**: `textarea--mono` 280 px (200 en móvil) y **previsualización** (caja `#000/.25`, 14 px / 1.6, `h4` Sora) lado a lado en escritorio; en móvil la previsualización es `details` "Ver cómo queda ▾" bajo el editor (`preview-toggle`, abierto por defecto). **Referencias resaltadas**: `mark.ref` (`violet/.22`, texto pleno, radio 3, `title="Referencia a la oferta"`); hechos no verificados: `mark.ref--bad` (`red/.22` + subrayado ondulado rojo, `title="No consta en el CV maestro"`). `TemplateCheck` debajo: caja `green-soft` con `dot` verde ("3 referencias concretas a Acme y a la oferta") o `red-soft` con `dot` rojo y el motivo; casilla "Apruebo … como hecho que puedo defender"; `details` "Qué cambió respecto al CV maestro"; acciones `[ Copiar ]` `ghost md` · `[ Descargar PDF ]` `outline md` · `[[ Guardar ]]` `primary md`. La previsualización del CV usa la hoja del PDF (misma para impresión) |
| `FormPayloadTable` | `table` | Dos columnas campo (mono 12) → valor (`input` 36 px); `tag--amber` "obligatorio", `tag--red` "sin valor"; grupo "Rellénalo tú" al final con fondo `amber-soft`; adjuntos con versión mono |
| `DecisionCard` | `.sect` (sticky en escritorio) | Título "Decisión"; texto de consecuencia 14 `text-2`; primaria del estado (`[[ Confirmar y enviar ]]` / `[[ Confirmar y abrir ]]` / `[[ Marcar enviada ]]` / `select` de estado con confirmación en texto); si está bloqueada, `disabled` + `.error` con el motivo debajo (y `data-tip`); `[ Posponer ]` `outline md` + `[ Descartar ]` `ghost md`; `kv` mono para plazo y seguimiento con `· editar`; `[ Preparar borrador de seguimiento ]` `ghost md`. **Móvil: barra fija inferior** (`decbar`) sobre la barra del admin: texto 12 `text-2` + fila `[[ Confirmar envío ]]` flexible · `[ Posponer ]` · `[ Descartar ]`, todos 44 px; el `main` lleva `padding-bottom: 180px` |
| `EventProposalCard` | `card` (`panel--dashed` para propuestos) | Borde discontinuo violet .55 + `tag--violet` "Propuesto"; título 600 + meta 13 (`jue 25 sep 10:00 · 45 min · Meet · del correo del 19 sep`); `[[ Crear en el calendario Radar ]]` `primary md` · `[ Editar ]` · `[ Descartar ]` `ghost md`. Confirmados: borde continuo, `> Ver en Google Calendar`, `[ Proponer cambio ]` |
| `EmailList` + `LinkEmailSheet` | `.sect` + `sheet` con `tabs` | Correo: fila mono 12 (`tag--new` "Nuevo" · fecha · cuenta · remitente) → asunto 14 600 → extracto 13 `text-2` → acciones (`tag--green` "Entrevista · 0,92" o `tag--amber` "Por clasificar · 0,55", `> Abrir hilo`, `[ No era esto ]` `ghost sm`); separador `line` entre correos; `[ Vincular correo ]` `ghost sm` en el título abre hoja con `Tabs` Buscar / Pegar enlace, `input` y ejemplo del formato en `help` |
| Notas | `textarea` 96 px | "Guardado 09:14" mono 11 en el título |
| `EventTimeline` | lista | Filas `120px / 1fr / auto`: fecha mono 12 `text-3` · texto 13 · `[ No era esto ]` `ghost sm` en transiciones por correo o regla; errores en `details`; una columna en móvil |
| `ConnectorCard` | `card` radio 12 (tabla en escritorio) | Nombre 600 + chips `tag` (tipo, acceso, runtime, envío); estado como `tag` **con texto** (Activo green · Pausado amber · Detenido por error / verificación de seguridad red · Sin credenciales outline · Esperando al Mac neutro); "Última pasada" 13; límites y uso mono 12; dominios como `tag--outline`; casilla "He comprobado la sesión a mano" + `[ Reactivar ]` `outline md` cuando hay captcha; `Switch` Activo/Pausado; `[ Ejecutar ahora ]` `secondary md` (desactivado con motivo en Mac); `[ Editar ]` `ghost`; error completo en `details`. Tarjeta en rojo = `alert red` dentro, no borde rojo entero |
| `ConnectorSheet` + `SecretRef` | `sheet` lateral 480 + `select`, `input`, `radio` | Formulario de UX §7.14; `SecretRef`: fila mono 12 con nombre del secreto · dónde vive · `tag--green` "configurado" / `tag--red` "falta" + comando en `code`; **ningún campo de valor**; `[[ Guardar plataforma ]]` · `[ Probar ]` `secondary` (resultado inline: tres títulos o `Alert red`) · `[ Cancelar ]` |
| `ProfileView` + ajustes rápidos | `.sect` × 3 + `slider` + chips + `input date` | Perfil solo lectura como `kv` (dt mono 12 / dd 14) con `> Editar en el repo`; ajustes: `Slider` de umbral 40–90 con valor mono y ayuda con hechos; exclusiones como chips con `×` (44 px); disponibilidad `input type=date`; `[[ Guardar ajustes ]]` visible solo con cambios; materiales base con `Tabs` CV es · en, previsualización con la hoja del PDF, versión mono, `[ Descargar PDF ]`; barra de progreso al repuntuar |
| `RadarCalendar` (§5.18) | propio (sin librería) + `popover` + `sheet` | **Agenda** (por defecto en móvil): lista por día con cabecera mono 12 `text-3` ("Jue 25 sep"), eventos como `EventProposalCard` compactas (propuestos con borde discontinuo + texto "Propuesto"), plazos como línea "Vence · Full-stack Next.js · Beta SL" con `DeadlineTag`, seguimientos "Seguir · …" con `[ Preparar borrador ]` `ghost sm`. **Semana**: rejilla CSS `80px repeat(6, 1fr)`, fila superior "plazos" sin hora, eventos como bloques `surface-2` + anillo violet .4 (propuestos discontinuo), cada evento es un `button` con nombre completo. **Mes**: rejilla 7 × n, celdas 96 px con hasta 3 eventos abreviados y "+2". Segmento Mes · Semana · Agenda, `‹ Hoy ›` como `outline sm`, "Sincronizado con Google hace 12 min" mono, filtros por tipo como checkboxes. Clic → `popover` (escritorio) / `sheet` (móvil) con las acciones de UX. shadcn `calendar` solo para elegir fecha en formularios |
| Errores R1–R17 | `alert`, `card`, `EmptyState` | Cada uno con su texto de UX §7.18 y una sola acción; color según gravedad (rojo: detenido, caducado, sin respuesta; ámbar: por clasificar, dormido, en pausa) |

### 3.9 Iconografía (§5.9)

**Lucide** (el set de shadcn), 16 px en tags y tablas, 18 en botones, 20 en barras inferiores; `stroke-width 1.5`, `currentColor`, sin relleno ni duotono. Marcas (Google, GitHub, WhatsApp, App Store, Google Play, LinkedIn) como SVG monocromos de **simple-icons** en `currentColor`; nunca los badges oficiales en color. Usos: proveedores de auth, stores, WhatsApp, estados de servicio (`Check`, `AlertTriangle`, `XCircle`) junto al texto, acciones de icono (`Copy`, `Download`, `ExternalLink`), navegación (`Menu`, `X`, `ChevronDown/Left/Right`). Sin iconos decorativos en títulos ni en tarjetas.

---

## 4. Accesibilidad y rendimiento comprobados en la referencia

- Contraste: todos los tokens de texto ≥ 4,5:1 sobre `bg`, `surface-1/2/3` y `popover` (tabla §1.1; `--text-3` subido a .56 por eso; `--text-dim` reservado a decoración).
- Foco visible en todo lo enfocable (anillo violeta); fila de tabla con marca lateral; panel-enlace con `outline` en `focus-within`.
- Objetivos táctiles: cabecera móvil (`Contacto` 44, `Menú` 44, sin tocarse), acciones de `RadarCard` 44, barra de decisión 44, chips `--tap` 44, OTP 44 × 52, enlaces del pie 32 (texto, no controles).
- 375 px: sin desbordamiento horizontal en home, bandeja, detalle y kit (`scrollWidth` = 375); a 1.024 y 1.280 tampoco (la tabla desplaza dentro de `.inbox`).
- Fold 375 × 667: fila de CTA del hero termina a 636 px con subtítulo B de tres líneas y `h1` de 41 px.
- `IntroFall`: texto real en `sr-only` desde 0 ms, glifos en contenedor `aria-hidden`; cualquier tecla, clic, rueda o scroll la termina; `sessionStorage.intro_seen`.
- Modales: foco al primer control, Escape cancela, retorno de foco; menú móvil con Escape y retorno al botón.
- Consola limpia en las cuatro vistas (Chrome, `file://` y `http://localhost`).
- `prefers-reduced-motion`: sin intro, sin escena (poster), sin `CompileReveal`, transiciones a 0,01 ms (regla global en `tokens.css`).

---

## 5. Respuestas a las decisiones abiertas de UX §13

| # | Decisión |
|---|---|
| 1 | Paleta cerrada por el hero: violeta `#a78bfa` + verde `#34d399` sobre `#05060f`, con ámbar y rojo semánticos (§1.1). No hay tres propuestas: Jose ya eligió viendo el prototipo |
| 2 | Sora (titulares) · Manrope (texto y UI) · JetBrains Mono (datos, código, etiquetas). Sin Inter, sin degradados (§1.2) |
| 3 | Escena con los parámetros del prototipo sin retoque (§2). Columna móvil ≤ 38 svh (34 si alto ≤ 700) verificada a 375 × 667 (CTA a 636 px). Poster **AVIF con alfa** ≤ 60 KB y vídeo ≤ 400 KB generados en build desde la misma nube (diseño técnico §1.6.3), poster también en escritorio; la referencia demuestra el "sin cuadro visible" con un still transparente. Miniaturas de PathPanel = **sprites AVIF de 24 fotogramas** (escritorio, hover/foco) y fotograma 0 en móvil; la referencia aproxima con dos stills y crossfade de 600 ms. `CompileReveal` v3: ≤ 300 ms, `i·300/n`, destello 140 ms, de izquierda a derecha. Indicador sincronizado con `currentTime` en vídeo |
| 4 | **Una foto real** de Jose, solo en Sobre mí (retrato 128 px) y en "Quién te responde" / tarjeta de Contacto (96 px): recorte cuadrado, B/N con `mix-blend-mode: luminosity` sobre `violet-soft`, radio 16, anillo `line-2`. Sin foto, el retrato se omite (no avatar generado). Lo confirma Jose |
| 5 | Marco de móvil plano: 96 × 190 (80 × 160 por debajo de 1.200 px), radio 18, `bg-2` + anillo `line-2`, pantalla radio 12 con anillo `line`; captura con `saturate(.9)`, sin notch brillante, sin sombra proyectada ni reflejo; en escritorio la captura se desplaza 40 px al hover (1,8 s) y en la ficha va scroll-driven |
| 6 | `PriceTag`: "Desde" 13 `text-2` + cifra Sora 600 24 (28 en `ProposalCard`, 20 en extras) + "sin IVA" mono 11 `text-3` en la misma línea base. Sin tachados, sin "recomendado", cuatro `PackCard` iguales |
| 7 | Barra fija de `/negocios`: 64 px + `safe-area`, `bg-2/.9` + blur, **no se oculta al hacer scroll** (estabilidad para Marta y cero JS); contenido con `padding-bottom: 80px` |
| 8 | Admin: 13–14 px, `DataTable` de 52 px con cabeceras mono, `RadarInbox` de cinco columnas; tarjetas de `padding 14 16` en móvil; `Sheet` lateral de 480 px para crear/editar, `Dialog` para confirmar (§3.7–3.8) |
| 9 | Lucide + simple-icons monocromos, 16/18/20 px, `stroke 1.5` (§3.9) |
| 10 | Estados vacíos solo con texto y una acción, caja con borde discontinuo; sin motivo generativo (§3.1) |
| 11 | Transiciones 120 ms salida / 160 ms entrada + 8 px, `--ease`; sin GSAP (rAF + CSS); la animación se retira al terminar para no romper los `fixed` (§1.7) |
| 11b | Cabecera: activo = línea de 1 px violeta bajo el enlace + texto pleno; `[Contacto]` `primary sm` 38 px en escritorio y 44 en móvil (el hero usa `lg` 50); fondo `bg/.72` + blur 12 + línea tras 80 px en 180 ms; menú del avatar como `DropdownMenu`; en 375 `Contacto` (44) y `Menú` (44) con 2 px de separación, comprobado |
| 11c | "Esta web" del pie: rama · commit · fecha · LCP móvil · stack en una línea · dos enlaces, mono 12. Esquema de `BuildFacts`: `pre` mono 13 con `overflow-x` en escritorio y **versión corta de 5 líneas** en móvil (mono 12), sin gráficos |
| 11d | `PathPanel`: §3.3 (panel entero enlace por pseudoelemento, secundario por encima, `focus-within` con outline, miniatura 160 / 88 px, hover = halo + `surface-2` + morph corto) |
| 12 | `ProposalCard`: §3.4 (halo en reposo, precio 28, extras separados con "Opcional · no incluido"), legible en 390 px |
| 13 | Sí a los cuatro eventos extra de Umami; no afectan a la UI |
| 14 | **Sin acceso flotante al chat** en escritorio: el chat vive en el menú del avatar, en el pie y en las páginas donde tiene sentido; un botón flotante competiría con el badge y con "Hablamos" |
| 15 | "Jose Carlos / Sánchez" en dos líneas cabe a 41 px en 375 px (comprobado); si Jose añade el segundo apellido, tres líneas y el enlace del CTA baja de fila (UX §4.1) |
| 16 | `ScoreBadge`, `DeadlineTag`, `MailTag`, `StatusCounters`, tabla de cinco columnas y `RadarCard` con acciones de 44 px, barra de decisión fija: §3.8 |
| 17 | `MaterialEditor`: `textarea` mono + previsualización renderizada (no WYSIWYG), `mark.ref` / `mark.ref--bad` con `title`, `select` real de versiones, `details` en móvil, hoja del PDF compartida con la previsualización del CV: §3.8 |
| 18 | `RadarCalendar` **sin librería**: Agenda (lista por día, por defecto en móvil) + Semana (rejilla CSS) + Mes (rejilla 7 × n); propuestos con borde discontinuo **y** texto "Propuesto"; shadcn `calendar` solo como selector de fecha: §3.8 |
| 20 | **Alternativa B** (decisión de Jose, spec v1.5.2): subtítulo por audiencia sin tecnologías, CTA como el prototipo. La referencia la lleva |
| 21 | **Indicador sin palabras**: tres segmentos de 22 × 2 px bajo la escena, el activo se rellena en verde durante el hold (3,5 s) y queda en verde atenuado hasta el siguiente ciclo; con vídeo se sincroniza con `currentTime`; con poster, el primero fijo; sin JS no se pinta; `aria-hidden`. Sustituye a "móvil · web · IA · chip": Marta no lee "chip" y Dani entiende que la escena cicla |

---

## 6. La referencia `ref/ui-v3/`

| Fichero | Qué es |
|---|---|
| `tokens.css` | `:root` con todos los tokens de §1 + primitivos de §3.1 (`.btn`, `.chip`, `.tag`, `.score`, `.panel`, `.input`, `.switch`, `.otp`, `.seg`, `.tabs`, `.table`, `.alert`, `.skeleton`, `.empty`, `.toast`, `.overlay`/`.modal`, `.sheet`, `.ch`/`.is-wet`). Es lo que se traslada a `globals.css` y a los `className` de shadcn |
| `styles.css` | Composición: `SiteHeader`, menú, hero, ProofStrip, PathPanel, ProjectCard, BuildFacts, PostCard, Hablamos, SiteFooter, shell del admin (sidebar / barra inferior), bandeja (tabla y tarjetas), detalle (dos columnas / barra de decisión), kit |
| `ui.js` | Script clásico (abre desde `file://`): vistas por hash con `PageTransition`, cabecera con `is-scrolled`, menú móvil, `IntroFall` (lado DOM, mismo algoritmo que el prototipo, con `sr-only` + `aria-hidden`), `CompileReveal` v3, modal/hoja/toast, switch, chips, tabs |
| `index.html` | Las cuatro vistas + módulo inline de la escena (copia funcional de `hero-lab-3/app.js` con PRNG con semilla, sin panel, con `still()` para poster y miniaturas, poster en móvil y pausa fuera de viewport) |

Qué está **simulado** y en producción es distinto:
- Poster y miniaturas se capturan en el navegador al arrancar (WebGL → `WebGLRenderTarget` → WebP con alfa); en producción son AVIF generados en build (diseño técnico §1.6.3) y están en el HTML desde 0 ms. En móvil la referencia carga Three solo para capturar el poster y libera el contexto; en producción no se descarga Three en móvil.
- Los sprites de PathPanel son dos stills con crossfade, no una tira de 24 fotogramas.
- Las capturas de los `ProjectCard` son esquemas CSS (barras y bloques) en lugar de capturas reales de producto.
- El retrato es un icono monocromo en el hueco tratado; la foto real la pone Jose.
- Datos de `ProofStrip`, `BuildFacts`, pie y Radar son de ejemplo (los `{{DATO}}` de UX §18 siguen pendientes de Jose).
- La escena viene de jsDelivr por importmap; en producción `three` se empaqueta desde npm por `import()` tras el LCP.
- El conmutador `home · radar · detalle · kit` abajo a la derecha es solo de la referencia.

---

## 7. Limitaciones y siguientes pasos

1. **Medios reales del hero**: hasta que exista `packages/glyph-scene/scripts/render-media.ts`, el poster AVIF con alfa y el vídeo no existen; la tarea 0 del hero debe confirmar que AVIF con alfa cabe en 60 KB (si no, poster opaco con el mismo `#05060f` y aceptar un cuadro tenue de ≤ 1 s en escritorio, o generar el poster con el rayo y las radiales ya pintados).
2. **Tabla del Radar a 1.024 px**: desplaza dentro del panel; el implementador puede ocultar la columna "Oferta" por debajo de 1.100 px si Jose lo prefiere a desplazar.
3. **`RadarCalendar`** está especificado (§3.8) pero no prototipado en la referencia; construirlo con CSS grid según la spec de arriba.
4. **Páginas no prototipadas** (Empresas, Negocios, generador, ficha, blog, contacto, auth, área): la referencia cubre sus piezas en el kit (botones, chips, formularios, OTP, segmento, alertas, vacío, carga, PackCard, PriceTag, ProposalCard, burbujas); las composiciones siguen los wireframes de UX con los tokens de §1.
5. **Rendimiento**: nada medido aquí. `check-hero-bundle`, Lighthouse CI y el assert de LCP (diseño técnico §8.5–8.6) son la comprobación real.
6. **Foto de Jose, nombre a mostrar y `{{DATO}}`**: pendientes de Jose (ESTADO.md); la referencia usa "Jose Carlos Sánchez" y "Alicante" como ejemplo.
7. **Revisión de la implementación**: al terminar cada rama con UI, `ui` en modo revisión con `design-review` + `web-design-guidelines` contra esta referencia (espaciado en escala de 4, un primario por pantalla, estados completos, nada de gradientes decorativos, tarjetas solo donde se compara o se elige).

---

## 8. Cambios v3 (2026-09-19)

- Reescrito desde cero a partir de `hero-lab-3`: se retiran los materiales de cuatro capas, el FLIP entre secciones, el hero compilar → minimizar, las dos variantes de acento y la pareja Geist de la v2.
- Tokens únicos (sin "PENDIENTE DE JOSE"): color con contraste comprobado, tres familias, escala, espaciado, radios, cantos de luz, `Backdrop`, capas y puente `@theme`.
- Motion reducido a los cinco recursos de UX §3.7 con valores; GSAP acotado a pinning, galería y trayectoria.
- Inventario completo de componentes con base shadcn, variantes y estados, incluido Radar (bandeja, detalle, materiales, calendario, plataformas, perfil).
- Decisiones §13.1–13.21 de UX cerradas, incluida 13.21 (indicador de tres segmentos).
- Referencia nueva `ref/ui-v3/` (home completa + Radar + kit) comprobada en escritorio y 375 px, consola limpia; `ref/home-v3/` y `ref/colores*.html` quedan como histórico.
