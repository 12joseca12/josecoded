# Pantallas independientes y sus contenidos

> Versión 1.0, 2026-09-29. Autor: agente `ux`. **Cerrado** con las respuestas de Jose a la batería del §6 (v0.1 era el borrador con las preguntas).
> Parte de: home cerrada en `ref/home-v6/` (contrato `.impeccable/surfaces/docs-superpowers-design-ref-home-v6-index-html.md`, sistema en `DESIGN.md`), inventario `2026-09-29-componentes-home-v6.md` (con sus decisiones cerradas del §3), `docs/working-agreements.md`, `PRODUCT.md`, spec v1.5.2 y UX v3.2 (`2026-09-17-josecoded-ux.md`; sus §2 y §4.1 de la home están superados, el resto se toma como punto de partida salvo lo que cambia el §7).
> Aquí no hay wireframes ni HTML. Es el mapa, el contenido que necesita cada pantalla y el orden de diseño y construcción. Los wireframes se hacen después, pantalla a pantalla, con `/impeccable shape` y un prototipo en el navegador para que Jose decida viéndolo.

## 0. Marco

- **Personas**: Marta (negocio local, móvil, persona principal) y Dani (CTO o reclutador, escritorio). Tienen el mismo peso en lo público. Jose es el operador del admin y de Radar, que quedan fuera de este documento porque son otra superficie (modo operar) y ya tienen su diseño en UX v3 §7.
- **Lanzamiento**: todo junto, como dice la spec §4. Producción se abre con todo, Radar y área privada incluidos. El orden del §4 es de diseño y construcción, no de lanzamiento.
- **Idiomas**: todas las páginas en español e inglés desde el lanzamiento, Negocios y área privada incluidas. Todo texto que aporte Jose (`{{DATO}}` de texto) necesita versión en inglés; los artículos del blog pueden existir en un solo idioma (UX §4.7).
- **Reglas que no se discuten**: nada inventado (ni testimonios, ni cifras, ni precios fuera de `tarifas.md`); sin métricas en la web (los precios «desde» sí); solo modo oscuro; una acción primaria por pantalla; máximo tres niveles de navegación; mobile-first; bloque sin `{{DATO}}` cubierto = bloque que no se publica.
- **Modo de superficie** (impeccable): **Persuadir** (Sobre mí, Empresas, Negocios, Proyectos, Contacto), **Leer** (ficha de proyecto, blog, artículo, legales), **Operar** (auth, chat, área privada, perfil). El modo decide la densidad, cuánto «gesto por celda» cabe y si hay bento.
- **Lenguaje de las páginas interiores** (decisión de Jose): **escenas con scroll libre**. Mismo titular a dos tonos y bentos que la home, pero sin forzar 100svh (`Scene` sin la prop `fill`) y sin paginado por gesto (`usePagedScroll` solo en la home). Sin indicador de sección ni carrusel fijado. En modo Leer y Operar el bento se usa poco o nada: manda la columna de lectura o la herramienta.
- **Cabecera v6** en todas las páginas públicas: marca · Sobre mí · Empresas · Negocios · Proyectos · Blog · idioma → ⌘K → Chat → Login. «Contacto» no está en la barra: vive en el cierre de cada página, en ⌘K y en el menú ☰. Si el blog no tiene sus tres artículos, «Blog» desaparece de la cabecera, del menú, de ⌘K y del pie (§3, P9).
- **Pie v6**: secciones, Área de clientes y Legal.

### 0.1 Choques entre la UX v3 y decisiones posteriores

Se resuelven sin preguntar porque las decisiones ya están tomadas:

| UX v3 proponía | Decisión posterior que manda | Consecuencia |
|---|---|---|
| `GitHubActivity` (actividad y número de repos) en Empresas y Sobre mí | Sin métricas en la web (2026-09-24) | Se sustituye por un enlace sobrio «Código en GitHub» sin contadores. |
| `StoreBadges` con valoración numérica | Sin métricas | Solo el enlace a la store, sin estrellas ni número. |
| Badge «Disponible para proyectos» | Quitado del hero (2026-09-29) | No vuelve en las páginas interiores. La disponibilidad solo aparece en la FAQ de Empresas y en el chat, si Jose lo confirma. |
| `ProofStrip` «Cómo está hecha esta web» en la home | Quitada «Esta web la he hecho yo» (2026-09-27); ahora josecoded.com es un proyecto (§6, decisión 8) | Ficha propia en Proyectos. |
| «Cómo trabajo» con pinning y pasos activos por scroll; trayectoria horizontal ligada al scroll | Un gesto con propósito por celda (2026-09-25) e interiores con scroll libre (§6, decisión 2) | Sin pinning en páginas interiores. Los pasos se muestran en una celda; como mucho, un gesto propio (por ejemplo, CheckList que se dibuja). |
| Barra inferior fija con WhatsApp y Propuesta en Negocios (móvil) | Sin decidir en la v6 | Se mantiene como propuesta de `ux`: Marta necesita el CTA a mano en el móvil. `ui` decide si se oculta al bajar. |
| Tailwind, shadcn, GSAP y hoja shadcn | `working-agreements.md` (CSS Modules, motion nativo) | Nada en este documento depende de esas librerías. |

---

## 1. Mapa de pantallas

Rutas en español; en inglés, bajo `/en/...` con el equivalente de UX v3 §2.1 (todas existen en los dos idiomas). Estado: **definida** (tiene ficha en UX v3 y sigue valiendo en lo esencial), **a medias** (tiene ficha, pero la v6 o una decisión posterior la cambia), **nueva** (no existe en ningún documento).

### 1.1 Públicas

