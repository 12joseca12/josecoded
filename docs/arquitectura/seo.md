# SEO y GEO

**2026-11-02 · analista SEO/GEO · para `arquitecto`.** Mercado: España, español (`/es`); inglés después. Parte de `brief.md`, `pantallas.md`, `decisiones.md` (2.1–2.6, 9.3) y del código actual (`src/app/[locale]/`, `next.config.ts`, `src/content/schemas.ts`). Lo que choca con una decisión cerrada va marcado **Propuesta (decide Jose)**.

**Volúmenes:** Semrush no ha podido consultarse (la cuenta no tiene unidades de API). Las cifras de §1 son **estimaciones** por franjas y hay que validarlas con `keyword_research` (base `es`) en cuanto haya unidades, antes de cerrar titulares. Franjas de volumen mensual en España: **MB** < 50 · **B** 50–200 · **M** 200–1.000 · **A** > 1.000. Dificultad estimada: baja · media · alta.

---

## 0. Cinco decisiones que condicionan el resto

| # | Recomendación | Por qué |
|---|---|---|
| S1 | **Propuesta (decide Jose; toca 2.2):** `/servicios` como hub y dos páginas hijas indexables, `/servicios/freelance` y `/servicios/packs`. «Contratación» se queda como sección del hub. | Un `#fragmento` no se indexa por separado: una sola URL no puede posicionar a la vez «programador freelance por horas» y «precio app móvil», que son búsquedas distintas. El hub conserva `WayNav` y enlaza a las hijas. Si Jose mantiene 2.2, el resto del documento vale igual con anclas; solo se pierde posicionamiento en las queries de packs y freelance. |
| S2 | Los precios «desde» y la tarifa por hora salen **en el HTML del servidor**, como texto con fecha de actualización. | Es el dato que más cita un LLM y la principal señal de intención comercial. Hoy `rateFixture` es `{{DATO}}`: sin cifra no hay GEO de precios. |
| S3 | Una entidad única y coherente: `Jose Carlos Sánchez` · alias `josecoded` · «desarrollador full stack especializado en React Native» · ciudad `{{DATO: ciudad}}` · España y remoto. El mismo texto en la web, el JSON-LD, `llms.txt`, LinkedIn, GitHub y los perfiles de freelance. | Los motores generativos resuelven entidades por coincidencia entre fuentes. |
| S4 | Previews (`*.workers.dev`) con `X-Robots-Tag: noindex` y canonical a producción; producción indexable. | La preview ya publica `NEXT_PUBLIC_SITE_URL` en workers.dev; sin noindex compite con el dominio. |
| S5 | Revisar en Cloudflare **AI Crawl Control / «Block AI bots»** y el robots.txt gestionado: desde 2025 Cloudflare bloquea por defecto los rastreadores de IA en dominios nuevos. | Si no se desactiva, el GEO es imposible por mucho contenido que haya. |

---

## 1. Mapa de palabras clave e intención

Vías: **C** contratación · **F** freelance · **P** packs · **—** apoyo o marca.

| Pantalla | Query principal | Secundarias | Intención | Vol./dif. (est.) | Vía |
|---|---|---|---|---|---|
| Home `/es` | desarrollador react native | programador react native españa · desarrollador full stack react native · desarrollador apps móviles freelance | Comercial / navegacional | M / media | C F P |
| Servicios (hub) `/es/servicios` | servicios desarrollo de apps y webs | desarrollador web y app freelance · contratar desarrollador de aplicaciones | Comercial | B / media | C F P |
| Freelance `/es/servicios/freelance` | programador freelance por horas | desarrollador react native freelance · precio hora programador freelance · contratar programador freelance para un proyecto | Transaccional | B–M / baja-media | F |
| Packs `/es/servicios/packs` | precio app móvil | presupuesto app móvil · pack página web precio · desarrollo app y web precio cerrado | Transaccional | M / media | P |
| Contratación (`#contratacion` en el hub) | desarrollador react native remoto | contratar desarrollador react native · jose carlos sánchez desarrollador | Navegacional (reclutadores llegan por LinkedIn) | MB / baja | C |
| Proyectos `/es/proyectos` | portfolio desarrollador react native | ejemplos de apps hechas con react native · portfolio programador full stack | Investigación comercial | B / baja | C F |
| Ficha `/es/proyectos/[slug]` | {nombre del proyecto} | app {sector} react native · caso {tipo} expo supabase | Navegacional / prueba | MB / baja | P F |
| Sobre mí `/es/sobre-mi` | jose carlos sánchez programador | josecoded · stack react native expo typescript | Navegacional (marca) | MB / baja | C |
| Contacto `/es/contacto` | presupuesto desarrollo app | pedir presupuesto web · contactar desarrollador freelance | Transaccional (tráfico interno, apenas orgánico) | B / alta | F P |
| Blog `/es/blog` | guías desarrollo apps y webs | precios desarrollo app · react native en español | Informacional | — | — |
| Artículos | ver §6 | | Informacional → comercial | | F P |

