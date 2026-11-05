# Plan de conversión (CRO) de la zona pública — josecoded

2026-11-05 · especialista en marketing web y conversión. Parte de `brief.md`, `division-pantallas.md`, `valor-pantallas.md`, `decisiones.md`, `ofertas.md`, `messages/es.json`, las páginas de `src/app/[locale]/(site)/` y la preview (`/es`, `/es/servicios`, `/es/servicios/a-medida`, `/es/contacto`, `/es/proyectos`; `/es/sobre-mi` da **404**). Respeta las reglas de valor de `valor-pantallas.md` §0 (prueba antes que afirmación, sin testimonios anónimos, sin muro de logos, sin contadores, sin newsletter, una primaria por vista) y las decisiones 2.8, 2.11, 2.17 y 2.20. Textos: dirección de copy, no copy final (pasa por `redactor` en el Mac).

## 0. Diagnóstico en cinco líneas

1. **Las tres vías acaban hoy en un callejón de prueba:** `/proyectos` dice «Pronto», `/sobre-mi` es 404 (y el hub enlaza ahí «Ver CV y trayectoria»), la home es solo el hero y el chat dice «abre muy pronto». La web pide confianza sin enseñar nada verificable.
2. **El precio se ve roto:** `000 €` y `00 €/h` con «provisional» leen como fallo, no como transparencia. Para la pyme es el primer motivo de salida.
3. **El recomendador y el chip «Tu selección» en contacto son la mejor pieza de conversión del sitio** y casi nadie llega a ellos: no hay entrada desde la home.
4. **No hay ninguna medición.** Sin eventos no se puede priorizar nada de lo que sigue tras el lanzamiento.
5. **El recruiter no tiene CTA propio**: la tarjeta de contratación del bento lleva a un formulario («Contactar para contratación»), no al CV.

## 1. Tabla de prioridades (impacto / esfuerzo)

Esfuerzo S ≤ 30 min de agente, M ≤ 1 h, L varios bloques. Impacto sobre leads cualificados de las tres audiencias.

| # | Acción | Pantalla | Audiencia | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 1 | Publicar `/sobre-mi` mínimo con `CvDownload` (PDF es/en) y `Timeline` real (Alten · 3Cat; NextRaket) | Sobre mí | Recruiter | Muy alto | M |
| 2 | Dos casos reales en `/proyectos` (3Cat/3CatInfo, NextRaket) + esta web; quitar «Pronto» | Proyectos | Las tres | Muy alto | M–L (dato de Jose) |
| 3 | Sustituir `000 €` por rango o por «precio en 24 h» hasta la ronda de precios (ver §4) | A medida, freelance | Pyme, CTO | Muy alto | S |
| 4 | Home: `EntityParagraph` + `ServicesStrip` + `ProofStrip` + entrada al recomendador bajo el hero | Home | Las tres | Alto | M |
| 5 | Eventos propios sin cookies (§9) | Todas | — | Alto (habilita todo) | M |
| 6 | `WhatHappensNext` y plazo de respuesta en contacto; éxito con siguiente paso | Contacto | Las tres | Alto | S |
| 7 | `TaskExamples` con tamaño y `PilotTask` en freelance | Freelance | CTO | Alto | S–M |
| 8 | «Envíame este resumen» en `OfferResult` (captura de email con consentimiento) | A medida | Pyme | Alto | M |
| 9 | Tarjeta de contratación del bento → «Descargar CV» primaria + «Preguntar a Nexo si estoy disponible» | Hub | Recruiter | Medio-alto | S |
| 10 | Guía «Cuánto cuesta una app en España» (HTML indexable + PDF sin muro) | Blog/guía | Pyme | Medio-alto (SEO) | L |
| 11 | Mientras no haya chat con IA: el CTA «Chat con Nexo» de contacto/chooser → `FaqWithNexo` guionizado o se oculta | Contacto, chooser | Las tres | Medio | S |
| 12 | `AvailabilityNote` honesta (hueco real de proyecto y fecha de inicio) | A medida, freelance | Pyme, CTO | Medio | S (decisión de Jose) |
| 13 | Página «Cómo trabajo» (2.20) con pruebas enlazadas al repo | Cómo trabajo | Recruiter, CTO | Medio | L |