| # | Pantalla | Ruta | Modo | Persona | Se llega desde | Estado |
|---|---|---|---|---|---|---|
| P1 | **Webs para tu negocio** (con comparador de packs y bloque de apps) | `/negocios` | Persuadir | Marta | Hero («Una web para mi negocio →»), escena Negocios (Ampliar → «Ir a Packs»), cabecera, ⌘K («desde 900 €»), menú, pie | a medias (UX §4.3; la v6 añade la barra de packs y «Qué incluye»; se añaden el comparador y «¿Necesitas una app?») |
| P2 | **Generador de propuesta** | `/propuesta` | Operar (chat guiado) | Marta | Celda «Propuesta al momento» (el texto escrito viaja a la ruta), P1 (CTA y «con este pack»), ⌘K, área privada sin proyecto | definida (UX §4.4) |
| P3 | **Contacto / Hablamos** | `/contacto` | Persuadir | Marta y Dani | Cierre corto de cada página, cierre «¿Empezamos?» de la home, celda «Trato directo» («Escríbeme»), ⌘K, menú ☰ (destacado), errores 404/500 | a medias (UX §4.10; la cabecera ya no tiene Contacto) |
| P4 | **Trabajo con empresas** (solo trabajo y freelancing) | `/empresas` | Persuadir | Dani | Escena Empresas (Ampliar → «Ir a Servicios», «Ver cómo trabajo»), celda Tarifas, cabecera, ⌘K, menú, pie | a medias (UX §4.2; la v6 añade Tarifas con selector y un entregable por servicio `{{DATO}}`; sin packs) |
| P6 | **Sobre mí** (con la sección «Stack y formación») | `/sobre-mi` (stack en `/sobre-mi#stack`) | Persuadir | Marta (confianza) y Dani (perfil) | Celda Sobre mí («Conóceme», Ampliar), celda «Con qué trabajo» (→ `#stack`), «Descargar CV» (PDF), cabecera, ⌘K, menú, pie, ficha de proyecto | a medias (UX §4.9; profundidad media, foto real, stack integrado) |
| P7 | **Proyectos** (índice) | `/proyectos` | Persuadir | Dani (Marta de paso) | «Ver todos» del carrusel, cabecera, ⌘K, menú, pie | a medias (UX §4.5; la v6 fija el arte de glifos; se añade josecoded.com) |
| P8 | **Caso de estudio de proyecto** | `/proyectos/[slug]` | Leer | Dani | Tarjeta del carrusel («Ver proyecto»), P7, P1 («Webs hechas»), P4 (proyecto de ejemplo por servicio), ⌘K | a medias (UX §4.6 era una ficha; pasa a caso de estudio medio) |
| P9 | **Blog** (índice) | `/blog` | Leer | Dani | Escena Blog, cabecera, ⌘K, menú, pie | definida (UX §4.7); se publica solo con 3 artículos reales |
| P10 | **Artículo** | `/blog/[slug]` | Leer | Dani | Celdas del blog en la home («Leer»), P9, relacionados, ⌘K | definida (UX §4.8) |
| P11 | **Chat con el asistente** | `/chat` | Operar | Dani | Cabecera («Chat», punto verde), ⌘K («Abrir el chat»), P6, P4, P3 | definida (UX §4.11); la antesala sin cuenta se rehace con `ChatBubble` v6 |
| P12 | **Entrar** | `/auth/login` | Operar | Marta cliente, Dani | Cabecera («Login» en violeta), ⌘K, comentar, chat, pie (Área de clientes) | definida (UX §5.1) |
| P13 | **Crear cuenta** | `/auth/registro` | Operar | ídem | P12 | definida (UX §5.2) |
| P14 | **Introduce el código** | `/auth/codigo` | Operar | ídem | P12/P13 por email | definida (UX §5.3) |
| P15 | **Callback OAuth** | `/auth/callback` | — | técnico | Google/GitHub | definida (UX §5.4); además registra la señal de origen del área (§1.4) |
| P17 | **Mi cuenta** | `/perfil` | Operar | con cuenta | Menú del avatar, área privada | definida (UX §4.13) |
| P18 | **Legales** (aviso legal, privacidad, cookies) | `/legal/*` | Leer | todos | Pie («Legal»), casilla de privacidad de los formularios, P12 | definida (UX §4.12) |
| P19 | **Errores**: 404, 410, 500, 403 y mantenimiento | cualquier ruta | — | todos | — | definida (UX §8); falta la versión visual v6 |

P5 «Stack y CV» (página aparte) y P16 «Objetivo de la cuenta» se han quitado: el stack es una sección de P6 y la personalización del área es automática. Se conservan los números del borrador para no romper referencias.

### 1.2 Área privada (`/area-clientes`)

| # | Pantalla | Ruta | Visible para | Estado |
|---|---|---|---|---|
| A1 | **Inicio del área** (personalizado automáticamente, §1.4) | `/area-clientes` | todos con cuenta | a medias (UX §6.1 distingue cliente / no cliente; se añaden las variantes por señal) |
| A2 | Tareas | `/area-clientes/tareas` | clientes | definida (UX §6.2) |
| A3 | Detalle de tarea | `/area-clientes/tareas/[id]` | clientes | definida (UX §6.3) |
| A4 | Material | `/area-clientes/material` | clientes | definida (UX §6.4) |
| A5 | Pack y extras | `/area-clientes/pack` | clientes | definida (UX §6.5) |
| A6 | Solicitar ampliación | `/area-clientes/pack/ampliar` | clientes | definida (UX §6.6) |
| A7 | Recomiéndame | `/area-clientes/recomiendame` | todos | definida (UX §6.7) |

Se llega a todo el área desde Login, el pie («Área de clientes»), ⌘K y el menú del avatar. Profundidad: área → tareas → detalle (tres niveles).

### 1.3 Lo que no es pantalla, pero necesita diseño o contenido

