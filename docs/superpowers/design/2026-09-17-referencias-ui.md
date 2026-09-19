# joseCoded — estudio de referencias de UI (R14)

**Fecha:** 2026-09-17 · **Autor:** `ui` · **Para:** dirección visual v3 de la home (spec §12 UI/R14, UX v2.1 §3 y §4.1).
**Método:** cada web se abrió en Chromium con GPU (gstack `browse --headed`, 1440×900), se hizo scroll, se abrieron menús y fichas, y se leyeron los estilos computados (`getComputedStyle`) de cabeceras, botones, tarjetas y títulos. Las capturas están en `ref/referencias/` (JPEG, 1200 px de ancho). Lo que no se pudo leer del DOM (igloo y activetheory pintan casi todo en WebGL) se describe a partir de las capturas.

Regla de este documento: cada técnica anotada tiene que ser reproducible en HTML/CSS/GSAP sin WebGL pesado. Lo que solo es posible con shaders se anota como "no se toma".

---

## 1. raycast.com — limpieza y claridad

Capturas: `raycast-home.jpg`, `raycast-nav.jpg`, `raycast-cta.jpg`, `raycast-scroll1.jpg`, `raycast-scroll2.jpg`, `raycast-cards.jpg`.

| # | Técnica observada | Valores leídos | Reproducible |
|---|---|---|---|
| R1 | **Fondo oscuro no negro puro, frío.** | `body { background: #07080A }` (rgb 7,8,10). Texto blanco puro para titulares; secundarios en `rgba(255,255,255,.4–.7)` y grises `#9C9C9D`, `#6A6B6C`. | CSS |
| R2 | **Barra de navegación como pieza de vidrio con canto iluminado.** No es "glassmorphism" de plantilla: gradiente de material + desenfoque bajo + borde tenue + luz de 1 px arriba. | `background: linear-gradient(137deg, rgba(17,18,20,.75) 4.87%, rgba(12,13,15,.9) 75.88%)`, `backdrop-filter: blur(5px)`, `border: 1px solid rgba(255,255,255,.06)`, `border-radius: 16px`, `box-shadow: inset 0 1px 1px rgba(255,255,255,.15)`. | CSS |
| R3 | **Botón primario "acabado".** Cuatro sombras apiladas: anillo oscuro exterior, halo suave, sombra interna en el canto inferior y luz interna en el canto superior. Transición corta. | `background: #E6E6E6`, `box-shadow: 0 0 0 2px rgba(0,0,0,.5), 0 0 14px rgba(255,255,255,.19), inset 0 -1px .4px rgba(0,0,0,.2), inset 0 1px .4px #fff`, `border-radius: 8px`, `height: 36px`, `transition: box-shadow .2s ease-in-out, transform .1s`. | CSS |
| R4 | **Tipografía con roles.** Una grotesca para todo (Inter) y una monoespaciada para datos y notas técnicas (GeistMono 12 px, JetBrains Mono 12 px con tracking 1.44 px y color de acento para etiquetas). Titular 64 px / 600 / line-height 1.1, tracking normal; subtítulos 32 px / 500 / −0.8 px; cuerpo 16–18 px / 400. | Inter 64/600/1.1; Inter 18/400 `rgba(255,255,255,.5)`; GeistMono 12 `#9C9C9D`; JetBrains Mono 12/500 tracking .12em. | Fuentes distintas, misma lógica |
| R5 | **Jerarquía por opacidad, no por tamaño.** El texto secundario del mismo bloque va al 40–60 % de blanco; los títulos de sección son 20 px/500 con la segunda línea en gris (`raycast-scroll2.jpg`: "There's an extension for that." / gris "Use your favorite tools…"). | `color: rgba(255,255,255,.4)` / `#6A6B6C`. | CSS |
| R6 | **Luz volumétrica como fondo del hero.** Bandas diagonales de color con desenfoque y ruido, detrás del titular; el titular queda nítido y el fondo es lo que "impresiona". | Imagen/vídeo; en nuestro caso: capas CSS con `filter: blur()` + `mask-image` + ruido SVG. | CSS |
| R7 | **Tarjetas con color propio y superficie casi transparente.** Tarjetas de extensiones a `rgba(255,255,255,.02)` con radio 30 px y un halo de color por tarjeta (azul/índigo/verde) que se funde en el fondo; el contenido (icono en cápsula con borde) es lo que aporta el material. | `background: rgba(255,255,255,.02)`, `border-radius: 30px`; el color viene de un gradiente radial interior. | CSS |
| R8 | **Control segmentado como material.** Píldora contenedora con borde tenue; el segmento activo es una cápsula más clara con sombra suave; el resto, texto gris. | `raycast-scroll2.jpg` (Productivity · Engineering · Design · Writing). | CSS |

