---
name: josecoded
description: Plataforma personal de Jose Carlos Sánchez, desarrollador full-stack freelance. Índigo casi negro como material, glifos de código que compilan la interfaz y claridad de lanzador.
colors:
  bg: "#07060f"
  bg-2: "#0c0a1a"
  surface-2: "#1d1946"
  ink: "#07060f"
  text: "#ece9ff"
  text-2: "#a9a3d6"
  text-3: "#8c86bd"
  line: "rgb(157 140 255 / 0.12)"
  line-2: "rgb(157 140 255 / 0.22)"
  violet: "#7c6cff"
  violet-hi: "#9d8cff"
  violet-soft: "#b9adff"
  beam: "#5b4bff"
  green: "#3ddc84"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6.4vw, 5.75rem)"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.045em"
  display-closing:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.8vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    letterSpacing: "-0.03em"
  title-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.3vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"ss01\", \"cv11\""
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label-button:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 550
    letterSpacing: "-0.005em"
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
  mono:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.75
  mono-key:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  key: "5px"
  icon: "7px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 4vw, 3.5rem)"
  block-y: "clamp(6rem, 14vh, 10rem)"
  container: "82rem"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "56px"
components:
  button-solid:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.ink}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-solid-hover:
    backgroundColor: "{colors.violet-hi}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "rgb(124 108 255 / 0.1)"
    textColor: "{colors.text}"
    typography: "{typography.label-button}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "rgb(124 108 255 / 0.18)"
  button-sm:
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  button-lg:
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "56px"
  link-arrow:
    textColor: "{colors.violet-soft}"
  cmdk-trigger:
    backgroundColor: "rgb(157 140 255 / 0.06)"
    textColor: "{colors.text-3}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 8px 0 12px"
    height: "36px"
  kbd:
    backgroundColor: "rgb(157 140 255 / 0.1)"
    textColor: "{colors.text-2}"
    typography: "{typography.mono-key}"
    rounded: "{rounded.key}"
    padding: "4px 6px"
  door:
    backgroundColor: "rgb(14 12 32 / 0.8)"
    textColor: "{colors.text}"
    rounded: "{rounded.2xl}"
    padding: "32px"
  launcher-window:
    backgroundColor: "rgb(13 11 30 / 0.86)"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
  list-item:
    textColor: "{colors.text-2}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  list-item-selected:
    backgroundColor: "rgb(124 108 255 / 0.16)"
    textColor: "{colors.text}"
  project-icon:
    backgroundColor: "rgb(157 140 255 / 0.1)"
    rounded: "{rounded.icon}"
    size: "28px"
  project-icon-selected:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.ink}"
  scheme:
    backgroundColor: "rgb(13 11 30 / 0.86)"
    textColor: "{colors.text}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  palette:
    backgroundColor: "rgb(14 12 32 / 0.97)"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    width: "min(40rem, calc(100vw - 2rem))"
---

# Design System: josecoded

## Overview

**Creative North Star: "El lanzador de código"**

Un sistema tech limpio y preciso, con el acabado de un lanzador de escritorio, donde el índigo no es un acento sino el material de la página. El fondo es un índigo casi negro atravesado por un campo de luz contenido: haces violeta tenues y difusos que siguen al objeto por la página y un poco al cursor, sin lavar la superficie. El objeto es la nube de glifos: caracteres reales de código, lavanda con núcleo violeta, que recorren la página en un único lienzo fijo y forman en cada bloque lo que ese bloque ofrece (móvil, web, chip). Cuando llega a un componente, la nube lo compila: lanza chorros de glifos que trazan su contorno y el componente se imprime de arriba abajo. La interfaz, texto lavanda, superficies de vidrio índigo y filetes violeta, responde a esa luz sin competir con ella.

