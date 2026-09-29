# Pantallas independientes y sus contenidos (borrador)

> Versión 0.1, 2026-09-29. Autor: agente `ux`. **Borrador**: se cierra con las respuestas de Jose a la batería del §6.
> Parte de: home cerrada en `ref/home-v6/` (contrato `.impeccable/surfaces/docs-superpowers-design-ref-home-v6-index-html.md`, sistema en `DESIGN.md`), inventario `2026-09-29-componentes-home-v6.md` (con sus decisiones cerradas del §3), `docs/working-agreements.md`, `PRODUCT.md`, spec v1.5.2 y UX v3.2 (`2026-09-17-josecoded-ux.md`; sus §2 y §4.1 de la home están superados, el resto se toma como punto de partida).
> Aquí no hay wireframes ni HTML. Es el mapa, el contenido que necesita cada pantalla y el orden de trabajo. Los wireframes se hacen después, pantalla a pantalla, con `/impeccable shape` y un prototipo en el navegador para que Jose decida viéndolo.

## 0. Marco

- **Personas**: Marta (negocio local, móvil, persona principal) y Dani (CTO o reclutador, escritorio). Tienen el mismo peso en lo público. Jose es el operador del admin y de Radar, que quedan fuera de este documento porque son otra superficie (modo operar) y ya tienen su propio diseño en UX v3 §7.
- **Reglas que no se discuten**: nada inventado (ni testimonios, ni cifras, ni precios fuera de `tarifas.md`); sin métricas en la web (los precios «desde» sí); solo modo oscuro; una acción primaria por pantalla; máximo tres niveles de navegación; mobile-first; bloque sin `{{DATO}}` cubierto = bloque que no se publica.
- **Modo de superficie** (impeccable): **Persuadir** (Sobre mí, Empresas, Negocios, Proyectos, Contacto), **Leer** (ficha de proyecto, blog, artículo, legales), **Operar** (auth, chat, área privada, perfil). El modo decide la densidad, cuánto «gesto por celda» cabe y si hay bento.
- **Cabecera v6** en todas las páginas públicas: marca · Sobre mí · Empresas · Negocios · Proyectos · Blog · idioma → ⌘K → Chat → Login. «Contacto» no está en la barra: vive en el cierre de cada página, en ⌘K y en el menú ☰.
- **Pie v6**: secciones, Área de clientes y Legal.

### 0.1 Choques entre la UX v3 y decisiones posteriores

Hay que resolverlos al diseñar cada pantalla. No son preguntas para Jose porque las decisiones ya están tomadas:

| UX v3 proponía | Decisión posterior que manda | Consecuencia |
|---|---|---|
| `GitHubActivity` (actividad y número de repos) en Empresas y Sobre mí | Sin métricas en la web (2026-09-24) | Se sustituye por un enlace sobrio «Código en GitHub» sin contadores. |
| `StoreBadges` con valoración numérica | Sin métricas | Solo el enlace a la store, sin estrellas ni número. |
| Badge «Disponible para proyectos» | Quitado del hero (2026-09-29) | No vuelve en las páginas interiores. El dato de disponibilidad se queda solo en el chat y en la FAQ de Empresas, si Jose quiere. |
| `ProofStrip` «Cómo está hecha esta web» en la home | Quitada «Esta web la he hecho yo» (2026-09-27) | Ver la pregunta «Esta web» (§6). |
| «Cómo trabajo» con pinning y pasos activos por scroll; trayectoria horizontal ligada al scroll | Fuera los chorros, barridos y efectos «básicos y liosos» (2026-09-25); un gesto con propósito por celda | Se decide al fijar el lenguaje de las páginas interiores (pregunta «Interiores»). |
| Barra inferior fija con WhatsApp y Propuesta en Negocios (móvil) | Sin decidir en la v6 | Se mantiene como propuesta de `ux` para Negocios: Marta necesita el CTA a mano en el móvil. `ui` decide si se oculta al bajar. |
| Tailwind, shadcn, GSAP y hoja shadcn | `working-agreements.md` (CSS Modules, motion nativo) | Nada en este documento depende de esas librerías. |

---

## 1. Mapa de pantallas

Rutas en español (en `/en/...` con su equivalente de UX v3 §2.1). Estado en la spec: **definida** (tiene ficha en UX v3 y sigue valiendo en lo esencial), **a medias** (tiene ficha, pero la v6 o una decisión posterior la cambia), **nueva** (no existe en ningún documento).

### 1.1 Públicas

