# home v7 · bento por escenas (reposicionamiento freelance)

**Estado:** paso 2 de la tarea 2.0 hecho (`ui`, 2026-10-28): **el prototipo ya existe** en esta carpeta (`index.html`, `base.css`, `v7.css`, `base.js`, `v7.js`, `scene.js` sin cambios). §0–§9 son el wireframe del paso 1 (`ux`) y los hallazgos de `usuario-ejemplo`; lo que hace el prototipo, sus desvíos y lo que decide Jose está en **§10–§15**. Pendiente: paso 3 (`revisor`) y paso 4 (Jose en el navegador).
**Fecha:** 2026-10-28 · **Rama:** `design/home-v7`
**Fuentes:** spec v2.0 §0 (D36–D47, §0.2 vías, §0.3 personas, §0.8 home v7), PANT v2.0 (P20, P21, P22), plan v3.0 tarea 2.0, `DESIGN.md`, `PRODUCT.md`, DOM de `ref/home-v6/` (`index.html`, `base.js`, `v6.js`), `packages/pricing/pricing.json`.

> **Resuelto en el paso 2:** `PRODUCT.md` ya describe la identidad única (D36). El aviso original decía que `PRODUCT.md` seguía describiendo las dos audiencias (Marta principal, Dani secundaria, «Empresas · Negocios» en la navegación). La spec v2.0 lo supera (D36). Este documento sigue la spec. Hay que actualizar `PRODUCT.md` (Users, Operating Context, Capabilities, principio 3) antes del `/impeccable critique` del paso 2, o el crítico comparará con el modelo antiguo. Lo anoto como pendiente para el controlador; no lo toco aquí.

---

## 0. Brief de shape (resumen)

| | |
|---|---|
| **Superficie** | Home pública `/` (y `/en`). Escenas nuevas: **Servicios** y **Lab/Blog**. Cambian también el hero (subtítulo y segundo CTA), la cabecera, el menú ☰, la paleta ⌘K, el indicador de sección y el pie. |
| **Modo** | **Persuadir.** El visitante decide qué vía es la suya y actúa. La escena Lab/Blog es Persuadir con algo de demostración: enseña oficio, no se lee aquí. |
| **Mundo visual** | Fijado. `DESIGN.md` + `.impeccable/design.json` sin cambios. No hay nueva dirección (no aplica `new-work`). Se reutiliza la mecánica v6 tal cual: escena de 100svh, titular a dos tonos, bento de tres celdas por container queries, celda principal ampliable, paginado por gesto, entradas ligadas al scroll. |
| **Tesis** | **Una escena, cuatro puertas.** La celda principal de Servicios es un selector de vías: cada fila dice qué es y cuánto cuesta, y al elegirla el panel muestra una frase y **una sola acción primaria**. Las otras dos celdas responden a la pregunta de Marta («¿cuánto?») con los cinco packs y a la de Dani con la tarifa. |
| **Momento focal** | El cambio de vía: el resaltado se desliza a la fila y el panel cambia su frase y su botón. Es el único gesto vivo de la celda. |
| **Fuera de alcance** | `/servicios`, `/partners`, `/lab`, chat, generador: solo se enlazan. Sistema visual, tokens, hero WebGL, Sobre mí, Proyectos (carrusel) y cierre: como la v6 salvo lo que marca §6. |
| **Anti-objetivos** | Una rejilla de cuatro tarjetas iguales (una por vía). Cuatro botones sólidos en la misma escena. Etiqueta «recomendado» o regalos. Cualquier métrica. Precios fuera de `pricing.json`. Glifos fuera del hero y del arte de Proyectos. |

**Supuestos (no hay respuesta humana en este paso; Jose los valida en el navegador):**
1. Las cuatro vías de la celda son las de spec §0.2 (por hora · proyecto cerrado · packs · contratación). La spec §0.8 dice «por hora · proyecto/packs · contratación» (tres), pero el plan 2.0 y §0.2 dicen cuatro. Sigo cuatro.
2. P5 es la app móvil: en `pricing.json` aún se llama `APP_MVP` dentro de `apps[]` (4.000 €, 6 semanas) y `APP_PLUS` (6.000 €) no se ha convertido en opción. El prototipo muestra «P5 · App móvil · desde 4.000 €» y no muestra la ampliada en la home. La reestructuración de `pricing.json` (D37) es de otra tarea.
3. Los textos comerciales que no existen se muestran como `{{DATO: …}}` visible (clase `.todo` de la v6). Las etiquetas de acción que fija la spec (Reservar 20 min, Pedir propuesta orientativa, Descargar CV, etc.) y los textos ya aprobados en la v6 se reutilizan.

---

## 1. Personas y tareas clave

| Persona | Dispositivo y contexto | Tarea en la home (máx. 1 por persona) | Salida esperada |
|---|---|---|---|
| **Marta** | Móvil (360–414), táctil, llega por una recomendación o búsqueda local. No técnica. | Ver **qué le harían y desde cuánto** y hablar sin compromiso. | `/servicios?pack=Px#packs` (comparador), WhatsApp (cierre) o generador. |
| **Dani** | Escritorio, puntero fino, viene de LinkedIn o GitHub. Mira Proyectos y Lab. | Contratar **por horas** o una feature cerrada: **reservar 20 min**. | Cal.com (vía por hora), `/servicios#por-hora`. |
| **Nuria** | Escritorio (a veces móvil), viene del enlace de un mensaje o llega a la home de rebote. | Encontrar **la puerta de agencias**. | `/partners`. |
| **Pablo** | Escritorio, viene de LinkedIn o de buscar el nombre. | **Descargar el CV** o reservar. | PDF del CV, Cal.com, chat (caso `recruiter`). |

Quinta tarea transversal: **saltar a cualquier sitio con ⌘K** (Dani, Pablo).

---

## 2. Mapa de la home v7

```
/ (home)
├─ Hero ............................ [Ver proyectos] · «Cómo trabajo conmigo →» (→ #servicios)
├─ #sobre-mi   Sobre mí ............ como v6 (+ «Descargar CV», ver §6.2)
├─ #servicios  Servicios ........... NUEVA (funde #empresas y #negocios)
├─ #proyectos  Proyectos ........... como v6 (carrusel fijado)
├─ #lab-blog   Lab/Blog ............ NUEVA (sustituye a #blog)
├─ #hablamos   ¿Empezamos? ......... como v6
└─ pie ............................. secciones + Lab + Blog + Para agencias + Área + Legal
Cabecera:  Sobre mí · Servicios · Proyectos · Lab/Blog    |  EN · ⌘K · Chat · Login
Menú ☰:    (los 4) ─ Para agencias · Contacto (destacado) ─ idioma
⌘K:        Ir a (6) · Acciones (10)
Indicador: 5 líneas (Sobre mí, Servicios, Proyectos, Lab/Blog, Contacto)
```

Navegación: dos niveles como mucho (home → página de la vía o de destino). Las anclas de la home son `#servicios` y `#lab-blog` (en inglés `#services` y `#lab-blog`). Las anclas de vía (`#por-hora`, `#proyecto`, `#packs`, `#contratacion`) son de `/servicios`, no de la home.

---

## 3. Escena Servicios `#servicios`

### 3.1 Qué contiene y por qué

| Celda | Rol | Por qué está |
|---|---|---|
| **Vías** (principal, ampliable) | Elegir la forma de trabajar y actuar | Es la puerta de las cuatro personas. Cada fila lleva su precio para que nadie tenga que elegir para saber cuánto cuesta. |
| **Packs** | Responder «¿cuánto me costaría una web o una app?» | Marta decide por precio cerrado. Cinco cifras a la vista, sin abrir nada. |
| **Tarifas** | Responder «¿cuánto la hora o una feature?» | Dani compara 40 €/h y «desde 150 €». Es la celda Tarifas de la v6 con otra etiqueta. |

**Una sola acción sólida en la escena:** la del panel de la vía elegida. Packs y Tarifas solo tienen enlaces (filas de pack y enlace con flecha).

### 3.2 Wireframe · escritorio (≥ 52rem de bento, 1440×900)

