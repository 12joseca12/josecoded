# Plan SEO/GEO de josecoded (ronda 2)

**2026-11-05 · especialista SEO/GEO · para `arquitecto`.** Parte de `docs/arquitectura/seo.md` (plan base), `division-pantallas.md`, `valor-pantallas.md`, `decisiones.md` (2.12, 2.13, 2.19, 2.23–2.28), `ofertas.md`, `src/lib/seo/*`, las páginas de `src/app/[locale]/(site)/`, `messages/es.json`, `content/cv.json` (de la rama del agente) y la preview del 2026-11-05.

**Volúmenes:** Semrush respondió `no_api_units`, así que no hay cifras reales. Todo volumen va como **estimación** en franjas (MB < 50 · B 50–200 · M 200–1.000 · A > 1.000 al mes en España) y se valida con `keyword_research` (base `es`) antes de cerrar titulares.

---

## 1. Auditoría: plan frente a lo implementado

### Hecho y correcto
| Punto del plan | Estado en preview |
|---|---|
| T5 `/` → `/es` con 308 | Hecho. `/es/servicios/packs` → 308 a `a-medida` (2.24). |
| T1 `title.template` `%s · josecoded`, canonical absoluto a `https://josecoded.com/…` | Hecho en todas las públicas. |
| T12/S4 preview no indexable | `X-Robots-Tag: noindex, nofollow` + `robots.txt` `Disallow: /`. Bien. |
| T3 robots con bots de IA permitidos (2.12) | Hecho en `robots.ts` (20 agentes, zonas privadas en `Disallow`). |
| JSON-LD `Person` + `WebSite` global, `BreadcrumbList` + `FAQPage` en servicios | Hecho, grafo validado por zod y escapado. |
| H1 con keyword en hub y a medida; FAQ visibles en `<details>` | Hecho (4 + 4 + 6 preguntas). |
| `llms.txt` generado desde `messages` | Hecho: párrafo de entidad, vías, páginas, entidad y emails. |
| `/proyectos` vacío → `noindex, follow` (T6, evita soft 404) | Hecho y fuera del sitemap. |

### Huecos (ordenados por gravedad)
| # | Hueco | Impacto |
|---|---|---|
| G1 | **Enlaces internos rotos**: nav y pie enlazan a `/es/sobre-mi`, `/es/blog`, `/es/legal/{aviso,privacidad,cookies}` y todas dan **404**. | Alto. Rastreo malgastado y sin páginas legales (confianza y RGPD). Bloquea el lanzamiento. |
| G2 | **No existe `/sobre-mi`**: es la casa de la entidad, del stack, del CV y del E-E-A-T, y el `ProfilePage`. | Alto. Sin ella, el `Person` no tiene página que lo respalde. |
| G3 | **La home solo tiene el hero** (ningún H2, ningún enlace a `/servicios/freelance` ni a `/servicios/a-medida`). El escaparate de 2.19 (`ServicesStrip`, `ProjectGrid`, `StackRow`, `Closing`) falta. Los textos de la demo («pedidos.app», «3,80 €», «4,8») son el texto que más pesa en el HTML y no son contenido real. | Alto. La página más fuerte no reparte autoridad a las hijas. |
| G4 | **`Person` pobre**: faltan `image`, `knowsAbout`, `knowsLanguage`, `worksFor`/`hasOccupation`, `alumniOf`, `hasCredential`; `sameAs` solo tiene LinkedIn (falta GitHub y perfiles de freelance); `url` apunta a `/es` en lugar de `/sobre-mi`. | Alto para GEO (resolución de entidad). |
| G5 | **Sin `ProfessionalService`/`OfferCatalog`/`Offer`** en hub, freelance y a medida (§5 del plan); tampoco nodos `WebPage`/`ContactPage`/`CollectionPage`. | Medio-alto. |
| G6 | **Precios provisionales** («Provisional · €»): sin cifra no hay GEO de precios (S2). `llms.txt` omite bien las tarifas, pero el día que lleguen deben salir con fecha. | Alto, depende de Jose (2.23). |
| G7 | **Sin `og:image`** y `twitter:card summary`; `next/og` devuelve 404. | Medio (CTR social, previews en LinkedIn y chats). |
| G8 | **Comparador de niveles sin `<table>`**: `a-medida` pinta los niveles en tarjetas; los LLM y Google extraen mejor una tabla semántica. | Medio, esfuerzo bajo. |
| G9 | H1 de freelance perdió «React Native» («Programador freelance por horas o por tarea.»). El plan pedía «Desarrollador React Native freelance…». `/proyectos` titula «Proyectos» sin keyword. | Medio, esfuerzo mínimo. |
| G10 | Menú móvil con anclas «Aquí» repetidas y el chooser dice «Nuestro asistente» (incoherente con la voz en primera persona singular). | Bajo-medio (anclas pobres, entidad). |
| G11 | `@id` del JSON-LD sale con el origen de la preview mientras el canonical apunta a producción. En producción coinciden, pero hay que fijar ambos a `site.origin` y testearlo. | Bajo, test T15. |
| G12 | Sitemap sin `lastModified`; sin blog ni fichas aún. `llms-full.txt` sin hacer. Sin E2E de SEO (T15). | Medio. |
| G13 | Cloudflare (S5/T13): bloqueo de bots de IA y robots gestionado **sin verificar en producción**; Search Console y Bing Webmaster sin dar de alta. | Alto el día del lanzamiento (acción de Jose). |