| # | Pantalla | Ruta | Modo | Persona | Se llega desde | Estado |
|---|---|---|---|---|---|---|
| P1 | **Webs para tu negocio** | `/negocios` | Persuadir | Marta | Hero («Una web para mi negocio →»), escena Negocios (Ampliar → «Ir a Packs»), cabecera, ⌘K («desde 900 €»), menú, pie | a medias (UX §4.3; la v6 añade la barra de packs y «Qué incluye») |
| P2 | **Generador de propuesta** | `/propuesta` | Operar (chat guiado) | Marta | Celda «Propuesta al momento» (el texto escrito viaja a la ruta), P1 (CTA y «con este pack»), ⌘K, área privada si no es cliente | definida (UX §4.4) |
| P3 | **Contacto / Hablamos** | `/contacto` | Persuadir | Marta y Dani | Cierre «¿Empezamos?» de la home y de cada página, celda «Trato directo» («Escríbeme»), ⌘K, menú ☰ (destacado), error 404/500 | a medias (UX §4.10; la home v6 ancla a `#hablamos` y la cabecera ya no tiene Contacto) |
| P4 | **Trabajo con empresas** | `/empresas` | Persuadir | Dani | Escena Empresas (Ampliar → «Ir a Servicios», «Ver cómo trabajo»), celda Tarifas, cabecera, ⌘K, menú, pie | a medias (UX §4.2; la v6 añade Tarifas con selector y deja «Servicios» con un entregable por servicio `{{DATO}}`) |
| P5 | **Stack y CV** | `/sobre-mi#stack` o `/cv` (pregunta «Stack y CV») | Leer | Dani (y Radar como CV maestro) | Celda «Con qué trabajo» (marquesina, hoy sin destino), «Descargar CV» de la celda Hablamos, P4, P6, ⌘K | **nueva** (en ESTADO como página derivada sin diseñar; UX v3 lo reparte entre Sobre mí y Empresas) |
| P6 | **Sobre mí** | `/sobre-mi` | Persuadir | Marta (confianza) y Dani (perfil) | Celda Sobre mí («Conóceme», Ampliar), cabecera, ⌘K, menú, pie, ficha de proyecto | a medias (UX §4.9; faltan la foto real y resolver el aire de la celda) |
| P7 | **Proyectos** (índice) | `/proyectos` | Persuadir | Dani (Marta de paso) | Hero «Ver proyectos» (hoy ancla a la escena), «Ver todos» del carrusel, cabecera, ⌘K, menú, pie | a medias (UX §4.5; la v6 fija el arte de glifos y el orden HazmeFila · Oportunix · Webs de comercios · 3catinfo) |
| P8 | **Ficha de proyecto** | `/proyectos/[slug]` | Leer | Dani | Tarjeta del carrusel («Ver proyecto»), P7, P1 («Webs hechas»), ⌘K (si indexa proyectos) | a medias (UX §4.6; la profundidad está abierta: pregunta «Proyecto») |
| P9 | **Blog** (índice) | `/blog` | Leer | Dani | Escena Blog, cabecera, ⌘K, menú, pie | definida (UX §4.7), pero depende de que haya artículos |
| P10 | **Artículo** | `/blog/[slug]` | Leer | Dani | Celdas del blog en la home («Leer»), P9, relacionados, ⌘K | definida (UX §4.8) |
| P11 | **Chat con el asistente** | `/chat` | Operar | Dani | Cabecera («Chat», punto verde), ⌘K («Abrir el chat»), P6, P4, P3 | definida (UX §4.11); la antesala sin cuenta hay que rehacerla con `ChatBubble` v6 |
| P12 | **Entrar** | `/auth/login` | Operar | Marta cliente, Dani | Cabecera («Login» en violeta), ⌘K, comentar, chat, pie (Área de clientes) | definida (UX §5.1) |
| P13 | **Crear cuenta** | `/auth/registro` | Operar | ídem | P12 | definida (UX §5.2) |
| P14 | **Introduce el código** | `/auth/codigo` | Operar | ídem | P12/P13 por email | definida (UX §5.3) |
| P15 | **Callback OAuth** | `/auth/callback` | — | técnico | Google/GitHub | definida (UX §5.4) |
| P16 | **Objetivo de la cuenta** (bienvenida) | `/bienvenida` (una vez, tras el primer acceso) | Operar | cualquiera con cuenta nueva | P15/P14 en el primer acceso | **nueva** (pendiente de ESTADO: personalización según objetivo) |
| P17 | **Mi cuenta** | `/perfil` | Operar | con cuenta | Menú del avatar, área privada | definida (UX §4.13) |
| P18 | **Legales** (aviso legal, privacidad, cookies) | `/legal/*` | Leer | todos | Pie («Legal»), casilla de privacidad de los formularios, P12 | definida (UX §4.12) |
| P19 | **Errores**: 404, 410, 500, 403 y mantenimiento | cualquier ruta | — | todos | — | definida (UX §8); falta la versión visual v6 |

### 1.2 Área privada (`/area-clientes`)

