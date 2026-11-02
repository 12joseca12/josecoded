# Valor por pantalla

**2026-11-02 · `arquitecto` · para que Jose decida antes de diseñar más pantallas.** Complementa `pantallas.md` (qué hay en cada pantalla) con **qué aporta valor en cada una y para quién**, qué sobra, qué estados importan, qué dato falta y qué interacción la hace propia. No cambia decisiones cerradas; donde propone cambiar `pantallas.md`, `datos.md` o `bloques.md`, lo lista al final sin tocarlos. El SEO y GEO vienen de `seo.md` (analista, mismo día) y están integrados en cada pantalla bajo **SEO**: query principal, H1/H2, URL, enlaces internos y JSON-LD; lo que `seo.md` deja a Jose está en las preguntas (Q12–Q14). Las cifras de volumen de `seo.md` son estimaciones hasta que Semrush tenga unidades.

Objetivo que ordena todo: una web que Jose pueda enseñar como **su proyecto insignia**, que **convierta** por las tres vías y que **no parezca plantilla**. El estilo B está fijado (acero, carbón, coral; cápsula con borde de progreso; scroll por bloques en escritorio; sin eyebrows; hero donde «la app se transforma»).

---

## 0. Criterios que se repiten en todas las pantallas

### Para quién se diseña cada zona

| Visitante o rol | Qué viene a resolver | Qué le convence | Qué le echa atrás |
|---|---|---|---|
| **Empleador / recruiter** | Saber en dos minutos si Jose encaja en una vacante React Native o full stack | Código verificable, proyectos publicados, cómo trabaja en equipo (PR, CI, revisión), CV descargable, respuesta rápida a «¿está disponible?» | Barras de habilidades con porcentajes, contadores inflados, texto de marketing, no encontrar el CV |
| **Cliente freelance** | Encargar una tarea acotada sin contratar a nadie | Tarifa clara, ejemplos de tareas típicas con su tamaño, proceso corto, forma de seguir el avance | Precios ocultos, alcance difuso, formularios largos |
| **Comprador de pack** (suele no ser técnico) | Tener una web o una app completa sin gestionar piezas | Precio y plazo cerrados, qué incluye y qué no, qué pasa después, qué necesita aportar él, sensación de que «esto se publica de verdad» | Jerga, comparadores con 20 filas, letra pequeña |
| **Closer / subcloser** | Trabajar su cartera cada día y saber qué cobra | Tabla densa, filtros en la URL, siguiente acción visible, comisiones con cifras congeladas | Gráficas decorativas, pasos de más por acción |
| **Cliente (área)** | Saber en qué punto está su proyecto y qué le toca hacer | Avance real, tablero vivo, documentos en un sitio, historias con respuesta | Paneles vacíos, «en construcción», datos que no se mueven |
| **Freelance delegado** | Hacer sus tareas con el brief y los ficheros a mano | Brief primero, solo lo suyo, chat con Jose | Ver cosas que no le incumben (importes, cliente) |
| **Admin (Jose)** | Atender lo pendiente en una pantalla, controlar la web sin desplegar, revisar lo que Radar encuentra | Contadores que enlazan a la lista filtrada, acciones de un paso, Omen visible, triaje con teclado | Dashboards de agencia, confirmaciones innecesarias |

### Reglas de valor (además de las de `pantallas.md`)

1. **Prueba antes que afirmación.** Todo lo que diga la web se puede comprobar con un clic: enlace a la tienda, al repo, a la preview, a la métrica medida. Nada de cifras sin fuente.
2. **La web es el caso de estudio.** Es el único proyecto que el visitante puede inspeccionar entero: código, CI, decisiones, métricas. Se trata como proyecto insignia (idea transversal T1).
3. **Un vocabulario visual propio, repetido.** El borde coral de la cápsula (progreso del scroll) es el motivo que se reutiliza para cualquier progreso: avance del proyecto en el área, subida de ficheros, importación, plazo de un pack (T3). Eso es lo que hace que no parezca plantilla: no un efecto nuevo por pantalla, sino uno propio en todas.
4. **Olor a plantilla, fuera:** testimonios sin nombre ni enlace, muro de logos de tecnologías, contadores «+50 proyectos», «años de experiencia», barras de porcentaje, tarjetas con icono + título + párrafo en rejilla de tres, degradados genéricos, partículas, «trusted by», newsletter.
5. **Una acción primaria por vista;** el resto son enlaces o botones `ghost`. Si una sección pide dos botones iguales, sobra uno.
6. **Lo privado es denso y honesto:** celdas con cifras, listas, sin gráficas (regla de `pantallas.md`); el deleite ahí es que las cosas se muevan solas (Realtime) y que cada acción cueste un paso.
7. **Estados como parte del diseño,** no como añadido: el vacío inicial enseña qué hacer, el error dice qué pasó y qué puede hacer el usuario, el esqueleto tiene la forma exacta del contenido (CLS 0).

Escala de **coste** (S ≤ 30 min de agente, M ≤ 1 h, L varios bloques) y **valor** (alto / medio / bajo para el objetivo de la zona).

---

## 1. Público

### P1 Home `/`

**Para quién y para qué.** Los tres visitantes a la vez: en diez segundos, quién es Jose, qué hace y por dónde se le contrata. Es la muestra del estilo y la puerta a las tres vías.

**Acción primaria.** «Pide propuesta» → `/contacto` (sin vía: el selector la pide allí). Secundaria: «Ver proyectos».

**Qué aporta valor, en orden.**

| # | Sección | Por qué | Nota |
|---|---|---|---|
| 1 | `Hero` con la transformación (wireframe → diseño → datos → IA) | Deleite y claridad: enseña el proceso sin explicarlo; las fases del hero son las fases reales del proyecto (T7) | Ya diseñado; la etiqueta de cada fase debe coincidir con las palabras del proceso (`Steps`) y del área |
| 2 | `ProjectGrid` (3 destacados) con `pindex` | Prueba: lo que convence a los tres visitantes es ver cosas publicadas; cada tarjeta lleva un dato verificable (tienda, web, repo) y una cifra con fuente | Uno de los tres puede ser **esta web** cuando exista su ficha (T1) |
| 3 | `ServicesStrip` como **enrutador por visitante**: tres tarjetas que empiezan por la situación del visitante («Buscas incorporar a alguien» · «Tienes una tarea concreta» · «Quieres una web o app completa») y llevan a su vía en `/servicios` | Claridad: el visitante se reconoce y no lee lo que no es suyo | Es el componente con más impacto en conversión de la home |
| 4 | `ChatInvite` con tres arranques sugeridos («¿Estás disponible para contratación?» · «¿Qué pack me conviene?» · «¿Cuánto cuesta una tarea de X?») | Conversión y deleite: el asistente responde lo que la página no publica (disponibilidad, decisión 2.8) y demuestra la IA propia | Abre `ChatPanel` con el arranque ya escrito |
| 5 | `PackTeaser` (packs visibles con «desde») | Claridad para el comprador de pack: el precio no se esconde | Esqueleto y ocultación si falla la lectura |
| 6 | `StackRow` compacta | Confianza para el recruiter; enlaza a `/sobre-mi#stack` | Cuatro grupos, sin logos |
| 7 | `Closing` con `QuickContact` (email con copiar) | Salida para quien no quiere formulario | No duplica el CTA del hero: el botón del cierre es `ghost` o enlace |

**Quitar.** Testimonios, logos de clientes o tecnologías, contadores, «cómo trabajo» en la home (vive en `/servicios`), teaser del blog hasta que haya tres artículos (interruptor), formulario completo en la home (el prototipo lo tenía; el formulario vive en `/contacto`).

**Estados.** `PackTeaser` con esqueleto de la forma final; si falla, desaparece sin hueco. Hero estático (estado final) con `reduced-motion`. Con `public_chat` apagado, `ChatInvite` cambia a «Escríbeme» → `/contacto`.

**Interacción.** Cápsula con borde de progreso y scroll por bloques (hechos). `pindex` que sigue a la tarjeta visible. `reveal` con `animation-timeline: view()`. Al pulsar una tarjeta de `ServicesStrip`, la cápsula marca `Servicios` antes de llegar (feedback anticipado).

**Datos.** Lee `packs` visibles y `site_settings` (`show_prices`, `public_chat`, `blog`). Proyectos destacados desde MDX (`featured`, `order`). **Falta:** nada en `datos.md`; los arranques del chat son texto en `messages/es.json`.

**SEO.** Query «desarrollador react native» (secundarias: programador react native españa, desarrollador apps móviles freelance). URL `/es`, prioridad 1.0; `/` → `/es` con **308** (hoy 302). H1 «Desarrollador full stack especializado en **React Native.**» seguido del **párrafo de entidad** (40–60 palabras: quién, qué, para quién, dónde, cómo contratar; mismo texto que JSON-LD, `llms.txt` y perfiles). H2: «Tres formas de trabajar conmigo» (`ServicesStrip`), «Apps y webs en producción» (`ProjectGrid`), «Packs con precio cerrado» (`PackTeaser`, con los «desde» en el HTML del servidor), «Stack con el que trabajo», «¿Hablamos de tu proyecto?». Enlaza a hub, freelance, packs, tres fichas, sobre mí y una o dos guías de precio con anclas descriptivas. JSON-LD: `WebSite` + `Person` (globales) + `WebPage` + `ProfessionalService`. `<title>` «Desarrollador React Native y full stack · josecoded» (plantilla `%s · josecoded`). Sin migas. La ciudad entra en el párrafo de entidad solo si Jose la publica (Q14).

**Preguntas.** Q1 (esta web como proyecto destacado), Q2 (vocabulario de fases), Q14 (ciudad).

---

### P2 Servicios `/servicios` (`#contratacion`, `#freelance`, `#packs`)

**Para quién y para qué.** Cada vía habla solo a su visitante y cierra la decisión de contactar. Es la página con más valor comercial del sitio.

**Acción primaria.** Una por vía, no una por página: contratación → «Descargar CV»; freelance → «Pedir propuesta» (`/contacto?via=freelance`); packs → «Pedir este pack» (`/contacto?via=pack&pack=…`). La `WayNav` pegajosa hace que la vista activa tenga una sola primaria.

**Qué aporta valor, en orden.**

