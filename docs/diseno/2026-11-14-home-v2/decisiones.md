# Home v2: tokens y decisiones

Fecha: 2026-11-14 · Autor: `director-arte` · Rama: `docs/home-redesign-research` · Maquetas: `index.html` (comparador), `r.html`, `v1.html`, `v2.html`, `r-expresivo.html` (ronda 3), `r-expresivo-v1.html` (aprobada en la ronda 2), `home.css`, `expresivo.css`, `expresivo-v1.css`.

Base: `docs/producto/2026-11-14-benchmark-home.md`, la percepción de Marta, Laura y Andrés, y la home actual (`src/components/home/*`, `messages/es.json` → `home.*`, `content/cv.json`, `content/projects/*.mdx`).

## Supuestos (sin entrevista de `impeccable shape`)

No hay `PRODUCT.md` y este encargo llega por un subagente, sin forma de preguntar a Jose. La verdad del producto sale de `brief.md`, `decisiones.md` y el contenido real del repo. Ningún texto afirma nada que no esté ya publicado en la web o en el CV. Lo que falta va como `{{DATO: …}}`.

- Superficie: **persuadir** (convertir por tres vías), dentro del mundo visual ya establecido (Estilo B). Se extiende, no se sustituye.
- Diales (taste): variedad 6, movimiento 4, densidad 5.
- Los textos son propuesta de dirección. Los cierra `redactor`.

## Las tres direcciones

| | Hero, visual | Hero, mensaje | Resto de la página |
|---|---|---|---|
| **R) Prueba primero** (recomendada) | Escenario animado de cinco fases con trabajo real: josecoded.com en el navegador y 3CatInfo en el móvil. Fuera «EJEMPLO» y los datos ficticios | Un H1, un párrafo y dos botones | Igual en las tres |
| **V1) Cara primero** | Retrato 4:5 con nombre y disponibilidad. Sin escenario animado | Igual que R | Igual, salvo que «Quién lo hace» pasa a «Para equipos» (el retrato ya está arriba) |
| **V2) Tres puertas** | Igual que R | Selector «Tengo un negocio / una startup / Busco a alguien para mi equipo» que cambia el párrafo, tres garantías y el botón secundario | Igual |

## Orden de la página (las tres)

1. **Hero**. H1 orientado a resultado: «Tu app y tu web, publicadas y *funcionando*.» El párrafo nombra «desarrollador React Native y Next.js» en la primera línea y 3Cat en la última. «Hablemos» y «Ver proyectos». Debajo, tres garantías en una línea: 30 días de garantía, código y cuentas a tu nombre, te respondo yo.
2. **Franja de prueba** bajo el hero, en cuatro columnas que asoman en la primera pantalla a 1440×900:
   - **Quién lo hace**: retrato, nombre, Madrid, remoto o híbrido, disponibilidad, CV, LinkedIn y GitHub.
   - **Apps publicadas**: 3CatInfo y 3Cat con botones a App Store y Google Play.
   - **En cifras**: 2 apps, 2024, 100 de accesibilidad y un hueco de resultado.
   - **Lo que dicen**: el testimonio. Sin testimonios, esta columna pasa a «Por escrito, siempre»: precio cerrado, 30 días y tarea piloto.
3. **Trabajo publicado**. 3CatInfo en grande, con escenario carbón y captura de su ficha; NextRaket y josecoded en pequeño, con imagen. Debajo, una línea de stack con «Ver el stack completo». Sustituye a StackRow.
4. **Oferta con precio**. A la izquierda, los cinco niveles en filas (nombre · para quién · «Por ejemplo: …» del caso de una pyme · «desde €» y semanas). A la derecha, el **bloque MVP para startups** en carbón: plazo, precio, dedicación, propiedad y tarea piloto. Debajo, dos líneas: refuerzo freelance (€/hora) y contratación (CV y trayectoria). Sustituye a ServicesStrip y TierTeaser.
5. **Cierre**: «Cuéntame qué necesitas», con «Hablemos». A la derecha, el único correo (hola@), WhatsApp y llamada como huecos, y «Sin compromiso. No vendo ni cedo tus datos.».
6. **Nexo**: con el chat apagado no aparece nada (decisión del 2026-11-14). Con el chat encendido, una sola línea discreta en el cierre. NexoSection sale de la home.

**Hoy, sin datos** (botón «Solo lo que hay hoy»): sin retrato ni testimonio. En los niveles, un «Ver qué incluye» por fila y una sola frase de precio cerrado; ninguna chapa «Precio en revisión». El móvil del escenario muestra una ficha tipográfica de 3CatInfo.

## Tokens

Los de `src/styles/tokens.css`, sin colores nuevos. Cambios de uso:

| Token o regla | Hoy | Home v2 |
|---|---|---|
| H2 de sección | `--fs-h2` clamp(2.25–4rem), peso 800, raya coral encima, final en coral | Nuevo `--fs-h2: clamp(1.75rem, 1.2rem + 1.9vw, 2.625rem)`, peso 600, tracking −0.03em, **sin raya y sin coral** |
| Coral | H1 y todos los H2, raya, caja de Nexo | **Solo** en la última palabra del H1 de la home, la flecha de los botones, el aro de hover y el foco (`--coral-deep`) |
| H1 hero | tracking −0.045em | −0.04em (suelo de legibilidad); el resto, igual (`--fs-hero`, 800) |
| Ritmo vertical | bloques de un viewport | `--space-8` (4rem) entre secciones en escritorio y `--space-7` en móvil. Sin `BlockScroll` en la home |
| Contenedor | `--max: 90rem` | 80rem en la home, para que la franja de cuatro columnas no se abra |
| Cifras | proporcionales | `font-variant-numeric: tabular-nums` en cifras, precios y semanas |
| Superficies | tarjetas para todo | Una tarjeta (niveles) y un bloque carbón (MVP) por sección. La franja de prueba usa columnas con filete, sin tarjetas |
| Huecos `{{DATO}}` | — | Solo en las maquetas: mono, `--coral-deep` sobre coral al 8 % y borde discontinuo. No llegan a producción |