---

## 2. Por pantalla: queries, componentes y enlaces

Cada fila: query principal (est.), secundarias, y los componentes que suman SEO/GEO. «Casa» sigue a `division-pantallas.md` §0.

### Home `/es`
- **Query:** desarrollador react native (M / media) · programador react native madrid (B / baja) · desarrollador full stack react native (B).
- **Componentes:** `EntityParagraph` (ya en el hero, mantener literal idéntico a `seo.llms.summary`) · `ServicesStrip` con tres tarjetas y anclas descriptivas («programador freelance por horas», «precio de app móvil y web a medida», «desarrollador React Native para tu equipo») · `ProjectGrid` con 3 casos y **una cifra con fuente** cada uno · `ProofStrip` de una línea: «Apps de 3Cat en App Store y Google Play · referente de accesibilidad WCAG · IA en producción» con enlace a la prueba · `StackRow` → `/sobre-mi#stack` · `Closing`.
- **Schema:** `WebPage` + `ProfessionalService` (`provider` → Person, `areaServed` Madrid/España, `url` hub).
- **Demo del hero:** marcar el mockup como `aria-hidden` y decorativo para que no compita en el texto principal; o dar a sus textos contenido real de un caso.

### Servicios (hub) `/es/servicios`
- **Query:** servicios desarrollo de apps y webs (B) · contratar desarrollador de aplicaciones (B) · desarrollador react native remoto (MB, reclutadores).
- **Componentes:** `EntityParagraph` · tarjetas de vía con la cifra «desde» (cuando exista) · `HowIWorkInTeams` con prueba (repo, CI) · `Steps` de cinco fases con una frase definitoria por fase (citable) · FAQ general (remoto, factura, idiomas, plazo de respuesta) · 2 guías relacionadas.
- **Schema:** `ProfessionalService` con `hasOfferCatalog` (3 `Offer`, una por vía) · `FAQPage` · `BreadcrumbList`.

