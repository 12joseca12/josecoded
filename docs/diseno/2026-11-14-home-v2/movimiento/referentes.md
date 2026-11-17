# Referentes de movimiento: qué hacen las webs punteras y qué nos llevamos

Fecha: 2026-11-15 · Para: home R expresivo de josecoded · Compara con `movimiento.css` (ronda 6)

Método: cada web se abrió en el navegador a 1280×800 y se recorrió con scroll real (rueda) y por programa. Con `javascript_tool` se inspeccionaron las hojas de estilo (reglas `animation-timeline`, bloques `prefers-reduced-motion`, `@keyframes`), las transiciones calculadas de todos los nodos, las librerías globales (GSAP, Lenis, Three, Framer) y se registraron con un `MutationObserver` los cambios de `class`/`style` durante el scroll. Duraciones y curvas son las que devuelve `getComputedStyle` o muestreos de opacidad/transform cada 40–50 ms. Si algo no se pudo medir, se dice. Móvil: vistazo a 375×812 en Darkroom, Resend y la regla responsive de Linear; el resto solo escritorio.

Capturas en `referentes/`: `linear-glow-tarjetas.jpg`, `stripe-cifras-globo.jpg`, `darkroom-hero-0.jpg`, `darkroom-hero-450px.jpg`, `lusion-bloque-y-curva.jpg`.

---

## 1. Selección

| Web | Por qué está |
|---|---|
| **Linear** (linear.app) | El canon de «producto SaaS que se siente caro»; su fondo da volumen sin tapar nada. |
| **Vercel** (vercel.com) | Referencia de contención: casi cero movimiento al hacer scroll, y aun así se percibe puntera. |
| **Stripe** (stripe.com/es) | La web comercial con más oficio en ilustración animada y fondos; vende a negocios, como Jose. |
| **Raycast** (raycast.com) | Secuencia de carga en el hero muy pulida y teclado que se «enciende»: coreografía por pasos. |
| **Resend** (resend.com) | El caso más cercano a lo que pide Jose: un único gesto de aparición, igual en todas las tarjetas. |
| **Framer** (framer.com) | Quien fabrica herramientas de animación; su propia web muestra qué valores elige por defecto. |
| **Apple · AirPods Pro** (apple.com/es/airpods-pro) | Página de producto de referencia en narrativa con scroll, titulares que aparecen y medios fijados. |
| **Lusion** (lusion.co) | Estudio creativo 3D de primera línea: scroll virtual, texto palabra a palabra, WebGL. El extremo. |
| **Basement** (basement.studio) | Estudio dev de alto nivel: hero 3D, resto de la página casi quieto. |
| **Darkroom** (darkroom.engineering) | Estudio dev creador de Lenis; usa CSS scroll-driven como nosotros. Es el más comparable técnicamente. |
| **Locomotive** (locomotive.ca) | Agencia creadora de Locomotive Scroll; muestra cuánto (poco) anima quien inventó la herramienta. |
| **Build in Amsterdam** (buildinamsterdam.com) | Estudio europeo (NL) que vende desarrollo a marcas; pantalla partida con caso en vivo. |

Descartadas sobre la marcha: Immersive Garden (FR) se quedó en su precarga más de 10 s y no dejó ver contenido; sirve como contraejemplo. No encontré el dominio activo de Cuchillo (BCN); `cuchillo.studio` está aparcado.

---

## 2. Web por web