Contraste: el acento del H1 (`--coral-text` #e2361e sobre #e4e7ea, 3,5:1) solo se usa en texto grande (≥ 2,5 rem y peso 800), así que cumple AA. El texto secundario sobre carbón usa `--on-dark-soft`.

## Movimiento (`emil-design-eng`)

- **Único momento expresivo**: el escenario de cinco fases (decisión 10.10). Cambia de fase cada `--dur-phase` (4.100 ms), con botón Pausar/Reanudar y las fases pulsables. El texto de la fase entra con opacidad y 4 px de desplazamiento en `--dur` (260 ms) y `--ease-out`. Con `prefers-reduced-motion`, queda fijo en «Publicar».
- **Sin reveals al hacer scroll** en el resto. Una página densa con prueba no necesita entradas: cada animación de sección retrasaría la lectura.
- **Respuesta al usuario**: botones con `scale(0.97)` al pulsar en `--dur-press` (120 ms); la flecha se mueve 2 px al pasar el cursor; tarjetas de proyecto −2 px en 260 ms; se puede interrumpir porque todo son transiciones CSS.
- **V2**: al cambiar de pestaña, el panel entra con la misma transición de 260 ms; las flechas del teclado mueven el foco entre pestañas (`role="tablist"`).
- Los valores son los de `tokens.css`; `motion` los revisa en la puerta.

## Para implementar (cuando Jose elija)

- Componentes: `Hero` (cambia el texto y el contenido de `HeroStage`; se quitan `DemoTag` y los datos `hero.demo.*`), `ProofStrip` (nuevo), `FeaturedProjects` (con imagen y variante `big`/`side`), `OfferTeaser` (sustituye a `ServicesStrip` y `TierTeaser`, con `MvpCard`), `Closing` (un solo correo y huecos de WhatsApp y llamada). Salen `StackRow` y `NexoSection` de la home.
- Imágenes: AVIF o WebP con dimensiones fijas y carga diferida. Ninguna es el LCP en móvil: el LCP sigue siendo el H1. El JS de la home no debe crecer (hoy, 146,5 KB de 150): V2 añade unas 30 líneas de pestañas y V1 quita el JS del escenario.
- Una sola etiqueta de contacto, «Hablemos». Hay que cambiar Q5 si Jose lo aprueba.
- Modo oscuro: Estilo B no lo tiene (`color-scheme: light`). No se diseña aquí: es una decisión de sistema para todo el sitio, no de la home.

## Patrón para las páginas interiores

Mismo criterio que la home: un H1 más corto, con un elemento de prueba o resumen a la derecha (precio «desde», cifra o foto); H2 a 600 sin raya ni coral; secciones a la altura de su contenido; un hueco `{{DATO}}` visible donde falte un dato, nunca «Precio en revisión». Se maqueta por pantalla en 4c cuando Jose cierre la home.

## Ronda 2 (2026-11-14): decisiones de Jose y registro expresivo

Decidido por Jose tras ver las maquetas de la ronda 1:

1. **Dirección R · Prueba primero.** V1 y V2 quedan como referencia en el comparador.
2. **Contacto**: una sola etiqueta, «Hablemos», en cabecera, hero y cierre. Solo `hola@` visible; `freelance@` y `proyectos@` siguen funcionando, pero no se muestran.
3. **Sin scroll por bloques** en la home (fuera `BlockScroll`).
4. **Registro: expresivo** (sustituye al equilibrado de la ronda 1). Hay que copiarlo a la línea `registro:` del `CLAUDE.md` del proyecto; eso lo hace el controlador, no `director-arte`.

Entregable: `r-expresivo.html` + `expresivo.css` (hoja nueva, solo la carga `r-expresivo.html`; `home.css`, `r.html`, `v1.html` y `v2.html` no cambian). Comparador: sección «Ronda 2» en `index.html`, con los mismos modos y el interruptor del chat.

Supuesto: sin `PRODUCT.md` ni forma de entrevistar a Jose desde un subagente, la dirección sale del brief, de esta nota y de sus cuatro decisiones.

### Qué cambia de R equilibrado a R expresivo

| | R equilibrado | R expresivo |
|---|---|---|
| H1 | 4,75 rem, columna izquierda | `--fs-hero-x: clamp(2.6rem, 1.15rem + 4.6vw, 5.375rem)`, en dos líneas a todo el ancho; el escenario sube y se encaja junto a la segunda línea. En móvil, 11,4 vw (máx. 3,4 rem) |
| Punto de «funcionando.» | Coral fijo | Late tres veces al cargar (anillo coral, `--dur-hero-pulse` 1.600 ms): «funcionando», como el punto de la marca |
| Escenario | Cambia el texto de la fase | Además, la cámara cambia según la fase: Descubrir, Diseñar y Construir acercan el navegador; Publicar y Mantener acercan el móvil (`scale` y `rotate`, `--dur-morph` 900 ms, `--ease-in-out`). La fase activa lleva una barra coral que se llena en `--dur-phase` y se detiene con Pausar. La nota entra con desenfoque de 4 px |
| Paralaje | No | Al salir del hero, el móvil sube 7 rem y el navegador 2,5 rem (1 y 3 rem en móvil) |
| Cabecera | Fija | Se asienta al bajar: fondo más opaco, filete y sombra corta en los primeros 7 rem de scroll |
| Trabajo publicado | Sección clara | Banda carbón a sangre que se abre desde una tarjeta redondeada (`clip-path`), con el móvil de 3CatInfo subiendo desde el borde |
| Revelados | Ninguno | Distintos según la sección: los H2 se descubren de abajo arriba; casos, niveles y vías suben 1,5 rem; el H2 del cierre crece de 0,94 a 1. Siempre ligados al scroll, nunca a un temporizador |
| Cierre | Tarjeta blanca | Sin tarjeta: «Cuéntame qué necesitas» a `--fs-close-x` (máx. 4,5 rem, peso 700), como pareja del H1 |
| Microinteracciones | Flecha +2 px, `scale(0.97)` | Además: la flecha de «Hablemos» sale y entra otra, el subrayado de los enlaces aparece y sube, el nombre del nivel se desplaza 4 px y «Copiar» pasa a «Copiado» durante 1,6 s |
| Navegación | — | `@view-transition { navigation: auto; }` (regla 4 del proyecto) |

No cambia: Estilo B (acero, carbón, coral), Inter Tight, la disciplina del coral (última palabra del H1, flechas, barra de fase y foco), el contenido, el orden y los huecos `{{DATO}}`.

### Reglas del movimiento

- **El H1 no se anima nunca.** Es el LCP en móvil y en escritorio; una entrada con opacidad o recorte retrasaría el LCP lo que dure la animación.
- Todo es CSS nativo, como pide la regla 4. Las animaciones al hacer scroll usan `animation-timeline` (`scroll()` y `view()`) dentro de `@supports (animation-timeline: view())`. Donde no hay soporte (Firefox, hoy) la página queda estática y completa: esa es la alternativa estática del registro.
- Todo va dentro de `prefers-reduced-motion: no-preference`. Con «reducir movimiento» no hay entradas, paralaje, cortina ni latido, y el escenario queda fijo en «Publicar» (comportamiento de R).
- Solo se anima `transform`, `translate`, `scale`, `rotate`, `opacity`, `clip-path` y, en dos sitios pequeños, `box-shadow` y el fondo de la cabecera. Nada cambia el tamaño de una caja, así que el CLS no se mueve.
- Todas las transiciones de hover y pulsado son CSS y se pueden interrumpir.

### Presupuesto del registro expresivo (regla 8)

Límites: LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JS de la home ≤ 150 KB gz. Hoy, /es pesa 145,5 KB: quedan **4,5 KB**.

| Efecto | CSS o JS | Coste en JS (gz) | Efecto en LCP, INP o CLS |
|---|---|---|---|
| H1 grande en dos líneas | CSS | 0 | Ninguno; el H1 se pinta en el primer frame |
| Latido del punto final | CSS | 0 | Ninguno (tres iteraciones y se para) |
| Entrada del escenario y de la franja de prueba | CSS (`opacity` + `transform`) | 0 | CLS 0 |
| Cámara por fase, barra de progreso y pausa | CSS; el JS del escenario solo añade `data-phase` y la clase `paused` | ≈ +0,1 | Ninguno |
| Paralaje, cabecera, cortina carbón, revelados | CSS scroll-driven | 0 | Sin listeners de scroll, así que el INP no cambia. `clip-path` y el fondo de la cabecera repintan mientras se hace scroll: un elemento cada uno |
| Flecha, subrayado, filas | CSS | 0 | Ninguno |
| «Copiar» → «Copiado» | JS | ≈ +0,2 | Ninguno |
| View Transitions entre páginas | CSS | 0 | Ninguno |
| **Total** | | **≈ 0,3 KB → ≈ 145,8 / 150 KB** | |
| CSS añadido | `expresivo.css` | ≈ 2,5 KB gz de CSS (no cuenta en el límite de JS; va en la hoja de la home) | |

**GSAP + ScrollTrigger, descartado.** Cuestan unos 39 KB gz (core ≈ 27 y ScrollTrigger ≈ 12) y solo hay 4,5 KB de margen. Además, la regla 4 pide movimiento en CSS nativo. Lo único que GSAP daría aquí es soporte de revelados en Firefox, y eso ya lo cubre la alternativa estática.

**Si algo no cabe al medir con `pnpm perf:budget`**, se recorta en este orden: 1) el «Copiado» con JS (vuelve a ser un botón sin aviso), 2) la cortina con `clip-path` pasa a ser solo un cambio de opacidad, 3) el paralaje en móvil, 4) la barra de progreso de la fase. Nunca se recorta la pausa del escenario ni `prefers-reduced-motion`.