| Pieza | Dónde vive | Por qué importa |
|---|---|---|
| **Reservar 20 min** (Cal.com) | Bloque en P3 (vía empresa) y P4; el botón de la home abre lo mismo | Es la primaria de Dani. Necesita la cuenta de Cal.com `{{DATO}}` y el estado «si el calendario no carga». |
| **WhatsApp prellenado** | Enlaces `wa.me` desde P1, P2, P3, la home y el área | Es la primaria de Marta. El texto prellenado cambia según el origen (pack, app, propuesta, contacto) y el idioma. Número `{{DATO}}`. |
| **CV en PDF** (es/en) | «Descargar CV» de la home, P4 y P6 | Se genera en build desde los mismos datos que el CV maestro de Radar (`content/radar/`). Una sola fuente de verdad para la sección «Stack y formación», el PDF y Radar. |
| **Cierre corto** | Final de P1, P4, P6, P7, P8 (y P10 sin conversión) | Versión compacta de Closing: una frase, la primaria de la persona de esa página y «Otras formas de hablar →» a `/contacto`. En P1 la primaria es WhatsApp; en P4, reservar 20 min. |
| **Paleta ⌘K fuera de la home** | Layout global | Los comandos «Ir a» apuntan a rutas, no a anclas. Busca también proyectos y artículos por título, desde el mismo índice que genera `llms.txt`. |
| **Celda ampliada → página** | Home | Decisión cerrada: el hueco `more` lleva un resumen y el enlace a su página. El resumen sale del primer bloque de la página de destino, así que no hay copy nuevo. |
| **Barra fija de Negocios** (móvil) | P1 | WhatsApp + Propuesta. Única barra fija del sitio público. |
| **Toasts, banner sin conexión, skeletons y vacíos** | Transversal | Estados de UX v3 §8. Se diseñan una vez con el sistema v6. |

### 1.4 Personalización automática del área (A1)

Sin preguntas al usuario. La portada del área ordena sus bloques según tres señales, en este orden de prioridad:

| Prioridad | Señal | Cómo se obtiene | Qué ve primero |
|---|---|---|---|
| 1 | **Es cliente** | Fila en `clients` con su `user_id` | Su proyecto: fase, «Te toca a ti», novedades, hablar con Jose (UX §6.1). Siempre gana, digan lo que digan las otras señales. |
| 2 | **Tiene una propuesta o un lead** | Lead con su email o su `user_id` (propuesta enviada desde P2, formulario de P3) | «Tu propuesta»: pack recomendado, precio «desde», estado («Te escribo en menos de {{DATO}}»), [Escribir por WhatsApp]. |
| 3 | **Llegó con `?ref`** | Cookie `ref` (30 días) presente al crear la cuenta | «Recomiéndame» arriba: su propio enlace y qué gana (A7 resumido). Quien llega por un enlace de afiliado suele venir a recomendar o a pedir una web: debajo, «¿Quieres una web?» con [Pedir propuesta]. |
| 4 | **Página de origen** | Última página pública visitada antes de entrar, guardada en `sessionStorage` (`audience`, la misma señal que ya usa Contacto en UX §4.10) y enviada en `next` o en el callback | `negocio` (vino de `/negocios`, `/propuesta` o una ficha de web de comercio): packs resumidos (PackStrip), [Pedir propuesta], WhatsApp. `empresa` (vino de `/empresas`, `/proyectos`, `/sobre-mi` o el chat): CV en PDF, [Reservar 20 min], chat, proyectos destacados. `blog` (vino de un artículo para comentar): vuelve al artículo; el área solo se ve si entra a propósito. |
| 5 | **Sin señal** | Ninguna de las anteriores | Portada neutra con dos puertas del mismo peso: «Una web para mi negocio» (→ P1/P2) y «Trabajar juntos» (→ P4/reserva), más Recomiéndame y Mi cuenta. Nada se da por supuesto. |

Reglas:

- La señal se guarda en el perfil la primera vez (`first_audience`, columna aditiva que decide el arquitecto) y se actualiza si cambian los hechos (pasa a cliente, envía una propuesta). La página de origen solo cuenta si no había nada guardado.
- La personalización ordena y destaca; **nunca oculta** Recomiéndame, Mi cuenta ni la vía de contacto. Lo que depende de datos (proyecto, tareas, pack) solo existe para clientes.
- Tras entrar, se redirige a `next` si existe (comentar, chat); el área solo es destino por defecto cuando se entra desde Login o desde el pie.
- No se pregunta nada. Si más adelante hace falta corregir la deducción, se añade en Mi cuenta un «Me interesa» opcional; no forma parte de v1.

---

## 2. Componentes por pantalla

Leyenda: **R** = reutiliza del inventario v6. **N** = nuevo. Todas usan además las primitivas (Button, ArrowLink, Icon, IconTile, Surface, TwoToneHeading, roles de texto), SiteHeader, MobileMenu, CommandPalette, SiteFooter, SkipLink y Backdrop quieto.