### Linear
Pila: Next.js, CSS Modules, sin GSAP, sin Lenis, sin canvas. Scroll nativo. 49 bloques `prefers-reduced-motion` (las animaciones van dentro de `no-preference`). 1 regla scroll-driven, decorativa.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Bloque/sección | Nada al entrar. Los H2 están quietos (opacidad 1, sin transform, sin transición). | La lectura no se interrumpe; el contenido manda. | La sensación de fluidez sale de la luz y del mockup, no de mover secciones. |
| Card (paneles de producto) | Quieta. Su borde lleva un «brillo» con `mask-image: radial-gradient(...)` cuyo centro (`--mask-y`) se mueve con el scroll (0 → 9,6 % → 41 %…). | Da relieve y sensación de luz que recorre la superficie. | Detalle de 1 px: no tapa nada y unifica todas las tarjetas. |
| Imagen/mockup | Dentro del mockup, los elementos entran con `opacity 0 → 1`, `filter: blur(2px) → 0`, `translateY(8px) → 0` (motor JS tipo Motion). | El producto «funciona» delante de ti: narrativa. | Distancia mínima (8 px) y desenfoque de 2 px: se percibe como enfoque, no como salto. |
| Fondo | Cada panel tiene de fondo un SVG con un rectángulo redondeado girado 45°, desenfocado, al 22 % de opacidad. Su `--bg-offset-y` se recalcula con el scroll para que la mancha de luz quede fija respecto a la ventana mientras el panel pasa. Se apaga en ≤ 640 px. | Una sola fuente de luz «en la sala» que ilumina todas las superficies: volumen y unidad. | Es exactamente el tipo de fondo que pide Jose: no hay tiras ni focos visibles, solo superficies que se iluminan distinto según dónde estén. Captura: `linear-glow-tarjetas.jpg`. |
| CTA / enlaces | Hover `color 0.1s cubic-bezier(0.25,0.46,0.45,0.94)`, botones `filter, transform 0.16s`. | Feedback inmediato. | Hover por debajo de 160 ms en todo. |
| Paneles que se abren | `transform 0.7s cubic-bezier(0.32,0.72,0,1)`. | Movimientos grandes, curva tipo «hoja» de iOS. | Duración larga solo para desplazamientos grandes. |

### Vercel
Pila: Next.js, sin librerías de scroll. Scroll nativo. 31 bloques reduced-motion. El `MutationObserver` no registró ningún reveal durante todo el scroll.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Bloque, titular, párrafo, card | Nada. | Producto de infraestructura: la seriedad se comunica con quietud. | Se percibe puntera sin un solo reveal. Demuestra que la calidad viene del ritmo tipográfico y de la luz. |
| Fondo / hero | Canvas de 942×628 detrás del triángulo con halo de luz (tipo de contexto no medible desde fuera). | Un único gesto de marca arriba. | Todo el «efecto» está concentrado en el hero. |
| Logos | Marquee `40s linear infinite`. | Prueba social en movimiento continuo y lento. | |
| Hover | `0.1–0.15s cubic-bezier(0.4,0,0.2,1)`. | Feedback. | |

### Stripe
Pila: Three.js r178 en dos canvas (ola de degradado del hero y otro bloque), JS propio para ilustraciones. Scroll nativo. 4 hojas de otro origen no se pudieron leer, así que **reduced-motion no medible**.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Bloque/sección | Quieto. H2 quietos. | Lectura. | |
| Fondo de sección | Capa `.section-background` con `--bg-fade-opacity` ligada al scroll (medido 0,48 en tránsito). | El color de fondo de una sección se funde con la siguiente: continuidad sin cortes. | Es el «fondo que acompaña» sin dibujo: cambia la temperatura, no aparece nada. |
| Hero | Ola de degradado en WebGL (Three r178). | Firma de marca. | Fluida, lenta, nunca detrás del texto principal con contraste bajo. |
| Ilustraciones / mockups | Al entrar, `lazy-animation--loaded` → `opacity 0.5s cubic-bezier(0.33,1,0.68,1)`; piezas internas con `scale(0.94) → 1` y `translateY`; gráficos con `--progress` 0 → 1 ligado al scroll. | Narrativa: cada ilustración «hace» lo que vende. | El movimiento está dentro de la ilustración, no en el contenedor. |
| Cifras | Cuatro cifras grandes; el titular de la sección cambia de color con `color 1.2s cubic-bezier(0.65,0,0.35,1)`. En captura, una cifra está resaltada y el resto en gris (mecanismo exacto no medido). | Jerarquía: una cifra cada vez. | No escala ni salta: resalta. Captura: `stripe-cifras-globo.jpg`. |
| Cards (bento) | Desplazamiento de unos px al pasar el cursor (`--card-shift-x: -4.78px; --card-shift-y: -4px`). | Feedback de interacción, no de scroll. | |
| Transiciones generales | `0.3s cubic-bezier(0.25,1,0.5,1)` (la mayoría), `transform 0.8s cubic-bezier(0.165,0.84,0.44,1)`, `transform 0.6s cubic-bezier(0.16,1,0.3,1)`. | Curvas de salida muy marcadas («llega rápido y frena largo»). | |