| # | Pantalla | Ruta | Visible para | Estado |
|---|---|---|---|---|
| A1 | **Inicio del área** (personalizado) | `/area-clientes` | todos con cuenta | a medias (UX §6.1 distingue cliente / no cliente; la personalización por objetivo es **nueva**) |
| A2 | Tareas | `/area-clientes/tareas` | clientes | definida (UX §6.2) |
| A3 | Detalle de tarea | `/area-clientes/tareas/[id]` | clientes | definida (UX §6.3) |
| A4 | Material | `/area-clientes/material` | clientes | definida (UX §6.4) |
| A5 | Pack y extras | `/area-clientes/pack` | clientes | definida (UX §6.5) |
| A6 | Solicitar ampliación | `/area-clientes/pack/ampliar` | clientes | definida (UX §6.6) |
| A7 | Recomiéndame | `/area-clientes/recomiendame` | todos | definida (UX §6.7) |

Se llega a todo el área desde Login, el pie («Área de clientes»), ⌘K («Login» → área si ya hay sesión) y el enlace del avatar. Profundidad: área → tareas → detalle (tres niveles).

### 1.3 Lo que no es pantalla, pero necesita diseño o contenido

| Pieza | Dónde vive | Por qué importa |
|---|---|---|
| **Reservar 20 min** (Cal.com) | Modal o bloque en P3 y P4; el botón de la home abre lo mismo | Es la primaria de Dani. Necesita la cuenta de Cal.com `{{DATO}}` y el estado «si el calendario no carga». |
| **WhatsApp prellenado** | Enlaces `wa.me` desde P1, P2, P3, la home y el área | Es la primaria de Marta. El texto prellenado cambia según el origen (pack, propuesta, contacto). Número `{{DATO}}`. |
| **CV en PDF** (es/en) | «Descargar CV» de la home, P4, P5, P6 | Hoy no existe. Si sale de los mismos datos que el CV maestro de Radar, hay una sola fuente de verdad (idea candidata «JSON Resume» de la spec §4.1). |
| **Paleta ⌘K fuera de la home** | Layout global | En las páginas interiores los comandos «Ir a» apuntan a rutas, no a anclas. Hay que decidir si también busca proyectos y artículos (propuesta de `ux`: sí, por título, desde el mismo índice que genera `llms.txt`). |
| **Celda ampliada → página** | Home | Decisión cerrada: el hueco `more` lleva un resumen y el enlace a su página. El resumen de cada celda sale del primer bloque de la página de destino (ver §2), así que no hay copy nuevo. |
| **Barra fija de Negocios** (móvil) | P1 | WhatsApp + Propuesta. Única barra fija del sitio público. |
| **Toasts, banner sin conexión, skeletons y vacíos** | Transversal | Estados de UX v3 §8. Se diseñan una vez con el sistema v6. |

---

## 2. Componentes por pantalla

Leyenda: **R** = reutiliza del inventario v6 (nombre del §1 del inventario). **N** = nuevo, no existe en la v6. Todas usan además las primitivas (Button, ArrowLink, Icon, IconTile, Surface, TwoToneHeading, roles de texto), SiteHeader, MobileMenu, CommandPalette, SiteFooter, SkipLink y Backdrop quieto.