**A medir en la implementación:** sacar `NexoSection` de la home (decisión de la ronda 1) puede liberar KB si arrastra parte del chat al bundle de /es (`motion` solo lo importa el chat). Hay que confirmarlo con `perf:budget` antes y después; no se cuenta como margen hasta medirlo.

### Pendiente de Jose (ronda 2)

5. ¿Banda carbón a sangre para «Trabajo publicado»? Recomendada: sí.
6. ¿Titular en dos líneas a 86 px, aunque de la franja de prueba solo asomen sus títulos a 1440×900? Recomendada: sí; la alternativa es 72 px y 60 px más de franja.

## Ronda 3 (2026-11-14): R expresivo mejorado

**Cerradas por Jose (ronda 2):** R expresivo aprobado, con la banda carbón a sangre en «Trabajo publicado» y el titular a 86 px. La versión aprobada queda congelada en `r-expresivo-v1.html` + `expresivo-v1.css`. La iteración está en `r-expresivo.html` + `expresivo.css`.

**Lo que pidió Jose (literal):** «mejorar las transiciones entre los bloques, que por ejemplo el móvil del inicio se desplace fluidamente para enseñar las aplicaciones, añadir un poco más del color naranja de la app, algo de textura sutil al fondo».

### 1. Transiciones entre bloques: una cadena, no revelados sueltos

Cada bloque pasa el testigo al siguiente. Los «sube 1,5 rem» que se repetían en casos, niveles, vías y MVP desaparecen.

| Paso | Qué pasa | Cómo |
|---|---|---|
| Hero → franja | El navegador se retira (sube 2,5 rem y baja al 50 % de opacidad) y el móvil baja casi pegado al scroll, pasando sus pantallas | `scroll(root)` en el tramo `0–72vh` |
| Franja → banda | Con escritorio, el móvil pasa **por debajo** de la franja de prueba (franja con `z-index` y fondo al 86 %) y se disuelve en el último 20 % del tramo. La franja se hunde (1,5 rem arriba, escala 0,985, opacidad 0,55) mientras sube la banda | `timeline-scope: --band` en `main`: la franja usa la línea de tiempo de la banda |
| Banda | Se abre desde una tarjeta redondeada hasta llegar a sangre (v1) y **dibuja su costura coral** desde el centro. Las capturas se destapan de abajo arriba (`clip-path`). El móvil de 3CatInfo sube al foco de luz con el **mismo bisel y la misma cámara coral** que el del hero: se lee como el mismo objeto que ha llegado | `view()` y `--band` |
| Banda → oferta | La banda **se vuelve a cerrar en tarjeta** al salir (la cortina, en espejo) y el bloque MVP, el carbón que queda en la oferta, se asienta (3 rem y escala 0,97 → 1) con la misma línea de tiempo | `--band`, rango `exit` |
| Oferta → cierre | El H2 del cierre crece (v1) y su **punto coral aterriza** con un pequeño rebote, el mismo punto que cierra el H1 | `view-timeline: --close` |
| Toda la página | Barra de progreso coral de 2 px bajo la cabecera | `scroll(root)` |

Los H2 de la banda y de la oferta conservan el barrido de la v1: es la firma tipográfica de la página, y es la única entrada que se repite.

### 2. El móvil del hero enseña las aplicaciones

- Dentro del móvil hay un carrete con tres pantallas, en el mismo orden que «Trabajo publicado»: **3CatInfo, 3Cat y NextRaket**. Con huecos, cada pantalla es un `{{DATO: captura …}}` (D4 para las dos de 3Cat y D6 para NextRaket). En «Solo lo que hay hoy», cada una es una ficha tipográfica: 3CatInfo en carbón, 3Cat con el icono en coral y NextRaket en claro, para que el cambio de pantalla se note.
- **Escritorio:** el carrete avanza entre `4vh` y `56vh` de scroll, con pausas en cada pantalla (12 %, 42–56 % y 86–100 % del tramo). El móvil baja 29 rem en `0–72vh` (sube a menos del 30 % de la velocidad del scroll, así que se queda a la vista mientras enseña las apps), cruza bajo la franja y se disuelve cuando aparece la banda.
- **Móvil (390):** el carril de fases va justo debajo del escenario, así que el móvil **no viaja**. Solo pasa pantallas entre `10vh` y `46vh`, que es cuando se ve entero, y baja 1,5 rem.
- Un indicador coral de tres posiciones bajo la pantalla dice cuál se ve. El móvil no captura clics (`pointer-events: none`) y el carril y su nota quedan por encima de él: «Pausar» se ve y se pulsa siempre.
- La cámara por fase de la v1 (escala y giro) sigue funcionando: usa `scale` y `rotate`, y el viaje usa `translate`, así que no chocan.

### 3. Más coral, siempre con un trabajo

