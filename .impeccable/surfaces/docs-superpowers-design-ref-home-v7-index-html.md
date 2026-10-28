---
version: 1
slug: "docs-superpowers-design-ref-home-v7-index-html"
primary_target: "docs/superpowers/design/ref/home-v7/index.html"
related_targets: ["docs/superpowers/design/ref/home-v7/base.css", "docs/superpowers/design/ref/home-v7/v7.css", "docs/superpowers/design/ref/home-v7/base.js", "docs/superpowers/design/ref/home-v7/v7.js", "docs/superpowers/design/ref/home-v7/scene.js"]
---

# Home `/` (prototipo home-v7, «bento por escenas», reposicionamiento freelance)

Supera al contrato de home-v6 (`docs-superpowers-design-ref-home-v6-index-html.md`), que queda como histórico cuando Jose apruebe la v7 (gate de la tarea 2.0). Mismo sistema visual: `DESIGN.md` + `.impeccable/design.json` (con diez tokens nuevos: `tint-preview`, `demo-loop`, `gap-split`, `cell-narrow`, `packs-row`, `vias-split`, `highlight` y sus tres opciones `highlight-ice`, `highlight-orchid`, `highlight-peach`). Aquí va solo lo propio de esta superficie; el detalle, los desvíos y las decisiones abiertas están en `docs/superpowers/design/ref/home-v7/README.md` (§10–§15).

Modo: Persuadir. Identidad única: Jose, desarrollador freelance (spec v2.0 §0, D36). Personas: Marta (móvil, negocio local, quiere precio), Dani (CTO, por horas o encargo), Nuria (agencia que subcontrata), Pablo (reclutador, quiere el CV). Ninguna pesa más que otra en la home. Acción primaria del hero: **Servicios y precios** (propuesta pendiente de Jose); «Ver proyectos» como hermana fantasma. Sin métricas; precios «desde» siempre con «sin IVA» antes de la cifra y solo de `pricing.json`. Contenido pendiente marcado como {{DATO}}.

## Direction contract

THESIS: Una escena, cuatro puertas. El estándar de la categoría ejecutado a nivel de estudio (claridad de raycast.com, movimiento de igloo.inc), con la nube de glifos del hero como única idea propia. Tras el hero, la home se recorre como escenas a pantalla con titular a dos tonos y bento de tres celdas. La escena Servicios es un selector de vías con el precio dentro de cada fila: elegir una cambia una frase y una sola acción sólida. Se rechazan la rejilla de cuatro tarjetas iguales (una por vía), cuatro botones sólidos en una escena, «recomendado» o regalos, métricas y WebGL fuera del hero.