La densidad es media: bloques amplios separados por mucho aire vertical y, dentro de cada bloque, una interfaz compacta tipo aplicación (ventana con lista y detalle, paleta de comandos, atajos de teclado). La web se lee como una herramienta bien hecha, no como un folleto. El teclado es ciudadano de primera: ⌘K abre una paleta que lleva a cualquier sitio. Con puntero fino la interfaz se nota viva al tacto: el canto de las tarjetas se enciende bajo el cursor y los botones principales se dejan atraer con un muelle; sus etiquetas se descomponen en glifos un instante al entrar el puntero.

Rechazos confirmados en el propio build y en PRODUCT.md: la rejilla de tarjetas iguales, el vidrio decorativo sin escena debajo, los halos morados sueltos detrás de tarjetas o texto, la franja de métricas, el negro puro y cualquier metáfora de objeto físico. El índigo sustituye al grafito anterior a petición de Jose (24-09: «fondo muerto, textos y botones demasiado blancos») y después se oscureció a índigo casi negro con el campo de luz y las superficies más contenidos.

**Key Characteristics:**
- Índigo casi negro con grano fino y un campo de luz violeta contenido que sigue al objeto; nunca negro puro.
- Una sola nube de glifos de código como único objeto; la luz es su sombra proyectada, no un segundo elemento vivo.
- La web se compila: la nube traza en glifos el contorno de cada componente y este se imprime con una línea de barrido, una vez por visita.
- Geist para todo; Geist Mono solo para código, atajos y glifos.
- Filetes de 1 px violeta translúcido dibujados como sombra interior, nunca como borde.
- Acción primaria en violeta sólido con texto índigo; texto en lavanda, nunca en blanco.
- Canto encendido bajo el cursor y botones magnéticos solo con puntero fino y sin reduced-motion.

## Colors

Una paleta índigo casi monocroma: fondos y superficies de la misma familia de matiz (≈285°), texto lavanda, un violeta que es a la vez luz, objeto y acción, y un verde que solo significa "vivo".

### Primary
- **Violeta** (violet): relleno del botón primario, viñetas de los datos de las puertas, icono del proyecto seleccionado y tinte de la selección de texto al 45 %. Con texto índigo encima da 5,2:1.
- **Violeta alto** (violet-hi): hover del botón primario (7,3:1 con texto índigo) y glifos transitorios: salida de las puertas, etiquetas de botones y enlaces, y títulos que se compilan.
- **Violeta suave** (violet-soft): el violeta legible como texto sobre índigo (10,1:1). Enlaces con flecha, salida de las puertas, anillo de foco, flancos de la línea de barrido, cursor de la paleta, barras de progreso del ciclo, iniciales del avatar y glifos de los h2 y de la intro.
- **Haz** (beam): el violeta saturado de la luz. Solo vive dentro del campo de luz (haces y charco al 10 %) y en la sombra de color del botón primario. Nunca como texto ni relleno de superficie.

### Secondary
- **Verde disponible** (green): solo el punto de "disponible" con su pulso, el fondo del badge al 8 %, el destello de aterrizaje de cada carácter en la intro y el de cada glifo de chorro al posarse en el contorno de un componente.

### Neutral
- **Índigo casi negro** (bg): fondo de página y color de limpieza del lienzo WebGL (exacto, salida lineal). **Tinta** (ink) es el mismo valor usado como texto sobre violeta.
- **Índigo elevado** (bg-2): fondo de las capturas de proyecto, bajo un resplandor violeta al 28 %.
- **Superficie alta** (surface-2): avatar.
- **Lavanda** (text): texto principal (17,0:1).
- **Lavanda secundaria** (text-2): subtítulos, navegación en reposo, datos de las puertas (8,5:1).
- **Lavanda terciaria** (text-3): metadatos, pies de ventana, comentarios del esquema, placeholders (6,0:1; no bajar de aquí).
- **Filete** (line): separadores y contorno de reposo, violeta claro al 12 %.
- **Filete fuerte** (line-2): contorno de controles, hover y ventanas, al 22 %.