**Local, condicionado a que Jose publique ciudad:** «programador freelance {ciudad}», «desarrollador de apps {ciudad}» (B / baja-media; buenas para un perfil solo). Van en el párrafo de entidad de la home, en `/sobre-mi` y en el JSON-LD (`areaServed`, `address.addressLocality`). Ficha de Google Business solo si Jose acepta mostrar zona de servicio.

**Lo que no se persigue:** «desarrollo de apps», «diseño web», «cuánto cuesta una app» como query principal de una página de servicio (A / alta, dominadas por agencias y comparadores). «Cuánto cuesta hacer una app» se ataca con una guía (§6), que enlaza a packs.

---

## 2. URL, hreflang y canonical

### Rutas públicas (español)

| Pantalla | URL | Indexable | Prioridad sitemap |
|---|---|---|---|
| Home | `/es` | sí | 1.0 |
| Servicios | `/es/servicios` | sí | 0.9 |
| Freelance (S1) | `/es/servicios/freelance` | sí | 0.9 |
| Packs (S1) | `/es/servicios/packs` | sí | 0.9 |
| Pack individual (fase 2, cuando haya > 1 pack con contenido propio) | `/es/servicios/packs/[slug]` (`app-movil`, `web-negocio`, `web-y-app`) | sí | 0.8 |
| Proyectos | `/es/proyectos` | sí (noindex mientras muestre el vacío «Pronto») | 0.8 |
| Ficha | `/es/proyectos/[slug]` | sí | 0.7 |
| Sobre mí | `/es/sobre-mi` | sí | 0.7 |
| Contacto | `/es/contacto` (parámetros `?via`, `?pack` con canonical sin parámetros) | sí | 0.6 |
| Blog | `/es/blog`, paginado `/es/blog?pagina=2` | sí | 0.7 |
| Categoría | `/es/blog/tema/[categoria]` | noindex hasta tener ≥ 3 artículos | 0.5 |
| Artículo | `/es/blog/[slug]` (plano, sin categoría en la ruta) | sí | 0.7 |
| Legales | `/es/legal/aviso`, `/es/legal/privacidad`, `/es/legal/cookies` | sí (privacidad y aviso); cookies noindex | 0.2 |
| Chat | `/es/chat` | **noindex, follow** (contenido dinámico y vacío para el bot) | fuera |
| Lab | `/es/lab`, `/es/lab/[slug]` | sí cuando exista | 0.5 |
| Privado | `/entrar`, `/invitacion/*`, `/cuenta`, `/admin`, `/crm`, `/area`, `/freelance` | noindex (cabecera) y fuera del sitemap | — |
| Dev | `/es/dev/*` | ausente en producción; `Disallow` | — |

Reglas de slug: kebab-case, español sin tildes ni ñ (`diseno`, `espana`), ≤ 5 palabras, sin fechas ni stopwords sobrantes (`/blog/precio-app-movil-espana`, no `/blog/cuanto-cuesta-hacer-una-app-movil-en-espana-en-2026`). Un slug publicado no cambia; si cambia, 308 en `redirects()`.