### Raycast
Pila: Next.js, CSS Modules. Scroll nativo. 12 bloques reduced-motion.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Hero (carga) | Secuencia `fadeInUp` (opacity 0 → 1, `translateY(20px) → 0`), `1s ease`, retrasos 0 / 0.2 / 0.35 / 0.5 s (paso de ~150 ms). | Coreografía de entrada: ventana, lema, acciones, versión. | Una sola vez, al cargar, no al hacer scroll. |
| Teclado ilustrado | Cada tecla pasa de `opacity 0.2 → 1` con `0.4s cubic-bezier(0.23,1,0.32,1)` y `transition-delay 0.3s`. | Narrativa: el atajo se «pulsa». | Curva de Emil Kowalski (ease-out fuerte). |
| Bloques, H2, párrafos | Quietos (opacidad 1, sin transición). | | |
| Carruseles | Embla, arrastrables. | Interacción. | |
| Fondo | Campo de estrellas (puntos con `opacity` 0.32 y `--transition-duration: 250ms`). | Profundidad muy sutil. | |
| Hover | `opacity, box-shadow, transform 0.4s / 0.2s cubic-bezier(0.23,1,0.32,1)`. | | |

### Resend
Pila: Next.js + Motion (framer-motion) con estilos en línea. Scroll nativo. 14 reglas scroll-driven, todas para sombras/fundidos de contenedores desplazables (`scroll-shadow-line`, `scroll-fade-x`), no para reveals. 12 bloques reduced-motion.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Hero (carga) | Texto `hero-text-slide-up-fade`: `translateY(16px) → 0`, opacidad 0 → 1, `1s ease-in-out`. Objeto 3D `webgl-scale-in-fade`: `scale(0.7) → 1`, `1s ease-in-out`. Header `translateY(-16px) → 0`, 1 s. | Entrada coreografiada. | Header, texto y objeto cada uno con su gesto. |
| Card (features) | **Un único gesto para todas**: `opacity 0 → 1`, `translateY(20px) → 0`, muelle. Medido: 56 ms 0,09/16,4 px · 107 ms 0,39/5,5 px · 158 ms 0,67/−1,2 px · 217 ms 0,88/−2,2 px · 323 ms 1/0. Asienta en ~320 ms con un rebote de 2 px. Una vez. | Cada tarjeta se presenta; el rebote mínimo da vida. | **Toda la fila entra a la vez, sin escalonado** (tres tarjetas medidas con curvas idénticas). Igual en móvil. |
| Titulares de sección | Algunos con `translateY(-30px)` + opacidad. | | |
| Código / editor | Tokens que cambian de color, desplazamientos del bloque de código. | Narrativa de producto. | |
| Fondo | Objeto WebGL en el hero; resto negro liso. | | |

### Framer
Pila: el propio Framer. Animaciones «appear» precalculadas en JSON (`__framer__appearAnimationsContent`), con comprobación de `prefers-reduced-motion: reduce` en el script. Scroll nativo.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Elementos del hero y del mockup (6 de 8) | Solo opacidad `0.001 → 1`, muelle `duration 0.4, bounce 0.2`. Sin desplazamiento. | Aparecer sin distraer. | La herramienta que vende animación usa, por defecto, **solo opacidad**. |
| 1 elemento | Opacidad + `y: 20 → 0`, muelle 1 s sin rebote, retraso 0.35 s. | El único que «sube» es el que cierra la secuencia. | |
| Mockup de producto | Contenedores que pasan de `rotate(13deg)` a `none`; textos de chat que aparecen. | Narrativa. | |
| Bloques y H2 | Quietos. | | |