### Freelance `/es/servicios/freelance`
- **Query:** programador freelance por horas (B / baja-media) · desarrollador react native freelance (B / baja) · precio hora programador freelance (B–M) · auditoría app react native (MB).
- **Componentes:** H1 «Desarrollador React Native freelance, por horas o por tarea.» · `RateFigure` con cifra, unidad y «Actualizado el {fecha}» en texto · **tabla «Por horas o por tarea»** (cuándo conviene cada una, mínimo, seguimiento, factura) · `TaskExamples` con rango de horas típico por tipo (funcionalidad, auditoría, rescate, IA, **auditoría de accesibilidad**) · `RelatedProjects` (2) · 2 guías · FAQ propia.
- **Schema:** `Offer` con `UnitPriceSpecification` (`unitCode HUR`, `priceCurrency EUR`, `validFrom`) · `FAQPage` · `BreadcrumbList`.
- **Nuevo encargo con mucha ventaja:** «Auditoría de accesibilidad de apps React Native» (su rol real en Alten + Ley 11/2023 y European Accessibility Act en vigor desde junio de 2025). Query «auditoría accesibilidad app» (B / baja, est.) con poquísima competencia de perfiles individuales.

### Desarrollo a medida `/es/servicios/a-medida`
- **Query:** precio app móvil (M / media) · presupuesto app (M) · precio página web negocio (M / media) · desarrollo app a medida madrid (B / media).
- **Componentes:** frase citable con todos los «desde» y la fecha bajo el H1 · **`PackCompare` como `<table>`** (filas: para quién, qué incluye, plazo en semanas, qué aportas tú, desde) con `caption` · recomendador (2.26) con su resultado en URL compartible (`?nivel=`) pero canonical sin parámetros · `ExtraList` con unidad de facturación · bloque «Qué no incluye» (señal de honestidad, muy citable) · garantía 30 días y mantenimiento en tres tamaños con precio · FAQ de precios · 2 casos + 2 guías de precio.
- **Schema:** `OfferCatalog` con un `Offer` por nivel (`itemOffered: Service`, `priceSpecification.minPrice`, `eligibleDuration` en semanas) y `Offer` por plan de mantenimiento (`UnitPriceSpecification` mensual) · `FAQPage` · `BreadcrumbList`.
- **Fase 2:** `/servicios/a-medida/[nivel]` solo cuando cada nivel tenga ≥ 400 palabras propias; si no, canibaliza.

### Proyectos `/es/proyectos` y fichas `/es/proyectos/[slug]`
- **Query:** portfolio desarrollador react native (B / baja) · ejemplos de apps react native (B) · `{nombre del proyecto}` (navegacional).
- **Lista:** H1 «Proyectos: apps React Native y webs **en producción.**» · `CollectionPage` + `ItemList` · indexable en cuanto haya ≥ 2 fichas reales (quitar `app-ejemplo` y `web-ejemplo` del build de producción).
- **Ficha (caso de estudio):** `ProjectHead` con papel, período y enlace verificable · El reto · Qué hice · Resultado con **cifra y fuente** · `StoreLinks` · `NeedSomethingLikeThis` → servicio por `relatedService` · 1 guía · `PrevNext`. Schema `MobileApplication` (app) o `WebSite`/`CreativeWork` (web) con `creator` → Person, `contributor` si es trabajo de equipo, sin `aggregateRating`.
- **Fichas candidatas (reales):** 3CatInfo (IA en el producto, accesibilidad) · 3Cat (funcionalidades RN) · HazmeFila (Expo + Supabase) · Oportunix (Next 16 + Firebase) · webs de comercios (NextRaket) · josecoded (`/proyectos/josecoded`, «Cómo trabajo», 2.20). **Las de 3Cat necesitan permiso de Alten/cliente**: si no lo hay, ficha «Trabajo en equipo para una radiotelevisión pública» sin capturas internas, con enlace a la tienda pública y el papel exacto («como parte del equipo de Alten»). Nunca atribuirse la app entera.