Categorías del blog (campo nuevo `category` en `blogSchema`): `precios` · `react-native` · `desarrollo-web` · `ia` · `trabajar-con-freelance`. Las etiquetas (`tags`) siguen existiendo pero no generan páginas.

### Raíz e idioma
- **`/` → `/es` con 308**, no el 302 actual (`permanent: false` en `next.config.ts`). Mientras no haya negociación de idioma, la redirección es fija y debe transmitir señales.
- Sin barra final (`/es/servicios`), como hace Next por defecto; la variante con barra redirige.
- Dominio único `https://josecoded.com` sin `www` (el `www` redirige 301 en Cloudflare).

### hreflang
- **Mientras solo exista `es`:** sin `hreflang` (o solo autorreferente `es-ES` + `x-default`). `/en` sigue respondiendo 404 (W04) y no aparece en ningún sitio.
- **Cuando se publique `en`:** slugs traducidos con un mapa único en `src/i18n/pathnames.ts` (`servicios↔services`, `proyectos↔projects`, `sobre-mi↔about`, `contacto↔contact`, `blog↔blog`, `legal/aviso↔legal/notice`…), del que salen enlaces, `alternates` y sitemap. Cada página declara `es`, `en` y `x-default` (→ versión `es`) vía `metadata.alternates.languages` y también en `sitemap.ts` (`alternates.languages`). Solo se enlaza un par si **las dos** versiones existen; un artículo sin traducir no declara `en`.
- Códigos: `es` (o `es-ES` si se quiere marcar España) y `en`; `og:locale` `es_ES` / `en_US`.

### Canonical
1. Cada página indexable lleva canonical absoluto autorreferente (`metadataBase` + `alternates.canonical`).
2. Parámetros de estado (`?via`, `?pack`, filtros de `/proyectos`, `utm_*`) → canonical a la URL sin parámetros.
3. Paginación del blog: cada página con su propio canonical (`?pagina=2` a sí misma), no a la 1.
4. Previews → canonical a producción + noindex (S4).
5. El PDF del CV: `X-Robots-Tag: noindex` y `Link: <…/es/sobre-mi>; rel="canonical"`, para que la entidad posicione en HTML.

---

## 3. Jerarquía de titulares

Un H1 por página, generado por `PageHead`/`Heading` (título + `accent` coral al final). Sin eyebrows. El H1 contiene la query principal o su núcleo; los H2 cubren las secundarias. **[R]** = texto que debe pasar por `redactor` en el Mac.

**Home**
- H1: «Desarrollador full stack especializado en **React Native.**»
- Primer párrafo (párrafo de entidad, §6): quién, qué, para quién, dónde, cómo contratar.
- H2 «Tres formas de trabajar conmigo» (`ServicesStrip`) · H2 «Apps y webs en producción» (`ProjectGrid`) · H2 «Packs con precio cerrado» (`PackTeaser`) · H2 «Stack con el que trabajo» (`StackRow`) · H2 «¿Hablamos de tu proyecto?» (`Closing`).

**Servicios (hub)**
- H1: «Desarrollo de apps y webs, tres formas de **trabajar juntos.**» (sustituye a «Tres formas de trabajar juntos.», que no lleva keyword).
- H2 «Contratación: desarrollador React Native en tu equipo» (+ H3 «Qué aporto», «CV y disponibilidad») · H2 «Freelance por horas o por tarea» (resumen + enlace a la hija) · H2 «Packs de web y app con precio cerrado» (resumen + enlace) · H2 «Cómo trabajo» (`Steps`, H3 por paso) · H2 «Preguntas frecuentes» (H3 por pregunta).

**Freelance (S1)**
- H1: «Desarrollador React Native freelance, por horas o **por tarea.**»
- H2 «Tarifa por hora y presupuesto por tarea» (`RateFigure` con cifra) · H2 «Qué tipo de encargos acepto» (H3: funcionalidad nueva, auditoría, rescate de proyecto, integración de IA) · H2 «Cómo es una colaboración» (`Steps`) · H2 «Proyectos parecidos» · H2 «Preguntas frecuentes».