Las superficies de vidrio (puertas, ventana, esquema, paleta) no usan un token único: son índigos casi negros translúcidos entre el 80 % y el 97 % de opacidad, más densos cuanto más texto sostienen.

### Named Rules
**The Indigo Floor Rule.** El fondo es índigo (bg) con grano al 4,5 %. Nunca #000 en fondos ni overlays: la cabecera con scroll es rgb(7 6 15 / 0.7), el fondo del modal rgb(8 6 22 / 0.6) y las sombras de caída usan índigo casi negro rgb(5 3 20).

**The Lavender Text Rule.** El texto nunca es blanco puro: lavanda (text) para lo principal y sus dos escalones para lo demás. El blanco solo aparece como brillo al 5–28 % en cantos iluminados y como núcleo de 1 px de la línea de barrido: luz, nunca texto.

**The Violet Action Rule.** La acción primaria es violeta sólido con texto índigo; el hover sube a violeta alto. Los enlaces y salidas secundarias van en violeta suave. Ninguna superficie grande se rellena de violeta opaco.

**The Green Means Live Rule.** El verde marca solo disponibilidad y aterrizaje. Si algo verde no está "vivo", sobra.

## Typography

**Display Font:** Geist (con ui-sans-serif, system-ui)
**Body Font:** Geist (con ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (con ui-monospace, SF Mono)

**Character:** Una sola familia geométrica y técnica, apretada en los titulares y relajada en el texto; la mono aparece solo donde hay código de verdad. Se activan las alternativas `ss01` y `cv11` en todo el documento.

### Hierarchy
- **Display** (600, clamp(3rem, 6.4vw, 5.75rem), 0.96): el nombre en el hero, en dos líneas, con `text-wrap: balance`. En estrecho baja a clamp(2.5rem, 11vw, 3.5rem).
- **Display de cierre** (600, clamp(3rem, 8vw, 6rem), 0.95): el titular del bloque de contacto.
- **Headline** (600, clamp(2rem, 3.8vw, 3.25rem), 1.02): los h2 de cada bloque.
- **Title** (600, 1.5rem, -0.03em): títulos de las puertas. **Title pequeño** (600, 1.25rem): nombre del proyecto en la ventana.
- **Lede** (400, clamp(1.0625rem, 1.3vw, 1.1875rem)): entradilla bajo cada h2 en lavanda, máximo 40ch; la segunda frase va en terciario.
- **Body** (400, 1rem, 1.55): texto corrido; el subtítulo del hero a clamp(1.0625rem, 1.35vw, 1.25rem), máximo 34ch, con la frase clave en lavanda a 500.
- **Label** (400–500, 0.875rem): navegación, pies, enlaces secundarios. **Caption** (500, 0.75rem): etiquetas de tipo, grupos de la paleta.
- **Mono** (400, 0.8125rem, 1.75): el esquema de arquitectura. **Mono de tecla** (500, 0.6875rem): kbd; el selector de idioma a 0.75rem.

### Named Rules
**The One Family Rule.** Geist para todo. Geist Mono solo para código, atajos de teclado, el esquema, el selector de idioma y los glifos (escena, chorros, h2, títulos que se compilan y etiquetas que se descomponen). Ningún otro tipo de letra.

**The Tight Display Rule.** Cuanto más grande, más apretado: display a -0.045em, headline a -0.04em, title a -0.03em, marca y títulos pequeños a -0.02em. El texto corrido va con tracking normal.

## Layout

Contenedor máximo de 82rem centrado, con un margen lateral fluido (gutter). Cada bloque respira con un relleno vertical de clamp(6rem, 14vh, 10rem). La cabecera es fija, de 4rem, transparente sobre el hero y con índigo casi negro al 70 % y desenfoque tras 80 px de scroll.

El orden de capas es fijo: lienzo WebGL (0), campo de luz y grano (1), contenido (2), cabecera (30). El campo de luz es una capa fija que desborda la ventana un 20vmax por lado, se mezcla en `screen` y solo se mueve por `transform`.

El hero es un split 5/7 a altura completa (100svh): texto a la izquierda, escenario de la nube a la derecha (arrastrable con puntero fino). Los bloques alternan el lado donde se posa la nube (`data-side`) y el texto ocupa la columna contraria. Las dos puertas van en dos columnas con un hueco central amplio (clamp(8rem, 22vw, 20rem)) donde la nube morfa; bajo 1080 px el hueco se cierra a 1.25rem.

El ritmo interno usa pasos de 6, 8, 12, 16, 24, 32 y 56 px; los objetivos táctiles miden al menos 44 px.

**Responsive.** 1080 px: desaparecen los enlaces de navegación. 900 px: todo a una columna, el escenario sube por encima del texto a 38svh (34svh si la altura es menor de 700 px), la puerta de Negocios pasa primero, la ventana apila lista y detalle, y la cabecera se reduce a búsqueda, contacto y menú. 600 px: el esquema oculta los comentarios.

### Named Rules
**The One Living Thing Rule.** Hay un único lienzo WebGL fijo detrás del contenido y un solo objeto vivo. El campo de luz no es un segundo elemento: sigue al objeto con el mismo amortiguado y solo se desvía un poco hacia el cursor. Los chorros de la compilación no son un segundo objeto: salen de la nube, dibujan un contorno y se apagan. En la ventana de proyectos la nube se atenúa al 5 %. Bajo 900 px la nube vive solo en el hero y nunca queda bajo texto ni botones.

## Elevation & Depth

Híbrido: la profundidad real la ponen la escena 3D y el campo de luz; la interfaz son láminas de vidrio índigo separadas por filetes violeta de 1 px, luz superior tenue y sombras de caída largas y muy difusas en índigo casi negro. El desenfoque de fondo existe porque cada lámina flota sobre la escena y la luz en movimiento.

### Shadow Vocabulary
- **Filete** (`box-shadow: inset 0 0 0 1px var(--line)`): contorno de reposo de superficies, controles y separadores (con `inset 0 1px 0` o `inset 0 -1px 0` para una sola arista).
- **Filete fuerte** (`box-shadow: inset 0 0 0 1px var(--line-2)`): controles, hover, ventana y botón fantasma.
- **Luz superior** (`inset 0 1px 0 rgb(185 173 255 / 0.08)` en puertas; `rgb(255 255 255 / 0.06–0.07)` en ventana y paleta).
- **Botón violeta** (`inset 0 1px 0 rgb(255 255 255 / 0.28), inset 0 -2px 0 rgb(13 11 31 / 0.22), 0 10px 28px -12px rgb(91 75 255 / 0.9)`): la única sombra de color; el botón emite la luz del haz.
- **Puerta** (`0 30px 60px -30px rgb(5 3 20 / 0.95)` más filete y luz superior).
- **Ventana** (`0 50px 100px -40px rgb(5 3 20 / 0.95), 0 0 0 1px rgb(5 3 20 / 0.6)` más filete fuerte y luz superior).
- **Paleta** (`0 40px 80px -20px rgb(5 3 20 / 0.9)` más filete fuerte y luz superior).
- **Tecla** (`inset 0 -1px 0 rgb(0 0 0 / 0.4), inset 0 0 0 1px var(--line)`).
- **Canto encendido** (tarjetas `.lit`): anillo de 1 px por máscara con degradado radial de 18rem en la posición del cursor, de violeta suave al 90 % a violeta al 35 %, más resplandor interior de 28rem al 14 %. Opacidad 0 → 1 en 300 ms.
- **Línea de barrido** (1 px, degradado horizontal transparente → violeta suave → blanco → violeta suave → transparente, con `0 0 12px 1px rgb(157 140 255 / 0.7)`): solo durante la impresión de un componente.

### Named Rules
**The Inset Hairline Rule.** Los contornos se dibujan con sombra interior de 1 px, nunca con `border`. El canto encendido es un pseudoelemento enmascarado encima del filete, así que tampoco mueve el layout.

**The Glass Over Light Rule.** `backdrop-filter` solo en láminas que flotan sobre la escena o el campo de luz: cabecera con scroll (14 px), puertas (18 px), ventana de proyectos (20 px), paleta (24 px) y su fondo (4 px). Nunca en piezas sin escena debajo ni como adorno.

**The Light Belongs To The Object Rule.** Los haces y el charco de luz violeta viven solo en la capa de campo, que sigue a la nube. Fuera de ella, la luz violeta solo aparece como respuesta: el canto bajo el cursor, la sombra del botón primario, el resplandor de la captura y la línea de barrido mientras un componente se imprime. No se añaden halos ni degradados violeta estáticos detrás de tarjetas o titulares.

## Shapes

Esquinas suaves y escalonadas por tamaño: cuanto mayor es la pieza, mayor el radio. Tecla 5 px, icono de proyecto 7 px, filas de lista 8 px, disparador ⌘K y capturas 10 px, esquema 12 px, ventana y paleta 16 px, puertas 20 px. Botones, badge y pastillas son píldoras (999 px); avatar, viñetas y puntos, círculos. El dispositivo en miniatura de las capturas usa 14 px. Los haces del campo de luz son elipses muy alargadas (22 × 170vmax) desenfocadas 5vmax e inclinadas entre 26° y 38°.

## Components

### Buttons
- **Shape:** píldora (999 px).
- **Sólido (primario):** violeta con texto índigo, peso 550 a 0.9375rem, 48 px de alto (36 px pequeño, 56 px grande); canto superior blanco al 28 % y sombra de color del haz. Hover a violeta alto.
- **Fantasma:** violeta al 10 % con filete fuerte; al 18 % en hover.
- **Etiqueta que se compila:** en el botón sólido, los enlaces con flecha y el enlace alternativo de las puertas, la etiqueta se descompone en glifos Geist Mono violeta alto y se recompone en 220 ms al entrar el puntero. El fantasma no lo hace. Solo con puntero fino y sin reduced-motion.
- **Pulsación:** scale(0.97) con ease-out de 160 ms. Colores a 150 ms.
- **Magnético:** los botones principales de cada vista (Contacto, Ver proyectos, WhatsApp, Reservar) siguen al cursor con un muelle crítico suave (rigidez 260, amortiguación 22, sin rebote apreciable) cuando el puntero entra en una zona de 1,6 veces su tamaño más 24 px; se desplazan el 22 % de la distancia en horizontal y el 30 % en vertical, y la pulsación baja a 0.96 por el mismo muelle. El transform lo escribe JS, solo con puntero fino y sin reduced-motion; se reserva para acciones, nunca para tarjetas o enlaces de texto.
- **Enlace con flecha:** texto a 500 en violeta suave con icono Lucide que avanza 3 px en hover. Es la salida secundaria junto al botón primario.

### Chips / Keys
- **Tecla (kbd):** Geist Mono 500 a 0.6875rem, fondo violeta claro al 10 %, filete y arista inferior oscura. Solo para atajos reales (⌘K, ↑, ↓, ↵, esc).

### Cards / Containers
- **Puerta:** radio 20 px, vidrio índigo casi negro al 80 % con desenfoque de 18 px, filete, luz superior lavanda y sombra de puerta; relleno de 32 px (24 px en estrecho). Todo el panel es clicable mediante el enlace del título; el foco pinta un anillo interior de 2 px violeta suave. Datos en lista con viñeta circular violeta y separador superior. Salida en violeta suave cuya flecha avanza 5 px en hover.
- **Tarjeta con luz y canto:** puertas, ventana y esquema. Con puntero fino, el canto se enciende donde está el cursor y un resplandor interior le acompaña; al salir se apaga en 300 ms. En las puertas, además, el texto de la salida se resuelve en glifos Geist Mono violeta alto durante 260 ms al entrar el puntero (con `aria-label` fijo con el texto final).
- **Ventana tipo lanzador:** radio 16 px, vidrio al 86 % con desenfoque de 20 px, barra de búsqueda de 56 px, lista a la izquierda (mín. 15rem) y detalle a la derecha, pie de 40 px con ruta y atajo. Fila seleccionada al 16 % de violeta con filete violeta y su icono de 28 px en violeta sólido. Navegable con flechas, Inicio y Fin.
- **Esquema:** bloque de código mono con radio 12 px, índigo casi negro al 86 % sin desenfoque y comentarios en terciario.

### Inputs / Fields
- **Paleta:** campo sin borde de 56 px dentro de la caja, cursor violeta suave, placeholder terciario. Sin estados de error: si no hay resultados, una línea en terciario que sugiere términos.

### Navigation
- **Cabecera:** marca a 600 y -0.02em; enlaces a 0.875rem en lavanda secundaria que pasan a lavanda con puntero fino; a la derecha, disparador ⌘K, idioma en mono, "Entrar" y botón violeta pequeño y magnético "Contacto". Tras 80 px gana índigo al 68 % con desenfoque y filete inferior.
- **Móvil (<900 px):** disparador ⌘K reducido a icono de 44 px y botón de menú de 44 px.

### Command Palette (firma)
Diálogo modal de hasta 40rem a 14vh del borde superior, caja índigo casi negro al 97 % con desenfoque de 24 px. Resultados agrupados ("Ir a", "Acciones") con icono Lucide, fila seleccionada al 16 % de violeta y pista a la derecha. **Se abre y cierra sin animación** porque se invoca con teclado. ⌘K o Ctrl+K lo alterna.

### Glyph Scene y campo de luz (firma)
Nube de 9.000 glifos (5.000 bajo 640 px) de Geist Mono en un lienzo fijo, lavanda con núcleo violeta y bloom leve (0.22). En el hero cicla móvil → web → chip (3,5 s de reposo, 1,6 s de morph) con barras de progreso de 2 px; en las puertas morfa a chip o móvil según el puntero (1,1 s). La nube sigue al bloque activo con un amortiguado exponencial (k = 1 − e^(−3,2·dt)), y el campo de luz (tres haces a opacidad 0.3, 0.2 y 0.14 y un charco al 10 %) copia esa posición con el mismo amortiguado, más un 5–6 % de desvío hacia el cursor y una rotación de hasta 4°. La primera visita de cada sesión hace una intro por caída de los caracteres del hero con destello verde al aterrizar; cualquier tecla, clic, toque o scroll la termina. Los h2 se resuelven glifo a glifo una sola vez al entrar en pantalla (520 ms + 14 ms por carácter, ease-out cúbico), con el texto real siempre accesible. Con reduced-motion no hay escena, ni intro, ni resolución, ni compilación, ni imán, ni canto que siga, y el campo queda quieto en su posición del hero.

### La web se compila (firma)
Puertas, ventana de proyectos y esquema no aparecen: se compilan. Cuando su contenedor entra en pantalla (25 % visible, una vez por visita), en escritorio (≥900 px, con WebGL) la nube emite un chorro de glifos Geist Mono, un segundo sistema de puntos en suma aditiva con reserva circular de 9.000 partículas y hasta 2.200 por componente, que vuelan en arco desde la nube hasta el contorno del componente. El contorno se traza en orden, desde la esquina superior izquierda en sentido horario (0,32 s de reparto más 0,6–0,85 s de vuelo por glifo, ease-out cúbico), como una línea de código que se escribe; cada glifo muta mientras vuela, en lavanda, y al posarse destella en verde y se apaga en 0,45 s. Hacia el 80 % del vuelo el componente se imprime de arriba abajo con un recorte `inset` (620 ms, ease-out 0.23, 1, 0.32, 1) y una línea de barrido que lo recorre y se funde en 200 ms; su título se resuelve en glifos violeta alto en 420 ms. En un grupo, cada componente sale 140 ms después del anterior (las dos puertas). En móvil o sin WebGL solo hay impresión. Con reduced-motion no hay recorte ni chorros: el componente está ahí desde el principio.

**The Web Compiles Rule.** Los componentes de contenido (puertas, ventana, esquema) entran compilándose, nunca con fundidos, deslizamientos ni escalas: primero el código traza el contorno, luego la pieza se imprime de arriba abajo. Ocurre una sola vez por componente y visita, el texto real está siempre en el DOM, y solo los glifos, el destello verde y la línea de barrido participan; no se añade otra coreografía de entrada.

### Elementos abiertos (no canonizados)
- **Badge de estado sobre el h1** ("Disponible para proyectos", píldora con punto verde): se mantiene por aprobación de Jose (D16), pero choca con la prohibición de antetítulos del suelo de oficio. Pendiente de su decisión; no es un patrón reutilizable y no se replica sobre otros titulares.
- **Marcadores {{DATO}}** (mono amarillo #e9c46a): contenido pendiente, no un color del sistema.
- **Escena en móvil:** el prototipo muestra la escena viva solo en el hero; la spec de producción pide vídeo o poster en móvil. Provisional.
- **Escena que recorre la página con el scroll:** choca con "WebGL fuera del hero" de PRODUCT.md. Pendiente de la decisión de Jose; hasta entonces, la escena y el campo de luz fuera del hero se consideran propios de este prototipo.

## Do's and Don'ts

### Do:
- **Do** usar índigo (bg) como fondo y vidrio índigo translúcido con filete violeta para las láminas que flotan sobre la escena.
- **Do** dibujar todo contorno como sombra interior de 1 px al 12 % o al 22 % de violeta claro.
- **Do** usar el botón violeta sólido con texto índigo para la única acción primaria de cada vista y el enlace con flecha en violeta suave para la secundaria.
- **Do** escribir el texto en lavanda (text, text-2, text-3), nunca en blanco.
- **Do** limitar hover, canto encendido, imán y descomposición de etiquetas a `(hover: hover) and (pointer: fine)`, y usar ease-out cubic-bezier(0.23, 1, 0.32, 1) con 150–200 ms en las salidas.
- **Do** mover el campo de luz y los botones magnéticos solo por `transform`, cada uno en su propia capa.
- **Do** dar a cada acción de teclado su atajo visible con kbd, y abrir lo que se invoca con teclado sin animación.
- **Do** sustituir todo movimiento con `prefers-reduced-motion`: sin intro, sin escena, sin resolución de h2, sin compilación, sin imán, sin luz que siga, sin pulso.
- **Do** hacer entrar los componentes de contenido por compilación (contorno en glifos y luego impresión de arriba abajo en 620 ms), una vez por visita, con 140 ms entre piezas hermanas.
- **Do** usar iconos Lucide con trazo 1.75 a 1.05em.

### Don't:
- **Don't** usar #000 ni negro puro en fondos u overlays, ni blanco puro en texto.
- **Don't** poner halos ni degradados violeta estáticos detrás de tarjetas o titulares: la luz violeta pertenece al campo que sigue al objeto y a las respuestas al cursor.
- **Don't** rellenar superficies grandes de violeta opaco; el violeta sólido es para el botón primario, las viñetas y el icono seleccionado.
- **Don't** usar verde para nada que no sea disponibilidad o el aterrizaje de glifos.
- **Don't** añadir un segundo objeto vivo, ni poner la escena bajo texto o botones en pantallas estrechas.
- **Don't** dar a los componentes de contenido fundidos, deslizamientos o escalas de entrada, ni repetir la compilación en la misma visita.
- **Don't** usar vidrio sin escena o luz debajo.
- **Don't** inclinar ni escalar al hacer hover; las únicas escalas son la pulsación (0.97, o 0.96 en los magnéticos) y el desplazamiento magnético de las acciones.
- **Don't** montar rejillas de tarjetas iguales ni franjas de métricas o contadores.
- **Don't** poner antetítulos sobre los h2.