### Sobre mí `/es/sobre-mi` (no existe: G2)
- **Query:** josé carlos sánchez garcía (marca) · josecoded · desarrollador react native madrid (B / baja).
- **Componentes:** `EntityParagraph` · retrato real con `alt` · `Timeline` desde `cv.json` (Alten · 3Cat desde abr 2024; NextRaket freelance 2024–; DAW 2023; entrenador de tenis 2017–2023 como rasgo humano) · `HowIWork` con hechos comprobables (forma a equipos de RN, iOS, Android y QA; referente WCAG) · `StackGroups #stack` · `CredentialList` (DAW, ITIL 4 Foundation hasta 2029, Cambridge B2, Scrum Master, cursos de IA/n8n y DevOps) · `LinkRow` con `rel="me"` · CV PDF (noindex + `Link rel=canonical` a esta página).
- **Schema:** `ProfilePage` con `mainEntity` → Person (`@id` global), `hasCredential` (`EducationalOccupationalCredential`), `alumniOf` (IES El Lago), `worksFor` (Alten, si Jose lo acepta) y `knowsAbout`.

### Contacto `/es/contacto`
- Tráfico orgánico casi nulo: no perseguir queries. Title «Contacto y presupuesto · josecoded», `ContactPage` + `BreadcrumbList`, canonical sin `?via`/`?pack`, «Qué pasa después» con plazo real (citable: «respondo en {N} h laborables»).

### Blog `/es/blog` y artículos
- **Componentes de artículo:** definición en la primera frase de cada H2 · **tabla o cifra propia** obligatoria · caja de autor (foto, una línea con la credencial pertinente, «Actualizado el») · `Toc` · FAQ 3–5 · `RelatedService` en el primer tercio y al final · 2 relacionados de la misma categoría · `BlogPosting` + `FAQPage` + `BreadcrumbList`.
- **Migas en todas las públicas salvo home** (ya existe `breadcrumbs` en mensajes; extenderlo a proyectos, sobre mí, blog y contacto).

---

## 3. Hubs de contenido y primeros 10 artículos

Cuatro hubs (= categorías del blog, cada uno colgando de un servicio):

| Hub | Categoría | Alimenta | Página pilar |
|---|---|---|---|
| Precios y plazos | `precios` | A medida | art. 1 |
| Trabajar con un freelance | `trabajar-con-freelance` | Freelance | art. 3 |
| React Native en producción | `react-native` | Contratación, Freelance | art. 5 |
| Accesibilidad e IA en apps | `accesibilidad-ia` (**nueva**, sustituye a `ia` y suma accesibilidad) | Freelance (auditoría), A medida (extra IA) | art. 4 |

| # | Título de trabajo | Query objetivo (est.) | Hub | Pantalla que alimenta | E-E-A-T propio |
|---|---|---|---|---|---|
| 1 | Cuánto cuesta hacer una app móvil en España en 2026 | cuánto cuesta hacer una app (A / alta) · precio app móvil (M) | precios | `/servicios/a-medida` | rangos de sus niveles y desglose por fases |
| 2 | Precio de una página web para un negocio: rangos reales | precio página web negocio (M / media) | precios | `/servicios/a-medida` (web) | webs de comercios de NextRaket |
| 3 | Programador freelance por horas o por tarea: cuál te conviene | programador freelance por horas (B) | freelance | `/servicios/freelance` | su propio modelo de tarifa |
| 4 | Accesibilidad en apps: qué exige la European Accessibility Act y cómo cumplirla con React Native | accesibilidad apps ley 2025 · european accessibility act apps (B / baja, en subida) | accesibilidad-ia | `/servicios/freelance` (auditoría) | **referente WCAG en las apps de 3Cat** |
| 5 | React Native, Flutter o nativo en 2026: cómo elegir | react native vs flutter (M / media) | react-native | `/servicios/a-medida`, contratación | forma a equipos iOS y Android |
| 6 | Integrar IA en una app de noticias: lo que aprendí en producción | integrar ia en app (B) · llm en app móvil (B) | accesibilidad-ia | `/servicios/freelance` (IA), extra IA | **responsable de IA en 3CatInfo** (sin datos confidenciales) |
| 7 | Cuánto se tarda en hacer una app: fases y plazos | cuánto se tarda en hacer una app (B) | precios | `/servicios/a-medida` | las cinco fases (2.14) con semanas |
| 8 | Cómo publicar una app en App Store y Google Play: pasos, costes y rechazos | publicar app en app store / google play (M) | react-native | `/servicios/a-medida` (alta en tiendas) | apps publicadas |
| 9 | Qué comprobar antes de contratar a un desarrollador freelance | contratar programador freelance (B–M) | freelance | `/servicios/freelance`, `/contacto` | checklist de su propia web (repo, CI, Lighthouse) |
| 10 | Mantenimiento de una app: qué incluye y cuánto cuesta al mes | mantenimiento app precio (B) | precios | `/servicios/a-medida` (planes) | sus tres planes (2.27) |