**Packs (S1)**
- H1: «Packs de web y app con precio y fecha **cerrados.**»
- H2 «Compara los packs» (`PackCompare`; H3 por pack: «Pack {nombre}: desde {precio} €») · H2 «Qué incluye cada pack» · H2 «Extras y mantenimiento» (`ExtraList`) · H2 «Cuánto tarda» · H2 «Preguntas frecuentes sobre precios».

**Proyectos**
- H1: «Proyectos: apps React Native y webs **en producción.**»
- H2 por tarjeta no; las tarjetas usan H2 con el nombre del proyecto (lista plana, sin H3).

**Ficha de proyecto**
- H1: «{Nombre}, {qué es en 3–5 palabras} con **{tecnología o tipo}.**» (p. ej. «HazmeFila, gestión de colas con **React Native.**» [R])
- H2 «El reto» · H2 «Qué hice» · H2 «Stack» · H2 «Resultado» · H2 «Más proyectos».
- Requiere en `projectSchema`: `kind` (`app` | `web`, para `FilterTabs`, hoy no existe), `sector`, `headline`, `description` (≤ 155), `relatedService` (`freelance` | `packs` | `hiring`).

**Sobre mí**
- H1: «Soy Jose Carlos Sánchez, desarrollador **full stack.**»
- H2 «Trayectoria» · H2 «Cómo trabajo» (`PrinciplesList`) · H2 «Stack» (`id="stack"`, H3 por grupo: móvil, web, backend, IA) · H2 «Formación y certificaciones» · H2 «CV y perfiles».

**Contacto**
- H1: «Cuéntame tu proyecto y te propongo **un plan.**» [R]
- H2 «Escríbeme» (formulario) · H2 «Otras formas de contacto» · H2 «Qué pasa después» (2–3 pasos con plazo de respuesta `{{DATO}}`).

**Blog**
- Índice H1: «Guías sobre apps, webs y **precios reales.**» · H2 por teaser (título del artículo).
- Artículo H1 = `title` con las 1–3 últimas palabras en `accent` · H2 por sección (salen en `Toc`) · H3 dentro · H2 final «Preguntas frecuentes» si el artículo tiene `faq` · bloque de autor (no titular).

**Chat** H1 «Pregunta al asistente de **Jose.**» · **404** H1 existente «Esta pantalla no existe» (sin keyword: correcto).

---

## 4. Enlazado interno

```
            Home ──────────────┐
             │                 │
        Servicios (hub) ◄──── Footer (las 3 vías + 3 guías)
        ╱      │      ╲
 Contratación Freelance Packs ◄──── artículos de precios
      │        │    ╲  │
  Sobre mí   Proyectos ◄─► Fichas ◄──► artículos técnicos
      └────────┴──────┴───────┴──► Contacto (?via / ?pack)
```

| Desde | Enlaza a | Ancla (ejemplo) |
|---|---|---|
| Home | hub, freelance, packs, 3 fichas destacadas, sobre mí, 1–2 guías de precio | «packs de web y app con precio cerrado», «trabajo freelance por horas» |
| Hub | freelance, packs, sobre mí `#stack`, CV, 2 fichas, 2 guías, contacto `?via=` | «ver tarifas de freelance», «comparar packs» |
| Freelance | 2–3 fichas con `relatedService=freelance`, guía «por horas o por tarea», contacto `?via=freelance` | «casos de proyectos freelance» |
| Packs | fichas `relatedService=packs`, guías de precio, publicación y plazos, contacto `?pack={slug}` | «cuánto cuesta una app móvil», «cómo se publica en las tiendas» |
| Ficha | servicio que la vendió (bloque «¿Necesitas algo así?»), `PrevNext`, 1 artículo relacionado | «pack de app móvil», «desarrollo React Native freelance» |
| Artículo | el servicio al que alimenta (§6) en el cuerpo y en un bloque final, 2 artículos de la misma categoría, `/sobre-mi` en el bloque de autor | descriptiva, en mitad del texto |
| Sobre mí | proyectos, hub, CV, LinkedIn/GitHub (`rel="me"`) | «mis proyectos», «cómo trabajo» |