| Pantalla | Reutiliza (R) | Necesita nuevo (N) |
|---|---|---|
| P1 Negocios | Scene (sin `fill`), Bento, BentoCell, PackStrip, CheckList, ProposalPrompt, SegmentedControl + RateFigure (mantenimiento mensual), CtaRow, Closing compacto, CursorLight | **PageHead** (cabecera de página interior), **PackCard** o **PackCompare** (según la pregunta «Tarifas»), **ExtraList**, **ProcessSteps**, **FAQ** (acordeón con `FAQPage`), **StickyCtaBar** (móvil) |
| P2 Propuesta | ChatBubble, ProposalPrompt (como campo de texto libre), Chip, Button | **ProposalChat** (hilo guiado con progreso «1 de 4»), **ChoiceChips** (respuesta de una o varias opciones), **ProposalCard**, **LeadMiniForm**, **InlineError** |
| P3 Contacto | SegmentedControl (Tengo un negocio / Somos una empresa), Closing compacto, CtaRow | **ContactForm** (con Turnstile y estados), **CalEmbed**, **CopyField** (email con copiar), **Disclosure** («Prefiero dejar mis datos») |
| P4 Empresas | Scene, Bento, BentoCell, SlidingList (servicios), SegmentedControl + RateFigure (tarifas), CheckList (qué entrego), Chip, CtaRow, Closing compacto | PageHead, ProcessSteps, FAQ, CalEmbed, **ServiceDetail** (si Servicios se amplía a bloque por servicio) |
| P5 Stack y CV | Chip (en bloque, sin marquesina), IconTile, ArrowLink (descarga) | **StackGroups** (lista agrupada: móvil, web, backend y datos, calidad y operaciones), **CredentialList** (formación con estado) |
| P6 Sobre mí | AboutSummary (cabecera de página), Scene, Bento, BentoCell, ChatBubble (si repite «Trato directo»), Chip, CtaRow, Closing compacto | PageHead con retrato, **Timeline** (trayectoria con fechas reales), **PrinciplesList** («Cómo trabajo»), **LinkRow** (LinkedIn, GitHub, CV) |
| P7 Proyectos | ProjectCard (apilada, sin carrusel fijado), SegmentedControl (Todos · Apps · Webs) | PageHead, **EmptyState** (filtro sin resultados) |
| P8 Ficha | ProjectCard (relacionados), Chip (stack), CheckList (qué hice), Button (enlace de prueba), Closing compacto | **ProjectHead** (nombre, tipo, estado, enlaces de prueba), **ScreenGallery** (capturas en marco o sin él), **StoreLinks** (sin valoración), **PrevNext** |
| P9 Blog | PostTeaser, Chip (etiquetas), SegmentedControl o chips de filtro | PageHead, **LoadMore**, EmptyState («no hay en español») |
| P10 Artículo | Chip, PostTeaser (relacionados), ChatBubble (no) | **Prose** (cuerpo MDX: títulos, listas, citas, callouts, imágenes), **CodeBlock** con copiar, **Toc** (plegable en móvil, lateral en escritorio), **ReadingProgress**, **ShareRow**, **CommentThread** (lista, caja, pendiente de revisión, responder), **StatusBadge** |
| P11 Chat | ChatBubble (misma burbuja de la home), Chip (sugerencias), LiveDot (estado) | **ChatThread**, **ChatComposer**, **StatusBand** («Responde el asistente» / «Jose está respondiendo»), **AuthGateCard** (antesala sin cuenta), **MeetingSheet** |
| P12–P15 Auth | Button, Surface | **AuthCard** (tarjeta centrada con cabecera reducida), **AuthProviders**, **OtpInput** (6 casillas), **Banner** (caducada, error OAuth) |
| P16 Objetivo | SlidingList o IconTile en filas, Button | **GoalPicker** (3–4 objetivos a un toque, con «Saltar») |
| P17 Mi cuenta | SegmentedControl (idioma), Button | **AccountCard**, **ConfirmDialog** (solicitar borrado) |
| P18 Legales | — | Prose, Toc |
| P19 Errores | Button, ArrowLink | **ErrorPage** (código en mono, título, una frase, primaria y alternativa) |
| A1–A7 Área | BentoCell en modo operar (sin CursorLight), SlidingList (listas del panel), PackStrip (pack contratado), SegmentedControl (filtros de tareas), ChatBubble (comentarios de tarea), Chip | **AppShell** (barra lateral en escritorio, barra inferior en móvil), **PhaseSteps** (fases del proyecto), **TaskRow**, StatusBadge, **FileList** + **Uploader**, **UpgradeSummary** (resumen fijo), **ReferralLink** (copiar y compartir), Skeleton, EmptyState, ErrorState, Toast |

**Componentes nuevos que se comparten** (conviene hacerlos una vez, antes de la primera página que los necesite): PageHead, FAQ, ProcessSteps, EmptyState, ErrorState, Skeleton, Toast, StatusBadge, Prose, Toc, CalEmbed, ContactForm y ErrorPage.

---

## 3. Contenidos por pantalla

Bloques en el orden de lectura (móvil). **Hay**: contenido que ya existe en el repo, en la spec o en el vault. **`{{DATO}}`**: lo tiene que aportar Jose. Los precios salen siempre de `packages/pricing` (fuente: `Comercial/tarifas.md`) y nunca se escriben en `messages`.