| Pantalla | Reutiliza (R) | Necesita nuevo (N) |
|---|---|---|
| P1 Negocios | Scene (sin `fill`), Bento, BentoCell, PackStrip (resumen arriba), CheckList, ProposalPrompt, SegmentedControl + RateFigure (mantenimiento mensual), CtaRow, Closing compacto, CursorLight | **PageHead** (cabecera de página interior), **PackCompare** (comparador de los 4 packs: qué incluye cada uno, plazo, precio «desde»; en móvil, un pack por vista con selector), **AppOffer** (bloque «¿Necesitas una app?» con MVP y ampliada), **ExtraList**, **ProcessSteps**, **FAQ** (acordeón con `FAQPage`), **StickyCtaBar** (móvil) |
| P2 Propuesta | ChatBubble, ProposalPrompt (campo de texto libre), Chip, Button | **ProposalChat** (hilo guiado con progreso «1 de 4»), **ChoiceChips**, **ProposalCard**, **LeadMiniForm**, **InlineError** |
| P3 Contacto | SegmentedControl (Tengo un negocio / Somos una empresa), Closing compacto, CtaRow | **ContactForm** (con Turnstile y estados), **CalEmbed**, **CopyField** (email con copiar), **Disclosure** («Prefiero dejar mis datos») |
| P4 Empresas | Scene, Bento, BentoCell, SlidingList (servicios), SegmentedControl + RateFigure (tarifas), CheckList (qué entrego), Chip, CtaRow, Closing compacto | PageHead, ProcessSteps, FAQ, CalEmbed |
| P6 Sobre mí | AboutSummary (cabecera de página), Scene, Bento, BentoCell, Chip (stack en bloque, sin marquesina), IconTile, CtaRow, Closing compacto | PageHead con retrato, **Timeline** (trayectoria con fechas reales), **PrinciplesList** («Cómo trabajo»), **StackGroups** (stack agrupado), **CredentialList** (formación con estado), **LinkRow** (LinkedIn, GitHub, CV) |
| P7 Proyectos | ProjectCard (apilada, sin carrusel fijado), SegmentedControl (Todos · Apps · Webs) | PageHead, **EmptyState** (filtro sin resultados) |
| P8 Caso de estudio | ProjectCard (relacionados), Chip (stack), CheckList (qué hice), Button (enlace de prueba), Closing compacto | **ProjectHead** (nombre, tipo, estado, enlaces de prueba), **ScreenGallery** (capturas), **StoreLinks** (sin valoración), **CaseSection** (reto, solución, resultado con título y texto), **PrevNext** |
| P9 Blog | PostTeaser, Chip (etiquetas) | PageHead, **LoadMore**, EmptyState («no hay en este idioma») |
| P10 Artículo | Chip, PostTeaser (relacionados) | **Prose** (cuerpo MDX), **CodeBlock** con copiar, **Toc**, **ReadingProgress**, **ShareRow**, **CommentThread**, **StatusBadge** |
| P11 Chat | ChatBubble (misma burbuja de la home), Chip (sugerencias), LiveDot | **ChatThread**, **ChatComposer**, **StatusBand**, **AuthGateCard** (antesala sin cuenta), **MeetingSheet** |
| P12–P15 Auth | Button, Surface | **AuthCard**, **AuthProviders**, **OtpInput** (6 casillas), **Banner** |
| P17 Mi cuenta | SegmentedControl (idioma), Button | **AccountCard**, **ConfirmDialog** (solicitar borrado) |
| P18 Legales | — | Prose, Toc |
| P19 Errores | Button, ArrowLink | **ErrorPage** |
| A1–A7 Área | BentoCell en modo operar (sin CursorLight), SlidingList, PackStrip (pack contratado y packs resumidos en la variante `negocio`), SegmentedControl (filtros de tareas), ChatBubble (comentarios de tarea), Chip | **AppShell** (barra lateral en escritorio, barra inferior en móvil), **PhaseSteps**, **TaskRow**, StatusBadge, **FileList** + **Uploader**, **UpgradeSummary**, **ReferralLink**, **ProposalSummary** (variante con propuesta), Skeleton, EmptyState, ErrorState, Toast |

**Componentes nuevos compartidos** (se hacen una vez, antes de la primera página que los necesite): PageHead, FAQ, ProcessSteps, EmptyState, ErrorState, Skeleton, Toast, StatusBadge, Prose, Toc, CalEmbed, ContactForm y ErrorPage.

---

## 3. Contenidos por pantalla

Bloques en el orden de lectura (móvil). **Hay**: contenido que ya existe en el repo, en la spec o en el vault. **`{{DATO}}`**: lo tiene que aportar Jose. **Todo el copy existe en `messages/es.json` y `messages/en.json`**; todo `{{DATO}}` de texto (descripciones, historia, FAQ, casos de estudio, entregables) se pide en los dos idiomas, y `i18n:check` marca como pendiente la clave que falte en cualquiera de ellos. Los precios salen siempre de `packages/pricing` (fuente: `Comercial/tarifas.md`), se formatean por idioma con `Intl.NumberFormat` y nunca se escriben en `messages`.

### P1 Webs para tu negocio `/negocios`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera de página | Titular a dos tonos («Webs para tu negocio. Cuatro packs con precio cerrado.», el de la escena) + párrafo citable (qué, para quién, desde cuánto, plazo) + [Escribir por WhatsApp] + «Pedir propuesta orientativa →» | Hay: titular v6 y párrafo de UX §4.3 (en español). Falta: número de WhatsApp `{{DATO}}`; la versión en inglés la redacta `redactor` |
| 2 | Comparador de packs | P1 Web básica 900 € · 1 sem, P2 Pedidos o reservas 1.400 € · 2 sem, P3 Gestión 2.500 € · 2 sem, P4 Gestión + automatizaciones 4.200 € · 3 sem. Filas comparables (qué incluye cada uno, en lenguaje llano; plazo; precio «desde») y «Pedir propuesta con este pack →» por columna. «Precios desde, sin IVA. Dominio y hosting a tu nombre.» | Hay: `tarifas.md` (incluye y plazos). El «incluye» se reescribe en lenguaje de Marta (`redactor` con `voz.md`), en es y en; Jose lo valida |
| 3 | Propuesta al momento | ProposalPrompt con los ejemplos de la home; lleva a P2 con el texto | Hay: copy v6 en español; faltan los ejemplos en inglés |
| 4 | ¿Necesitas una app? | App MVP desde 4.000 € · 6 semanas (iOS + Android, 3–5 pantallas, cuentas de usuario, backend sencillo, publicación en las stores) y app ampliada desde 6.000 € · 8 semanas (MVP + notificaciones, pagos o conexión con tu sistema). [Escribir por WhatsApp] con mensaje prellenado «app». Sin jerga: «React Native» y «Supabase» no aparecen aquí | Hay: `tarifas.md`. El texto llano en es y en lo redacta `redactor` |
| 5 | Extras | Mantenimiento básico 49 €/mes · extendido 149 €/mes (selector mensual), SEO básico 250 € · completo 600 €, GEO 300 €, revisión de seguridad 250 €, con una línea de qué es cada uno | Hay: `tarifas.md` y nombres llanos de UX §10.2 |
| 6 | Cómo es el proceso | Hablamos → presupuesto cerrado → pagos 40 / 30 / 30 → publicada y 30 días de garantía | Hay: `condiciones.md` |
| 7 | Webs hechas | ProjectCard de webs de comercios | **`{{DATO}}`: nombres, URLs, capturas y frase en es/en.** Sin ellos, el bloque no se publica |
| 8 | Preguntas | Cuánto tarda, qué necesito darte, dominio y hosting, qué pasa después, se puede ampliar, ¿y si quiero una app? | Hay: respuestas derivables de `condiciones.md` y `tarifas.md`. Jose valida el texto |
| 9 | Cierre corto | «Te resumo: precio cerrado, plazo cerrado, sin permanencia» + [Escribir por WhatsApp] + «Otras formas de hablar →» | Hay |
| — | Barra fija (móvil) | [WhatsApp] [Propuesta] | Hay |