Disposición recomendada **B: 12 + 7 + 5** (vías a lo ancho con lista y panel lado a lado; debajo, Packs 7 y Tarifas 5). Alternativa **A: 7 alta + 5 + 5** (la de Empresas en la v6). Decide `ui` en el navegador; razones en §3.6.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ {{DATO: titular Servicios, tono 1}}  {{DATO: tono 2}}                                   │  h2 a dos tonos
│ (propuesta PANT P20: «Trabajo como freelance.» / «Web, móvil e IA, de la forma que te    │
│  encaje.» — la fija redactor)                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ [ic] Cómo trabajamos                                                           [⤢]      │  celda principal (cell--big, ampliable)
│ Precios sin IVA.                                                                         │  nota antes de cualquier precio
│ ┌───────────────────────────────────────┐  ┌──────────────────────────────────────────┐ │
│ │▌[ic] Por hora                40 €/h   │  │ {{DATO: frase vía por hora}}              │ │  panel de la vía elegida
│ │ [ic] Proyecto cerrado   desde 150 €   │  │                                           │ │
│ │ [ic] Packs              desde 900 €   │  │ [ Reservar 20 min ]   (sólido)            │ │  acción primaria de la vía
│ │ [ic] Contratación     CV y entrevista │  │ Preguntar al asistente →                  │ │  secundaria
│ └───────────────────────────────────────┘  │ ¿Eres una agencia? Para agencias →        │ │  solo en «Por hora»
│   resaltado deslizante bajo la elegida      └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┬──────────────────────────────────┤
│ [ic] Packs                                            │ [ic] Tarifas                      │
│ Desde, sin IVA.                                        │ ( Por horas | Por feature )       │  selector segmentado
│  Web básica  Pedidos o   Gestión  Gestión y   App      │                                   │
│              reservas             automat.    móvil    │   40 €/h                          │  cifra, aria-live
│  900 €       1.400 €     2.500 €  4.200 €    4.000 €   │ Dentro de tu equipo, a tu ritmo.  │  texto v6
│              ━━━━━━━  (barra en P2, destacado inicial) │ Trabajo por horas →               │  sigue a la pestaña
│ Qué incluye cada pack →                                │                                   │
└──────────────────────────────────────────────────────┴──────────────────────────────────┘
```

### 3.3 Wireframe · móvil 360×640 (bento en una columna)

```
┌──────────────────────────────┐
│ josecoded        [🔍][💬][☰]│ cabecera 4rem
├──────────────────────────────┤
│ {{DATO: titular tono 1}}      │
│ {{DATO: tono 2}}              │
│┌────────────────────────────┐│
││[ic] Cómo trabajamos     [⤢]││
││Precios sin IVA.            ││
││▌Por hora           40 €/h  ││ fila ≥ 2.75rem
││ Proyecto cerrado desde 150€││ el precio va en la fila,
││ Packs          desde 900 € ││ nunca oculto como metadato
││ Contratación  CV y entrev. ││
││────────────────────────────││
││{{DATO: frase vía por hora}}││ panel debajo de la lista
││[   Reservar 20 min   ]     ││ botón a todo el ancho de la celda
││Preguntar al asistente →    ││
││¿Eres una agencia? …   →    ││
│└────────────────────────────┘│
│┌────────────────────────────┐│
││[ic] Packs                  ││
││Desde, sin IVA.             ││
││ Web básica          900 €  ││ lista vertical bajo ~30rem
││▌Pedidos o reservas 1.400 € ││ de contenedor (5 filas, sin
││ Gestión            2.500 € ││ huérfano en rejilla de 2)
││ Gestión y autom.   4.200 € ││
││ App móvil          4.000 € ││
││Qué incluye cada pack →     ││
│└────────────────────────────┘│
│┌────────────────────────────┐│
││[ic] Tarifas                ││
││( Por horas | Por feature ) ││
││  40 €/h                    ││
│└────────────────────────────┘│
└──────────────────────────────┘
```

A 360×640 la primera fila de vías con precio («Por hora · 40 €/h») entra en la primera pantalla de la escena y «Packs · desde 900 €» también. La celda Packs empieza más o menos en la segunda pantalla. Lo comprueba `ui` con la medida real.

### 3.4 Las cuatro vías: contenido del panel

| Fila (etiqueta · cifra) | Icono Lucide (propuesta) | Frase del panel | Acción primaria (sólida) | Secundarias (enlace con flecha) | Ampliar → destino |
|---|---|---|---|---|---|
| **Por hora** · `40 €/h` | `clock` | `{{DATO: frase vía por hora (redactor)}}` | **Reservar 20 min** → Cal.com `{{DATO: URL Cal.com}}` | «Preguntar al asistente →» (`/chat?case=client`) · «¿Eres una agencia? Para agencias →» (`/partners`) | `/servicios#por-hora` |
| **Proyecto cerrado** · `desde 150 €` | `package-check` | `{{DATO: frase vía proyecto cerrado}}` | **Pedir propuesta orientativa** → `/propuesta` | «Escribir por WhatsApp →» (`{{DATO: wa.me}}`, prellenado «proyecto») | `/servicios#proyecto` |
| **Packs** · `desde 900 €` | `store` | `{{DATO: frase vía packs}}` | **Pedir propuesta** → `/propuesta` | «Comparar los cinco packs →» (`/servicios#packs`) · «Escribir por WhatsApp →» | `/servicios#packs` |
| **Contratación** · `CV y entrevista` | `briefcase` | `{{DATO: frase vía contratación}}` | **Reservar 20 min** → Cal.com | «Descargar CV (PDF) →» (es o en según idioma, `{{DATO: CV}}`) · «Preguntar al asistente →» (`/chat?case=recruiter`) | `/servicios#contratacion` |

- La cifra de la cuarta fila no es un precio (D47: sin salario). «CV y entrevista» es una etiqueta que propongo. Si Jose prefiere dejarla vacía, la fila queda solo con el nombre.
- «desde» va siempre antes de la cifra, y «Precios sin IVA.» encima de la lista, antes de cualquier precio (spec §0.2).
- Los precios salen de `pricing.json` (`hourly`, `feature`, el mínimo de `packs[].price`). Nunca se escriben a mano.
- Las filas no llevan metadatos ocultables. La cifra es parte de la fila y se ve a cualquier ancho (cambio respecto a `.plist .meta` de la v6, que se ocultaba bajo 26rem).

### 3.5 Comportamiento del selector de vías

**Semántica: grupo de radios nativos** (`fieldset` con `legend` «Cómo trabajamos» oculta visualmente, cuatro `input type="radio" name="via"` con su `label` = fila). Cada panel se muestra con CSS `:has(#via-hora:checked)`. Razones:
- Funciona **sin JS**: el visitante elige una vía y el panel cambia.
- Las flechas recorren las vías de forma nativa y Tab salta de la vía elegida al botón del panel, que va justo después en el orden del DOM.
- La spec y el plan admiten «tabs o radios» (spec §12.5, plan 2.0 paso 3).

| Entrada | Efecto |
|---|---|
| Clic o toque en una fila | Elige la vía: el resaltado se desliza (240 ms, `--ease-slide` de la v6) y el panel cambia su frase y su acción. **No navega.** |
| Hover con puntero fino | **Solo mueve el resaltado** como vista previa. **No cambia el panel.** Al salir de la lista, el resaltado vuelve a la vía elegida. Así se evita que, al llevar el ratón de la fila 1 al botón del panel cruzando otras filas, se cambie la vía (en la disposición A es inevitable). |
| Foco (Tab) | Entra en la vía elegida. ↑/↓ (y ←/→) cambian de vía y el panel la sigue (comportamiento nativo del radio). |
| Por defecto | **Por hora** está elegida (primera fila). Así el enlace «Para agencias» se ve en cuanto se llega a la escena (Nuria). Hay otras opciones en §9 D3. |
| Ampliar `[⤢]` / clic en la celda | Abre la celda ampliada (View Transition como v6). El bloque «más» dice `{{DATO: resumen de las cuatro vías}}` y lleva **[Ir a Servicios]** (sólido) → `/servicios#<ancla de la vía elegida>`. Mientras la celda está ampliada, el botón del panel baja a fantasma: una sola sólida por vista. |
| Cambio de panel | La frase y el botón entran con fundido y un leve desenfoque (260 ms, como la cifra de Tarifas). Sin desplazamiento de layout: el panel reserva el alto de la frase más larga (lo mide `ui` con los textos reales). |

Lector de pantalla: «Cómo trabajamos, grupo. Por hora, 40 euros la hora, botón de opción, seleccionado, 1 de 4». El panel no necesita `aria-live`, porque el cambio lo dispara el propio usuario y el foco sigue en el radio. La cifra de cada fila va dentro del `label`.

### 3.6 Packs y Tarifas

**Packs (PackStrip de cinco):**
- Orden: P1 Web básica 900 € · **P2 Pedidos o reservas 1.400 €** (destacado inicial, como en la v6) · P3 Gestión 2.500 € · P4 Gestión y automatizaciones 4.200 € · P5 App móvil 4.000 €.
- Nombres: los de `pricing.json` en español, salvo P2, que es «Pedidos o reservas» como en la v6 (en `pricing.json` es «Pedidos / reservas»). P5 «App móvil» viene de spec §0.2. En inglés todos son `{{DATO}}` (están en `pricing.json`).
- P5 cuesta menos que P4. Corta la escalera de precios porque es otro producto, así que conviene un **filete de 1 px o un hueco mayor entre P4 y P5** para separar web y app (§9 D4).
- **Cada pack es un enlace real**: nombre accesible «Pedidos o reservas, desde 1.400 € sin IVA. Ver qué incluye». Destino recomendado: `/servicios?pack=P2#packs` (el comparador abierto en ese pack), no el generador: Marta lee antes de pedir. Esto **añade un requisito a P20** (aceptar `?pack=`) y es la decisión §9 D5.
- Hover o foco desliza la barra de 2 px al pack (260 ms) y baja los demás al 55 %, como la v6. Al salir, la barra vuelve a P2.
- Enlace de celda: «Qué incluye cada pack →» → `/servicios#packs`.
- Contenedor estrecho (por debajo de ~30rem, lo fija `ui`): lista vertical de cinco filas, con el nombre a la izquierda y la cifra a la derecha. Nunca una rejilla de 2 con un pack huérfano.

**Tarifas (selector segmentado de la v6):**
- Pestañas «Por horas · Por feature» (texto v6). Cifras «40 €/h» · «desde 150 €». Líneas v6: «Dentro de tu equipo, a tu ritmo.» / «Una funcionalidad cerrada, con precio y plazo.». Añade «Sin IVA.» en la línea pequeña.
- Enlace que sigue a la pestaña: «Trabajo por horas →» (`/servicios#por-hora`) / «Proyecto cerrado →» (`/servicios#proyecto`).
- Semántica: v6 usa `tablist`. Recomiendo pasarlo a radios por coherencia con el selector de vías y para que funcione sin JS (§9 D6). Si sigue como `tablist`, sin JS se ve solo «40 €/h», que es aceptable.
- Las dos cifras ya aparecen en las filas de vías. La duplicación es deliberada (Dani mira Tarifas y Marta Packs), pero queda abierta (§9 D7).

**Por qué recomiendo la disposición B (12 + 7 + 5):** los cinco packs caben en horizontal en 7/12 (unos 47rem a 1440) y se leen como una escalera. Con 5/12 (A) habría que pasar a lista vertical también en escritorio. Además, con la lista y el panel lado a lado, el ratón va de la fila al botón en horizontal sin cruzar otras filas, y el cambio de panel no desplaza nada por debajo. **A** conserva la composición de la v6 (menos desvío). Con las dos opciones, la escena debe caber en 1440×900 sin paradas intermedias. Si no cabe a 1280×720, el paginado añade una parada (mecánica v6).