| # | Sección | Vía | Por qué |
|---|---|---|---|
| 1 | `WaySection` ×3 con «Para quién» arriba (hecho) | todas | Claridad: el visitante confirma que está en su vía |
| 2 | `PackCompare` + `ExtraList` | packs | Claridad y confianza: qué incluye, semanas, precio; extras con su facturación (`once/monthly/yearly`) |
| 3 | **`PackConfigurator`** (nuevo, opcional): web / app / las dos + extras → importe «desde» calculado en vivo desde `packs` y `extras` | packs | Claridad para el no técnico y muestra técnica (lee la base, suma, enlaza a contacto con la selección). Coste M, valor alto. **Q3** |
| 4 | `RateFigure` (hecho) + **`TaskExamples`** (nuevo): tres tareas típicas con su tamaño orientativo («Pantalla nueva con API: 1–2 días», «Auditoría de rendimiento: 1 día», «Publicar en tiendas: medio día») | freelance | Claridad: convierte «por hora» en algo que el cliente puede comparar con su necesidad |
| 5 | **`HowIWorkInTeams`** (nuevo, tres líneas con enlaces): PR por bloque, CI visible, revisión, repo público de esta web | contratación | Prueba para el recruiter: es la única vía sin precio, necesita evidencia |
| 6 | **`WhatINeedFromYou`** (nuevo): lista corta por pack (textos, dominio, cuentas de tiendas, logo) | packs | Confianza: baja la ansiedad del comprador y evita bloqueos del proyecto |
| 7 | `Steps` (cómo trabajo, 5 pasos) | todas | Claridad; el mismo componente que `PhaseSteps` del área (T7) |
| 8 | `Faq` con `<details>` nativo | todas | Confianza; las preguntas son las que el asistente recibe de verdad (se revisan con el chat vivo) |
| 9 | `Closing` | todas | Salida |

**Quitar.** «Por qué elegirme» con iconos, tablas comparativas con más de 8 filas, precios tachados, «oferta limitada», testimonios.

**Estados.** Esqueleto en importes (forma exacta, sin CLS); `show_prices` apagado → «precio a consultar» y el configurador desaparece; fallo de lectura → vías sin importes y aviso discreto (hecho en el plan).

**Interacción.** `WayNav` con el mismo indicador deslizante que la cápsula; `PackCompare` en móvil con `scroll-snap` y puntos; en el configurador, el importe cambia con un `transition` de número (sin contador animado largo); el plazo de cada pack se dibuja como anillo coral parcial (T3).

**Datos.** `packs`, `extras`, `rates` por las vistas públicas. **Falta:** `packs.requires_es/en` (qué necesito de ti) o, mejor, contenido estático `content/services/requirements.json` por `code` de pack; `content/services/task-examples.json` para `TaskExamples`; para el configurador, `packs.kind enum web | app | both` (hoy no existe: el configurador no sabe qué pack es «las dos»); fecha de actualización de precios (de `price_changes`) para el texto citable.

**SEO.** Es la pantalla donde SEO y valor chocan con una decisión cerrada. `seo.md` propone (**S1, toca 2.2, Q12**) `/servicios` como **hub** más dos hijas indexables, `/servicios/freelance` («programador freelance por horas», transaccional) y `/servicios/packs` («precio app móvil», transaccional); «contratación» se queda como sección del hub (navegacional, los recruiters llegan por LinkedIn). Un `#fragmento` no posiciona por separado, y freelance y packs son búsquedas distintas. Desde el punto de vista del valor, la división también ayuda: cada hija tiene una sola primaria, sus `TaskExamples` o `PackCompare`, sus «proyectos parecidos» y su FAQ, sin una página larguísima. La `WayNav` se conserva en el hub y pasa a ser navegación entre páginas (`aria-current="page"`), no por anclas. Si Jose mantiene 2.2, todo lo de arriba vale con anclas y se pierde solo posicionamiento en esas dos queries.
- Hub: H1 «Desarrollo de apps y webs, tres formas de **trabajar juntos.**» (el actual «Tres formas de trabajar juntos.» no lleva keyword) + párrafo de entidad; H2 «Contratación: desarrollador React Native en tu equipo» (H3 «Qué aporto», «CV y disponibilidad»), «Freelance por horas o por tarea» (resumen + enlace), «Packs de web y app con precio cerrado» (resumen + enlace), «Cómo trabajo» (`Steps`, H3 por paso), «Preguntas frecuentes». `<title>` «Servicios de desarrollo de apps y webs · josecoded».
- Freelance: H1 «Desarrollador React Native freelance, por horas o **por tarea.**»; H2 «Tarifa por hora y presupuesto por tarea» (`RateFigure` con cifra real en el HTML y fecha), «Qué tipo de encargos acepto» (H3: funcionalidad nueva, auditoría, rescate, integración de IA = `TaskExamples`), «Cómo es una colaboración», «Proyectos parecidos» (fichas con `relatedService = freelance`), «Preguntas frecuentes». Enlaza a contacto `?via=freelance` y a la guía «por horas o por tarea».
- Packs: H1 «Packs de web y app con precio y fecha **cerrados.**»; H2 «Compara los packs» (H3 «Pack {nombre}: desde {precio} €»), «Qué incluye cada pack», «Extras y mantenimiento», «Cuánto tarda», «Preguntas frecuentes sobre precios». `PackCompare` pinta todos los packs en el DOM también en móvil (carrusel por CSS). Enlaza a contacto `?pack={slug}` y a las guías de precio, publicación y plazos. Fase 2: `/servicios/packs/[slug]` cuando haya más de un pack con contenido propio.
- JSON-LD en las tres: `ProfessionalService` con `OfferCatalog` (freelance `UnitPriceSpecification` HUR; cada pack `Offer` con `minPrice` y `eligibleDuration`), `FAQPage` solo con preguntas visibles, `BreadcrumbList`. Migas `Inicio › Servicios › Packs`.
- Los precios en texto citable (GEO): «La tarifa por hora es de X €. Los packs empiezan en Y € (web) y Z € (app). Precios actualizados el {fecha}». Hoy `rateFixture` es `{{DATO}}`: sin cifra no hay GEO de precios.

**Preguntas.** Q3 (configurador), Q12 (hub + hijas).

---

### P3 Proyectos `/proyectos`

**Para quién y para qué.** Prueba de oficio. El recruiter busca apps publicadas; el cliente freelance, algo parecido a lo suyo; el de pack, que se ve «terminado».

**Acción primaria.** Abrir una ficha (la primera tarjeta en foco).

**Qué aporta valor, en orden.**

1. `ProjectCard` apilada con: nombre, tipo, **estado honesto** (`live / wip / archived` con badge), una línea de resultado con cifra y fuente, stack en chips, enlace verificable directo (tienda o web) además de «Ver caso». Prueba.
2. `FilterTabs` Todos · Apps · Webs en la URL. Claridad. (Añadir «IA» si hay dos o más proyectos de IA; si no, no.)
3. **Esta web** como tarjeta más (T1): «josecoded · esta web · en producción · Lighthouse 9x · ver código». Prueba y diferenciación.
4. `EmptyState` por filtro con enlace al filtro que sí tiene (ya en el plan).

**Quitar.** Rejilla tipo masonry, zoom de imagen al hover, contadores de vistas, «más proyectos próximamente» como tarjeta.

**Estados.** Estático, sin esqueleto; vacío por filtro.

**Interacción.** Tabs con indicador deslizante (mismo motivo que la cápsula). **Transición compartida** lista → ficha: `view-transition-name` por slug en la portada y el título (T4). `reveal` al entrar en viewport.

**Datos.** MDX con `projectSchema`. **Falta en el esquema actual:** `kind enum app | web | ai` (sin él `FilterTabs` no puede filtrar; `seo.md` lo pide también), `metric { label, value, source? }` (la cifra de la tarjeta), `period` (año de inicio y fin o «en curso»), `gallery[]` (hoy solo `cover`), `retro` opcional (ver P4), y los de SEO: `sector`, `headline`, `description` (≤ 155), `relatedService enum freelance | packs | hiring`.

**SEO.** Query «portfolio desarrollador react native» (investigación comercial, dificultad baja). URL `/es/proyectos`, prioridad 0.8; **`noindex` mientras muestre el vacío «Pronto»** (evita un *soft 404*; hoy es el caso). H1 «Proyectos: apps React Native y webs **en producción.**»; cada tarjeta con H2 = nombre del proyecto, lista plana. `FilterTabs` con `<a href>` reales y canonical a la URL sin filtro. JSON-LD `CollectionPage` + `ItemList`. Migas `Inicio › Proyectos`. `<title>` «Proyectos React Native y web · josecoded».

---

### P4 Ficha de proyecto `/proyectos/[slug]`

**Para quién y para qué.** Dos minutos de caso real: reto, qué hice, resultado verificable. El recruiter mira decisiones y papel; el cliente, parecido y resultado.

**Acción primaria.** «Hablar de un proyecto así» → `/contacto?via=…` preseleccionada según `kind` (app o web → `pack`; con `role` de colaboración → `freelance`).

**Qué aporta valor, en orden.**

1. `ProjectHead`: nombre, tipo, estado, **enlace principal arriba** (tienda o web), mi papel y período. Prueba primero.
2. `CaseSection` ×3 (El problema · Qué hice · Resultado) con cifras y su fuente. Claridad.
3. `ScreenGallery` con `scroll-snap` y teclado; omitida sin capturas. Prueba visual.
4. **`Retro`** (nueva, opcional por proyecto): «Qué haría distinto hoy», tres líneas. Confianza: el recruiter valora el criterio más que la perfección; casi nadie lo publica. **Q8**
5. `Chip` de stack enlazando a `/sobre-mi#stack` (misma fuente, `cv.json`). Coherencia.
6. `StoreLinks` y `PrevNext`. Navegación.
7. `Closing` con la primaria.

**Quitar.** Testimonio del cliente salvo que sea real y enlazable; logos; «ver más proyectos» en rejilla (basta `PrevNext`).

**Estados.** 404 propia si el slug no existe; galería omitida; `status = wip` muestra «en desarrollo» y no promete enlace.

**Interacción.** Entrada con la transición compartida desde la lista; la portada se convierte en la primera captura de la galería. Galería navegable con flechas y `aria-roledescription="carrusel"` solo si hay más de una captura.

**Datos.** MDX. **Falta:** los campos listados en P3 (`kind`, `metric`, `period`, `gallery`, `retro`, `sector`, `headline`, `description`, `relatedService`). Para esta web: `metric` se puede alimentar desde la última ejecución de Lighthouse CI (T1).