| Dónde | Qué hace | Contraste |
|---|---|---|
| Costura de 2 px arriba de la banda | Marca el comienzo del capítulo del trabajo publicado; se dibuja al abrirse | Decorativo |
| Foco de luz coral (radial, 26 %) tras el móvil de 3CatInfo | Escenario: pone la app en el centro | Decorativo; el texto va a la izquierda, sobre carbón |
| Cifras de resultado en la banda (`.case-metric b`, «145 KB») | Lo medible destaca | `#ff4b32` sobre `#17191c`: 5,3:1 (AA) |
| Hover de los casos: subrayado coral del H3 y aro coral de 1 px en la imagen | Estado | No es texto |
| Hover de los niveles: el nombre pasa a `--coral-deep` | Estado | ≈ 6,5:1 sobre `#f7f8f9` (`--coral-text` daba 4,1:1 y se descartó) |
| Hover de los botones de tienda (aro de 1 px) y de las fases no activas (círculo) | Estado | No es texto |
| Escenario: primer piloto del navegador, cámara del móvil, icono de 3Cat, indicador de pantallas | Detalle de escena | Decorativo |
| Punto delante de «Empieza por una tarea piloto» (MVP) | Señala la vía de entrada sin riesgo | Decorativo |
| Punto final de «Cuéntame qué necesitas» | Rima con el punto del H1 y con la marca | Decorativo |
| Barra de progreso de lectura bajo la cabecera | Estado de la página | Decorativo |
| `caret-color` | Superficie del navegador | — |

No cambia: el coral sigue fuera de los H2 y del texto corrido, y los fondos coral siguen sin existir.

### 4. Textura sutil

- **Grano:** ruido `feTurbulence` en un SVG inline (≈ 0,4 KB cada uno), como capa de fondo del `body` (oscuro, alfa media ≈ 5 %) y de la banda (blanco, ≈ 3 %), en teselas de 180 px. Es una capa de fondo, no una capa fija por encima: sin `position: fixed`, sin `mix-blend-mode` y sin `filter` en vivo. El navegador lo rasteriza una vez y lo repite.
- **Trama:** rejilla de puntos de 1 px cada 14 px tras el escenario del hero, desvanecida en los bordes con `mask-image`. El escenario se lee como una mesa de trabajo.
- La franja de prueba pasa del 70 % al 86 % de opacidad: tapa el grano y el móvil que pasa por debajo lo justo para que el gris del texto mantenga AA.
- La barra de scroll se tiñe (`scrollbar-color`: acero sobre el fondo).

### Reglas que se mantienen

- El H1 no se anima (LCP). CLS 0: solo `transform`, `translate`, `scale`, `opacity` y `clip-path`. Nada cambia el tamaño de una caja.
- Todo el movimiento ligado al scroll va dentro de `@supports (animation-timeline: view())` y de `prefers-reduced-motion: no-preference`. Sin soporte (Firefox) o con «reducir movimiento», la página queda estática y completa: el móvil enseña 3CatInfo, la costura de la banda está dibujada, la banda va a sangre y no hay barra de progreso.
- `background-position` del foco de luz se anima en un solo elemento y solo mientras la tarjeta entra.

### Coste (presupuesto de la regla 8)

| Mejora | JS (gz) | CSS (gz) |
|---|---|---|
| Transiciones encadenadas | 0 | ≈ +1,2 KB |
| Móvil que viaja y carrete | 0 | ≈ +0,6 KB (y ≈ +0,6 KB de HTML) |
| Coral | 0 | ≈ +0,4 KB |
| Grano y trama | 0 | ≈ +0,8 KB |
| **Total** | **0 → la home sigue en ≈ 145,8 / 150 KB** | **≈ +3 KB** (5,4 KB frente a 2,4 KB de la v1, con comentarios; algo menos minificado) |

El orden de recorte, si al medir con `pnpm perf:budget` algo no cabe, es el de la ronda 2. En CSS: primero el grano de la banda, después la barra de progreso.

### Comprobado

Chrome a 1440×900 y a 390×844, en los dos modos: sin scroll horizontal (`scrollWidth` igual al viewport), sin errores de consola y con el carrete en sus tres pantallas en los dos anchos. Frente a la v1, el detector de `impeccable` añade dos hallazgos reales, ya corregidos: el contraste del hover de los niveles y la costura, que bajó a 2 px (es una línea a todo el ancho de la sección, no una pestaña de tarjeta). Añade también dos falsos positivos: el carrete sin relleno, que es intencionado, y el hueco claro de NextRaket, que el detector lee sobre carbón aunque tiene fondo propio. La vista con «reducir movimiento» y Firefox no se emularon: se razonan sobre el CSS.

### Pendiente de Jose (ronda 3)

7. ¿Te quedas con R expresivo mejorado? Recomendada: sí.
8. ¿El móvil pasa por debajo de la franja de prueba en escritorio? Recomendada: sí. La alternativa es que se disuelva antes, sin cruzarla.

## Ronda 4 · Elementos decorativos de fondo (2026-11-14)

Jose, sobre la ronda 3: no quiere textura, quiere elementos decorativos de fondo que den volumen y unidad a toda la página, idealmente en coral.

### Qué se quita

- **Grano** (`--grain` y `--grain-dark`, ruido `feTurbulence`) del `body` y de la banda carbón: fuera de `expresivo.css`. El `body` vuelve al degradado de la v1 y la banda vuelve a carbón liso.
- **Trama de puntos** tras el escenario del hero (`.stage-scene::before`): fuera.
- La línea de coste «Grano y trama» de la ronda 3 (≈ +0,8 KB de CSS) desaparece. La franja de prueba se queda al 86 %, porque el móvil sigue pasando por debajo.
- `r-expresivo.html` solo cambia el texto de su barra de maqueta.

