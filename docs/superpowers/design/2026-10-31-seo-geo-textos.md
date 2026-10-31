# SEO + GEO de los textos de josecoded.com (análisis y plan por página)

**Fecha:** 2026-10-31 · **Perfil:** web · **Autor:** `arquitecto` · **Estado:** v1.0, propuesta para Jose (decisiones en §7)
**Encargo de Jose:** «Para los textos hay que hacer un análisis SEO y GEO, y también para los modelos de IA, para obtener los mejores resultados en los buscadores.»
**Fuentes:** spec v2.1 (§0, §8, §10, Q5), PANT v2.0 (P20–P23, P3, P6–P11), `ref/home-v7/README.md` (§10–§17), `apps/web/messages/{es,en}/*.json`, `PRODUCT.md`, `DESIGN.md`, DT v1.4 (§1.4, §1.5, §1.6), plan v3.2 (2.1, 2.7–2.9, 2.11, 3.1–3.6, 3.10, 4.2, 4.5, 9.1, 9.2, 9.4–9.6), `packages/pricing/pricing.json`, `apps/web/lib/seo/page-metadata.ts`, `apps/web/lib/content/sections.ts`, `apps/web/i18n/pathnames.ts`.
**Qué es este documento:** la bajada a tierra de la spec §8 («SEO tradicional + GEO, requisito de primer nivel») por página y por texto. No cambia decisiones de la spec salvo las tres que se marcan como **desvío** (§3.1, §3.6, §5.3). Los textos propuestos van marcados `[redactor]`: los fija `redactor` con `voz.md` en el Mac y los valida Jose; aquí sirven para que las tareas tengan un texto de trabajo con la intención de búsqueda ya resuelta.