---

## 4. Escena Lab/Blog `#lab-blog`

### 4.1 Contenido

| Celda | Contenido | Acción |
|---|---|---|
| **Demo del lab** (principal, ampliable, 6/12) | Marco de la demo (estático), nombre `{{DATO: nombre de la demo}}`, una frase `{{DATO}}`, chip «Lab» | «Probar la demo →» (`/lab/{{DATO: slug}}`) · ampliada: `{{DATO: resumen}}` + **[Ir al Lab]** → `/lab` |
| **Guía 1** (3/12) | Fecha `{{DATO}}`, título `{{DATO}}` (PostTeaser v6) | «Leer →» (`/blog/{{DATO: slug}}`) |
| **Guía 2** (3/12) | Igual | «Leer →» |

Titular: `{{DATO: titular Lab/Blog, tono 1}} {{DATO: tono 2}}`. La referencia v6 es «Lo que voy aprendiendo. Artículos sobre lo que construyo.», que habrá que ampliar a demos; lo hace `redactor`. Enlace de cabecera de escena (como «Ver todos» en Proyectos): «Todas las guías →» (`/blog`).

**Demo para el prototipo** (la elige Jose, §9 D8; candidatas de spec §0.7). Propongo **«Paginado por gesto»** (`lib/motion/paging.ts`): un marco con tres mini-escenas apiladas y un indicador de líneas. Enseña la mecánica de esta misma home y no duplica la selección deslizante que ya se ve en Servicios. Sin WebGL y sin glifos.

### 4.2 Wireframe · escritorio

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ {{DATO: titular Lab/Blog}}  {{DATO: tono 2}}                Todas las guías →  │
├──────────────────────────────────────────┬──────────────────┬──────────────────┤
│ [ic] Lab                         [⤢]     │ [ic] Guía        │ [ic] Guía        │
│ ┌──────────────────────────────────────┐ │ {{DATO: fecha}}  │ {{DATO: fecha}}  │
│ │  marco de la demo                    │ │ {{DATO: título}} │ {{DATO: título}} │
│ │  (estático; vivo con hover o foco)   │ │                  │                  │
│ └──────────────────────────────────────┘ │ Leer →           │ Leer →           │
│ {{DATO: nombre demo}}  (Lab)             │                  │                  │
│ {{DATO: una frase}}                      │                  │                  │
│ Probar la demo →                         │                  │                  │
└──────────────────────────────────────────┴──────────────────┴──────────────────┘
```

Móvil 360: una columna (demo → guía → guía). El marco reserva su proporción para no mover el layout.

### 4.3 Comportamiento de la demo en la celda

- **Reposo:** el estado estático (primer fotograma) es el póster. No hay JS de la demo en el chunk inicial.
- **Vive** con `:hover` (solo `(hover: hover) and (pointer: fine)`) o `:focus-within` de la celda (el foco llega al enlace «Probar la demo»). Se para al salir y vuelve al reposo con un fundido de 200 ms, sin saltos.
- **El marco no es una parada de Tab** ni un control: en la home es una vista previa (`aria-hidden`). La descripción va en el texto de la celda. La demo interactiva está en `/lab/[slug]`.
- **Táctil:** se queda estática (no hay hover). Hay otra opción en §9 D9.
- **Carga:** si la demo necesita JS, se importa en diferido la primera vez que hay hover o foco. Mientras carga se sigue viendo el póster, así que no hace falta esqueleto.

### 4.4 Variantes por contenido (spec §0.7, D33, D44)

| Hay | Escena | Cabecera, menú, ⌘K, pie | Indicador |
|---|---|---|---|
| ≥ 3 guías y ≥ 2 demos | Demo + dos guías (la de arriba). Etiqueta «Lab/Blog» | «Lab/Blog» → `/lab` (§9 D10) | 5 líneas |
| Solo blog | Disposición v6: «Último artículo» (6, ampliable) + dos guías (3 + 3). Etiqueta «Blog» | «Blog» → `/blog`; ⌘K sin «Lab» | 5 líneas |
| Solo lab | Demo (6) + dos DemoCard (3 + 3) con «Probar →». Etiqueta «Lab» | «Lab» → `/lab`; ⌘K sin «Blog» | 5 líneas |
| Ninguno | **La escena no se pinta** | Desaparece el enlace de la cabecera, el menú, el pie y los comandos de ⌘K | 4 líneas |

En el prototipo conviene un conmutador de desarrollo (`?lab=0&blog=0` o similar, fuera del diseño) para que Jose vea las cuatro variantes. Lo decide `ui`.

---

## 5. Recorridos que comprobará `usuario-ejemplo`

Se hacen sobre este wireframe en el paso 1 y sobre el prototipo en el paso 2. Cada uno tiene su criterio de PASA.

### R1 · Marta (móvil 360×640, táctil) · «¿ve los packs y el precio antes del segundo gesto?»
1. Entra en la home y ve el hero: el subtítulo `{{DATO}}` y dos salidas, [Ver proyectos] y «Cómo trabajo conmigo →».
2. **Camino A:** toca «Cómo trabajo conmigo →» (gesto 1) y aterriza en Servicios. Ve «Precios sin IVA.» y las filas con «Packs · desde 900 €» sin hacer scroll.
3. **Camino B:** hace scroll. El gesto 1 la lleva a Sobre mí y el gesto 2 a Servicios.
4. Toca «Pedidos o reservas · 1.400 €» en Packs → `/servicios?pack=P2#packs`. También puede bajar al cierre y tocar «Escribir por WhatsApp».
- **PASA si:** con el camino A ve al menos un precio «desde» de pack tras **un solo gesto**, y con el camino B lo ve al llegar con el segundo.
- **Fricción que hay que vigilar:** si «Cómo trabajo conmigo» no le dice «aquí están los precios», Marta no lo toca y en el camino B el precio llega en el segundo gesto. Es la pregunta clave para ella (ver §9 D2). También: ¿entiende «Proyecto cerrado» y «Por hora» sin jerga, o se pierde antes de llegar a «Packs»?

### R2 · Dani (escritorio 1440×900, puntero fino) · «¿llega a “por hora” y reservar?»
1. Lee el hero y pulsa «Servicios» en la cabecera (clic 1). El paginado desliza a la escena.
2. «Por hora · 40 €/h» ya está elegida y el panel muestra **[Reservar 20 min]** (clic 2, que abre Cal.com).
3. Otros caminos: ⌘K «40 €/h» o «reservar»; la celda Tarifas.
- **PASA si:** llega a Reservar en **≤ 2 clics y < 10 s** desde el hero, sin dudar de que la tarifa es por hora y sin IVA.
- **Fricción que hay que vigilar:** al pasar el ratón por las filas solo se mueve el resaltado. ¿Entiende que hay que hacer clic para ver otra vía, o espera que el hover cambie el panel?

### R3 · Nuria (agencia; escritorio 1440 y móvil 390) · «¿encuentra Partners en < 20 s?»
- **Escritorio** (no hay ☰ por encima de 1080 px):
  - Camino 1: Servicios. Con «Por hora» elegida, el panel ya enseña «¿Eres una agencia? Para agencias →».
  - Camino 2: pulsa Fin y llega al pie, donde está «Para agencias».
  - Camino 3: ⌘K y escribe «agencia», «partner», «subcontratar», «marca blanca» o «consultora».
- **Móvil:** ☰ → «Para agencias» (justo encima de Contacto).
- **PASA si:** llega a `/partners` en **< 20 s** en los dos anchos, sin ayuda.
- **Fricción que hay que vigilar:** en escritorio, «Partners» no está en la barra (D38). Si no ve el enlace del panel ni piensa en el pie, depende de ⌘K. Ver §9 D1.

### R4 · Pablo (reclutador; escritorio 1440) · «¿encuentra el CV?»
- Camino 1: Servicios → elige «Contratación · CV y entrevista» → «Descargar CV (PDF) →».
- Camino 2: Sobre mí → «Descargar CV» (enlace nuevo, §6.2).
- Camino 3: ⌘K «cv», «curriculum», «contratar» o «empleo».
- **PASA si:** descarga el CV en **< 20 s** y sin usar el chat.
- **Fricción que hay que vigilar:** «Contratación» es la cuarta fila y no está elegida por defecto. ¿Pablo la reconoce como suya? ¿O la busca en Sobre mí y, si se rechaza §6.2, no la encuentra?

**Formato de hallazgos** (los escribe `usuario-ejemplo` en §8): persona · paso · qué esperaba · qué pasó · gravedad (bloquea / frena / roza) · propuesta.

---

## 6. Cambios fuera de las dos escenas nuevas

### 6.1 Hero
- Subtítulo: `{{DATO: subtítulo de identidad única, una frase, sin audiencias (redactor con voz.md)}}`. Se quita el texto v6 «Para empresas: … Para tu negocio: …» (D36).
- CTAs en la misma fila: **[Ver proyectos]** (sólido, `#proyectos`) y «Cómo trabajo conmigo →» (enlace con flecha, `#servicios`, con el mismo deslizamiento que los enlaces internos).
- El resto queda igual: nombre, escena WebGL, póster, intro, sin badge ni eyebrow.

### 6.2 Sobre mí (desvíos mínimos de la v6)
- El párrafo v6 «Trabajo con empresas y con negocios locales, sin agencia de por medio.» **contradice D36**. Pasa a ser `{{DATO: entradilla Sobre mí con identidad única}}`.
- **Propuesta (desvío, D11):** añadir «Descargar CV →» junto a «Conóceme →» en la celda Sobre mí. La v6 tenía el CV en la celda «Hablamos» de Empresas, que desaparece. Sin esto, el CV solo está dentro de la cuarta vía y en ⌘K.

### 6.3 Cabecera
- Enlaces: **Sobre mí · Servicios · Proyectos · Lab/Blog** (la etiqueta del cuarto depende de §4.4). La sección a la vista se marca con `aria-current`, como en la v6 (`base.js` observa las anclas: cambian a `#servicios` y `#lab-blog`).
- Derecha igual que la v6: EN · ⌘K · Chat · Login.
- Sin «Partners» ni «Contacto» en la barra.

