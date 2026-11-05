# Plan maestro: componentes por pantalla, transversales, CRM completo y orden de construcción

**2026-11-05 · `arquitecto` · rama `docs/master-plan`.** Consolida los cuatro informes de especialistas de hoy (`docs/plan/especialistas/{marketing,seo,psicologia,crm}.md`) con `brief.md`, `decisiones.md`, `division-pantallas.md`, `valor-pantallas.md`, `seo.md`, `ofertas.md`, `datos.md`, `pantallas.md`, `bloques.md` y `migraciones-chat.md`. Decide **qué componentes lleva cada pantalla pública y en qué orden**, resuelve los choques entre especialistas, cierra **qué incluye el CRM para ser completo y profesional** y deja el **orden de construcción por olas**. No toca código ni los documentos de arquitectura: lo que cambia una decisión cerrada va como pregunta en §5.

**No se duplica lo que ya está en vuelo** en otras ramas: `public/como-trabajo` (hecha, arreglando un test), `public/about-legal` (Sobre mí con el CV real y páginas legales), `infra/perf-budget` (JS de la home ≤ 150 KB y CI más rápida) y `data/lead-claim` (M04 `claim/assign/discard` + columnas `offer`/`extras`/`offer_answers` de `leads` + acciones en `/admin/interesados`). Para esas pantallas, este plan fija la lista objetivo y deja un bloque de ajuste pequeño si la rama no la cubre.

**Hechos que ordenan la prueba:** Jose trabaja en Alten desde abril de 2024 como desarrollador React Native en las apps de 3Cat (en 3CatInfo: responsable de la integración de IA, referente de accesibilidad, formó a los equipos de React Native, iOS, Android y QA; en la app principal de 3Cat, funcionalidades); NextRaket es su actividad freelance para varias empresas (2024–hoy); DAW 2023; ITIL 4; inglés B2. Auth y admin funcionan; M01–M03 aplicadas en Supabase; Resend activo.

Tamaños: **S** ≤ 30 min de agente · **M** ≤ 1 h (un bloque, decisión 10.2) · **L** = 2–4 bloques (se parte antes de empezar).

---

## 0. Resumen

1. **Las tres vías acaban hoy en un callejón:** `/proyectos` dice «Pronto», la home es solo el hero, los precios son `000 €`, el chat «abre muy pronto» y el recruiter no tiene un CV a un clic. La web pide confianza sin enseñar nada verificable. Los cuatro especialistas coinciden en el diagnóstico; difieren en detalles que §1 resuelve.
2. **Principios que no se negocian** (ya en `valor-pantallas.md` §0 y en la lista de bloqueo de psicología §6): prueba verificable con un clic o nada; una acción primaria por vista; primera persona singular; ninguna urgencia inventada; ningún pago premarcado; ningún email antes de dar valor; cifras de demo marcadas como demo; precios con fecha o sin precio, nunca ceros.
3. **Lo que se construye primero** es lo que no necesita datos nuevos de Jose: estado honesto del precio, `ProofStrip` + `DemoTag`, CTA de CV en el hub, `WhatHappensNext` y éxito por vía en contacto, `TaskExamples` con tamaño, `TermsStrip`, `PilotTask`, confianza en «A medida». Después, lo que depende de él (casos reales, analítica, disponibilidad, pago por fases) y el CRM.
4. **El CRM pasa de «cartera y comisión al ganar» a un sistema de ventas completo:** propuestas con versiones y aceptación firmada, cobros por hitos con comisión devengada por cobro, tareas y recordatorios, pipeline con probabilidad e historial, atribución, RGPD de la cartera y onboarding con contrato. Facturación fuera (VeriFactu): el CRM registra, no emite.
5. **Once preguntas para Jose** (§5), una lista de datos que solo él puede dar (§6) y las olas de bloques (§4) listas para el tablón.

---

## 1. Conflictos entre especialistas y cómo quedan

| # | Tema | Posiciones | Decisión | Por qué |
|---|---|---|---|---|
| C1 | **Precio provisional** (`000 €`, `00 €/h`) | Marketing: rango orientativo (a) o «precio cerrado en 24–48 h» (b). Psicología: «Precio en revisión · se publica en {mes}» o rango; nunca ceros. SEO: sin cifra no hay GEO de precios; cuando haya, con fecha. | Componente `PriceState` con tres estados: `review` («Precio en revisión. Te paso el precio cerrado por escrito en 24–48 h»), `range` («entre X y Y €», solo si Jose da el rango) y `final` («desde X €», «actualizado el {fecha}», JSON-LD `Offer`, `llms.txt`). Hasta la ronda de precios: `review`. Los plazos en semanas se publican ya (son ciertos y citables). | No se inventa una cifra; los ceros se leen como fallo o como precio escondido; el plazo de respuesta convierte la ausencia de precio en una promesa concreta. **Pregunta 1.** |
| C2 | **Mantenimiento premarcado** (R9 de `ofertas.md`: marcado por defecto en Web y app) | Psicología: nunca premarcar un pago recurrente (*sneak into basket*). Marketing: no lo trata. | Nunca premarcado. Aparece desmarcado con la línea «Recomendado en Web y app». Se cambia también `nexoGuide.ask.more` («Marca solo lo que sepas que necesitas; lo que dudes lo vemos hablando»). | Inflar el ancla por miedo produce arrepentimiento y peor lead. R9 pasa a «sugerido, nunca marcado». |
| C3 | **Página por ciudad** («desarrollador React Native en {ciudad}» × N) | SEO: no (*doorway pages*, política de spam de Google). Marketing: no lo pide. | Rechazada. Madrid vive en el párrafo de entidad de home y Sobre mí, en `Person.address` y `areaServed`. Una página `/servicios/a-medida/madrid` solo con ≥ 2 casos propios de Madrid. | Riesgo de penalización a todo el dominio por queries de volumen mínimo. |
| C4 | **CV en la home** | Marketing: enlace de texto bajo los CTAs del hero («¿Selección de personal? Descarga mi CV»). `division-pantallas.md` §0: CV prohibido en home, pie y fichas; casa en `/sobre-mi` y en el hub `#contratacion`. | Sin PDF en la home. La tarjeta de contratación de `ServicesStrip` dice «Para tu equipo: CV y trayectoria» y lleva a `/sobre-mi`, donde «Descargar CV» es la primaria. Se revisa con el evento `cv_download{from}` tras un mes de analítica. | Una casa por contenido y una primaria por pantalla; el coste para el recruiter es un clic. |
| C5 | **Primaria de la tarjeta de contratación del hub** | Marketing: «Descargar CV» (hoy lleva a un formulario). `division-pantallas.md`: ya decía «Descargar CV» como primaria de la vía. Código actual: «Contactar para contratación». | «Descargar CV» (PDF con `download`) primaria; «Ver trayectoria» → `/sobre-mi` secundaria; «Preguntar disponibilidad a Nexo» terciaria (2.8). Si el PDF no existe aún, el botón no se renderiza y «Ver trayectoria» pasa a primaria. | Un recruiter quiere el PDF y un email, no un formulario. |
| C6 | **Posición de `ProofStrip` en la home** | Marketing: justo bajo el hero, antes del enrutador. Psicología: después de `ServicesStrip`. SEO: una línea, donde sea. | Bajo el hero, antes de `ServicesStrip`. | La pregunta «¿esto es real?» se responde antes de pedir al visitante que elija vía. |
| C7 | **Nivel «Prototipo» y tarjeta «Empieza por el Prototipo» (R4)** | Marketing: tarjeta secundaria Prototipo como *foot in the door*. Decisión 2.25 (Jose): sin nivel Prototipo aparte. | No se reabre. R4 queda sin efecto; el descubrimiento va dentro de cada nivel. Si Jose lo quiere, lo dice en la ronda de precios. | Decisión cerrada por Jose hace un día; el plan no la discute. |
| C8 | **`TermsStrip` (psicología) frente a `IntegrationFacts` (marketing)** en freelance | Dos nombres para lo mismo: hechos que responden a las objeciones legales y de compras del CTO. | Un solo componente `TermsStrip` con cinco hechos: trabajo en tu repo y tus herramientas · NDA si lo necesitas · factura con IVA · el código es tuyo · entregas por PR; el solape horario y las horas semanales se añaden cuando Jose los dé. | Regla 3: un componente por concepto. |
| C9 | **Testimonios** | Marketing: una cita real de NextRaket si el cliente acepta. Psicología y `division-pantallas.md`: solo con nombre, cargo, enlace y permiso escrito, y solo en la ficha de su proyecto. | Solo en la ficha del proyecto, nunca en home ni servicios, y solo con nombre, cargo, enlace y permiso escrito. Sin eso, ninguno. | Prueba antes que afirmación. |
| C10 | **Cuándo habla Nexo en salas privadas** | Psicología escribe como si 5.15 fuera «solo al mencionarlo». `decisiones.md` 5.15: Jose eligió **b**, responde si nadie contesta en N minutos (10) o al mencionarlo. | 5.15 b se mantiene. Se adopta la salvaguarda de psicología: la primera intervención automática dice «Respondo yo, Nexo, porque nadie ha contestado en 10 minutos»; en sala de cliente solo con consentimiento. | Decisión de Jose; la honestidad de quién habla se conserva. |
| C11 | **`ChatInvite` y «Chat con Nexo» antes de que el chat con IA exista** | Marketing: ocultar o sustituir por `FaqWithNexo` guionizado. Psicología: estados honestos («Nexo está desconectado»). | Hasta que O07 responda de verdad: `ChatInvite` no se renderiza en la home; en contacto y en el chooser, la entrada «Chat con Nexo» abre el `FaqWithNexo` guionizado de la página (ya existe) en vez de prometer un chat. | No se promete en la página de cierre algo que no funciona. |
| C12 | **Stack en la home** | `division-pantallas.md` y SEO: `StackRow` de cuatro grupos en texto. Marketing: no lo lista. | Se queda, pequeño (una fila de texto, sin logos, enlace a `/sobre-mi#stack`), después de `ProjectGrid`. | Confianza para el recruiter a coste S y sin JS. |
| C13 | **Categorías del blog** | SEO (ronda 2): `ia` pasa a `accesibilidad-ia`. Decisión 2.19: categorías por tema. | `precios` · `trabajar-con-freelance` · `react-native` · `accesibilidad-ia` · `desarrollo-web`. Sigue siendo «por tema»; cambia un nombre antes de que exista contenido. | La accesibilidad es la pericia que nadie más puede firmar. |

---

## 2. Componentes por pantalla pública

Formato de cada fila: orden · componente · para qué y para quién · fuente (**M** marketing · **S** SEO · **P** psicología · **A** arquitectura previa) · estado (**existe** · **modificar** · **nuevo**) · esfuerzo. Audiencias: **R** recruiter · **C** CTO/freelance · **Py** pyme/a medida.

### 2.1 Home `/es`