**Reglas de ancla:** descriptiva y distinta según contexto; nunca «aquí» ni «leer más» a secas (si el diseño lo exige, `aria-label`/texto oculto con el título); la variante exacta de la query principal como mucho una vez por página de origen; 3–6 enlaces internos por cada 1.000 palabras de artículo; cada página indexable a ≤ 3 clics de la home y con ≥ 2 enlaces entrantes (ninguna huérfana).

**Migas (`Breadcrumbs`, componente nuevo, con `BreadcrumbList`):** en todas salvo home. `Inicio › Servicios › Packs` · `Inicio › Proyectos › {nombre}` · `Inicio › Blog › {categoría} › {título}` (la categoría enlaza a su página si es indexable, si no a `/blog`). En móvil, solo el padre («‹ Proyectos»).

**Bloques de relacionados:** ficha → 2 proyectos + 1 artículo; artículo → 2 artículos de la misma categoría + 1 tarjeta de servicio; servicio → 2 proyectos + 2 guías. Se calculan en build desde el frontmatter (`category`, `relatedService`, `relatedPosts` opcional), sin datos de cliente.

**Pie (`SiteFooter`):** columna Servicios (Contratación, Freelance, Packs) · columna Trabajo (Proyectos, Sobre mí, Blog) · columna Guías (3 artículos de precio fijados en config) · Contacto (email y perfiles con `rel="me"`) · Legal. Todos como `<a>` reales, sin JS.

---

## 5. Datos estructurados y metadatos

JSON-LD en un único `<script type="application/ld+json">` por página con `@graph` y `@id` estables; se escapa `<` como `<`. Tipos con `schema-dts` si `revisor` acepta la dependencia; si no, tipos propios en `src/types/seo.ts`. Validación en CI con un test que pasa cada grafo por zod.

| Pantalla | Grafo |
|---|---|
| Todas (layout) | `WebSite` (`@id …/#website`, `inLanguage`, `publisher` → Person) + `Person` (`@id …/#person`: `name`, `alternateName: josecoded`, `jobTitle`, `description`, `url`, `image`, `sameAs` [LinkedIn, GitHub, perfiles freelance], `knowsAbout` [React Native, Expo, TypeScript, Next.js, Supabase, IA], `knowsLanguage` [es, en], `address.addressLocality` `{{DATO}}`, `addressCountry: ES`) |
| Home | `WebPage` + `ProfessionalService` (`@id …/#service`, `provider` → Person, `areaServed` España, `priceRange` «€€», `url` hub) |
| Servicios / Freelance / Packs | `WebPage` + `ProfessionalService` con `hasOfferCatalog` → `OfferCatalog` → `Offer` por vía: freelance `priceSpecification: UnitPriceSpecification` (`price`, `priceCurrency: EUR`, `unitCode: HUR`); cada pack `Offer` con `itemOffered: Service` y `priceSpecification` con `minPrice` («desde»), `eligibleDuration` en semanas; `FAQPage` con las preguntas visibles; `BreadcrumbList` |
| Proyectos | `CollectionPage` + `ItemList` de las fichas |
| Ficha app | `MobileApplication` (`operatingSystem`, `applicationCategory`, `installUrl`/`sameAs` a la tienda, `creator` → Person, `dateCreated`) + `BreadcrumbList`. **Sin `aggregateRating` inventado**; sin rating no hay resultado enriquecido, pero sí entidad |
| Ficha web | `CreativeWork` (`url` del sitio, `creator`, `about`, `keywords` = stack) + `BreadcrumbList` |
| Sobre mí | `ProfilePage` con `mainEntity` → Person (`hasCredential`, `alumniOf`, `worksFor` si procede) |
| Contacto | `ContactPage` + `BreadcrumbList` |
| Blog | `Blog` + `ItemList` de `BlogPosting` |
| Artículo | `BlogPosting` (`headline`, `description`, `datePublished`, `dateModified`, `author` → Person, `image`, `inLanguage`, `about`, `mentions` → servicio) + `FAQPage` si hay `faq` + `BreadcrumbList` |
| Legales, 404, chat | sin grafo propio (solo el global) |