### P2 Generador de propuesta `/propuesta`

Contenido completo en UX §4.4 y §10.3 (preguntas, chips, estados y microcopy), a traducir al inglés. El generador también funciona en `/en/proposal`: el asistente responde en el idioma de la página. Falta: **plazo real de respuesta** `{{DATO}}` («Te escribo en menos de 24 h laborables» es un supuesto) y el número de WhatsApp. El «incluye» de la ProposalCard sale del mismo texto que P1-2. Si la clasificación apunta a una app, la propuesta muestra el bloque de P1-4 en vez de un pack web.

### P3 Contacto / Hablamos `/contacto`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | «¿Empezamos? Cuéntame qué necesitas.» (el del cierre de la home) | Hay |
| 2 | Selector | Tengo un negocio / Somos una empresa. Segmento inicial por `?via`, por el recuerdo de la sesión (`audience`) o, si no hay nada, negocio | Hay: UX §4.10 |
| 3a | Vía negocio | [Escribir por WhatsApp] (primaria) + «Pedir propuesta orientativa →» + «Prefiero dejar mis datos» (formulario plegado) | Falta: WhatsApp `{{DATO}}` |
| 3b | Vía empresa | Formulario abierto (primaria: Enviar) + [Reservar 20 min] (Cal.com) + email con copiar | Falta: email real y cuenta de Cal.com `{{DATO}}` |
| 4 | Datos | Email, LinkedIn, GitHub, «Respondo en menos de {{DATO}}» | Hay: LinkedIn. Falta: email, usuario de GitHub, plazo de respuesta `{{DATO}}` |

### P4 Trabajo con empresas `/empresas`

Solo trabajo y freelancing para empresas: por proyecto, por horas o como puesto. **Sin packs** (ni web ni app: los packs viven en Negocios).

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | «Trabajo con empresas. Web, móvil e IA para tu producto.» + párrafo citable (quién, qué, para quién, modalidad) + [Reservar 20 min] + «Descargar CV →» | Hay: titular v6. Falta: ciudad `{{DATO}}` |
| 2 | Servicios | Web con Next.js · Apps con React Native · IA integrada. Por servicio: qué entrego, con qué y un caso de estudio de ejemplo | **`{{DATO}}`: entregable de cada servicio en es/en** (ya marcado en la v6). El ejemplo depende de P8 |
| 3 | Tarifas | Por horas 40 €/h · feature cerrada desde 150 € (las dos de la spec y de la celda v6). Sin packs de app ni de web | Hay: `tarifas.md`. Ver nota abajo |
| 4 | Cómo trabajo | Hablamos 20 min → propuesta con precio cerrado → iteraciones con demo semanal → entrega, código y 30 días de garantía | Hay: UX §4.2 y `condiciones.md`. Jose confirma la cadencia de demos |
| 5 | Con qué trabajo | Resumen del stack y «Ver stack y formación →» (`/sobre-mi#stack`) | Hay |
| 6 | Pruebas | Enlaces a stores, «Código en GitHub», casos de estudio destacados. Sin contadores | Falta: enlaces de stores y usuario de GitHub `{{DATO}}` |
| 7 | Preguntas | Disponibilidad, remoto, contrato o puesto, plazos, facturación | Falta: respuestas de Jose en es/en `{{DATO}}` (disponibilidad y si acepta puesto fijo) |
| 8 | Cierre corto | [Reservar 20 min] + «Escribir por formulario →» (`/contacto?via=empresa`) + «Preguntar al asistente →» | Falta: Cal.com `{{DATO}}` |

Nota sobre tarifas: la «feature cerrada desde 150 €» se mantiene porque está en la spec (§11 Q3) y en la celda Tarifas de la v6, y es una tarifa de trabajo freelance, no un pack de producto. Si Jose la considera un pack, se quita y el selector de la celda v6 pasa a mostrar solo «por horas»; eso cambiaría la home y queda anotado en el §7.

### P6 Sobre mí `/sobre-mi` (profundidad media)

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera con retrato | Foto real, nombre, «Desarrollador full-stack freelance · {{ciudad}}», frase de la celda v6 | Hay: nombre «Jose Carlos Sánchez» y frase. **`{{DATO}}`: foto real, ciudad** |
| 2 | Historia corta | Dos o tres párrafos en primera persona: de dónde viene, por qué hace apps y webs, cómo trabaja con la gente | **`{{DATO}}`: la cuenta Jose, en es y en** (`redactor` la edita con `voz.md`, no la inventa) |
| 3 | Trayectoria | 2026 josecoded v2 y HazmeFila · 2026 Oportunix · {{año}} 3catinfo · empleos | Hay: fechas de repos. **`{{DATO}}`: año y rol en 3catinfo, empleos (empresa, puesto, años), años de experiencia, desde cuándo es freelance** |
| 4 | Cómo trabajo | Tres principios de `voz.md`: qué hago, cuánto cuesta, cuándo está | Hay (ejemplos de `voz.md` provisionales, pendientes de Jose) |
| 5 | **Stack y formación** (`#stack`) | Stack agrupado: móvil · web · backend y datos · calidad y operaciones, solo lo que Jose usa de verdad. Formación: ITIL 4, DevOps & Cloud Computing (AWS, GitLab CI), Professional Scrum Master, con estado. «Descargar CV (PDF) →» en es o en según la página | Hay: lista de UX §18 y la marquesina v6. **`{{DATO}}`: qué entra y qué sobra del stack; qué certificaciones están obtenidas (organismo y año); CV maestro es/en** (el mismo que pide Radar) |
| 6 | Enlaces | LinkedIn, GitHub, stores, CV | Hay: LinkedIn. Falta: GitHub y stores |
| 7 | Cierre corto | [Hablamos] + «Preguntar al asistente →» | Hay |