**Qué NO tomamos de Raycast:** el negro casi absoluto (Jose: "no tan negro"); Inter; el rojo; la composición de landing (hero → filas de features).

## 2. igloo.inc — profundidad, materiales y estado que se transforma con el scroll

Capturas: `igloo-home.jpg`, `igloo-scroll1.jpg`, `igloo-scroll2.jpg`, `igloo-scroll4.jpg`. Todo es un canvas WebGL (`#webgl`, sin DOM de texto); lo que sigue se deriva de las capturas.

| # | Técnica observada | Cómo se ve | Reproducible |
|---|---|---|---|
| I1 | **Luz que atraviesa el material.** Los bloques de hielo tienen los cantos iluminados (subsurface): borde claro de 1–2 px, interior más oscuro, y la luz "sale" por las juntas. | `igloo-scroll1.jpg`, `igloo-scroll2.jpg`. | Sí, como material CSS: borde de 1 px con gradiente claro arriba, `inset` oscuro abajo, luz radial detrás. |
| I2 | **Niebla volumétrica y profundidad por desenfoque.** Fondo con montañas desaturadas y niebla; lo lejano está más borroso y más claro; lo cercano, nítido y con más contraste. | `igloo-home.jpg`. | Sí: capas con `filter: blur(Npx)` y opacidad decreciente, más una capa de "niebla" (gradiente radial suave). |
| I3 | **Overlay de datos técnicos en mono.** Etiquetas pequeñas monoespaciadas con prefijos `//` y `//////`, alineadas a las esquinas ("// Copyright", "////// Manifesto", "Scroll down to discover", "Sound: On"). Es la única tipografía visible: mono, 12–13 px, blanco al 80 %. | `igloo-scroll1.jpg` esquinas. | Sí; coincide con la "línea de estado" del shell IDE-lite. |
| I4 | **Nodos numerados unidos por líneas** sobre el objeto (37, 34, 21, 30, 16) que aparecen al avanzar el scroll: la información "se ancla" a la geometría. | `igloo-scroll1.jpg`. | Sí, en SVG: puntos + polilínea con `stroke-dashoffset` animado. Encaja en "Cómo está hecha esta web" (capas de arquitectura con etiquetas). |
| I5 | **El scroll es una máquina de estados, no un desplazamiento.** La rueda avanza la transformación del igloo (se desmonta, se recompone, se entra) y el viewport no se mueve; cada tramo de scroll tiene un estado final claro. | Comparar `igloo-scroll2.jpg` y `igloo-scroll4.jpg`. | Parcialmente: sin pinned largos (UX §3.7). Lo tomamos como *morph* corto entre secciones (FLIP) y como "capas que se separan" con `ScrollTrigger` en un solo bloque. |
| I6 | **Brackets de esquina como marco de foco.** Los enlaces sociales del final ("[ LinkedIn ]") llevan cuatro esquinas dibujadas, no un botón relleno; el elemento activo es nítido y los vecinos se desvanecen. | `igloo-home.jpg`, parte inferior. | Sí: pseudoelementos con bordes de esquina; es un buen estado de foco/hover para el índice de secciones. |
| I7 | **Plataforma de anillos concéntricos** bajo el objeto: da suelo y perspectiva sin 3D real. | `igloo-home.jpg`. | Sí, con elipses CSS y `perspective`; se usa con moderación (fondo del bloque de arquitectura). |
| I8 | **Paleta: un solo tono (azul-gris) desaturado + blanco.** No hay color de acento; la emoción viene de la luz. | Todas. | Referencia para los neutros con temperatura fría de nuestra paleta; nosotros sí añadimos acento (verde/morado). |

**Qué NO tomamos:** WebGL, sonido, partículas de nieve, el bloqueo del scroll nativo durante toda la página.

## 3. lusion.co — micro-detalle en tipografía, transiciones y botones

Capturas: `lusion-home.jpg`, `lusion-buttons.jpg`, `lusion-scroll1.jpg`, `lusion-scroll2.jpg`, `lusion-scroll3.jpg`, `lusion-menu.jpg`, `lusion-title-roll.jpg`.