**SEO.** Query = nombre del proyecto (navegacional) y «app {sector} react native». URL `/es/proyectos/[slug]`, prioridad 0.7. H1 «{Nombre}, {qué es en 3–5 palabras} con **{tecnología o tipo}.**» (`headline` del frontmatter); H2 «El reto», «Qué hice», «Stack», «Resultado», «Más proyectos». Bloque **«¿Necesitas algo así?»** que enlaza al servicio que la vendió (`relatedService`) con ancla descriptiva, `PrevNext` y un artículo relacionado: es la misma primaria de valor («Hablar de un proyecto así») con el enlace al servicio además de a contacto. JSON-LD: app → `MobileApplication` (`operatingSystem`, `applicationCategory`, `installUrl`, `creator` → Person, **sin `aggregateRating` inventado**); web → `CreativeWork`; más `BreadcrumbList`. Migas `Inicio › Proyectos › {nombre}`. `<title>` «{Nombre}: {tipo} con {tech} · josecoded»; descripción = `description`. OG `summary_large_image` con imagen generada en estilo B (T9).

**Preguntas.** Q8.

---

### P5 Sobre mí `/sobre-mi` (`#stack`)

**Para quién y para qué.** Sobre todo el recruiter; también el cliente que quiere saber quién hay detrás. Confianza y perfil.

**Acción primaria.** «Descargar CV» (PDF es; en cuando se publique). Secundaria: contacto.

**Qué aporta valor, en orden.**

1. `PageHead` con retrato y tres líneas concretas (qué hace, desde cuándo, dónde). Confianza.
2. **`HowIWork`** (`PrinciplesList` con nombre nuevo): cuatro o cinco hechos comprobables sobre cómo trabaja: entregas por PR, CI en cada cambio, accesibilidad por componente, decisiones escritas, **método con agentes de IA** si Jose lo quiere contar (**Q10**). Cada punto enlaza a la prueba en el repo de esta web. Prueba.
3. `Timeline` con fechas reales y una línea por etapa. Claridad.
4. `StackGroups` desde `cv.json`, por grupo (apps, web, datos y APIs, IA), con **«último uso»** y «en producción en: proyecto X» en vez de niveles. Confianza (honesto y verificable).
5. `CredentialList` (formación, certificaciones) solo con fecha y entidad.
6. `LinkRow`: LinkedIn, GitHub, CV es/en.
7. `Closing`.

**Quitar.** Barras de habilidades, porcentajes, nubes de etiquetas, aficiones, «mi misión», foto de stock.

**Estados.** Estático. El PDF se enlaza con `download`; si falta (`{{DATO}}`), el botón no se renderiza.

**Interacción.** `Timeline` con `reveal` por hito; ancla `#stack` con desplazamiento bajo la cápsula; copiar email en `LinkRow` anuncia en el toast.

**Datos.** `content/about.mdx`, `content/cv.json`. **Falta:** el esquema zod de `cv.json` no está definido en ningún documento; propuesta: `{ basics, experience[], education[], stack: { group, items: [{ name, since, lastUsed, inProduction: slug[] }] }[], links }`. Alimenta Sobre mí, el PDF (T10), el JSON-LD `Person` y el criterio de Radar.

**SEO.** Query de marca «jose carlos sánchez programador» / «josecoded» (navegacional). URL `/es/sobre-mi`, prioridad 0.7. H1 «Soy Jose Carlos Sánchez, desarrollador **full stack.**» + párrafo de entidad; H2 «Trayectoria», «Cómo trabajo» (`HowIWork`), «Stack» (`id="stack"`, H3 por grupo: móvil, web, backend, IA), «Formación y certificaciones», «CV y perfiles». Entidad única (S3): el mismo nombre, alias, descripción y ciudad en la web, el JSON-LD, `llms.txt`, LinkedIn, GitHub y los perfiles de freelance; enlaces a perfiles con `rel="me"`. El PDF del CV con `X-Robots-Tag: noindex` y `Link: rel="canonical"` a esta página. JSON-LD `ProfilePage` con `mainEntity` → `Person` (`hasCredential`, `alumniOf`). Migas `Inicio › Sobre mí`. `<title>` «Jose Carlos Sánchez, desarrollador full stack · josecoded».

**Preguntas.** Q10.

---

### P6 Contacto `/contacto` (`?via=hiring|freelance|pack&pack=…`)

**Para quién y para qué.** Salida de todas las páginas. Tiene que ser corto, decir qué pasa después y no perder al que viene con prisa.

**Acción primaria.** «Enviar».

**Qué aporta valor, en orden.**

1. `ViaSelector` segmentado, preseleccionado por URL. Claridad.
2. `ContactForm` mínimo (nombre, email, mensaje) **más un campo por vía**, no más: `hiring` → empresa y enlace a la oferta (opcional); `freelance` → «para cuándo» (opcional); `pack` → pack elegido (desde el selector) y «tienes dominio / cuentas de tiendas» (sí/no/no sé). Claridad para el CRM: el closer ve la vía y el pack sin preguntar.
3. **`WhatHappensNext`** (nuevo): tres pasos cortos («Lo leo yo», «Te respondo en 24–48 h laborables», «Propuesta concreta o llamada de 20 min»). Confianza: la mayor caída en formularios es no saber qué pasa después.
4. `QuickContact`: email con copiar; WhatsApp y `CalEmbed` cuando haya datos (2.9).
5. «¿Prefieres preguntar antes?» → abre `ChatPanel` con el contexto de la vía. Conversión.

**Quitar.** Teléfono obligatorio, asunto, captcha visible, mapa, «horario de atención», adjuntos en la v1.

**Estados.** Los cinco de `pantallas.md`; el **éxito sustituye al formulario** por un estado con los siguientes pasos y «enviar otro»; 429 con alternativas (email, chat). Error de validación en línea con foco en el primer campo inválido; funciona sin JS.

**Interacción.** Segmentado con pulgar deslizante; botón con carga; al éxito, el botón se transforma en marca de verificación y la tarjeta cambia con View Transition; el email copiado confirma en el toast.

**Datos.** Escribe `contacts` + `activities` (`form`) vía `public_submit_contact`; lee `packs`. **Falta en `datos.md`:** la RPC solo crea el contacto; para que el CRM vea la vía y el pack desde el minuto uno debería crear también el `deal` (`stage = new`, `via`, `pack_id`) o, como mínimo, guardar `via` y `pack_id` en la actividad. Recomendación: crear el `deal`. Campos extra por vía (`company`, `job_url`, `wanted_by`, `has_domain`) caben en `activities.body` estructurado o en columnas nuevas de `contacts` (`organization` ya existe; `job_url` no). Recomendación: `organization` + cuerpo de la actividad; sin columnas nuevas.

**SEO.** Query «presupuesto desarrollo app» (transaccional; el tráfico es casi todo interno). URL `/es/contacto`, prioridad 0.6; `?via` y `?pack` con canonical a la URL sin parámetros. H1 «Cuéntame tu proyecto y te propongo **un plan.**» [R]; H2 «Escríbeme», «Otras formas de contacto», «Qué pasa después» (= `WhatHappensNext`, con el plazo de respuesta como `{{DATO}}`). Es el destino de todo el enlazado (hub-and-spoke): servicios, fichas y guías llegan con `?via` o `?pack`. JSON-LD `ContactPage` + `BreadcrumbList`. `<title>` «Contacto y presupuesto · josecoded».

---

### P7 Chat `/chat` y `ChatPanel`

**Para quién y para qué.** Visitantes: preguntar lo que la web no dice (disponibilidad, encaje, precio aproximado) a un asistente que sabe de verdad. Usuarios con cuenta: hablar con Jose. Es la pieza que más distingue el sitio si funciona bien, y la que más daño hace si parece un bot de catálogo.

**Acción primaria.** Enviar mensaje.

**Qué aporta valor, en orden.**

1. **Respuestas con fuente:** el asistente cita de dónde saca lo que dice (chip «Servicios › Packs», «Proyecto X») porque el RAG indexa el contenido del repo. Confianza y prueba técnica.
2. **Arranques sugeridos según la página** (`Starters`): en `/servicios#packs`, «¿Qué pack me conviene para…?»; en una ficha, «¿Podrías hacer algo así para…?»; en la home, los tres de P1. Conversión: elimina el cuadro vacío.
3. **Handoff a contacto** (`HandoffCard`): cuando el visitante muestra intención (pide presupuesto, quiere hablar con Jose), el asistente ofrece una tarjeta «Deja tu email y te escribe Jose» que crea el lead con `source = chat` enlazando el hilo. Conversión. Con consentimiento explícito del visitante (botón), nunca extrayendo el email del texto. **Q5**
4. Etiquetas «Asistente de Jose» / «Jose» y `TakeoverBand` («Jose ha entrado»). Confianza y legalidad.
5. `OfflineNotice` honesto cuando Omen duerme («Jose te responde en cuanto pueda; deja tu email si quieres aviso» → mismo `HandoffCard`). Confianza.
6. `SaveThreadHint` para usuarios con cuenta. Continuidad.
7. `QuotaNotice` con lo que puede hacer el visitante (email, volver mañana).

**Quitar.** Avatar de robot, «escribiendo…» falso con retardo artificial, sonidos, valoraciones por mensaje con estrellas, sugerencias de producto genéricas.

**Estados.** Esqueleto del hilo; enviando; «pensando» (indicador discreto con el anillo coral girando, T3); cuota; sin conexión; Omen apagado; hilo archivado (lectura).

**Interacción.** Panel `<dialog>` no modal con foco gestionado y Esc; mensajes entran con escalonado corto; el composer crece hasta 6 líneas; `Enter` envía, `Shift+Enter` salta de línea; la respuesta llega por Realtime en trozos (sin streaming de tokens, 4.2) y la burbuja crece sin saltos (`height: auto` interpolado o reserva mínima).

**Datos.** `chat_threads`, `chat_messages`, `private.chat_quota`, `private.heartbeat`. **Falta:** `chat_messages.page_path` (o `chat_threads.last_page`) para que el asistente sepa desde dónde escribe el visitante; `chat_messages.kind enum text | handoff | system` para las tarjetas; `chat_messages.sources text[]` (refs de `rag_documents`) para los chips de fuente; `contracts/jobs/chat.reply.json` debe llevar `page_path` y devolver `sources`.

**SEO.** `/es/chat` **`noindex, follow`** (contenido dinámico, vacío para el bot) y fuera del sitemap; H1 «Pregunta al asistente de **Jose.**». El valor SEO del chat es indirecto: la guía sobre asistentes de IA (artículo 9 de `seo.md`) enlaza al chat como prueba viva.

**Preguntas.** Q5.

---

### P8 Blog `/blog` y `/blog/[slug]`

**Para quién y para qué.** Contenido orgánico (SEO y GEO). El contenido que más vale aquí es el que nadie más puede escribir: **el diario de construcción de esta web** (decisiones, por qué sin comentarios, cómo se hizo el hero en CSS, RLS, Omen) y guías de React Native con código real.