Hoy: solo `Hero` (+ `BlockScroll`). Trabajo: en diez segundos, quién, qué y por qué vía seguir; escaparate (2.19).

| # | Componente | Para qué · audiencia | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | `Hero` | Titular en dos tonos, lead **corto** («Apps móviles y webs para empresas. Por horas, por proyecto o en tu equipo.», pasa por `redactor`), primaria «Hablemos» (chooser, 2.18), secundaria «Ver servicios» hasta que haya ≥ 2 fichas reales y entonces «Ver proyectos». `DemoTag` discreto en el teléfono y el navegador del visual («Ejemplo», Geist Mono, `aria-label` completo); el texto del mockup `aria-hidden`. · R C Py | M P S | modificar | S |
| 2 | `EntityParagraph` | Párrafo de entidad idéntico a `seo.llms.summary`, con Madrid. · GEO | S | existe (comprobar literal) | S |
| 3 | `ProofStrip` | Una fila de 2–3 pruebas con enlace (§3.1): apps de 3Cat en las tiendas · NextRaket en producción · el código de esta web (cuando el repo sea público; hasta entonces «Cómo trabajo»). Sin logos. Evento `proof_click`. · R C Py | M P S | nuevo | S–M |
| 4 | `ServicesStrip` | Enrutador por situación: tres tarjetas que empiezan por la situación del visitante y terminan en un hecho verificable, con la cifra «desde» solo cuando sea real (`PriceState`). Contratación → `/sobre-mi` (C4); freelance → `/servicios/freelance`; a medida → `/servicios/a-medida`. Reutiliza `NeedTile` en variante compacta. H2 «Tres formas de trabajar conmigo». · R C Py | M P S A | nuevo | M |
| 5 | `RecommenderTeaser` | La primera pregunta del recomendador ya en pantalla («¿Qué quieres lanzar? Web · App · Las dos · No lo sé»); cada opción es un `<a>` a `/servicios/a-medida?…#recomendador` con el paso 1 respondido (`recommender-url.ts`). Sustituye al `PackTeaser` del plan antiguo. Evento `recommender_start{from:home}`. · Py | M | nuevo | S–M |
| 6 | `ProjectGrid` | Tres destacados con cifra con fuente y enlace verificable; uno es esta web. Solo se renderiza con ≥ 2 fichas reales. · R C Py | A S | nuevo (W17) | M |
| 7 | `StackRow` | Cuatro grupos en texto → `/sobre-mi#stack`. · R | S A | nuevo | S |
| 8 | `ChatInvite` | Tres arranques por audiencia. **Solo cuando el chat responda con IA** (C11); hasta entonces no se renderiza. · R C Py | M P A | nuevo (W19) | S |
| 9 | `Closing` + `QuickContact` | Cierre con email copiable; botón `ghost`. · todos | A | nuevo o extraer de `ServicePage` | S |

No lleva: `Steps`, FAQ, comparador, formulario, trayectoria, testimonios, logos, contadores, teaser del blog hasta tres artículos. Schema: `WebPage` + `ProfessionalService`.

### 2.2 Servicios (hub) `/es/servicios`

Hoy: `ServiceBento` con tres `NeedTile`, `ProofTile` con chips de stack, `Steps`, `FaqWithNexo`. Trabajo: elegir vía; casa de la vía de contratación. «Cómo trabajo» tiene página propia (2.20, en vuelo): el hub la enlaza, no la repite.

| # | Componente | Para qué · audiencia | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | `PageHead` + `EntityParagraph` | H1 con keyword; mismo párrafo de entidad. | S | existe | — |
| 2 | `NeedTile` contratación | Primaria «Descargar CV» (PDF, `download`, `cv_download{from:hub}`), secundaria «Ver trayectoria», terciaria «Preguntar disponibilidad a Nexo» (C5). | M A | modificar | S |
| 3 | `NeedTile` freelance y a medida | `ExpectationLine`: qué recibes tras contactar («propuesta con horas o precio por tarea» · «presupuesto cerrado por escrito»); cifra «desde» con `PriceState`. | P M | modificar | S |
| 4 | `ProofTile` | Deja los chips de stack genéricos y consume `ProofStrip` en variante `tile` («Apps de 3Cat en las tiendas» convence; un chip «React Native» no). | M S | modificar | S |
| 5 | `HowIWorkInTeams` | Tres líneas con enlace: PR por bloque, CI en cada cambio, revisión; enlace a «Cómo trabajo» y, cuando el repo sea público, al repo. Dentro de la zona de contratación. · R C | M S A | nuevo | S |
| 6 | `Steps` | Se queda como teaser de una línea por fase con enlace a `/como-trabajo`, o lo retira la rama en vuelo; este plan no lo toca. | A | existe | — |
| 7 | `FaqWithNexo` | Añadir objeciones reales: «¿Facturas como autónomo o puedo contratarte por consultora?», «¿Firmas NDA?», «¿Qué solape horario tienes?», «¿Qué pasa si no me gusta el resultado?». Voz: «Mi asistente», nunca «Nuestro». Plazo de respuesta idéntico en todo el sitio (constante `common.responseTime` en `messages`). | M P S | modificar | S |
| 8 | `RelatedGuides` | Dos guías relacionadas, cuando el blog esté encendido. | S | nuevo | S |
| 9 | `Closing` | → `/contacto` sin vía. | A | existe | — |

Schema: `ProfessionalService` con `hasOfferCatalog` (tres `Offer`, sin precio hasta que sea real) + `FAQPage` + `BreadcrumbList`.

### 2.3 Freelance `/es/servicios/freelance`

Hoy: `RateFigure`, cuatro `Card` de ejemplos, `Steps` (cómo empezamos), `FaqWithNexo`, cierre. Mensaje para el CTO: reducción de riesgo y velocidad.

| # | Componente | Para qué · audiencia | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | `PageHead` | H1 «Desarrollador React Native freelance, por horas o **por tarea.**» (recupera la keyword, G9); lead con resultado y stack («trabajo en tu repo, con tus PR y tu CI»). | S M | modificar | S |
| 2 | `RateFigure` | `PriceState` (C1): `review` hoy; con cifra, «mínimo por tarea» y «actualizado el {fecha}» en texto. Debajo, `AvailabilityNote` (§3.6) si Jose la mantiene. | M P S | modificar | S |
| 3 | `TaskExamples` | Cinco encargos con **tamaño y entregable**: pantalla nueva con API (1–2 días · PR con tests) · auditoría de rendimiento (1 día · informe priorizado) · **auditoría de accesibilidad de app React Native** (1–2 días · informe WCAG 2.2 + plan, §3.9) · rescate (desde 1 semana · app estable en producción) · integración de IA (3–5 días). Sustituye a las `Card` sueltas. · C | M S P | modificar | M |
| 4 | `TermsStrip` | Cinco hechos que responden a compras y legal (C8). · C | P M | nuevo | S |
| 5 | `PilotTask` | Reversión de riesgo verdadera: «Empezamos con una tarea pequeña y cerrada; si no encajo con tu equipo, no seguimos y solo pagas esa tarea». CTA `/contacto?via=freelance&task=pilot`. · C | M | nuevo | S |
| 6 | `Steps` «Cómo empezamos» | Tres pasos propios de la vía; enlace a `/como-trabajo`. | A | existe | — |
| 7 | `ByHourOrByTask` | Tabla semántica de cuatro filas (cuándo conviene, mínimo, seguimiento, factura): citable por LLM. | S | nuevo | S |
| 8 | `RelatedProjects` | 3Cat (React Native en equipo grande) y un caso NextRaket; `relatedService = freelance`. | M S A | nuevo | S |
| 9 | `FaqWithNexo` | Añadir «¿Firmas NDA?», «¿Qué solape horario?», «¿Qué pasa si crece el alcance?» (ya). | M P | modificar | S |
| 10 | `Closing` | «Pedir propuesta» → `/contacto?via=freelance`; el formulario añade «enlace a tu repo o ticket» opcional (§2.8). | A M | existe | — |

Schema: `Offer` con `UnitPriceSpecification` (`HUR`, `EUR`, `validFrom`) cuando el precio sea real; `FAQPage`; `BreadcrumbList`.

### 2.4 Desarrollo a medida `/es/servicios/a-medida`

Hoy: `OfferCompare` (pestañas Web 3 / App 2), `ExtraList`, `OfferRecommender` + `OfferResult` + `NexoGuideBubble`, `WarrantyPlans`, `FaqWithNexo`. Es el corazón comercial; la pyme compra certeza. Orden psicológico: precio → recomendador como camino → comparador con la garantía al lado del precio → transparencia de costes y propiedad → pago por fases → recomendador → cuánto tarda → prueba parecida → qué necesito de ti → FAQ → cierre.

| # | Componente | Para qué · audiencia | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | `PageHead` | H1 actual (keyword); lead añade «… y 30 días de garantía tras publicar»; frase citable con los plazos en semanas (y los «desde» con fecha cuando existan); enlace «¿No sabes cuál? Encuentra el tuyo en un minuto» (ya). | M S | modificar | S |
| 2 | `OfferCompare` | `PriceState` en cada tarjeta (C1); orden ascendente; `PriceDrivers` bajo el precio («Sube con: cuentas, cobros, idiomas»); `WarrantyChip` «30 días de corrección incluidos» junto al precio; ningún nivel «el más elegido» hasta tener datos de leads. Fase 2: el DOM pasa a `<table>` con `caption` (filas: para quién, incluye, plazo, qué aportas, desde) presentada como tarjetas por CSS (G8). | P M S | modificar | S (+ M la tabla) |
| 3 | `CostsDisclosure` | Cuatro líneas bajo el comparador: IVA aparte, Apple 99 $/año, Google 25 $ una vez, dominio, comisión de Stripe si hay cobros. | P M | nuevo | S |
| 4 | `OwnershipNote` | Una línea con icono de llave: «El código, el dominio y las cuentas de tienda son tuyos desde el día uno». | P M | nuevo | S |
| 5 | `PaymentSchedule` | Barra segmentada con el anillo coral: «40 % al empezar · 40 % al entregar el diseño · 20 % al publicar» (o lo que Jose fije, **pregunta 4**). | P M | nuevo | S |
| 6 | `WarrantyPlans` | Sube justo tras el comparador; «Sin permanencia: lo das de baja cuando quieras, con un mes de aviso» literal (o lo que Jose fije). | P M | modificar | S |
| 7 | `OfferRecommender` | Pre-revisión de una línea en el último paso antes de «Ver mi recomendación»; «He supuesto algo por ti» lista **qué** supuso; mantenimiento nunca premarcado (C2); copy de `nexoGuide.ask.more`; salida «Prefiero hablarlo primero» (ya). | P | modificar | S |
| 8 | `OfferResult` | `WarrantyChip`; **`SummaryByEmail`** («Envíame este resumen por email»: email + consentimiento + Turnstile → crea `lead` con `source = form`, `via = project`, `offer`, `extras`, `offer_answers`, mensaje autogenerado, y envía el resumen con el enlace `?q=` para volver; sin newsletter); **`ShareLink`** («Copiar enlace a mi propuesta», `share_link_copy`); sin tarjeta Prototipo (C7). | M P | modificar + nuevo | M |
| 9 | `HowLong` | Anillo coral por fases (2.14) con las semanas de cada nivel; enlace a `/como-trabajo`. | A S | nuevo | S |
| 10 | `ProofStrip` variante `case` | Un caso parecido: NextRaket (web/producto) o 3Cat (app). | M | reutiliza | S |
| 11 | `WhatINeedFromYou` | Tres viñetas por nivel (textos, logo, cuentas de tienda, decisiones en ≤ N días). | M A | nuevo | S |
| 12 | `ExtraList` | Primero los que aplican al nivel activo; el resto plegado en «Ver todos los extras»; cada extra con **para quién**, no con tecnología; nunca premarcados. | P | modificar | S |
| 13 | `FaqWithNexo` | Objeciones de pyme: «¿Y si te pones malo o desapareces?» (código y cuentas a tu nombre), «¿La app es mía?», «¿Puedo pagar por fases?», «¿Qué pasa si quiero cambiar algo a mitad?» (6.8). | M P | modificar | S |
| 14 | `Closing` | «Pedir esta propuesta» con la selección. | A | existe | — |

