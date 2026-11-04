# División de pantallas y contenido de cada una

**2026-11-04 · `arquitecto` · ronda de pensamiento pedida por Jose antes de seguir construyendo.** Parte de `brief.md`, `pantallas.md` (qué hay en cada pantalla), `valor-pantallas.md` (qué aporta valor), `seo.md` (hub-and-spoke, H1, enlazado) y `decisiones.md` (2.2, 2.11, 2.14–2.18, 5.7–5.10). No repite lo que esos documentos ya dicen: resuelve **el reparto**, es decir, qué contenido tiene su casa en qué pantalla, qué pantallas solo lo enseñan como teaser y qué no debe aparecer en cada una para que ninguna pise a otra. Lo que toca una decisión cerrada va como pregunta en §4, no se cambia aquí. El plan se sigue (`bloques.md`); los cambios que este documento pide se listan en §6 sin aplicarlos.

---

## 0. Reglas de reparto

1. **Cada contenido tiene una casa.** La casa es la única pantalla donde está completo (texto, cifra, tabla, FAQ). Las demás pantallas solo pueden llevar un **teaser**: una línea de texto, como mucho una cifra, y un enlace con ancla descriptiva a la casa. Un teaser nunca tiene su propio H2 con contenido que luego se repite en la casa.
2. **Lo único que se repite a propósito:** el párrafo de entidad (home, hub de servicios y sobre mí: es el ancla GEO, decisión 2.12 y `seo.md` S3), el `Closing` de cada página (misma pieza, distinta vía), las migas, las cinco fases (2.14) como vocabulario y el pie.
3. **Una acción primaria por pantalla** (regla de `pantallas.md`). Si dos pantallas comparten primaria, una de las dos sobra o es un teaser.
4. **La home es un escaparate**, no un resumen largo (recomendación Q1): cada sección de la home es la puerta de una pantalla propia (D48 de la v1 sigue valiendo). Nada que exija leer más de diez segundos vive en la home.
5. **Hub-and-spoke** (`seo.md` §4): home → hub → hijas → fichas y guías → contacto con `?via` o `?pack`. Cada pantalla indexable a ≤ 3 clics de la home y con ≥ 2 enlaces entrantes.
6. **Prueba antes que afirmación** (`valor-pantallas.md` §0): lo que no se puede comprobar con un clic no se publica. Por eso no hay testimonios anónimos, logos ni contadores en ninguna pantalla.

### Dónde vive cada cosa

| Contenido | Casa (completo) | Teaser permitido en | Prohibido en |
|---|---|---|---|
| Quién es Jose (párrafo de entidad) | `/sobre-mi` | home y hub (mismo texto, es la excepción) | fichas, blog, contacto |
| Trayectoria, formación, principios de trabajo | `/sobre-mi` | hub `#contratacion` (una línea «Qué aporto» + enlace) | home |
| **Stack** | `/sobre-mi#stack` (`StackGroups` desde `cv.json`, «último uso», «en producción en») | home (`StackRow`: cuatro grupos, sin logos, enlace al ancla) · ficha (`Chip` por tecnología → ancla) · hub `#contratacion` (una línea) | página propia, blog, packs |
| **CV** | `/sobre-mi` (`LinkRow`, PDF es/en desde `cv.json`, primaria de la página) | hub `#contratacion` (botón, su primaria de vía) · ⌘K («Descargar CV») | home, pie, fichas, contacto |
| Las tres vías (qué son, para quién) | `/servicios` (hub) | home (`ServicesStrip` como enrutador por visitante) · pie (columna Servicios) | sobre mí, fichas |
| Contratación (qué aporto, cómo trabajo en equipo, CV y chat) | `/servicios#contratacion` | home (tarjeta de `ServicesStrip`) | sobre mí (ahí va la persona, no la oferta), página propia |
| **Tarifa por hora, ejemplos de tarea** | `/servicios/freelance` (`RateFigure` con cifra y fecha, `TaskExamples`) | home (una línea en `ServicesStrip`: «desde X €/h») · hub (tarjeta con la cifra y enlace) · contacto (vía preseleccionada) | packs, sobre mí, fichas |
| **Packs: comparador, qué incluye, extras, plazos, configurador** | `/servicios/packs` | home (`PackTeaser`: nombre + «desde X €» por pack) · hub (tarjeta con el «desde» más bajo) · contacto (selector con nombre y precio) · guías del blog (rango + enlace) | sobre mí, fichas (la ficha enlaza al pack por `relatedService`, no muestra precio) |
| **Precios en texto citable con fecha** (GEO) | `/servicios/freelance` (hora) y `/servicios/packs` (packs) | `llms.txt` (generado desde la misma fuente) · hub (una frase: «desde X €/h y packs desde Y €») | home, fichas, blog (las guías citan rangos del mercado, no la tarifa de Jose más que como enlace) |
| **Cómo trabajo (cinco fases, `Steps`)** | `/servicios#como-trabajo` | hero (las fases como visual, sin texto explicativo) · hijas («Cómo empezamos»: tres pasos de arranque propios de la vía, no las cinco fases) · área (`PhaseSteps`) | home como sección, sobre mí (ahí van los principios, no el proceso) |
| **FAQ** | una por página de servicio, con preguntas distintas: hub (generales: remoto, facturación, idiomas, plazos de respuesta), freelance (horas, tarea, mínimo, seguimiento), packs (precios, qué incluye, publicación, mantenimiento, qué aporta el cliente) · cada guía del blog la suya | ninguno (la FAQ no se teasea) | home, sobre mí, contacto, fichas |
| **Proyectos** | `/proyectos` y `/proyectos/[slug]` | home (`ProjectGrid`: tres destacados) · hijas de servicios («Proyectos parecidos»: dos fichas por `relatedService`) · sobre mí (enlace «mis proyectos», sin tarjetas) · guías (una ficha relacionada) | hub (no lista proyectos; enlaza a `/proyectos`) |
| **Esta web como proyecto** («Cómo está hecha», 2.11, 2.17) | `/proyectos/josecoded#como-esta-hecha` (recomendación Q3) | home (es uno de los tres destacados, Q1 de valor = a) · hub `#contratacion` («el repo de esta web» como prueba) · pie (enlace) | página propia mientras no haya métricas vivas |
| **Prueba** (enlaces a tienda, web, repo, cifra con fuente) | fichas de proyecto | tarjetas de `ProjectGrid` y `ProjectCard` (una cifra con fuente) · `HowIWorkInTeams` en el hub (PR, CI, revisión, repo) | testimonios, logos y contadores en cualquier sitio |
| **Testimonio real** (nombre, cargo, enlace) | la ficha del proyecto al que pertenece, una cita | ninguno | home, servicios (ni carrusel ni rejilla) |
| Guías y artículos | `/blog`, `/blog/[slug]`, `/blog/tema/[categoria]` | hijas de servicios (dos guías relacionadas) · fichas (una) · pie (tres guías de precio fijadas) · home solo cuando haya tres publicados (interruptor) | — |
| Contacto (formulario, email, WhatsApp, Cal) | `/contacto` | `Closing` de cada página · chooser «Hablemos» · ⌘K · pie | formulario en la home o en servicios |
| Chat con Nexo | `ChatPanel` global y `/chat` | `ChatInvite` en la home (tres arranques) · `Starters` por página · «¿Prefieres preguntar antes?» en contacto · 404 | — |
| Disponibilidad para contratación | la responde Nexo (2.8) | — | cualquier página |
| Legales | `/legal/*` | pie | — |