Nota: Google solo muestra FAQ enriquecidas a webs de gobierno y salud desde 2023; `FAQPage` se mantiene porque los LLM y Bing sí lo leen, y solo con preguntas visibles en la página.

### Plantillas de meta

`title.template` en `[locale]/layout.tsx`: `%s · josecoded` (unifica el `|` de servicios y el `·` de proyectos). Título ≤ 60 caracteres con la marca; descripción 140–155; OG title ≤ 70; OG description ≤ 200.

| Pantalla | `<title>` | Descripción (patrón) |
|---|---|---|
| Home | Desarrollador React Native y full stack · josecoded | Apps móviles y webs con React Native y Next.js: freelance por horas, packs con precio cerrado o en tu equipo. {ciudad} y remoto. |
| Hub | Servicios de desarrollo de apps y webs · josecoded | Contratación, freelance por horas o por tarea y packs de web y app con precio cerrado. Elige cómo trabajar conmigo. |
| Freelance | Desarrollador React Native freelance · josecoded | Desde {tarifa} €/h o presupuesto por tarea. Funcionalidades, auditorías y rescates de apps React Native y webs Next.js. |
| Packs | Precio de app móvil y web: packs cerrados · josecoded | Packs de web y app desde {precio} €, con plazo, publicación en tiendas y dominio incluidos. Compara qué trae cada uno. |
| Proyectos | Proyectos React Native y web · josecoded | Apps y webs en producción con enlaces verificables: el reto, lo que hice, el stack y el resultado. |
| Ficha | {Nombre}: {tipo} con {tech} · josecoded | {summary} (de frontmatter, ≤ 155). |
| Sobre mí | Jose Carlos Sánchez, desarrollador full stack · josecoded | Trayectoria, forma de trabajar y stack de un desarrollador full stack especializado en React Native. Descarga el CV. |
| Contacto | Contacto y presupuesto · josecoded | Cuéntame tu proyecto: freelance, pack o contratación. Respuesta en {plazo}. |
| Blog | Blog: guías de apps, webs y precios · josecoded | Guías prácticas sobre precios, plazos y tecnología para apps y webs, con cifras reales de proyectos. |
| Artículo | {title ≤ 50} · josecoded | {description} |

Textos en `messages/es.json` bajo `meta.*` y `{pantalla}.meta.*`; artículos y fichas desde frontmatter. **[R]** todos.

**Open Graph y redes:** `og:type` `website` (home, servicios), `profile` (sobre mí), `article` (artículos, con `article:published_time`, `article:author`); `og:locale es_ES`; `og:site_name josecoded`; `twitter:card summary_large_image`. Imagen 1200×630 por ruta con `opengraph-image.tsx` (`next/og`): plantilla estilo B (carbón, acero, palabra en coral) con H1 y tipo de página. Verificar en la preview que `next/og` funciona bajo OpenNext; si no, imágenes generadas en build a `public/og/`.

---

## 6. GEO: que un LLM cite la web

**Bloques citables por pantalla**
1. **Párrafo de entidad** justo bajo el H1 de home, hub y sobre mí (40–60 palabras, frases declarativas, sin adjetivos vacíos): «Jose Carlos Sánchez es un desarrollador full stack especializado en React Native, con base en {ciudad}. Desarrolla apps móviles y webs para empresas y negocios en España y en remoto: como freelance por horas o por tarea, con packs de precio cerrado o incorporándose a un equipo.» [R]
2. **Precios en texto** con unidad, rango y fecha: «La tarifa por hora es de {X} €. Los packs empiezan en {Y} € (web) y {Z} € (app). Precios actualizados el {fecha}.» `site_settings` o `price_changes` dan la fecha.
3. **Definiciones** en la primera frase de cada sección de guía («Un pack es…», «React Native es…»), y **tablas** comparativas (pack vs pack, por horas vs por tarea, React Native vs Flutter).
4. **FAQ visibles** en servicios, freelance, packs y en cada guía: preguntas con la forma en que se teclean («¿Cuánto cuesta una app como…?»), respuesta autosuficiente en ≤ 50 palabras.
5. **Datos propios**: cifras reales de los proyectos (usuarios, tiempos, plazos). Es lo único que un LLM no puede sacar de otra web. Regla de la v1: nada inventado; `{{DATO}}` hasta que Jose lo dé.
6. **Autor**: bloque en cada artículo (foto, una línea, enlace a `/sobre-mi`), `dateModified` visible («Actualizado el…»).