| # | Técnica observada | Valores leídos | Reproducible |
|---|---|---|---|
| L1 | **Texto por caracteres apilados (roll).** Cada carácter del título es una columna `flex-direction: column` con 4 copias del mismo carácter; el hover/scroll desplaza cada columna con `translate3d(0, -N%, 0)` y N distinto por carácter (onda). Se ve como si las letras "rodaran" con la velocidad del scroll. | `.project-item-line-2-inner-list { display:flex; flex-direction:column; transform: translate3d(0em, -2.5%, 0) }` con `<span>O</span>×4`. | Sí, en JS + GSAP. Se toma solo en dos sitios (título de sección al abrir y enlaces del índice), no en cuerpo. |
| L2 | **Scramble en las metaetiquetas.** La línea de categorías termina en caracteres aleatorios (`concept • web • design • development@4NY[`) que se resuelven al entrar en viewport. | Texto visible en el DOM. | Sí; es la base de nuestro `CompileReveal` y del código de fondo del hero. |
| L3 | **Enlace con flecha que empuja el título.** Al hover, `→` entra desde la izquierda (`translateX(0em)`) y el título se desplaza a la derecha en la misma duración. | `.project-item-line-2-icon { transform: translateX(0em) }`; `lusion-title-roll.jpg`. | Sí; hover del índice de secciones y de proyectos. |
| L4 | **Botones cápsula de dos niveles.** Primario: `#2B2E3A` con texto blanco y un punto "•" a la derecha; secundario: `#E4E6EF` con texto negro. Altura 44.8 px, radio 87.5 px, `transition: color .4s, background-color .4s`. El "Menu ••" cambia a "Close ⋮" (el icono rota/se reordena). | `lusion-buttons.jpg`, `lusion-menu.jpg`. | Sí; tomamos la altura 44 px, la píldora y el icono que se transforma; no el 0.4 s (demasiado lento para nuestro vocabulario ≤ 200 ms en micro). |
| L5 | **Menú como pila de paneles que se despliegan.** El menú no es un overlay a pantalla completa: tres paneles redondeados (enlaces · newsletter · Labs) caen en cascada desde el botón; el resto de la página sigue visible y se oscurece. El enlace activo lleva un punto a la derecha. | `lusion-menu.jpg`. | Sí; es la hoja "Menú" en escritorio y móvil (UX §3.4) con cascada de 3 bloques. |
| L6 | **Enlaces con clon para el hover.** Cada enlace del menú tiene `.header-menu-link-text` y `.header-menu-link-text-clone`: el texto sale hacia arriba y el clon entra desde abajo (roll de una línea). | HTML leído. | Sí; hover de los nodos del árbol y de las pestañas. |
| L7 | **Rejilla de proyectos con imágenes de esquinas grandes (radio ≈ 16 px), meta en mayúsculas 13 px y título 38 px/400.** El ritmo lo dan los tamaños, no las tarjetas: no hay bordes ni fondos. | `lusion-scroll1.jpg`, `lusion-scroll2.jpg`. Aeonik 38/400; meta 13/400 uppercase. | Sí; nuestros proyectos van sin tarjeta: marco de capturas + meta + título. |
| L8 | **Transición de página "a través" de la escena.** Al navegar, la escena 3D se acerca y desenfoca (motion blur) y la nueva página aparece detrás. | `lusion-scroll3.jpg`. | Se toma la idea, no la técnica: en nuestro morph, el bloque origen se expande y el resto se desenfoca ligeramente (`filter: blur(6px)` + opacidad) durante 300–400 ms. |

**Qué NO tomamos:** fondo claro, WebGL, cursor personalizado, duraciones de 0.4–0.5 s en hovers.

## 4. activetheory.net — luz, vidrio y color sobre oscuro

Capturas: `activetheory-home.jpg`, `activetheory-scroll1.jpg`, `activetheory-nav.jpg`, `activetheory-work.jpg`, `activetheory-work-card.jpg`, `activetheory-work-labels.jpg`.