### P1 Webs para tu negocio `/negocios`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera de página | Titular a dos tonos («Webs para tu negocio. Cuatro packs con precio cerrado.», el de la escena) + párrafo citable (qué, para quién, desde cuánto, plazo) + [Escribir por WhatsApp] + «Pedir propuesta orientativa →» | Hay: titular v6, párrafo de UX §4.3. Falta: número de WhatsApp `{{DATO}}` |
| 2 | Packs | P1 Web básica 900 € · 1 sem, P2 Pedidos o reservas 1.400 € · 2 sem, P3 Gestión 2.500 € · 2 sem, P4 Gestión + automatizaciones 4.200 € · 3 sem. Qué incluye cada uno en lenguaje llano; «Pedir propuesta con este pack →». «Precios desde, sin IVA. Dominio y hosting a tu nombre.» | Hay: `tarifas.md` (incluye y plazos). Hay que reescribir el «incluye» en lenguaje de Marta (lo hace `redactor` con `voz.md`) |
| 3 | Propuesta al momento | ProposalPrompt con los ejemplos de la home; lleva a P2 con el texto | Hay: copy v6 |
| 4 | Extras | Mantenimiento básico 49 €/mes · extendido 149 €/mes (selector mensual), SEO básico 250 € · completo 600 €, GEO 300 €, revisión de seguridad 250 €, con una línea de qué es cada uno | Hay: `tarifas.md` y nombres llanos de UX §10.2 |
| 5 | Cómo es el proceso | Hablamos → presupuesto cerrado → pagos 40 / 30 / 30 → web publicada y 30 días de garantía | Hay: `condiciones.md` |
| 6 | Webs hechas | ProjectCard de webs de comercios | **`{{DATO}}`: nombres, URLs y capturas.** Sin ellos, el bloque no se publica |
| 7 | Preguntas | Cuánto tarda, qué necesito darte, dominio y hosting, qué pasa después, se puede ampliar | Hay: respuestas derivables de `condiciones.md` y `tarifas.md`. Jose valida el texto |
| 8 | Cierre | «Te resumo: precio cerrado, plazo cerrado, sin permanencia» + [Escribir por WhatsApp] | Hay |
| — | Barra fija (móvil) | [WhatsApp] [Propuesta] | Hay |

### P2 Generador de propuesta `/propuesta`

Contenido completo en UX §4.4 y §10.3 (preguntas, chips, estados y microcopy). Falta: **plazo real de respuesta** `{{DATO}}` («Te escribo en menos de 24 h laborables» es un supuesto) y el número de WhatsApp. El «incluye» de la ProposalCard sale del mismo texto que P1-2.

### P3 Contacto / Hablamos `/contacto`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | «¿Empezamos? Cuéntame qué necesitas.» (el del cierre de la home) | Hay |
| 2 | Selector | Tengo un negocio / Somos una empresa. Segmento inicial por `?via`, por el recuerdo de la sesión o, si no hay nada, negocio | Hay: UX §4.10 |
| 3a | Vía negocio | [Escribir por WhatsApp] + «Pedir propuesta orientativa →» + «Prefiero dejar mis datos» (formulario plegado) | Falta: WhatsApp `{{DATO}}` |
| 3b | Vía empresa | Formulario abierto + [Reservar 20 min] (Cal.com) + email con copiar | Falta: email real y cuenta de Cal.com `{{DATO}}` |
| 4 | Datos | Email, LinkedIn, GitHub, «Respondo en menos de {{DATO}}» | Hay: LinkedIn. Falta: email, usuario de GitHub, plazo de respuesta `{{DATO}}` |

### P4 Trabajo con empresas `/empresas`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | «Trabajo con empresas. Web, móvil e IA para tu producto.» + párrafo citable (quién, qué, para quién, modalidad) + [Reservar 20 min] + «Descargar CV →» | Hay: titular v6. Falta: ciudad `{{DATO}}` |
| 2 | Servicios | Web con Next.js · Apps con React Native · IA integrada. Por servicio: qué entrego, con qué, un proyecto de ejemplo | **`{{DATO}}`: entregable de cada servicio** (ya marcado en la v6). Proyecto de ejemplo depende de P7 |
| 3 | Tarifas | Por horas 40 €/h · por feature cerrada desde 150 €. Si Jose lo quiere público: app MVP 4.000 € · 6 sem y app ampliada 6.000 € · 8 sem (pregunta «Packs de app») | Hay: `tarifas.md` |
| 4 | Cómo trabajo | Hablamos 20 min → propuesta con precio cerrado → iteraciones con demo semanal → entrega, código y 30 días de garantía | Hay: UX §4.2 y `condiciones.md`. Jose confirma la cadencia de demos |
| 5 | Con qué trabajo | Stack agrupado (o enlace a P5) | Hay: stack de UX §18 |
| 6 | Pruebas | Enlaces a stores, «Código en GitHub», proyectos destacados. Sin contadores | Falta: enlaces de stores y usuario de GitHub `{{DATO}}` |
| 7 | Preguntas | Disponibilidad, remoto, contrato o puesto, plazos, facturación | Falta: respuestas de Jose `{{DATO}}` (disponibilidad y si acepta puesto fijo) |
| 8 | Cierre | [Reservar 20 min] + «Escribir por formulario →» + «Preguntar al asistente →» | Falta: Cal.com `{{DATO}}` |