---

## 1. Árbol de la zona pública

```
/                                  Home: escaparate y enrutador
├─ /servicios                      Hub: las tres vías; casa de «contratación» y de «Cómo trabajo»
│  ├─ /servicios/freelance         Casa de la tarifa, ejemplos de tarea y FAQ freelance
│  └─ /servicios/packs             Casa de packs, extras, plazos, configurador y FAQ de precios
│     └─ /servicios/packs/[slug]   Fase 2 (cuando haya > 1 pack con contenido propio)
├─ /proyectos                      Prueba de oficio: lista filtrable
│  └─ /proyectos/[slug]            Caso en dos minutos; /proyectos/josecoded lleva #como-esta-hecha
├─ /sobre-mi                       La persona: trayectoria, principios, #stack, formación, CV
├─ /blog                           Guías (SEO/GEO); oculto por interruptor hasta tres artículos
│  ├─ /blog/[slug]                 Artículo plano, sin categoría en la URL
│  └─ /blog/tema/[categoria]       Categoría por tema; noindex hasta tres artículos
├─ /contacto                       Salida de todo el enlazado: formulario corto por vía
├─ /chat                           Nexo a pantalla completa (noindex); ChatPanel en todas
├─ /legal/aviso · /legal/privacidad · /legal/cookies
├─ 404 · 500 · 429 · 503 (mantenimiento) · sin conexión
└─ /lab · /lab/[slug]              Reservada (se estudia al final)
```

Piezas globales (en todas las públicas):

- **Cápsula** (10.9, 2.16, 2.18): marca · Servicios · Proyectos · Sobre mí · Blog (si el interruptor está encendido) · buscar (⌘K; lupa en móvil) · chat (icono, abre `ChatPanel` con Nexo) · «Hablemos» (abre el chooser). «Entrar» solo en el pie. «Contacto» como enlace de la cápsula sobra una vez que «Hablemos» lleva al chooser (pregunta Q6): el contacto queda a un clic desde el chooser, el `Closing`, el pie y ⌘K.
- **⌘K** (2.16): páginas, proyectos, artículos, servicios y packs por nombre, más acciones (Descargar CV, Copiar email, Abrir chat, Hablemos). Palabras clave de búsqueda por entrada (`cv`, `precio`, `tarifa`, `whatsapp`…).
- **ChatPanel** con Nexo (5.7, 5.9): saluda primero, arranques según la página, estados movidos por la conversación.
- **Pie** (`seo.md` §4): Servicios (Contratación, Freelance, Packs) · Trabajo (Proyectos, Sobre mí, Blog, «Cómo está hecha») · Guías (tres artículos de precio) · Contacto (email, LinkedIn y GitHub con `rel="me"`, Entrar) · Legal.
- **Migas** en todo salvo la home; `Closing` al final de toda página de contenido.

---

## 2. Pantalla a pantalla

Formato: **Trabajo** (el único que tiene) · **Secciones en orden** (una línea de contenido cada una) · **No contiene** · **Primaria** · **Entra desde → Sale hacia**. Los H1 y H2 son los de `seo.md` §3; aquí solo se nombra la sección.

### Home `/`