| # | Técnica observada | Cómo se ve | Reproducible |
|---|---|---|---|
| A1 | **Navegación como píldora de vidrio con luz que "gotea".** "WORK ——— CONTACT" en mono, dentro de una cápsula con borde de 1 px claro, fondo casi negro semitransparente, y debajo una luz verde difusa con líneas verticales finas (como si la cápsula estuviera iluminada desde dentro). | `activetheory-nav.jpg`. | Sí: cápsula con `backdrop-filter`, `box-shadow` con halo del acento debajo, y un pseudoelemento con `repeating-linear-gradient` vertical enmascarado. |
| A2 | **Dos colores sobre negro, por zonas.** Verde-teal arriba a la izquierda y morado abajo a la izquierda como *luces de esquina* (gradientes radiales enormes, muy desaturados), no como gradiente global. El contenido no lleva color: lo lleva la luz. | `activetheory-work.jpg`. | Sí: dos `radial-gradient` fijos en el fondo del shell, con `mix-blend-mode: screen`. Responde a "verde/morado" de Jose. |
| A3 | **Tarjetas como paneles de vidrio en perspectiva.** Las fichas de trabajo son placas rectangulares con radio grande, borde claro fino, contenido (vídeo) con velo, ligera rotación 3D y una placa vecina detrás más pequeña y más oscura (profundidad por escala y luminancia). | `activetheory-work-card.jpg`. | Sí: `perspective` + `rotateY(−6deg)` en reposo, `translateZ` al hover, borde de 1 px claro y `box-shadow` interior. Se usa solo en la vista abierta de proyecto. |
| A4 | **Mono en mayúsculas para la interfaz; prefijo `->`.** "WHAT ARE YOU LOOKING FOR?" y la lista "-> WEBSITES / -> INSTALLATIONS…" en `nbarchitekt` 14 px, mayúsculas, tracking normal; el activo cambia de color (violeta). El campo de texto "ASK ME ANYTHING…" es una cápsula con borde claro y fondo transparente. | `activetheory-work-labels.jpg`. | Sí: mono con prefijo en el índice/árbol y en la línea de estado. |
| A5 | **Reflejos iridiscentes en un objeto central** (anillo de cristal con dispersión) y partículas doradas. | `activetheory-scroll1.jpg`. | No se toma (WebGL, partículas prohibidas). La idea del "objeto de cristal con canto que refleja" se traduce en el borde iridiscente sutil del bloque activo (gradiente cónico en el borde, opacidad baja). |
| A6 | **Grano y viñeta.** Todo el fondo lleva ruido fino y las esquinas están más oscuras; evita el aspecto plano. | Todas. | Sí: capa fija con `feTurbulence` SVG al 3 % y viñeta radial. |
| A7 | **Transición de página real.** Al pulsar WORK, la cápsula no cambia; la escena se reemplaza con una entrada de los paneles desde el fondo (escala 0.9 → 1 y desenfoque → nítido). | `activetheory-home.jpg` → `activetheory-work.jpg`. | Sí, en el vocabulario de morph: los bloques nuevos entran con `scale(.96)` + `blur(8px)` → nítido, 360 ms. |

**Qué NO tomamos:** partículas, objeto 3D, sonido, tipografía mono para el cuerpo (UX §3.1 lo prohíbe fuera de la línea de estado).

---

## 5. Síntesis: qué tomamos de cada una para josecoded

| De | Tomamos | Se traduce en |
|---|---|---|
| **Raycast** | Neutros fríos no negros; barra de vidrio con canto de luz (R2); botón primario con cuatro sombras (R3); jerarquía por opacidad (R5); luz volumétrica detrás del titular, titular nítido (R6); mono solo para datos (R4). | Tokens `--bg`, `--surface-*`; material `glass` de `TitleBar` y hoja de menú; `Button primary`; escala de opacidades de texto; fondo del hero. |
| **igloo** | Cantos iluminados y luz que sale por las juntas (I1); profundidad por desenfoque y niebla (I2); overlay mono en esquinas (I3); nodos numerados con líneas (I4); brackets de esquina como foco (I6); scroll como cambio de estado corto (I5). | Material `panel` (borde superior claro + inset); capas del fondo del hero a distinta escala/blur; `StatusLine`; bloque "Cómo está hecha esta web" (capas de arquitectura etiquetadas); estado de foco de `SectionIndex`; morph entre secciones. |
| **lusion** | Roll por caracteres (L1) y scramble en metaetiquetas (L2); flecha que empuja el título (L3); menú en cascada de paneles (L5); enlaces con clon (L6); proyectos sin tarjeta (L7); "a través" del bloque al navegar (L8). | Título del hero y `CompileReveal`; hover del índice y de proyectos; hoja "Menú"; hover del árbol y pestañas; `ProjectCard` sin caja; transición morph con desenfoque del resto. |
| **activetheory** | Luces de esquina verde y morado (A2); píldora de navegación con luz que gotea (A1); paneles de vidrio en perspectiva (A3); mono con prefijo `->` (A4); grano y viñeta (A6); entrada de paneles escala+blur (A7). | Conmutador verde/morado del prototipo; CTA "Contacto" de la barra de título; vista abierta de proyecto; nodos del árbol; capa de ruido global; vocabulario de entrada de secciones. |

**Principio común de las cuatro:** el color y el "wow" están en la luz y en el material, nunca en el texto; el texto es blanco o gris y muy nítido. Eso es lo que separa estas webs de la "estética IA" (texto degradado, tarjetas brillantes) y lo que las dos rondas anteriores no tenían.

**Diferencias con la ronda anterior (por qué esta vez debería funcionar):** (1) las superficies tienen cuatro capas (borde con luz, sombra interna, gradiente de material, ruido) en vez de un `background` plano; (2) las transiciones transforman el bloque origen (FLIP) en vez de atenuar y subir 8 px; (3) el hero tiene profundidad real por capas a distinta escala y desenfoque, con el titular como único elemento nítido; (4) cada hover tiene una respuesta compuesta (luz + desplazamiento + texto) en ≤ 200 ms.