Schema: `OfferCatalog` con un `Offer` por nivel (`minPrice`, `eligibleDuration`) y por plan de mantenimiento cuando los precios sean reales; `FAQPage`; `BreadcrumbList`.

### 2.5 Cómo trabajo `/es/como-trabajo` (en vuelo)

No se toca. Añadidos posteriores en un bloque S cuando la rama esté en `main`: cada principio con enlace a su prueba (PR, CI, test, decisión escrita; repo cuando sea público), uso de esta web como caso, cierre con dos CTAs secundarios por audiencia («Descargar CV» · «Pedir propuesta freelance»), `faq_open`/`cta_click` instrumentados. Sin el método con agentes (2.11).

### 2.6 Sobre mí `/es/sobre-mi` (en vuelo)

Lista objetivo para comprobar la rama `public/about-legal`; lo que falte va a un bloque de ajuste S:

| # | Componente | Contenido |
|---|---|---|
| 1 | `PageHead` | Retrato real con `alt` y tamaño reservado; tres líneas: qué hace, desde cuándo, «Madrid · España y remoto» (+ modalidad «remoto o híbrido» si **pregunta 3** = a). `EntityParagraph`. |
| 2 | `CvDownload` | Primaria; PDF es (y en) con `download`, `noindex` + `Link rel=canonical` a esta página; si falta el PDF no se renderiza. |
| 3 | `Timeline` | Alten · 3Cat (abr 2024–hoy, React Native, 3CatInfo y 3Cat) · NextRaket freelance (2024–hoy) · DAW (2023) · entrenador de tenis (2017–2023) como rasgo humano. Desde `cv.json`. |
| 4 | `HowIWork` | Cuatro o cinco hechos comprobables con enlace: formó a equipos de RN, iOS, Android y QA; referente de accesibilidad WCAG; responsable de la integración de IA en 3CatInfo; PR por bloque y CI en esta web. Sin método con agentes. |
| 5 | `StackGroups` `#stack` | Por grupo (móvil, web, datos, IA) con «en producción en: 3Cat, NextRaket, esta web» en vez de niveles. |
| 6 | `CredentialList` | DAW 2023, ITIL 4 Foundation (válida hasta 2029, ID PeopleCert), Cambridge B2, Scrum Master, cursos de IA/n8n y DevOps: solo con fecha y entidad. |
| 7 | `LinkRow` | LinkedIn, GitHub con `rel="me"`, Malt si existe. |
| 8 | `Closing` | → `/contacto?via=hiring`. |

Schema: `ProfilePage` con `mainEntity` → `Person` completo (§3.8). H1 «Soy José Carlos Sánchez, desarrollador **full stack.**».

### 2.7 Proyectos `/es/proyectos` y ficha `/es/proyectos/[slug]`

Hoy: «Pronto» con `EmptyState`, dos MDX de ejemplo. Regla: el vacío honesto vale más que relleno, y una lista con dos casos reales vale más que el vacío.

**Lista**

| # | Componente | Para qué | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | `PageHead` | H1 «Proyectos: apps React Native y webs **en producción.**». | S | modificar | S |
| 2 | `FilterTabs` | Todos · Apps · Webs con `<a href>` reales; solo si hay ≥ 2 por filtro; canonical sin filtro. | A S M | nuevo (W24) | S |
| 3 | `ProjectCard` | Nombre, tipo, **estado honesto** (`live/wip`), **papel** («en el equipo de 3Cat vía Alten»), una cifra pública con fuente y fecha, enlaces verificables (tienda, web, repo), «Ver caso». | M P S A | nuevo (W17/W24) | M |
| 4 | `EmptyState` por filtro | Enlaza al filtro que sí tiene. | A | existe | — |
| 5 | `Closing` | | A | existe | — |

Fichas candidatas, en orden: **3CatInfo** (IA en producto, accesibilidad), **3Cat** (funcionalidades RN), **un caso NextRaket** (web de negocio o producto), **josecoded** (esta web, con `#como-esta-hecha` según Q3 de `division-pantallas.md`); después HazmeFila y Oportunix si Jose los quiere. Las de 3Cat dependen de la **pregunta 5**. `app-ejemplo` y `web-ejemplo` salen del build de producción. `/proyectos` deja de ser `noindex` con ≥ 2 fichas reales.

**Ficha**

| # | Componente | Para qué | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | `ProjectHead` | Nombre, tipo, estado, **enlace a la tienda o la web arriba**, papel exacto y período. | M S A | nuevo (W25) | S |
| 2 | `CaseSection` ×3 | El reto · Qué hice · Resultado con cifra y fuente. | A S | nuevo | S |
| 3 | `ScreenGallery` | Solo con capturas permitidas (nunca internas de 3Cat sin permiso). | A | nuevo | M |
| 4 | `Chip` de stack | → `/sobre-mi#stack`. | A | existe | — |
| 5 | `StoreLinks` | App Store y Google Play con `rel="noopener"`, evento `store_link_click`. | A M | nuevo | S |
| 6 | `NeedSomethingLikeThis` | «¿Necesitas algo así?» → servicio por `relatedService` y a contacto con `?via` y `?from=<slug>` (atribución sin cookies). | M S A | nuevo | S |
| 7 | `RelatedGuide` + `PrevNext` + `Closing` | | S A | nuevo | S |

Frontmatter a añadir en `projectSchema`: `kind`, `status`, `role`, `period`, `metric {label, value, source, date}`, `links {store_ios, store_android, web, repo}`, `relatedService`, `headline`, `description`, `sector`, `featured`. Schema: `MobileApplication` (`creator` → Person, `contributor` si es de equipo, **sin `aggregateRating`**) o `CreativeWork`; `BreadcrumbList`. OG por ficha (§3.7).

### 2.8 Contacto `/es/contacto`

Hoy: cuatro canales con el mismo peso (`ChannelCard` ×: chat «abre muy pronto», emails, formulario), `ContactForm` con el chip «Tu selección». Trabajo: destino de todo el enlazado con la vía puesta; corto; dice qué pasa después.

| # | Componente | Para qué | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | Disposición por `?via` | Con `?via`: formulario arriba con la vía preseleccionada y el chip de selección; canales debajo. Sin `?via`: `ViaSelector` primero. | M | modificar | M |
| 2 | `WhatHappensNext` | Tres pasos bajo el título del formulario: «Lo leo yo, no un bot» · «Te respondo en 1–2 días laborables» · «Propuesta por escrito o llamada de 20 min». Junto a Enviar: «Sin compromiso. No comparto tus datos». | M P A | nuevo | S |
| 3 | Campos por vía | Contratación: enlace a la oferta (ya). Freelance: para cuándo (ya) + **enlace a repo o ticket** opcional. A medida: dominio y cuentas de tienda (ya) + **presupuesto aproximado** opcional (< X · X–Y · > Y · No lo sé). Columnas `repo_url`, `budget_range` en `leads` (M14, OK de Jose). | M | modificar | S + migración |
| 4 | Chip «Tu selección» | Añade «30 días de garantía incluidos» y «Es una propuesta, no un contrato». | P | modificar | S |
| 5 | `ChatChannel` | Mientras no haya IA: abre `FaqWithNexo` guionizado o se oculta (C11). | M P | modificar | S |
| 6 | Estado de éxito | Sustituye al formulario: pasos y plazo, email de la vía y el siguiente paso según vía (recruiter → CV; pyme → caso parecido o guía; CTO → «Cómo trabajo»); «enviar otro». **Acuse por email** con copia de lo enviado y la selección (Resend). | M P | modificar | M |
| 7 | `QuickContact` | Email con copiar; WhatsApp y `CalEmbed` «Reserva 20 min» cuando haya datos (2.9). | A M | existe | — |
| 8 | Ejemplo plegable por vía | Andamio del mensaje («Cuéntame el contexto, el plazo y lo que necesitas» + un ejemplo). | P | nuevo | S |

Canonical sin parámetros; `ContactPage` + `BreadcrumbList`; eventos `contact_view/start/error/submit{via, has_selection}`.

### 2.9 Blog y guías `/es/blog`, `/es/blog/[slug]`, `/es/blog/tema/[categoria]`

Apagado por interruptor hasta tres artículos publicados. Categorías de C13.

| # | Componente | Para qué | Fuente | Estado | Esf. |
|---|---|---|---|---|---|
| 1 | Índice: `PageHead`, `CategoryTabs`, `PostTeaser`, paginación `?pagina=`, `Closing` | | A S | nuevo (W40) | S |
| 2 | Artículo: título en dos tonos, `AuthorBox` (foto, credencial pertinente, «Actualizado el»), `Toc`, `Prose` + `CodeBlock`, `RelatedService` en el primer tercio y al final, `Faq` propia, dos relacionados, `ShareRow` | Sin `ReadingProgress` (lo hace la cápsula), sin comentarios. | A S | nuevo (W41) | M |
| 3 | `GuideDownload` | PDF de la guía **sin muro** y botón «Envíamela con el resumen de mi caso» → recomendador (`guide_download`). | M P | nuevo | S |
| 4 | Esqueletos de los artículos 1, 4, 3 y 6 de `especialistas/seo.md` §3 | `draft: true`, cifras `{{DATO}}`, textos por `redactor` en el Mac. | S M | contenido | S |
| 5 | Imanes sin muro (§3.5) | Checklist «Antes de pedir presupuesto de app» (página imprimible) y «Plantilla de auditoría React Native» (CTO) como páginas del blog. | M | contenido | S |

Schema: `Blog` + `ItemList`; `BlogPosting` + `FAQPage` + `BreadcrumbList`; `og:type article`. `blogSchema`: `updated`, `category`, `cover`, `faq`, `relatedService`, `relatedPosts`, `pdf?`.