### P5 Stack y CV

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Stack agrupado | Móvil · Web · Backend y datos · Calidad y operaciones. Solo lo que Jose usa de verdad | Hay: lista de UX §18 y la marquesina v6 (Next.js, React Native, Expo, TypeScript, Supabase, Cloudflare Workers, Three.js, n8n, PostgreSQL, Tailwind). Jose confirma qué entra y qué sobra |
| 2 | Formación | ITIL 4, DevOps & Cloud Computing (AWS, GitLab CI), Professional Scrum Master | **`{{DATO}}`: cuáles están certificadas, organismo y año** |
| 3 | Experiencia | Empleos y proyectos con fechas | **`{{DATO}}`: empleos anteriores (empresa, puesto, años)** |
| 4 | Descargas | CV en PDF es/en | **`{{DATO}}`: CV maestro** (el mismo que pide Radar en `content/radar/`) |

### P6 Sobre mí `/sobre-mi`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera con retrato | Nombre, «Desarrollador full-stack freelance · {{ciudad}}», frase de la celda v6 | Hay: nombre «Jose Carlos Sánchez» y frase. **`{{DATO}}`: foto real, ciudad** |
| 2 | Historia | Por qué hace lo que hace, en primera persona. Profundidad según la pregunta «Sobre mí» | **`{{DATO}}`: la historia la cuenta Jose** (`redactor` la edita con `voz.md`, no la inventa) |
| 3 | Trayectoria | 2026 josecoded v2 y HazmeFila · 2026 Oportunix · {{año}} 3catinfo · empleos | Hay: fechas de repos. **`{{DATO}}`: año y rol en 3catinfo, empleos, años de experiencia, desde cuándo es freelance** |
| 4 | Cómo trabajo | Tres principios de `voz.md`: qué hago, cuánto cuesta, cuándo está | Hay (ejemplos de `voz.md` provisionales, pendientes de Jose) |
| 5 | Stack y formación | Bloque de P5 o enlace a `/cv` | Ver P5 |
| 6 | Enlaces | LinkedIn, GitHub, stores, CV | Hay: LinkedIn. Falta: GitHub, stores |
| 7 | Cierre | [Hablamos] + «Preguntar al asistente →» | Hay |

### P7 Proyectos `/proyectos`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | «Proyectos en uso. Con enlace a la store, a la web o al código.» | Hay: titular v6 |
| 2 | Filtro | Todos · Apps · Webs | Hay |
| 3 | Tarjetas | HazmeFila (App), Oportunix (Web), Webs de comercios (Web), 3catinfo (App), y josecoded.com si se decide así (pregunta «Esta web») | Hay: nombre, tipo y arte de glifos. **`{{DATO}}`: qué hace cada uno en una frase, estado (publicado o no), enlaces** |

Orden por número de pruebas verificables (UX §4.5); 3catinfo nunca en primer lugar (NDA).

### P8 Ficha de proyecto `/proyectos/[slug]`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | Nombre, tipo, estado, frase citable, enlace de prueba principal (store o web) como primaria | **`{{DATO}}`: estado y enlaces** |
| 2 | Capturas | Galería de producto | **`{{DATO}}`: capturas reales** (sin ellas, se omite el bloque y queda el arte de glifos) |
| 3 | El reto | Qué problema resolvía | **`{{DATO}}`** (solo si la pregunta «Proyecto» elige caso de estudio) |
| 4 | Qué hice | Tres a cinco líneas | **`{{DATO}}`** |
| 5 | Stack | Chips (ocultable; 3catinfo sin stack) | Hay: HazmeFila (Expo + Supabase), Oportunix (Next.js 16 + Firebase) |
| 6 | Resultado | Solo hechos verificables, sin métricas | **`{{DATO}}`** o se omite |
| 7 | Anterior / siguiente y cierre | «Hablar de un proyecto así» → P3 | Hay |

### P9 Blog y P10 Artículo

| Bloque | Contenido | Hay / falta |
|---|---|---|
| Cabecera del índice | «Lo que voy aprendiendo. Artículos sobre lo que construyo.» | Hay: titular v6 |
| Artículos | Título, fecha, minutos, etiquetas, entradilla | **`{{DATO}}`: los artículos.** La home v6 necesita tres para llenar su escena |
| Artículo | Cuerpo MDX, índice, compartir, relacionados, comentarios | Plantilla definida; comentarios con microcopy de UX §4.8 |

Candidatos de primer artículo que ya tienen material en el repo: «Cómo está hecha josecoded.com» (spec, diseño técnico, DESIGN.md) y «Una nube de glifos en Three.js» (escena del hero). Los escribe Jose o `redactor` a partir de lo que Jose cuente.

### P11 Chat `/chat`

Contenido en UX §4.11 y §10.4. Falta: los dos o tres intercambios reales de ejemplo para la antesala (deben salir de respuestas verdaderas de `knowledge.json`), y confirmar qué sabe el asistente (`josecoded-api/src/knowledge/knowledge.json`, que hay que actualizar con los `{{DATO}}` resueltos).

### P12–P15 Auth y P17 Mi cuenta