**Acción primaria.** Índice: abrir un artículo. Artículo: leer; secundaria «siguiente artículo».

**Qué aporta valor, en orden.**

1. `Prose` cuidada con `CodeBlock` (copiar, nombre de fichero, líneas resaltadas) y `Toc` con `aria-current`. Claridad.
2. **El borde de la cápsula como progreso de lectura.** Ya lo es: el scroll de la página llena la cápsula. `ReadingProgress` como componente aparte sobra; se elimina (coherencia y menos código).
3. `PostTeaser` con fecha, tiempo de lectura calculado y etiquetas; relacionados por etiqueta. Navegación.
4. «Probar en el lab» si el artículo tiene demo (`lab` en frontmatter). Prueba.
5. `ShareRow` sin contadores.

**Quitar.** Contadores de seguidores en la caja de autor (la caja en sí se queda: foto, una línea, enlace a `/sobre-mi`, «actualizado el»), comentarios (2.7), nube de etiquetas, «artículos populares», tiempo de lectura inventado.

**Estados.** Interruptor apagado → 404 y sin enlace en la cápsula ni en el sitemap; vacío diseñado; `draft` oculto en producción.

**Interacción.** `Toc` pegajosa con indicador deslizante; copiar código anuncia en el toast; transición compartida teaser → artículo por título.

**Datos.** MDX con `blogSchema`. **Falta:** `updated`, `category` (enum `precios · react-native · desarrollo-web · ia · trabajar-con-freelance`), `cover {src, alt}`, `faq [{q, a}]`, `relatedService`, `relatedPosts` opcional, `lab` (slug de demo) opcional. Tiempo de lectura y relacionados se calculan en build desde el frontmatter.

**SEO.** Índice: query «guías desarrollo apps y webs»; URL `/es/blog`, paginado `/es/blog?pagina=2` con canonical propio; H1 «Guías sobre apps, webs y **precios reales.**», H2 por teaser. Categorías en `/es/blog/tema/[categoria]`, `noindex` hasta tener tres artículos; las etiquetas no generan páginas. Artículo: URL plana `/es/blog/[slug]` (kebab-case, sin tildes ni fechas, ≤ 5 palabras; un slug publicado no cambia, si cambia 308); H1 = `title` con las últimas palabras en coral; H2 por sección (salen en `Toc`), H2 final «Preguntas frecuentes» si hay `faq`. Cada artículo enlaza al servicio que alimenta en el primer tercio y en un bloque final, a dos artículos de su categoría y a `/sobre-mi` desde la caja de autor; 3–6 enlaces internos por 1.000 palabras. JSON-LD `Blog` + `ItemList` en el índice; `BlogPosting` (`author` → Person, `dateModified`, `mentions` → servicio) + `FAQPage` + `BreadcrumbList` en el artículo; `og:type article`. Migas `Inicio › Blog › {categoría} › {título}`. **Plan editorial** (`seo.md` §6): diez artículos, los de precio primero («Cuánto cuesta hacer una app móvil en España», «Precio de una página web para un negocio», «Por horas o por tarea»…); coinciden con T14 (diario de construcción) solo en parte: el diario aporta autoridad técnica y marca; las guías de precio, tráfico comercial. Los dos tipos conviven; las guías van antes. Textos por `redactor` en el Mac; aquí se dejan esqueleto y cifras como `{{DATO}}`.

---

### P9 Legales `/legal/*`

**Para quién y para qué.** Obligación legal y, bien hechos, confianza: cliente y closer ven que el chat anónimo, la cuota por IP y los encargados (Groq, Resend, Cloudflare, Supabase) están explicados.

**Acción primaria.** Ninguna; leer.

**Valor.** `Prose` + `Toc`; **resumen en cinco líneas** al principio de privacidad y cookies (qué guardo, cuánto, para qué, con quién, cómo lo borras); fecha de actualización visible; sin banner de cookies si solo hay cookies técnicas (la del chat anónimo es técnica: se explica, no se pide consentimiento).

**Quitar.** Banner de cookies innecesario, texto copiado de generador sin adaptar.

**Datos.** MDX con `legalSchema` (`updated`). `{{DATO}}` pendientes.

**SEO.** Aviso y privacidad indexables con prioridad 0.2; cookies `noindex`. Sin grafo propio. Migas `Inicio › Legal › {página}`.

---

### P10 Errores y estados de página

**Para quién y para qué.** Que un error no parezca abandono. Cada pantalla de error es una oportunidad de continuar.

**Acción primaria por variante.** 404 → «Volver al inicio» (secundaria «Ver proyectos»); 500 → «Reintentar»; 429 → «Escribir por email»; mantenimiento → ninguna (muestra «volvemos a las HH:MM» si hay hora); sin conexión → banner con reintento automático.

**Valor.** `ErrorPage` (hecho) con texto que dice qué pasó en una frase; 404 con **sugerencias por parecido de ruta** (si la URL contiene «proyecto», enlaza a `/proyectos`; coste S); mantenimiento con mensaje y hora desde `site_settings`; los errores de las zonas privadas conservan el `AppShell` para no perder el contexto.

**Quitar.** Ilustraciones de astronautas, códigos de error gigantes como decoración (el 404 del prototipo ya es sobrio), humor.

**Datos.** `site_settings.maintenance`. **Falta:** forma del valor: `{ on: boolean, message_es?: string, until?: timestamptz }`.

**SEO.** Códigos reales: 404 con `notFound()`, mantenimiento **503 + `Retry-After`** (de `until`), cuota 429, error 500; todas `noindex`. El H1 actual del 404 («Esta pantalla no existe») no lleva keyword y es correcto así.

---

## 2. Auth y admin base

**SEO.** Las pantallas de acceso y todas las zonas privadas llevan cabecera `X-Robots-Tag: noindex, nofollow` (robots.txt no basta para sacar del índice), `Disallow` en `robots.ts` y quedan fuera del sitemap. Nada más que hacer aquí.

### U1 Entrar `/entrar`

**Acción primaria.** «Enviarme un código».

**Valor.** Un campo con autofoco; Google debajo como alternativa, no competencia; una línea «Las cuentas son por invitación» que ahorra intentos de registro; respuesta neutra siempre (no revela si el email existe). Confianza y seguridad visible sin fricción.

**Quitar.** Contraseña, «recuérdame», enlaces de marketing, logos de proveedores grandes.

**Estados.** Enviando; «código enviado a …» (pasa a U2 en la misma tarjeta); error de proveedor con reintento; demasiados intentos con tiempo de espera visible.

**Interacción.** La `AuthCard` cambia de paso con View Transition (misma tarjeta, no otra página visual); el botón pasa a carga y después a hecho.

**Datos.** Supabase Auth. Nada que añadir.

### U2 Código `/entrar/codigo`

**Acción primaria.** «Entrar» (se envía solo al completar las seis casillas).

**Valor.** `OtpInput` con avance automático, pegado de los seis dígitos, teclado numérico en móvil (`inputmode`), reenviar con cuenta atrás; mensaje de error que distingue incorrecto de caducado.

**Estados.** Verificando; incorrecto; caducado (ofrece reenviar); bloqueado por intentos.

**Interacción.** Las casillas se rellenan con un micro-escalonado al pegar; en error, sacudida corta solo sin `reduced-motion` y foco en la primera casilla.

### U3 Segundo factor `/entrar/totp`

**Valor.** Mismo `OtpInput`; «He perdido el dispositivo» abre un formulario corto que escribe a Jose (crea notificación y email por `outbox`), no un enlace `mailto`. Confianza.

**Datos.** Supabase MFA; `notifications` + `private.outbox` para la pérdida de dispositivo. **Falta:** evento `totp_lost` en el enum de eventos.

### U4 Invitación `/invitacion/[token]`

**Acción primaria.** «Aceptar y entrar».

**Valor.** `Steps` con los pasos reales (datos · autenticador si es personal · listo); la invitación dice quién invita y a qué (rol, proyecto o cartera); `TotpEnroll` con QR y código manual copiable; al terminar, aterriza en su zona con un vacío que explica qué hacer primero. Claridad y primera impresión de las zonas privadas.

**Estados.** Token caducado o usado con «pide una nueva invitación» (escribe a Jose); enrolando; error de código.

**Datos.** `invitations` por hash. Nada que añadir.

### U5 Mi cuenta `/cuenta`

**Acción primaria.** «Guardar».

**Valor.** Nombre e idioma; `TotpManage` (cambiar dispositivo con confirmación del nuevo antes de borrar el viejo); `SessionList` con dispositivo, lugar aproximado y «cerrar»; borrado de cuenta en dos pasos que crea trabajo para el admin.

**Quitar.** Avatar subible (no aporta en este producto), tema claro/oscuro (el estilo es uno).

### D1 Resumen del admin `/admin`

**Acción primaria.** «Siguiente pendiente»: enlaza a la primera cosa que requiere a Jose (lead sin dueño más antiguo, hilo sin leer, historia por decidir), en ese orden.

**Valor.** `CounterCell` ×n que enlazan a su lista filtrada; `OmenStatus` con edad del último latido, versión y cola; `RecentActivity` (últimos 20 eventos de auditoría y formularios). Los contadores se actualizan solos (Realtime sobre `notifications` del admin basta; coste S).

**Quitar.** Gráficas, saludos, «consejos».

**Estados.** Esqueleto por celda; Omen sin latido > 2 min → rojo y aviso; sin nada pendiente → vacío que lo dice.

**Datos.** RPC `admin_counters()`, `omen_status`, `private.jobs`. **Falta:** RPC `admin_recent_activity(limit)`.

### D2 Usuarios `/admin/usuarios`

**Acción primaria.** «Invitar».

**Valor.** Tabla densa; `InviteSheet` con **previsualización de la comisión** («con un cierre de 3.000 € cobrados: closer 300 €, su closer padre 150 €») al escribir las tasas; invitaciones pendientes con reenviar y anular; `ReassignSheet` que dice cuántos contactos y oportunidades abiertas se mueven antes de confirmar. Claridad en lo que toca dinero.

**Estados.** Vacío inicial («Invita al primer closer»); cada acción con confirmación y carga; invitación caducada marcada.

**Datos.** `profiles`, `invitations`, `contacts` (contadores). **Falta:** `invitations.resent_at` y `resend_count`.

### D3 Precios `/admin/precios`

**Acción primaria.** «Guardar».

**Valor.** `PriceItemSheet` con **vista previa en vivo** de la tarjeta tal como se verá en `/servicios` (misma `PackCard`) mientras se edita; `PriceHistory` por fila; archivar lógico; ocultar sin archivar; reordenar con teclado. Seguridad al tocar lo que ve el público.