### 6.4 Menú ☰ (≤ 1080 px)
```
Sobre mí
Servicios
Proyectos
Lab/Blog
──────────────
Para agencias
Contacto        ← destacado (como v6)
──────────────
Español · English
```
- «Para agencias» es la etiqueta visible. El destino es `/partners` y lo de «Partners» queda para la palabra clave de ⌘K y para la URL (§9 D12).
- Mismo disclosure de la v6: `aria-expanded` y `aria-controls`, Esc devuelve el foco, se cierra al elegir un enlace o al tocar fuera.

### 6.5 Paleta ⌘K (sustituye `CMDS` de `base.js`)

| Grupo | Etiqueta | Pista | Destino (producción · prototipo) | Palabras clave (sin tildes) |
|---|---|---|---|---|
| Ir a | Sobre mí | — | `#sobre-mi` | sobre mi jose quien persona |
| Ir a | Servicios | — | `/servicios` · `#servicios` | servicios vias trabajar contratar freelance como trabajas |
| Ir a | Proyectos | — | `#proyectos` | proyectos apps webs portfolio casos |
| Ir a | Lab | — | `/lab` · `#lab-blog` | lab demos laboratorio experimentos herramientas |
| Ir a | Blog | — | `/blog` · `#lab-blog` | blog guias articulos |
| Ir a | Para agencias | — | `/partners` | agencia agencias partners partner consultora subcontratar marca blanca colaborar |
| Acciones | Packs | desde 900 € | `/servicios#packs` · `#servicios` | packs precio web tienda restaurante clinica app movil cuanto cuesta |
| Acciones | Trabajo por horas | 40 €/h | `/servicios#por-hora` · `#servicios` | hora horas tarifa precio refuerzo equipo consultoria auditoria |
| Acciones | Pedir propuesta | — | `/propuesta` | propuesta presupuesto generador ia feature proyecto cerrado |
| Acciones | Descargar CV | PDF | CV del idioma activo | cv curriculum resume contratar empleo trabajo reclutador |
| Acciones | Reservar 20 min | — | Cal.com | llamada reunion cita calendario entrevista |
| Acciones | Escribir por WhatsApp | — | `wa.me` | whatsapp hablar mensaje |
| Acciones | Contacto | — | `/contacto` | contacto email correo hablamos |
| Acciones | Abrir el chat | — | `/chat` | chat asistente ia preguntar |
| Acciones | Login | — | `/auth/…` | login entrar cuenta area clientes |

- Las pistas «desde 900 €» y «40 €/h» salen de `pricing.json`.
- El plan pide los comandos «Servicios», «Packs desde 900 €», «40 €/h», «Para agencias», «Descargar CV» y «Lab». Aquí están con etiqueta y pista separadas, como hace la v6, para que el precio vaya a la derecha. «Lab» y «Blog» desaparecen según §4.4.
- Estado vacío: «Nada con «x». Prueba con «precio», «cv» o «agencia».» (texto v6 ampliado).
- Sin animación (igual que la v6).

### 6.6 Indicador de sección
Cinco líneas: Sobre mí · Servicios · Proyectos · Lab/Blog · Contacto (4 si no hay Lab/Blog). Los nombres accesibles cambian en `v6.js` (`names`).

### 6.7 Pie
Sobre mí · Servicios · Proyectos · Lab · Blog · Para agencias · Área de clientes · Legal, con fecha de revisión. Lab y Blog siguen §4.4.

### 6.8 Cierre «¿Empezamos?»
Igual que la v6: «Escribir por WhatsApp» (sólido), «Reservar 20 min» (fantasma) y la pista ⌘K.

---

## 7. Estados

| Estado | Servicios | Lab/Blog | Resto |
|---|---|---|---|
| **Reduced motion** | El resaltado, la barra de packs y el pulgar del selector saltan sin deslizarse. El panel y la cifra cambian sin desenfoque. Sin entradas ligadas al scroll ni paginado (como la v6). | La demo **no se anima nunca**: se queda en su estado final o póster, también con hover o foco. | Póster en el hero, sin intro ni carrusel fijado; el indicador solo funde (v6). |
| **Móvil 360** | Una columna. Las filas de vía llevan nombre y cifra siempre visibles, con alto ≥ 2.75rem. El panel va bajo la lista y el botón ocupa el ancho de la celda. Packs en lista vertical. Scroll nativo con `proximity`. | Una columna. La demo se queda estática con toque. | Cabecera con ☰. Buscador y chat solo con icono. A ≤ 22.5rem, Login solo con icono. |
| **Sin JS** | **Funciona entera**: radios con `:has()` cambian el panel, los packs son enlaces y P2 sale resaltado por el marcado. El resaltado deslizante no se mueve (sale fijo en la vía marcada). Tarifas funciona si va con radios; si va con tabs, solo se ve «40 €/h». | Póster estático; «Probar la demo →» y «Leer →» funcionan. | La paleta no se abre, así que el botón ⌘K y la pista del cierre se ocultan sin la clase `.js`. **☰ sin JS se convierte en un enlace al pie** (`#pie`), que tiene todas las secciones, porque el disclosure necesita JS. Las celdas no se amplían: el enlace de cada celda lleva a su página. |
| **Celda ampliada** | El bloque «más» lleva [Ir a Servicios] (sólido) con el ancla de la vía elegida. El botón del panel pasa a fantasma. | [Ir al Lab] (sólido). | Indicador oculto y cabecera inerte (v6). |
| **Datos pendientes** | Cada `{{DATO}}` se ve como `.todo`. Si falta la URL de Cal.com, de WhatsApp o el CV, el enlace sale con el marcador. **En producción nunca hay un enlace a `#`**: si falta el CV, «Descargar CV» se oculta y queda «Preguntar al asistente» (decisión de construcción, no de prototipo). | Ver §4.4. | En inglés, los nombres de pack se ven como `{{DATO}}` mientras `pricing.json` no los tenga. |
| **Error / carga** | No aplica: todo es estático y se resuelve en build. | El JS diferido de la demo falla → se queda el póster, sin mensaje (es decoración). | — |
| **Sin permisos** | No aplica (público). | — | — |

**Accesibilidad que no se puede perder** (contrato v6 más lo nuevo):
- Grupo de radios con `legend`, con la cifra dentro del `label`.
- Packs como enlaces con el precio y «sin IVA» en el nombre accesible.
- Cifra de Tarifas con `aria-live="polite"`.
- Objetivos ≥ 2.75rem y foco visible v6.
- Ningún cambio de contexto al enfocar: elegir una vía cambia contenido, no página.
- Marco de demo con `aria-hidden` y descripción en texto.
- Un solo `h1`; cada escena con `h2` a dos tonos y celdas con `h3`.

---

## 8. Hallazgos de `usuario-ejemplo`

_Primera pasada de `usuario-ejemplo` (2026-10-28), recorriendo los wireframes de §3, §4 y §6 como cada persona. Es una lectura de documento, no de prototipo: todavía no hay pantalla, así que los textos `{{DATO}}` (la frase de cada vía, el subtítulo del hero) no se pueden juzgar y son justo lo que más pesará para Marta. «Lo incorporado y lo descartado» lo rellena el controlador._

### Marta · móvil 360 · R1 → **NO PASA** (camino A); el camino B llega, pero tarde

**Qué quería:** saber qué me harían para mi peluquería y desde cuánto, y poder hablar sin compromiso.

- **Abandono probable en el camino A. El segundo CTA del hero no me dice «precios».** Veo un botón sólido, «Ver proyectos», y debajo un enlace pequeño, «Cómo trabajo conmigo →». Pienso: «¿cómo trabaja? ¿su método? eso no me urge». Toco el botón grande, que me lleva a proyectos de otros, y ahí no hay ningún precio. Esperaba un enlace que dijera qué hago y cuánto cuesta. El criterio de PASA («un solo gesto») solo se cumple si toco justo el enlace que menos se parece a lo que busco.
- **Camino B: llego en el segundo gesto, pero por Sobre mí.** Veo primero una escena de él hablando de sí mismo. Aguanto una pantalla, y si en ese momento no veo nada mío me empiezo a ir. Llego a Servicios, pero no sé que ahí están los precios hasta que los veo.
- **Confusión (más de 5 s): el vocabulario de las filas.**
  - «Proyecto cerrado» no me suena. No sé si «cerrado» es que ya está cerrado o que el precio es cerrado.
  - «Packs» lo entiendo a medias. Los nombres «Gestión» y «Gestión y automatizaciones» no me dicen nada: yo tengo una peluquería, no «gestión».
  - «Contratación · CV y entrevista»: yo estoy contratando, así que pienso que es mi fila y no entiendo por qué habla de un CV.
- **Confusión: lo primero que veo es una vía que no es la mía.** Por defecto sale «Por hora» y un botón «Reservar 20 min». «¿Reservar 20 minutos para qué? ¿Cobra la llamada?». Las filas con precio se ven, pero la pantalla se parece a una tarifa de consultor.
- **Molestia: demasiadas salidas por vía.** Un botón y dos enlaces con flecha por panel, más una celda de Packs con cinco enlaces, y otra de Tarifas. No sé cuál es «el mío». Marta decide con un precio y una frase, no con cuatro caminos.
- **Molestia: Tarifas al final del móvil.** Es una celda sin acción. Para mí es ruido tras haber visto ya los precios.
- **Lo bueno para mí:** «Precios sin IVA.» arriba, el precio dentro de la fila (no escondido) y el botón de WhatsApp. Que cada pack sea un enlace con su cifra me gusta. Tocar «Pedidos o reservas · 1.400 €» y llegar a un sitio que me explica qué incluye antes de pedir me da seguridad (D5 bien).

