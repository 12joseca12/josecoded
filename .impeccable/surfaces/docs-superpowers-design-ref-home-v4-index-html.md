---
version: 1
slug: "docs-superpowers-design-ref-home-v4-index-html"
primary_target: "docs/superpowers/design/ref/home-v4/index.html"
related_targets: []
---

# Home `/` (prototipo home-v4)

Modo: Persuadir. Audiencias con el mismo peso: Marta (móvil, negocio local) y Dani (escritorio, CTO o reclutador). Acción primaria: Ver proyectos. Salida de Marta en el mismo viewport: Una web para mi negocio, y después WhatsApp. Sin métricas (ni contadores, ni repos, ni apps publicadas, ni LCP); los precios «desde» sí se muestran. Contenido pendiente marcado como {{DATO}}.

## Direction contract

THESIS: El estándar de la categoría, ejecutado a nivel de estudio (la claridad de raycast.com y el material 3D de igloo.inc). Una sola idea propia: la nube de glifos de código es el único objeto de la web y recorre la página formando, en cada bloque, lo que ese bloque ofrece. Se rechazan la rejilla de tarjetas iguales, el vidrio decorativo, los halos morados y la franja de métricas.

OWN-WORLD: Índigo como material (revisión del 24-09 a petición de Jose: «fondo muerto, textos y botones demasiado blancos»). El fondo #0D0B1F lleva un campo de luz de haces violeta #5B4BFF/#9D8CFF que sigue al objeto por la página y un poco al cursor. Texto lavanda #ECE9FF, secundario #A9A3D6. Botón primario violeta sólido #7C6CFF con texto índigo. Superficies de vidrio índigo con filete violeta. Verde #3DDC84 solo para disponible. Geist; Geist Mono solo en código y teclas. Iconos Lucide.

STORY: Quién es Jose y qué construye (el móvil, la web y el chip formados de código) → dos puertas del mismo peso → pruebas reales en una ventana tipo Raycast → cómo está hecha esta web → hablar (WhatsApp o reserva).

FIRST VIEWPORT: Split 5/7. A la izquierda, badge verde, h1 con el nombre en dos líneas a 5,5 rem, subtítulo B para las dos audiencias, [Ver proyectos] y el enlace «Una web para mi negocio →» en la misma fila. A la derecha, la escena viva a pantalla completa detrás. En la cabecera, la paleta ⌘K.

FORM: Estándar de la categoría (canon), elegido por Jose tras dos tiradas; seed b48c4231.

SIGNATURE: (1) La nube guiada por el scroll y el campo de luz que la sigue. (2) Tarjetas con luz y canto: el borde se enciende bajo el cursor, la flecha avanza y el enlace se resuelve en glifos. (3) Botones magnéticos con muelle y pulsación a 0,96. (4) Paleta ⌘K sin animación. Salidas con ease-out de 150 a 200 ms y hover solo con puntero fino. Los h2 se resuelven glifo a glifo una sola vez; con reduced-motion no hay imán, ni luz que siga, ni haces que se muevan.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