**Estados.** Guardando; conflicto si otro cambió (recarga); caché invalidada con aviso «ya visible en la web».

**Datos.** `packs`, `extras`, `rates`, `price_changes`. **Falta:** `packs.kind` (ver P2) si se hace el configurador; `packs.highlight` bool opcional para destacar uno en el comparador (hoy el prototipo destaca el del medio a mano).

### D4 Secciones y sistema `/admin/sistema`

**Acción primaria.** Cambiar un interruptor (acción inmediata con confirmación solo en `maintenance`).

**Valor.** Cada interruptor muestra quién y cuándo lo cambió; `maintenance` pide mensaje y hora opcional; `OmenStatus` ampliado (modelos cargados, versión, trabajos por tipo y estado); `JobTable` con reintentar y cancelar y el error legible.

**Datos.** `site_settings`, `heartbeat`, `jobs` por RPC. **Falta:** RPC `admin_jobs(status, kind, limit)` y `admin_retry_job(id)`.

### D5 Notificaciones `/admin/notificaciones`

**Acción primaria.** «Vincular Telegram».

**Valor.** Código con caducidad y **enlace profundo** `t.me/<bot>?start=<code>` (un toque en móvil); «Enviar prueba» que confirma en la pantalla cuando llega; interruptores por evento con texto de ejemplo del mensaje que llegará.

**Datos.** `private.telegram_*`, `notification_prefs`. Nada que añadir.

### D6 Bandeja de chat `/admin/chat`, `/admin/chat/[id]`

**Acción primaria.** «Responder» (como Jose).

**Valor.** Lista + hilo a dos columnas en escritorio; sin leer primero; `AiSwitch` con estado claro («La IA responde en este hilo» / «Respondes tú»); el visitante ve `TakeoverBand` al primer mensaje de Jose; `CreateContactSheet` prellenada con lo que se sepa (sin adivinar emails); la primera línea del visitante como título del hilo; página desde la que escribió. Hilo en vivo por Realtime.

**Quitar.** Respuestas enlatadas en la v1, etiquetas de color, asignación a agentes (solo hay uno).

**Estados.** Vacío; esqueleto; archivado en lectura; Omen apagado con aviso en los hilos con IA.

**Datos.** `chat_threads`, `chat_messages`, `contacts`. **Falta:** `page_path` (ver P7); opcional `chat_threads.title` derivado (vista, no columna).

---

## 3. CRM `/crm`

Zona `noindex`. **SEO: no aplica.**

### K1 Resumen `/crm`

**Acción primaria.** «Ver vencidas» → K2 con `?due=1`.

**Valor.** `DueList` ordenada por fecha (lo primero que se ve es lo primero que hay que hacer); `CounterCell` por fase; comisiones pendientes y aprobadas con importe; `TeamCell` para el closer con subclosers (agregados, sin nombres). Lo que tengo que hacer hoy, sin más.

**Estados.** Esqueleto; sin vencidas → «al día» con la siguiente acción futura.

**Datos.** RPC `crm_counters()`. Nada que añadir.

### K2 Contactos `/crm/contactos`

**Acción primaria.** «Nuevo contacto» (y en el vacío inicial, «Importar» como secundaria).

**Valor.** Tabla densa con filtros en la URL (compartibles, se recuerdan con el botón atrás); **acciones rápidas en fila**: cambiar fase y fijar siguiente acción sin abrir la ficha (`StageSheet`, fecha en línea); columna «origen» con icono (formulario, chat, Radar, importación) porque dice de dónde llegan los buenos leads; `OwnerFilter` para el admin.

**Quitar.** Selección múltiple y acciones en lote en la v1; vistas guardadas (la URL ya lo es); avatares.

**Estados.** Esqueleto de filas con la forma de la tabla; vacío por filtro; vacío inicial con las dos acciones.

**Interacción.** Cambio de fase optimista con deshacer en el toast (5 s); fila recién creada resaltada un instante; teclado: flechas entre filas, `Enter` abre.

**Datos.** `contacts`, `deals`, `profiles`. **Falta:** índice por `owner_id, next_action_at` y `last_activity_at`; `deals` «abierta por contacto» como vista `contact_open_deal`.

### K3 Contacto `/crm/contactos/[id]`

**Acción primaria.** «Añadir actividad» (nota, llamada, reunión): es lo que más se hace. Cambiar de fase, ganar y perder son secundarias dentro de `DealCard`.

**Valor.** `ContactHead` con email copiable y enlaces; `NextActionField` siempre visible arriba; `DealCard` con la pipeline como segmentado; **«Marcar ganada» muestra la comisión que se va a crear** (base, % y cifras del closer y del subcloser) antes de confirmar; `ActivityTimeline` que mezcla notas, formulario, chat y cambios de fase en una sola línea de tiempo; `InviteClientSheet` (admin) al ganar, que crea el proyecto y la invitación en un paso.

**Estados.** Esqueleto; 404 si no es de mi cartera; conflicto de fase con recarga; oportunidad cerrada en lectura.

**Interacción.** El composer de actividad es un campo que crece; `Cmd/Ctrl+Enter` guarda; al ganar, la celda de la comisión en K4 aparece ya creada (Realtime o revalidación).

**Datos.** `contacts`, `deals`, `activities`, `commissions`, `chat_threads`. **Falta:** el closer necesita leer sus propias tasas (`closer_rate`, y la `parent_rate` que le aplica) para la previsualización; RLS de `profiles` ya lo permite para lo propio, falta la del padre: exponer por RPC `my_commission_rates()`.

### K4 Comisiones `/crm/comisiones`

**Acción primaria.** Admin: «Aprobar». Closer: ninguna (lectura); secundaria «Exportar CSV».

**Valor.** `CommissionTotals` por estado con importes; tabla con las dos columnas de tasa e importe congelados (7.6); **exportar CSV** del filtro actual (el closer lo necesita para facturar; coste S); fecha de pago y nota visibles.

**Datos.** `commissions`, `deals`, `profiles`. Nada que añadir.

### K5 Importar `/crm/importar`

**Acción primaria.** «Importar».

**Valor.** `CsvDropzone` con validación local antes de subir (columnas, email, filas); `ImportPreview` con veredicto por fila; `ImportResult` con cifras y enlace a los creados; `ConflictQueue` del admin lado a lado. Progreso de importación con el anillo coral (T3).

**Estados.** Validación local; importando; resultado; «ya importado» por hash con enlace a la importación anterior.

### K6 Ajustes `/crm/ajustes`

**Valor.** `TelegramLinkCard` (igual que D5), `RateCard` con las tasas y un ejemplo de cálculo, enlace a `/cuenta`.

### K7 Chat con Jose `/crm/chat`

Los de P7 con `AiSwitch` solo para el admin. Valor añadido: **adjuntar un contacto al mensaje** («sobre: Nombre») para que Jose abra la ficha desde el chat (coste S; `chat_messages.contact_id` opcional). **Falta:** esa columna, o un `kind = reference` con payload.

---

## 4. Área de clientes `/area` (y D7)

Zona `noindex`. **SEO: no aplica.** Aquí es donde «ver el desarrollo en tiempo real» del brief se cumple o no.

### A1 Inicio `/area`

**Acción primaria.** «Lo que te toca»: el primer pendiente del cliente (completar una historia, subir un documento que Jose pide, aceptar un presupuesto). Si no hay nada, no hay primaria: la pantalla informa.

**Valor.**

1. `ProjectHeader` con fase y **avance como anillo coral** (`ProgressRing`, T3): el mismo motivo que la cápsula de la web pública; el cliente lo reconoce. Deleite y coherencia.
2. `PhaseSteps` con las mismas palabras que `Steps` de `/servicios` y que el hero (T7). Claridad: lo que le vendieron es lo que ve.
3. `TodoForYou`: lista corta con fecha. Claridad.
4. `RecentUpdates` en vivo: «Jose ha terminado "Pantalla de pedidos"» aparece sin recargar (Realtime sobre `tasks` y `documents`, T5). Prueba de que el proyecto avanza.
5. «Próxima entrega» (`projects.due_at` o la fecha de la siguiente tarea con fecha). Confianza.
6. Enlace a la preview del proyecto si existe (`projects.preview_url`, decisión 6.1 lo deja para después). Prueba.
7. `ProjectSwitcher` solo con más de uno.

**Quitar.** Banners de bienvenida, gráficas de burndown, «consejos», porcentajes decorativos.

**Estados.** Esqueleto; «Jose está preparando tu proyecto» con qué esperar y cuándo; varios proyectos.

**Interacción.** El anillo se anima al valor real al entrar (sin `reduced-motion`); una actualización nueva entra desde arriba y marca «nuevo» hasta que se ve.

**Datos.** `projects`, `project_progress`, `tasks`, `stories`, `documents`. **Falta:** Realtime habilitado y filtrado por RLS en `tasks`, `stories`, `documents`, `notifications` (`datos.md` solo lo prevé en `chat_messages`); `projects.preview_url` opcional; «documentos que pide Jose»: recomendación **sin tabla nueva**, son `tasks` con `assignee_id = cliente` (hoy el campo dice «freelance»; se amplía a cualquier miembro). **Q6**

### A2 Tareas `/area/tareas`, `/area/tareas/[id]`

**Acción primaria.** Abrir una tarea.

**Valor.** `PhaseBoard` de lectura; en móvil lista agrupada por fase con la fase actual abierta; `TaskRow` con «De tu historia: …» (cierra el círculo historia → tarea); **movimiento en vivo**: cuando Jose pasa una tarea a hecha, se mueve de columna delante del cliente (View Transition en la lista, T4 + T5).

**Estados.** Vacío por fase («Todavía nada en Publicar»); esqueleto.

**Datos.** `tasks`. **Falta:** Realtime (arriba).

### A3 Documentos `/area/documentos`

**Acción primaria.** «Subir».

**Valor.** `FileList` con quién y cuándo; `Uploader` con arrastrar, **progreso por fichero con anillo coral** (T3), límites visibles antes de subir (25 MB, tipos); «Jose te pide» como filas pendientes (tareas asignadas al cliente, A1); descargar con URL firmada; borrar solo lo propio con confirmación.

**Estados.** Subiendo; tipo o tamaño no permitido (antes de enviar); vacío con los tipos admitidos; cuota del proyecto cerca del límite.

**Datos.** `documents` + Storage. Nada que añadir salvo lo de A1.

### A4 Historias `/area/historias`

**Acción primaria.** «Proponer historia» (`?nueva=1`).