### Apple · AirPods Pro
Pila: motor JS propio (clases `no-reduced-motion`, `enhanced`, AnimSystem). 6 bloques reduced-motion. 13 vídeos.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Titular de sección + CTA | Parten de `translateY(30px)` y `opacity 0`; se registró el inicio de la animación (30 → 29,9995 px). **Duración y curva no medidas**: tras recargar, los titulares ya estaban resueltos y no se volvieron a disparar con scroll por programa ni con rueda. | Cada capítulo se presenta con su titular. | El titular y su CTA comparten gesto (mismo valor de partida). |
| Navegación local | Al pegarse arriba cambia a `ac-ln-sticking`. | Orientación. | |
| Galerías de medios | Tarjetas que entran con `translateY 30px` + opacidad; «all-access pass» de control que se traslada con `translate3d` y escala. | Narrativa por capítulos. | |
| Medios | Vídeos que se reproducen al entrar y se pausan al salir; imágenes `positioned-media-element` fijadas. | Rendimiento y narrativa. | |
| Hover | `opacity, transform 0.16–0.32s ease`, escalonados con `transition-delay` 0.08 / 0.16 / 0.2 s. | | |

### Lusion
Pila: Three.js r158, canvas fijo a pantalla completa, **scroll virtual** (`body` y `html` con `overflow: hidden`, alto de documento 800 px, `#page-container` movido con `translate`). Sin reglas reduced-motion.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Scroll | Interpolación exponencial. Medido con un golpe de rueda de 200 px: 21 % a 43 ms, 51 % a 83 ms, 70 % a 123 ms, 88 % a 203 ms, 97 % a 323 ms, 100 % a ~520 ms. | Inercia: todo se mueve con la misma «masa». | Es lo que da la sensación de fluidez de los estudios creativos. |
| Párrafo | Palabra a palabra: `translate3d(0, 100%, 0)` + `opacity 0.1` → 0 y 1, por JS por fotograma. Retrasos no medibles (ya resueltos al inspeccionar). | Lectura dirigida, ritmo editorial. | Demasiado para una web de servicios. |
| Titular | Ligero desplazamiento ligado al scroll (`translate3d(0, −11px)`). | Parallax suave. | |
| Fondo | Escena 3D en WebGL detrás del hero; una curva violeta atraviesa el bloque «Bold Ideas» (captura `lusion-bloque-y-curva.jpg`). | Firma. | La curva es justo el tipo de elemento que Jose ha rechazado («órbitas»). |
| Reel | Contenedor que pasa de `translateZ` a `translate3d(0,0,0)`; cruz que escala de 0 a 1 y rota. | | |

### Basement
Pila: Three.js r180 (oficina 3D en el hero), Next.js. Scroll nativo. 2 bloques reduced-motion.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Hero | Escena 3D navegable a pantalla completa. | Firma y juego. | |
| Resto (logos, proyectos, pie) | Quieto. El observador no registró reveals. | | Estudio dev de nivel muy alto que no anima nada al hacer scroll. |
| Hover | `opacity 0.3s cubic-bezier(0.4,0,0.2,1)`. | | |

