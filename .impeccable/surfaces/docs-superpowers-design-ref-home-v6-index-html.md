---
version: 1
slug: "docs-superpowers-design-ref-home-v6-index-html"
primary_target: "docs/superpowers/design/ref/home-v6/index.html"
related_targets: ["docs/superpowers/design/ref/home-v6/base.css", "docs/superpowers/design/ref/home-v6/v6.css", "docs/superpowers/design/ref/home-v6/base.js", "docs/superpowers/design/ref/home-v6/v6.js", "docs/superpowers/design/ref/home-v6/scene.js"]
---

# Home `/` (prototipo home-v6, «bento por escenas»)

Supera al contrato de home-v4 (`docs-superpowers-design-ref-home-v4-index-html.md`), que queda como histórico. Versión elegida por Jose el 2026-09-29, tras la revisión de acabado de impeccable, sus arreglos y la revisión de código (commit 60ef304). El sistema visual está en `DESIGN.md`; aquí va solo lo propio de esta superficie.

Modo: Persuadir. Audiencias con el mismo peso: Marta (móvil, negocio local) y Dani (escritorio, CTO o reclutador). Acción primaria: Ver proyectos. Salida de Marta en el mismo viewport: «Una web para mi negocio →», y después Packs, propuesta al momento o WhatsApp. Sin métricas (ni contadores, ni repos, ni apps publicadas); los precios «desde» sí se muestran. Contenido pendiente marcado como {{DATO}}.

## Direction contract

THESIS: El estándar de la categoría, ejecutado a nivel de estudio (la claridad de raycast.com y el movimiento de igloo.inc). Una sola idea propia: la nube de glifos de código en el hero, que forma por turnos un móvil, una web y un chip. Después, la home se recorre como una secuencia de escenas a pantalla, cada una con un titular a dos tonos y un bento de tres celdas. Se rechazan la rejilla de tarjetas iguales, el vidrio de plantilla, los halos morados, la franja de métricas y el WebGL fuera del hero.

OWN-WORLD: Índigo como material. Fondo #07060F con grano y un campo de haces violeta que sigue a la nube y un poco al cursor. Texto lavanda #ECE9FF, secundario #A9A3D6, terciario #8C86BD. Botón primario violeta sólido #7C6CFF con texto índigo. Tarjetas de vidrio índigo algo más claras que el fondo (card, rgb(22 19 48 / 0.84)) con filete violeta interior (card-line, al 18 %). Verde #3DDC84 solo para lo vivo. Geist; Geist Mono solo en teclas, idioma y glifos. Iconos Lucide. Unidades relativas y fluidas.

STORY: Quién es Jose y qué construye (la nube en el hero) → Sobre mí (una persona, no una agencia) → Empresas (servicios, tarifas, reservar 20 min) → Negocios (cuatro packs con precio cerrado, propuesta al momento, qué incluye) → Proyectos en uso (carrusel fijado) → Blog → «¿Empezamos?» (WhatsApp o reserva, y ⌘K).

FIRST VIEWPORT: Split 5/7 a 100svh. A la izquierda, sin badge ni eyebrow: h1 con el nombre en dos líneas, subtítulo con las dos audiencias, [Ver proyectos] y el enlace «Una web para mi negocio →» en la misma fila. A la derecha, el escenario de la nube con tres barras de ciclo. Cabecera: marca y secciones; a la derecha idioma → buscador ⌘K → Chat → Login. Sin «Contacto» en la barra. Bajo 900 px, el escenario sube encima del texto en un cuadrado de min(38svh, 100%).

FORM: Estándar de la categoría (canon). Bento por escenas con container queries, paginado de una escena por gesto con puntero fino, Proyectos como carrusel horizontal fijado ligado al scroll, celdas principales que se amplían con View Transitions, indicador de sección en el margen derecho que nunca aparece en el hero.

SIGNATURE: (1) La nube de glifos del hero y el campo de luz que la sigue; imagen estática con reduced motion. (2) Un gesto con propósito por celda: luz bajo el cursor, marquesina doble del stack, mini chat que se escribe, selección deslizante en Servicios y Packs, selector de tarifa, checks que se dibujan, arte de glifos que flota en la tarjeta de proyecto activa. (3) Entradas y salidas de cada pieza ligadas al scroll. (4) Paleta ⌘K sin animación. Hover solo con puntero fino; con reduced motion todo queda en su estado final.

FINISH: reviewed (impeccable finish review 2026-09-29, fixes 79e2516, dfa775f, 412a789, 07afeb9, 22f6358, 60ef304; code review approved) and documented in DESIGN.md and .impeccable/design.json. Screenshots in `.impeccable/review/v6/` (git-ignored). Shipping rasters `glyph-phone-alpha.png` (hero reduced-motion still and project art) and `glyph-web2-alpha.png` (project art) are copies of the glyph assets in `ref/figma-assets/` (commit 80e032a); `glyph-chip-alpha.png` sits in the folder unused.

## Decisiones de Jose sobre esta superficie

- Sin badge ni eyebrow en el hero; sin antetítulos sobre los nombres de proyecto.
- «Contacto» fuera de la barra de la cabecera; vive en el cierre, en ⌘K y en el menú ☰.
- En ≤ 1080 px, el idioma va dentro del menú ☰.
- El titular a dos tonos se mantiene en todas las escenas.
- Las tarjetas conservan su estilo; su separación del fondo se reforzó un poco con card y card-line.
- Los glifos son un detalle discreto: hero y arte de Proyectos, nada más por ahora.
- El aire de la celda Sobre mí se resuelve al diseñar ese apartado.