### 2.10 Legales `/es/legal/*` (en vuelo)

Lista objetivo: aviso, privacidad y cookies con resumen de cinco líneas, `Toc`, `Prose`, fecha; cookies `noindex`; sin banner (solo técnicas). Privacidad cubre: cookie técnica del visitante del chat (5.10), cuota por IP con hash, formulario y `leads`, CRM y closers como encargados (contrato art. 28), Groq, Resend, Cloudflare, Supabase, Turnstile y, si **pregunta 2** = a, la analítica propia sin cookies y Cloudflare Web Analytics. Nombre legal, NIF, domicilio y email como `{{DATO}}`.

### 2.11 404 y errores

Hoy: `ErrorPage` por variante. Añadidos S: sugerencia por parecido de ruta (si la URL contiene «proyecto», enlaza a `/proyectos`), evento `not_found{path_group}`, «Abrir el chat» solo cuando el chat responda (C11), mantenimiento con hora desde `site_settings` y 503 + `Retry-After`.

---

## 3. Transversales

### 3.1 `ProofStrip` y reglas de prueba verdadera

- **Qué es:** una fila de dos o tres pruebas con enlace verificable, texto sin logos, variantes `line` (home, a medida), `tile` (hub) y `case` (un caso parecido). Cada elemento es un `<a rel="noopener">` con evento `proof_click{target}`.
- **Redacción de 3Cat (plantilla, según la pregunta 5):** «Apps de 3Cat (3CatInfo y 3Cat) en App Store y Google Play, como desarrollador React Native en el equipo de Alten (desde abril de 2024)». Siempre el papel exacto; nunca atribuirse la app entera; nunca logos de 3Cat ni de Alten sin permiso escrito; cifras solo públicas con fuente y fecha («valoración 4,x en Google Play, consultada el {fecha}»); **ninguna métrica interna, capturas internas ni detalles de producto no publicados** (NDA). Si Jose no puede nombrar las apps: «Apps de una radiotelevisión pública en las dos tiendas, como parte del equipo de Alten», con enlace a la ficha genérica.
- **NextRaket:** «NextRaket: webs y productos para empresas, en producción desde 2024», con enlace público; el cliente se nombra solo si acepta (dato de Jose).
- **Esta web:** «El código de esta web, con CI, tests y accesibilidad AA» → repo cuando sea público (1.10); hasta entonces → `/como-trabajo`. Sin métricas vivas (2.17): una cifra con fecha y enlace al run de CI cuando el repo se abra.
- **Prohibido en cualquier sitio:** testimonios sin nombre y enlace, logos, contadores, «+N proyectos», cifras de demo sin `DemoTag`.

### 3.2 `DemoTag` en el hero

El visual del hero enseña «Valoración 4,8», «+18 %», «1.284 pedidos»: es una demo. Se añade un `Chip` variante `demo` («Ejemplo») en la esquina del teléfono y del navegador simulado, visible y con `aria-label` «App de ejemplo, datos ficticios»; los textos del mockup pasan a `aria-hidden` para que no pesen en el HTML principal (G3). Coste S, en el mismo bloque que `ProofStrip`.

### 3.3 Nexo: voz y cuándo habla

- **Persona:** asistente de Jose; primera persona sobre sí mismo, tercera sobre Jose; ≤ 2 frases; sin exclamaciones en serie, sin emojis, sin vender; siempre se declara asistente. Cita la fuente de cada cifra («Servicios › A medida»). Corregir «Nuestro asistente te responde al momento» → «Mi asistente, Nexo, responde al momento cuando está despierto»; con Omen dormido, «Nexo está desconectado; Jose te responde por correo».
- **Habla:** al entrar en cada paso del recomendador para explicar por qué se pregunta; cuando el visitante elige «no lo sé»; al resultado (una frase); ante error o 429 (ofrece alternativa); cuando detecta intención de compra en el chat (ofrece `HandoffCard` una vez). En salas privadas, según 5.15 b: si nadie contesta en 10 minutos o al mencionarlo, anunciando por qué habla (C10); en sala de cliente, solo con consentimiento.
- **Calla:** mientras el visitante elige o escribe; tras dos pasos seguidos sin dudas se reduce a la ayuda plegable; nunca reabre el panel solo, nunca por temporizador ni por intención de salida, nunca insiste tras un «no».
- **Honestidad técnica:** sin «escribiendo…» simulado; `thinking` solo con un trabajo real (5.9); si no sabe, `nexoChat.fallback`.
- **Hasta que exista el chat con IA** (O04–O07, repo `josecoded-omen` pendiente de Jose, 10.8): Nexo solo aparece como guía guionizado (`NexoGuide`, `FaqWithNexo`); nada promete un chat (C11).

### 3.4 Analítica respetuosa (decisión de Jose: dependencia y migración)

- **Qué:** Cloudflare Web Analytics (sin cookies, ya en Cloudflare: páginas vistas, referrer, Web Vitals; es un script externo: entra en la CSP con nonce y lo revisa `revisor` como dependencia) + **eventos propios** por ruta de servidor `/api/e` (zod, límite de peticiones, `Sec-GPC`/DNT respetados) a `private.events` (`name`, `props jsonb` con lista cerrada de claves, `path`, `via`, `ts`; **sin IP, sin user agent completo, sin identificador persistente**; agregado diario y purga a 90 días por `pg_cron`). Sin banner de cookies. Cliente `track()` de < 1 KB, `sendBeacon`.
- **Eventos:** `cta_click{location, way}` · `cv_download{lang, from}` · `proof_click{target}` · `store_link_click{project, store}` · `offer_tab{platform}` · `recommender_start{from}` · `recommender_step{n}` · `recommender_abandon{n}` · `recommender_result{offer, extras_n, assumed}` · `recommender_to_contact` · `summary_email` · `share_link_copy` · `nexo_open{page, starter}` · `nexo_handoff` · `faq_open{page, id}` · `contact_view{via}` · `contact_start{via}` · `contact_error{field}` · `contact_submit{via, has_selection}` · `email_copy{via}` · `mailto_click{via}` · `whatsapp_click` · `guide_download{guide}` · `not_found{path_group}`.
- **Embudos (KPI por audiencia):** recruiter `cv_download` / visitas de sobre mí y hub · CTO `contact_submit{via:freelance}` · pyme `recommender_result → summary_email → contact_submit{via:project}`; tasa `contact_start → contact_submit` detecta fricción del formulario y de Turnstile. Cuadro mínimo en `/admin` (D11 Ventas, v2).
- **Pruebas A/B:** secuenciales de cuatro semanas por variante, cambios grandes, umbral fijado antes (tráfico de web personal: un A/B clásico no alcanza significación). Candidatas en `especialistas/marketing.md` §10.
- **Gate:** migración `private.events` y script de Cloudflare WA con OK de Jose (**pregunta 2**).

### 3.5 Imanes de leads (sin muro)

1. Guía «Cuánto cuesta hacer una app móvil en España en 2026»: HTML indexable con rangos de mercado y la tabla de variables de `ofertas.md` §2.4; PDF sin email; «Envíamela con el resumen de mi caso» → recomendador. 2. Checklist «Antes de pedir presupuesto de app» (página imprimible). 3. Resumen del recomendador por email (`SummaryByEmail`, el más valioso: es personal). 4. «Plantilla de auditoría React Native» para CTO → tarea «Auditoría». Regla: el valor se entrega antes de pedir nada (reciprocidad); el email solo para enviar algo que el visitante ya ve.

### 3.6 Urgencia y escasez éticas

- `AvailabilityNote` (freelance; «Próximo hueco para proyecto completo: {mes}» en a medida; Nexo la lee): solo con dato real en `site_settings` (`availability.next_project_month`, `availability.weekly_hours`, `availability.from`, `updated_at`); **si no se actualiza en 30 días se oculta sola**; «actualizado el {fecha}» visible. **Pregunta 3** (toca 2.8: se propone publicar modalidad y próximo hueco, y dejar a Nexo el detalle).
- Validez del precio («válido 30 días») en la propuesta (`quotes.valid_until`) y en la página cuando haya precios reales.
- Prohibido (lista de bloqueo para `revisor` y `/puerta-calidad`): contadores, «quedan N plazas», «oferta hasta», precios tachados, niveles señuelo, «el más popular» sin datos, Nexo proactivo, premarcados de pago, email antes del resultado, costes de terceros descubiertos tarde, «sin permanencia» ambiguo, rankings entre closers, progreso inflado en el área, voz «nosotros».

### 3.7 Open Graph

`opengraph-image.tsx` por ruta (estilo B: carbón, acero, palabra en coral, H1 y tipo de página; `profile` en sobre mí, `article` en el blog), `twitter:card summary_large_image`, `og:locale`. Verificar `next/og` bajo OpenNext en la preview; si falla, PNG generados en build a `public/og/`. Fichas y artículos con su propia imagen desde el frontmatter.

### 3.8 `Person` JSON-LD completo

`@id …/#person`: `name` «José Carlos Sánchez García», `alternateName` «josecoded», `jobTitle`, `description` (= párrafo de entidad), `url` → `/es/sobre-mi` (hoy `/es`), `image` (retrato, `{{DATO}}`), `sameAs` [LinkedIn, GitHub, Malt, repo cuando sea público], `knowsAbout` [React Native, Expo, TypeScript, Next.js, Supabase, accesibilidad WCAG, IA aplicada], `knowsLanguage` [es, ca si procede, en], `address.addressLocality` Madrid, `addressCountry` ES, `hasCredential` (DAW, ITIL 4 con ID, B2 como `EducationalOccupationalCredential`), `alumniOf` (IES El Lago), `worksFor` Alten solo si Jose lo acepta (pregunta 5), `hasOccupation`. `@id` y canonical fijados a `site.origin` con test (G11).

### 3.9 Nueva oferta: «Auditoría de accesibilidad de apps React Native» (evaluación)

- **Encaje:** alto. Es su papel real en Alten (referente WCAG de las apps de 3Cat; formó a los equipos), la European Accessibility Act se aplica desde junio de 2025 y en España la Ley 11/2023 obliga a productos y servicios digitales; la query «auditoría accesibilidad app» tiene poca competencia de perfiles individuales (volumen estimado B, pendiente de validar en Semrush).
- **Forma recomendada:** no una página nueva. Entra como quinto `TaskExample` de la vía freelance («1–2 días · informe WCAG 2.2 priorizado + plan de corrección; opcional: formación al equipo»), como artículo 4 del plan editorial («Accesibilidad en apps: qué exige la European Accessibility Act y cómo cumplirla con React Native») y como imán «Plantilla de auditoría». Página propia solo si en tres meses hay demanda medible (`contact_submit{via:freelance}` con `task=a11y`).
- **Cautela:** la prueba es el papel y la formación, no resultados internos de 3Cat; la propia web (axe en CI, WCAG 2.2 AA) es la prueba verificable. **Pregunta 6.**