**Qué cambiaría:** que el segundo CTA del hero diga con mis palabras que ahí están qué hago y cuánto cuesta, y que no parezca de segunda al lado del botón sólido. Que las filas se entiendan sin jerga (que «proyecto cerrado» diga «precio fijo» o equivalente) y que la fila de empleo no se llame como lo que yo hago al contratar.

### Dani · escritorio 1440 · R2 → **PASA**

**Qué quería:** reservar 20 min para un refuerzo por horas.

- Clic en «Servicios» de la cabecera, «Por hora · 40 €/h» ya marcada, botón «Reservar 20 min» a la derecha de la fila. Dos clics y menos de 10 s. «Precios sin IVA.» está antes de la cifra. Sin dudas.
- **Molestia (hover):** paso el ratón por «Proyecto cerrado» y se mueve el resaltado, pero el panel sigue en «Por hora». Veo dos filas con aspecto de activas y pienso «¿se ha roto?». Termino haciendo clic, así que lo resuelvo, pero tarda un segundo en quedar claro que el hover solo previsualiza. Es la fricción que el documento ya vigilaba y es real, aunque leve.
- **Molestia:** «desde 150 €» para una funcionalidad me parece poco creíble sin saber qué incluye. Pienso «¿150 € de qué?». Lo cubre el texto de la celda Tarifas («una funcionalidad cerrada, con precio y plazo»), pero está en otra celda.
- **Molestia:** el precio por hora sale dos veces (fila y Tarifas). No me estorba, pero tampoco aporta.
- **Lo bueno:** el panel cambia sin desplazar nada; Cal.com como acción primaria sólida; ⌘K con «40 €/h» como pista.

**Qué cambiaría:** que el hover no deje dos filas «encendidas» a la vez, o que se vea claramente cuál es la elegida (por ejemplo, la elegida con marca propia siempre visible).

### Nuria · escritorio 1440 y móvil 390 · R3 → **PASA**, pero por un hilo

**Qué quería:** subcontratar React Native a alguien; busco «la puerta de agencias».

- **Escritorio.** En la barra veo Sobre mí · Servicios · Proyectos · Lab/Blog. Ninguna dice «agencias». Pienso «subcontratar suena a servicio» y pulso Servicios. Con «Por hora» marcada, debajo del botón encuentro «¿Eres una agencia? Para agencias →». Llego en unos 15 s. Si hubiese tocado «Packs» antes, el enlace habría desaparecido y me habría quedado sin pista.
- **Móvil.** ☰ → «Para agencias», justo encima de «Contacto». Sin dudar. Bien.
- **Confusión:** el enlace es la tercera línea pequeña del panel, con el mismo peso que «Preguntar al asistente». Si no leo hasta el final, no lo veo. Y el hero (identidad única, sin audiencias) no me dice que aquí hay algo para agencias, así que en la primera pantalla no sé si estoy en el sitio correcto.
- **Molestia:** si me pongo a buscar, ⌘K no me sirve: no sé que existe, y en un portátil con Windows el símbolo ⌘ ni lo reconozco. El pie lo veo, pero tardo en pensar en bajar hasta ahí.
- **Lo bueno:** que la etiqueta sea «Para agencias» y no una palabra interna, y que las palabras clave de ⌘K recojan «subcontratar», «marca blanca» y «consultora».

**Qué cambiaría:** que la puerta de agencias se vea desde la escena de Servicios sea cual sea la vía elegida, no solo con «Por hora».

### Pablo · escritorio 1440 · R4 → **PASA**

**Qué quería:** descargar el CV rápido.

- **Camino 1.** Pulso Servicios y veo cuatro filas. «Contratación · CV y entrevista» la reconozco porque pone «CV». Tras elegirla, el botón sólido es «Reservar 20 min» y el CV es un enlace con flecha debajo. Lo encuentro, pero esperaba que el CV fuera el botón principal de esa vía: es lo que vengo a buscar. Menos de 20 s.
- **Camino 2.** Mi primer reflejo es abrir «Sobre mí» y buscar ahí «Descargar CV», que es donde propone ponerlo D11. Me parece correcto y más corto que el camino 1. Sin D11 dependería de la cuarta fila o de ⌘K.
- **Confusión:** «Contratación» como palabra suelta dice poco; me fío del «CV y entrevista» para entender que es la mía. Sin esa cifra/etiqueta (opción «sin cifra» de D13) la fila no me diría nada.
- **Molestia:** el hero y la cabecera no tienen ningún «CV» visible; hay que llegar a una escena.
- **Lo bueno:** que no haya salario ni disponibilidad inventados; el chat con caso `recruiter` como alternativa; que la vía no me pida cuenta.

**Qué cambiaría:** en la vía de empleo, el CV debería ser la acción principal y reservar la secundaria.

### Opinión sobre las decisiones abiertas

- **D1 (Para agencias en escritorio):** de acuerdo con (b), pero con una condición: que el enlace esté siempre visible en la escena, no colgado de «Por hora». Como Nuria, depender de que haya una vía concreta elegida me parece frágil. (a) solo con pie y ⌘K me habría dejado fuera; (c) no lo necesito.
- **D2 (segundo CTA del hero):** como Marta, **no me dice que ahí están los precios**. Pasa de «Mantener y que lo valide R1» a «cambiar»: R1 ya lo marca como «frena». Además de la etiqueta, pesa la jerarquía: lo que busco está en un enlace pequeño al lado de un botón sólido que lleva a otro lado.
- **D3 (vía por defecto):** «Por hora» me sirve como Dani y como Nuria. Como Marta me confunde un poco, pero lo que me salva es que el precio del pack está en la lista visible. Mantener «Por hora»; «ninguna» dejaría un panel vacío, que es peor.
- **D4 (P5 menos que P4):** sí, filete o hueco. Sin él, «App móvil 4.000 €» tras «Gestión y automatizaciones 4.200 €» me hace pensar que la app sale más barata que cambiar mi web, o que hay un error. Ayudaría que el hueco deje claro que son dos cosas distintas (web / app).
- **D7 (cifras repetidas):** mantener las dos. Lo que yo (Marta y Dani) leemos son las cifras de las filas; la celda Tarifas es la que sobra si hay que recortar, sobre todo en móvil donde queda al final sin acción.
- **D13 (cuarta fila):** «CV y entrevista» me vale como Pablo y es lo que salva la fila. «Sin cifra» la empeora. El problema de fondo no es la cifra sino el nombre «Contratación», que Marta y Dani leen como «yo contrato» (ver Marta).

### Los tres cambios más importantes

1. **El segundo CTA del hero debe prometer lo que hay detrás (precios y qué hago) y no quedar de segunda tras «Ver proyectos».** Sin eso, Marta no llega al gesto único de R1.
2. **La fila «Contratación» (y «Proyecto cerrado», «Packs», «Gestión») necesita nombres que se entiendan sin jerga y sin chocar con «yo contrato».**
3. **«Para agencias» visible en Servicios con cualquier vía elegida**, y el CV como acción principal en la vía de empleo.

---

## 9. Decisiones abiertas para Jose (y para `ui`)

| # | Decisión | Opciones | Recomendación `ux` |
|---|---|---|---|
| **D1** | **Dónde ve Nuria «Para agencias» en escritorio**, donde no hay ☰ | (a) solo pie y ⌘K (literal D38); (b) además, enlace en el panel «Por hora» (este documento); (c) ☰ visible también en escritorio como menú «más» | **(b)**. Mantiene D38 (nada en la barra) y la deja a un clic de Servicios. |
| **D2** | ¿El segundo CTA del hero, «Cómo trabajo conmigo →», le dice a Marta que ahí están los precios? | Mantener (spec §0.8) o probar otra etiqueta | Mantener y que lo valide R1. Si `usuario-ejemplo` marca «frena», se propone otra etiqueta a Jose (no la invento). |
| **D3** | Vía elegida por defecto | Por hora (este documento) · Packs · ninguna | **Por hora**: es la primera fila y deja visible «Para agencias». Las cifras de las cuatro filas ya resuelven a Marta. |
| **D4** | P5 cuesta menos que P4: ¿separar web y app en la tira? | Tira continua P1–P5 · filete o hueco entre P4 y P5 · P5 primero | Filete o hueco entre P4 y P5. |
| **D5** | Destino de cada pack | `/servicios?pack=Px#packs` (comparador) · `/propuesta?pack=Px` (generador) | **Comparador**: Marta lee antes de pedir. **Añade `?pack=` a P20** (aviso al `arquitecto`). |
| **D6** | Semántica de Tarifas | `tablist` (v6) · radios (como las vías) | Radios: coherencia y funciona sin JS. |
| **D7** | Las cifras 40 €/h y desde 150 € salen en las filas y en Tarifas | Mantener las dos · quitar la cifra de las filas · quitar la celda Tarifas | Mantener las dos (Tarifas la pide el plan). Lo decide Jose al verlo. |
| **D8** | Qué demo del lab va en la celda | Paginado por gesto · selección deslizante · tokens en vivo · contraste · generador en modo demo | **Paginado por gesto**: no repite el gesto de Servicios y enseña la home. |
| **D9** | Demo en táctil | Estática siempre · se anima una vez al entrar en vista | Estática (regla «estática hasta el hover»). |
| **D10** | Destino de «Lab/Blog» en la cabecera cuando existen los dos | `/lab` · `/blog` · ancla `#lab-blog` en la home | Ancla `#lab-blog` en la home y `/lab` en las páginas interiores. **Aviso:** spec §0.8 y PANT P22 dicen «→ `/lab` o `/blog` según exista», sin decidir cuál cuando hay los dos. |
| **D11** | «Descargar CV» en la celda Sobre mí (desvío de la v6) | Sí · no | **Sí**. Pablo asocia el CV con Sobre mí. |
| **D12** | Etiqueta visible de `/partners` | «Para agencias» · «Partners» · «Agencias y consultoras» | «Para agencias» (es la del pie en PANT P21). |
| **D13** | Etiqueta de la cuarta fila | «CV y entrevista» · sin cifra · `{{DATO}}` | «CV y entrevista» o sin cifra; sin salario (D47). |
| **D14** | Disposición del bento de Servicios | B 12 + 7 + 5 · A 7 alta + 5 + 5 (v6) | **B** (§3.6). Lo cierra `ui` en el navegador. |