### Qué se propone

El catálogo `fondo/index.html` tiene siete opciones (`fondo/a.html` … `g.html`). Cada una se aplica a la home R expresivo completa y estática: es el estado de «reducir movimiento», sin las transiciones, que se eligen aparte. Se ven en escritorio y en móvil, de arriba abajo.

| | Opción | Idea | Coste |
|---|---|---|---|
| A | Halo | Formas orgánicas con degradado radial coral difuso, una por sección, que cruzan las costuras | CSS, ≈ 0,5 KB gz |
| B | Órbitas | Aros concéntricos de 1 px coral: un sistema desde el escenario y otro desde la oferta | SVG inline, ≈ 0,6 KB gz |
| C | Cinta | Trazo coral continuo de arriba abajo, en 5 segmentos que empalman; acaba en un punto junto al cierre | SVG inline, ≈ 0,9 KB gz |
| D | Focos | Luz coral detrás de los bloques clave: escenario, caso grande, MVP y CTA final | CSS, ≈ 0,4 KB gz |
| E | Cuartos | Cuartos y medios círculos planos anclados a los bordes | CSS, ≈ 0,5 KB gz |
| F | Malla | Malla de degradado coral, melocotón y acero en toda la altura | CSS, ≈ 0,4 KB gz |
| **G** | **Eco (recomendada)** | El punto de la marca vuelve como esfera coral con luz, de mayor a menor: hero, costura banda/oferta, oferta y cierre, hasta el punto final del título | CSS, ≈ 0,5 KB gz |

**Por qué G:** es la única que da a la vez volumen (un objeto con luz y sombra) y una idea que une (siempre el mismo objeto, que se aleja), y sale de un elemento que la marca ya tiene. A, D y F dan volumen pero no tienen idea. B, C y E dan unidad pero son planas. La segunda opción es B, si se prefiere algo más técnico y callado.

### Reglas comunes

- Decoración en `z-index: 1` y contenido (`.wrap`) en `2`. `main` recorta con `overflow: clip`, que no rompe el `sticky` del MVP.
- Sin `filter`, sin `mix-blend-mode`, sin `position: fixed` y sin JS. Nada se mueve.
- En G, la esfera del hero va dentro de `.stage-scene` con `z-index: -1`. Así queda anclada al escenario en los dos anchos, detrás del navegador y del móvil, y nunca toca el carril.
- En G se retiró el resplandor coral de las esferas porque el detector de `impeccable` lo marca como patrón de IA (`dark-glow`). Queda una sombra de contacto neutra en el claro y ninguna en el carbón.

### Ajuste que acompaña a cualquier opción