**Valor.** `StoryForm` con **ejemplo real relleno en el vacío** («Como dueño de la tienda quiero ver los pedidos de hoy para…») que se puede usar como plantilla; criterios como lista editable; `StoryCard` con el veredicto de Jose: horas, importe orientativo, nota; **aceptación del presupuesto por el cliente** antes de pasar a tareas: hoy el flujo es `proposed → accepted | rejected → in_tasks` y decide solo el admin; si Jose pone un importe, el cliente debería confirmarlo. Propuesta: `proposed → quoted → accepted (cliente) | declined (cliente) | rejected (admin) → in_tasks`. **Q4**

**Estados.** Vacío con ejemplo; enviando; `proposed` editable; `quoted` con botón «Aceptar presupuesto»; decidida en lectura.

**Interacción.** El formulario valida en línea; al enviar, la tarjeta aparece en la lista con estado «propuesta» y la campana de Jose suena (Telegram).

**Datos.** `stories`. **Falta:** estados `quoted` y `declined`, `client_decided_at`.

### A5 Chat `/area/chat`

Igual que K7. Valor añadido: **referenciar una tarea o historia** desde el mensaje («sobre: Pantalla de pedidos»), mismo mecanismo que K7 (`kind = reference`).

### D7 Proyectos `/admin/proyectos`, `/admin/proyectos/[id]`

**Acción primaria.** Lista: «Nuevo proyecto». Detalle: mover tarea / decidir historia (según pestaña).

**Valor.** `PhaseBoard` editable con arrastrar y con teclado; `TaskSheet` rápida; `StoryDecisionSheet` que al aceptar crea la tarea y, con importe, deja la historia en `quoted`; `FileList` con visibilidad `client/team` clara por fila; **«Ver como cliente»** (un interruptor que renderiza A1 con los permisos del cliente; coste S con una vista de solo lectura) para comprobar qué ve antes de avisarle; brief en markdown con previsualización.

**Estados.** Vacío («Crea el primer proyecto desde una oportunidad ganada o desde cero»); guardando; conflicto.

**Datos.** `projects`, `tasks`, `stories`, `documents`, `profiles`. **Falta:** lo de A1 y A4; `projects.preview_url` opcional.

---

## 5. Freelance `/freelance`

Zona `noindex`. **SEO: no aplica.** Se deja preparada: valor = que el freelance no necesite preguntar nada para empezar.

### F1 Inicio `/freelance`

**Acción primaria.** Abrir el proyecto con tareas pendientes.

**Valor.** `ProjectList` con «mis tareas pendientes» y fecha más próxima; vacío claro.

### F2 Proyecto `/freelance/proyectos/[id]`

**Acción primaria.** «Marcar hecha» en una tarea propia.

**Valor.** Brief primero (`Prose`), tareas propias arriba, resto en lectura; `FileList` `team`; nota al cerrar una tarea (va a `activities`? no: a `tasks.done_note`); nunca importes ni cliente (6.7). Progreso del proyecto como anillo (T3) sin cifras de dinero.

**Datos.** Vista `freelance_projects`, `tasks`, `documents`. **Falta:** `tasks.done_note` opcional.

### F3 Chat `/freelance/chat`

Igual que K7 con referencia a tarea.

---

## 6. Radar `/admin/radar`

Zona `noindex`. Radar es una herramienta diaria de una persona: el valor está en **triar rápido y confiar en la puntuación**.

### R1 Resumen `/admin/radar`

**Acción primaria.** «Revisar nuevos» → R2 con `?status=new&min_score=0.6`.

**Valor.** `CounterCell` por tipo y estado; `SourceStatus` con última ejecución y error legible; `OmenStatus`; «lo mejor de hoy»: los tres hallazgos nuevos con mayor puntuación, con motivos.

### R2 Hallazgos `/admin/radar/hallazgos`, `/[id]`

**Acción primaria.** En la lista: «Preseleccionar». En el detalle: «Copiar borrador» (o «Enviar» donde haya API, 8.3).

**Valor.**

1. **Puntuación explicable**: `reasons` como chips («React Native», «remoto», «tarifa ≥ mínimo», «sin web propia») y lo que resta («requiere Flutter»). Confianza en la herramienta.
2. **Triaje con teclado** (`j/k` moverse, `s` preseleccionar, `d` descartar con motivo, `Enter` abrir). Coste S–M, valor alto: es lo que convierte Radar en algo que Jose usa cada mañana. **Q9**
3. `FindingDetail` con resumen, enlace original, datos tipados (presupuesto, ubicación, remoto) y `DraftEditor` con **historial de borradores** (regenerar no pisa, añade) y edición antes de copiar.
4. `SendPanel` honesto: «Copiar» siempre; «Enviar» solo con API oficial; «Marcar enviado» registra fecha y canal.
5. `ConvertSheet` crea `contact` + `deal` con dueño; el hallazgo queda enlazado.
6. El motivo de descarte **alimenta el criterio**: contador «Radar ha aprendido de N descartes» en R3.

**Estados.** Borrador generándose (con el anillo girando); Omen apagado (acciones de IA deshabilitadas con aviso, el triaje sigue funcionando); enviado; convertido; sin hallazgos nuevos.

**Datos.** `radar_findings`, `radar_drafts`, `contacts`, `deals`, `private.jobs`. **Falta:** columnas tipadas para filtrar sin abrir `raw`: `budget_min`, `budget_max`, `currency`, `location`, `remote bool`, `posted_at`; `radar_drafts` ya admite varias filas por hallazgo (historial), falta `version` o basta `created_at`.

### R3 Fuentes y criterio `/admin/radar/fuentes`

**Acción primaria.** «Guardar criterio».

**Valor.** `SourceList` con «credenciales: configuradas / faltan» (sin mostrarlas); `CriteriaForm` que parte de `cv.json` y añade reglas; **«Probar criterio»**: repuntúa los últimos 50 hallazgos con el criterio editado y muestra cuántos subirían o bajarían antes de guardar (job `radar.score` en modo prueba; coste M, valor alto para ajustar sin esperar a mañana).

**Datos.** `radar_sources`, `radar_profile`. **Falta:** `contracts/radar-criteria.json` (el `criteria` jsonb no tiene contrato listado); `contracts/radar-source.json` existe en `datos.md`.

---

## 7. Lab `/lab`, `/lab/[slug]`

**Para quién.** Recruiter y comprador de pack: ver una app móvil funcionando sin instalar nada.

**Acción primaria.** «Probar» (dentro del marco) o «Descargar en la tienda».

**Valor.** `DemoFrame` reutiliza **el teléfono del hero**: el mismo marco, ahora con una app real dentro. Coherencia y deleite («el teléfono de la portada era de verdad»). `DemoMeta` con stack, enlace a la ficha del proyecto y al artículo del blog si lo hay. Interruptor `site_settings.lab`.

**Formato (pendiente, `pantallas.md`):** Expo web real (valor alto, coste L por app y peso), vídeo interactivo con capítulos (valor medio, coste S) o capturas navegables (valor bajo-medio, coste S). Recomendación cuando lleguen las apps: vídeo con capítulos por defecto y Expo web solo en la app que mejor lo soporte.

**Datos.** `content/lab/*.mdx` + assets. **Falta:** esquema zod de `lab` (`title, slug, project, format enum expo | video | shots, src, chapters[]`).

**SEO.** `/es/lab` y `/es/lab/[slug]` indexables cuando existan (prioridad 0.5) y en el sitemap solo con el interruptor encendido; cada demo enlaza a su ficha de proyecto y al artículo que la explica. Sin grafo propio salvo `BreadcrumbList`.

---

## 8. Ideas transversales (qué hace que el proyecto destaque)