**`llms.txt`** (`src/app/llms.txt/route.ts`, generado desde `messages`, packs y `content/`): H1 `josecoded`, cita con el párrafo de entidad, secciones «Servicios» (vías con precio y URL), «Proyectos» (nombre, una línea, URL), «Guías» (título, URL), «Contacto». Opcional `llms-full.txt` con el texto de servicios y guías en Markdown. Se regenera en cada build; los precios, con la caché por tag de 8.2.

**robots y rastreadores de IA** (S5): permitir buscadores de IA (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Bingbot`, `Googlebot`). Rastreadores de entrenamiento (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`): **recomendado permitir** (el objetivo es ser conocido), **decide Jose**.

**Fuera de la web:** Bing Webmaster Tools (ChatGPT busca con Bing) + IndexNow (Crawler Hints de Cloudflare) · Search Console · perfiles de LinkedIn, GitHub (README de perfil), Malt y Freelancer con el mismo párrafo de entidad y enlace a la web · el repo público (1.10) enlazado desde la ficha `josecoded.com`.

### Plan de los primeros 10 artículos

| # | Título de trabajo | Query objetivo (est.) | Categoría | Alimenta |
|---|---|---|---|---|
| 1 | Cuánto cuesta hacer una app móvil en España en 2026 | cuánto cuesta hacer una app (A / alta), precio app móvil (M) | precios | Packs |
| 2 | Precio de una página web para un negocio: rangos reales | precio página web negocio (M / media) | precios | Packs (web) |
| 3 | Programador freelance por horas o por tarea: cuál te conviene | programador freelance por horas (B) | trabajar-con-freelance | Freelance |
| 4 | Qué comprobar antes de contratar a un desarrollador freelance | contratar programador freelance (B–M) | trabajar-con-freelance | Freelance, Contacto |
| 5 | React Native, Flutter o nativo en 2026: cómo elegir para tu app | react native vs flutter (M / media) | react-native | Packs, Freelance |
| 6 | Cuánto se tarda en hacer una app: fases y plazos | cuánto se tarda en hacer una app (B) | precios | Packs |
| 7 | Cómo publicar una app en App Store y Google Play: pasos y costes | publicar app en google play / app store (M) | react-native | Packs (publicación incluida) |
| 8 | Mantenimiento de una app: qué incluye y cuánto cuesta al mes | mantenimiento app precio (B) | precios | Packs (extras) |
| 9 | Añadir un asistente con IA a tu web: qué necesitas y qué cuesta | chatbot ia para web precio (B) | ia | Freelance, Packs; enlaza al chat propio como prueba |
| 10 | Expo en 2026: lo que cambia para un proyecto React Native en producción | expo react native (B) | react-native | Contratación (autoridad técnica), Freelance |

Orden de publicación: 1, 3, 2, 5, 6, 4, 7, 8, 9, 10 (precio e intención comercial primero). Cada artículo: 1.200–2.000 palabras, tabla o cifra propia, FAQ de 3–5 preguntas, enlace al servicio en el primer tercio y en el bloque final. Los textos pasan por `redactor` en el Mac; el agente en la nube deja el esqueleto y las cifras como `{{DATO}}`.

Frontmatter a añadir en `blogSchema` (hoy `strictObject` sin estos campos): `updated` (fecha), `category` (enum de §2), `cover` ({src, alt}), `faq` (array {q, a}), `relatedService` (`freelance` | `packs` | `hiring`), `relatedPosts` (slugs, opcional).

---

## 7. Lista técnica (Next 16 en Cloudflare)