### Darkroom
Pila: **Lenis 2.0 solo en escritorio** + **CSS scroll-driven** (4 reglas `animation-timeline`), StyleX. 5 bloques reduced-motion. En móvil (375 px, UA táctil) Lenis no se activa y las 5 animaciones CSS siguen.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Scroll | Lenis. Golpe de rueda de 300 px: 52 % a 125 ms, 81 % a 245 ms, 90 % a ~330 ms, 98 % a 544 ms. | Inercia ligera, compatible con scroll nativo. | Apagado en táctil: el móvil usa su propio scroll. |
| Hero → proyectos | Un «marco» pequeño (peek) abajo del hero crece hasta pantalla completa con `clip-path: inset(...)` → `inset(0)`, `animation-timeline: scroll(root)`, `animation-range: 0 calc(100svh − var(--peek))`. | Continuidad: el siguiente bloque ya está asomando y se abre con el scroll. | Ligado al scroll de verdad (scrub) y solo en un elemento grande. Capturas `darkroom-hero-0.jpg` → `darkroom-hero-450px.jpg`. |
| Titular de proyecto | `opacity 0 → 1` en un tramo de 80 px de scroll, justo al final de la apertura del marco. | Aparece cuando la imagen ya está asentada. | Tramo corto: el texto nunca se queda a medias. |
| Salida de proyectos | `view-timeline-name: --projects`; al salir, el marco se cierra con `clip-path` (`animation-range: exit`). | Cierre del capítulo. | |
| Indicadores | `scaleY 1 → 0` + opacidad en 110 px de scroll. | | |
| Hover / UI | `0.12–0.25s cubic-bezier(0.23,1,0.32,1)`. | | Una sola curva para toda la interfaz. |

### Locomotive
Pila: **Locomotive Scroll v5** (sobre Lenis), Three.js r165 en dos canvas pequeños. 5 bloques reduced-motion.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Scroll | Lenis (clase `lenis` en `html`). | Inercia. | |
| Elementos con `data-scroll` | **Solo 7 en toda la home**: hero, vídeo, resumen, visual del anillo, canvas del equipo y 2 imágenes. | | Quien creó la librería de scroll la usa con muchísima contención. |
| Hero | `data-scroll-css-progress` expone `--progress` (0,94 tras 700 px); el CSS calcula `--mapped-progress: calc((var(--progress) − 0.5) / 0.5)` y con eso el hero se aparta. | Transición entre hero y contenido. | El CSS decide, el JS solo da el número. |
| Visual (anillo) | Ligado a `--progress` (0,39 en tránsito). | Narrativa. | |
| Imágenes | Carga diferida con `data-scroll-offset=15%`. | Rendimiento. | |
| Lista de proyectos | Titulares enormes quietos, separados por líneas. | | |

### Build in Amsterdam
Pila: JS propio, sin Lenis ni GSAP global. 11 bloques reduced-motion.

| Componente | Qué hace | Por qué | Qué destaca |
|---|---|---|---|
| Layout | Pantalla partida: a la izquierda un caso de cliente en vivo (tienda con productos y controles), a la derecha el titular fijo. Mecanismo de scroll no medido (no hay contenedor desplazable nativo). | Enseñar el producto en vez de describirlo. | Para un estudio que vende desarrollo, la demo es el argumento. |
| Transiciones | `transform 0.65s cubic-bezier(0.45,0.02,0.09,0.98)`, `opacity 0.5s` con `delay 0.7s`, `opacity 0.25s`. | Una sola curva propia de marca (ease-in-out muy marcada). | |

---

## 3. Síntesis

### Patrones que se repiten en las mejores