Orden de ejecución propuesto: 3 → 1 → 6 → 9 → 11 (todo S/M, sin datos nuevos salvo CV) → 5 → 2 → 4 → 7 → 8 → 12 → 13 → 10.

## 2. Pruebas verdaderas disponibles y cómo usarlas

- **3Cat / 3CatInfo (apps de la radiotelevisión pública catalana, como consultor de Alten).** Es la prueba más fuerte para recruiter y CTO: apps de un medio público con audiencia masiva, en las dos tiendas. Mostrar: nombre de la app, enlace directo a App Store y Google Play, papel exacto («desarrollador React Native en el equipo de X, vía Alten»), período, qué partes tocó. **Sin logo de 3Cat ni de Alten** salvo permiso escrito (marca de terceros; además la regla 4 lo prohíbe como muro). Cifras: solo las públicas con fuente y fecha (p. ej. «valoración 4,x en Google Play, consultada el {fecha}», «+N descargas según Google Play»), nunca métricas internas sin permiso. Confirmar con Jose qué puede decir por NDA de Alten.
- **NextRaket (freelance).** Prueba para pyme y CTO: proyecto por cuenta propia, de principio a fin. Necesita de Jose: qué es, qué hizo, enlace público, si el cliente acepta ser nombrado. Si acepta, una cita real con nombre, cargo y enlace (LinkedIn) es el único testimonio admisible.
- **Esta web** (2.11/2.20): repo público, CI, Lighthouse medido. Prueba técnica que nadie más puede ofrecer. Sin métricas vivas (2.17): una cifra con fecha y enlace al run de CI.
- **El hero:** el teléfono muestra «Valoración 4,8», «+18 %», «1.284 pedidos». Es una demo; añadir en el visual una marca discreta tipo «Demo» (o `aria-description` + rótulo en el navegador simulado) para que nadie lo lea como métrica de un cliente. Riesgo reputacional bajo pero real.

Componente transversal nuevo **`ProofStrip`**: una fila de 2–3 pruebas con enlace verificable («Apps de 3Cat en App Store y Google Play» · «NextRaket en producción» · «El código de esta web en GitHub»). Texto, sin logos; cada elemento es un enlace con `rel="noopener"` y evento `proof_click`.

## 3. Home `/es`

**Jerarquía de mensaje (orden de lectura):** quién (H1 actual, bien) → para quién y cómo contratar (lead actual, demasiado largo: cortar a «Apps móviles y webs para empresas. Por horas, por proyecto o en tu equipo.») → prueba → elige tu vía → acción.

1. `Hero` (hecho). CTAs: mantener «Pide propuesta» como primaria pero llevarla al chooser «Hablemos» ya existente (2.19); secundaria «Ver proyectos» **solo cuando haya casos**; hasta entonces «Ver servicios». Un enlace de texto bajo los botones para el recruiter: «¿Selección de personal? Descarga mi CV» (evento `cv_download{from:home_hero}`). Es la micro-conversión más barata del sitio.
2. `ProofStrip` justo bajo el hero (§2): resuelve la pregunta «¿esto es real?» antes del primer scroll.
3. `ServicesStrip` como enrutador por situación (reutilizar `NeedTile` del hub, versión compacta), con la cifra de cada vía cuando sea real: «Para tu equipo → CV» · «Una tarea o un refuerzo → desde X €/h» · «Una web o app completa → desde Y €». El H2 con keyword: «Tres formas de trabajar conmigo».
4. `RecommenderTeaser`: una tarjeta con la primera pregunta del recomendador ya en pantalla («¿Qué quieres lanzar? Web · App · Las dos · No lo sé»); cada opción es un `<a>` a `/servicios/a-medida?q=…#recomendador` con el primer paso respondido. Empezar en la home reduce el coste del primer clic (efecto de compromiso). Evento `recommender_start{from:home}`.
5. `ProjectGrid` (3 destacados) cuando existan los casos.
6. `ChatInvite` con tres arranques por audiencia («¿Estás disponible para incorporarte a un equipo?» · «¿Qué nivel de app me conviene?» · «¿Cuánto costaría una tarea de…?»), solo cuando el chat responda de verdad; mientras, no se muestra.
7. `Closing` con `QuickContact` (copiar `hola@`).