**Textos `{{DATO}}` que hacen falta para el prototipo** (`redactor` con `voz.md`; Jose valida):
- subtítulo del hero
- titular de Servicios (dos tonos)
- frase de cada una de las cuatro vías
- resumen de la celda ampliada de vías
- entradilla de Sobre mí
- titular de Lab/Blog (dos tonos)
- nombre, frase y slug de la demo
- dos guías (fecha, título, slug)
- URL de Cal.com y de WhatsApp
- CV es/en

Todos se muestran tal cual en el prototipo hasta que existan.

**Pendientes para otras tareas** (no los decide `ux`):
- `pricing.json`: P5 como código `P5` y `APP_PLUS` como opción (D37).
- `PRODUCT.md`: actualizar al modelo de cuatro personas.
- P20: aceptar `?pack=` si se acepta D5.


---

## 10. Prototipo v7 (paso 2, `ui`)

> **Revisión de Jose (§16) manda** sobre §10–§15 donde choquen: la navegación lleva a pantallas propias, la cabecera tiene Lab y Blog por separado, el ⤢ sale por defecto y el segundo tono de los titulares usa el color de destaque.

**Ver:** `python3 -m http.server 8768 --directory docs/superpowers/design/ref` → **http://localhost:8768/home-v7/** (añade `?nointro` para saltar la intro de caída).
**Conmutador de desarrollo (fuera del diseño)** para las variantes de §4.4: `?blog=0` (solo lab), `?lab=0` (solo blog), `?lab=0&blog=0` (sin escena: desaparece de cabecera, menú, pie, ⌘K e indicador).
**Capturas** (registro del paso 4, escena entera sin las entradas ligadas al scroll): `capturas/servicios-{360,900,1440}.png`, `capturas/lab-blog-{360,900,1440}.png`.

Método: `/impeccable` (context, craft-floor, `audit` y `critique` con dos evaluadores aislados), `taste-skill` no hizo falta (el mundo visual está fijado), movimiento según `animate` de Emil (decisiones en §10.4).

### 10.1 Qué cambia respecto a la v6

| Zona | v6 | v7 |
|---|---|---|
| Hero | Subtítulo con las dos audiencias; [Ver proyectos] sólido + «Una web para mi negocio →» | Subtítulo `{{DATO}}` de identidad única. **[Servicios y precios]** sólido (→ `#servicios`) + **[Ver proyectos]** fantasma, misma talla (propuesta P1, §12) |
| Cabecera | Sobre mí · Empresas · Negocios · Proyectos · Blog | **Sobre mí · Servicios · Proyectos · Lab/Blog** (la etiqueta del cuarto sigue §4.4) |
| Menú ☰ | 5 secciones + Contacto + idioma | 4 secciones, filete, **Para agencias**, Contacto (destacado), idioma |
| Sobre mí | Entradilla con «empresas y negocios locales» | Entradilla `{{DATO}}`; **«Conóceme →» + «Descargar CV ↓»** (D11) |
| Empresas + Negocios | Dos escenas | **Una escena Servicios** (B 12 + 7 + 5): «Cómo trabajar conmigo» (vías, radios), **Packs** (cinco, web \| app), **Tarifas** (radios) y «¿Eres una agencia? Para agencias →» en la cabecera de la escena |
| Blog | Último artículo + 2 artículos | **Lab/Blog**: demo del lab (6, ampliable) + 2 guías; con variantes por contenido |
| ⌘K | 10 comandos | 15 comandos de §6.5 (Lab/Blog según contenido); placeholder y vacío nuevos |
| Indicador | 6 líneas | 5 (4 sin Lab/Blog) |
| Pie | Secciones v6 | Sobre mí · Servicios · Proyectos · Lab · Blog · Para agencias · Área de clientes · Legal; `id="pie"`; rev. 28 oct 2026 |
| Sin JS | ☰ y ⌘K muertos; hero vacío | ☰ es un enlace a `#pie`; ⌘K, pista del cierre y ⤢ se ocultan; el hero enseña el póster; vías y tarifas funcionan con `:has()` |
| Código muerto | `.plist`, `.ask`, `.checks`, `tablist` de tarifas | Fuera de `v7.css` y `v7.js` (las reglas compartidas de `base.css` no se tocan) |

### 10.2 Escena Servicios, tal como está

- **Vías** (celda principal, `fieldset` con cuatro `input type="radio" name="via"`; la `legend` es `.sr`). Fila = icono + nombre + cifra, cifra siempre visible (bajo 26rem de celda baja bajo el nombre). Por defecto **Por horas** (D3). El panel cambia con `:has()` sin JS; los cuatro paneles ocupan la misma celda de rejilla, así que el alto es el del más alto y **no hay salto de layout**.
- **Elegida vs hover (hallazgo 5):** la elegida lleva tinte `tint-selected` + filete `edge-selected` + icono violeta sólido + cifra en lavanda; con JS ese fondo lo pinta el resaltado que se desliza. El **hover solo tiñe la fila con `tint-preview` (6 %, sin filete ni icono sólido)** y no mueve el resaltado. Ya no hay dos filas «encendidas».
- **Para agencias (hallazgo 3):** en la cabecera de la escena, a la derecha del titular, con cualquier vía elegida (`.scene__aside`). También en ☰, ⌘K y pie.
- **Vía de empleo (hallazgo 4):** acción primaria **[Descargar CV (PDF)]**; «Reservar 20 min →» y «Preguntar al asistente →» secundarias.
- **Packs (D4):** P1–P4 en un grupo y P5 en otro, separados por **hueco de 1.5rem y filete `line-2`** (en fila, filete vertical; en lista, horizontal). Cada pack es un enlace (`data-dest="/servicios?pack=Px#packs"`, D5) con nombre accesible «Nombre, desde X € sin IVA. Ver qué incluye» (texto `.sr`, no `aria-label`, para cumplir 2.5.3). La barra se desliza al señalado y **vuelve a P2 al salir** (en lista no hay barra). En fila desde 36rem de celda; por debajo, lista vertical.
- **Tarifas (D6):** radios con pulgar deslizante (`:has()`, funciona sin JS). Pestañas «Por horas · Encargo». «Sin IVA.» junto al título de la celda, antes de la cifra; enlace que sigue a la pestaña.
- «Precios sin IVA.», «Desde, sin IVA.» y «Sin IVA.» van **junto al título de cada celda** (`.cell__note`), antes de cualquier cifra, sin gastar una fila (así la escena cabe en 1440×900 con titular a dos líneas).
- **Celda ampliada:** bloque «más» con `{{DATO: resumen}}` y [Ir a Servicios], cuyo destino sigue a la vía elegida (`#vias-go`); el botón del panel baja a fantasma (una sola sólida por vista).
- **Móvil:** el panel va bajo la lista; si al tocar una vía el panel queda fuera de la pantalla, la página sube lo justo para verlo sin esconder la fila elegida (solo con puntero no fino; el snap de proximidad se suspende hasta el siguiente gesto). Comprobado con un toque real a 360×640.

### 10.3 Escena Lab/Blog, tal como está

- **Demo D8 «paginado por gesto»** en miniatura (`.demo`, `aria-hidden`): tres mini-escenas (titular a dos tonos + bento 7/5/5, 12/7/5, 6/3/3) y su indicador de líneas. CSS puro: `animation-play-state: paused` en reposo (el póster es el primer fotograma) y `running` con `:hover` (solo puntero fino) o `:focus-within` (foco en «Probar la demo»). En táctil queda quieta (D9). Con reduced motion no se anima nunca.
- Nombre, frase y slug de la demo, fechas y títulos de guía: `{{DATO}}`. «Todas las guías →» en la cabecera de la escena (`/blog`); en la variante solo lab, «Todas las demos →».
- Variantes de §4.4 implementadas con `data-need` / `data-only` + el conmutador `?lab=` / `?blog=`.

### 10.4 Movimiento (gate de `animate`)

| Pieza | Frecuencia y propósito | Ingredientes |
|---|---|---|
| Resaltado de vía | Decenas al día · indicación de estado | transición de `transform`, 240 ms, `--ease-slide`; sin deslizamiento en la primera colocación; salta con reduced motion |
| Cambio de panel | Decenas al día · evitar un cambio brusco | `opacity` + `filter: blur(4px)` + `translateY(6px)` → nada, 260 ms `--ease-out`; el saliente desaparece al instante (sin cruce); reduced motion: solo opacidad 150 ms |
| Hover de vía | Decenas al día · vista previa | color de fondo 150 ms `ease`; solo `(hover: hover) and (pointer: fine)` |
| Pulgar de Tarifas, barra de Packs | Igual que la v6 | sin cambios |
| Demo del Lab | Ocasional · explicación | `@keyframes` (es movimiento predeterminado, corre fuera del hilo principal), 7 s en bucle, `--ease-slide` en cada paso; se pausa donde esté al salir |
| Subida del panel en móvil | Ocasional · continuidad espacial | `scrollBy` suave, instantáneo con reduced motion |

Para comprobar a ojo: el cruce del panel a 2–5× en el inspector de animaciones, y el bucle de la demo (el regreso de la escena 3 a la 1 es el único salto largo).

## 11. Tokens nuevos (`.impeccable/design.json`, anotados también en `DESIGN.md`)

| Token | Valor | Uso |
|---|---|---|
| `tint-preview` (alphas) | `rgb(157 140 255 / 0.06)` | Hover de una fila elegible: vista previa, no selección |
| `demo-loop` (durations) | `7s` | Ciclo de la demo en miniatura del Lab |
| `packs-row` (containers) | `36rem` | Cinco packs en fila; por debajo, lista |
| `vias-split` (containers) | `40rem` | Lista de vías y panel lado a lado |
| `cell-narrow` (containers) | `30rem` | Celda estrecha: la nota del título baja a su línea y el botón del panel ocupa todo el ancho |
| `gap-split` (spacing) | `clamp(1.5rem, 4cqi, 3rem)` | Hueco y sangría entre la lista de vías y su panel |