1. **El texto no se anima al hacer scroll.** Linear, Vercel, Stripe, Raycast, Framer, Basement y Locomotive tienen los H2 y párrafos quietos (opacidad 1, sin transform, sin transición). Las que animan texto (Apple, Resend, Lusion) lo hacen una vez, por tiempo, y con un solo gesto.
2. **El movimiento vive en tres sitios:** el hero (secuencia de carga), las ilustraciones o mockups (narrativa de producto) y la luz/fondo (volumen). No en los contenedores de lectura.
3. **Un gesto por tipo, y pocos tipos.** Resend: un gesto para todas las tarjetas. Framer: opacidad sola en casi todo. Darkroom: una curva para toda la UI. Nadie tiene más de 3 o 4 gestos distintos en una home.
4. **Scroll ligado (scrub) solo para lo grande; tiempo para lo pequeño.** Darkroom y Locomotive ligan al scroll marcos, heros y fondos; Stripe liga el fondo de sección y los gráficos. Las piezas de lectura, cuando se animan, van por tiempo (≈ 300 ms a 1 s) y una sola vez, así nunca se quedan a medias si el usuario se para.
5. **Distancias cortas.** 8 px (Linear, mockup), 16 px (Resend, hero), 20 px (Resend tarjetas, Raycast, Framer), 30 px (Apple, titulares). Nadie pasa de 30 px en contenido.
6. **Curvas de salida fuertes.** `cubic-bezier(0.16,1,0.3,1)`, `(0.23,1,0.32,1)`, `(0.25,1,0.5,1)` o muelles con rebote 0–0.2. Llegan rápido y frenan largo.
7. **Las filas entran juntas.** Resend no escalona las tarjetas de una fila; Raycast escalona solo la secuencia del hero (~150 ms).
8. **Reduced-motion se respeta** con las animaciones dentro de `@media (prefers-reduced-motion: no-preference)` (Linear: 49 bloques). Excepción: Lusion (0 reglas).

### Qué hace que se sientan fluidas
- **Smooth scroll:** solo los estudios creativos (Lusion con scroll virtual; Darkroom y Locomotive con Lenis). Todas las de producto usan scroll nativo y se sienten igual de fluidas. Darkroom apaga Lenis en táctil.
- **Continuidad entre bloques:** el siguiente bloque ya asoma y se abre (Darkroom), el color de fondo se funde de una sección a otra (Stripe), la luz queda fija mientras pasan las superficies (Linear).
- **Nada se queda a medias:** las piezas de lectura terminan rápido o no se mueven.

### Qué evitan
- Animar cada titular, párrafo, chip y flecha por separado.
- Movimientos anidados (contenedor y contenido moviéndose a la vez).
- Atenuar contenido que sigue en pantalla.
- Escalar texto o cifras.
- Precargas que bloquean (Immersive Garden se quedó más de 10 s en «87»).

---

## 4. Comparativa con `movimiento.css`

### Lo que tenemos bien
- Un comportamiento por tipo, coherente en toda la página: es justo lo que piden Jose y Resend.
- CSS scroll-driven con `@supports` y `prefers-reduced-motion: no-preference`; solo `translate`, `scale` y `opacity`. Es la técnica de Darkroom y no requiere JS.
- Hero quieto (como Linear, Vercel y Stripe en scroll).
- Bloque ligado al scroll: «acompaña el scroll», como el marco de Darkroom.

### Lo que nos sobra
| Qué | Por qué quitarlo o rebajarlo |
|---|---|
| **Movimiento anidado.** El bloque (`.proof`, 2,5 rem) contiene tarjetas (`.proof-grid > *`, 2 rem) que contienen piezas de lectura (`.fact`, 1,25 rem): hasta ~5,75 rem de desplazamiento sumado al entrar, con tres velocidades distintas. | Ninguna referencia mueve contenedor y contenido a la vez. Se lee como un temblor. Regla: **un solo nivel se mueve por región**; los de dentro, como mucho, aparecen. |
| **Salida del bloque** (`m-block-out`: opacidad 0,55, −1,5 rem, escala 0,985 en los últimos 30 vh). | Atenúa contenido que todavía se está leyendo arriba. Nadie lo hace con contenido; Stripe solo funde el *fondo*. |
| **Piezas de lectura ligadas al scroll** con opacidad de partida 0,12 y tramo de 34 vh. | Si el usuario se para con el párrafo en el tercio inferior, queda a medio fundir. Las referencias lo hacen por tiempo o no lo hacen. |
| **Chips escalonados**, **flecha del CTA que viaja**, **cifra que escala** (0,9). | Ninguna referencia anima chips ni flechas al hacer scroll. Stripe resalta cifras por color, no por escala. El escalado de texto es lo que más «huele a plantilla». |
| **Escala en tarjeta** (0,975) y en banda (0,975). | Ninguna referencia escala contenedores de contenido al entrar. Basta con desplazar. |
| **Título y párrafo con gestos separados** (medio paso de retraso). | Apple y Raycast mueven el grupo como unidad o escalonan solo en el hero. |