**A/B (secuencial, ver §10):** lead corto vs. actual; `RecommenderTeaser` en posición 3 vs. 4.

## 4. Servicios hub `/es/servicios`

- **Valor:** el bento está bien planteado (situación del visitante en forma de pregunta). Falta prueba y falta la vía del recruiter completa (division-pantallas: el hub es la casa de contratación).
- `NeedTile` contratación: primaria **«Descargar CV»** (PDF directo, `download`), secundaria «Ver trayectoria» → `/sobre-mi`, terciaria «Preguntar disponibilidad a Nexo» (2.8: la disponibilidad la dice el asistente). Hoy la primaria lleva a un formulario: para un recruiter un formulario es fricción; quiere el PDF y un email.
- `NeedTile` freelance y a medida: añadir la cifra de «desde» en la tarjeta en cuanto sea real (anclaje y filtro: quien no tiene presupuesto se autodescarta y no ensucia el CRM).
- `ProofTile`: cambiar chips genéricos de stack por las pruebas (`ProofStrip` en versión tile). Un chip «React Native» no convence; «Apps de 3Cat en las tiendas» sí.
- `HowIWorkInTeams` (tres líneas con enlace: PR por bloque, CI en cada cambio, revisión; repo público) dentro de la zona de contratación: prueba para recruiter y CTO.
- `FaqWithNexo`: añadir las objeciones reales de cada audiencia: «¿Facturas como autónomo o puedo contratarte por consultora?» (recruiter/CTO), «¿Firmas NDA?», «¿Qué solape horario tienes?» (CTO con equipo fuera de España), «¿Qué pasa si no me gusta el resultado?» (pyme).

## 5. Freelance `/es/servicios/freelance` (CTO que necesita refuerzo)

**Mensaje:** el CTO compra reducción de riesgo y velocidad: «Me integro en tu repo y tu flujo esta semana; entregas por PR revisables». El H1 actual (keyword) se queda; el lead debe nombrar el resultado y el stack («React Native, Expo, Next.js, Supabase; trabajo en tu repo, con tus PR y tu CI»).

1. `RateFigure` (hecho): cifra real o, mientras tanto, **rango orientativo** («entre X y Y €/h según duración») en lugar de `00`. Añadir «mínimo por tarea» y «bloques de horas con descuento por volumen» solo si es política real.
2. `TaskExamples` (hoy son cuatro `Card` sin tamaño): añadir a cada una **tamaño y entregable** («Pantalla nueva con API · 1–2 días · PR con tests», «Auditoría de rendimiento · 1 día · informe priorizado», «Rescate · desde 1 semana · app estable en producción», «Integración de IA · 3–5 días»). Es lo que convierte «por hora» en presupuesto mental.
3. **`PilotTask`** (nuevo, risk reversal ético): «Empezamos con una tarea pequeña y cerrada; si no encajo con tu equipo, no seguimos y solo pagas esa tarea». Es verdad por construcción y baja la barrera del primer encargo. CTA a `/contacto?via=freelance&task=pilot`.
4. `IntegrationFacts` (nuevo, lista de 5 hechos): trabajo en tu repo y tus herramientas (GitHub/GitLab, Jira/Linear), NDA sí, horario y solape (dato de Jose), disponibilidad semanal en horas (`AvailabilityNote`), factura con IVA. Cada hecho responde a una objeción de compras.
5. `RelatedProjects`: 3Cat (React Native en equipo grande) y NextRaket.
6. `Closing`: primaria «Pedir propuesta» (hecho). Micro-conversión secundaria: «Enviar el enlace de tu repo o del ticket» como campo opcional del formulario con `via=freelance` (cualifica el lead y acelera la propuesta).

## 6. A medida `/es/servicios/a-medida` (dueño de pyme)

**Mensaje:** la pyme compra certeza: precio cerrado, fecha cerrada, «se publica de verdad», «no me quedo solo». El H1 ya lo dice; el lead debería añadir la garantía: «… y 30 días de garantía tras publicar».