Se reutilizan tokens existentes: `list-meta` (26rem, la cifra de la vía baja bajo el nombre; se amplió su `purpose`) y `gap-cell` para el hueco de `.vias`.

**Emitidos:** `pnpm tokens:build` regenera `apps/web/styles/{tokens.css,breakpoints.ts,tokens.ts}` (257 custom properties) y `packages/design-tokens/required-tokens.json` recoge los seis nombres nuevos; `pnpm --filter @josecoded/design-tokens test` pasa (23/23). `overview` de `design.json` y de `DESIGN.md` ya describen las escenas de la v7. El contenedor `packs-dividers` (40rem) deja de usarse en la home v7.

**Literales que quedan en la sección v7 de `v7.css`** (como en la v6, el prototipo escribe valores literales y cada regla nueva lleva comentado el token al que corresponde; el port los cambia por `var(--token)`): todos tienen token salvo el interior de la miniatura `.demo` (proporciones del dibujo: `aspect-ratio` 16/9 y 2.2, rellenos en %, ancho del titular 46 %, opacidad 0.55, `steps` de los keyframes), que es ilustración `aria-hidden` y se portará como un componente de la demo del lab con sus propias variables locales.

## 12. Propuestas para Jose (hallazgos 1 y 2 de `usuario-ejemplo`)

**Segundo CTA del hero (hallazgo 1).** En el prototipo: **[Servicios y precios]** sólido, primero, y **[Ver proyectos]** fantasma, mismo alto. Alternativas:

| Opción | Etiqueta | Jerarquía |
|---|---|---|
| **A (en el prototipo)** | «Servicios y precios» | sólido + fantasma «Ver proyectos» |
| B | «Servicios y precios» | «Ver proyectos» sólido + este fantasma (los dos botones, mismo alto) |
| C | «Qué hago y cuánto cuesta» | como A |
| D | «Precios y formas de trabajar» | como A |

**Nombres de las vías (hallazgo 2).**

| Vía (spec §0.2) | En el prototipo | Alternativas |
|---|---|---|
| Por hora | **Por horas** · 40 €/h | «Por horas, en tu equipo» |
| Proyecto cerrado | **Encargo a precio fijo** · desde 150 € | «Una funcionalidad a precio fijo» · «Precio cerrado por encargo» · «Encargo cerrado» |
| Packs | **Packs de web y app** · desde 900 € | «Web o app con precio cerrado» · «Packs» |
| Abierto a contratación | **Abierto a empleo** · CV y entrevista | «Ficharme para tu plantilla» · «Incorporarme a tu equipo» · «Busco puesto» |

**Nombres de pack.** El prototipo usa los de `pricing.json` y la spec; los nuevos quedan solo como propuesta (cambiarían `pricing.json` en la tarea de D37):

| Pack | `pricing.json` | En el prototipo | Propuesta (no aplicada) |
|---|---|---|---|
| P2 | Pedidos / reservas | **Pedidos o reservas** (v6) | — |
| P3 | Gestión | **Gestión** | «Web con panel» · «Panel de gestión» · «Web con gestión interna» |
| P4 | Gestión + automatizaciones | **Gestión + automatizaciones** | «Panel y automatizaciones» · «Panel con avisos automáticos» · «Gestión automatizada» |
| P5 | App MVP (en `apps[]`) | **App móvil** (spec §0.2) | — |

Título de la celda de vías: «Cómo trabajamos» (wireframe) pasa a **«Cómo trabajar conmigo»** porque el plural chocaba con «Una persona, no una agencia» (crítica A). Alternativa: «Formas de trabajar conmigo».

## 13. Desvíos

**Respecto al wireframe (`ux`) o la spec, por los hallazgos de `usuario-ejemplo` (mandan):**
1. Hero: el CTA de servicios es el sólido y «Ver proyectos» pasa a fantasma (wireframe y spec §0.8: [Ver proyectos] sólido + «Cómo trabajo conmigo →» enlace). Hallazgo 1.
2. Nombres de vía nuevos (§12). Hallazgo 2. Los de pack siguen siendo los de `pricing.json`.
3. «Para agencias» en la cabecera de la escena, no en el panel de «Por hora» (§3.4, D1 b). Hallazgo 3.
4. Vía de empleo: acción primaria **Descargar CV** (spec §0.2 y wireframe: Reservar 20 min). Hallazgo 4.
5. Hover de vía: tinte propio, sin mover el resaltado (wireframe §3.5: el hover movía el resaltado como vista previa). Hallazgo 5.

**Respecto al wireframe, decisión de `ui` (las decide Jose en el navegador):**
6. «Precios sin IVA.» y «Desde, sin IVA.» junto al título de la celda, no en una fila propia.
7. El panel de la vía Packs pierde «Comparar los cinco packs →»: la celda Packs está debajo y la crítica (A) y Marta pedían menos salidas por panel.
8. Pestaña de Tarifas «Por feature» → **«Encargo»**, y su enlace «Proyecto cerrado →» → «Encargo a precio fijo →» (un solo nombre por concepto).
9. La demo del Lab **se pausa donde está** al quitar el hover, en vez de volver al reposo con fundido (§4.3): volver exigiría JS o un salto; pausada no salta.
10. Chip «Lab» junto al nombre de la demo: no se pone (DESIGN.md reserva las pastillas a la marquesina); el título de la celda ya dice «Lab».
11. Placeholder de ⌘K «Busca «precio», «cv»…» (cabe a 360) y pie de la paleta oculto con puntero táctil.
12. Sin JS: ☰ → enlace a `#pie`; hero con póster; ⤢ oculto.

**Respecto a la v6 (para el port):** cabecera, menú, pie, ⌘K, indicador, hero, Sobre mí (entradilla y CV) y las dos escenas nuevas. `scene.js` sin cambios. `base.css` sin cambios (todo lo nuevo está al final de `v7.css`). Destinos reales en `data-dest` (el prototipo deja `href="#"` para no romper el servidor estático).

## 14. Revisión (`/impeccable audit` y `/impeccable critique`)

**Audit (técnico), 16/20 · Bueno.** A11y 3 · Rendimiento 3 · Responsive 4 · Theming 3 · Integridad 3.
- Sin scroll horizontal de 360 a 1920; la escena Servicios mide 900 px a 1440×900 (cabe sin paradas) y 1.535 px a 360×640 (unas 2,4 pantallas); objetivos táctiles ≥ 44 px en `.via` (61), `.pack` (49), `.seg label` (44, con puntero táctil), `.go` (44, con puntero táctil) y botones (48). Contrastes de lo nuevo entre 4,89:1 (`text-3` en el peor punto del degradado) y 16,95:1.
- Detector: 6 avisos en el fichero y 32 en la URL, casi todos heredados de la v6 o falsos positivos verificados (entradas ligadas al scroll medidas fuera de pantalla, alfas del ⌘K, `.todo` sobre el subrayado). Nuevo y real: «desde / sin IVA» repetido en los cinco packs (es texto `.sr` del nombre accesible, se mantiene a propósito).
- Heredado y sin tocar: `.cell__open` de 2.25rem (36 px, cumple 2.5.8 AA pero no la regla de 44 px del proyecto); `width` en la transición de `.packs__bar`; Lucide depende de JS (sin JS no hay iconos; en el port van como SVG en línea).

**Critique (dos evaluadores aislados), 24/36 · heurística 9 n/a.** Especificidad: la estructura es propia (vías con precio en la fila, demo que enseña la mecánica de la propia home, puerta de agencias); la piel es la de la v6, ya aprobada. Arreglado en este paso a partir de la crítica y del `revisor` (paso 3, cambios del 2026-10-28: tokens emitidos, literales a tokens, nombres de pack de `pricing.json`, `PRODUCT.md` con las métricas de §0.11, reduced motion en el resaltado, clase `js` en línea en `<head>`, «Sin IVA.» antes de la cifra de Tarifas, alto real de la cabecera en la subida del panel): respuesta visible al elegir vía en móvil, «Comparar los cinco packs» fuera del panel, «Por feature» → «Encargo», «Cómo trabajamos» → «Cómo trabajar conmigo», marco de la demo a todo el ancho de la celda, placeholder de ⌘K a 360. **Abierto (decide Jose):** ver §15, puntos 7–11.

## 15. Decisiones pendientes de Jose (mirando el prototipo)

> **Propuestas pendientes de Jose y de `redactor`:** la etiqueta «Servicios y precios», los nombres de las vías («Por horas», «Encargo a precio fijo», «Packs de web y app», «Abierto a empleo»), «Cómo trabajar conmigo» y «¿Eres una agencia?» están en el prototipo porque salen de los hallazgos de `usuario-ejemplo`, pero **no pasan a `messages/{es,en}.json` sin su OK**. Mientras tanto, la documentación de producto usa los nombres de la spec (por hora · proyecto cerrado · packs · abierto a contratación).