Contenido completo en UX §5, §4.13 y §10.4. Sin `{{DATO}}`. Depende de configurar OAuth de Google y GitHub y la plantilla OTP en Supabase (insumo pendiente de Jose en ESTADO).

### P16 Objetivo de la cuenta (nueva) y A1 Inicio del área personalizado

Propuesta de `ux`, pendiente de la pregunta «Área privada»:

| # | Bloque | Contenido |
|---|---|---|
| 1 | Pregunta (una vez) | «¿Qué te trae por aquí?», con cuatro respuestas a un toque: **Quiero una web para mi negocio** · **Ya trabajo contigo** · **Quiero contratarte o evaluarte** · **Quiero recomendarte**. Más «Saltar». Se puede cambiar en Mi cuenta |
| 2 | Portada del área según objetivo y datos | **Cliente** (hay `clients.user_id`): proyecto, «Te toca a ti», novedades, hablar con Jose (UX §6.1). **Web para mi negocio, sin proyecto**: propuesta guardada si la hizo, [Pedir propuesta], packs resumidos (PackStrip), WhatsApp. **Contratar o evaluar**: CV, reservar 20 min, chat, proyectos destacados. **Recomendar**: su enlace y qué gana (A7 en portada) |
| 3 | Siempre | Recomiéndame (resumen), Mi cuenta |

El objetivo decide qué va primero; los datos (cliente o no) deciden qué existe. Un cliente siempre ve su proyecto primero, diga lo que diga el objetivo. Contenido: todo existe en la spec, salvo el copy de la pregunta (lo de arriba es propuesta de `ux`). Requiere una columna `goal` en el perfil (tabla aditiva; la decide el arquitecto).

### P18 Legales

| Página | Contenido | Falta |
|---|---|---|
| Aviso legal | Titular, NIF, domicilio, email, condiciones de uso (LSSI) | **`{{DATO}}`: nombre legal, NIF, domicilio fiscal, email** |
| Privacidad | Responsable, finalidades (leads, cuenta, chat, comentarios, afiliados), base legal, conservación, derechos, encargados (Supabase, Cloudflare, Workers AI, Cal.com) | Mismos datos del titular; Jose valida la lista de encargados |
| Cookies | Umami sin cookies, cookie `ref` de 30 días, sesión de Supabase; sin banner | Hay: UX §4.12 |

### P19 Errores

Copy completo en UX §8 (tabla 8.1–8.16). Sin `{{DATO}}` salvo el WhatsApp de las alternativas.

### 3.1 `{{DATO}}` consolidados para esta tanda

Nuevos respecto a UX §18: foto real; entregable por servicio; plazo real de respuesta; historia personal para Sobre mí; capturas por proyecto; reto, trabajo y resultado por proyecto; CV maestro es/en; cuenta de Cal.com; datos del titular para el aviso legal; respuestas de la FAQ de Empresas (disponibilidad, puesto fijo); tres artículos para el blog.
Siguen abiertos de UX §18: nombre a mostrar (la v6 usa «Jose Carlos Sánchez»), ciudad, años, estado y enlaces de 3catinfo, HazmeFila y Oportunix, webs de comercios, certificaciones, empleos, WhatsApp y email, usuario de GitHub, cuentas de stores y si el repo de josecoded será público.

---

## 4. Prioridad de diseño y construcción

Criterio: primero lo que convierte a las dos personas (métricas de la spec: ≥ 4 leads de negocio y ≥ 2 contactos de empresa al mes), después lo que depende de cuenta o de contenido que aún no existe. Dentro de eso, primero lo que tiene los datos listos, para que Jose pueda decidir en el navegador con contenido real y no con huecos.