- **Trabajo:** en diez segundos, quién es Jose, qué hace y por cuál de las tres vías seguir. Es la muestra del estilo y el enrutador; nada más.
- **Secciones:**
  1. `Hero` (10.10, variante B «Móvil + web»): titular en dos tonos, lead, dos CTAs («Hablemos» → chooser; «Ver proyectos»), y el visual que recorre las cinco fases (2.14) transformando el teléfono y el navegador.
  2. `EntityParagraph`: el párrafo de entidad (40–60 palabras) bajo el H1.
  3. `ServicesStrip`: tres tarjetas que empiezan por la situación del visitante («Buscas incorporar a alguien» · «Tienes una tarea concreta» · «Quieres una web o app completa»), una línea y la cifra que corresponde («desde X €/h», «desde Y €»), cada una a su casa (`/servicios#contratacion`, `/servicios/freelance`, `/servicios/packs`).
  4. `ProjectGrid`: tres destacados con una cifra con fuente y enlace verificable; uno es esta web.
  5. `PackTeaser`: los packs visibles con nombre y «desde»; un botón «Comparar packs» → `/servicios/packs`.
  6. `StackRow`: cuatro grupos (móvil, web, datos e IA) en texto, enlace a `/sobre-mi#stack`.
  7. `ChatInvite`: Nexo con tres arranques («¿Estás disponible para contratación?» · «¿Qué pack me conviene?» · «¿Cuánto cuesta una tarea de…?»); abre el panel con el arranque escrito. Con `public_chat` apagado pasa a «Escríbeme» → `/contacto`.
  8. `Closing` con `QuickContact` (email con copiar).
- **No contiene:** `Steps`/cómo trabajo, FAQ, comparador de packs, formulario, trayectoria, testimonios, logos, contadores, teaser del blog mientras no haya tres artículos.
- **Primaria:** «Hablemos» (hero). Secundaria «Ver proyectos».
- **Entra desde:** todo (marca, ⌘K, 404). **Sale hacia:** hub, freelance, packs, tres fichas, sobre mí `#stack`, chat, contacto (cierre) y una o dos guías de precio cuando existan.

### Servicios (hub) `/servicios`

- **Trabajo:** que el visitante elija vía en una pantalla y, si es un empleador, que no necesite otra: es la casa de «contratación» y de «Cómo trabajo».
- **Secciones:**
  1. `PageHead` + `EntityParagraph`.
  2. `WayNav`: tres pestañas que ahora **navegan entre páginas** (`aria-current="page"` en el hub para «Contratación»; «Freelance» y «Packs» llevan a las hijas).
  3. `WaySection` **Contratación** (`#contratacion`, completa): para quién, «Qué aporto» (tres hechos), `HowIWorkInTeams` (PR por bloque, CI visible, revisión, repo de esta web), botones «Descargar CV» (primaria de la vía) y «Hablar con Nexo» (2.8: la disponibilidad la dice Nexo).
  4. `WayCard` **Freelance** (teaser): para quién, una línea, «desde X €/h», «Ver tarifa y ejemplos» → `/servicios/freelance`.
  5. `WayCard` **Packs** (teaser): para quién, una línea, «desde Y €», «Comparar packs» → `/servicios/packs`.
  6. `Steps` **Cómo trabajo** (`#como-trabajo`): las cinco fases de 2.14 con una línea cada una; único sitio donde se explican.
  7. `Faq` general (remoto y ciudad, facturación e IVA, idiomas, plazo de respuesta, qué pasa si Omen duerme). Nada de precios: eso va en las hijas.
  8. `Closing` → `/contacto` sin vía.
- **No contiene:** tarifa desarrollada ni `TaskExamples` (freelance), comparador, extras ni configurador (packs), lista de proyectos (enlaza a `/proyectos`), trayectoria (sobre mí).
- **Primaria:** «Descargar CV» (la vía que está completa aquí). Las tarjetas de las otras dos vías tienen enlaces, no botones primarios.
- **Entra desde:** home (`ServicesStrip`, cápsula), pie, hijas (`WayNav`, migas). **Sale hacia:** freelance, packs, sobre mí `#stack`, CV, `/proyectos`, dos guías, contacto `?via=hiring`.

### Freelance `/servicios/freelance`

- **Trabajo:** convertir «por hora» en algo que el cliente puede comparar con su necesidad y cerrar el contacto con la vía puesta.
- **Secciones:**
  1. `PageHead` + `WayNav` (`aria-current` aquí) + migas.
  2. `RateFigure`: tarifa por hora y mínimo por tarea, cifra real, «precios actualizados el {fecha}» (texto citable).
  3. `TaskExamples`: tres o cuatro encargos típicos con tamaño orientativo (pantalla nueva con API, auditoría de rendimiento, rescate de proyecto, integración de IA).
  4. `HowWeStart` (tres pasos propios de la vía: me cuentas la tarea → alcance y horas por escrito → entregas cortas que pruebas). Enlace «Cómo trabajo» → hub `#como-trabajo`.
  5. `RelatedProjects`: dos fichas con `relatedService = freelance`.
  6. `Faq` de freelance (¿hay mínimo?, ¿por horas o por tarea?, ¿cómo sigo el avance?, ¿qué pasa si crece el alcance?).
  7. `Closing` → `/contacto?via=freelance`.
- **No contiene:** packs ni sus precios, CV, trayectoria, las cinco fases desarrolladas.
- **Primaria:** «Pedir propuesta».
- **Entra desde:** hub, home (`ServicesStrip`), guía «por horas o por tarea», fichas con `relatedService = freelance`, pie. **Sale hacia:** contacto `?via=freelance`, dos fichas, una guía, hub `#como-trabajo`.

### Packs `/servicios/packs`