`--ink-faint` (#5a616a, 5,1:1 sobre el fondo) no aguanta ningún tinte coral por encima del ≈ 12 %. Por eso el carril de fases (`.rail li`) y las etiquetas del contacto (`.reach-row dt`) pasan a `--ink-soft` (6,6:1), y la fase activa a `--ink`. Con `--ink-soft`, un tinte de hasta el 30 % sigue en AA.

### Comprobado

- Chrome a 1440 y a 390 (el 390 dentro de un iframe del catálogo): sin scroll horizontal en las siete opciones ni en el catálogo.
- Contraste medido con un script. Para cada texto calcula el color real del fondo (la sección más las capas de decoración que lo tocan) y compara. Ningún texto queda por debajo de 4,5:1, ni de 3:1 en texto grande. Antes de los ajustes fallaban A, D, E, F y G; se corrigieron las posiciones y las intensidades, y se cambió el token de arriba.
- Detector de `impeccable` sobre `fondo/`: solo quedan los hallazgos que ya traía la home (se revisaron en la ronda 3). Los nuevos eran el resplandor de G, ya retirado, y en B el recorte de `overflow: clip`, que es intencionado.
- Sin emular: Safari, Firefox y la vista con «reducir movimiento». Esta última no hace falta, porque las maquetas no tienen movimiento.

### Pendiente de Jose (ronda 4)

9. ¿Qué elemento de fondo? Recomendada: **G · Eco**. La alternativa es B · Órbitas.
10. ¿Aceptas `--ink-soft` en el carril de fases y en las etiquetas del contacto? Recomendada: sí. Sin este cambio, solo B, C y E caben con el texto actual.

## Ronda 5 · Fondo fluido (2026-11-14)

Jose, sobre la ronda 4: no le convence ninguna de las siete (A–G). Quiere algo más fluido que no tape el contenido principal, sin tiras, focos, órbitas ni efectos de luz tan marcados. Acepta subir el gris a `--ink-soft` donde haga falta para AA.

### Reglas de la ronda

- Formas continuas y curvas suaves, sin bordes duros ni geometría marcada.
- Coral, melocotón o acero en baja opacidad, siempre por debajo del 16 % por capa. Sin halos, brillos, focos de luz ni sombras.
- Por detrás y fuera de las zonas de lectura: márgenes, huecos entre bloques y detrás de la banda carbón.
- Movimiento lento opcional, solo con `translate`, `rotate` o `scale`, nunca `filter`. Todo dentro de `prefers-reduced-motion: no-preference`; lo ligado al scroll, además, dentro de `@supports (animation-timeline: scroll())`. Sin JS.

### Opciones (`fondo/r5/`)

| | Opción | Idea | Movimiento | Coste (gz, CSS + SVG) |
|---|---|---|---|---|
| **H** | **Marea (recomendada)** | Superficie coral ondulada en los dos márgenes, de arriba abajo, en dos capas que se solapan | Scroll: capas en sentidos contrarios, ±2,5–3 % | ≈ 2,5 KB |
| I | Relieve | Terrazas de color (curvas de nivel rellenas) que asoman por las esquinas; la única que entra en la banda | `view()`: las terrazas giran unos grados | ≈ 4 KB |
| J | Respiro | Temperatura lateral: cálido a un lado y acero al otro, que se intercambian entre secciones | `view()`: el tinte se ensancha y se recoge | ≈ 1,1 KB |
| K | Líquido | Seis formas planas casi transparentes, medio fuera de pantalla, que se solapan | Deriva propia: una vuelta cada 4–5 min | ≈ 1,5 KB |
| L | Drapeado | Tres pliegues de tela con degradado transversal por un margen y luego por el otro | Scroll: los pliegues se mecen | ≈ 1,2 KB |
| M | Dunas | Colinas en capas en las costuras, altas en los márgenes y a cero bajo el texto | `view()`: paralaje horizontal | ≈ 2,2 KB |

**Por qué H:** es una sola pieza continua de arriba abajo, que es lo que da unidad. El solape de dos capas translúcidas le da volumen sin recurrir a la luz. Vive solo en el margen (a 1440 no cambia el contraste de ningún texto) y pasa por detrás de la banda, así que la banda gana profundidad sin que nada la toque. La segunda opción es K · Líquido, si Jose prefiere que el fondo se mueva solo, sin depender del scroll.

### Capas

- `.fx.back` (`z-index: 0`, primer hijo de `main` o de su sección): por debajo de los fondos de sección. La banda carbón y la franja de prueba la tapan. Así funcionan H, J, K, L y M, e I salvo una capa.
- `.fx` (`z-index: 1`): por encima del fondo de la sección y por debajo del contenido (`.wrap`, `z-index: 2`). Solo la usa la terraza de I dentro de la banda.
- `--reach: clamp(2.75rem, calc((100vw - 80rem) / 2 + 3.5rem), 22rem)`: el ancho del margen real. H, J y L se dimensionan con él, así que en pantallas anchas crecen con el margen y nunca invaden la columna de texto.

### Comprobado

- Contraste medido por píxel con Playwright y Chromium, a 1440 y a 390. Se oculta el texto, se fotografía la página con y sin decoración y, bajo cada línea de texto, se compara su color con el percentil 5 del fondo real. Ningún texto que pasaba AA deja de pasarlo. Peor texto real tocado: H, ninguno a 1440 y 6,15:1 a 390; I, 5,71:1; J, 6,33:1 (y el H1 coral de 3,71 a 3,59:1, texto grande); K, 6,07:1; L, 5,88:1; M, ninguno.
- Se bajó la intensidad de L (ancho y opacidad del segundo pliegue), y de I y J junto al contacto en móvil, porque dejaban algún marcador `{{DATO}}` por debajo de 4,5:1.
- Sin scroll horizontal en las seis opciones ni en el catálogo, a 1440 y a 390.
- Movimiento activo en Chrome (4–16 animaciones por opción), sin errores de consola.
- El detector de `impeccable` sobre `fondo/r5/` solo da los hallazgos que ya traía la home, idénticos a los de `fondo/g.html`. El catálogo sale limpio.
- Sin emular: Safari y Firefox. Firefox no soporta `animation-timeline` y verá las versiones quietas, que son la página completa.

### Pendiente de Jose (ronda 5)

11. ¿Qué fondo? Recomendada: **H · Marea**. La alternativa es K · Líquido.
12. ¿Movimiento ligado al scroll (H, I, J, L, M) o deriva propia (K)? Recomendada: scroll, porque solo se mueve cuando el visitante se mueve.

## Ronda 6 · Sistema de movimiento por tipo de componente (2026-11-14)

**Feedback de Jose** sobre la batería de transiciones por costura (`transiciones/home.html`): la rechaza como enfoque. Literal: «las transiciones tienen que adaptarse por tipo de componente o subcomponente, es decir todas las cards harían lo mismo, y los bloques también, tiene que ser algo elegante y suave, que acompañe el scroll y haga ver la página fluida». Tampoco quiere fondos decorativos por ahora: sin grano, sin trama y sin elementos de fondo (las rondas 4 y 5 quedan aparcadas).

### Qué se propone (`movimiento/`)

`movimiento/home.html` es la home R expresivo (v1, sin fondos, sin costuras y sin el móvil que viaja) con un único sistema, `movimiento.css`. Lleva un selector flotante plegable con tres intensidades del mismo sistema (Sutil, **Media ★**, Marcada) y un interruptor «Sin movimiento». La tabla completa de tipo → comportamiento → valores está en `movimiento/index.html`.

Tres principios:
- **Los contenedores se mueven, el contenido aparece.** Bloque, banda y tarjeta solo usan `translate` y `scale` al entrar; la opacidad la llevan las piezas de lectura. La opacidad no se multiplica y nada arranca en blanco.
- **Una pieza dentro de otra que ya aparece no se anima aparte**, salvo la cifra, que se asienta dentro de su línea.
- **El escalonado sale del layout.** Solo reciben retraso las piezas que comparten fila (`--i` por grupo, heredado por sus hijos; `--j` para chips). En móvil, todo apilado, el retraso es 0.

| Tipo | Comportamiento (igual en toda la página) |
|---|---|
| Bloque (franja, oferta) | Sube y se asienta al entrar; en su último tramo en pantalla se aparta y se atenúa mientras el siguiente ya entra |
| Banda carbón | El mismo bloque, con más escala; sin cortina ni costura |
| Cierre | Entra como bloque y no sale |
| Tarjeta (proyecto, niveles, MVP, vía, columna de prueba) | Se eleva y se asienta desde abajo, sin opacidad |
| Título / párrafo / ítem de lista | Aparecen y suben; el párrafo va medio paso detrás del título |
| Cifra | Un paso después que su línea, se asienta desde abajo a la izquierda (solo `scale` y `translate`) |
| Chip | En fila, de izquierda a derecha, a medio paso |
| Botón o CTA | Aparece un paso detrás y su flecha llega la última |
| Imagen o dispositivo | El marco va con su tarjeta; lo de dentro se asienta desde una escala mayor, anclado abajo |
| Hero | Sin movimiento de scroll. H1 sin animar (LCP); el escenario conserva su entrada y sus fases |

Todo va con `view()` y el mismo tramo desde que la pieza asoma (`animation-range: cover <retraso> cover <retraso + tramo>`, en `vh`), así que una cifra pequeña y una tarjeta grande se resuelven a la misma velocidad. Curva casi lineal que frena al final (`cubic-bezier(0.33, 0.7, 0.4, 1)`); la salida de los bloques es lineal.

| Intensidad | Tramo · paso | Lectura | Tarjeta | Bloque (entra / sale) |
|---|---|---|---|---|
| Sutil | 26vh · 2vh | 0,35→1, ↑0,625rem | ↑1rem, 0,99 | ↑1,25rem, 0,997 / 24vh, opacidad 0,8 |
| **Media ★** | 34vh · 3,5vh | 0,12→1, ↑1,25rem | ↑2rem, 0,975 | ↑2,5rem, 0,99 / 30vh, opacidad 0,55 |
| Marcada | 44vh · 5vh | 0→1, ↑2,25rem | ↑3,5rem, 0,95 | ↑4,5rem, 0,975 / 38vh, opacidad 0,3 |

**Por qué Media:** es la primera en la que la página se nota fluida (se ve el relevo entre bloques y las tarjetas se asientan) sin que el texto que se está leyendo pierda contraste: en la zona de lectura (25–60 % de la pantalla) ninguna pieza baja de 0,74 de opacidad efectiva a 1440 ni de 0,84 a 390. Sutil casi no se percibe en móvil; Marcada se acerca a un gesto llamativo y baja la zona de lectura a 0,67.

### Reglas

- Solo `translate`, `scale` y `opacity`; `clip-path` no hizo falta. CLS 0: las cifras llevan `inline-block` siempre, con o sin movimiento.
- CSS nativo dentro de `@supports (animation-timeline: view())` y `prefers-reduced-motion: no-preference`, y fuera con `data-motion="off"`. Sin soporte (Firefox) o con «reducir movimiento», la página es la estática completa.
- Sin listeners de scroll. En producción la intensidad va fija en el CSS: 0 KB de JS.
- `home-expresivo.css` de esta carpeta es la v1 sin costuras y sin el paralaje del navegador y del móvil del hero.

### Coste

CSS ≈ 1,2 KB gz con una sola intensidad y minificado (2,9 KB gz la hoja de la maqueta, con las tres y los comentarios). JS 0: la home sigue en ≈ 145,8 / 150 KB. Sustituye a los ≈ 1,2 KB de las transiciones encadenadas de la ronda 3 y a los 0,8 KB de grano y trama.

### Comprobado

Chrome a 1440×900 y a 390×844, en las tres intensidades: sin scroll horizontal, sin errores de consola, 111–116 animaciones activas, 0 con «Sin movimiento». La primera pantalla no arranca en blanco: el hero no se anima al hacer scroll y lo que asoma de la franja de prueba a 1440 está a ≈ 0,96 de opacidad. Al medir, la salida de los bloques empezaba demasiado pronto y atenuaba el final de la oferta en plena lectura; se acortó su tramo (45 → 30vh en Media). Sin emular: «reducir movimiento» (se razona sobre el CSS: todo está dentro de `no-preference`), Safari y Firefox.

### Pendiente de Jose (ronda 6)

13. ¿Te quedas con el sistema por tipo de componente? Recomendada: sí.
14. ¿Qué intensidad? Recomendada: **Media**. La alternativa es Sutil, si prefieres que casi no se note.
15. ¿El hero queda quieto al hacer scroll (solo su entrada y sus fases)? Recomendada: sí, por el LCP y porque el escenario ya es el momento expresivo.