### P7 Proyectos `/proyectos`

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | «Proyectos en uso. Con enlace a la store, a la web o al código.» | Hay: titular v6 |
| 2 | Filtro | Todos · Apps · Webs | Hay |
| 3 | Tarjetas | HazmeFila (App), Oportunix (Web), Webs de comercios (Web), 3catinfo (App), **josecoded.com** (Web) | Hay: nombre, tipo y arte de glifos. **`{{DATO}}`: qué hace cada uno en una frase (es/en), estado (publicado o no), enlaces** |

Orden por número de pruebas verificables (UX §4.5); 3catinfo nunca en primer lugar (NDA). josecoded.com tiene la prueba más directa (la estás usando) pero no encabeza la lista: primero van los proyectos para terceros.

### P8 Caso de estudio `/proyectos/[slug]` (caso medio)

Se lee en dos o tres minutos. Para cada proyecto, Jose aporta unos dos párrafos por bloque, en es y en.

| # | Bloque | Contenido | Hay / falta |
|---|---|---|---|
| 1 | Cabecera | Nombre, tipo, estado, frase citable, enlace de prueba principal (store, web o código) como primaria | **`{{DATO}}`: estado y enlaces** |
| 2 | Capturas | Galería de producto | **`{{DATO}}`: capturas reales** (sin ellas se omite el bloque y queda el arte de glifos) |
| 3 | El reto | Qué problema resolvía y para quién | **`{{DATO}}`** |
| 4 | Qué hice | Decisiones y trabajo, tres a cinco puntos | **`{{DATO}}`** |
| 5 | Stack | Chips (ocultable; 3catinfo sin stack) | Hay: HazmeFila (Expo + Supabase), Oportunix (Next.js 16 + Firebase), josecoded.com (Next.js en Cloudflare Workers con OpenNext, gateway Hono, Fastify en Omen, Supabase, n8n, Umami) |
| 6 | Resultado | Solo hechos verificables (publicada, en uso, qué permite), sin métricas | **`{{DATO}}`** o se omite |
| 7 | Anterior / siguiente y cierre corto | «Hablar de un proyecto así» → P3 (sin `?via`: hereda el recuerdo) | Hay |

**Caso josecoded.com**: es el único con casi todo el contenido ya escrito en el repo (spec, diseño técnico, `DESIGN.md`, contrato de la home). Reto: una web que sirva a dos audiencias y sea a la vez la prueba de oficio. Qué hice: la escena de glifos, el bento por escenas, el gateway y el backend en el servidor propio, el generador con IA y precio por reglas, Radar. **Decidido el 2026-09-30: el repo es privado**; el caso enlaza solo a la web (`webUrl`), sin `repoUrl`, y explica la arquitectura (gateway en Workers, Fastify en Omen, Supabase, n8n, Umami) en texto. `redactor` lo escribe a partir de esos documentos y Jose lo valida.

### P9 Blog y P10 Artículo

| Bloque | Contenido | Hay / falta |
|---|---|---|
| Regla de publicación | La sección sale con **un mínimo de 3 artículos reales** (en el idioma de la página o en el otro, marcados «Solo en inglés» / «Only in Spanish»). Con menos de 3, se ocultan la escena Blog de la home, «Blog» en la cabecera, el menú, ⌘K y el pie, y `/blog` responde 404. Se comprueba en build | — |
| Cabecera del índice | «Lo que voy aprendiendo. Artículos sobre lo que construyo.» | Hay: titular v6 |
| Artículos | Título, fecha, minutos, etiquetas, entradilla | **`{{DATO}}`: tres artículos como mínimo** |
| Artículo | Cuerpo MDX, índice, compartir, relacionados, comentarios | Plantilla definida; comentarios con microcopy de UX §4.8 |

Candidatos con material ya en el repo: «Cómo está hecha josecoded.com» (complementa el caso de estudio), «Una nube de glifos en Three.js» (escena del hero) y «Un asistente que nunca envía nada sin mí» (Radar). Los escribe Jose o `redactor` a partir de lo que Jose cuente.

### P11 Chat `/chat`

Contenido en UX §4.11 y §10.4, en es y en. El asistente responde en el idioma de la página. Falta: dos o tres intercambios reales de ejemplo para la antesala (de respuestas verdaderas de `knowledge.json`), y actualizar `josecoded-api/src/knowledge/knowledge.json` con los `{{DATO}}` resueltos.

### P12–P15 Auth y P17 Mi cuenta

Contenido completo en UX §5, §4.13 y §10.4, a traducir. Sin `{{DATO}}`. Depende de configurar OAuth de Google y GitHub y la plantilla OTP en Supabase, **en los dos idiomas** (insumo pendiente de Jose en ESTADO). El callback guarda la señal de origen (§1.4).

### A1 Inicio del área

Bloques según la señal de §1.4. Todo el contenido existe en UX §6 y §10.5, salvo el copy nuevo de tres variantes, que se escribe en es y en:

- **Propuesta**: «Tu propuesta» + estado + WhatsApp.
- **Empresa**: «Trabajemos juntos» + CV + reservar + chat.
- **Sin señal**: dos puertas.

### P18 Legales

| Página | Contenido | Falta |
|---|---|---|
| Aviso legal | Titular, NIF, domicilio, email, condiciones de uso (LSSI) | **`{{DATO}}`: nombre legal, NIF, domicilio fiscal, email** |
| Privacidad | Responsable, finalidades (leads, cuenta, chat, comentarios, afiliados, personalización del área por señal de origen), base legal, conservación, derechos, encargados (Supabase, Cloudflare, Workers AI, Cal.com) | Mismos datos; Jose valida la lista de encargados |
| Cookies | Umami sin cookies, cookie `ref` de 30 días, sesión de Supabase; `sessionStorage` de `audience` (no es cookie); sin banner | Hay: UX §4.12 |

Las tres en es y en. La versión española es la que vale legalmente; la inglesa lo dice.

### P19 Errores