- **Trabajo:** que un comprador no técnico sepa qué pack le toca, cuánto cuesta, cuánto tarda y qué tiene que aportar él.
- **Secciones:**
  1. `PageHead` + `WayNav` + migas; una frase citable con los «desde» y la fecha.
  2. `PackCompare`: columnas en escritorio, un pack por vista en móvil con todos en el DOM; H3 «Pack {nombre}: desde {precio} €».
  3. `PackConfigurator` (2.15): web, app o las dos más extras → «desde» en vivo; «Pedir este pack» lleva la selección a contacto.
  4. `WhatIncludes` (qué incluye y qué no, por pack) y `ExtraList` (extras con su facturación).
  5. `HowLong` («Cuánto tarda»): semanas por pack dibujadas con el anillo coral; enlace a las cinco fases del hub.
  6. `WhatINeedFromYou`: lista corta por pack (textos, dominio, cuentas de tiendas, logo).
  7. `RelatedProjects`: dos fichas con `relatedService = packs`.
  8. `Faq` de precios (¿cuánto cuesta una app como…?, ¿incluye publicación?, ¿y el mantenimiento?, ¿puedo pagar por fases?, ¿qué pasa si quiero algo que no está en el pack? → historias fuera de presupuesto, 6.8).
  9. `Closing` → `/contacto?via=pack&pack={slug}`.
- **No contiene:** tarifa por hora, CV, trayectoria, proceso completo (se enlaza).
- **Primaria:** «Pedir este pack» (desde el comparador o el configurador; un solo botón primario visible a la vez).
- **Entra desde:** hub, home (`PackTeaser`, `ServicesStrip`), guías de precio, fichas con `relatedService = packs`, pie. **Sale hacia:** contacto `?pack={slug}`, dos fichas, guías de precio, publicación y plazos, hub `#como-trabajo`.

### Proyectos `/proyectos`

- **Trabajo:** prueba de oficio en una lista que se recorre en treinta segundos.
- **Secciones:** `PageHead` + migas · `FilterTabs` (Todos · Apps · Webs; «IA» solo si hay dos) con `<a href>` reales · `ProjectCard` apilada (nombre, tipo, estado honesto, una cifra con fuente, chips de stack, enlace verificable y «Ver caso») · `EmptyState` por filtro · `Closing`.
- **No contiene:** precios, servicios, texto sobre Jose, «próximamente» como tarjeta.
- **Primaria:** abrir una ficha.
- **Entra desde:** home, cápsula, hub, sobre mí, pie. **Sale hacia:** fichas; `Closing` → contacto.

### Ficha `/proyectos/[slug]`

- **Trabajo:** un caso real en dos minutos: reto, qué hice, stack, resultado verificable; y la puerta al servicio que lo vendería.
- **Secciones:** `ProjectHead` (nombre, tipo, estado, enlace principal arriba, papel y período) · `ScreenGallery` (omitida sin capturas) · `CaseSection` ×3 (El reto · Qué hice · Resultado) · `Chip` de stack → `/sobre-mi#stack` · `StoreLinks` · `NeedSomethingLikeThis` («¿Necesitas algo así?»: enlace al servicio por `relatedService` y a contacto con la vía) · un artículo relacionado · `PrevNext` · `Closing`.
- **Caso especial `/proyectos/josecoded`:** misma ficha más la sección larga **`#como-esta-hecha`** (arquitectura real de los dos repos y Supabase, decisiones enlazadas al repo, cómo está hecho el hero, RLS, Omen solo sale); sin métricas vivas (2.17) y sin contar el método con agentes (2.11). Entrada propia en ⌘K y pie.
- **No contiene:** precios, FAQ, testimonios salvo uno real y enlazable, rejilla de «más proyectos» (basta `PrevNext`).
- **Primaria:** «Hablar de un proyecto así» → `/contacto?via=…` según `relatedService`.
- **Entra desde:** lista, home, hijas de servicios, guías. **Sale hacia:** servicio relacionado, contacto, sobre mí `#stack`, `PrevNext`, un artículo.

### Sobre mí `/sobre-mi`

- **Trabajo:** confianza en la persona: quién, desde cuándo, cómo trabaja, con qué, y el CV. Es la casa del stack y del CV.
- **Secciones:** `PageHead` con retrato y tres líneas (qué hace, desde cuándo, Madrid, España y remoto) + `EntityParagraph` · `Timeline` · `HowIWork` (cuatro o cinco hechos comprobables con enlace a la prueba; sin el método con agentes, 2.11) · `StackGroups` (`#stack`, por grupo, «último uso» y «en producción en») · `CredentialList` · `LinkRow` (LinkedIn, GitHub con `rel="me"`, CV es/en) · `Closing`.
- **No contiene:** las tres vías desarrolladas (una línea «cómo trabajar conmigo» → hub), precios, proceso de cinco fases, tarjetas de proyectos (enlace «mis proyectos»), barras ni porcentajes.
- **Primaria:** «Descargar CV».
- **Entra desde:** cápsula, home (`StackRow`), hub `#contratacion`, fichas (chips), caja de autor del blog, pie. **Sale hacia:** CV, proyectos, hub, contacto `?via=hiring`.

### Blog `/blog`, `/blog/[slug]`, `/blog/tema/[categoria]`