| # | Punto | Dónde / cómo |
|---|---|---|
| T1 | `metadataBase` desde `NEXT_PUBLIC_SITE_URL`; `title.template`; `alternates.canonical` por página | `[locale]/layout.tsx` + `generateMetadata` de cada página |
| T2 | `src/app/sitemap.ts` (raíz, fuera de `[locale]`): rutas estáticas + fichas + artículos no `draft`; `lastModified` de frontmatter (`updated` ?? `date`); blog y lab solo si su interruptor está encendido (lee `site_settings` con caché por tag); sin `/en` hasta publicarlo | W43 |
| T3 | `src/app/robots.ts`: `Allow: /`; `Disallow: /es/dev/`, `/admin`, `/crm`, `/area`, `/freelance`, `/entrar`, `/invitacion`, `/cuenta`, `/api/`; reglas de bots de IA (§6); `Sitemap:` absoluto. En preview, `Disallow: /` | W43 |
| T4 | Zonas privadas y auth con `X-Robots-Tag: noindex, nofollow` en el proxy/middleware (robots no basta para quitar del índice) | `auth/*` |
| T5 | `/` → `/es` con **308** (hoy 302) | `next.config.ts` |
| T6 | Códigos HTTP reales: 404 con `notFound()` (ya en `[...rest]` y en layout), **mantenimiento 503 + `Retry-After`**, cuota 429, error 500; todas `noindex`. Blog apagado → 404 y fuera del sitemap. `/proyectos` vacío → `noindex` (evita *soft 404*) | P10, W40 |
| T7 | Contenido sin JS: todo texto, precios, FAQ (`<details>`), tablas de packs y enlaces en el HTML del servidor (RSC). `PackCompare` en móvil pinta todos los packs en el DOM (carrusel por CSS, no por montaje). `FilterTabs` y `LoadMore` con URL y `<a href>` reales. El scroll por bloques y las View Transitions no ocultan contenido ni cambian URL sin `pushState` | P2, P3, P8 |
| T8 | JSON-LD servido en el HTML inicial desde Server Components; compatible con la CSP con nonce (bloque de datos, no ejecutable); `<` escapado | W43 |
| T9 | Imágenes: `next/image` necesita *loader* en Workers (Cloudflare Images o `unoptimized` + AVIF/WebP generados en build); `width`/`height` siempre; `alt` desde frontmatter; LCP del hero sin `loading="lazy"` y con `fetchpriority="high"` | 9.3, 9.4 |
| T10 | Presupuesto de 9.3 (LCP < 2,5 s, INP < 200 ms, CLS < 0,1, JS home ≤ 150 KB gz, Lighthouse ≥ 95, que incluye la categoría SEO) bloqueante en CI; fuente propia con `next/font` (ya), `font-display: swap` | 1.8 |
| T11 | i18n: `lang` en `<html>` (ya); `pathnames.ts` como única fuente de rutas por idioma; `hreflang` en metadata y sitemap solo para pares existentes; `og:locale` por idioma | W04, §2 |
| T12 | Previews: `X-Robots-Tag: noindex` en todo `*.workers.dev` y canonical a producción (S4) | `wrangler.jsonc` vars + proxy |
| T13 | Cloudflare: desactivar el bloqueo de bots de IA y el robots.txt gestionado si pisa el nuestro (S5); `www` → apex 301; HTTPS y HSTS (9.1); activar Crawler Hints/IndexNow | panel de Cloudflare (acción de Jose) |
| T14 | Search Console y Bing Webmaster Tools verificados por DNS; enviar sitemap el día de W46 | lanzamiento |
| T15 | E2E de SEO por ruta pública: un `h1`, `title` ≤ 60, descripción 50–160, canonical absoluto, JSON-LD que parsea, `noindex` donde toca, estado HTTP correcto | `pnpm e2e` |
| T16 | `llms.txt` y `llms-full.txt` como route handlers estáticos con revalidación por tag de precios | W43 |

**Huecos detectados en el código actual:** sin `metadataBase` ni `canonical`; `title` sin plantilla y con separadores mezclados (`Servicios | josecoded`, `Proyectos · josecoded`); redirección raíz 302; `projectSchema` sin `kind` (lo necesita `FilterTabs`) ni `description`; `blogSchema` sin `updated`, `category`, `cover`, `faq`; tarifas en `{{DATO}}`; H1 de servicios sin keyword.