| Orden | Pantalla | Por negocio | Por dependencia técnica | Datos listos |
|---|---|---|---|---|
| 1 | **P1 Negocios** | Es el camino de Marta (persona principal) y el destino del CTA secundario del hero | Solo `packages/pricing`, que ya está en la fase 1 del plan. **Fija el lenguaje de las páginas interiores**: PageHead, FAQ, ProcessSteps y la variante compacta de Scene/Closing salen de aquí | Casi todos (falta WhatsApp) |
| 2 | **P3 Contacto** | Es el cierre de todas las páginas y la salida de las dos personas | ContactForm, Turnstile, `POST /leads` y CalEmbed; lo reutilizan P4 y P2 | Faltan WhatsApp, email y Cal.com |
| 3 | **P4 Empresas** (+ **P5** como sección o página) | Es el camino de Dani y lleva el «Reservar 20 min» | Reutiliza casi todo de P1 y P3 | Faltan entregables por servicio y enlaces |
| 4 | **P2 Generador de propuesta** | Es el lead más cualificado de Marta | Depende del gateway (Workers AI), Turnstile, `pricing` y leads; es la pieza con más estados | Listos (falta el plazo de respuesta) |
| 5 | **P7 Proyectos + P8 Ficha** | Prueba de oficio para Dani y confianza para Marta | Pipeline de contenido MDX (el mismo del blog) | **Bloqueados** por los `{{DATO}}` de proyectos |
| 6 | **P6 Sobre mí** | Confianza; la métrica de 90 s de tiempo en página | Solo estático | **Bloqueado** por foto, historia y trayectoria |
| 7 | **P18 Legales + P19 Errores** | Obligatorios para lanzar; bajo riesgo de diseño | Plantilla Prose y ErrorPage | Faltan los datos del titular |
| 8 | **P12–P17 Auth, bienvenida y cuenta** | Habilitan chat, comentarios y área | Supabase Auth con OAuth (insumo de Jose) | Listos |
| 9 | **P11 Chat** | Secundario para Dani | Auth y rutas `admin-chat/*` conservadas | Faltan ejemplos reales para la antesala |
| 10 | **A1–A7 Área privada** | Retención y afiliados; no capta en frío | Auth, RLS y tablas existentes; personalización si se aprueba | Listos |
| 11 | **P9 Blog + P10 Artículo** | Actividad y GEO; no convierte directamente | Pipeline MDX (compartido con P7) y comentarios con auth | **Bloqueados** por los artículos |

Dos notas de orden:

- P1 va primero aunque P7 sea el destino del CTA principal del hero, porque P7 no se puede enseñar sin sus `{{DATO}}` y P1 sí. Si Jose aporta antes los datos de los proyectos, P7 sube al segundo puesto.
- Si Jose decide lanzar por fases (pregunta «Alcance v1»), las filas 1 a 7 forman la primera entrega pública; de la 8 a la 11, la segunda.

---

## 5. Decisiones de `ux` dentro del margen (sin preguntar)

1. **Contacto sigue siendo una página** (`/contacto`), además del cierre de cada página. El menú ☰ y ⌘K necesitan un destino con URL, y Dani necesita el formulario y el calendario juntos.
2. **El hero «Ver proyectos» lleva a la escena de la home**, no a `/proyectos`, como en el prototipo. «Ver todos» del carrusel es la puerta al índice.
3. **La celda «Con qué trabajo» enlaza a P5** (sección o página según la respuesta). Hoy no tiene destino.
4. **Las filas de Servicios y de Packs, que hoy se pueden enfocar pero no hacen nada, pasan a ser enlaces** a su bloque en P4 y P1 (`/empresas#web`, `/negocios#p2`). Resuelve el punto de accesibilidad 4.5 del inventario.
5. **Mi cuenta se queda como pantalla aparte** del área. El área es para quien trabaja o recomienda; la cuenta la tienen también quienes solo comentan o chatean.
6. **Admin y Radar no entran en esta tanda.** Son modo operar para una sola persona y ya tienen diseño (UX v3 §7). Se retoman después con el sistema v6.

---

## 6. Batería de preguntas para Jose

Doce preguntas en tres tandas de cuatro. Las preguntas de cada tanda son independientes entre sí. El JSON listo para AskUserQuestion está en la respuesta del agente al controlador; aquí va el resumen.

**Tanda 1 · Marco**
1. **Alcance v1**: ¿lanzar todo junto (spec) o abrir antes lo público de captación?
2. **Interiores**: ¿las páginas interiores heredan las escenas con bento de la home o usan un scroll de lectura?
3. **Inglés**: ¿qué páginas se traducen al lanzar?
4. **Contacto**: ¿el contacto es una página con selector o se reparte en cada página?

**Tanda 2 · Confianza y prueba (Dani y Marta)**
5. **Sobre mí**: ¿qué profundidad (historia, foto, trayectoria)?
6. **Stack y CV**: ¿página aparte, sección o solo PDF?
7. **Proyecto**: ¿caso de estudio o ficha?
8. **Esta web**: ¿cómo se cuenta cómo está hecha josecoded.com?

**Tanda 3 · Venta y cuenta**
9. **Tarifas**: ¿página de tarifas propia con comparador, o todo dentro de Negocios?
10. **Packs de app**: ¿se publican los precios de app (4.000 € y 6.000 €) y dónde?
11. **Área privada**: ¿cómo se personaliza según el objetivo del usuario?
12. **Blog**: ¿existe desde el primer día?

## 7. Siguiente paso

1. Jose responde las tres tandas.
2. `ux` cierra este documento (v1.0), hace `/impeccable shape` de P1 y un wireframe por pantalla en orden de prioridad.
3. `usuario-ejemplo` recorre P1, P3 y P2 como Marta, y P4, P7 y P6 como Dani.
4. `ui` prototipa P1 en `ref/` con el sistema v6 para que Jose decida el lenguaje interior en el navegador. El resto de páginas sigue ese patrón.