### 3.10 Sitemap, hreflang, `llms.txt` y E2E de SEO

Sitemap con `lastModified` (frontmatter `updated ?? date`; servicios con la fecha de `price_changes`), sobre mí, cómo trabajo, legales, fichas y artículos; índice de sitemaps cuando haya `en`. `hreflang` solo al publicar `/en`: `pathnames.ts` como mapa único, `alternates.languages` `es`, `en`, `x-default` (→ es) solo para pares existentes, también en `sitemap.ts`, `og:locale:alternate`, `llms.txt` en inglés. `llms.txt` ampliado (Proyectos, Experiencia con 3Cat vía Alten y fechas, Precios con fecha cuando existan, Guías) + `llms-full.txt`. E2E de SEO por ruta: un `h1`, title ≤ 60, descripción 50–160, canonical absoluto = `@id`, grafo que parsea, `noindex` donde toca, estado HTTP. Acciones de Jose el día del lanzamiento: Cloudflare sin bloqueo de bots de IA ni robots gestionado, `www` → apex, Crawler Hints/IndexNow, Search Console y Bing Webmaster.

### 3.11 Voz y promesas coherentes

Primera persona singular en toda la web pública; Nexo habla de Jose en tercera. Un solo plazo de respuesta («1–2 días laborables») en FAQ, contacto, `WhatHappensNext`, `ExpectationLine` y Nexo: una clave `common.responseTime` en `messages/es.json`. Botones con resultado («Ver mi recomendación», «Descargar CV»), nunca «Enviar» a secas. Parámetros unificados `?via=hiring|freelance|project` (2.28: `pack` → `project` junto con la migración de `data/lead-claim` o la siguiente con OK).

---

## 4. CRM completo y profesional

### 4.1 Lo que hay y se conserva

`leads` (entrada) → `contacts` (cartera, 7.9); reclamo atómico `claim_lead` con emparejado por email que protege carteras (7.8 a, M04 en vuelo); visibilidad jerárquica por RLS (`owns_contact`, `owns_lead`), `aal2` para personal; pipeline fijo `new → contacted → meeting → proposal → won | lost` con `won` solo por RPC; comisión con dos tasas congeladas por fila (7.4–7.7); `activities` inmutables con `last_activity_at`; auditoría en `private.audit_log`; salas de chat por relación con Nexo (5.12–5.17). Admin: shell, `/admin/interesados` (D8). Pendiente de la zona «auth y admin base»: `invitations` + `accept_invitation` (U4), D2 Usuarios, D5 Notificaciones/Telegram, M10 `outbox`: son **prerrequisitos** del CRM con closers reales.

### 4.2 Decisiones de fondo (las que piden OK están en §5)

1. **La comisión nace al ganar y se devenga por cobro.** `commissions` sigue como cabecera (tasas congeladas, estado), pero cada `payment` registrado genera `commission_lines` para el closer y, si lo hay, para el padre; una devolución genera líneas negativas. Así «sobre el importe cobrado» (7.6) es literal con hitos 40/40/20, mantenimiento mensual y devoluciones. Base: **neto sin IVA**. Recurrentes: N meses (propuesta 12). Ampliaciones (6.8): comisionan al closer del proyecto si se aceptan en los 12 meses siguientes. Vía `hiring`: sin comisión salvo acuerdo caso a caso. **Pregunta 7.**
2. **Facturación legal fuera del CRM.** España exige software de facturación conforme a VeriFactu (obligación aplazada a 2027; fechas a confirmar con el gestor). Jose emite en su programa; el CRM **registra** número externo, fecha, importes neto/IVA/bruto y PDF, y encadena cobros y comisiones a esa factura. El CRM no numera facturas fiscales. Los closers facturan a Jose su liquidación (retención IRPF si son profesionales: campo `withholding_rate`, confirmar con el gestor). **Pregunta 8.**
3. **Propuestas con versiones y aceptación con firma simple** (eIDAS): página pública `/propuesta/[token]` (`noindex`, token opaco con hash en base), «Aceptar» con nombre, cargo, casilla de condiciones y **OTP al email del contacto**; evidencias (hash del PDF, `ip_hash`, user agent resumido, OTP verificado, `terms_version`). Firma avanzada con proveedor solo si un cliente la exige. **Pregunta 9.**
4. **Las reglas viven en código**, no en tablas: probabilidad por fase (`src/lib/crm/stages.ts`: 10/20/40/60/100/0), tareas automáticas, puntuación de leads, plazos de conservación, protección de cartera. Cambiarlas es un PR con test.
5. **RGPD de la cartera desde el MVP:** base jurídica por contacto, registro de consentimientos, contrato de encargado (art. 28) aceptado por cada closer antes de reclamar, conservación con anonimización automática, derechos por `/admin/privacidad`.
6. **Exportación controlada:** CSV de lo que la RLS deja ver, solo cartera propia (no subclosers), desactivable por persona, registrada en `exports` con aviso a Jose. **Pregunta 10.**
7. **Atribución sin cookie:** UTM y `?ref=<referral_code>` viajan en la URL y en el estado del formulario y del recomendador hasta el envío; un lead con `ref` entra asignado a ese closer (salta la bandeja). El closer ve fase y avance del proyecto de sus clientes ganados (no tareas ni documentos) para vender ampliaciones. **Pregunta 11.**
8. **Sin gamificación ni rankings entre closers** (psicología §4.2; `valor-pantallas.md` §8): progreso personal («este mes: 3 ganadas · 1.200 € pendientes»), comisión exacta antes de confirmar «ganada», importes congelados. El `CloserLeaderboard` existe solo para el admin.
9. **Móvil de verdad:** K2 como lista de tarjetas con llamada/WhatsApp de un toque, K11 Hoy como entrada en móvil, `QuickLogSheet` al volver de `tel:`/`wa.me` (`visibilitychange`), PWA instalable sin modo sin conexión; skill `mobile-native` en cada pantalla CRM.

### 4.3 Alcance por fase

**MVP** = antes de invitar al primer closer real (disparador de `josecoded-dev`, 10.7). **v2** = con 2+ closers activos o los primeros cobros. **Después** = cuando el volumen lo pida.

| Función | MVP | v2 | Después |
|---|---|---|---|
| Interesados | K8 `/crm/interesados` (reclamar, míos, añadir a mano), D8 acciones (en vuelo) | `ScoreBadge` con «por qué», orden por puntuación | Omen ajusta la puntuación con histórico (sugerencia) |
| Contactos y ficha | K2 tabla densa con filtros en URL y acciones rápidas; K3 `ContactHead`, `DealCard` (+ probabilidad, fecha prevista, siguiente paso, `LostDialog` con motivo tipado), `ActivityTimeline` unificada (actividades, fases, tareas, propuestas, cobros, resumen de sala), `ActivityComposer` con plantillas, `SourceCard` (fuente, UTM, página de entrada, respuestas del recomendador, closer que refirió), pestañas Propuestas · Cobros · Proyecto (fase y avance) | `DuplicateHint`, `OwnershipBadge`, `ExportButton` | — |
| Pipeline | K10 `/crm/pipeline` (`PipelineBoard` por fase con importe y ponderado; lista agrupada en móvil; mover con menú por teclado), `deal_stage_events` | `ForecastCell`, `AgingCell` en K1 | — |
| Tareas y recordatorios | K11 `/crm/hoy` (vencidas, hoy, próximas; completar con resultado), `TaskComposer` en K3 y tras cada actividad, reglas automáticas (reclamo → primer contacto 2 h laborables; `proposal` → seguimiento 3 días; 14 días sin actividad → reactivar), resumen diario 08:30 por Telegram/email desde `outbox` | Cadencias (`cadences`, `cadence_steps`, `cadence_runs`; se paran al responder el contacto o cambiar de fase), `CadenceEditor` admin | — |
| Email y WhatsApp | Botones `mailto:`/`wa.me` en `ContactHead` que al volver preguntan «¿Lo enviaste? Registrar» (actividad `out`) | Dirección de registro por closer `log+<token>@` (Cloudflare Email Routing → Email Worker → `activities`; dependencia de parser MIME la decide `revisor`) | WhatsApp Business Cloud API con plantillas y opt-in (nunca cuentas personales) |
| Propuestas | `QuoteBuilder` `/crm/propuestas/[id]` (nivel de `offers`, extras con unidades, líneas libres, descuento dentro de `max_discount_pct`, calendario de pagos por fases, validez, condiciones; precarga desde `leads.offer/extras/offer_answers`), `QuotePreview`, `QuoteVersionList`, PDF en Storage privado `quotes`, P9 `/propuesta/[token]` (ver, PDF, aceptar con OTP, pedir cambios), `accept_quote` (→ `won`, `payment_schedule`, invitación `client` + `projects` + sala, actividad, Telegram) | Aprobación de descuento por Jose desde Telegram (botón inline); `change_order` y `renewal` | Firma avanzada bajo demanda |
| Cobros y facturas | K3 pestaña Cobros (`PaymentSchedule` con hitos y vencidos); D9 `/admin/cobros` (`ReceivableTable`, `RecordPaymentSheet`: importe, fecha, método, factura asociada, PDF) | A6 `/area/facturas` para el cliente (lista, descarga firmada, próximo hito) | Stripe para cobrar hitos |
| Comisiones y liquidaciones | K4 rehecha: `CommissionTotals` (devengado, aprobado, pagado, revertido), `CommissionLineTable` por cobro, `PayoutList`; D10 `/admin/liquidaciones` (`PayoutBuilder` por mes y beneficiario → extracto, marcar pagada con referencia, subir factura del closer, `StatementPdf`) | Previsión de comisión en K1 | — |
| Objetivos y cuadros | — | `targets`, K1 `TargetProgress`; D11 `/admin/ventas` (`FunnelChart` lead → reclamado → reunión → propuesta → ganado por fuente/vía/closer, `WinRateTable`, `CycleTimeChart`, `ForecastTable`, `CommissionLiability`, embudos de analítica de §3.4); el closer padre ve agregados sin nombres | — |
| Duplicados y propiedad | — | `phone_e164`, D12 `/admin/crm/duplicados` (`MergeSheet`, `merge_contacts`), `contact_merges`; protección de cartera (90 días sin actividad → aviso; 120 → bandeja común; excepto clientes ganados) | — |
| Importar y exportar | K5 importar (7.5, plantilla con base jurídica y origen) | `ExportButton` + `exports` + `profiles.can_export` | — |
| Permisos y auditoría | Matriz de §4.5 con un test pgTAP por fila; `private.audit()` extendido a `quotes`, `payments`, `commission_lines`, `payouts`, `crm_tasks`, `leads` | D13 `/admin/auditoria` | — |
| Notificaciones | Eventos nuevos sobre M10: `quote_viewed`, `quote_accepted`, `quote_changes_requested`, `payment_due`, `payment_overdue`, `payment_recorded` (al closer: «has devengado X»), `task_due` (resumen diario), `lead_aging`, `payout_paid`; D5/K6 con `SwitchList` | Botones inline en Telegram («Aprobar descuento», «Abrir»); `ownership_expiring`, `export_done` | Bot de Telegram con comandos (`/hoy`, `/cobros`) |
| Portal del cliente | P9 aceptar propuesta; tras aceptar, invitación al área sola; propuesta aceptada y contrato como documentos `client` | A4 historia «fuera de presupuesto» → `quote.kind = change_order` aceptado dentro del área (`QuoteAcceptCard`, sin OTP: sesión + confirmación) → hito de cobro; A6 facturas; `WarrantyCountdown`; acumulado «Fuera de alcance aceptado: X €» en `ProjectHeader` | Pago con Stripe |
| RGPD | `legal_basis` + `informed_at` obligatorios al crear/importar; `consents` (escriben `leads.consent_at` y `set_ai_consent`); `agreements` + `agreement_acceptances` (acuerdo comercial y DPA) con guard en `claim_lead` (`onboarding_required`) | Job mensual de conservación (prospectos sin deal ni actividad en 24 meses → anonimizar; clientes con facturas → datos fiscales 6 años); D14 `/admin/privacidad` (`DsarResult`, exportar JSON/ZIP, borrar/anonimizar, tarea automática a 1 mes) | — |
| Onboarding del closer | K9 `/crm/empezar` (`OnboardingChecklist`: aceptar acuerdo y DPA, vincular Telegram, leer reglas de comisión y descuento, `SalesKit` con enlace `?ref=`, textos públicos y «Qué no prometemos», primer contacto de prueba) | K12 `/crm/aprende` (argumentario por nivel y extra, objeciones, guiones, cómo usar el recomendador con el cliente); contenido MDX en `content/crm/*.mdx` validado por zod, textos por `comercial`/`redactor` en el Mac | — |
| Móvil | Criterios de §4.2.9 en cada pantalla MVP; PWA instalable | `QuickLogSheet`, acciones rápidas | — |