**Presentación de precio:**
- **Hoy (antes de la ronda de precios):** sustituir `000 €` por una de dos opciones (decisión de Jose): (a) **rango orientativo por nivel** («Presencia: entre X y Y €») con «precio cerrado por escrito antes de empezar»; (b) sin cifra, con «Te paso el precio cerrado en 24–48 h» y el recomendador como camino. (a) convierte mejor y cualifica; (b) es honesta. `000` no es ninguna de las dos.
- **Después:** «desde» en el H3 de cada tarjeta (SEO y anclaje), precio sin IVA con nota, **pago por fases** (p. ej. 40/40/20) visible en la tarjeta, no solo en la FAQ: es la objeción de caja número uno de una pyme.
- Orden de las tarjetas de bajo a alto, con el nivel central marcado como **«Lo más habitual para negocios»** solo si refleja el razonamiento del recomendador, nunca «el más vendido» sin datos.
- Mostrar el coste total de propiedad: «Costes de terceros: Apple 99 $/año, Google 25 $, dominio ~X €/año» en una línea (evita la sorpresa que mata la confianza a mitad de proyecto).

**Componentes, en orden:**
1. `OfferCompare` (hecho) + bajo cada tarjeta `WhatINeedFromYou` en tres viñetas (textos, logo, cuentas de tienda): baja la ansiedad y evita bloqueos.
2. `OfferRecommender` + `OfferResult` (hechos). Añadir en el resultado:
   - **«Envíame este resumen por email»** (`SummaryByEmail`): campo email + consentimiento + Turnstile; crea un `lead` con `source = recommender`, `offer`, `extras`, `offer_answers` y envía el resumen con el enlace `?q=` para volver. Es la captura de email más legítima del sitio (el visitante recibe algo suyo, no una newsletter).
   - **«Copiar enlace a mi propuesta»** (estado ya en `?q=`): para reenviarla al socio o al gestor; el comprador de pyme rara vez decide solo.
   - Tarjeta secundaria **Prototipo** cuando aplique (R4 de `ofertas.md`, hoy no está en los niveles): oferta de entrada de bajo importe descontable del proyecto. Es el mejor *foot-in-the-door* para la pyme indecisa; pendiente de la pregunta 2 de `ofertas.md` §6.
3. `HowLong` (anillo coral por fases, T3) y `ProofStrip` con un caso «parecido» (NextRaket para web/producto; 3Cat para app).
4. `Warranty` (hecho): subirlo justo después del comparador: «30 días de garantía incluidos» es el argumento de cierre más fuerte de la página y hoy está abajo.
5. `FaqWithNexo` con objeciones de pyme: «¿Y si te pones malo o desapareces?» (código y cuentas a tu nombre desde el día 1: hecho verificable y diferenciador), «¿La app es mía?» (propiedad del código y de las cuentas), «¿Puedo pagar por fases?», «¿Qué pasa si quiero cambiar algo a mitad?» (6.8).
6. `Closing` (hecho).

## 7. Contacto `/es/contacto`

- **Problema actual:** cuatro canales con el mismo peso (chat que «abre muy pronto», tres emails, formulario). Para el visitante que llega con `?via=project&…` la primaria debe ser el formulario con su selección, no una lista de buzones.
- Con `?via` presente: formulario arriba con el chip «Tu selección» (hecho) y la vía preseleccionada; canales debajo. Sin `?via`: el selector de vía primero.
- `WhatHappensNext` (nuevo, tres pasos): «Lo leo yo, no un bot» · «Te respondo en 1–2 días laborables» (ya en la FAQ, subirlo aquí) · «Propuesta escrita o llamada de 20 min». Junto al botón Enviar, una línea: «Sin compromiso. No comparto tus datos».
- Campo por vía (P6): contratación → enlace a la oferta; freelance → para cuándo + repo/ticket opcional; a medida → «¿Tienes dominio / cuentas de tienda?» y **presupuesto aproximado** como opciones (< X · X–Y · > Y · No lo sé): el mejor dato de cualificación para el closer, opcional para no frenar.
- Chat: mientras no responda con IA, quitar la tarjeta «El chat abre muy pronto» (promesa incumplida en la página de cierre) o sustituirla por `FaqWithNexo` guionizado que ya existe.
- Estado de éxito: además de «Mensaje enviado», ofrecer el siguiente paso según la vía: recruiter → «Descarga mi CV»; pyme → «Mientras, mira un caso parecido»; CTO → «Cómo trabajo». Es la única página de gracias del funnel: no desperdiciarla.
- Cal.com (2.9) cuando haya datos: «Reserva 20 min» como alternativa para la pyme; es el canal que más convierte en servicios de ticket medio.