### Lo que nos falta
- **Un fondo que dé volumen y unidad** (ver § 5): es donde las referencias ponen el «efecto», no en el texto.
- **Continuidad entre bloques** con algo más que translate: fundido de color de fondo entre secciones (Stripe) o un medio que se abre con `clip-path` (Darkroom).
- **Narrativa dentro de las tarjetas de proyecto**: el mockup o captura que «hace algo» (Linear, Stripe, Resend). Hoy solo escalamos la imagen.
- **Feedback de hover unificado** con una sola curva y 120–200 ms.

### Valores recomendados por tipo

Propuesta para `director-arte` y `motion`. Dos familias de técnica: **scrub** (ligado al scroll con `view()`) para lo grande y **por tiempo** (una vez, al entrar) para lo pequeño. Lo por tiempo puede hacerse sin librería con un `IntersectionObserver` de 10 líneas que pone una clase, o seguir en CSS puro con un tramo de scroll muy corto (indicado como alternativa).

| Tipo | Técnica | Qué hace | Distancia | Duración / tramo | Curva | Escalonado | Referencia |
|---|---|---|---|---|---|---|---|
| **Bloque / sección** | Scrub | Sube y se asienta. Sin opacidad, sin escala, **sin salida**. | 24–32 px (1,5–2 rem) | `cover 0%` → `cover 40vh` | `cubic-bezier(0.33,0.7,0.4,1)` (la actual vale) | — | Darkroom (marco), Locomotive (hero) |
| **Card** | Por tiempo, una vez | Opacidad 0 → 1 y sube. Si su bloque ya se mueve, la tarjeta **solo aparece** (sin translate). | 16–20 px | 500–600 ms | `cubic-bezier(0.16,1,0.3,1)` o muelle (rebote ≤ 0,15) | Fila entera junta; como mucho 60 ms entre tarjetas | Resend, Framer |
| *Alternativa CSS pura* | Scrub corto | Igual | 16 px | `cover 0%` → `cover 15vh` | lineal | — | |
| **Titular + párrafo (grupo de cabecera de sección)** | Por tiempo, una vez | El grupo como unidad: opacidad 0 → 1 y sube. Dentro de tarjetas, quietos. | 16–24 px | 600–800 ms | `cubic-bezier(0.16,1,0.3,1)` | Párrafo +80–120 ms tras el titular, nada más | Apple (30 px), Raycast (20 px, ~150 ms), Resend (16 px) |
| **Ítem de lista / prueba** | Ninguna, o heredar de su card | — | — | — | — | — | Linear, Stripe |
| **Cifra** | Por tiempo o ninguna | Sin escala. Si se quiere énfasis: resalte de color/opacidad de 0,4 → 1 en secuencia. | 0 | 800–1200 ms | `cubic-bezier(0.65,0,0.35,1)` | 150–250 ms entre cifras | Stripe |
| **Chip / etiqueta** | Ninguna | Aparecen con su tarjeta. | — | — | — | — | Todas |
| **Imagen / mockup** | Scrub | Revelado con `clip-path: inset(8% 4% 8% 4% round …)` → `inset(0)` o escala interior 1,04 → 1. Dentro, si hay UI, piezas con 8 px + `blur(2px)`. | 8 px (piezas) | `cover 0%` → `cover 45vh` | lineal | Piezas internas 60–80 ms | Darkroom, Linear, Stripe |
| **CTA** | Ninguna al hacer scroll | Hover: flecha 2–4 px, fondo/color. | 2–4 px | 120–200 ms | `cubic-bezier(0.23,1,0.32,1)` | — | Darkroom, Raycast, Linear |
| **Header / navegación** | Por tiempo | Quieto, o se oculta al bajar y vuelve al subir. | altura del header | 200–300 ms | `cubic-bezier(0.23,1,0.32,1)` | — | Apple (nav local), Resend |
| **Hero** | Por tiempo, al cargar | Secuencia única: eyebrow, H1, lema, CTA. | 16–20 px | 800–1000 ms | `cubic-bezier(0.16,1,0.3,1)` | 120–150 ms | Raycast, Resend |
| **Hover general** | — | Una sola curva para toda la UI. | — | 120–200 ms | `cubic-bezier(0.23,1,0.32,1)` | — | Darkroom |