### 4.4 Modelo de datos: deltas

Nombres en inglés `snake_case`; enums en SQL; RLS como la tabla padre salvo que se diga; todo nuevo en `public` nace con `revoke all from anon, authenticated`; funciones `security definer` con `search_path = ''`. `tasks` ya es de proyectos (§5 de `datos.md`): las del CRM se llaman `crm_tasks`.

| Tabla | Delta |
|---|---|
| `leads` (+) | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `referrer_host`, `landing_path`, `first_seen_at`, `referred_by` → profiles, `budget_range` enum `lt_x | x_y | gt_y | unknown` (los umbrales en código), `repo_url`, `task` text (p. ej. `pilot`, `a11y`), `score smallint`, `score_reasons text[]`, `scored_at`. (`offer`, `extras`, `offer_answers`: en vuelo en `data/lead-claim`.) |
| `profiles` (+) | `referral_code` único, `max_discount_pct`, `can_export bool`, `log_token_hash` (en `private`). |
| `contacts` (+) | `phone_e164`, `owner_since`, `first_lead_id`, `utm_campaign`, `referred_by`, `legal_basis` enum `consent | contract | legitimate_interest | pre_contract`, `basis_note`, `informed_at`. Índice `lower(organization)`. |
| `deals` (+) | `expected_close_at date`, `probability smallint` (null = la de la fase), `next_step`, `lost_reason_code` enum `price | timing | no_response | competitor | scope | not_fit | other`, `stage_changed_at`. `via` `pack` → `project` (2.28). |
| `deal_stage_events` (nueva) | `deal_id`, `from_stage`, `to_stage`, `actor_id`, `at`; la escribe el trigger que ya audita. |
| `crm_tasks` (nueva) | `id`, `contact_id`, `deal_id`, `owner_id`, `kind` enum `call | email | whatsapp | meeting | todo`, `title`, `due_at`, `remind_at`, `done_at`, `outcome`, `cadence_run_id`, `created_by`, `created_at`. `contacts.next_action/_at` pasan a derivadas (vista) y dejan de editarse. |
| `activities` (+) | `direction` enum `in | out | internal`, `duration_min`, `outcome` enum `reached | no_answer | voicemail | meeting_set | not_interested`, `channel_ref`, `quote_id`, `payment_id`; `activity_kind` + `quote | payment | task`. Vista `contact_timeline` (v2). |
| `quotes` (nueva) | `id`, `deal_id`, `number` `P-2026-0001`, `version`, `kind` enum `initial | change_order | renewal`, `story_id`, `status` enum `draft | sent | viewed | accepted | rejected | expired | superseded | pending_approval`, `offer_slug`, `subtotal`, `discount_amount`, `total_once`, `total_monthly`, `valid_until`, `terms_version`, `snapshot jsonb` (contrato `contracts/quote-snapshot.json`), `pdf_path`, `public_token_hash`, `sent_at`, `first_viewed_at`, `accepted_at`, `accepted_name`, `accepted_role`, `accepted_email`, `acceptance_evidence jsonb`, `rejected_reason`, `created_by`. `unique(deal_id, version)`; una sola `accepted` por deal (índice parcial); trigger que prohíbe editar tras aceptar. El cliente nunca lee por RLS: todo por servidor con el token. |
| `quote_lines` (nueva) | `quote_id`, `kind` enum `offer | extra | custom | discount`, `ref_slug`, `label`, `qty`, `unit_price`, `billing` enum `once | monthly | per_unit`, `sort`. |
| `quote_milestones` (nueva) | `quote_id`, `phase` (las cinco de 2.14), `percent`, `amount`, `due_rule` enum `on_accept | on_phase_start | on_delivery | date`, `due_date`. |
| `commissions` (crear según `datos.md` §3, pasa a cabecera) | Columnas `*_amount` como «previsto»; estado agregado de las líneas. `win_deal` se reescribe: lo llama `accept_quote` (o el admin a mano sin propuesta). |
| `commission_lines` (nueva) | `commission_id`, `payment_id`, `beneficiary_id`, `role` enum `closer | parent`, `rate`, `base`, `amount` (negativo en devolución), `status` enum `accrued | approved | paid | reversed`, `payout_id`, `approved_at`. Trigger `after insert on payments`. |
| `payment_schedule` (nueva) | `deal_id`, `quote_milestone_id`, `label`, `amount`, `due_at`, `status` enum `scheduled | invoiced | paid | cancelled`. |
| `invoices` (nueva) | `deal_id`, `external_number`, `issued_at`, `amount_net`, `vat_amount`, `amount_gross`, `pdf_path`, `status` enum `issued | paid | partially_paid | void`. |
| `payments` (nueva) | `invoice_id`, `deal_id`, `amount_net`, `received_at`, `method` enum `transfer | card | stripe | other`, `reference`, `kind` enum `payment | refund`, `recorded_by`. Admin escribe; closer lee importe neto y fecha de sus deals. |
| `payouts` (nueva) | `beneficiary_id`, `period` (mes), `total`, `status` enum `draft | issued | paid`, `statement_path`, `closer_invoice_path`, `withholding_rate`, `paid_at`, `paid_reference`, `created_by`; estados por RPC `set_payout_status`. |
| `consents` (nueva) | `subject_email`, `contact_id`, `lead_id`, `purpose` enum `contact | marketing | ai_chat`, `granted_at`, `withdrawn_at`, `source`, `text_version`, `evidence jsonb`. |
| `agreements`, `agreement_acceptances`, `onboarding_progress` (nuevas) | `agreements` (`slug`, `version`, `body_path`, `published_at`); aceptaciones (`user_id`, `agreement_id`, `accepted_at`, `ip_hash`); progreso (`user_id`, `item_slug`, `done_at`). |
| `targets` (v2) | `user_id` (null = equipo), `period`, `metric` enum `won_amount | deals_won | meetings | quotes_sent`, `value`. |
| `contact_merges`, `exports` (v2) | Fusión (`kept_id`, `merged_id`, `actor_id`, `snapshot`, `at`) y registro de exportaciones (`actor_id`, `scope`, `filters`, `rows`, `at`). |
| `cadences`, `cadence_steps`, `cadence_runs` (v2) | Como en `especialistas/crm.md` §3.2. |
| `site_settings` (nueva, mínima, W20 adelantado) | `key`, `value jsonb`, `public bool`, `updated_at`, `updated_by`; vista `public_settings` (única con grant a `anon`); claves `availability.*`, `maintenance`, interruptores. |
| `private.events` (nueva, analítica) | `name`, `props jsonb`, `path`, `via`, `ts`; agregado diario `private.events_daily`; purga 90 días. |
| `notification_prefs.event` (+) | Los eventos de §4.3. |
| Contratos | `contracts/quote-snapshot.json`, `contracts/offer-answers.json` (en vuelo), `contracts/events-props.json`. |

### 4.5 Permisos por rol (un test pgTAP por fila)

| Recurso | admin | closer | closer padre | client | freelance |
|---|---|---|---|---|---|
| Interesados | todo | sin asignar + suyos | + subclosers | — | — |
| Contactos, deals, tareas, actividades | todo | suyos | + subclosers (lectura y escritura, 7.3) | — | — |
| Propuestas | todo | suyas (crear; enviar dentro del descuento) | lectura de subclosers | la suya por token / en el área | — |
| Cobros, facturas | todo | lectura de sus deals | lectura de subclosers | las suyas en el área | — |
| Comisiones, liquidaciones | todo | las suyas | + subclosers y sus tasas (7.10) | — | — |
| Proyecto (fase, avance) | todo | lectura en sus clientes ganados (pregunta 11) | — | el suyo | asignados (6.7) |
| Exportar | todo | su cartera si `can_export` | — | sus datos | — |

### 4.6 Migraciones (continúan tras M04; M05–M11 son las del chat y no cambian)