> **Datos que no he podido obtener en esta sesión (nube):**
> 1. **Semrush**: la cuenta tiene suscripción activa pero **sin unidades de API** (`no_api_units`, trace `1929e6956c258806e62b23daff5eac0a`; página para ampliar: https://www.semrush.com/mcp-access). Por tanto **ningún volumen de este documento es un dato**: las columnas «demanda» son estimaciones cualitativas (alta / media / baja / navegacional) a partir de la intención y de la competencia observable, marcadas `est.`. La spec §8 exige validar las palabras clave con Semrush antes de escribir copy: queda como acción A2 (§6) para el Mac, cuando haya unidades o con Google Keyword Planner.
> 2. **Google Search Central** (`developers.google.com`) no resuelve desde esta sesión (fuera de los dominios permitidos). Las afirmaciones sobre la postura de Google salen de resúmenes de búsqueda del 2026-10-31 (fuentes en §4.1) y hay que confirmarlas en el Mac leyendo «AI features and your website» y la galería de resultados enriquecidos.

---

## 0. Enfoque: tres aproximaciones y la elegida

| | Aproximación | Qué implica | Por qué no / por qué sí |
|---|---|---|---|
| A | **SEO clásico por palabra clave**: una página por servicio × ciudad («diseño web en Madrid», «programador freelance en Valencia»…), blog de artículos cortos por keyword | 20–40 URLs plantilla, textos casi iguales | **Descartada.** Contradice Q5 de la spec (sin páginas por ciudad), huele a plantilla (lo que Jose rechaza, memoria del proyecto) y es exactamente el contenido que los modelos de IA y Google ya no citan |
| B | **Entidad + páginas de intención** (elegida): pocas URLs, cada una dueña de **una** intención; una entidad `Person` coherente en toda la web y fuera de ella; cada página abre con un párrafo citable y cierra con FAQ reales; precios en HTML; guías largas como fuente de citas | Trabajo de copy y datos estructurados sobre las páginas que ya existen en el plan; ninguna URL nueva | **Elegida.** Encaja con la spec (§8 ya la describe), con la home como muestra (D48) y con cómo citan hoy ChatGPT/Perplexity/AI Overviews: hechos autocontenidos, fechados y atribuibles a una persona identificable |
| C | **Solo GEO/contenido**: no tocar on-page, apostar todo a blog + `/lab` + `llms.txt` | Mínimo esfuerzo en las páginas comerciales | **Descartada.** Las páginas que convierten (`/servicios`, `/partners`) necesitan título, H1 y párrafo citable propios; `llms.txt` por sí solo no tiene efecto demostrado (§4.1) |

Regla de oro derivada de B: **una intención por URL, una entidad en todo el sitio, un dato por sitio** (precios solo de `pricing.json`, nombre solo de `facts.*`, fechas solo del contenido).

---

## 1. Consultas objetivo por página e intención

Columnas: **es** / **en** (consulta tipo), intención (I = informacional, C = comercial, T = transaccional, N = navegacional), persona (spec §0.3), **demanda `est.`** (sin Semrush; ver aviso), notas de competencia. Las consultas inglesas se piensan para `us`/`uk` + «spain» o «remote», porque el inglés sirve a agencias europeas y reclutadores, no al mercado local.

### 1.1 Home `/` y `/en`

| es | en | Int. | Persona | Demanda `est.` | Notas |
|---|---|---|---|---|---|
| `josecoded`, `jose coded` | — | N | todas | navegacional | La marca debe ganar su propia SERP: `WebSite.name`, `Organization.name`, título con sufijo `· josecoded` |
| `{{DATO: nombre}} desarrollador`, `{{DATO: nombre}} freelance` | `{{DATO: name}} developer` | N | Pablo, Nuria | navegacional | Pablo busca el nombre tras ver el CV o LinkedIn: `Person` + `ProfilePage` + nombre idéntico al de LinkedIn (§4.2) |
| `desarrollador freelance`, `programador freelance`, `desarrollador full stack freelance` | `freelance full-stack developer spain` | C | Dani, Marta | media–alta, muy competida (directorios, Malt, Workana) | No se gana en genérico; se gana en la versión con tecnología o con precio. La home la sostiene como paraguas |
| `desarrollador react native freelance`, `desarrollador next.js freelance`, `freelance react native españa` | `freelance react native developer spain`, `next.js freelance developer europe` | C | Dani, Nuria | baja–media, poco competida | **Intención principal del sitio.** Pocas páginas en español la trabajan con casos reales y precio |

### 1.2 `/servicios` · `/en/services` (una intención por vía, anclas estables)

| Vía / ancla | es | en | Int. | Persona | Demanda `est.` | Notas |
|---|---|---|---|---|---|---|
| (a) `#por-hora` | `programador freelance por horas`, `tarifa programador freelance`, `precio hora desarrollador freelance`, `contratar programador freelance` | `freelance developer hourly rate spain`, `hire freelance developer spain` | C | Dani | media | Las SERP las llenan artículos «cuánto cobra un freelance»; una página que publica **40 €/h sin IVA** en texto gana la cita en IA |
| (b) `#proyecto` | `presupuesto desarrollo web cerrado`, `desarrollar una funcionalidad web precio`, `programador freelance presupuesto cerrado` | `fixed-price web feature development` | C/T | Dani, Marta | baja | Poco buscada pero muy convertible; el generador `/propuesta` es la acción |
| (c) `#packs` | `cuánto cuesta una página web`, `precio página web`, `web para mi negocio precio`, `página web con reservas precio`, `cuánto cuesta una app`, `precio app móvil`, `crear app para mi negocio` | `how much does a website cost spain`, `mobile app development cost freelance` | C/I | Marta | **alta**, muy competida (agencias, comparadores) | Es la única consulta de volumen alto del sitio. Se compite con **precios reales en una tabla HTML** (la mayoría de agencias no los publica) y con la FAQ. No se persigue el ranking genérico: se persigue la cita en AI Overviews/ChatGPT para «cuánto cuesta…» |
| (d) `#contratacion` | `desarrollador react native remoto`, `full stack developer remoto españa` | `react native developer remote spain cv` | N/C | Pablo | baja | El canal real es LinkedIn; la página existe para el reclutador que llega con el nombre. Sin salario (D47) |

### 1.3 `/partners` · `/en/partners`

| es | en | Int. | Persona | Demanda `est.` | Notas |
|---|---|---|---|---|---|
| `subcontratar desarrollador react native`, `desarrollador freelance para agencias`, `agencia subcontratar desarrollo web`, `desarrollo web marca blanca freelance`, `freelance react native para agencias` | `white-label react native developer for agencies`, `freelance developer for agencies spain`, `outsource next.js developer europe` | C | Nuria | baja, casi sin competencia en español | El canal es saliente (mensajes a agencias), pero la página debe **confirmar** lo que el mensaje promete cuando Nuria la busca o la pasa a su socia. La tarea 3.3 ya fija el objetivo «desarrollador react native freelance para agencias» |

### 1.4 `/proyectos`, `/proyectos/[slug]`

| es | en | Int. | Persona | Demanda `est.` | Notas |
|---|---|---|---|---|---|
| `hazmefila`, `hazmefila app`, `oportunix`, `oportunix app`, `3catinfo app` | mismas | N | Dani, Nuria, usuarios de las apps | navegacional | Cada caso es la **página de marca** de su app: `SoftwareApplication` con enlace a stores; el nombre en `title` y H1. Sin métricas (spec) |
| `{{DATO: qué hace la app}}` (p. ej. «app para gestionar colas», «app de ofertas de empleo») | `{{DATO}}` | I/C | — | depende del DATO | Solo cuando Jose aporte el `oneLiner`; se escribe el `title` del caso con esa función |

### 1.5 `/sobre-mi` · `/en/about`

Consultas por nombre (N) y «quién es josecoded» (N). Es la **página de autor** de todo el sitio (§4.4): la buscan Pablo y los modelos de IA cuando quieren atribuir una guía.

### 1.6 `/blog`, `/blog/[slug]`, `/lab`, `/lab/[slug]` (la fuente de citas)

Las guías no se eligen por volumen sino por **hueco citable**: preguntas técnicas concretas que hoy responden foros o documentación oficial incompleta y que Jose puede responder con código probado en producción. Candidatas coherentes con el stack y con las demos del `/lab` (spec §0.7):

| Guía (es, título de trabajo) | Consulta tipo es | en | Hueco |
|---|---|---|---|
| Next.js 16 en Cloudflare Workers con OpenNext, sin middleware Node | `next.js cloudflare workers opennext`, `next-intl sin middleware` | `next.js 16 cloudflare workers opennext i18n without middleware` | Casi nada en español; en inglés, issues de GitHub sin síntesis |
| Paginado por gesto con `scroll-snap` y `animation-timeline` (demo del lab) | `animation-timeline scroll css ejemplo`, `scroll-driven animations` | `css scroll-driven animations paging example` | Documentación oficial sin caso completo |
| View Transitions en una app Next.js con fallback | `view transitions next.js` | `view transitions api next.js app router fallback` | Mucho ruido, poco con fallbacks reales (Baseline 2024) |
| React Native/Expo: accesibilidad real (foco, lectores, reduced motion) | `accesibilidad react native expo`, `react native lector de pantalla` | `react native accessibility screen reader expo guide` | Poquísimo en español |
| IA en producto con guarda determinista (precios, URLs, idioma) sobre Workers AI | `integrar ia en una app guardrails`, `workers ai guardrails` | `llm output guardrails deterministic validation workers ai` | Hueco real; coincide con lo que la web hace (D40) |
| Precio por reglas: generador de propuesta sin IA (demo del lab) | `calcular presupuesto web automático` | `rule-based pricing calculator web development` | Convierte además para Marta |

Regla D33/D44: tres guías reales o el blog no se publica; dos demos o el lab no se publica.

### 1.7 Consultas de IA (protocolo de verificación, spec §8)

Diez preguntas fijas, cinco por idioma, que se lanzan a ChatGPT, Perplexity, Claude y Google AI Overviews/AI Mode al lanzar (línea base, gate 9.6) y cada mes. Se registra si citan josecoded.com y con qué frase.

| # | es | en |
|---|---|---|
| 1 | ¿Quién es {{DATO: nombre}} (josecoded)? | Who is {{DATO: name}} (josecoded)? |
| 2 | Desarrollador freelance React Native y Next.js en {{DATO: ciudad}} o remoto, España | Freelance React Native and Next.js developer in Spain, remote |
| 3 | ¿Cuánto cuesta una web para un negocio con reservas en España? | How much does a business website with bookings cost in Spain? |
| 4 | ¿Cuánto cobra por hora un desarrollador freelance full-stack en España? | Hourly rate of a freelance full-stack developer in Spain |
| 5 | Desarrollador externo para agencias, marca blanca, React Native | White-label React Native developer for agencies |
| 6–10 | Una por guía publicada (la pregunta que la guía responde) | Idem |

---

## 2. Recomendaciones on-page por página

### 2.0 Reglas comunes (afectan a `pageMetadata` y a `messages/*`)

1. **Longitud real del `title`.** `pageMetadata` lanza error por encima de 60 caracteres, pero el `layout` añade la plantilla `%s · josecoded` (12 caracteres). Para que el título renderizado no pase de ~60, **el título que recibe `pageMetadata` debe ser ≤ 48**. Acción: bajar `MAX_TITLE` a 48 en `lib/seo/page-metadata.ts` (o medir el título final), con test (tarea 2.11).
2. **Metadescripción ≤ 155** con el dato (precio, tecnología, ciudad) en la primera mitad. Jose no quiere frases vacías: cada descripción dice qué, para quién y cuánto.
3. **Un `h1` por página; H2 con la pregunta o el dato**, no con nombres de sección («Preguntas» → «¿Cuánto tarda una web básica?»). El H2 es lo que los modelos citan como encabezado del hecho.
4. **Párrafo citable** (spec §8): 2–3 frases autocontenidas al abrir cada página comercial y cada caso, con quién, qué, para quién, dónde y cuánto. Mismo texto en la web, en `llms.txt` y (primera frase) en LinkedIn/Malt. Se renderiza como `<p>` normal bajo el H1, sin componente especial: lo citable es el texto, no la caja.
5. **Lista negra de la tarea 3.5** sigue vigente para todo texto: `soluciones`, `ayudo a`, `sin complicaciones`, `alto rendimiento`, `profesional`, `innovador`. Se añade a `i18n:check` o al `lint` de microcopy: `escalable`, `a medida` (sin sustantivo), `líder`, `experto`, `pasión`.
6. **Los precios siempre como texto HTML**: «Desde 900 €» y «sin IVA» en el mismo bloque, nunca solo en imagen, canvas o `aria-label`. El `PackCompare` es una `<table>` real con `<caption>`; en móvil se muestra una columna por vista pero la tabla completa sigue en el DOM (ya lo pide 3.2: «nunca tabla con scroll», aquí se añade «nunca sin tabla»).
7. **Textos con `{{DATO}}` no se publican** (regla ya implementada en `lib/content/dato.ts`); además, **ningún `title`/`description` puede contener `{{DATO`**: test en `pageMetadata` (2.11).
8. **Enlazado interno**: `/servicios` es el hub comercial (recibe de home, cierre corto de todas las páginas, guías, casos); `/sobre-mi` es el hub de autoridad (recibe de cada guía como autor, de `/servicios#contratacion`, de `/partners`); las anclas de `/servicios` son estables y se enlazan con texto descriptivo («packs de web y app desde 900 €», no «aquí»). Todo enlace saliente a stores, GitHub y LinkedIn con `rel="me"` en los perfiles propios (refuerza la entidad, §4.2).

### 2.1 Home `/`

| Elemento | Propuesta | Nota |
|---|---|---|
| `title` es | `Desarrollador freelance: web, móvil e IA` (41) → renderizado `Desarrollador freelance: web, móvil e IA · josecoded` | El nombre no cabe con el sufijo; lo lleva el H1 (ya es el nombre), `Person` y `/sobre-mi` |
| `title` en | `Freelance developer: web, mobile and AI` (39) | |
| `description` es `[redactor]` | «Hago webs con Next.js, apps con React Native e IA integrada, como freelance. Por horas, encargo a precio fijo o packs desde 900 € sin IVA. También trabajo con agencias.» (~160: `redactor` recorta a 155) | Precio y tecnologías en la primera mitad |
| `description` en `[redactor]` | “Freelance developer in Spain: Next.js websites, React Native apps and integrated AI. Hourly, fixed-price or packs from €900 excl. VAT. I also work with agencies.” | |
| `h1` | El nombre (hero, ya así) | Correcto: la home posiciona la entidad |
| `hero.subtitle` `{{DATO}}` `[redactor]` | Opción 1: «Hago webs, apps y asistentes con IA de principio a fin, y hablas conmigo en cada paso.» · Opción 2: «Desarrollador freelance: diseño, construyo y entrego webs, apps móviles e IA.» | Una frase, sin audiencias (spec §0.8). La opción 2 lleva la palabra clave; la 1 la voz. `redactor` decide |
| `scenes.about.about.lead` `{{DATO}}` `[redactor]` | «Soy {givenNames}, desarrollador full-stack freelance en {{ciudad}}. Trabajo con TypeScript, Next.js, React Native y Supabase, y entrego yo lo que diseño.» | Primera mención de ciudad y stack en la home |
| `scenes.services.title` `{{DATO}}` `[redactor]` | lead «Cuatro formas de trabajar conmigo.» · accent «Por horas, por encargo, con packs o en tu equipo.» | El H2 de la escena nombra las vías |
| `scenes.services.vias.*.lead` `{{DATO}}` `[redactor]` | hourly «Refuerzo tu equipo a 40 €/h, con parte de horas semanal.» · fixed «Una funcionalidad con alcance, precio y plazo cerrados, desde 150 €.» · packs «Web o app con precio cerrado, desde 900 €, con dominio y cuentas a tu nombre.» · hiring «Plantilla o externo de larga duración, remoto o en {{ciudad}}. CV en PDF.» | Las cifras salen de `{price}` (ICU), no del texto |
| `scenes.services.vias.summary` `{{DATO}}` `[redactor]` | «Elige cómo prefieres trabajar: por horas dentro de tu equipo, un encargo cerrado, un pack de web o app, o incorporarme a tu plantilla. Precios sin IVA y publicados.» | |
| `scenes.labBlog.title` `{{DATO}}` `[redactor]` | lead «Lo que pruebo, explicado.» · accent «Demos vivas y guías largas.» | |
| `scenes.labBlog.lab.summary` `{{DATO}}` `[redactor]` | «Pequeñas demos de motion, herramientas e IA, con su código y su explicación.» | |
| `scenes.projects.items.*.lead` | No se proponen: dependen de hechos (`{{DATO: qué hace}}`). Patrón: «[Qué hace] para [quién], en [plataforma].» | |
| Enlazado | Cada celda ya enlaza a su pantalla (D48). Añadir en el pie el enlace a `/blog` y `/lab` solo cuando existan (ya lo hace `sections.ts`) | |

### 2.2 `/servicios` · `/en/services` (P20)

| Elemento | Propuesta |
|---|---|
| `title` es | `Servicios y precios: por horas, encargo y packs` (47) |
| `title` en | `Services and pricing: hourly, fixed-price, packs` (48) |
| `description` es `[redactor]` | «Cuatro formas de trabajar conmigo: 40 €/h, encargo a precio fijo desde 150 €, packs de web y app desde 900 € y contratación. Precios sin IVA, publicados.» (153) |
| `description` en `[redactor]` | “Four ways to work with me: €40/h, fixed-price work from €150, website and app packs from €900, or hiring me. Prices published, VAT excluded.” |
| `h1` `[redactor]` | PANT: «Trabajo como freelance. Web, móvil e IA, de la forma que te encaje.» Alternativa con la palabra clave: lead «Desarrollador freelance, cuatro formas de trabajar.» · accent «Por horas, por encargo, con packs o en tu equipo.» |
| Párrafo citable `[redactor]` | «Soy {givenNames} {surnames}, desarrollador full-stack freelance en {{ciudad}}, España. Hago webs con Next.js, apps con React Native y Expo e integraciones de IA. Se me puede contratar por horas (40 €/h), por encargo a precio fijo (desde 150 €), con packs de web y app (desde 900 €) o en plantilla. Precios sin IVA.» Las cifras se interpolan desde `pricing` |
| H2 por vía (es) | «Por horas: 40 €/h dentro de tu equipo» · «Encargo a precio fijo, desde 150 €» · «Packs de web y app, desde 900 €» · «Abierto a empleo: plantilla o externo de larga duración» |
| H2 por vía (en) | “Hourly: €40/h inside your team” · “Fixed-price work, from €150” · “Website and app packs, from €900” · “Open to hiring: in-house or long-term contractor” |
| H2 comunes | «Cómo trabajo» (ProcessSteps) · «Proyectos en uso» · «Preguntas sobre cada forma de trabajar» |
| Tabla de packs | `<table>` con `<caption>` «Cinco packs, precios desde, sin IVA»; filas: pack, qué incluye (lenguaje llano), plazo, desde X €. P5 con fila de opción «ampliada desde 6.000 €». Texto bajo la tabla: «Dominio, hosting y cuentas de las stores a tu nombre.» |
| FAQ (una `FAQPage`; preguntas cerradas aquí, respuestas `{{DATO}}` de Jose) | (a) ¿Cómo se facturan las horas? ¿Hay mínimo? ¿Trabajas en mi repo y con mis herramientas? · (b) ¿Qué es una «feature cerrada»? ¿Qué pasa si el alcance cambia? ¿Cuánto tarda una propuesta? · (c) ¿Cuánto tarda una web básica? ¿Qué necesito darte para empezar? ¿El dominio y el hosting son míos? ¿Qué pasa cuando quiero ampliar? ¿Cuánto cuesta una app móvil? · (d) ¿Remoto o presencial? ¿Qué tipo de contrato? ¿Desde cuándo podrías empezar? (solo si Jose quiere publicarlo; si no, remite al chat `recruiter`) · general: ¿Y si no sé qué vía es la mía? ¿Firmas NDA? |
| Enlazado | Cada vía → su acción; (c) → `/propuesta?pack=Px`; (d) → `/sobre-mi#stack` y CV; cabecera → `/partners` («¿Eres una agencia?»); «Proyectos en uso» → tres casos |

### 2.3 `/partners` · `/en/partners` (P21)

| Elemento | Propuesta |
|---|---|
| `title` es | `Para agencias: desarrollo externo en marca blanca` (48) |
| `title` en | `For agencies: white-label React Native and Next.js` (50 → `redactor` recorta: “For agencies: white-label RN and Next.js” es peor; preferible “White-label developer for agencies” (35)) |
| `description` es `[redactor]` | «Subcontrata un desarrollador React Native, Next.js e IA que encaja en tu proceso: tu repo, tus herramientas, marca blanca y NDA. Por horas o feature cerrada. Estimación en 48 h.» (~170: recortar «e IA») |
| `description` en `[redactor]` | “Subcontract a React Native, Next.js and AI developer who fits your process: your repo, your tools, white label and NDA. Hourly or fixed-scope. Estimate in 48 h.” |
| `h1` | PANT: «Para agencias y consultoras. Un desarrollador externo que encaja en tu proceso.» (correcto; lleva «agencias» y «desarrollador externo») |
| Párrafo citable `[redactor]` | «Trabajo como desarrollador externo para agencias y consultoras que subcontratan React Native, Next.js o IA. En marca blanca, en vuestro repositorio y con vuestras herramientas, por horas o por feature cerrada, desde {{ciudad}} o en remoto. Firmo vuestro NDA.» |
| H2 | «Qué hago para agencias» · «Cómo encajo en vuestro proceso» · «Cuándo encajo y cuándo no» · «Tarifa y disponibilidad» (sin precio, Q16) · «Casos propios» · «Preguntas de agencias» |
| FAQ (`FAQPage`) | PANT bloque 7: ¿Facturas como autónomo? ¿Firmas NDA? ¿Trabajas en nuestro repo? ¿Marca blanca? ¿Disponibilidad? ¿Qué pasa si el proyecto crece? + «¿Podéis presentarme como parte de vuestro equipo?» |
| Enlazado | Pie «Para agencias», menú ☰, ⌘K, cabecera de la escena Servicios, casos propios («¿Eres agencia?»). **No** en la barra principal (PANT). Enlace de vuelta a `/servicios#por-hora` solo en la FAQ |

### 2.4 `/proyectos` y `/proyectos/[slug]` (P7, P8)

| Elemento | Propuesta |
|---|---|
| Índice `title` es/en | `Proyectos: apps y webs en uso` (28) · `Projects: apps and websites in use` (33) |
| Índice `description` `[redactor]` | «Apps y webs que he construido y están en uso: HazmeFila, Oportunix, webs de comercios y josecoded.com. Con enlace a la store, a la web o al código.» |
| Caso `title` (patrón) | `{name}: {qué es en 3–5 palabras}` ≤ 48, p. ej. «HazmeFila: app para {{DATO}}», «josecoded.com: cómo está hecha esta web» |
| Caso `description` | `oneLiner` + reto en una frase (≤ 155), desde `content/projects/*.json` |
| Caso H1/H2 | H1 nombre; H2 «El reto» · «Qué hice» · «Resultado» (sin métricas) · «Stack» (si no `hideStack`) |
| Párrafo citable | «{name} es una {app|web} para {{DATO}} que construí {{año}} con {stack}. Está publicada en {stores|web}.» |
| Enlazado | PANT: «Hablar de un proyecto así» → `/contacto?via=client`; casos propios → `/partners`; `PrevNext` entre casos; migas (`BreadcrumbList`) |

### 2.5 `/sobre-mi` · `/en/about` (P6, página de autor)

| Elemento | Propuesta |
|---|---|
| `title` es/en | `Sobre mí: {givenNames} {surnames}, freelance` (≤ 48 si el nombre ≤ 25) · `About: {name}, freelance developer` |
| `description` `[redactor]` | «Desarrollador full-stack freelance en {{ciudad}}. TypeScript, Next.js, React Native y Expo, Supabase, Cloudflare Workers e IA. Trayectoria, formación y CV en PDF.» (≤ 155) |
| `h1` | El nombre + «Desarrollador full-stack freelance · {{ciudad}}» como subtítulo (`AboutSummary`) |
| H2 | «Quién soy» (historia) · «Trayectoria» · «Cómo trabajo» (principios) · «Stack y formación» (`#stack`) · «CV y perfiles» |
| Párrafo citable `[redactor]` | Mismo que `/servicios` sin los precios; con «desde {{año}} como freelance» |
| Perfiles | `LinkRow` con `rel="me"`: LinkedIn, GitHub, Malt y los demás del kit de perfiles que Jose quiera hacer públicos (§4.2) |

### 2.6 `/blog`, `/blog/[slug]` (P9, P10)

| Elemento | Propuesta |
|---|---|
| Índice `title` es/en | `Blog: guías de Next.js, React Native e IA` (40) · `Blog: Next.js, React Native and AI guides` (41) |
| Guía `title` (patrón) | «[Qué] con [tecnología]: [resultado]», ≤ 48, p. ej. «Next.js 16 en Cloudflare Workers con OpenNext» |
| Guía `description` | La respuesta en una frase + «con código» (≤ 155) |
| Estructura de guía | H1 = título · **bloque «En resumen»** (3–5 viñetas con la respuesta: es lo que citan los modelos) · H2 como preguntas · código · «Preguntas» (3–5, `FAQPage`) · «Probar la demo →» si `labSlug` · autor con enlace a `/sobre-mi` y **«Publicado el» / «Actualizado el»** reales · «Avísame de nuevas guías» |
| Idioma | Una guía puede existir en un solo idioma (D33): `hasTranslation:false` → sin `alternates` (ya en `pageMetadata`); etiqueta «Solo en inglés» / “Only in Spanish” |

### 2.7 `/lab`, `/lab/[slug]` (P22, P23)

| Elemento | Propuesta |
|---|---|
| Índice `title` es/en | `Lab: demos y herramientas pequeñas` (34) · `Lab: small demos and tools` (26) |
| Ficha `title` (patrón) | «{nombre de la demo}: demo en {CSS|TypeScript}», ≤ 48 |
| Ficha H2 | «Qué muestra» · «Cómo está hecho» · «Léelo largo» · «Relacionadas» |
| Estado sin JS | El SSR estático ya está en el plan (4.5); es también lo que indexan los rastreadores que no ejecutan JS (la mayoría de bots de IA) |

### 2.8 Resto

| Página | Indexar | `title` propuesto | Nota |
|---|---|---|---|
| `/contacto` | sí | `Contacto: WhatsApp, llamada de 20 min o email` (45) | Un párrafo con las cuatro vías; `ContactPage` opcional |
| `/propuesta` | sí | `Propuesta orientativa: precio y plazo de tu web o app` (52 → recortar «orientativa») | Párrafo de apertura que explique qué devuelve el generador; sin él es una página fina |
| `/chat` | **no** (`robots: noindex, follow`) | — | Sin contenido propio; evita una página fina y los `?case=` duplicados |
| `/legal/*` | sí, sin esfuerzo | «Aviso legal», «Privacidad», «Cookies» | El aviso legal con titular, NIF y domicilio (`{{DATO}}`) es señal de entidad real (E-E-A-T) |
| `/auth/*`, `/perfil`, `/area-clientes/*`, `/admin/*`, `/dev/ui` | **no** + `Disallow` en `robots.txt` | — | `/dev/ui` ya lleva `noindex`; el resto en 2.11 y 4.1 |

---

## 3. Plan de datos estructurados (alineado con la tarea 2.11)

Un **grafo JSON-LD con `@id` estables** (`https://josecoded.com/#person`, `#organization`, `#website`) emitido en el `layout` y referenciado desde cada página, en vez de nodos repetidos. `apps/web/lib/seo/jsonld.ts` expone una función por tipo y `components/seo/json-ld.tsx` las serializa (como ya prevé 2.11). Idioma: `inLanguage` por página; los nodos del `layout` son los mismos en es y en, con `name`/`description` en el idioma de la página.

| Nodo | Dónde | Campos clave | Fuente del dato |
|---|---|---|---|
| `Person` `#person` | layout | `name` (forma canónica, §7 Q2), `alternateName: "josecoded"`, `url`, `image` (foto), `jobTitle` («Desarrollador full-stack freelance» / “Freelance full-stack developer”), `description` (párrafo citable, 1 frase), `knowsAbout` (TypeScript, Next.js, React Native, Expo, Supabase, Cloudflare Workers, accesibilidad web, integración de IA), `knowsLanguage: ["es","en"]`, `address: { addressCountry: "ES", addressLocality: {{ciudad}} }` (solo si Q1 se aprueba), `email: "mailto:freelance@josecoded.com"` (cuando Q18), `sameAs` (§4.2), `worksFor: #organization` | `facts.*`, `content/` |
| `Organization` `#organization` | layout | `name: "josecoded"`, `url`, `logo`, `founder: #person`, `areaServed: "ES"` (+ `"Remote"` como texto no es válido: usar `areaServed: ["ES"]` y en texto «remoto»), `sameAs` (GitHub org si existe) | — |
| **Desvío 1:** `WebSite` `#website` **sin `SearchAction`** | layout | `name`, `url`, `inLanguage`, `publisher: #organization` | La tarea 2.11 pide `potentialAction: SearchAction`; no hay página de resultados (`⌘K` es cliente) y Google retiró la caja de búsqueda de sitelinks en noviembre de 2024. Un `SearchAction` sin URL que responda es una promesa falsa. **Quitar y ajustar el test** |
| `ProfilePage` | `/sobre-mi` | `mainEntity: #person`, `dateModified` | 3.5 |
| `Service` ×4 + `Offer` | `/servicios` | Un `Service` por vía con `provider: #person`, `areaServed: "ES"`, `serviceType`, `url` con ancla. (a) `offers.priceSpecification: UnitPriceSpecification { price: 40, priceCurrency: "EUR", unitCode: "HUR", valueAddedTaxIncluded: false }`; (b) `PriceSpecification { minPrice: 150, … }`; (c) `hasOfferCatalog: OfferCatalog` con cinco `Offer` (`itemOffered: Service { name: P1 Web básica }`, `priceSpecification { minPrice, priceCurrency: "EUR", valueAddedTaxIncluded: false }`, `url: /servicios?pack=Px#packs`) y P5 con un sexto `Offer` «ampliada» `minPrice: 6000`; (d) sin `Offer` | `pricing.json` (test: cada `minPrice` coincide con `pricing`, ya en 2.11/3.2) |
| `FAQPage` | `/servicios`, `/partners`, cada guía | Solo con respuestas reales (sin `{{DATO}}`); texto idéntico al visible | 3.1 `content/faq` |
| `Service` + `audience` | `/partners` | `audience: { "@type": "BusinessAudience", audienceType: "agencias y consultoras de desarrollo" }`, sin `Offer` (Q16) | 3.3 |
| `SoftwareApplication` | `/proyectos/[slug]` de apps | `name`, `operatingSystem: "iOS, Android"`, `applicationCategory` (`{{DATO}}` por app), `url` a stores (`installUrl`), `author: #person`; **sin `aggregateRating`, `offers` ni descargas** (spec: sin métricas) | `stores.json` (3.1) |
| `WebSite`/`CreativeWork` | casos de webs (comercios, josecoded.com) | `name`, `url`, `author: #person`; josecoded.com como `WebSite` con `about` | 3.4 |
| `BreadcrumbList` | todas las interiores con profundidad ≥ 2 (casos, guías, demos, legales) | Inicio › Proyectos › {name} | Helper `breadcrumbJsonLd(items)` en 2.11, consumido en 3.4, 4.2, 4.5 |
| `["BlogPosting","TechArticle"]` | `/blog/[slug]` | `headline`, `description`, `datePublished`, `dateModified` (reales, §4.5), `author: #person` (con `url` a `/sobre-mi`), `publisher: #organization`, `image` (OG), `inLanguage`, `proficiencyLevel: "Expert"|"Beginner"`, `about`, `isPartOf: { "@type": "Blog" }`, `mainEntityOfPage` | 4.2 (multi-tipo es válido en JSON-LD de schema.org) |
| `TechArticle` + `SoftwareSourceCode` | `/lab/[slug]` | `SoftwareSourceCode { name, programmingLanguage: "TypeScript", runtimePlatform: "Web", codeRepository (solo si público), author }` | 4.5 |
| **Desvío 2:** `SoftwareApplication` **solo para demos que son herramientas** | `/lab/[slug]` con `tags` incluye `tools` | `applicationCategory: "DeveloperApplication"`, `operatingSystem: "Web"`, `isAccessibleForFree: true`, `offers: { price: 0 }` | El encargo pide `SoftwareApplication` para las demos; una demo de motion no es una aplicación y marcarla así es ruido. Las herramientas (generador por reglas, comparador de contraste) sí lo son |
| `ContactPage` | `/contacto` | `mainEntity: #person` | 3.10, opcional |

**Expectativas honestas sobre resultados enriquecidos:** Google limita el resultado enriquecido de `FAQPage` a sitios gubernamentales y de salud desde agosto de 2023 y retiró `HowTo`; `FAQPage` sigue valiendo para Bing, para los modelos de IA y como estructura de la página, pero **no se promete un rich result**. Los que sí pueden mostrarse: `BreadcrumbList`, `Article` (en Discover/Top stories es raro para este sitio), `Organization` (logo), `SoftwareApplication` (sin valoración apenas aporta visualmente). El valor principal de este plan es **la desambiguación de la entidad y la cita en IA**, no el adorno de la SERP.

**Validación:** snapshots en `tests/jsonld.test.ts` (ya en 2.11) + test de **coherencia** nuevo: cada precio del JSON-LD existe en `pricing.json` y cada `name`/`sameAs` sale de `facts.*`; `qa` pasa el validador de schema.org y la Prueba de resultados enriquecidos en la preview (manual, Mac).

---

## 4. Visibilidad en IA (GEO/LLM)

### 4.1 Lo que dice la evidencia hoy (2026-10-31; verificar en el Mac)

- **`llms.txt` no mueve nada en Google.** Según los resúmenes consultados, la guía de Google «AI features and your website» añadió en 2026 una aclaración: Search ignora `llms.txt`; tenerlo ni ayuda ni perjudica. Un estudio de SE Ranking sobre 300.000 dominios da un 10 % de adopción y **ninguna correlación** con la frecuencia de citas en IA; Ahrefs encontró que el 97 % de esos ficheros nunca se descargan; ningún proveedor (OpenAI, Google, Anthropic, Perplexity) ha confirmado que su sistema de respuestas lo lea. Fuentes: [guptadeepak.com](https://guptadeepak.com/llms-txt-meta-keywords-2026/), [nytroseo.com](https://nytroseo.com/does-llms-txt-help-2026-evidence), [organikpi.com](https://organikpi.com/blog/distribution/llms-txt-adoption-impact/), [baselinelabs.ai](https://baselinelabs.ai/blog/llms-txt-google-search), [getpassionfruit.com](https://www.getpassionfruit.com/blog/should-i-create-an-llms.txt-file-google-s-2026-guidance-explained). **Decisión:** se mantiene porque ya se genera en build sin coste (spec §8, 2.11) y porque es inofensivo, pero **no se invierte más** en él: su contenido es el mismo párrafo citable y los hechos de las páginas; `llms-full.txt` concatena las guías. Nada que no esté ya en HTML.
- **Google: sin requisitos extra para AI Overviews/AI Mode.** La guía oficial dice que basta con ser rastreable, indexable y elegible para fragmento; la nueva «Optimizing your website for generative AI features» (publicada antes de I/O 2026, según fuentes secundarias) habla de punto de vista propio, contenido no genérico y enlaces en las respuestas. Fuentes: [developers.google.com/search/docs/appearance/ai-features](https://developers.google.com/search/docs/appearance/ai-features) (no accesible desde la nube), [trustedshops.com](https://ai-trust-audit.trustedshops.com/en/blog/ai-overviews-and-ai-mode-google-s-requirements-for-websites-2026), [seranking.com](https://seranking.com/blog/ai-mode-/). Search Console tiene un informe de IA generativa que muestra qué páginas aparecen en AI Overviews/AI Mode: es la métrica a vigilar desde 9.6.
- **Datos estructurados y citas en IA: evidencia mixta.** Proveedores reportan más citas con `Article` + `FAQPage` + autor; un análisis independiente de 658 fuentes no encontró correlación. Fuentes: [aigrowthagent.co](https://aigrowthagent.co/articles/?p=3684), [authoritytech.io](https://authoritytech.io/blog/perplexity-vs-chatgpt-search-2026), [llmpulse.ai](https://llmpulse.ai/blog/how-to-rank-in-perplexity/). **Conclusión práctica:** el JSON-LD es barato y nunca debe contradecir el texto visible; lo que sí se repite en todas las fuentes es **frescura** (contenido reciente se cita más), **hechos autocontenidos** y **cobertura de terceros** (Reddit, foros, perfiles). Por eso §4.3–§4.6 pesan más que §3.
- **ChatGPT search se apoya en el índice de Bing** (ampliamente publicado). Consecuencia: verificar el sitio en **Bing Webmaster Tools** y activar **IndexNow** (Cloudflare lo ofrece como «Crawler Hints» sin coste) es tan importante como Search Console. Acción A10.

### 4.2 Entidad coherente (nombre, `sameAs`, perfiles)

1. **Una forma canónica del nombre** en toda la web, `Person.name`, LinkedIn, GitHub, Malt, Upwork, Workana, Contra, Arc.dev, micro1, Codementor (cuentas ya creadas, `ESTADO.md`). Hoy conviven «Jose Carlos Sánchez» (prototipo) y «Jose Carlos Sanchez Garcia» (josedev). Se decide en Q2 (§7).
2. **Mismo titular en todos los perfiles**: la primera frase del párrafo citable de `/sobre-mi` es el «About» de LinkedIn, la bio de GitHub y la descripción de Malt. El kit `Comercial/perfiles-plataformas.md` ya tiene textos: alinear (acción A7, vault).
3. **`sameAs`** en `Person`: LinkedIn, GitHub, Malt, y los perfiles públicos que Jose quiera asociar (Upwork, Contra, Arc.dev…); stores de las apps van en cada `SoftwareApplication`, no en `Person`. Cada enlace saliente a estos perfiles desde `/sobre-mi` con `rel="me"`.
4. **`alternateName: "josecoded"`** y `Organization.name: "josecoded"` para que la marca y la persona se resuelvan como una sola entidad.
5. **Fuera del repo:** `Comercial/agencias-mensajes.md` debe permitir el enlace a `/partners` cuando esté en producción (ya anotado en D38).

### 4.3 Bloques de hechos citables

Cada página comercial lleva, además del párrafo citable, una **lista de definiciones** visible (componente `FactList`, `<dl>`, variantes `compact`/`full`): qué hago · dónde (ciudad + remoto) · stack · tarifas (desde `pricing`) · cómo contratar · idiomas. Mismo componente en `/sobre-mi`, `/servicios`, `/partners`; mismos valores que el JSON-LD (test de coherencia). Es lo que un modelo copia cuando responde «¿cuánto cobra…?».

### 4.4 Página de autor y atribución

`/sobre-mi` es la página de autor: `ProfilePage` + `Person`; cada guía y cada demo enlazan al autor por nombre (`BlogPosting.author.url`), con fecha de publicación y de actualización visibles y un párrafo «Quién escribe» al pie de la guía (2 frases, con enlace). Sin esto, los modelos citan el dominio pero no a la persona, y el objetivo de Pablo y Nuria es la persona.

### 4.5 Frescura real

- `dateModified` sale del **último commit del fichero** (`git log -1 --format=%cI -- <file>` en `scripts/content-index.ts`), no de la fecha de build; «rev.» del pie sigue saliendo de `build-info.json`.
- Una guía nueva al mes (métrica §0.11) y **revisión trimestral** de las tres primeras con cambio real (versión de Next, API nueva) y nota «Actualizado el».
- `lastmod` del sitemap = `dateModified` del contenido.

### 4.6 Bilingüe

- `hreflang` ya resuelto en `pageMetadata` (es canónico sin prefijo, en bajo `/en`, `x-default` = es) y en el sitemap con `xhtml:link` (lo comprueba el E2E de 9.1).
- Contenido en un solo idioma: canónica a sí mismo, sin `alternates`, etiqueta visible. **Nunca** traducir automáticamente una guía para rellenar el otro idioma: una guía mediocre en inglés resta credibilidad a la entidad.
- `<html lang>` por idioma (hecho); `inLanguage` en cada nodo de contenido; OG `locale` (hecho).

### 4.7 Cobertura de terceros (post-lanzamiento, barato)

Sindicar cada guía en dev.to con `canonical_url` apuntando a josecoded.com (dev.to lo soporta) y publicar el resumen en LinkedIn (la fase 10 ya lo prevé); README de los repos públicos de HazmeFila/Oportunix enlazando al caso. Se decide en Q3 (§7).

### 4.8 `robots.txt` y controles de fragmento

- Permitir explícitamente `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` (spec); añadir `Applebot-Extended` y `CCBot` a la lista permitida salvo que Jose prefiera no alimentar entrenamiento (Q no abierta: recomendación permitir; el objetivo es ser citado).
- **No usar** `nosnippet`, `max-snippet` bajos ni `data-nosnippet` en las páginas públicas: limitan la cita en AI Overviews.
- Bloquear solo `/admin`, `/area-clientes`, `/auth`, `/perfil`, `/dev` (y `/chat`: no, se deja rastrear con `noindex` para que siga enlaces).

---

## 5. SEO técnico específico del stack y riesgos de Core Web Vitals

### 5.1 Render, rutas e i18n (OpenNext + Workers, sin middleware)

| Punto | Estado | Acción |
|---|---|---|
| Páginas públicas estáticas (`generateStaticParams` es/en) | DT §1.4, en marcha | Mantener: ninguna página pública con `force-dynamic` salvo el catch-all 404 (ya así). Test de build que lo compruebe (lista de rutas estáticas en el manifiesto de OpenNext) |
| Catch-all `[...rest]` con `force-dynamic` + `notFound()` | Devuelve **404 real** con shell cliente | Correcto para SEO (lo que importa es el código). Añadir al E2E `pages.spec` el `status === 404` para `/x` y `/en/x` (si no está) |
| `/` → `/es` por rewrite, `/es/*` → 308 a `/*`, barras finales por reglas propias | DT §1.4, 2.1 | Matriz de URLs en E2E «SEO»: `/`, `/en`, `/en/` (un salto), `/servicios/` (un salto), `/es/servicios` (308), `/business` (404 o 301 a `/en/business`? → **recomendación: 301 a `/en/services#packs`** para cerrar el pendiente de `usuario-ejemplo` en `ESTADO.md`) |
| 301 con fragmento (`/negocios` → `/servicios#packs`) | 3.2 | Next no conserva el fragmento si no va literal en `destination`: ya anotado en 3.2 |
| 410 de `/blog/<slug>` antiguos y `/foro/*`; 301 de `/services`, `/auth` | 9.1 | Sin cambios; el E2E de 9.1 ya cubre sitemap bilingüe y robots |
| **Lab/Blog ocultos en producción hasta tener contenido** (`sections.ts`) | Hecho para navegación | **Faltan tres cosas**: (1) `app/sitemap.ts` debe excluir `/blog*` y `/lab*` cuando `getSectionAvailability()` los apaga; (2) las rutas deben responder **404** (no 200 vacío) con `labEnabled=false` (4.2/4.5 ya lo dicen); (3) en **previews** (`NEXT_PUBLIC_SITE_ENV=preview`) Lab y Blog se muestran siempre: la preview entera debe llevar `X-Robots-Tag: noindex` y `robots.txt` con `Disallow: /`, o Google indexará `*.workers.dev` con contenido `{{DATO}}`. Cierra también el pendiente B5 (`preview_urls`) |
| `metadataBase` desde `NEXT_PUBLIC_SITE_URL` | 2.1 | En preview la canónica debe apuntar a producción (patrón habitual) y la preview ir `noindex`; no poner la URL de preview como `metadataBase` |
| Imágenes sin optimizador (`images: { unoptimized: true }`) | DT | Todo `<img>` con `width`/`height`, AVIF/WebP generados en build (`scripts/images.ts`, 3.4), `loading="lazy"` bajo el pliegue y **`fetchpriority="high"` en el póster del hero** (es el LCP en móvil) |
| OG dinámicas (satori) | 2.11 | Una por página e idioma; 1200×630; texto del `title` + sufijo; sin `{{DATO}}` |
| RSS | 4.2 | `<link rel="alternate" type="application/rss+xml">` en el `layout` cuando `blogEnabled` |
| Cabeceras de seguridad (tarea pendiente de la fase 9) | Pendiente | **Conflicto a resolver antes de esa tarea:** una CSP con `nonce` obliga a render dinámico en cada petición (adiós a páginas estáticas en Workers y a la caché). Alternativa: CSP por **hash** de los inline conocidos (`intro-gate-script`, JSON-LD no se ejecuta y no necesita permiso, pero algunos navegadores reportan la violación) o `'strict-dynamic'` con los scripts de Next. **Decisión del `arquitecto`: hash, no nonce**; `revisor-seguridad` valida |
| Sitemap | 2.11 | Un solo fichero (< 200 URLs), `lastmod` real, `xhtml:link` por idioma, sin URLs `noindex` |

### 5.2 Core Web Vitals: dónde puede fallar esta web

| Métrica | Riesgo concreto | Mitigación / comprobación |
|---|---|---|
| **LCP** (escritorio) | El `h1` del hero es el LCP, pero la intro (`IntroFall`) espera `scene:ready` hasta `--dur-intro-scene-wait` y luego anima la caída; si las letras arrancan invisibles o fuera del viewport, el LCP se retrasa espera + caída (puede pasar de 2,5 s) | Las letras deben **pintarse en el primer frame** (visibles, aunque sea arriba) o el tope de espera debe ser ≤ 600 ms; `lhci:assert-lcp-element` (2.9) afirma que el LCP es el `h1` o el póster y LCP ≤ 2,5 s en móvil emulado; medir con y sin `?nointro` |
| **LCP** (móvil) | Póster + vídeo: si el póster es grande o se carga tarde, LCP alto; `three` no se carga en móvil (bien) | Póster AVIF/WebP ≤ 60 KB, `fetchpriority="high"`, `preload`; vídeo `preload="none"` hasta que el gate decide; comprobar en `hero:media:check` el peso del póster |
| **LCP** (escritorio, red) | `three` + escena ≈ 141 KiB gz (`ESTADO.md`) | Ya va por `import()` tras el LCP; `check-hero-bundle` (2.9) lo vigila; cargarlo tras `load`/`requestIdleCallback`, nunca en paralelo con las fuentes y el póster |
| **CLS** | (1) Caída de letras: debe ser solo `transform`; (2) `data-intro` lo pone un script inline antes de hidratar (bien, evita flash); (3) fuentes Geist: `font-display: swap` sin `size-adjust` desplaza el `h1` gigante; (4) `Marquee` del stack y barra de `PackStrip` si cambian de ancho al montar; (5) imágenes sin dimensiones | Test Playwright con `PerformanceObserver('layout-shift')` en la home y `/servicios` (CLS ≤ 0,05) en 2.17; fuentes con fallback métrico (`size-adjust`, `ascent-override`) y `preload` de los dos woff2 principales; umbral en `lhci` |
| **INP** | Paginado por gesto (`wheel`, teclado) y `scrollBy` suave; `View Transitions`; hidratación de islas | Listeners `passive` donde no se cancela; trabajo de la escena en el worker (ya previsto); islas mínimas; `lhci` TBT ≤ 200 ms |
| Contenido oculto | Paneles de vías con `:has()`: el texto está en el DOM (bien) pero oculto; los precios clave están en las filas visibles (bien) | Mantener los datos citables (precios, H2) fuera de los paneles plegados |
| Bots sin JS | Mayoría de rastreadores de IA no ejecutan JS | Todo lo citable en SSR: hero con póster, escenas en DOM, `DemoFrame` estático, `PackCompare` como tabla. El E2E de 4.5 ya prueba `javaScriptEnabled: false`; extenderlo a `/servicios` y `/partners` |

### 5.3 **Desvío 3:** `Google-Extended` y entrenamiento

La spec permite `Google-Extended`; conviene saber que ese agente controla el uso para Gemini/entrenamiento, **no** AI Overviews (que usan el rastreo normal de Googlebot). Mantener permitido (coherente con el objetivo de ser citado), pero documentarlo para que nadie lo bloquee «por privacidad» creyendo que afecta a las citas.

---

## 6. Lista de acciones priorizada (mapeada a tareas del plan) y `{{DATO}}` de Jose

Prioridad: **P0** (sin esto el lanzamiento pierde posicionamiento o indexa basura) · **P1** (antes del gate 9.6) · **P2** (primer trimestre tras el lanzamiento).

| # | Pr. | Acción | Tarea | Agente | Verificación |
|---|---|---|---|---|---|
| A1 | P0 | Aprobar los textos `[redactor]` de §2 (títulos, descripciones, H1/H2, párrafos citables, leads de la home) con `voz.md`; volcarlos a `messages/{es,en}` y `content/` | antes de 2.14, 3.1 | `redactor` (Mac) + Jose | `i18n:check` sin `{{DATO}}` en `title`/`description` |
| A2 | P0 | Validar las consultas de §1 con Semrush `es` + `us`/`uk` (cuando haya unidades) o con Keyword Planner; anotar volúmenes reales en una tabla de este documento (v1.1) | antes de 3.2 | `arquitecto` (Mac) | Tabla con fuente y fecha |
| A3 | P0 | `pageMetadata`: `MAX_TITLE` 48 (o medir el título final), rechazo de `{{DATO` en título/descripción, `robots` por página (`noindex` en `/chat`, auth, área, admin, dev) | 2.11 | implementador-web | Tests en `page-metadata.test.ts` |
| A4 | P0 | Grafo JSON-LD con `@id` (§3): `Person` con `knowsAbout`/`sameAs`/`address`, `Organization`, `WebSite` **sin `SearchAction`**, helpers `serviceJsonLd`, `offerCatalogJsonLd`, `faqJsonLd`, `breadcrumbJsonLd`, `softwareApplicationJsonLd`, `articleJsonLd` (BlogPosting+TechArticle), `sourceCodeJsonLd`; test de coherencia con `pricing.json` y `facts.*` | 2.11 | implementador-web | Snapshots + validador schema.org (`qa`) |
| A5 | P0 | `sitemap.ts` respeta `getSectionAvailability()`; `lastmod` real; `robots.ts` con la lista de bots de IA y `Disallow` de privadas; **previews `noindex`** (`X-Robots-Tag` + `robots.txt` `Disallow: /` cuando `NEXT_PUBLIC_SITE_ENV !== 'production'`) | 2.11 (+ cierre de B5) | implementador-web | E2E: sitemap sin `/blog` con `blogEnabled=false`; cabecera en preview |
| A6 | P0 | Hero y CWV: letras pintadas en el primer frame o espera ≤ 600 ms; póster `fetchpriority="high"`; fuentes con fallback métrico; `lhci` con umbrales LCP ≤ 2,5 s, CLS ≤ 0,05, TBT ≤ 200 ms y aserción del elemento LCP | 2.7, 2.8, 2.9, 2.17 | implementador-web | `pnpm lhci` en verde contra `wrangler dev` |
| A7 | P0 | Entidad fuera de la web: forma canónica del nombre (Q2), mismo titular y párrafo citable en LinkedIn, GitHub, Malt y demás perfiles del kit; URL de LinkedIn y usuario de GitHub a `facts.*` | vault `Comercial/perfiles-plataformas.md` | Jose (Mac) | Checklist en el vault |
| A8 | P0 | `/servicios`: H2 con precio por vía, `PackCompare` como `<table>` con `<caption>`, `FactList`, FAQ por vía con `FAQPage` solo si hay respuestas, párrafo citable | 3.1, 3.2 | implementador-web + `usuario-ejemplo` (Marta) | E2E sin JS: precios y «sin IVA» visibles en el HTML |
| A9 | P0 | `/partners`: `title`/`description` de §2.3, `Service` con `BusinessAudience`, FAQ, sin precio (Q16) | 3.3 | implementador-web | E2E `partners.spec` |
| A10 | P1 | Search Console (dominio) y **Bing Webmaster Tools**; enviar sitemap; activar **Crawler Hints/IndexNow** en Cloudflare; informe de IA generativa de GSC como métrica | 9.4 (gate, OK de Jose) | controlador con Jose | Propiedades verificadas; sitemap aceptado |
| A11 | P1 | Casos (`/proyectos/[slug]`): `title` con función de la app, párrafo citable, `SoftwareApplication` sin métricas, `BreadcrumbList`, `rel="me"` en perfiles de `/sobre-mi` | 3.4, 3.5 | implementador-web | Snapshots |
| A12 | P1 | Guías: plantilla con «En resumen», H2-pregunta, FAQ, autor con enlace, fechas reales desde git, `labSlug`; lab con `SoftwareSourceCode` y `SoftwareApplication` solo en `tools` | 4.2, 4.5 | implementador-web + `redactor` | E2E `blog.spec`, `lab.spec` |
| A13 | P1 | Línea base del protocolo GEO (§1.7): 10 preguntas × 4 sistemas, registrada en el vault con fecha | 9.6 | Jose + `arquitecto` | Nota del vault |
| A14 | P1 | Decidir CSP por hash (no nonce) para no perder el render estático | tarea de cabeceras (fase 9) | `arquitecto` + `revisor-seguridad` | Páginas siguen estáticas tras la CSP |
| A15 | P1 | Redirección `/business` → `/en/services#packs` (pendiente de `usuario-ejemplo`) | 3.2 o 9.1 | implementador-web | E2E |
| A16 | P2 | Sindicación con canónica (dev.to) y LinkedIn por guía; README de repos públicos enlazando a los casos | post-9.6 | Jose (Mac) | — |
| A17 | P2 | Revisión trimestral de guías (frescura) y repetición mensual del protocolo GEO; si a los 3 meses hay datos, revisar títulos con GSC (consultas reales > estimaciones) | post-9.6 | `arquitecto` | Tabla de evolución en el vault |

**`{{DATO}}` que Jose debe aportar para que este plan se ejecute** (los que afectan a SEO/GEO; el resto siguen en `ESTADO.md`):

| Dato | Dónde pega | Bloquea |
|---|---|---|
| **Nombre canónico** (con tildes, uno o dos apellidos) | `facts.givenNames/surnames`, `Person.name`, títulos de `/sobre-mi`, perfiles externos | A3, A4, A7 |
| **Ciudad** (y si se publica, Q1) | `facts.city`, `Person.address`, párrafos citables, H1 de `/sobre-mi` | A4, A8 |
| Usuario de GitHub, URL de LinkedIn, perfiles públicos a enlazar (`sameAs`) | `facts.*`, `Person.sameAs`, `LinkRow` | A4, A7 |
| Foto real (para `Person.image` y OG de `/sobre-mi`) | `facts.photo` | A4 |
| Buzón `freelance@` activo (Q18) | `Person.email`, `/partners` | A9 |
| Respuestas de las FAQ de `/servicios` (por vía) y de `/partners` | `content/faq` | A8, A9 |
| `oneLiner`, año, estado y `applicationCategory` de HazmeFila, Oportunix, 3catinfo, webs de comercios; enlaces de stores | `content/projects` | A11 |
| Tres guías y dos demos (temas de §1.6, o los que Jose prefiera) | `content/blog`, `content/lab` | A12 |
| Datos del titular para el aviso legal | `/legal/aviso-legal` | señal de entidad (§2.8) |
| Textos en inglés de `pricing.json` (36 `{{DATO}}`) y nombres en inglés de las vías | `pricing.json`, `messages/en` | A8 (versión `en`) |

---

## 7. Preguntas abiertas para Jose (máx. 4) con recomendación

| # | Pregunta | Por qué importa | Recomendación |
|---|---|---|---|
| Q1 | **¿Publicamos la ciudad?** La spec (Q5) dice «toda España, sin ciudad, sin páginas por ciudad», pero su criterio de aceptación GEO (§10) pregunta a las IA por «freelance en <ciudad de Jose>», y PANT P20/P21 ya escriben «remoto o Madrid». | Sin ciudad en la entidad, ningún modelo responderá «desarrollador freelance en {{ciudad}}» con josecoded; con páginas por ciudad caemos en la plantilla que la spec prohíbe | **Publicar la ciudad una vez por página** (`Person.address.addressLocality`, subtítulo de `/sobre-mi`, párrafo citable de `/servicios` y `/partners`, siempre junto a «y remoto») **y mantener la prohibición de páginas por ciudad**. Resuelve la contradicción sin tocar Q5 en lo esencial. Requiere `facts.city` |
| Q2 | **Nombre canónico de la entidad:** «Jose Carlos Sánchez» (prototipo, dos líneas del hero) o «Jose Carlos Sánchez García» (como en josedev, sin tildes allí). | El `h1`, `Person.name`, el CV, LinkedIn y los perfiles deben decir exactamente lo mismo; hoy no lo hacen | **«Jose Carlos Sánchez»** en web, LinkedIn y perfiles, con tildes; el segundo apellido solo en el CV en PDF y el aviso legal (donde el nombre legal completo procede). `alternateName: "josecoded"` |
| Q3 | **¿Sindicar las guías** en dev.to (con `canonical_url`) y resumirlas en LinkedIn tras publicarlas, y pedir a conocidos que las enlacen? | La evidencia de §4.1 dice que la cobertura de terceros pesa más que el `llms.txt`; es trabajo manual de Jose | **Sí, tras el lanzamiento**, solo dev.to + LinkedIn (la fase 10 ya prevé LinkedIn); nada de Medium sin canónica ni de directorios de pago |
| Q4 | **¿Recargar unidades de Semrush** para validar los volúmenes de §1 antes de escribir el copy (como exige la spec §8), o aceptar las estimaciones y corregir con Search Console a los 3 meses? | Las consultas de este sitio son de cola larga; los volúmenes cambiarían la redacción solo en `/servicios#packs` («cuánto cuesta una web») | **Una consulta puntual desde el Mac** si las unidades son baratas; si no, **no bloquear el copy**: las intenciones están claras y GSC dará consultas reales. En ambos casos este documento pasa a v1.1 con la tabla de datos |

---

## 8. Qué anotar al cerrar

- **Nota del vault `Proyectos/josecoded.md`:** decisión B (entidad + páginas de intención) y los tres desvíos (sin `SearchAction`; `SoftwareApplication` solo en demos-herramienta; `Google-Extended` documentado); respuestas de Q1–Q4 cuando Jose las dé; la línea base del protocolo GEO (A13) y la alineación de perfiles (A7) viven en `Comercial/perfiles-plataformas.md`.
- **`ESTADO.md`:** enlace a este documento en la tabla de documentos (v1.0); en «Insumos de Jose» añadir nombre canónico, ciudad (Q1) y la decisión de Semrush (Q4); en «Pendientes» las acciones P0 que tocan tareas ya definidas (A3–A6 en 2.11/2.9, A8 en 3.2, A9 en 3.3) y el cierre de B5 vía previews `noindex` (A5); el pendiente `/business` pasa a A15.
- **ADR de codebase-memory (al indexar en el Mac):** «SEO/GEO: grafo JSON-LD con `@id` en el layout, `WebSite` sin `SearchAction`, CSP por hash para conservar el render estático, previews `noindex`, `MAX_TITLE` 48 por la plantilla del título».
- **Plan v3.3 (cuando el `arquitecto` lo toque):** incorporar A3–A6 en 2.9/2.11/2.17, A8/A9 en 3.2/3.3, A12 en 4.2/4.5, A10/A13 en 9.4/9.6 y la decisión de CSP en la tarea de cabeceras.