| Id | Idea | Qué aporta | Coste | Valor | Riesgo |
|---|---|---|---|---|---|
| **T1** | **Esta web como proyecto insignia**: ficha `/proyectos/josecoded` + sección o página **«Cómo está hecha»** con arquitectura real (diagrama de los dos repos y Supabase), decisiones enlazadas al repo público, **métricas medidas** (Lighthouse CI de la última `main`, peso JS de la home, LCP, número de componentes, migraciones, commits), estado de Omen en vivo («la IA está despierta») | Prueba para recruiter y cliente freelance; el visitante inspecciona el único proyecto que puede abrir entero; diferenciación total frente a plantillas | M (página) + S (JSON de métricas escrito por CI en `public/metrics.json` o en `site_settings`) | Alto | Las métricas deben ser reales y actualizarse solas; si se quedan viejas, restan. Repo público solo tras la auditoría (1.10) |
| **T2** | **Semáforo público de Omen** en el chat y en T1 | Honestidad y curiosidad técnica («IA en servidor propio» del hero deja de ser una frase) | S (RPC `omen_status` ya prevista) | Medio | Enseña cuándo está apagado; es el precio de la honestidad |
| **T3** | **El anillo coral como lenguaje de progreso**: `ProgressRing` con variantes (`scroll`, `project`, `upload`, `job`, `timeline`) a partir de `CapsuleRing` | Identidad propia repetida en público y privado; cero efectos nuevos por pantalla | S (extraer el componente) | Alto | Ninguno; cuidar `reduced-motion` y el contraste del coral sobre acero |
| **T4** | **Transiciones compartidas** con `view-transition-name`: lista → ficha (proyectos, blog), tarjeta → sheet (CRM), tarea que cambia de columna (área) | Deleite con coste bajo; sensación de aplicación, no de web | S por pantalla | Medio-alto | Safari sin soporte navega igual (ya previsto en W12) |
| **T5** | **Realtime en lo privado**: `tasks`, `stories`, `documents`, `notifications`, `commissions` además de `chat_messages` | Cumple literalmente «ver el desarrollo en tiempo real»; Jose ve llegar leads sin recargar | M (políticas Realtime + un hook `useLiveRows`) | Alto | Cuota de conexiones del plan; se abre una suscripción por pantalla, no por componente |
| **T6** | **Asistente con contexto y handoff**: sabe la página, cita fuentes, ofrece dejar email y crea el lead desde el chat | Conversión; demuestra RAG propio con algo útil | M (`page_path`, `sources`, `HandoffCard`, RPC desde chat) | Alto | Consentimiento explícito; nunca extraer datos del texto |
| **T7** | **Un solo vocabulario de fases** para hero, `Steps` de servicios, `PhaseSteps` del área y `projects.phase` | Coherencia: lo que el hero promete es lo que el cliente ve en su área | 0 ahora (es una decisión), S después | Alto | Hoy hay tres listas distintas: hero (4), `Steps` (5), `projects.phase` (6). **Q2** |
| **T8** | **Métricas reales de usuario (RUM)**: `web-vitals` → `private.web_vitals` sin PII, agregadas en T1 | Prueba viva del presupuesto de rendimiento | S–M | Medio | Privacidad (solo métrica, ruta y tipo de conexión); Lighthouse CI cubre el lanzamiento. **Q7** |
| **T9** | **Open Graph generadas por ruta** en estilo B (proyecto, artículo, pack) | Los enlaces compartidos parecen propios | S–M | Medio | `ImageResponse` en Cloudflare Workers vía OpenNext: comprobar soporte antes de prometerlo; alternativa, generar en build a `public/og/` |
| **T15** | **Hub-and-spoke de enlaces** (de `seo.md` §4): home → hub → freelance / packs → fichas y guías → contacto con `?via`/`?pack`; `Breadcrumbs` con `BreadcrumbList` en todo salvo home; pie con columnas Servicios · Trabajo · Guías · Contacto · Legal; relacionados calculados en build desde `category` y `relatedService` | Ninguna página huérfana, cada una a ≤ 3 clics; el mismo esquema que guía al visitante guía al bot | S (`Breadcrumbs`, pie) + S por bloque de relacionados | Alto | Anclas descriptivas siempre; nunca «aquí» ni «leer más» a secas |
| **T16** | **Entidad única + `llms.txt`** (S3, §6): un párrafo de entidad bajo el H1 de home, hub y sobre mí; el mismo texto en JSON-LD `Person`, `llms.txt` (generado desde `messages`, packs y `content/`), LinkedIn, GitHub y perfiles freelance; precios en texto con fecha | GEO: los motores generativos resuelven entidades por coincidencia entre fuentes y citan cifras con fecha | S (route handler + párrafo) | Alto | Depende de que Jose dé ciudad (Q14) y de desactivar el bloqueo de bots de IA en Cloudflare (acción suya, `seo.md` S5) |
| **T10** | **CV generado desde `cv.json`** (PDF en build, es y en) | Una sola fuente para Sobre mí, PDF y Radar; nunca desincronizado | M | Medio | Maquetar un PDF decente cuesta; el plan actual (PDF estático en W29) vale para lanzar |
| **T11** | **Atajos de teclado en zonas privadas** (`j/k`, `⌘K` para saltar a contacto o proyecto) | Productividad diaria de Jose y los closers | M | Medio (alto en Radar) | Hacerlo después del CRM básico; empezar por Radar (Q9) |
| **T12** | **«Ver como cliente»** en D7 | Seguridad antes de avisar al cliente | S | Medio | Ninguno |
| **T13** | **Exportar CSV** en comisiones y contactos | Lo que un closer necesita para facturar | S | Medio | Ninguno |
| **T14** | **Diario de construcción** en el blog (un artículo por decisión relevante: sin comentarios, hero en CSS, RLS, Omen solo sale) | Contenido orgánico que solo Jose puede escribir; refuerza T1 | Tiempo de Jose + `redactor` | Alto para SEO/GEO | Requiere constancia; el blog apagado hasta tener tres |

Descartado a propósito: modo claro (el estilo es uno), multi-idioma en el lanzamiento (2.3), gráficas en lo privado, gamificación en el área, «chat con voz», widgets de terceros (Calendly embebido se sustituye por `CalEmbed` solo con datos).

---

## 9. Preguntas para Jose (decisivas)

| # | Pregunta | Opciones | Recomendación |
|---|---|---|---|
| **Q1** | ¿Esta web entra en `/proyectos` como un proyecto más, con ficha y «Cómo está hecha» con métricas vivas (T1)? | a) Sí, como tercer destacado de la home · b) Sí, pero sin destacarla en la home · c) No | **a.** Es el único proyecto auditable y lo que la hace insignia |
| **Q2** | ¿Un solo vocabulario de fases para hero, servicios y área (T7)? | a) Cinco: Descubrir · Diseñar · Construir · Publicar · Mantener (el hero enseña cuatro de ellas con esas palabras; `projects.phase` pasa a cinco valores, `review` dentro de `build`) · b) Mantener las tres listas | **a** |
| **Q3** | ¿`PackConfigurator` en `/servicios#packs` (web / app / las dos + extras → «desde»)? | a) Sí, pequeño, bloque propio tras W28 · b) Solo comparador | **a.** Coste M, valor alto para el comprador no técnico y muestra de que la web lee datos reales |
| **Q4** | Historias: cuando Jose pone horas e importe, ¿el cliente debe aceptarlo antes de pasar a tareas? | a) Sí: estado `quoted` y botón «Aceptar presupuesto» · b) No: Jose acepta y ya | **a.** Evita malentendidos de dinero y da al cliente una acción real en su área |
| **Q5** | ¿El asistente puede ofrecer «deja tu email y te escribe Jose» y crear el lead desde el chat (T6)? | a) Sí, con botón de consentimiento · b) No, solo enlaza a `/contacto` | **a** |
| **Q6** | «Documentos que Jose pide» y otras cosas que debe hacer el cliente: | a) Tareas asignadas al cliente (`tasks.assignee_id` cualquier miembro, sin tabla nueva) · b) Entidad nueva `requests` | **a** |
| **Q7** | Métricas en «Cómo está hecha»: | a) Lighthouse CI de la última `main` (JSON escrito por CI) · b) a + RUM propio sin PII (T8) · c) Nada medido, solo arquitectura | **a** en el lanzamiento, **b** después |
| **Q8** | Sección «Qué haría distinto hoy» en las fichas de proyecto, opcional por frontmatter: | a) Sí · b) No | **a** |
| **Q9** | Triaje con teclado en Radar desde la primera versión (`j/k/s/d`): | a) Sí · b) Después | **a.** Coste S–M, es lo que hace Radar usable a diario |
| **Q10** | En «Cómo trabajo» de Sobre mí, ¿contar el método con agentes de IA (Claude Code, revisores, puerta de calidad) con enlaces al repo? | a) Sí, como hecho verificable y sin marketing · b) No mencionarlo | **a.** En 2026 es diferencial para recruiters y coherente con el hero («IA»); el riesgo es el tono, no el hecho |
| **Q11** | «Chat» y «Entrar» no caben hoy en la cápsula (código actual: Proyectos · Servicios · Sobre mí · Blog · Contacto + «Hablemos»). | a) Chat como botón de icono en las acciones de la cápsula; «Entrar» solo en el pie · b) Sustituir «Contacto» por «Chat» (Hablemos ya lleva a contacto) · c) Como está en `pantallas.md` (seis enlaces) | **a.** Los usuarios con cuenta conocen `/entrar`; el visitante no necesita verlo |
| **Q12** | **Toca la decisión 2.2.** ¿`/servicios` como hub con dos hijas indexables, `/servicios/freelance` y `/servicios/packs` (contratación se queda en el hub)? | a) Sí (S1 de `seo.md`) · b) Mantener 2.2: una página con anclas | **a.** Son dos búsquedas distintas («programador freelance por horas», «precio app móvil») que un fragmento no puede posicionar; cada hija queda con una sola primaria y sus propios ejemplos, FAQ y proyectos parecidos. Coste: un bloque más (W26b) y rehacer la `WayNav` como navegación entre páginas |
| **Q13** | Rastreadores de **entrenamiento** de IA (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`) en `robots.txt`: | a) Permitir · b) Bloquear (los de búsqueda, `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, se permiten en ambos casos) | **a.** El objetivo de la web es ser conocida; además hay que desactivar en Cloudflare el bloqueo de bots de IA por defecto (acción de Jose) |
| **Q14** | ¿Publicar la **ciudad** en el párrafo de entidad, Sobre mí y el JSON-LD (`addressLocality`, `areaServed`)? | a) Sí (abre «programador freelance {ciudad}», dificultad baja) · b) Solo «España y remoto» | **a.** Para un perfil solo es de las pocas queries locales fáciles; la ficha de Google Business se decide aparte |

---

## 10. Cambios propuestos en otros documentos (no aplicados)

### `pantallas.md`

- **Reglas globales:** cabecera pública según Q11; añadir `ProgressRing` (T3), `Breadcrumbs` (con `BreadcrumbList`, en todo salvo home; en móvil solo el padre) y `EntityParagraph` (párrafo de entidad bajo el H1 de home, hub y sobre mí) a los componentes base; retirar `ReadingProgress` de P8. `SiteFooter` con columnas Servicios · Trabajo · Guías (tres artículos de precio fijados en config) · Contacto (`rel="me"`) · Legal. Los H1 de cada pantalla pasan a los de `seo.md` §3 (marcados [R] para `redactor`); `title.template` `%s · josecoded`.
- **P1:** `ServicesStrip` como enrutador por visitante (texto que empieza por la situación del visitante); `ChatInvite` con arranques; sin formulario en la home; H1 y H2 de `seo.md`; `/` → `/es` con 308.
- **P2:** si Q12 = a, se desdobla en **P2 hub `/servicios`**, **P2a `/servicios/freelance`** y **P2b `/servicios/packs`** (la `WayNav` navega entre páginas); añadir `TaskExamples`, `HowIWorkInTeams`, `WhatINeedFromYou`, «Proyectos parecidos» por `relatedService` y, si Q3 = a, `PackConfigurator`; precios y tarifa con cifra y fecha en el HTML del servidor; `PackCompare` con todos los packs en el DOM en móvil. Corregir el parámetro: el código actual enlaza `?via=packs` y `#comparador`; `pantallas.md` dice `via=pack` y `#packs`. Unificar en `via=pack` y, con Q12 = a, `?pack={slug}`.
- **P3/P4:** `FilterTabs` depende de `kind` y usa `<a href>` reales con canonical sin filtro; `/proyectos` `noindex` mientras esté vacío; añadir `Retro` (Q8), `metric` en tarjeta y cabecera, bloque «¿Necesitas algo así?» hacia `relatedService`; transición compartida lista → ficha; JSON-LD `MobileApplication` / `CreativeWork` sin `aggregateRating`.
- **P5:** `PrinciplesList` → `HowIWork` con enlaces a prueba; `StackGroups` con «último uso» y «en producción en»; párrafo de entidad; PDF del CV con `noindex` y canonical a la página.
- **P6:** un campo extra por vía; `WhatHappensNext` (= H2 «Qué pasa después»); éxito que sustituye al formulario; enlace al chat con contexto; canonical sin `?via`/`?pack`.
- **P7:** `Starters`, `HandoffCard`, chips de fuente; indicador «pensando»; `/chat` `noindex, follow`.
- **P8:** quitar `ReadingProgress`; caja de autor sin contadores; categorías en `/blog/tema/[categoria]` (`noindex` hasta tres artículos); paginación `?pagina=`; bloque final «servicio relacionado» y dos artículos de la categoría; FAQ visible al final cuando hay `faq`.
- **P9:** cookies `noindex`. **P10:** 404 con sugerencia por ruta; mantenimiento con hora y 503 + `Retry-After`.
- **D1:** primaria «Siguiente pendiente»; `RecentActivity` por RPC. **D2:** previsualización de comisión en `InviteSheet`; `ReassignSheet` con recuento. **D3:** vista previa en vivo de la tarjeta. **D6:** título del hilo y página de origen.
- **K2:** acciones rápidas en fila y deshacer. **K3:** primaria «Añadir actividad»; previsualización de comisión al ganar. **K4:** exportar CSV. **K7/A5/F3:** referencia a contacto, tarea o historia en el mensaje.
- **A1:** `ProgressRing`, `RecentUpdates` en vivo, «Próxima entrega», preview opcional; `TodoForYou` desde tareas asignadas al cliente (Q6). **A2:** movimiento en vivo. **A4:** estados `quoted` y `declined` (Q4). **D7:** «Ver como cliente».
- **R2:** triaje con teclado (Q9), historial de borradores, columnas tipadas. **R3:** «Probar criterio».
- **Lab:** `DemoFrame` reutiliza el teléfono del hero; esquema de `content/lab`.
- **Nueva P11 (si Q1 = a):** «Cómo está hecha» `/proyectos/josecoded` (sección de la ficha) o `/como-esta-hecha` (página). Recomendación: sección larga dentro de la ficha, para no abrir otra ruta.