## 8. Proyectos, ficha, Sobre mí y Cómo trabajo

**Proyectos `/es/proyectos`.** No publicar «Pronto» indexable: `noindex` (ya previsto) y, mejor, una lista con lo que haya, aunque sean dos. `ProjectCard`: nombre, tipo, **estado honesto**, papel («en el equipo de 3Cat vía Alten»), una cifra pública con fuente, enlaces verificables (tienda, web, repo). `FilterTabs` solo con ≥ 2 por filtro.

**Ficha `/es/proyectos/[slug]`.** `ProjectHead` con el enlace a la tienda arriba; `CaseSection` ×3; `NeedSomethingLikeThis` al final con la vía según `relatedService` (3Cat → freelance/contratación; NextRaket → a medida). Primaria «Hablar de un proyecto así» con `?via` y `?from=<slug>` (atribución sin cookies).

**Sobre mí `/es/sobre-mi` (hoy 404).** Mínimo viable en el primer bloque: `PageHead` con retrato real y tres líneas, `CvDownload` (es/en, PDF con `download`, `noindex` en el PDF), `Timeline` con Alten/3Cat y NextRaket con fechas, `StackGroups` con «en producción en: 3Cat» en lugar de niveles, `LinkRow` (LinkedIn, GitHub con `rel="me"`). Primaria «Descargar CV». Para el recruiter, añadir una línea factual de modalidad («Madrid · remoto o híbrido») si Jose la publica (2.8 la deja a Nexo; propongo publicar modalidad y dejar a Nexo solo la disponibilidad de fecha).

**Cómo trabajo (2.20, en curso).** Pieza de autoridad para CTO y recruiter: cada principio con enlace a la prueba (PR, CI, test, decisión escrita). Cierre con dos CTAs secundarios por audiencia: «Descargar CV» y «Pedir propuesta freelance». Sin el método con agentes (2.11).

## 9. Funnel sin retargeting y analítica respetuosa

**Funnel por audiencia (sin píxeles ni cookies de terceros):**
- Recruiter: LinkedIn/búsqueda de marca → home o `/sobre-mi` → **CV** (conversión) → email `hola@` o Nexo. KPI: `cv_download` / visitas de sobre mí y hub.
- CTO: búsqueda «react native freelance» o LinkedIn → freelance → `TaskExamples` → contacto `via=freelance`. KPI: `contact_submit{via:freelance}`.
- Pyme: guía de precio (SEO/GEO) → a medida → recomendador → **resumen por email** (micro) → contacto con selección (macro). KPI: `recommender_result` → `summary_email` → `contact_submit{via:project}`.
- Volver sin retargeting: enlace `?q=` compartible, email de resumen con el enlace, guía descargable con enlace a la página, hilo de Nexo guardable con cuenta (P7), Cal.com.

**Herramienta (decisión de Jose, dependencia nueva para `revisor`):** Cloudflare Web Analytics (sin cookies, ya en Cloudflare) para páginas vistas, referrer y Web Vitals; y **eventos propios** por una ruta de servidor (`/api/e`, zod, límite de peticiones) a una tabla `private.events` (`name`, `props jsonb` con lista cerrada de claves, `path`, `via`, `ts`; **sin IP, sin user agent completo, sin ID persistente**; agregado diario y purga a 90 días). Sin banner de cookies (P9 se mantiene). Respeta `Sec-GPC`/DNT.