- **Trabajo:** tráfico orgánico y citas de IA que acaban en las hijas de servicios. Cada artículo alimenta una vía (`relatedService`).
- **Índice:** `PageHead` + migas · `CategoryTabs` (por tema, Q4) · `PostTeaser` (título, fecha, tiempo de lectura calculado, categoría) · paginación `?pagina=` por URL · `Closing`.
- **Artículo:** título en dos tonos · caja de autor (foto, una línea, `/sobre-mi`, «actualizado el») · `Toc` pegajosa · `Prose` con `CodeBlock` · enlace al servicio en el primer tercio · `Faq` propia si hay `faq` · `RelatedService` (una tarjeta del servicio que alimenta) · dos artículos de la misma categoría · «Probar en el lab» si hay demo · `ShareRow` · `Closing`.
- **Categoría:** índice filtrado por tema, `noindex` hasta tres artículos.
- **No contiene:** `ReadingProgress` (lo hace el borde de la cápsula), comentarios (2.7), nube de etiquetas, contadores, los precios de Jose desarrollados (las guías citan rangos de mercado y enlazan a packs o freelance), FAQ de servicios.
- **Primaria:** índice: abrir artículo; artículo: leer; la salida es el servicio relacionado.
- **Entra desde:** cápsula (si está encendido), pie (tres guías), hijas de servicios, fichas, buscadores. **Sale hacia:** servicio relacionado, dos artículos, sobre mí, lab.

### Contacto `/contacto`

- **Trabajo:** destino de todo el enlazado con la vía ya puesta; corto, dice qué pasa después y no pierde al que tiene prisa.
- **Secciones:** `PageHead` + migas · `ViaSelector` (preseleccionado por `?via`, `?pack`) · `ContactForm` (nombre, email, mensaje **y un campo por vía**: empresa y enlace a la oferta / para cuándo / pack y «tienes dominio y cuentas de tiendas») · `WhatHappensNext` (tres pasos con plazo `{{DATO}}`) · `QuickContact` (email con copiar; WhatsApp y `CalEmbed` solo con datos, 2.9) · «¿Prefieres preguntar antes?» → `ChatPanel` con el contexto de la vía.
- **No contiene:** precios (solo el nombre y «desde» del pack elegido como confirmación), FAQ, texto sobre Jose, teléfono obligatorio, adjuntos, mapa.
- **Primaria:** «Enviar». El éxito sustituye al formulario.
- **Entra desde:** `Closing` de todo, chooser «Hablemos», hijas de servicios (`?via`, `?pack`), fichas, ⌘K, 429. **Sale hacia:** chat; tras el éxito, proyectos o home.

### Chat `/chat` y `ChatPanel`

- **Trabajo:** responder lo que la web no publica (disponibilidad, encaje, precio aproximado) y captar el interés con consentimiento (5.7); con cuenta, hablar con Jose.
- **Secciones (panel y página comparten todo):** `NexoAvatar` (5.8, 5.9) con estado · `ChatThread` (`ChatBubble` con etiqueta «Nexo» / «Jose», chips de fuente) · `Starters` según la página · `HandoffCard` («Deja tu email y te escribe Jose», botón de consentimiento) · `TakeoverBand` · `OfflineNotice` (Omen duerme) · `QuotaNotice` · `SaveThreadHint` (con cuenta) · `ChatComposer`.
- **Estados de Nexo movidos por la conversación (5.9):** `idle` (saluda y espera), `listening` (el visitante escribe), `thinking` (trabajo encolado), `speaking` (respuesta llegando), `handoff` (Jose ha entrado), `offline` (Omen sin latido), `quota` (cuota agotada). El SVG y su motion son de la rama `chat/nexo-avatar` (5.8).
- **No contiene:** avatar de robot genérico, «escribiendo…» falso, valoraciones por mensaje, formulario de contacto completo (eso es `HandoffCard` o `/contacto`).
- **Primaria:** enviar mensaje.
- **Entra desde:** icono de la cápsula, chooser «Hablemos», `ChatInvite`, contacto, 404, hub `#contratacion`. **Sale hacia:** contacto (handoff), la página que Nexo cita, `/entrar` (guardar hilo).

### Legales `/legal/*`

- **Trabajo:** obligación y confianza: en cinco líneas, qué guardo, cuánto, para qué, con quién y cómo se borra.
- **Secciones:** resumen de cinco líneas · `Toc` · `Prose` · fecha de actualización. Privacidad recoge el chat anónimo (cookie técnica de visitante, 30 días, sin datos personales hasta consentimiento, 5.10), cuota por IP, CRM, Groq, Resend, Cloudflare y Supabase como encargados.
- **No contiene:** banner de cookies (solo hay técnicas), texto de generador sin adaptar.
- **Primaria:** ninguna. **Entra desde:** pie, `HandoffCard`, formulario. **Sale hacia:** contacto (ejercer derechos).

### 404 y errores

- **Trabajo:** que un error no parezca abandono. Una variante por código: 404, 500, 429, 503 (mantenimiento con hora), sin conexión.
- **Secciones:** titular de una frase · qué pasó · acción por variante (404 → inicio y sugerencia por parecido de ruta; 500 → reintentar; 429 → escribir por email; 503 → hora de vuelta) · «Abrir el chat» salvo en 503 y sin conexión.
- **No contiene:** ilustraciones, humor, código gigante decorativo, navegación completa duplicada.
- **Primaria:** la de su variante.

---

## 3. Solapes resueltos