| # | Fichero (sufijo) | Rama | Crea | Depende | Tamaño | Fase |
|---|---|---|---|---|---|---|
| M12 | `site_settings_min` | `data/site-settings` | `site_settings`, `public_settings`, claves `availability.*`, `maintenance` | M01 | S | pública (pregunta 3) |
| M13 | `events` | `data/events` | `private.events`, `events_daily`, purga `pg_cron` | M01 | S | pública (pregunta 2) |
| M14 | `leads_attribution` | `data/leads-attribution` | UTM, `referrer_host`, `landing_path`, `referred_by`, `budget_range`, `repo_url`, `task`; `profiles.referral_code`; `deals.via` `pack` → `project` si no lo hizo M04 | M04 | S | MVP |
| M15 | `deal_pipeline` | `data/deal-pipeline` | Campos de `deals`, `deal_stage_events`, `lost_reason_code` | M03 | S | MVP |
| M16 | `crm_tasks` | `data/crm-tasks` | `crm_tasks`, `next_action` derivado, triggers de tareas automáticas; recordatorios vía `outbox` | M04, M10 | M | MVP |
| M17 | `activities_ext` | `data/activities-ext` | `direction`, `duration_min`, `outcome`, `channel_ref`, nuevos `activity_kind` | M03 | S | MVP |
| M18 | `quotes` | `data/quotes` | `quotes`, `quote_lines`, `quote_milestones`, bucket `quotes`, `accept_quote` (crea `payment_schedule` de M20 → si M20 no está, solo `won`) | M15, `offers` en código | M | MVP |
| M19 | `commissions_core` | `data/commissions` | `commissions` (cabecera), `commission_lines`, `win_deal` reescrito, `my_commission_rates()` | M18 | M | MVP |
| M20 | `payments_payouts` | `data/payments` | `payment_schedule`, `invoices`, `payments`, `payouts`, trigger de devengo, `set_payout_status` | M19 | M | MVP |
| M21 | `gdpr_base` | `data/gdpr-base` | `legal_basis` + `informed_at`, `consents`, `agreements`, `agreement_acceptances`, `onboarding_progress`, guard en `claim_lead` | M04 | S | MVP |
| M22 | `targets_scoring` | `data/targets-scoring` | `targets`, `leads.score*`, RPC `crm_funnel`, `crm_forecast` | M15 | S | v2 |
| M23 | `merge_ownership_exports` | `data/contacts-merge` | `phone_e164`, `contact_merges`, `merge_contacts`, `owner_since`, job de protección, `exports`, `can_export` | M03 | M | v2 |
| M24 | `cadences` | `data/cadences` | `cadences`, `cadence_steps`, `cadence_runs` | M16 | S | v2 |
| M25 | `gdpr_retention` | `data/gdpr-retention` | Job mensual de anonimización, RPC de DSAR | M21 | S | v2 |

Gate de cada una (10.7): desarrollo en Supabase local del Mac con pgTAP; `db push` a `josecoded` solo con **OK de Jose por migración en la misma sesión**, drift y advisors antes y después, nunca `db reset`; la aplica el controlador, no un subagente. Prerrequisitos de la zona auth/admin que faltan y van antes de M16: `data/invitations` + `auth/invitation` (U4), `admin/users` (D2), M10 `outbox` + `admin/notifications` (D5).

---

## 5. Orden de construcción por olas

Reglas: un bloque = una pantalla con sus componentes o una función completa, ≤ ~400 líneas y ≤ 1 h (10.2); rama `<area>/<tema>`; `implementador-web` → `revisor` → fixes; `/puerta-calidad` una vez por pantalla antes del merge; pantallas nuevas con prototipo HTML aprobado por Jose en el navegador antes de implementar; `ux` → `usuario-ejemplo` → `ui` antes del plan en cada pantalla nueva o rehecha. Dentro de una ola los bloques no tocan los mismos ficheros, **salvo `messages/es.json`**: cada bloque añade solo su espacio de claves y rebasa antes del PR. Lo que necesita datos entra como `{{DATO}}` y el bloque se da por hecho.

**Leyenda de gates:** **OK-mig** OK de Jose a una migración · **OK-dep** OK a una dependencia o script externo · **R** textos por `redactor` en el Mac · **D** datos de Jose (§6) · **Q*n*** depende de la pregunta *n* · **Proto** prototipo aprobado en el navegador.

### Ola 0 · En vuelo (no tocar)

`public/como-trabajo` · `public/about-legal` · `infra/perf-budget` · `data/lead-claim`.

### Ola 1 · Sin datos nuevos ni migraciones (todo en paralelo)

| Bloque | Rama | Qué | Tam. | Depende | Gates |
|---|---|---|---|---|---|
| B01 | `fix/price-state` | `PriceState` (`review | range | final`) y sustitución de `000 €`/`00 €/h` en `RateFigure`, `OfferCompare`, `OfferResult`, tiles del hub; `i18n:check` sigue listando `{{DATO: tarifa}}` | S | — | R, Q1 (si rango) |
| B02 | `public/proof-strip` | `ProofStrip` (`line | tile | case`), `DemoTag` en el hero, `ProofTile` del hub consume la variante `tile`; eventos preparados | S–M | — | R, D (redacción 3Cat según Q5; mientras, plantilla genérica) |
| B03 | `public/hub-hiring-cta` | `NeedTile` contratación → CV primaria + trayectoria + Nexo; `ExpectationLine` en las tres tiles | S | — | D (PDF del CV; sin él, «Ver trayectoria» primaria) |
| B04 | `public/contact-next` | `WhatHappensNext`, disposición por `?via`, `ChatChannel` sin promesa, chip con garantía y «sin compromiso», éxito por vía, ejemplo plegable | M | — | R |
| B05 | `public/freelance-terms` | H1 con keyword, `TaskExamples` con tamaño (5, con auditoría a11y), `TermsStrip`, `PilotTask`, `AvailabilityNote` como hueco | M | — | R, Q6 |
| B06 | `public/offers-trust` | `CostsDisclosure`, `OwnershipNote`, `WarrantyChip`, `PriceDrivers`, `WarrantyPlans` arriba y literal de permanencia, `WhatINeedFromYou` | M | — | R |
| B07 | `public/recommender-honest` | Pre-revisión, lista de supuestos, mantenimiento desmarcado, copy de `nexoGuide.ask.more`, `ShareLink`, `ExtraList` filtrado | S–M | — | R |
| B08 | `public/faq-objections` | Objeciones nuevas en las tres `FaqWithNexo`; «Mi asistente»; `common.responseTime` | S | — | R, D (IVA, NDA, solape) |

### Ola 2 · Tras la ola 0 y con datos o decisiones de Jose

| Bloque | Rama | Qué | Tam. | Depende | Gates |
|---|---|---|---|---|---|
| B09 | `public/home-sections` | `ServicesStrip`, `RecommenderTeaser`, `StackRow`, `Closing`; comprobación de `EntityParagraph`; `ProofStrip` bajo el hero | M | B01, B02 | R, Proto (sección a sección sobre `prototipos/`) |
| B10 | `public/projects-real` | `projectSchema` ampliado, MDX reales (3CatInfo, 3Cat, NextRaket, josecoded) con `{{DATO}}`, lista sin «Pronto», `FilterTabs`, ejemplos fuera de producción, `noindex` condicional | M | — | D, Q5, R |
| B11 | `public/project-detail` | Ficha completa, JSON-LD por tipo, `NeedSomethingLikeThis` con `?from`, OG | M | B10 | Proto |
| B12 | `public/recommender-email` | `SummaryByEmail`: Server Action, Turnstile, lead (`source = form`, `via = project`), plantilla Resend, enlace `?q=` | M | B07, `data/lead-claim` | R |
| B13 | `data/site-settings` (M12) + `public/availability-note` | Tabla mínima, vista pública, `AvailabilityNote` con caducidad de 30 días en freelance y a medida; Nexo la lee | S + S | — | OK-mig, Q3, D |
| B14 | `data/events` (M13) + `infra/analytics` | `private.events`, `/api/e` con zod y límite, `track()`, Cloudflare WA en la CSP, GPC | S + M | — | OK-mig, OK-dep, Q2 |
| B15 | `public/events-wiring` | Eventos de §3.4 en los componentes existentes (uno por evento, sin lógica) | S | B14 | — |
| B16 | `data/leads-attribution` (M14) + `public/contact-fields` | UTM/`ref` en URL y formulario, `budget_range`, `repo_url`, `task`; acuse por email | S + S | `data/lead-claim`, M10 (acuse por `outbox`; si no, Resend directo) | OK-mig, Q11 |
| B17 | `public/seo-entity` | `Person` completo (§3.8), `url` → sobre mí, `sameAs`, `hasCredential`; `@id` = origen con test | S | `public/about-legal` | D (retrato, enlaces) |
| B18 | `public/seo-schema` | `ProfessionalService` + `OfferCatalog` sin precios, `ContactPage`, migas en todas las públicas | S | — | — |
| B19 | `public/og-images` | `opengraph-image.tsx` por ruta; comprobación en OpenNext; fallback a `public/og/` | S–M | — | — |
| B20 | `public/payment-schedule` | `PaymentSchedule` en a medida y en el chip de contacto | S | B06 | Q4 |
| B21 | `public/about-adjust` | Lo que falte de §2.6 tras `public/about-legal` (`HowIWork` con hechos de 3Cat, `CredentialList`, modalidad si Q3) | S | `public/about-legal` | D |
| B22 | `public/como-trabajo-adjust` | Añadidos de §2.5 | S | `public/como-trabajo` | — |

### Ola 3 · Contenido, blog y refuerzo SEO

| Bloque | Rama | Qué | Tam. | Depende | Gates |
|---|---|---|---|---|---|
| B23 | `public/blog-index` | Índice, `CategoryTabs`, paginación, interruptor | S | — | — |
| B24 | `public/blog-post` | Artículo con `AuthorBox`, `Toc`, `Faq`, `RelatedService`, relacionados, `BlogPosting` | M | B23 | Proto |
| B25 | `docs/blog-skeletons` | Esqueletos de los artículos 1, 4, 3 y 6 con `{{DATO}}` y FAQ | S | B24 | R |
| B26 | `public/lead-magnets` | `GuideDownload` (PDF sin muro), checklist y plantilla de auditoría como páginas; `guide_download` | S | B24 | R |
| B27 | `public/offers-table` | `OfferCompare` con `<table>` semántica presentada como tarjetas | M | B06 | — |
| B28 | `public/freelance-table` | `ByHourOrByTask` | S | B05 | R |
| B29 | `public/related-blocks` | `RelatedProjects` y `RelatedGuides` en las tres páginas de servicio desde `relatedService`/`category` | S | B10, B24 | — |
| B30 | `infra/seo-e2e` | Sitemap con `lastModified`, E2E de SEO por ruta, `pathnames.ts` preparado para `/en` | S | — | — |
| B31 | `ai/llms-full` | `llms.txt` ampliado + `llms-full.txt` | S | B10 | — |
| B32 | `public/home-projects` | `ProjectGrid` en la home (W17) cuando haya ≥ 2 fichas | M | B10, B09 | — |
| B33 | `public/errors-plus` | Sugerencia por ruta en 404, `not_found`, mantenimiento con hora | S | B13 | — |

### Ola 4 · Prerrequisitos y datos del CRM (secuencial por migración; cada una con OK)

| Bloque | Rama | Qué | Tam. | Depende | Gates |
|---|---|---|---|---|---|
| B34 | `data/invitations` + `auth/invitation` | `invitations`, `accept_invitation` (llama a `ensure_my_conversation`), U4 | M + M | M01 | OK-mig, Proto |
| B35 | `admin/users` | D2 con `InviteSheet` (previsualización de comisión), `ReassignSheet` | M | B34 | Proto |
| B36 | `data/outbox-notifications` (M10) + `admin/notifications` | `outbox`, `notifications`, Telegram, D5 | M + M | M02, M06 | OK-mig, D (bot de Telegram) |
| B37 | M14 … M21 | Una rama `data/*` por migración de §4.6 en el orden de la tabla | S/M c/u | tabla §4.6 | OK-mig cada una, Q7–Q11 |