Copy en UX §8 (tabla 8.1–8.16), a traducir. Sin `{{DATO}}` salvo el WhatsApp de las alternativas.

### 3.1 `{{DATO}}` consolidados

Todos los de texto se piden **en español y en inglés**.

- **Nuevos respecto a UX §18**:
  - foto real;
  - entregable por servicio;
  - plazo real de respuesta;
  - historia personal (media);
  - qué entra del stack;
  - capturas por proyecto;
  - reto, trabajo y resultado por proyecto;
  - CV maestro;
  - cuenta de Cal.com;
  - datos del titular para el aviso legal;
  - respuestas de la FAQ de Empresas (disponibilidad y puesto fijo);
  - tres artículos para el blog.
- **Siguen abiertos de UX §18**:
  - nombre a mostrar (la v6 usa «Jose Carlos Sánchez»);
  - ciudad y años;
  - estado y enlaces de 3catinfo, HazmeFila y Oportunix;
  - webs de comercios;
  - certificaciones y empleos;
  - WhatsApp y email;
  - usuario de GitHub y cuentas de stores;
  - ~~si el repo de josecoded será público~~ (resuelto 2026-09-30: privado).

---

## 4. Orden de diseño y construcción

Es el orden en que se diseñan y se construyen las pantallas. **No es un orden de lanzamiento**: producción se abre con todo (§0).

Criterio: primero lo que convierte a las dos personas (métricas de la spec: ≥ 4 leads de negocio y ≥ 2 contactos de empresa al mes) y lo que fija patrones para el resto. Dentro de eso, primero lo que tiene los datos listos, para que Jose decida en el navegador con contenido real y no con huecos.

| Orden | Pantalla | Por negocio | Por dependencia técnica | Datos listos |
|---|---|---|---|---|
| 1 | **P1 Negocios** | Camino de Marta (persona principal); destino del CTA secundario del hero | Solo `packages/pricing` (fase 1 del plan). **Fija el lenguaje de las páginas interiores**: PageHead, FAQ, ProcessSteps, PackCompare y el cierre corto salen de aquí | Casi todos (falta WhatsApp) |
| 2 | **P3 Contacto** | Salida de las dos personas y destino del cierre corto de todas las páginas | ContactForm, Turnstile, `POST /leads` y CalEmbed; los reutilizan P4 y P2 | Faltan WhatsApp, email y Cal.com |
| 3 | **P4 Empresas** | Camino de Dani; lleva «Reservar 20 min» | Reutiliza casi todo de P1 y P3 | Faltan entregables por servicio y enlaces |
| 4 | **P2 Generador de propuesta** | El lead más cualificado de Marta | Gateway (Workers AI), Turnstile, `pricing` y leads; la pieza con más estados | Listos (falta el plazo de respuesta) |
| 5 | **P7 Proyectos + P8 Caso de estudio** | Prueba de oficio para Dani y confianza para Marta | Pipeline de contenido MDX (el mismo del blog) | El caso josecoded.com se puede hacer ya; **el resto está bloqueado** por los `{{DATO}}` de proyectos |
| 6 | **P6 Sobre mí** (con Stack y formación y el PDF) | Confianza; métrica de 90 s en página | Estático + generación del PDF desde los datos del CV maestro (compartido con Radar) | **Bloqueado** por foto, historia, trayectoria y CV maestro |
| 7 | **P18 Legales + P19 Errores** | Obligatorios; bajo riesgo de diseño | Plantilla Prose y ErrorPage | Faltan los datos del titular |
| 8 | **P12–P15, P17 Auth y cuenta** | Habilitan chat, comentarios y área | Supabase Auth con OAuth (insumo de Jose) y registro de la señal de origen | Listos |
| 9 | **P11 Chat** | Secundario para Dani | Auth y rutas `admin-chat/*` conservadas | Faltan ejemplos reales para la antesala |
| 10 | **A1–A7 Área privada** | Retención y afiliados | Auth, RLS, tablas existentes y `first_audience` | Listos |
| 11 | **P9 Blog + P10 Artículo** | Actividad y GEO | Pipeline MDX (compartido con P7), comentarios con auth, regla de los 3 artículos en build | **Bloqueados** por los artículos |

Si Jose aporta antes los datos de los proyectos, P7/P8 suben al segundo puesto. Cada pantalla se construye ya bilingüe: no hay pasada de traducción al final.

---

## 5. Decisiones de `ux` dentro del margen

1. **El hero «Ver proyectos» lleva a la escena de la home**, no a `/proyectos`, como en el prototipo. «Ver todos» del carrusel es la puerta al índice.
2. **La celda «Con qué trabajo» enlaza a `/sobre-mi#stack`**. Hoy no tiene destino.
3. **Las filas de Servicios y de Packs, que hoy se pueden enfocar pero no hacen nada, pasan a ser enlaces** a su bloque en P4 y en el comparador de P1 (`/empresas#web`, `/negocios#p2`). Resuelve el punto de accesibilidad 4.5 del inventario.
4. **Mi cuenta se queda como pantalla aparte** del área. El área es para quien trabaja o recomienda; la cuenta la tienen también quienes solo comentan o chatean.
5. **El cierre corto de cada página lleva la primaria de su persona** (WhatsApp en Negocios, reservar en Empresas, Hablamos en el resto) y siempre «Otras formas de hablar →» a `/contacto`.
6. **El comparador de packs en móvil muestra un pack por vista** con selector (PackStrip arriba como índice), nunca una tabla con scroll horizontal.
7. **Admin y Radar no entran en este documento.** Se retoman con el sistema v6 a partir de UX v3 §7.

---

## 6. Decisiones de Jose (2026-09-29)