OWN-WORLD: Igual que la v6. Índigo como material (#07060F con grano y campo de haces violeta), texto lavanda en tres escalones, violeta sólido #7C6CFF con texto índigo solo para la acción primaria, tarjetas de vidrio índigo con filete violeta interior, verde solo para lo vivo. Geist; Geist Mono solo en teclas, idioma, glifos y {{DATO}}. Iconos Lucide. Unidades relativas y fluidas.

STORY: Quién es y qué construye (nube) → Sobre mí (una persona, no una agencia; CV a mano) → Servicios (cómo trabajar conmigo, con precios: por hora, proyecto cerrado, packs y abierto a contratación —etiquetas visibles en propuesta—; cinco packs; tarifas; puerta de agencias) → Proyectos en uso (carrusel fijado) → Lab/Blog (una demo viva y dos guías) → «¿Empezamos?» (WhatsApp o reserva, y ⌘K).

FIRST VIEWPORT: Split 5/7 a 100svh como la v6, sin badge ni eyebrow: h1 con el nombre, subtítulo de identidad única en una frase, [Servicios y precios] sólido (→ /servicios) y [Ver proyectos] fantasma (→ /proyectos) del mismo alto. Cabecera: marca, Sobre mí · Servicios · Proyectos · Lab · Blog (rutas propias); a la derecha EN → ⌘K → Chat → Login. Sin «Contacto» ni «Partners» en la barra.

FORM: Bento por escenas con container queries, paginado por gesto con puntero fino, carrusel fijado en Proyectos, celdas principales ampliables con View Transitions, indicador de sección (5 líneas; 4 sin Lab/Blog). Servicios en 12 + 7 + 5: vías (lista y panel lado a lado desde 40rem de celda), packs (cinco en fila desde 36rem, si no lista; P5 separado de P1–P4 por hueco y filete) y tarifas. Lab/Blog en 6 + 3 + 3, con variantes por contenido (solo blog, solo lab, ninguno: la escena no existe).

SIGNATURE: (1) La nube de glifos del hero (póster con reduced motion o sin JS). (2) El selector de vías: radios nativos, resaltado que se desliza solo a la vía elegida, hover que tiñe sin aparentar selección, panel que cambia con fundido y leve desenfoque sin mover el layout. (3) La demo del Lab: miniatura del paginado de esta misma home, quieta como póster y viva solo con hover o foco. (4) Entradas ligadas al scroll y paleta ⌘K sin animación.

FINISH: prototype, pending Jose's browser approval (gate 2.0, paso 4) and `revisor` (paso 3). Audit 16/20 and critique 24/36 (heuristic 9 n/a) on 2026-10-28, findings and fixes in README §14. Record screenshots in `docs/superpowers/design/ref/home-v7/capturas/` (Servicios y Lab/Blog a 360, 900 y 1440). New tokens emitted with `pnpm tokens:build` (design-tokens tests 23/23). Copy proposals (hero CTA label, way names, «Cómo trabajar conmigo», «¿Eres una agencia?») pending Jose and `redactor` before they reach `messages`; pack names stay as in `pricing.json`.

## Reglas de esta superficie

- La home es una muestra: cabecera, menú, ⌘K, pie y los enlaces de las celdas llevan a pantallas propias (`/sobre-mi`, `/servicios`, `/proyectos`, `/lab`, `/blog`, `/partners`, `/contacto`, `/chat`, `/auth`…). Solo el indicador de sección, el paginado, «Saltar al contenido» y la marca se quedan dentro de la home. En el prototipo, un clic a una ruta interna muestra un aviso en vez de navegar.
- Cabecera: Sobre mí · Servicios · Proyectos · Lab · Blog (dos enlaces). La escena a la vista se marca solo con color.
- Sin celda ampliada por defecto (⤢ fuera; `?ampliar=1` para comparar), hasta que Jose decida.
- Segundo tono de los titulares en el color de destaque (`highlight`; opciones ice / orchid / peach, `?tono=a|b|c`). Nunca en botones, enlaces ni estados.

- Una sola acción sólida por vista dentro de Servicios: la del panel de la vía elegida. Packs y Tarifas solo llevan enlaces; con la celda de vías ampliada, el botón del panel baja a fantasma.
- La cifra de cada vía va dentro de su `label` y se ve a cualquier ancho (bajo 26rem baja bajo el nombre; nunca se oculta).
- «Precios sin IVA.» antes de cualquier cifra; «desde» antes de cada precio «desde».
- Elegida y hover nunca se parecen: la elegida lleva tinte, filete e icono violeta sólido; el hover solo un tinte del 6 %.
- «Para agencias» visible en la escena Servicios con cualquier vía elegida, además de en ☰, ⌘K y pie.
- En la vía de empleo, «Descargar CV» es la acción primaria; también está en la celda Sobre mí.
- Vías y tarifas funcionan sin JS (`:has()`); sin JS, ☰ es un enlace al pie y lo que necesita JS no se ofrece.
- La demo del Lab es `aria-hidden` y no es una parada de Tab; su descripción va en texto.

## Decisiones de Jose sobre esta superficie

Se heredan las de la v6 (sin badge ni eyebrow, «Contacto» fuera de la barra, idioma dentro de ☰ bajo 1080 px, titular a dos tonos, estilo de tarjetas, glifos solo en hero y Proyectos). Las decisiones abiertas de la v7 están en el README §15 y se anotan aquí cuando Jose las cierre en el navegador.