### Ola 5 · Pantallas del CRM MVP (en paralelo tras su migración; prototipo por pantalla)

| Bloque | Rama | Pantalla | Depende |
|---|---|---|---|
| B38 | `crm/leads-inbox` | K8 | M04, B21 de `data/lead-claim` |
| B39 | `crm/contacts-list` | K2 (tabla y lista de tarjetas en móvil, filtros en URL, acciones rápidas) | M15 |
| B40 | `crm/contact-detail` | K3 base: `ContactHead`, `DealCard` ampliada, `ActivityTimeline`, `ActivityComposer`, `SourceCard`, `mailto:`/`wa.me` con registro | M15, M17 |
| B41 | `crm/pipeline` | K10 | M15 |
| B42 | `crm/today` | K11 + `TaskComposer` en K3 | M16 |
| B43 | `crm/quote-builder` | `QuoteBuilder`, `QuotePreview`, versiones, PDF | M18 |
| B44 | `public/quote-accept` | P9 `/propuesta/[token]` con OTP y evidencias | M18 |
| B45 | `admin/payments` | D9 Cobros, pestaña Cobros de K3 | M20 |
| B46 | `crm/commissions` | K4 rehecha con líneas y liquidaciones | M19, M20 |
| B47 | `admin/payouts` | D10 con extracto PDF | M20 |
| B48 | `crm/onboarding` | K9 con acuerdos, DPA, `SalesKit` (`?ref=`), checklist; contenido MDX | M21, M14 |
| B49 | `crm/settings` + `crm/overview` | K6, K1 con contadores reales | M19 |
| B50 | `infra/crm-notifications` | Eventos de §4.3 sobre `outbox` y Telegram | B36, M16–M20 |

### Ola 6 · CRM v2 y portal (cuando haya 2+ closers o primeros cobros)

Cadencias (M24, `crm/cadences`, `admin/cadences`) · email BCC (`infra/email-log`, dependencia por `revisor`) · D11 Ventas y `targets` (M22) · puntuación de leads · duplicados, fusión y protección de cartera (M23, D12) · exportación · A6 Facturas y `change_order` en el área (tras `data/projects-schema`) · D13 Auditoría · D14 Privacidad y conservación (M25) · K12 Aprende · Telegram con botones inline · `QuickLogSheet` y PWA.

---

## 6. Preguntas para Jose (recomendación primero; ≤ 4 opciones; listas para AskUserQuestion)

1. **Precio provisional, hasta la ronda de precios.** a) **«Precio en revisión» + «precio cerrado por escrito en 24–48 h», sin cifra** · b) Rango orientativo por nivel y por hora que tú me das ahora («entre X y Y») · c) Dejar `000 €` tal cual.
2. **Analítica sin cookies.** a) **Sí: Cloudflare Web Analytics + eventos propios en `private.events` (sin IP, sin identificador, purga a 90 días); apruebas la migración y el script** · b) Solo Cloudflare Web Analytics, sin eventos propios · c) Nada hasta el lanzamiento.
3. **Disponibilidad y modalidad públicas** (toca 2.8). a) **Publicar «Madrid · remoto o híbrido» y «Próximo hueco: {mes}» / «{n} h/semana desde {fecha}» desde `site_settings`, que caducan solas a los 30 días; Nexo responde el detalle** · b) Solo la modalidad; nada de huecos · c) Nada: todo lo responde Nexo (2.8 tal cual).
4. **Forma de pago por fases en «A medida».** a) **40 % al empezar · 40 % al entregar el diseño · 20 % al publicar** · b) 50 / 50 · c) Otra (dímela) · d) No publicar la forma de pago.
5. **Qué se puede decir de 3Cat (NDA de Alten).** a) **Nombre de las apps (3CatInfo, 3Cat), enlaces a las tiendas, tu papel exacto «desarrollador React Native en el equipo de Alten», fechas, y hechos de rol (IA, accesibilidad, formación), sin logos, métricas internas ni capturas** · b) Solo «apps de una radiotelevisión pública, vía Alten», sin nombres · c) Nada hasta tener permiso escrito.
6. **Nueva oferta «Auditoría de accesibilidad de apps React Native».** a) **Sí, como encargo de la vía freelance (ejemplo con tamaño y entregable), artículo del blog y plantilla descargable; página propia solo si hay demanda** · b) Sí, con página propia desde ya · c) No.
7. **Modelo de comisión** (afina 7.6–7.7). a) **Devengo por cobro (líneas por pago, devoluciones restan), base neta sin IVA, recurrentes 12 meses, ampliaciones sí si se aceptan en 12 meses, vía contratación sin comisión** · b) Igual pero sobre el bruto con IVA · c) Mantener 7.7: una fila al ganar, se aprueba entera al cobrar.
8. **Facturación.** a) **Emites en tu programa conforme a VeriFactu y el CRM registra número, fecha, importes y PDF; los closers te facturan su liquidación** · b) El CRM genera un PDF «proforma» no fiscal además de registrar · c) Quieres emitir facturas desde el CRM (requiere software certificado: lo descarto salvo que insistas).
9. **Propuestas y firma.** a) **Propuesta pública por enlace con token, versiones, PDF y aceptación con OTP al email + evidencias (firma electrónica simple)** · b) Igual sin OTP (solo casilla y nombre) · c) Aceptación por email a mano, sin página.
10. **Reglas de los closers.** a) **Descuento máximo 10 % sin tu aprobación (por encima, Telegram); cartera: 90 días sin actividad → aviso, 120 → vuelve a la bandeja (salvo clientes ganados); exportación solo de su cartera propia y desactivable** · b) Lo mismo sin caducidad de cartera · c) Sin descuentos sin tu OK y sin exportación.
11. **Atribución y visibilidad del closer.** a) **Enlace personal `?ref=` sin cookie (en URL y formulario); el lead entra asignado a ese closer; el closer ve fase y avance del proyecto de sus clientes ganados (no tareas ni documentos)** · b) `?ref=` sí, pero el closer no ve el proyecto · c) Sin enlaces personales.

Decididas por `arquitecto` sin preguntar (reversibles con un PR): `DemoTag` en el hero; mantenimiento nunca premarcado (C2); sin PDF del CV en la home (C4); `ChatInvite` oculto hasta que el chat responda (C11); imanes sin muro; `SummaryByEmail` con `source = form` (sin enum nuevo); categoría `accesibilidad-ia` (C13); contrato de encargado obligatorio antes de reclamar; `commission_lines` y `crm_tasks` como nombres; sin tarjeta Prototipo (C7).

---

## 7. Datos que debe aportar Jose

| Dato | Desbloquea |
|---|---|
| Retrato real (≥ 1200 px, con permiso de uso) | Sobre mí, `Person.image`, caja de autor, OG |
| CV en PDF (es, y en si lo tiene) | `CvDownload`, tile de contratación del hub |
| Qué permite el NDA de Alten sobre 3Cat (pregunta 5): nombres, enlaces a App Store y Google Play, fechas exactas, qué partes tocó en 3CatInfo y 3Cat, si Alten puede figurar en `worksFor` | Fichas 3CatInfo y 3Cat, `ProofStrip`, `Timeline`, `HowIWork` |
| NextRaket: qué es, enlace público, 1–2 casos (cliente, sector, qué hizo, resultado con cifra y fuente), si el cliente acepta ser nombrado o citado | Ficha NextRaket, `ProofStrip` variante `case`, `RelatedProjects` |
| Rango orientativo o tarifa real por hora y por nivel (si pregunta 1 = b), o fecha de la ronda de precios; variables de `ofertas.md` §2.4 | `PriceState`, JSON-LD de precios, `llms.txt` |
| Horas libres por semana, próximo hueco de proyecto, modalidad, solape horario | `AvailabilityNote`, `TermsStrip`, FAQ |
| Política real de NDA, IVA, factura como autónomo o por consultora, idiomas, desplazamientos | FAQ de objeciones (B08) |
| Umbrales del campo «presupuesto aproximado» (X, Y) | `budget_range` (B16) |
| Enlaces: LinkedIn, GitHub, Malt u otros perfiles; ID de PeopleCert de ITIL 4; nombre del centro de DAW | `sameAs`, `CredentialList`, `hasCredential` |
| Número de WhatsApp y cuenta de Cal.com (2.9) | Chooser, `QuickContact`, `CalEmbed` |
| Nombre legal, NIF, domicilio, email legal | Legales (en vuelo) |
| Bot de Telegram (token) | D5, recordatorios del CRM |
| Repo `josecoded-omen` creado (10.8) y modelo local + `GROQ_API_KEY` | Chat con IA, `ChatInvite`, Nexo en salas |
| Acuerdo comercial y DPA para closers (texto base; `comercial` en el Mac), % de retención si son profesionales, fechas de VeriFactu con el gestor | K9 onboarding, `payouts` |
| Decisión sobre Google Business Profile como negocio de área de servicio | SEO local (fuera del repo) |
| Textos marcados **R**: lead del hero, `ProofStrip`, `WhatHappensNext`, `PilotTask`, `TermsStrip`, FAQ de objeciones, `ExpectationLine`, `CostsDisclosure`, `OwnershipNote`, textos de `SummaryByEmail`, guías y esqueletos del blog, contenido de K9/K12 | Todo lo de las olas 1–3 pasa por `redactor` en el Mac antes del merge definitivo |

---

## 8. Qué anotar al cerrar

- **`decisiones.md`:** C1–C13 como 2.29–2.3x (precio provisional como estado `review`, mantenimiento nunca premarcado, sin página por ciudad, CV fuera de la home, categoría `accesibilidad-ia`, Nexo anuncia por qué habla en salas privadas); las respuestas de §6 como 2.3x (público: 1–6) y 7.11–7.17 (CRM: 7–11); R9 de `ofertas.md` corregida.
- **`ESTADO.md`:** este documento en «Ahora»; las once preguntas y la tabla de datos en «Pendientes → Jose»; las olas 1–2 como «Siguiente paso»; los textos **R** en «Pasar por `redactor`»; M12–M25 junto a M05–M11 en el disparador de 10.7.
- **Vault `Proyectos/josecoded.md` (desde el Mac):** «prueba verificable o nada; precio en revisión en vez de ceros; comisión devengada por cobro; facturación fuera del CRM (VeriFactu); propuestas con firma simple por OTP; closers con DPA antes de reclamar; analítica sin cookies con eventos propios».
- **ADR en codebase-memory (cuando haya código):** «`PriceState` como único componente de precio con tres estados»; «`commission_lines` por pago sobre cabecera `commissions` con tasas congeladas»; «`quotes` inmutables tras aceptar, cambios como nueva versión»; «eventos de analítica sin identificador persistente en `private.events`»; «reglas del CRM (probabilidades, tareas automáticas, conservación) en código con test, nunca en tablas».
- **Tablón (GitHub Issues + Projects, 10.5):** una issue por bloque B01–B50 con su ola, dependencias y gates.