Orden: 1, 4, 3, 6, 2, 5, 7, 9, 8, 10 (dos de dinero y dos de experiencia propia primero: los de accesibilidad e IA son los que nadie más puede firmar). Reserva para la segunda tanda: «Expo en 2026», «Chatbot con IA para una web: qué cuesta», «Accesibilidad con lector de pantalla en React Native: guía práctica» (técnico, enlaces desde GitHub y comunidad), «Supabase o Firebase para una app». Textos por `redactor` en el Mac; en la nube, esqueleto y `{{DATO}}`.

---

## 4. Oportunidades programáticas

| Idea | Veredicto | Por qué |
|---|---|---|
| «Desarrollador React Native en {ciudad}» × 50 ciudades | **No.** | Son *doorway pages* (política de spam de Google, actualización de marzo 2024 «scaled content abuse»). Un perfil individual sin presencia física en esas ciudades no tiene nada distinto que decir en cada una; riesgo de penalización manual a todo el dominio por ganar queries MB. |
| Madrid como única página local | **Sí, sin página nueva.** | «Madrid» en H1/párrafo de entidad de home y sobre mí, `address` y `areaServed`; ya está. Una página `/servicios/a-medida/madrid` solo si hay ≥ 2 casos de clientes de Madrid con contenido propio. |
| Remoto para España / Latam | Más adelante | «desarrollador react native remoto» encaja con contratación; cuando exista `/en`, «React Native developer Spain remote». |
| Fichas por tecnología (`/stack/expo`, `/stack/supabase`) | **No** como páginas; **sí** como anclas en `/sobre-mi#stack` | Contenido fino; el `Chip` de las fichas ya enlaza al ancla. |
| Glosario (`/blog/glosario/{termino}`: «qué es Expo», «qué es WCAG») | Tal vez, fase 3 | Útil para GEO (definiciones), pero solo con ≥ 150 palabras propias y enlaces a guías. Empezar como sección de definiciones dentro de los artículos. |
| Calculadora del recomendador como página indexable | **Sí** (ya decidida, 2.26) | Herramienta única: atrae enlaces. Resultado en HTML del servidor, no solo en cliente. |

---

## 5. SEO local (Madrid)
1. **Google Business Profile** como «negocio de área de servicio» (sin dirección pública, área Madrid + España). Categoría «Desarrollador de software» / «Diseñador de sitios web». Solo si Jose acepta; reseñas reales de clientes de NextRaket con nombre.
2. NAP coherente: «José Carlos Sánchez García · josecoded · Madrid, España» idéntico en web, GBP, LinkedIn, Malt, GitHub, CV.
3. Citas locales de calidad: perfil en Malt y en directorios de freelance españoles, IES El Lago (antiguos alumnos), comunidades de Madrid (meetups de React/React Native Madrid: dar una charla sobre accesibilidad = enlace + entidad).
4. Queries locales objetivo (est., B / baja): programador react native madrid, desarrollador de apps madrid freelance, diseño web para negocios madrid. Viven en home, `/sobre-mi` y los casos de comercios de Madrid; no en páginas creadas para ello.