| Solape | Resolución |
|---|---|
| **Home vs hub vs sobre mí vs proyectos** | La home enruta (teasers); el hub explica las vías y es casa de contratación y del proceso; sobre mí es la persona (trayectoria, principios, stack, CV); proyectos es la prueba. Ninguna de las cuatro repite un bloque de otra: la home lleva `ServicesStrip`, no `Steps`; el hub lleva «Qué aporto», no la trayectoria; sobre mí no lleva las vías. |
| **Hub vs hijas** | El hub desarrolla solo contratación (la vía sin precio ni página propia) y resume freelance y packs en una tarjeta con la cifra. Todo lo que tenga precio, tabla, ejemplos de tarea o FAQ de precio vive en la hija. `WayNav` navega entre páginas. |
| **Dónde va el stack** | Casa en `/sobre-mi#stack` desde `cv.json`. La home enseña cuatro grupos en texto; las fichas, chips que enlazan al ancla; contratación, una línea. Sin página propia (Q2): no hay búsqueda que la justifique y partiría la entidad. |
| **Dónde aparecen precios** | Completos y citables solo en `/servicios/freelance` (hora) y `/servicios/packs` (packs). Como cifra suelta: home, hub, contacto (confirmación del pack elegido), ⌘K y `llms.txt`. Nunca en fichas, sobre mí ni blog (las guías citan el mercado y enlazan). Una sola fuente (`packs`, `rates`, `price_changes` para la fecha). |
| **Dónde viven las FAQ** | Una por página de servicio y por guía, con preguntas que solo tienen sentido ahí; ninguna pregunta en dos páginas; `FAQPage` solo con las visibles. Sin FAQ en home, sobre mí, contacto ni fichas (Q7). Las preguntas reales que reciba Nexo alimentan estas listas. |
| **Testimonios y prueba** | La prueba son enlaces verificables y cifras con fuente en proyectos y fichas, más `HowIWorkInTeams` y «Cómo está hecha». Un testimonio solo si es real, con nombre, cargo y enlace, y solo en la ficha de su proyecto. Sin logos, contadores ni carruseles en ninguna pantalla. |
| **Dónde va el CV** | PDF desde `cv.json`; primaria de sobre mí y de la vía contratación del hub; acción en ⌘K. Fuera de home, pie y fichas para no duplicar primarias. `noindex` + canonical a `/sobre-mi`. |
| **Cómo trabajo vs cinco fases vs «Cómo empezamos»** | Las cinco fases (2.14) se explican una vez (`Steps` del hub); el hero las enseña como visual; el área las usa como `PhaseSteps`. Las hijas no las repiten: llevan `HowWeStart`, tres pasos de arranque propios de la vía, y enlazan al hub. |
| **Contratación vs sobre mí** | Contratación es la oferta a un empleador (qué aporto, cómo trabajo en equipo, CV, Nexo para la disponibilidad); sobre mí es la persona. El recruiter que llega por LinkedIn aterriza en sobre mí y encuentra el CV en un clic; el que compara perfiles aterriza en el hub. Los dos enlazan entre sí una vez. |
| **«Cómo está hecha»** | Sección de la ficha `/proyectos/josecoded` hasta que vuelvan las métricas vivas (Q3): sin ellas, una página propia quedaría corta y repetiría la ficha. |
| **Contacto vs chooser vs chat** | «Hablemos» abre el chooser (WhatsApp si hay dato · Chat con Nexo · Formulario, Q6); el chooser no sustituye a `/contacto`, que sigue siendo el destino con `?via`/`?pack`, el camino sin JS y la alternativa del 429. Chat y contacto no compiten: el chat resuelve dudas y capta interés; el formulario cierra con datos para el CRM. |
| **Blog vs servicios** | El blog no vende: explica el mercado y enlaza al servicio en el primer tercio y al final. Las categorías son por tema (Q4), no por vía; la vía va en `relatedService`. |
| **Parámetro de vía** | Unificar en `?via=hiring|freelance|pack` y `?pack={slug}` (el código actual enlaza `?via=packs` y `#comparador`). |

---

## 4. Decisiones abiertas para Jose (recomendada primero)

**Q1 · ¿Cómo es la home?**
- a) **Escaparate**: cada sección es un teaser de una pantalla propia; se lee en diez segundos. *(recomendada: no duplica contenido, cumple el presupuesto de JS y el scroll por bloques luce con secciones cortas)*
- b) Long-form: la home desarrolla vías, proceso y FAQ, y las demás páginas son para SEO.
- c) Mínima: hero, tres vías y proyectos; sin packs, stack ni chat en la home.

**Q2 · ¿Dónde va el stack?**
- a) **Sección `#stack` de Sobre mí** desde `cv.json`; la home y las fichas enlazan al ancla. *(recomendada: una fuente, una entidad, sin página sin búsqueda)*
- b) Página propia `/stack` con detalle por tecnología.
- c) Repartido por vía en servicios (lo que uso para apps, para webs).

**Q3 · ¿Qué es «Cómo está hecha»?** *(toca 2.11 con 2.17)*
- a) **Sección larga `#como-esta-hecha` de la ficha `/proyectos/josecoded`**, con entrada en ⌘K y pie; pasa a página propia cuando vuelvan las métricas vivas. *(recomendada)*
- b) Página propia `/como-esta-hecha` ya, sin métricas.
- c) Artículo del blog (diario de construcción) y la ficha normal.

**Q4 · ¿Categorías del blog?**
- a) **Por tema**: precios · react-native · desarrollo-web · ia · trabajar-con-freelance; la vía va en `relatedService`. *(recomendada: coincide con cómo se busca; `seo.md` §2)*
- b) Por vía: contratación · freelance · packs.
- c) Sin categorías, solo etiquetas.

**Q5 · ¿Qué es `/contacto`?**
- a) **Página con formulario corto por vía** (un campo extra por vía), `WhatHappensNext`, email, WhatsApp y Cal cuando haya datos; destino de `?via`/`?pack`. *(recomendada: camino sin JS, alternativa del 429 y datos limpios para el CRM)*
- b) Solo chooser y chat: sin formulario; el lead se capta en el chat (`HandoffCard`).
- c) Página mínima: email, WhatsApp y chat, sin formulario.