### `datos.md`

- `projects` MDX (`projectSchema`): `kind enum app | web | ai`, `metric { label, value, source? }`, `period { from, to? }`, `gallery[] { src, alt }`, `retro?` (texto), y para SEO `sector`, `headline`, `description` (≤ 155), `relatedService enum freelance | packs | hiring`.
- `blogSchema`: `updated`, `category` (enum de `seo.md` §2), `cover {src, alt}`, `faq [{q, a}]`, `relatedService`, `relatedPosts?`, `lab?`. Nuevo `labSchema`. Esquema zod de `cv.json` (P5), que además alimenta el JSON-LD `Person`.
- Rutas por idioma en un único `src/i18n/pathnames.ts` (`servicios↔services`…) del que salen enlaces, `alternates` y sitemap; sin `hreflang` hasta publicar `en`.
- Tipos de JSON-LD en `src/types/seo.ts` (o `schema-dts` si `revisor` acepta la dependencia) con test zod en CI; textos de `meta.*` por pantalla en `messages/es.json` [R].
- `packs` necesita `slug` estable (`app-movil`, `web-negocio`, `web-y-app`) para `?pack={slug}`, `/servicios/packs/[slug]` (fase 2) y los `Offer` del JSON-LD; hoy solo hay `code` (`P1`…).
- `packs.kind enum web | app | both` (Q3) y `packs.highlight bool` opcional. Contenido estático `content/services/{task-examples,requirements}.json`.
- `public_submit_contact`: crear también `deals` (`stage = new`, `via`, `pack_id`); campos por vía en el cuerpo de la actividad.
- `chat_messages`: `page_path`, `kind enum text | handoff | reference | system`, `sources text[]`, `contact_id?` / `task_id?` / `story_id?` para referencias (o un `ref jsonb` con contrato). `contracts/jobs/chat.reply.json` con `page_path` y `sources`.
- `stories.status`: `proposed | quoted | accepted | declined | rejected | in_tasks` + `client_decided_at` (Q4).
- `tasks.assignee_id`: cualquier miembro del proyecto (cliente incluido, Q6); `tasks.done_note?`.
- `projects.preview_url?`; `projects.phase` a cinco valores si Q2 = a.
- **Realtime** habilitado y filtrado por RLS en `tasks`, `stories`, `documents`, `notifications`, `commissions` (T5).
- `site_settings.maintenance.value = { on, message_es?, until? }`.
- `notification_prefs.event`: añadir `totp_lost`, `story_quoted`, `story_client_decided`.
- `invitations.resent_at`, `resend_count`.
- RPC nuevas: `admin_recent_activity`, `admin_jobs`, `admin_retry_job`, `my_commission_rates`, `radar_score_preview`.
- `radar_findings`: `budget_min`, `budget_max`, `currency`, `location`, `remote`, `posted_at`. `contracts/radar-criteria.json`.
- Opcional (Q7 = b): `private.web_vitals (metric, value, path, connection, at)` sin IP ni usuario.
- Métricas de T1: fichero `public/metrics.json` escrito por CI (sin tabla) o fila en `site_settings` con `public = true`.

### `bloques.md`

- **W04 (hecho):** `/` → `/es` con 308 (hoy `permanent: false`); `pathnames.ts` como fuente de rutas. Cabe en un `fix/root-redirect` (S).
- **W06 (hecho):** previews con `X-Robots-Tag: noindex` y canonical a producción (S4); `robots` con `Disallow: /` en preview. `fix/preview-noindex` (S).
- **W11 (hecho) / W13:** W13 menciona «eyebrow» en el hero; el brief los prohíbe. Quitar. `SiteFooter` pasa a columnas (Servicios · Trabajo · Guías · Contacto · Legal) en un bloque pequeño **W11b `public/footer-columns`** (S) cuando existan las rutas.
- **Nuevo W08b `public/progress-ring`** (S) tras W11: extraer `ProgressRing` de `CapsuleRing` (T3) antes de que lo usen servicios y el área.
- **Nuevo W12b `public/seo-base`** (S) tras W12, no esperar a W43: `metadataBase` desde `NEXT_PUBLIC_SITE_URL`, `title.template` `%s · josecoded`, `alternates.canonical` por página, `Breadcrumbs`, `X-Robots-Tag` en privadas. Hoy el código no tiene `metadataBase` ni canonical y mezcla separadores (`|` en servicios, `·` en proyectos).
- **W13:** H1 de la home y párrafo de entidad (`EntityParagraph`) según `seo.md` §3 [R].
- **W23:** incluir los campos nuevos del frontmatter (`kind`, `metric`, `period`, `gallery`, `retro`, `sector`, `headline`, `description`, `relatedService`; blog `updated`, `category`, `cover`, `faq`, `relatedService`, `relatedPosts`) para que W24 pueda filtrar y W40/W41 enlazar.
- **W24:** `noindex` mientras la lista esté vacía; `FilterTabs` con `<a href>`. **W25:** bloque «¿Necesitas algo así?», JSON-LD por tipo, OG generada (verificar `next/og` bajo OpenNext en la preview; si no, build a `public/og/`).
- **W26 (hecho):** ajuste `via=pack` y H1 con keyword en un `fix/` pequeño o dentro de W27. Si Q12 = a: W26 queda como hub (resúmenes + enlaces a las hijas, `WayNav` entre páginas) y se añaden **W26b `public/services-freelance`** (M: `RateFigure` con cifra, `TaskExamples`, `Steps`, proyectos parecidos, FAQ) y **W27 pasa a `public/services-packs`** (`/servicios/packs`).
- **W27:** `PackCompare` (todos los packs en el DOM en móvil) + `ExtraList` + `Faq` + `WhatINeedFromYou` + H3 «Pack {nombre}: desde {precio} €»; si Q3 = a, nuevo **W27b `public/services-configurator`** (M) tras W28.
- **W28:** precios y tarifa como texto en el HTML del servidor con «actualizados el {fecha}» (de `price_changes`); JSON-LD `OfferCatalog`; `packs.slug`.
- **W29/W30:** `HowIWork` y `StackGroups` con «último uso»; definir el esquema de `cv.json` en W29; párrafo de entidad; `ProfilePage`; PDF con `noindex` + canonical; `rel="me"`.
- **W32/W34:** campo por vía, `WhatHappensNext`, éxito que sustituye; canonical sin parámetros; W33 crea `deals`.
- **W36/W39:** `Starters` y chips de fuente en W36; `/chat` `noindex, follow`; nuevo **W39b `chat/handoff`** (S) si Q5 = a.
- **W40:** categorías `/blog/tema/[categoria]` `noindex` hasta tres artículos; paginación `?pagina=` con canonical propio; `Blog` + `ItemList`. **W41:** quitar `ReadingProgress`; caja de autor; FAQ visible; bloque final de servicio y relacionados por `category`; `BlogPosting` + `FAQPage`; `og:type article`.
- **W42:** cookies `noindex`.
- **W43:** se queda con `sitemap.ts` (interruptores, `lastModified`, sin `/en`), `robots.ts` (privadas, `/es/dev/`, bots de IA según Q13), JSON-LD global `WebSite` + `Person` con `@graph` y `@id`, `llms.txt` y `llms-full.txt` como route handlers con revalidación por tag de precios, y un **E2E de SEO por ruta** (un `h1`, `title` ≤ 60, descripción 50–160, canonical absoluto, JSON-LD que parsea, `noindex` donde toca, código HTTP).
- **Nuevo W43b `public/built-with`** (M) tras W43: ficha de esta web + «Cómo está hecha» + `metrics.json` desde CI (T1, Q1, Q7).
- **Nuevo W43c `docs/blog-plan`** (contenido, no código): esqueletos de los diez artículos de `seo.md` §6 en `content/blog/` como `draft: true` con `{{DATO}}` en cifras, para que `redactor` los complete en el Mac; orden 1, 3, 2, 5, 6, 4, 7, 8, 9, 10. El blog se enciende con tres publicados.
- **W45:** Lighthouse incluye la categoría SEO en el umbral ≥ 95.
- **W46:** añadir a la lista de lanzamiento, como acciones de Jose: desactivar en Cloudflare el bloqueo de bots de IA y el robots.txt gestionado, `www` → apex 301, Crawler Hints/IndexNow, Search Console y Bing Webmaster verificados por DNS, enviar el sitemap.
- **Zonas siguientes:** añadir `data/realtime-policies` al grupo del área (T5); `admin/view-as-client` dentro de `admin/projects`; `radar/keyboard-triage` dentro de `radar/findings`; `crm/export-csv` dentro de `crm/commissions`.
- **ESTADO.md:** cuando Jose responda Q1–Q14, anotar las respuestas en `decisiones.md` como 2.10–2.1x (público; Q12 modifica 2.2 con fecha, sin reescribirla), 6.8–6.9 (área) y 8.5 (Radar), y abrir las issues de los bloques nuevos. Las preguntas de `seo.md` que no son de Jose (volúmenes sin validar en Semrush) se anotan en «Pendientes».