---

## 6. E-E-A-T con su experiencia real
- **Experiencia:** dos apps de 3Cat en App Store y Google Play desde abril de 2024 (vía Alten) → ficha + línea en `ProofStrip`, siempre con su papel exacto y enlace a la tienda pública.
- **Pericia:** referente de accesibilidad WCAG del equipo y formador de los equipos de React Native, iOS, Android y QA → `HowIWork`, auditoría como encargo freelance, artículos 4 y 13. Prueba propia: esta web con axe en CI y WCAG 2.2 AA (enlace al repo y al informe).
- **IA:** responsable de la integración de IA en 3CatInfo + Nexo en esta web + automatizaciones con n8n y LLM → artículo 6, extra IA, chat como demostración viva.
- **Autoridad:** credenciales verificables (ITIL 4 con ID de PeopleCert, DAW, B2) como `hasCredential`; charla o artículo invitado en un medio técnico; repo público de la web enlazado.
- **Confianza:** legales publicados (G1), precios con fecha, «qué no incluye», garantía de 30 días, sin testimonios anónimos, autor y fecha en cada artículo.
- Cuidado: no publicar métricas internas de 3Cat sin permiso. Lo citable es lo público (estar en tiendas, idiomas, plataformas) y lo suyo (Lighthouse de esta web, tests, tiempos de sus proyectos freelance).

---

## 7. GEO: que los LLM le citen
1. **Entidad única** (ya bien encaminada): el mismo párrafo en `seo.llms.summary`, hero, `/sobre-mi`, LinkedIn «Acerca de», README de perfil de GitHub y Malt. Nombre canónico «José Carlos Sánchez García», alias «josecoded». Corregir «Nuestro asistente» → «Mi asistente».
2. **`sameAs` completo:** LinkedIn, GitHub, Malt, repo de la web; Wikidata no (no es notable aún).
3. **`llms.txt` ampliado:** sección «Proyectos» (nombre, una línea, URL), «Experiencia» (3Cat vía Alten, accesibilidad, IA, con fechas), «Precios» con fecha cuando existan, «Guías». Más `llms-full.txt` con el Markdown de servicios, FAQ y guías.
4. **Frases citables con dato** (una por pantalla, ≤ 30 palabras, con unidad y fecha): «Una web de negocio con José Carlos cuesta desde X € y tarda 4–6 semanas (actualizado el …)». Plazos ya visibles (2–3, 4–6, 8–14, 6–10, 10–16 semanas): son citables hoy, aunque el precio sea provisional.
5. **Estadísticas propias** recogidas para citar: Lighthouse y peso de JS de esta web; nº de apps publicadas; horas medias por tipo de tarea freelance; semanas reales de cada proyecto. Nada inventado.
6. **Medición:** consultas periódicas en ChatGPT, Perplexity, Gemini y Copilot («desarrollador react native freelance madrid», «cuánto cuesta una app en España») y registro de si citan la web; Bing Webmaster (base de ChatGPT) + IndexNow.

---