**Q6 · Chooser «Hablemos» y cápsula** *(afina 2.18)*
- a) **Tres opciones: WhatsApp (solo con dato, 2.9) · Chat con Nexo · Formulario**; «Contacto» sale de la cápsula (vive en el chooser, el cierre, el pie y ⌘K). *(recomendada: sin WhatsApp el chooser de dos opciones se queda en una, y con «Contacto» en la cápsula habría dos entradas iguales)*
- b) Dos opciones literales (WhatsApp · Chat) y «Contacto» sigue en la cápsula.
- c) Dos opciones y, hasta que haya WhatsApp, «Hablemos» abre el chat directamente.

**Q7 · ¿Dónde viven las FAQ?**
- a) **Una por página de servicio y por guía, sin repetir preguntas**; ninguna en home, sobre mí ni contacto. *(recomendada: cada FAQ posiciona su página y Nexo responde el resto)*
- b) Una página `/faq` central enlazada desde todas.
- c) Solo en el hub de servicios.

**Q8 · TTL del chat anónimo** *(cierra la cifra de 5.10)*
- a) **30 días desde el último mensaje** para conversaciones sin lead; con lead, la conversación sigue 90 días (5.1) y el contacto se queda en el CRM. Sin mensaje del visitante no se crea nada (ni fila ni cookie). *(recomendada: tiempo de sobra para retomar y poco dato dormido)*
- b) 90 días para todo (5.1 tal cual).
- c) 7 días sin lead, 30 con lead.

---

## 5. Zonas privadas (confirmación breve)

`pantallas.md` sigue valiendo; solo se ajusta lo que cambian las decisiones de hoy y el reparto público.

| Zona | Pantallas | Trabajo único | Ajuste |
|---|---|---|---|
| **Auth** | U1 Entrar · U2 Código · U3 TOTP · U4 Invitación · U5 Mi cuenta | Entrar sin contraseña, por invitación, con TOTP para el personal | Sin cambios. «Entrar» solo en el pie (2.16). |
| **Admin base** | D1 Resumen · D2 Usuarios · D3 Precios · D4 Sistema · D5 Notificaciones · D6 Bandeja de chat | Atender lo pendiente y controlar la web sin desplegar | D3 añade `slug`, `kind` y `highlight` a packs (configurador, `?pack={slug}`). D4 añade el interruptor `whatsapp` con el número como dato público opcional, para que el chooser lo muestre sin desplegar. D6 pasa a la nueva estructura de conversaciones de visitantes (5.10): lista con «visitante» sin datos personales, página de origen, estado de Nexo, `interest`, botón «Crear contacto» que respeta el consentimiento. D1 cuenta «conversaciones sin leer» y «leads desde el chat». |
| **CRM** | K1 Resumen · K2 Contactos · K3 Contacto · K4 Comisiones · K5 Importar · K6 Ajustes · K7 Chat | La cartera y lo que cobra cada closer | Sin cambios de pantalla. `source = chat` enlaza la conversación de origen desde K3 mientras exista; al convertir se guarda un resumen en `activities` para que sobreviva a la purga. |
| **Área de clientes** | A1 Inicio · A2 Tareas · A3 Documentos · A4 Historias · A5 Chat · D7 Proyectos (admin) | Saber en qué punto está el proyecto y qué le toca al cliente | 6.8 (historias fuera de presupuesto: estado «en revisión» y confirmación del cliente) y 6.9 (documentos pedidos como tareas del cliente) ya están decididas; `PhaseSteps` usa las cinco fases de 2.14. |
| **Freelance** | F1 Inicio · F2 Proyecto · F3 Chat | Trabajar con el brief sin preguntar nada | Sin cambios (6.7). |
| **Radar** | R1 Resumen · R2 Hallazgos · R3 Fuentes | Triar rápido y confiar en la puntuación | Sin cambios; atajos de teclado al construirlo (8.5). |
| **Lab** | índice y demo | Ver las apps móviles en la web | Reservada; formato al final. |

---

## 6. Cambios propuestos en `pantallas.md` y `bloques.md` (no aplicados)

### `pantallas.md`

- **Reglas globales:** cápsula = marca · Servicios · Proyectos · Sobre mí · Blog (interruptor) · buscar (⌘K / lupa) · chat (icono) · «Hablemos» (chooser); «Entrar» y «Contacto» fuera de la cápsula según Q6. Añadir a los componentes base `EntityParagraph`, `Breadcrumbs`, `ProgressRing`, `SearchPalette`, `ContactChooser`, `NexoAvatar`. Pie en cinco columnas.
- **P1:** secciones y «No contiene» de §2; `ChatInvite` con Nexo; sin `Steps`.
- **P2 se desdobla:** P2 hub `/servicios` (contratación completa, tarjetas de las otras dos vías, `Steps`, FAQ general), **P2a `/servicios/freelance`**, **P2b `/servicios/packs`** (con `PackConfigurator`, `WhatIncludes`, `HowLong`, `WhatINeedFromYou`). `WayNav` entre páginas. Parámetro `?via=pack&pack={slug}`.
- **P4:** `NeedSomethingLikeThis`; caso `/proyectos/josecoded#como-esta-hecha` (Q3) como **P11** sin ruta propia.
- **P5:** casa del stack y del CV; `HowIWork` sin el método con agentes (2.11).
- **P6:** un campo por vía, `WhatHappensNext`, éxito que sustituye, enlace al chat; `QuickContact` lee el WhatsApp de `site_settings`.
- **P7:** Nexo (5.9) con la lista de estados de §2; `Starters`, `HandoffCard`, chips de fuente; visitantes anónimos por ruta de servidor (5.10); `/chat` `noindex, follow`.
- **P8:** categorías por tema (Q4) en `/blog/tema/[categoria]`; sin `ReadingProgress`.
- **D3, D4, D6, D1:** los ajustes de §5.