1. **CTA del hero:** A «Servicios y precios» sólido + «Ver proyectos» fantasma (en el prototipo) · B al revés · C/D otra etiqueta (§12).
2. **Nombres de las vías:** los del prototipo o alguna alternativa de §12 (sobre todo «Encargo a precio fijo» y «Abierto a empleo»).
3. **Nombres de P3 y P4:** se quedan «Gestión» / «Gestión + automatizaciones» (prototipo, `pricing.json`) o se adopta la propuesta de §12; cambiarlos afecta a `pricing.json` (D37).
4. **Título de la celda de vías:** «Cómo trabajar conmigo» o «Formas de trabajar conmigo».
5. **Dónde va «Para agencias» en Servicios:** cabecera de la escena (prototipo) o más cerca de las vías (por ejemplo, línea fija al pie de la celda). La crítica nota que a 1440 queda lejos del titular, en `text-3`.
6. **Vía por defecto:** Por horas (D3, prototipo) · Packs · ninguna.
7. **Celda Tarifas (D7):** la crítica la ve redundante con las filas (40 €/h aparece dos veces más) y su pulgar violeta compite con el botón del panel. Opciones: mantener (prototipo; la pide el plan) · quitarla y dejar Packs a 12 · convertirla en información que no esté en otro sitio (qué incluye la hora, facturación mínima, plazos).
8. **P2 destacado en reposo** (violeta + barra): la crítica avisa de que puede leerse como «recomendado» (anti-objetivo §0). Mantener (v6) o reposo neutro y destacado solo con hover o foco.
9. **«Abierto a empleo» dentro del selector de vías** o fuera (Sobre mí + ⌘K, tres vías comerciales). La crítica pregunta si resta credibilidad al freelance.
10. **Celda ampliada (⤢), en todas las escenas:** desde la revisión de Jose (§16) **quitada por defecto**, porque cada celda ya enlaza a su pantalla propia y el bloque «Aquí se abre la página completa / Ir a …» repetía ese enlace. Opciones: quitarla (prototipo) · recuperarla tal cual (`?ampliar=1`) · recuperarla solo donde aporte contenido que la celda no enseña (qué incluye, plazo, cómo se paga).
11. **Demo del Lab:** «paginado por gesto» (prototipo, D8) u otra de las candidatas; si el póster quieto (bloques sin texto) convence como reclamo para Dani o necesita más detalle.
12. **Destino de los packs:** comparador `/servicios?pack=Px#packs` (D5, prototipo) · generador.
13. **Lab y Blog en la cabecera:** **dos enlaces, «Lab» → `/lab` y «Blog» → `/blog`** (prototipo, §16) · uno solo a `/blog`. Con uno de los dos sin contenido, desaparece su enlace.
15. **Color de destaque** del segundo tono de los titulares: a cian hielo (recomendado) · b orquídea · c melocotón (§16.3; compara con `?tono=a|b|c`).
14. **Disposición de Servicios:** B 12 + 7 + 5 (prototipo, D14) · A 7 alta + 5 + 5.

**Textos `{{DATO}}` que siguen pendientes** (`redactor` con `voz.md`): subtítulo del hero; entradilla de Sobre mí; titulares a dos tonos de Servicios y Lab/Blog; frase de cada vía; resumen de la celda de vías ampliada y del Lab; nombre, frase y slug de la demo; fecha, título y slug de dos guías; URL de Cal.com; WhatsApp prellenado (proyecto y packs); CV es/en; foto y ciudad (de la v6).

**Pendiente para otras tareas:** `pricing.json` (P5, `APP_PLUS` como opción y, si Jose acepta §12, nombres de P3/P4); P20 acepta `?pack=` (D5).


## 16. Revisión de Jose (2026-10-28): la home es una muestra

### 16.1 Navegación a pantallas propias

Cabecera, menú ☰, ⌘K, pie y los enlaces de dentro de las celdas llevan a **rutas reales**, no a anclas de la home. Ya no queda ningún `href="#"` ni `data-dest`.

| Origen | Destino |
|---|---|
| Cabecera | Sobre mí `/sobre-mi` · Servicios `/servicios` · Proyectos `/proyectos` · **Lab `/lab` · Blog `/blog`** (dos enlaces; elección de `ui`: son dos pantallas distintas y el pie ya los separa) · EN `/en` · Chat `/chat` · Login `/auth` |
| Menú ☰ | Las mismas cinco secciones · Para agencias `/partners` · Contacto `/contacto` · English `/en` |
| ⌘K | Ir a: `/sobre-mi`, `/servicios`, `/proyectos`, `/lab`, `/blog`, `/partners` · Acciones: `/servicios#packs`, `/servicios#por-hora`, `/propuesta`, `/contacto`, `/chat`, `/auth` |
| Pie | Las cinco secciones, `/partners`, **`/contacto`** (nuevo en el pie), `/area-clientes`, `/legal/aviso-legal` |
| Hero | «Servicios y precios» → `/servicios` · «Ver proyectos» → `/proyectos` |
| Sobre mí | «Conóceme» → `/sobre-mi` · «Escríbeme» → `/contacto` |
| Servicios | Packs → `/servicios?pack=Px#packs` · «Qué incluye cada pack» → `/servicios#packs` · Tarifas → `/servicios#por-hora` y `/servicios#proyecto` · «Para agencias» → `/partners` · «Preguntar al asistente» → `/chat?case=client` o `?case=recruiter` · «Pedir propuesta (orientativa)» → `/propuesta` |
| Proyectos | «Ver todos» → `/proyectos` · «Ver proyecto» → `/proyectos/<slug>` (slug sacado del nombre: `hazmefila`, `oportunix`, `webs-de-comercios`, `3catinfo`; lo confirma Jose) |
| Lab/Blog | «Todas las guías» → `/blog` · «Todas las demos» → `/lab` · guías → `/blog/{{DATO-slug}}` · demos → `/lab/{{DATO-slug}}` |

- **Destinos externos que faltan** (Cal.com, WhatsApp, CV) llevan `href="#pendiente"` y `data-dato="…"`. No se inventa ninguna URL.
- **En el prototipo**, como esas pantallas aún no existen, un clic (o Enter, o ⌘K) en una ruta interna muestra un aviso discreto, «Lleva a /servicios, pantalla propia», en lugar de un 404. En un destino pendiente el aviso dice «Destino pendiente: {{DATO: …}}».
  - El aviso es un `role="status"` abajo en el centro, en el material de la paleta.
  - Entra con opacidad y 0.5rem en 200 ms (`--ease-out`) y se va a los 2,6 s. Usa transición, no keyframes, porque se puede disparar varias veces seguidas. Con reduced motion solo cambia la opacidad.
  - Sin JS, los enlaces navegan de verdad y el servidor estático da 404.
- **Lo que sigue dentro de la home:** el indicador de sección, el paginado por gesto, el enlace «Saltar al contenido» y la marca → `#top`.
- **La escena a la vista** se señala en la cabecera solo con color (clase `is-here`), sin `aria-current`, porque la página actual sigue siendo la home.

### 16.2 Celda ampliada (⤢)

Se quita por defecto (`html.no-expand`). Desaparecen el botón, el cursor de mano y la sombra de hover de la celda principal. Motivo: con cada celda enlazando a su pantalla, la ampliada solo repetía «Aquí se abre la página completa / Ir a …». Con `?ampliar=1` se recupera la v6 tal cual para compararla. El marcado `.cell__more` sigue en el HTML por si Jose la quiere. La decisión está en §15, punto 10.

### 16.3 Color de destaque (tokens `highlight-*`)

El segundo tono de los titulares (escenas y cierre) deja la lavanda terciaria (`text-3`, 6,01:1), que se confundía con el fondo, y pasa a un color propio. Es un tono plano: sin degradado ni brillo. Las tres opciones evitan el violeta de acción (`#7c6cff`), el violeta suave de los enlaces (`#b9adff`), el verde de «vivo» (`#3ddc84`) y el ámbar de los `{{DATO}}`.

| Opción | Token | Valor | Tono | Contraste sobre `bg` #07060f | Sobre `card` | Sobre el punto más claro de la celda destacada |
|---|---|---|---|---|---|---|
| **a (recomendada)** | `highlight-ice` | `#86d6ee` | cian hielo, 194° | **12,35:1** | 11,27:1 | 9,40:1 |
| b | `highlight-orchid` | `#f0a8d2` | orquídea, 325° | **10,78:1** | 9,85:1 | 8,21:1 |
| c | `highlight-peach` | `#ffb59a` | melocotón, 16° | **11,83:1** | 10,80:1 | 9,00:1 |

- `highlight` es el token semántico que se consume; hoy apunta a `highlight-ice`. Cuando Jose elija, `highlight` toma ese valor y las otras dos opciones se borran de `design.json`.
- **Por qué recomiendo a:** es frío como el índigo, separa bien del violeta sin competir con él y es la que más contraste tiene.
  - b es la más afín (vecina del violeta), pero se acerca a «rosa marca».
  - c da el contrapunto más cálido, pero puede leerse cerca del ámbar de los `{{DATO}}` mientras haya marcadores.
- **Dónde se usa:** solo en el segundo tono de los `h2` de escena y del titular del cierre.
- **Otros sitios con el mismo papel:** los busqué y no encontré ninguno que encajara sin chocar. «¿Eres una agencia?» es un enlace, y el nombre activo del raíl de Proyectos es un indicador de posición. Por regla, nunca va en botones, enlaces ni estados.
- **Comparar:** `?tono=a` (por defecto), `?tono=b`, `?tono=c`. Capturas de la escena Sobre mí en `capturas/tono-{a,b,c}-1440.png`.
- **Tokens:** emitidos con `pnpm tokens:build` (261 custom properties) y añadidos a `required-tokens.json`. `pnpm --filter @josecoded/design-tokens test`: 23/23. La regla «Two-Tone Headline» de `DESIGN.md` recoge la propuesta.

### 17. Color de destaque elegido (Jose, 2026-10-28)

Jose descarta las tres opciones anteriores y pide la familia ámbar. `highlight` apunta a **ámbar `#ffb354`** (11,35:1 sobre `bg`, 10,36:1 sobre `card`); `?tono=b` muestra **ámbar tostado `#e09c47`** (8,65:1 / 7,90:1) y `?tono=c` el cian hielo anterior, solo para comparar. Orquídea y melocotón salen de `design.json`. Mientras queden marcadores `{{DATO}}` en los titulares, heredan el color del destaque con subrayado punteado para no confundirse con el ámbar.

**Decisión final (2026-10-28):** Jose elige **ámbar tostado `#e09c47`**. `highlight` es el único token de destaque; se retiran las alternativas y el selector `?tono`.