| # | Tema | Decisión |
|---|---|---|
| 1 | Alcance | **Todo junto**, como la spec: producción se abre con todo, Radar y área privada incluidos. El §4 es orden de diseño y construcción. |
| 2 | Interiores | **Escenas con scroll libre**: titular a dos tonos y bentos, sin 100svh forzado ni paginado. |
| 3 | Inglés | **Todas las páginas en es y en** desde el lanzamiento, Negocios y área incluidas. |
| 4 | Contacto | **Página `/contacto` con selector** negocio/empresa (WhatsApp para negocio; formulario y reserva de 20 min para empresa) y **cierre corto** en cada página. |
| 5 | Sobre mí | **Profundidad media**: foto real, historia corta, trayectoria con fechas, cómo trabajo, enlaces. |
| 6 | Stack y CV | **Sección «Stack y formación» dentro de Sobre mí** y **PDF es/en** generado de los mismos datos que el CV maestro de Radar. |
| 7 | Proyecto | **Caso de estudio medio**: reto, qué hice, capturas, stack, resultado verificable, enlaces. |
| 8 | josecoded.com | **Es un proyecto** con su propio caso en Proyectos. |
| 9 | Tarifas de negocio | **Comparador dentro de `/negocios`**. Sin página de tarifas aparte. |
| 10 | Packs de app | **En Negocios**, bloque «¿Necesitas una app?» con precio «desde» (MVP 4.000 €, ampliada 6.000 €). **Empresas es solo trabajo y freelancing**, sin packs. |
| 11 | Área privada | **Personalización automática**, sin preguntar: cliente, propuesta o lead, `?ref` y página de origen (§1.4). Sin pantalla de objetivo. |
| 12 | Blog | **Sale con un mínimo de 3 artículos reales**; si no llegan, se ocultan la sección y la entrada de la cabecera. |

---

## 7. Impacto en spec y plan

Para el paso 5 de `ESTADO.md` (actualizar spec, UX y plan + `/plan-eng-review`).

| Tema | Spec v1.5.2 / UX v3.2 decía | Ahora | Qué hay que tocar |
|---|---|---|---|
| **Contacto** | Cabecera con CTA «Contacto» (spec §12); `/contacto` con selector (UX §4.10) | Contacto fuera de la cabecera; `/contacto` con selector y cierre corto en cada página | Spec §12 (cabecera). UX §3.2 y §4.10 (cierre corto como pieza común). Plan: componente Closing compacto y ContactForm antes que P4. |
| **Stack y CV** | Stack en Empresas y Sobre mí; «CV descargable» sin fuente (spec §4, 2); CV/JSON Resume solo como idea candidata (spec §4.1) | Sección «Stack y formación» en Sobre mí; PDF es/en generado en build desde el CV maestro de Radar | Spec §4 (la idea candidata «CV generado» pasa a alcance, sin `/resume.json` público salvo que se decida). Spec §13 (Radar comparte la fuente del CV). UX §4.2 y §4.9. Plan: tarea de datos del CV maestro + generación del PDF antes de P6, dependencia compartida con Radar. |
| **Packs de app** | App MVP y ampliada solo en `tarifas.md`; ningún sitio de la web | Bloque «¿Necesitas una app?» en Negocios; Empresas sin packs | Spec §4 (punto 3, «Webs para tu negocio» incluye apps). `packages/pricing`: exponer los dos packs de app. Generador (spec §4 punto 4 y UX §4.4): la clasificación puede devolver un pack de app. UX §4.2 (quitar cualquier pack de Empresas) y §4.3. |
| **Tarifas de Empresas** | 40 €/h y 150 €/feature | Se mantienen las dos (la feature cerrada es tarifa de trabajo, no pack) | Nada, salvo que Jose considere la feature un pack: entonces cambian UX §4.2 y la celda Tarifas de la home v6. |
| **Comparador de packs** | Cuatro `PackCard` (UX §4.3) | `PackCompare` dentro de `/negocios`, un pack por vista en móvil | UX §4.3. Plan: componente nuevo. |
| **Personalización automática** | Área igual para todos salvo cliente / no cliente (UX §6.1) | Portada ordenada por señales: cliente → propuesta/lead → `?ref` → página de origen → neutra | Spec §4 (punto 13). UX §6.1 y §5.4 (el callback guarda la señal). Modelo de datos: columna aditiva `first_audience` en el perfil (decide el arquitecto; migración con OK de Jose). Privacidad: nueva finalidad. Tests: una prueba por señal y por prioridad. |
| **Todo bilingüe** | i18n es/en en lo público (spec §4 punto 11); admin solo es | Todas las páginas públicas **y el área privada** en es y en desde el lanzamiento; admin y Radar siguen solo en español | Spec §4 y §10 (criterio de aceptación: `i18n:check` sin claves pendientes en los dos idiomas). UX §2.2 ya tenía rutas en inglés del área: se confirman. Plantillas OTP de Supabase y mensajes de WhatsApp prellenados en los dos idiomas. Generador y chat responden en el idioma de la página. Plan: el coste de contenido se duplica; cada tarea de página incluye su `en.json`. |
| **Proyectos** | Ficha (UX §4.6) | Caso de estudio medio; josecoded.com como proyecto | UX §4.5 y §4.6. Esquema del frontmatter MDX de proyectos: bloques `challenge`, `work`, `result`. |
| **Blog** | «Nunca se publica vacío» (UX §4.7) | Mínimo 3 artículos; si no, se ocultan sección, cabecera, menú, ⌘K y pie; `/blog` da 404 | UX §4.7. Plan: comprobación en build y navegación condicionada. |
| **Interiores** | Pinning y efectos ligados al scroll en Empresas, Negocios y Sobre mí (UX §4.2, §4.3, §4.9) | Escenas con scroll libre, sin pinning | UX §4.2, §4.3 y §4.9 (quitar pinning). Plan: `Scene` con prop `fill` solo en la home; `usePagedScroll` solo en la home. |

---

## 8. Siguiente paso

1. Paso 5 de `ESTADO.md`: actualizar spec, UX y plan según el §7, y pasar `/plan-eng-review`.
2. `ux` hace `/impeccable shape` de P1 y los wireframes en el orden del §4.
3. `usuario-ejemplo` recorre P1, P3 y P2 como Marta, y P4, P7 y P6 como Dani.
4. `ui` prototipa P1 en `ref/` con el sistema v6 para que Jose valide en el navegador el lenguaje de las páginas interiores. El resto de páginas sigue ese patrón.