**Eventos (nombre · props):**
`cta_click{location, way}` · `cv_download{lang, from}` · `proof_click{target}` · `store_link_click{project, store}` · `offer_tab{platform}` · `recommender_start{from}` · `recommender_step{n}` · `recommender_abandon{n}` (al salir con paso < 6) · `recommender_result{offer, extras_n, assumed}` · `recommender_to_contact` · `summary_email` · `share_link_copy` · `nexo_open{page, starter}` · `nexo_handoff` · `faq_open{page, id}` · `contact_view{via}` · `contact_start{via}` (primer foco) · `contact_error{field}` · `contact_submit{via, has_selection}` · `email_copy{via}` · `mailto_click{via}` · `whatsapp_click` · `guide_download{guide}` · `not_found{path_group}`.

Cuadro mínimo en `/admin` (más adelante): tres embudos de arriba y la tasa `contact_start → contact_submit` (detecta fricción del formulario y de Turnstile).

## 10. Urgencia, escasez, imán de leads y pruebas A/B

**Urgencia y escasez éticas (solo con dato real, editable en `site_settings`):**
- `AvailabilityNote`: «Próximo hueco para proyecto completo: {mes}» y «Horas libres para freelance: {n} h/semana desde {fecha}», con «actualizado el {fecha}». Si no se actualiza en 30 días, se oculta solo. Nada de cuentas atrás, «quedan 2 plazas» inventadas ni precios tachados (regla de `valor-pantallas.md` P2).
- Validez del precio en la propuesta («precio válido 30 días») y en la página cuando haya precios reales: urgencia verdadera y estándar del sector.
- Prototipo descontable «si contratas en N días» (`discovery_credit_days`): incentivo real con fecha.

**Imanes de leads (sin muro obligatorio):**
1. **Guía «Cuánto cuesta una app en España en 2027»** (artículo 1 del plan editorial de `seo.md`): HTML indexable con rangos de mercado y la tabla de variables de `ofertas.md` §2.4; PDF descargable sin email; opción «envíamela con el resumen de mi caso» → recomendador. Alimenta SEO/GEO y la vía a medida.
2. **Checklist «Antes de pedir presupuesto de app»** (una página imprimible: objetivo, usuarios, pantallas, cuentas, pagos, tiendas, plazos). Al final: «¿Lo tienes? El recomendador lo convierte en precio en un minuto».
3. **Resumen del recomendador por email** (§6), el más valioso porque es personal.
4. Para CTO: «Plantilla de auditoría React Native» (lista de lo que revisa en una auditoría de 1 día) → CTA a la tarea «Auditoría».

**Pruebas A/B, con honestidad estadística.** Con tráfico de web personal (cientos de visitas/mes) un A/B clásico no alcanza significación en meses. Propuesta: pruebas **secuenciales** de 4 semanas por variante sobre eventos de §9, cambios grandes (no colores), y decisión por umbral fijado antes. Candidatas, por impacto esperado:
1. A medida: rango orientativo vs. «precio cerrado en 24 h» (métrica `recommender_to_contact` y `contact_submit{via:project}`).
2. `OfferResult`: «Pedir esta propuesta» como primaria vs. «Envíame el resumen» como primaria (micro vs. macro).
3. Home: `RecommenderTeaser` presente vs. ausente (métrica `recommender_start`).
4. Hub: tarjeta de contratación con «Descargar CV» vs. «Contactar» (métrica `cv_download` + `contact_submit{via:hiring}`).
5. Contacto: campo «presupuesto aproximado» opcional vs. ausente (métrica `contact_start → submit` y calidad del lead en CRM).
6. Freelance: `PilotTask` arriba (tras `RateFigure`) vs. abajo.

## 11. Datos que necesito de Jose (bloquean lo de arriba)

- CV en PDF es/en; retrato real; fechas y papel en Alten/3Cat (y qué permite decir el NDA); qué es NextRaket, enlace y si el cliente acepta ser nombrado o citado.
- Rango orientativo o tarifa real (o elegir la opción «precio en 24 h») para quitar `000`.
- Política real de pago por fases, NDA, solape horario, horas libres por semana y próximo hueco de proyecto.
- OK a la dependencia de analítica (Cloudflare Web Analytics + tabla `private.events`, migración con su OK) y al Prototipo como nivel de entrada (`ofertas.md` §6, pregunta 2).
- Textos marcados para `redactor` en el Mac: lead corto del hero, `ProofStrip`, `WhatHappensNext`, `PilotTask`, `IntegrationFacts`, FAQ de objeciones y la guía.