**Smooth scroll**: no hace falta. Las webs de producto se sienten fluidas con scroll nativo. Si Jose quiere probarlo: Lenis solo en escritorio, `lerp` ≈ 0,1 (medido en Darkroom: 90 % del recorrido en ~330 ms), apagado en táctil y con reduced-motion. Es compatible con `animation-timeline: view()` porque Lenis mueve el scroll real.

**Reduced-motion**: mantener lo actual (página estática). Añadir que el fondo de § 5 quede fijo, sin deriva.

---

## 5. Ideas de fondo: volumen y unidad en coral, sin tapar contenido

### A. Luz fija detrás de las superficies (referencia: Linear)
Una mancha de luz coral, grande y muy desenfocada (rectángulo redondeado o elipse girada, `filter: blur(80–120px)`, opacidad 0,10–0,18), **fija respecto a la ventana**. Solo se ve a través de las superficies (tarjetas, banda, bloque de oferta), que la recortan con `background-attachment: fixed` o una capa `position: fixed` enmascarada por las superficies. Al hacer scroll, cada superficie se ilumina distinto según pasa por la luz: hay volumen y una sola fuente de luz para toda la página.
Opcional: el borde de 1 px de las tarjetas con un brillo coral que sigue el scroll (`mask-image: radial-gradient(...)` con `--mask-y` ligado a `view()`), como el «shine» de Linear.
En ≤ 640 px, Linear la apaga; nosotros podemos dejar solo un degradado estático.

### B. Temperatura de sección que se funde (referencia: Stripe)
Cada bloque lleva detrás un lavado coral/melocotón (radial muy amplio, 4–8 % de saturación sobre el fondo) cuya opacidad va ligada a `view()`: 0 al asomar, máximo cuando el bloque está centrado, 0 al salir. Así el color «respira» con el scroll y une las secciones sin dibujar nada. Mismo gesto en todos los bloques, que es el criterio de Jose. Implementable en `::before` del bloque con `animation-range: cover 0% cover 100%` y keyframes `0% {opacity:0} 50% {opacity:1} 100% {opacity:0}`.

### C. Malla de color lenta a página completa (referencia: Stripe, hero; Vercel, halo del hero)
Una sola capa fija de 2–3 degradados radiales (coral, melocotón, crema) detrás de todo, con `background-position` que deriva muy despacio con `animation-timeline: scroll(root)` (un recorrido total de 10–15 % del viewport a lo largo de toda la página). No hay formas reconocibles: el color se reparte distinto en cada altura. Para no tapar contenido: opacidad máxima detrás del hero y de la banda carbón, y casi nula detrás de párrafos largos (se controla con una máscara vertical o bajando la opacidad en esas secciones). Es la versión CSS, sin WebGL, de la ola de Stripe.

Recomendación de orden para probar: **A** (es la que más se parece a lo que describe Jose y la más contenida), luego **B** si se quiere más presencia de marca.

---

## 6. Lo que no se pudo medir
- Apple: duración y curva de titulares (los reveals no se volvieron a disparar tras recargar).
- Lusion: tiempos del texto palabra a palabra (ya resuelto al inspeccionar).
- Stripe: reduced-motion (4 hojas de otro origen ilegibles) y el mecanismo del resalte de cifras.
- Vercel: tipo de contexto de los canvas.
- Build in Amsterdam: mecanismo del scroll de la pantalla partida.
- Móvil: solo Darkroom, Resend y la regla responsive de Linear.