### `bloques.md`

Bloques nuevos o que cambian (nombre de rama · tamaño · depende):

| Bloque | Rama | Qué | Tamaño | Depende |
|---|---|---|---|---|
| **W11b** (en vuelo) | `public/header-contact` | `ContactChooser` desde «Hablemos»: WhatsApp (si `site_settings.whatsapp`), Chat con Nexo, Formulario; `<dialog>` con foco y Esc; icono de chat en la cápsula; «Contacto» fuera de la cápsula si Q6 = a | S | W11 |
| **W11c** | `public/footer-columns` | Pie en cinco columnas con `rel="me"`, «Entrar» y «Cómo está hecha» | S | W11, rutas existentes |
| **W11d** | `public/search-palette` | ⌘K (2.16): índice en build de páginas, proyectos, artículos, servicios y packs; acciones; lupa en móvil; sin animación de apertura (acción de teclado) | M | W11, W23 |
| **W13** (cambia) | `public/home-hero-copy` | Sin eyebrow; H1 y `EntityParagraph` de `seo.md`; CTA «Hablemos» abre el chooser | S | W11b |
| **W15** (cambia) | `public/home-hero-motion` | Variante B «Móvil + web» con las cinco fases de 2.14 (10.10 cerrada) | M | W14 |
| **W18** (cambia) | `public/home-services` | `ServicesStrip` como enrutador con cifras; `PackTeaser` → `/servicios/packs`; sin `Steps` en la home | M | W17 |
| **W26** (cambia, en vuelo) | `public/services-ways` → hub | Contratación completa con `HowIWorkInTeams`; tarjetas teaser de freelance y packs; `WayNav` entre páginas; `Steps` `#como-trabajo`; FAQ general | M | W11 |
| **W26b** | `public/services-freelance` | `/servicios/freelance`: `RateFigure` con fecha, `TaskExamples`, `HowWeStart`, `RelatedProjects`, FAQ | M | W26, W23 |
| **W27** (cambia) | `public/services-packs` | `/servicios/packs`: `PackCompare` con todos en el DOM, `WhatIncludes`, `ExtraList`, `HowLong`, `WhatINeedFromYou`, FAQ de precios | M | W26 |
| **W27b** | `public/services-configurator` | `PackConfigurator` (2.15) sobre `packs.kind` y `extras`; selección → `/contacto?via=pack&pack=` | M | W27, W28 |
| **W28** (cambia) | `public/services-data` | `packs.slug`, `kind`, `highlight`; precios y fecha en el HTML del servidor; `OfferCatalog` | S | W20, W27 |
| **W36** (cambia) | `chat/panel-ui` | Panel y página con `NexoAvatar` (consume la rama `chat/nexo-avatar`, 5.8), estados de §2, `Starters`, `HandoffCard`, chips de fuente | M | W11, W08, 5.8 |
| **W37** (se reescribe) | `data/visitor-chat` | `chat_visitors`, `chat_conversations`, `chat_messages` con `last_activity_at`; sin grants a `anon`; `private.chat_quota` por IP y visitante; `pg_cron` de purga; tests RLS y del job | M | W33 |
| **W39** (se reescribe) | `chat/anon-persistence` | Cookie `httpOnly` de visitante creada en el primer mensaje; route handlers de servidor con clave de servicio (enviar, leer, SSE de respuestas); Turnstile en el primer mensaje; 429 tipado; sin cookie ni fila antes de interactuar | M | W36, W37 |
| **W39b** | `chat/handoff-lead` | `HandoffCard` → crea `contacts` + `deals` con `source = chat` y consentimiento; resumen en `activities`; exención de purga | S | W39, W33 |
| **W40** (cambia) | `public/blog-index` | `CategoryTabs` y `/blog/tema/[categoria]` `noindex` hasta tres; paginación `?pagina=` | S | W23 |
| **W43b** | `public/built-with` | Ficha `/proyectos/josecoded` + sección `#como-esta-hecha` sin métricas (2.17); entrada en ⌘K y pie | M | W25 |
| **fix** | `fix/contact-params` | `?via=pack` y `?pack={slug}` en todos los enlaces; quitar `#comparador` | S | W26 |

Lista O: **O07** `chat/reply-job` lee `conversation_id` y `page_path` del contrato y devuelve `sources` y `interest`; el estado `thinking`/`speaking` de Nexo sale de `private.jobs.status` y de la llegada de mensajes, no de un campo nuevo.

---

## 7. Qué anotar al cerrar

- **`decisiones.md`:** 10.10 cerrada, 2.18, 5.9 y 5.10 (hechos hoy); las respuestas de Q1–Q8 como 2.19–2.2x (Q3 con fecha junto a 2.11, Q8 como cifra de 5.10).
- **`ESTADO.md`:** este documento en «Ahora»; Q1–Q8 en «Pendientes (Jose)»; los bloques nuevos de §6 cuando se abran sus issues; ramas en vuelo `public/header-contact` y `chat/nexo-avatar`.
- **Vault `Proyectos/josecoded.md`:** el reparto de §0 («cada contenido tiene una casa») y las ocho preguntas; Nexo como nombre del asistente.
- **ADR en codebase-memory** (cuando haya código del chat): «chat anónimo por ruta de servidor con clave de servicio, sin grants a `anon`; purga por `pg_cron`».