## 8. Técnico pendiente
| # | Punto | Nota |
|---|---|---|
| T-a | Arreglar 404 internos (G1): o se publican sobre mí, legales y blog, o se quitan del nav/pie hasta que existan (blog tras interruptor, 2.19). | Bloqueante. |
| T-b | `opengraph-image.tsx` por ruta (estilo B, H1 + tipo de página), `twitter:card summary_large_image`, `og:type profile/article`. Verificar `next/og` bajo OpenNext; si falla, PNG en build a `public/og/`. | G7 |
| T-c | Sitemap con `lastModified` (frontmatter `updated ?? date`; para servicios, fecha de `price_changes`), sobre mí, legales, fichas y artículos; índice de sitemaps cuando haya `en`. | G12 |
| T-d | **hreflang al publicar `/en`:** `pathnames.ts` como mapa único; `alternates.languages` `es`, `en`, `x-default` (→ es) solo para pares existentes, también en `sitemap.ts`; `og:locale:alternate`; `llms.txt` en inglés en `/en/llms.txt` o sección propia. | T11 |
| T-e | E2E de SEO (T15): un `h1`, title ≤ 60, descripción 50–160, canonical absoluto = `@id` de JSON-LD con el mismo origen, grafo que parsea, noindex donde toca, estado HTTP. | G11 |
| T-f | Core Web Vitals: el hero animado con mockup es el candidato a LCP/INP; medir en campo (CrUX tras lanzar, `web-vitals` hacia Umami) además de Lighthouse en CI. Presupuesto 9.3. Hoy 13 chunks en home: revisar con el límite de 150 KB gz. | T10 |
| T-g | Cloudflare en producción: desactivar «Block AI bots» y robots gestionado, `www` → apex 301, Crawler Hints/IndexNow; alta en Search Console y Bing por DNS y envío del sitemap el día del lanzamiento. | G13, acción de Jose |
| T-h | Quitar `app-ejemplo` y `web-ejemplo` del build de producción (contenido de muestra indexable si se cuela). | — |

---

## 9. Ranking impacto / esfuerzo

| Orden | Acción | Impacto | Esfuerzo | Bloque sugerido |
|---|---|---|---|---|
| 1 | Cloudflare bots IA + Search Console + Bing (T-g) | Muy alto | Muy bajo (Jose, 20 min) | lanzamiento |
| 2 | Quitar o publicar los destinos 404 del nav/pie (T-a) | Alto | Bajo | `fix/broken-links` |
| 3 | `Person` completo (`image`, `knowsAbout`, `knowsLanguage`, `sameAs` GitHub, `hasCredential`, `url` → sobre mí) + «Mi asistente» | Alto | Bajo | `public/seo-entity` |
| 4 | H1 freelance con «React Native», title de proyectos, comparador como `<table>` | Medio | Muy bajo | `public/seo-onpage` |
| 5 | `/sobre-mi` con timeline, credenciales, stack, CV y `ProfilePage` | Muy alto | Medio | `public/about` |
| 6 | Home escaparate con H2 y enlaces a hijas + `ProofStrip` | Alto | Medio | `public/home-sections` |
| 7 | `ProfessionalService` + `OfferCatalog`/`Offer` en servicios | Medio-alto | Bajo | `public/seo-offers` |
| 8 | Legales publicados | Medio (confianza) | Bajo | `public/legal` |
| 9 | Precios reales con fecha en HTML, JSON-LD y `llms.txt` | Muy alto | Bajo (técnico); depende de Jose | tras la ronda de servicios |
| 10 | OG images por ruta (T-b) | Medio | Bajo-medio | `public/og-images` |
| 11 | 3–4 fichas reales (empezando por josecoded y HazmeFila; 3Cat con permiso) | Alto | Medio | `public/project-pages` |
| 12 | Blog con artículos 1, 4, 3, 6 | Muy alto a 3–6 meses | Alto (redacción en el Mac) | `public/blog` |
| 13 | `llms.txt` ampliado + `llms-full.txt` | Medio | Bajo | `ai/llms-full` |
| 14 | E2E de SEO y sitemap con `lastModified` | Medio (prevención) | Bajo | `infra/seo-e2e` |
| 15 | GBP de área de servicio y citas locales | Medio | Bajo (Jose) | fuera del repo |
| 16 | hreflang y `/en` | Medio | Medio | con el bloque de inglés |

**Validar antes de cerrar titulares:** volúmenes de las queries de §2 y §3 con Semrush (base `es`) en cuanto haya unidades de API; si «european accessibility act apps» o «auditoría accesibilidad app» confirman volumen, subir el artículo 4 y el encargo de auditoría al primer puesto.
