# joseCoded — plataforma web personal (spec v1)

**Fecha:** 2026-09-13 · **Perfil:** web · **Estado:** **v1.6 (2026-09-29)**. Historial: v1.5.2 (Q11–Q14 y P11–P15 resueltas; hero: subtítulo por audiencia sin tecnologías, alternativa B de UX §4.1) (2026-09-19: decisión del hero cerrada en §12/D16 y nuevo módulo **Radar** en v1, §13/D17–D26). v1.4 (2026-09-17: dirección visual redefinida, §12 UI/R14). v1.3 (decisiones técnicas P1–P6). v1.1 (2026-09-14: packs escalonados, extras, ampliaciones y afiliados, R12). v1 cerrada el 2026-09-13 con la batería de preguntas a Jose (R1–R11). Sustituye a la v0.

## Changelog v1.6 (2026-09-29)

Recoge todo lo decidido el 2026-09-29 en `ESTADO.md` («Decisiones recientes»), `docs/working-agreements.md` v1.0, `docs/superpowers/design/2026-09-29-componentes-home-v6.md` v1.1 y `docs/superpowers/design/2026-09-29-pantallas-y-contenidos.md` v1.0. Lo anterior no se borra: se marca «superado por» donde toca.

1. **Stack visual (D27):** sin Tailwind ni shadcn; CSS Modules por componente que consumen solo tokens generados desde `.impeccable/design.json`; motion en CSS nativo con TypeScript propio mínimo; **sin GSAP por defecto** (solo con justificación aprobada por `revisor`). Supera el «GSAP + `@gsap/react` + ScrollTrigger» y el «Tailwind CSS v4, shadcn/ui» de §5 y §12.
2. **Baseline 2024 (D28)** con degradación por `@supports` y tabla de fallbacks obligatorios (working-agreements §6).
3. **Home = prototipo `ref/home-v6/` («bento por escenas», D29)**: §12 reescrita. La nube de glifos vive solo en el hero (ya coincidía), cabecera con idioma → ⌘K → Chat → Login (sin «Contacto» en la barra), orden Sobre mí · Empresas · Negocios · Proyectos · Blog · «¿Empezamos?». El hero D16 se conserva con los parámetros de la v6.
4. **Pantallas y contenidos (D30):** `/contacto` con selector negocio/empresa y cierre corto en cada página; «Stack y formación» como sección de Sobre mí más CV en PDF es/en generado del CV maestro de Radar; packs de app (MVP 4.000 €, ampliada 6.000 €) en Negocios («¿Necesitas una app?»); **Empresas solo trabajo y freelancing** con las dos tarifas 40 €/h y feature cerrada desde 150 € (**confirmado por Jose el 2026-09-29**: son formas de contratarle, no packs; la celda Tarifas de la home no cambia); comparador de packs dentro de `/negocios`; caso de estudio medio por proyecto; **josecoded.com es un proyecto** con su propio caso; interiores con scroll libre (sin 100svh forzado ni paginado).
5. **Todo bilingüe (D31):** todas las páginas públicas **y el área privada** en es y en desde el lanzamiento; admin y Radar solo en español. Criterio de aceptación: `i18n:check` sin claves pendientes en ninguno de los dos idiomas.
6. **Personalización automática del área (D32):** la portada de `/area-clientes` ordena sus bloques por señales (cliente → propuesta/lead → `?ref` → página de origen → neutra), sin preguntar; se persiste solo la señal de origen en una tabla aditiva con RLS (diseño técnico §1.12).
7. **Blog con mínimo 3 artículos reales (D33):** si no llegan, se ocultan la escena de la home, la entrada de la cabecera, el menú, ⌘K y el pie, y `/blog` responde 404 (comprobación en build).
8. **Lanzamiento: sigue siendo todo junto** (D7), Radar y área incluidos. El orden del documento de pantallas es de diseño y construcción, no de lanzamiento.
9. **Newsletter:** tiene spec propia (`docs/superpowers/specs/2026-09-29-josecoded-newsletter.md`, v1) como **fase 10 post-lanzamiento** del plan; supera la idea candidata «RSS + newsletter» de §4.1 en su parte de newsletter (RSS sigue en v1). Esta spec no la reescribe.

## 1. Objetivo y métricas

**Objetivo:** rehacer joseCoded desde cero como plataforma web personal de Jose con dos audiencias de igual peso:

- **(A) Empresas que contratan** (equipos técnicos, CTOs, reclutadores): la web es a la vez portfolio y demostración. Debe mostrar habilidades y conocimientos —en datos y con la propia web— y leerse como una innovación tecnológica y un despliegue técnico real.
- **(B) Negocios locales que encargan una web**: Jose actúa como freelance con proyectos propios. **No se vende como agencia**; la "agencia de webs para negocios" queda absorbida en la oferta freelance.

Desde v1.5 la plataforma tiene además un **uso interno** para Jose: **Radar** (§13), el módulo del admin que busca empleo y encargos freelance, prepara candidaturas y las envía o asiste solo cuando Jose confirma.

Se conservan y no se reescriben `josecoded-api`, `josecoded-worker`, Supabase y el dominio. Estilos, objetivos y UI/UX son nuevos.

**Métricas de éxito (a 3 meses del lanzamiento):**
- (B) ≥ 4 leads cualificados/mes desde la web (formulario, generador de propuesta o WhatsApp con origen web).
- (A) ≥ 2 contactos de empresa/mes; tiempo medio en "Proyectos" y "Sobre mí" > 90 s.
- Un visitante sin scroll entiende qué hace Jose, para quién y cómo contactar (validado por `usuario-ejemplo` con ambas personas).
- Core Web Vitals en verde en móvil 4G (LCP < 2,5 s, INP < 200 ms, CLS < 0,1) con las animaciones activas **y con la escena del hero (§12) cargada en diferido**.
- Lighthouse móvil: rendimiento ≥ 90, accesibilidad ≥ 95, SEO 100. WCAG 2.2 AA en `/puerta-calidad`.
- GEO: josecoded aparece citado al preguntar a ChatGPT/Perplexity/Google AI "desarrollador full-stack React Native freelance en <ciudad de Jose>" y "quién es Jose (josecoded)" (protocolo de verificación en §8).
- Nada publicado sin contenido real.
- **Radar (§13.1):** ≥ 20 ofertas relevantes/semana descubiertas y puntuadas; ≥ 5 candidaturas o propuestas confirmadas/semana con material adaptado; el 100 % de los correos de respuesta de plataformas y empresas conocidas quedan vinculados a su candidatura sin intervención; cero envíos sin confirmación de Jose.

## 2. Personas

**Principal (para `usuario-ejemplo`): "Marta, dueña de negocio local"** (clínica, restaurante, tienda, taller). 35–55 años, sin perfil técnico, entra desde el móvil por recomendación, LinkedIn o búsqueda local. Quiere saber en un minuto qué le harían, desde cuánto, si Jose es de fiar y cómo hablar con él sin compromiso. Abandona ante jerga, ausencia de precio orientativo o formularios largos. Su ruta: home → "Webs para tu negocio" → generador de propuesta o WhatsApp.

**Secundaria: "Dani, CTO / responsable técnico / reclutador"** que evalúa contratar a Jose (proyecto o puesto). Entra desde escritorio, mira stack, proyectos reales en stores, código, cómo trabaja y cómo está hecha esta web. Su ruta: home → "Proyectos" → "Sobre mí" / "Cómo trabajo" → chat IA o contacto.

**Operador (para Radar, §13): "Jose"**, único usuario del admin. Revisa la bandeja de Radar desde el móvil (Telegram) varias veces al día y desde escritorio (admin) una vez al día. Quiere confirmar o descartar en un toque, con el material ya preparado, y no perder ningún plazo ni respuesta por correo.

`usuario-ejemplo` valida siempre con Marta; con Dani en Proyectos, Sobre mí, chat y blog; con Jose en la bandeja de Radar (flujo de confirmación en admin y en Telegram).

## 3. Inventario de josedev y destino

| Pieza de josedev | Destino en josecoded |
|---|---|
| Home, `/services`, `/sobre-mi` | Se rehacen con la narrativa de las dos audiencias |
| Blog (`blog_posts`, markdown, `ai/blog/*` en el worker) | **Se conserva**, reescrito en MDX en el repo (D8), con comentarios |
| Foro (`/foro/*`, 6 tablas, rutas `forum/*`) | **Se elimina del frontend.** Lo sustituyen los comentarios en artículos. Rutas del gateway y tablas quedan intactas |
| Terminal admin-chat (IA Workers AI + takeover humano, rutas `admin-chat/*`) | **Se conserva** como asistente sobre Jose, con nueva UI |
| `/auth`, `/perfil` (Supabase Auth) | **Se conservan**: una cuenta para chat, comentarios y portal (Google, GitHub, email) |
| Área de clientes (proyecto, tareas, assets, pack) | **Se conserva**, UI nueva sobre las tablas existentes |
| Admin (`/admin`: leads, clientes, packs, finanzas, chats) y closer | **Se sustituye** por un panel admin nuevo, solo Jose (D9). Closer, comisiones y finanzas: fuera; CRM comercial en Notion |
| `/staff/*`, MFA de staff | Fuera (sin staff). Admin = Jose con `staff_members.role='admin'` |
| SEO/GEO (sitemap, robots, OG dinámica, JSON-LD, `llms.txt`, alternates) | Se porta y se amplía (§8) |
| Iconos "jc", carrusel de 3catinfo con marco de móvil | Iconos: rehacer. Carrusel: reutilizar la idea en Proyectos |
| Demo de emulador Android | No vuelve |
| Diseño P7 "Sistema de búsqueda de empleo + dashboard" (spec de josedev del 2026-07-13, nunca implementado) | **Superado por Radar (§13)**: se conserva la idea (Indeed por MCP, Kanban en admin, Gmail para respuestas, Proton Bridge) y cambian las decisiones de LinkedIn (P7 excluía el scraping; Jose lo admite ahora con sesión propia y límites, D20), de preparación (P7 no generaba material; Radar sí) y de envío (P7 era manual; Radar envía o asiste tras confirmación) |

## 4. Alcance

No hay MVP: se lanza el **producto final v1** completo, cuanto antes. El trabajo se organiza en ramas por feature con `/puerta-calidad` en cada una, pero producción se abre con todo. **Desde v1.5, "todo" incluye Radar (§13): Jose acepta que retrase el lanzamiento (D17).**

### Producto final v1

**Público**
1. Home: **prototipo `docs/superpowers/design/ref/home-v6/` (D29, §12)**: hero split con escena de glifos en Three.js e intro de caída (D16, parámetros de la v6) y, después, una escena por pantalla (Sobre mí · Empresas · Negocios · Proyectos · Blog · «¿Empezamos?») con titular a dos tonos y bento de tres celdas; Proyectos como carrusel fijado; paginado por gesto solo en escritorio con puntero fino; celdas principales ampliables con View Transitions; paleta ⌘K. Motion en CSS nativo (D27). *v1.5.2 decía «dos vías + motion GSAP»: superado.*
2. "Trabajo con empresas" (audiencia A, `/empresas`): **solo trabajo y freelancing** (por proyecto, por horas o como puesto): servicios (web, móvil, IA integrada) con un entregable por servicio, **tarifas 40 €/h y feature cerrada desde 150 €** (confirmado 2026-09-29: formas de contratar, no packs; sin packs de web ni de app en esta página), cómo trabajo, resumen del stack con enlace a `/sobre-mi#stack`, pruebas (stores, «Código en GitHub» sin contadores), preguntas, reservar 20 min y «Descargar CV» (PDF es/en, punto 6). Detalle en `2026-09-29-pantallas-y-contenidos.md` P4.
3. "Webs para tu negocio" (audiencia B, `/negocios`): cuatro packs escalonados (P1 básica, P2 pedidos/reservas, P3 gestión, P4 gestión + automatizaciones) con precio cerrado "Desde X €" en un **comparador dentro de la página** (un pack por vista en móvil; sin página de tarifas aparte), extras aparte (mantenimiento básico/extendido, SEO básico/completo, GEO, análisis de ciberseguridad), tomados de `Comercial/tarifas.md`; **bloque «¿Necesitas una app?»** con los packs de app (MVP desde 4.000 € · 6 semanas; ampliada desde 6.000 € · 8 semanas) y WhatsApp prellenado «app»; proceso; preguntas; CTA al generador de propuesta y a WhatsApp; barra fija móvil (WhatsApp + Propuesta). Los "extras regalados por pack" NO se muestran en la web (son argumento de cierre en la propuesta). Detalle en `2026-09-29-pantallas-y-contenidos.md` P1.
4. **Generador de propuesta con IA**: el negocio describe lo que necesita; la IA lo clasifica en un pack (P1–P4, **o un pack de app** si la petición apunta a una app) y extras; el precio orientativo sale de `pricing.json` (que expone también los dos packs de app); al enviarlo se crea un lead cualificado (D5). Si llega con `?ref=CODIGO`, el lead queda atribuido al afiliado (D15). Responde en el idioma de la página (es/en).
5. Proyectos: índice con filtro (Todos · Apps · Webs) y **caso de estudio medio** por proyecto (cabecera con enlace de prueba, capturas, reto, qué hice, stack ocultable, resultado verificable sin métricas, anterior/siguiente): 3catinfo (sin métricas ni stack, Q6), Oportunix, HazmeFila, webs de comercios y **josecoded.com como proyecto propio** (D30). Alimentado después por `/caso-de-exito`.
6. Sobre mí (**profundidad media**): foto real, historia corta en primera persona, trayectoria con fechas reales, cómo trabajo, **sección «Stack y formación» (`/sobre-mi#stack`)** con el stack agrupado y las certificaciones con estado, y **CV en PDF es/en generado en build desde los mismos datos que el CV maestro de Radar** (`content/radar/`): una sola fuente para la sección, el PDF y Radar (supera la idea candidata «CV/JSON Resume generado» de §4.1; sin `/resume.json` público salvo decisión posterior).
7. Blog en MDX con comentarios de usuarios registrados (D8, D10). **Sale con un mínimo de 3 artículos reales (D33)**; los artículos pueden existir en un solo idioma (D15b).
8. **Chat IA** asistente sobre Jose, con takeover humano desde el admin (D6).
9. Contacto: página `/contacto` con **selector «Tengo un negocio / Somos una empresa»** (negocio: WhatsApp primario + propuesta + formulario plegado; empresa: formulario + reservar 20 min + email con copiar), Turnstile. **«Contacto» no está en la cabecera**: vive en el **cierre corto de cada página**, en el cierre «¿Empezamos?» de la home, en ⌘K y en el menú ☰.
10. Auth de visitantes: Supabase Auth con Google, GitHub y email.
11. i18n es/en **en todas las páginas públicas y en el área privada desde el lanzamiento (D31)**; admin y Radar solo en español. Literales solo en `messages/{es,en}.json`; `i18n:check` sin claves pendientes.
12. SEO tradicional + GEO de primer nivel (§8).

**Privado**
13. Área interna de clientes y afiliados (`/area-clientes`): **portada personalizada automáticamente por señales (D32)**: cliente → propuesta o lead → `?ref` → página de origen → neutra, sin preguntar nada; la personalización ordena y destaca, nunca oculta Recomiéndame, Mi cuenta ni la vía de contacto. Proyecto, tareas, comentarios, assets, pack contratado y extras; **ampliaciones** (solicitar subir de pack o añadir extras, con precio calculado por regla: diferencia de lista, sin descuento); **afiliados**: código y enlace propios, leads atribuidos, estado de cada recompensa (pendiente / abonada). Todo usuario del área puede ser afiliado; el nivel premium lo asigna Jose (D15).
14. **Panel de administrador** (`/admin`, solo Jose): bandeja de leads (incluidas propuestas IA y afiliado atribuido), moderación de comentarios, gestión del área de clientes (clientes, tareas, assets, packs, extras, solicitudes de ampliación), afiliados (nivel, recompensas pendientes, marcar abonadas), conversaciones del chat con takeover.
15. **Radar** (`/admin/radar`, solo Jose; §13): agente que descubre ofertas de empleo y encargos freelance en varias plataformas mediante conectores enchufables, las puntúa contra el perfil de Jose, prepara la candidatura (CV adaptado, carta o propuesta, formulario prellenado), pide confirmación de un clic (admin o Telegram) y entonces envía donde hay API o formulario propio, o abre el enlace externo con todo preparado; después sigue la candidatura por correo (Gmail y Proton), lleva un calendario de entrevistas y plazos sincronizado con Google Calendar, y avisa por Telegram de plazos y seguimientos vencidos. **Nunca envía sin confirmación.**

**Transversal:** analítica Umami con eventos (D11), Telegram vía Edge Function `notify` (primaria) y n8n (opcional) para avisos, `prefers-reduced-motion`, accesibilidad AA.

**Infra que Radar añade (perfil `infra`, `implementador-infra`, con OK de Jose antes de tocar Omen):** contenedor de Proton Bridge, contenedor de navegador headless para los conectores por scraping, workflows n8n de Radar. Servicios preexistentes de Omen intocables.

### Post-lanzamiento
Solo las ideas candidatas de §4.1 que Jose apruebe, más la **newsletter** (spec propia `2026-09-29-josecoded-newsletter.md`, fase 10 del plan). Nada más queda pendiente.

### Fuera
Foro, closer/comisiones/finanzas, staff, demo de emulador, **objetos 3D navegables o escenas 3D fuera del hero y sus miniaturas** (el WebGL de v1 se limita a `GlyphScene`, D16), datos en vivo, panel de estado de infraestructura, sección de I+D, testimonios fabricados, modo claro. **En Radar:** envío 100 % automático, resolución de captchas, gestión de contraseñas de plataformas por el sistema, Easy Apply automatizado en LinkedIn, envío de correos (Gmail solo borradores), creación de eventos de calendario sin confirmación, LinkedIn como cliente de mensajería (InMail).

### 4.1 Ideas candidatas (no están en alcance; máx. 5)

| Idea | Beneficio | Coste | Audiencia |
|---|---|---|---|
| **Auditoría exprés**: el negocio pega la URL de su web actual y recibe informe (PageSpeed API + resumen IA) y CTA | Lead muy cualificado con dolor concreto; GEO citable | Medio: 1 ruta en el gateway, cuota de PageSpeed, plantilla de informe | B |
| **Servidor MCP público** "pregúntale a josecoded" (perfil, proyectos, disponibilidad) sobre el gateway | Innovación real y GEO literal: los agentes consultan la fuente | Medio-bajo: reutiliza `knowledge.json`; skill `cloudflare:build-mcp` disponible | A |
| ~~**CV/JSON Resume generado**~~ desde la entidad única (JSON-LD → PDF y `/resume.json`) | **Pasa a alcance en v1.6** (§4 punto 6): PDF es/en desde el CV maestro de Radar. `/resume.json` público sigue fuera | — | A |
| **RSS + newsletter** del blog | RSS en v1 (diseño técnico §5.8). **Newsletter: spec propia del 2026-09-29, fase 10 post-lanzamiento** | Bajo (RSS) / medio (newsletter) | A |
| **Playground de motion/componentes** (`/lab`) con el sistema de diseño propio | Demostración de oficio en frontend | Medio; riesgo de vitrina vacía | A |

## 5. Arquitectura

```
navegador
 └─ apps/web (Next.js App Router, Cloudflare Workers vía OpenNext, sin middleware Node)
     ├─ público: RSC estáticos (SSG), MDX del blog, CSS Modules + tokens, motion CSS + TS propio, Three.js diferido solo en la home (GlyphScene)
     ├─ Supabase (publishable key + RLS): auth, comentarios, leads, portal, admin, radar_* (solo admin)
     └─ NEXT_PUBLIC_JOSECODED_API_URL → apps/api (josecoded-api, Hono, Cloudflare Worker)
           ├─ conservado: /api/v1/{health, auth/me, system/status, admin-chat/*, admin-chat/admin/*, forum/*}
           ├─ NUEVO aditivo: /api/v1/proposals/generate  (Workers AI + reglas de precio)  [D5]
           ├─ NUEVO aditivo: /api/v1/notify/lead          (→ Edge Function notify → Telegram) [D9/P3]
           ├─ NUEVO aditivo: /api/v1/radar/*              (ingesta de conectores, puntuar, preparar,
           │                                               confirmar, webhook de Telegram, cron) [§13]
           └─ WORKER_URL + token interno → josecoded-worker (Omen): ai/*, n8n/*, storage/*, system/*
 Omen (n8n + contenedores nuevos): conectores por scraping (LinkedIn, Workana), Proton Bridge (IMAP),
      orquestación de Radar; todo escribe en el gateway /api/v1/radar/ingest                     [§13.5]
 Mac de Jose (launchd, claude -p): conector Indeed por MCP oficial → gateway /api/v1/radar/ingest [§13.5]
 stats.josecoded.com → Umami (Docker en Omen, Cloudflare Tunnel)                                 [D11]
```

- **Frontend:** Next.js App Router, React Server Components, TypeScript estricto, **CSS Modules por componente que consumen solo tokens** (`.impeccable/design.json` → `pnpm tokens:build` → `apps/web/styles/tokens.css`, con test de deriva y stylelint), **motion en CSS nativo** (`scroll-snap`, `animation-timeline`, View Transitions) con **TypeScript propio mínimo** en `apps/web/lib/motion/`, **sin Tailwind, sin shadcn y sin GSAP por defecto** (D27; primitivas accesibles con `<dialog>`/`popover` nativos o Radix Primitives sin estilos si hace falta), **Baseline 2024** con `@supports` (D28), `next/font` autoalojado (Geist y Geist Mono), MDX (`@next/mdx`) para blog y contenido largo. *v1.5.2 decía «Tailwind CSS v4, shadcn/ui, GSAP + `@gsap/react` + ScrollTrigger»: superado el 2026-09-29 (working-agreements §1–§3).* **Three.js** (`three`, importado en diferido tras el LCP) únicamente para `GlyphScene` del hero (D16); el arte de glifos de Proyectos es imagen estática. **Sin middleware Node**: guards de `/admin` y `/area-clientes` en layouts server-side leyendo la sesión Supabase (`@supabase/ssr`) y `staff_members.role='admin'` / `clients.user_id`.
- **Auth:** Supabase Auth, proveedores Google, GitHub y email (magic link o password). Una única cuenta de visitante sirve para chat, comentarios y portal. Rol admin = `staff_members.role='admin'`. Los proveedores OAuth se configuran en el dashboard de Supabase (tarea de Jose).
- **Datos:** el sitio público no consulta Supabase en tiempo de petición salvo comentarios (RSC con caché corta), formulario, generador y chat. Contenido de servicios, proyectos y blog en MDX/JSON versionado.
- **Gateway (`apps/api`):** el código de `josecoded-api` se mueve a este repo con su propio `wrangler deploy`; rutas existentes intactas; se **añaden** `proposals/generate`, `notify/lead` y el grupo `radar/*` (§13.5), y el origen nuevo en CORS. `knowledge.json` se actualiza con el perfil nuevo. Radar añade al gateway un **Cron Trigger** de Workers (avisos y sondeo de correo) y **KV** para tokens OAuth de Google (§13.6).
- **Worker de Omen:** sin cambios. Se usa `n8n/trigger/<workflow>` para automatizaciones opcionales y, desde scripts locales, `ai/blog/*`. Radar usa n8n de Omen para orquestar los conectores por scraping y la lectura IMAP de Proton (§13.5); el worker `ai` de Omen es respaldo de Workers AI para redactar (D22).
- **Supabase:** tablas heredadas intactas. Migraciones **aditivas**: `blog_comments` (slug, user_id, body, status, parent_id) con RLS; columna `leads.ai_proposal jsonb` y `leads.source`; política de insert anónimo de `leads` restringida a los campos del formulario; **tablas `radar_*` (§13.4, Anexo C)**. `list_tables` y `get_advisors` antes; aplicar en producción solo con OK de Jose en la sesión.
- **Repo:** monorepo pnpm workspaces: `apps/web`, `apps/api`, `packages/config` (eslint, stylelint, tsconfig compartidos), **`packages/design-tokens`** (build de `design.json` → `tokens.css`, D27), `packages/glyph-scene`, `packages/pricing`, **`packages/radar-connectors`** (interfaz común y conectores, §13.5), `supabase/` (migraciones). Un solo `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en la raíz.
- **Entornos:** preview por rama (Workers preview) y producción en josecoded.com. Deploy a producción con OK explícito de Jose.

## 6. Decisiones

| # | Decisión | Razón | Descartado |
|---|---|---|---|
| D1 | Dos audiencias de igual peso (A empresas, B negocios locales); sin marca de agencia | R1: Jose se presenta como freelance con proyectos propios; la web es portfolio y demostración | "Técnico primero" (P8 josedev); "captación primero" (v0) |
| D2 | Persona principal Marta; secundaria Dani | R2 | Persona única |
| D3 | Cloudflare Workers vía OpenNext, sin middleware Node; tarea 0 del plan valida un despliegue real; fallback Vercel sin cambiar código | R3. Todo lo demás está en Cloudflare; el bloqueo previo era el middleware, que aquí no existe por diseño | Vercel como primera opción; Pages estático |
| D4 | Foro eliminado; comentarios en artículos | R4 | Mantener el foro |
| D5 | Generador de propuesta con IA en el gateway: `POST /api/v1/proposals/generate` con Workers AI (el mismo binding que ya usa admin-chat). El modelo **clasifica** la petición en servicios y extras; el **precio lo calcula una tabla de reglas** derivada de `Comercial/tarifas.md`, nunca el modelo. Turnstile + rate limit por IP; Cloudflare AI Gateway delante del binding (caché, límites, logs). El visitante ve alcance + "desde X €" y decide enviarlo: se crea `lead` con `ai_proposal` | R5. Workers AI evita depender de que Omen esté encendido; separar clasificación de precio elimina precios inventados | Ollama en Omen (disponibilidad); Claude API (coste y otra credencial); precio generado por el LLM |
| D6 | Chat IA conservado sobre `admin-chat/*` (requiere cuenta; login con Google en un clic). El generador de propuesta es la vía anónima de Marta; el chat es sobre todo para Dani | R4. Reutiliza el contrato existente sin tocar el gateway; el takeover humano ya existe | Chat anónimo (exigiría nuevo modelo de conversación en el gateway); descartado en Q1 |
| D7 | Sin MVP: producto final v1 en ramas por feature con puerta de calidad cada una; producción se abre con todo | R7 | Lanzamiento por etapas |
| D8 | **Blog en MDX en el repo**, no desde el admin | Un solo autor; versionado en git; render estático perfecto para SEO/GEO; se evita construir un editor, subida de imágenes y previsualización; Claude Code y `ai/blog/*` asisten la redacción en local. El admin solo modera comentarios. `blog_posts` queda sin uso (no se borra) | Editor en el admin (coste alto, beneficio nulo con un autor); Notion como CMS (acopla la web al conector) |
| D9 | Panel admin propio en `/admin` (solo Jose, `staff_members.role='admin'`): leads con propuestas IA, moderación, portal cliente, chat con takeover. Aviso de leads por Telegram: Edge Function `notify` (evento `lead.created`) como vía primaria, n8n opcional (decisión P3, 2026-09-17) | R9. El CRM comercial (propuestas, seguimiento) sigue en Notion vía skills; el admin es operativo, no comercial | Ver leads solo en Notion; email |
| D10 | Comentarios solo con cuenta (Google/GitHub/email), estado `pending`/`approved`/`rejected`, moderación en admin; publicación posterior a moderación (cola de aprobación, Q2) | R10 | Comentarios anónimos; servicio externo (Giscus: exige GitHub y no sirve a Marta) |
| D11 | **Umami autoalojado en Omen** (contenedor nuevo, `stats.josecoded.com` por Cloudflare Tunnel) con eventos `whatsapp_click`, `contact_submit`, `proposal_generated`, `proposal_sent`, `chat_started`, `call_booked`. Cloudflare Web Analytics activo como complemento (un script, sin cookies, sin coste) | R11. Cloudflare Web Analytics no tiene eventos personalizados ni embudos; Umami sí, sin cookies ni banner | GA4 (banner y peso) |
| D12 | Oscuro únicamente, tech elegante, "que no parezca hecho por IA"; prohibido: gradientes morados genéricos, glassmorphism de plantilla, Inter + texto degradado, iconos brillantes, copy vacío. **La prohibición de 3D se acota en D16**: WebGL solo en `GlyphScene` | R8 | Claro por defecto (v0); HUD "Reactor" de P8 se toma como antecedente, no como punto de partida |
| D13 | Precios de packs y extras con fuente única `Comercial/tarifas.md` (con fecha de vigencia) → `pricing.json` en el repo con script de sincronización manual. `pricing.json` contiene packs, extras, regla de ampliación (diferencia de lista) y regla de afiliados (2 meses / 10 % / 20 % sobre el primer pedido sin IVA); los regalos por pack se excluyen del JSON público. Propuestas y presupuestos ya emitidos conservan sus precios en Notion | R8. Una sola fuente para web, generador, área de clientes y skills comerciales; los precios cambian con el tiempo sin reescribir código | Precios escritos a mano en la página; histórico de versiones en tarifas.md |
| D14 | Monorepo `apps/web` + `apps/api`; josedev congelado como referencia | R9 | Dejar el gateway en josedev; repo propio |
| D15 | **Programa de afiliados en la web v1**, dentro del área interna: código por usuario, enlace `?ref=CODIGO` guardado en cookie de 30 días y volcado al `lead` al crearse (formulario, generador o chat); al marcar el lead como cerrado y cobrado en admin se genera la recompensa por regla (cliente: 2 meses de mantenimiento; no cliente: 10 %; premium: 20 %; base = primer pedido sin IVA); el pago es manual y el admin lo marca como abonado. Un lead, un afiliado; sin autoreferidos | R12 (decisión de Jose 2026-09-14). Programa simple, verificable y visible para el afiliado sin construir pasarela de pagos | Llevarlo a mano en Notion; post-lanzamiento |
| D15b | i18n es/en; `es` sin prefijo, `en` en `/en`; blog puede tener artículos solo en un idioma (alternates solo cuando existe la traducción). (Antes numerada D15 por duplicado; se renombra sin cambiar el contenido) | R6 | Solo es |
| D16 | **Hero split tipo Resend con escena Three.js de partículas-glifo, intro de caída por sesión, fondo grano + rayo estático, navegación clásica** (detalle en §12). Prototipo aprobado `docs/superpowers/design/ref/hero-lab-3/`; **desde v1.6 la referencia es el hero de `ref/home-v6/` (D29), que conserva la composición y actualiza parámetros y fondo (campo de luz + grano)** | Decisión de Jose del 2026-09-19 tras ver los prototipos. Es la única pieza WebGL de la web y la que da el "wow" técnico pedido en R14 sin renunciar a claridad | Shell IDE-lite con hero compilar → minimizar (UX v2.1); formatos terminal/scroll/objeto (`ref/heros/`); túnel de código (`hero-lab-2`); luz volumétrica + código DOM (`hero-lab`); foco de luz dinámico (`FocusLight`); prohibición genérica de partículas/ondas de v1.4 (R14), superada por este prototipo concreto |
| D17 | **Radar entra en v1** aunque retrase el lanzamiento (§13) | Decisión explícita de Jose del 2026-09-19: la búsqueda de empleo y encargos es el uso interno con más valor inmediato para él; hacerlo dentro de la plataforma reutiliza admin, auth, gateway, Supabase, Telegram y n8n | Lanzar el público primero y Radar después (habría sido la recomendación de plazo; queda anotada por si el plazo se dispara, ver §13.9); herramienta aparte fuera de la web |
| D18–D26 | Decisiones de Radar (envío solo con confirmación, conectores enchufables, LinkedIn con sesión propia y límites, IA, correo, calendario, avisos, fuente de verdad, dónde corre cada pieza) | Ver tabla de §13.8 | Ver §13.8 |
| D27 | **Stack visual: CSS Modules que consumen solo tokens generados desde `.impeccable/design.json`; motion en CSS nativo con TypeScript propio mínimo; sin Tailwind, sin shadcn, sin GSAP por defecto** (working-agreements §1–§3) | Decisión de Jose del 2026-09-29. El prototipo v6 se porta 1:1 (estructura y valores como tokens); las librerías de estilos chocan con la fidelidad y con el presupuesto de bundle; GSAP solo con justificación de peso y alternativa nativa aprobada por `revisor` | Tailwind v4 + shadcn (v1.3–v1.5.2); GSAP + ScrollTrigger (P13 del DT, superada); Tailwind solo para utilidades |
| D28 | **Baseline 2024** como soporte de navegadores; lo posterior (`animation-timeline`, View Transitions, `backdrop-filter`) con `@supports` y fallback obligatorio que `qa` comprueba en Safari | Decisión de Jose del 2026-09-29 (working-agreements §6). Permite usar la v6 tal cual sin polyfills | Soportar solo Chromium; polyfills de scroll-timeline |
| D29 | **Home = `ref/home-v6/` («bento por escenas»)**: hero D16 + una escena por pantalla con titular a dos tonos y bento de tres celdas por container queries; Proyectos como carrusel fijado; paginado por gesto en escritorio; celdas ampliables con View Transitions; indicador de sección sin texto; cabecera idioma → ⌘K → Chat → Login, sin Contacto | Elegida por Jose el 2026-09-26/29 tras las variantes de home-v5; revisión de acabado de impeccable aprobada; sistema documentado en `DESIGN.md` y `.impeccable/design.json` | Home v4 («ventana con dock», nube viajera), «básico y lioso» del 2026-09-25, `ProofStrip` + `PathPanel` + `BuildFacts` de UX v3 |
| D30 | **Pantallas y contenidos** según `2026-09-29-pantallas-y-contenidos.md` §6: interiores con scroll libre; `/contacto` con selector y cierre corto por página; Sobre mí profundidad media con «Stack y formación» + PDF es/en desde el CV maestro; caso de estudio medio; josecoded.com como proyecto; comparador de packs en `/negocios`; packs de app en Negocios; Empresas solo trabajo y freelancing con 40 €/h y feature cerrada desde 150 € (confirmado) | Decisiones de Jose del 2026-09-29 | Página de tarifas aparte; página «Stack y CV» aparte; packs en Empresas; fichas de proyecto cortas |
| D31 | **Todo bilingüe** (público y área privada) desde el lanzamiento; admin y Radar solo español; literales en `messages/{es,en}.json` y `i18n:check` | Decisión de Jose del 2026-09-29. Cada pantalla se construye ya bilingüe, sin pasada de traducción al final | Área solo en español; inglés tras el lanzamiento |
| D32 | **Personalización automática del área** por señales (cliente → propuesta/lead → `?ref` → página de origen → neutra), sin preguntar; solo se persiste la señal de origen, en tabla aditiva con RLS (DT §1.12) | Decisión de Jose del 2026-09-29. Evita la pantalla «Objetivo de la cuenta» | Preguntar el objetivo al registrarse; área igual para todos |
| D33 | **Blog con mínimo 3 artículos reales**; si no, se oculta (escena, cabecera, menú, ⌘K, pie) y `/blog` responde 404, comprobado en build | Decisión de Jose del 2026-09-29. «Nunca se publica vacío» pasa a tener número | Publicar con 1 artículo |

## 7. Restricciones

- No se reescriben `josecoded-api`, `josecoded-worker` ni el esquema de Supabase. Solo cambios **aditivos** (rutas nuevas, migraciones nuevas, configuración). Contratos existentes intocables.
- Variables heredadas: `NEXT_PUBLIC_JOSECODED_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- El navegador nunca habla con el worker de Omen; el token interno no toca el frontend. Servicios preexistentes de Omen intocables; Umami, Proton Bridge y el navegador headless de Radar son contenedores nuevos.
- Cuenta Cloudflare: `developerjose12@gmail.com` (account `d26022a34346cb759178a720bace386d`). Supabase `josecoded` (`nrgrmymsjtgayzejtawa`), plan gratuito, uno de los dos proyectos activos.
- Marca canónica `josecoded`; entidad única (Person + Organization + WebSite); no reintroducir "Jose Dev".
- Producción y migraciones: OK explícito de Jose en la sesión. **Gmail solo borradores, nunca envío** (también en Radar). Notion solo desde skills comerciales (Radar solo refleja, D24). **Calendario: nunca crear ni modificar eventos sin confirmación de Jose** (D23).
- `pnpm` únicamente (nunca npm ni npx; `pnpm dlx`). Accesibilidad WCAG 2.2 AA. Móvil primero. Convenciones normativas de trabajo en `docs/working-agreements.md` (estilos, tokens, motion, fidelidad al prototipo, validación por capturas con aprobación de Jose en preview, tests, unidades, integración, contenidos, dependencias).
- Precios y textos comerciales dependen de `Comercial/tarifas.md` y `Comercial/voz.md` en el vault (los exige también `/propuesta`). Radar depende además de `Comercial/voz.md` para redactar cartas y propuestas, y del perfil de búsqueda (§13.10, Q10).
- **Radar:** ninguna credencial de plataforma (cookies de sesión de LinkedIn, tokens de InfoJobs/Upwork, refresh token de Google, contraseña de Proton Bridge) toca el frontend ni el repo; viven en `wrangler secret`, en el credential store de n8n o en `.env` de Omen fuera del repo. El sistema no rellena contraseñas ni resuelve captchas: cuando una plataforma los pide, entrega el enlace a Jose (modo asistido).

## 8. SEO tradicional + GEO (requisito de primer nivel)

**SEO clásico (criterios):**
- Toda ruta pública: `title` único ≤ 60 car., `description` ≤ 155, canonical, `alternates` es/en con `x-default`, OG/Twitter image generada.
- `sitemap.xml` con ambos idiomas y `lastmod`; `robots.txt`; 301 desde las URLs públicas de josedev que tengan equivalente (`/services`, `/sobre-mi`, `/en/...`); `/blog/<slug>` antiguos y `/foro/*` → 410 (Q4).
- HTML semántico, un `h1` por página, imágenes con `alt` y dimensiones, `next/image` con AVIF/WebP.
- Rendimiento: CWV en verde con el motion CSS (`animation-timeline`, View Transitions, paginado) y `GlyphScene` activos (solo `transform` y `opacity` en continuo, Three.js tras el LCP, §12). *v1.5.2: «con GSAP y ScrollTrigger», superado por D27.*
- Palabras clave objetivo por página validadas con Semrush (`keyword_research` en `es`) antes de escribir copy.

**GEO (criterios):**
- `llms.txt` y `llms-full.txt` regenerados en build desde el contenido real (no a mano).
- Datos estructurados JSON-LD site-wide: `Person` (Jose, `sameAs` LinkedIn/GitHub/stores), `Organization` (josecoded), `WebSite` con `SearchAction`, `ProfilePage` en Sobre mí, `Service` + `Offer` con `priceSpecification` "desde" en servicios, `BlogPosting` con `author` en artículos, `FAQPage` en negocios locales, `SoftwareApplication` para 3catinfo (solo nombre y enlace a stores), HazmeFila y Oportunix. Validado con el validador de schema.org en CI (test de snapshot).
- Contenido citable: cada página de servicio y proyecto abre con un párrafo de 2–3 frases autocontenidas (quién, qué, para quién, dónde) y una sección de preguntas con respuestas directas.
- `robots.txt` permite explícitamente `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot`; bloquea solo `/admin`, `/area-clientes`, `/auth`.
- Entidad única y coherente: mismo nombre, título y descripción en web, `llms.txt`, LinkedIn y GitHub (doc off-site que P5 dejó pendiente).
- **Protocolo de verificación** (post-lanzamiento, mensual): 10 preguntas fijas a ChatGPT, Perplexity, Claude y Google AI Overviews; se registra si citan josecoded.com y con qué texto. Baseline en el lanzamiento.

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Alcance grande sin MVP, **ampliado con Radar** | Lanzamiento tardío | Orden del plan por valor: home + negocios + generador + contacto primero; portal y admin después; Radar al final como grupo de ramas propio con sus migraciones aplicadas pronto (§13.9); cada rama pasa `/puerta-calidad`; preview público para que Jose vea avance. Si el plazo se dispara, Jose puede reabrir D17 (§13.9) |
| OpenNext incompatible con la versión de Next | Bloquea despliegue | Tarea 0: hello world real en Workers con Server Actions y `@supabase/ssr`; fallback Vercel |
| **Escena Three.js del hero empeora LCP/INP o pesa demasiado** | CWV en rojo, Lighthouse < 90; el hero deja de ser demostración y pasa a ser lastre | Presupuesto y reglas de §12 (Three.js en diferido tras LCP, ≤ 200 KB gz para el bundle de la escena, LCP = título, no canvas); tarea de medición en el plan antes de dar por cerrado el hero; vídeo/poster de respaldo en móvil y sin WebGL; `prefers-reduced-motion` y `saveData` → fotograma estático |
| Precio inventado por la IA | Propuesta engañosa, lead perdido | Precio solo por reglas (D5); el texto dice "orientativo, sujeto a propuesta" |
| Abuso del generador y del chat (coste Workers AI) | Coste y ruido | Turnstile, rate limit por IP y por usuario, cuota diaria en el gateway, alerta en Telegram |
| Contenido real insuficiente | Web genérica (fallo de P8) | Inventario de contenido y capturas como tarea del plan antes de `ux` |
| Cláusula de confidencialidad sobre 3catinfo | Legal | Decidido (Q6): nombre visible, sin métricas ni stack; ficha con campos ocultables |
| Programa de afiliados sin control | Recompensas indebidas (autoreferidos, leads falsos) | Un lead, un afiliado; sin autoreferidos (mismo email/usuario); la recompensa solo nace al marcar el lead cobrado a mano en admin |
| Omen apagado | Sin analítica ni Telegram (el sitio sigue); **en Radar, sin conectores por scraping ni correo Proton** | `notify/lead` reintenta y, si falla, email vía Edge Function `notify`; Umami tolera huecos. Radar: los conectores por API (InfoJobs, Tecnoempleo, Upwork, Indeed vía Mac) y Gmail, Calendar y avisos corren en el gateway o en el Mac, no en Omen; la bandeja marca "última pasada hace X h" por plataforma |
| Supabase pausado por inactividad | Auth, leads y comentarios rotos | Ping semanal (launchd/n8n) + alerta; formulario con fallback a email. Con Radar el proyecto recibe escrituras diarias, lo que reduce el riesgo |
| Estética "hecha por IA" | Rechazo de Jose y de Dani | Prototipo aprobado (D16) como referencia obligatoria; `usuario-ejemplo` y `ui` revisan la implementación contra él |
| Ramas largas con Supabase Auth y RLS nuevas | Fugas entre clientes | `revisor-seguridad` en cada rama con RLS; tests de RLS con dos usuarios |
| **Radar: bloqueo o restricción de la cuenta de LinkedIn por scraping** (viola sus condiciones de uso) | Pérdida temporal o definitiva de la cuenta que Jose usa para captar clientes y empleo | Decisión consciente de Jose (D20) con límites estrictos: sesión propia, ≤ 1 pasada/día, ≤ 30 ofertas por pasada, ritmo humano con pausas aleatorias, solo lectura de listados y fichas, nunca Easy Apply ni mensajes; interruptor por plataforma en admin; ante captcha o "verificación de seguridad", el conector se detiene y avisa; alternativa sin riesgo lista para activar: alertas de empleo de LinkedIn por correo parseadas (§13.8) |
| **Radar: Indeed no tiene API pública de búsqueda para nuevos integradores; el conector oficial es un MCP que solo funciona dentro de una sesión de Claude** | Sin descubrimiento automático de Indeed si la vía no se ejecuta | Conector Indeed ejecutado desde la automatización launchd del Mac (`claude -p` + skill, patrón ya existente en claude-config), que hace POST al gateway; si el Mac está apagado, la pasada se recupera al despertar; scraping de Indeed descartado (condiciones de uso y captchas agresivos) |
| Radar: captchas y verificaciones en formularios externos | No se puede enviar sin Jose | Modo asistido por diseño: se abre el enlace con todo preparado (texto en portapapeles / material descargado); nunca se intenta resolver el captcha |
| Radar: candidaturas de baja calidad (CV o carta genéricos, alucinaciones sobre experiencia) | Daño a la reputación de Jose | El material se genera desde un CV maestro y un perfil versionados (solo hechos que constan), con reglas: no inventar empleadores, fechas ni tecnologías; Jose ve y puede editar el material antes de confirmar; puntuación explicable (motivos visibles); prueba de `usuario-ejemplo` como reclutador sobre 5 candidaturas generadas |
| Radar: privacidad de correos (Gmail y Proton contienen mucho más que candidaturas) | Exposición de correo personal a la IA y a la base de datos | Solo se leen mensajes que cumplen filtros previos (remitentes/dominios de plataformas y empresas con candidatura, o hilos que responden a un correo de candidatura); se guarda referencia (`message_id`, remitente, asunto, fecha, extracto ≤ 500 caracteres), no el cuerpo completo; sin adjuntos; Proton solo vía Bridge local en Omen; tablas `radar_*` solo admin; borrado de vínculos desde admin |
| Radar: coste y dependencia de Proton (plan de pago obligatorio para Bridge) | Coste mensual; si Jose no lo contrata, Proton queda fuera | Proton diferible: el módulo funciona solo con Gmail; el conector IMAP de Proton se activa cuando exista el plan (Q12) |
| Radar: tres runtimes (gateway, Omen, Mac) | Complejidad operativa | Todos escriben por el mismo endpoint idempotente `POST /api/v1/radar/ingest` con `external_id` único por plataforma; la bandeja muestra la salud de cada conector; el núcleo no sabe dónde corre cada uno |
| Radar: cuotas y aprobación de APIs (InfoJobs, Upwork) | Un conector puede tardar semanas en tener credenciales | Conectores independientes: v1 se lanza con los que tengan credenciales; el resto se añade sin tocar el núcleo (D19). Jose solicita las credenciales antes del plan (Q14) |

## 10. Criterios de aceptación de v1

- Sin scroll, en móvil, se entiende qué hace Jose, para quién y dos formas de contacto; `usuario-ejemplo` (Marta y Dani) sin abandonos en sus rutas de §2.
- **Hero (D16):** en escritorio con WebGL, la escena carga después del LCP (el título es el elemento LCP, verificado en Lighthouse), morfa móvil → web → chip y responde al arrastre; la intro se reproduce una vez por sesión y termina con cualquier interacción; con `prefers-reduced-motion`, sin WebGL o en móviles con respaldo, se ve el vídeo/poster y nunca una columna vacía; el bundle de la escena ≤ 200 KB gz; CWV en verde en móvil 4G con el hero real.
- Generador: descripción → propuesta con alcance y "desde X €" correcto según `pricing.json`; enviar crea `lead` con `ai_proposal` y Jose recibe Telegram en < 1 min.
- Chat: usuario con Google puede conversar; Jose ve la conversación en admin y toma el control.
- Blog: artículo MDX renderizado con JSON-LD `BlogPosting`; comentar exige cuenta; moderación cambia el estado y la vista pública.
- Portal: un cliente ve solo lo suyo (test RLS con dos cuentas); Jose gestiona tareas y assets desde admin.
- Ampliación: un cliente con P2 solicita P3 y ve 1.100 € (diferencia de lista según `pricing.json`); la solicitud aparece en admin.
- Afiliados: visita con `?ref=CODIGO` → lead creado con `affiliate_code`; al marcarlo cerrado y cobrado en admin con base 1.400 € se genera recompensa de 140 € (no cliente), 280 € (premium) o 2 meses de mantenimiento (cliente); el afiliado la ve en su área como pendiente y como abonada tras marcarla Jose.
- `/admin` inaccesible sin `staff_members.role='admin'` (comprobado sin middleware).
- **Radar (§13):**
  - Una pasada de cada conector activo deja ofertas nuevas en `radar_offers` con `external_id` único, sin duplicados en pasadas repetidas (test de idempotencia); una oferta puntuada muestra puntuación 0–100 y ≥ 3 motivos legibles.
  - Para una oferta con puntuación ≥ umbral, el sistema genera CV adaptado, carta o propuesta y, si la plataforma lo admite, el formulario prellenado; el material queda en `radar_materials` y Jose puede editarlo en admin antes de confirmar.
  - Confirmar desde admin y desde Telegram (botón inline) pasa la candidatura a `sent` solo si el conector tiene envío propio y este responde OK; si no, pasa a `sent` únicamente cuando Jose marca "enviada" tras abrir el enlace asistido. **Test negativo:** ninguna ruta del sistema puede pasar a `sent` sin un evento `confirmed_by_jose` previo en `radar_application_events`.
  - Un correo de prueba de rechazo (remitente de la plataforma, referencia de la oferta) recibido en Gmail queda vinculado a su candidatura y la pasa a `rejected` con el enlace al hilo; Proton igual cuando Bridge esté activo.
  - Un plazo o entrevista confirmado por Jose crea el evento en el calendario "Radar" de Google y aparece en el calendario habitual de Jose; sin confirmación, no se crea nada (test).
  - Los avisos por Telegram de plazo a 24 h y seguimiento vencido (7 días sin respuesta) llegan a la hora configurada; el borrador de seguimiento aparece en Gmail sin enviarse.
  - Interruptor por plataforma; la bandeja muestra la última pasada y el último error de cada conector; el conector de LinkedIn se detiene solo ante captcha o verificación.
  - `radar_*` inaccesibles para cualquier usuario que no sea admin (test RLS con cuenta de cliente).
- **Estilos y tokens (D27):** `tokens.css` coincide con `design.json` (test de deriva); stylelint no encuentra literales fuera del fichero de tokens; ningún `.module.css` usa `border` para contornos.
- **Fidelidad visual (working-agreements §5):** capturas app/prototipo a 360, 900 y 1440 px con diff ≤ tolerancia por escena de la home; `ui` emite «fiel» o «desvío aceptable»; Jose aprueba cada rama en preview.
- **Fallbacks (D28):** `qa` comprueba en Safari de escritorio e iOS la tabla de working-agreements §6 (tarjetas de Proyectos apiladas sin `animation-timeline`, celda sin transición sin View Transitions, scroll nativo sin paginado, cabecera opaca sin `backdrop-filter`).
- **Bilingüe (D31):** `pnpm --filter web i18n:check` sin claves `{{DATO` ni faltantes en es o en; `/en/client-area` y sus hijas renderizan en inglés; OTP y WhatsApp prellenado en los dos idiomas.
- **Personalización del área (D32):** una prueba por señal y por prioridad (cliente gana a lead; lead gana a `?ref`; `?ref` gana a origen; sin señal → neutra); nunca se oculta Recomiéndame ni Mi cuenta; RLS: un usuario no lee la señal de otro.
- **Blog (D33):** con < 3 artículos reales, `/blog` responde 404 y no aparece en cabecera, menú, ⌘K, pie ni en la escena de la home (test de build y E2E).
- SEO/GEO: todos los criterios de §8 verificados; redirecciones 301 probadas; `llms.txt` generado.
- Umami registra los seis eventos (más `intro_played`, `path_open`, `scene_drag`, `booking_open` de UX v3); Cloudflare Web Analytics activo.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde; `/puerta-calidad` pasa en todas las ramas; Lighthouse móvil ≥ 90/95/100.

## 11. Preguntas abiertas (resueltas el 2026-09-13)

| # | Pregunta | Decisión |
|---|---|---|
| Q1 | Chat con cuenta o anónimo | Con cuenta (login Google en un clic). D6 se mantiene |
| Q2 | Comentarios antes o después de moderar | Cola de aprobación: nada visible hasta aprobar en admin; el autor ve el suyo como "pendiente" |
| Q3 | `Comercial/tarifas.md`, `condiciones.md`, `voz.md` | Creados el 2026-09-13; tarifas v2 el 2026-09-14: 40 €/h, 150 €/feature; packs web P1 900 € (1 sem), P2 1.400 € (2 sem), P3 2.500 € (2 sem), P4 4.200 € (3 sem); app MVP 4.000 € (6 sem), app ampliada 6.000 € (8 sem); extras: mantenimiento 49 / 149 €/mes sin hosting, SEO 250 / 600 €, GEO 300 €, ciberseguridad 250 €; regalos por pack no oficiales; ampliación = diferencia de lista; afiliados 2 meses / 10 % / 20 % (D15). Dominio y hosting a cargo del cliente. Ejemplos de voz provisionales, pendientes de corrección por Jose. **2026-09-29:** las dos tarifas de empresa (40 €/h y feature cerrada desde 150 €) se mantienen como formas de contratar, no packs; los packs de app se muestran en Negocios |
| Q4 | Migrar `blog_posts` a MDX | Partir de cero. Los slugs antiguos `/blog/<slug>` devuelven 410 (no 301) |
| Q5 | Ciudad para SEO local | Toda España, sin ciudad: `areaServed: ES`. Sin páginas "diseño web en <ciudad>" |
| Q6 | Confidencialidad 3catinfo | Se muestra el nombre; **sin métricas ni stack**. La ficha de proyecto admite ocultar esos campos |
| Q7 | OAuth Google/GitHub en Supabase | No está. Tarea de Jose antes de la rama de auth (en ESTADO.md) |
| Q8 | Quién monta Umami | Tarea `infra` del plan (`implementador-infra`), OK de Jose antes de exponer `stats.josecoded.com` |
| Q9 | Modelo de Workers AI | Se mantiene Llama 3.3 70B para generador y chat |

Las preguntas abiertas de v1.5 (Radar) están en §13.10.

## 12. Home, UX, UI e integraciones (v1.6, 2026-09-29; supera a la batería del 2026-09-17, R13, y conserva el hero D16)

> Fuentes de verdad: prototipo `docs/superpowers/design/ref/home-v6/` (`index.html`, `base.css`, `v6.css`, `base.js`, `v6.js`, `scene.js`), sistema visual en `DESIGN.md` + `.impeccable/design.json`, contrato `.impeccable/surfaces/docs-superpowers-design-ref-home-v6-index-html.md`, inventario `2026-09-29-componentes-home-v6.md` v1.1, pantallas `2026-09-29-pantallas-y-contenidos.md` v1.0 y `docs/working-agreements.md` v1.0. La versión anterior de este apartado (navegación con CTA Contacto, `ProofStrip`, `PathPanel`, GSAP, `hero-lab-3` como referencia de la home) queda superada; se conserva en el historial de git (v1.5.2).

**Home (D29): «bento por escenas»**
- **Hero** (D16, conservado): split 5/7 a 100svh; izquierda `h1` con el nombre en dos líneas, subtítulo con las dos audiencias (alternativa B, sin tecnologías), `[Ver proyectos]` (→ escena Proyectos de la home; «Ver todos» del carrusel lleva a `/proyectos`) y «Una web para mi negocio →» (→ `/negocios`) en la misma fila; derecha el escenario de la nube con tres barras de ciclo. **Sin badge ni eyebrow** (quitado 2026-09-29). Bajo 900 px (56.25rem) el escenario sube encima del texto en un cuadrado de min(38svh, 100 %).
- **Escena `GlyphScene`** (Three.js, único WebGL): nube de 9.000 (escritorio) / 5.000 (móvil) glifos de **Geist Mono** que cicla móvil → web → chip (hold 3,5 s, morph 1,6 s), bloom 0.22, reflejo 0.35, verde 0 (el verde solo en el destello de aterrizaje de la intro), arrastre con puntero fino, inclinación al cursor, pausa con pestaña oculta; se apaga fuera del hero. Parámetros exactos en `scene.js` de la v6 (los de `hero-lab-3` —JetBrains Mono, bloom 0.3, reflejo 0.45, verde 14 %— quedan superados). **En móvil no hay WebGL: vídeo + póster generados desde la misma escena; WebGL solo en escritorio** (decisión 4 del inventario de componentes). Reduced motion, `saveData` o sin JS: póster.
- **Intro de primera visita por sesión (`IntroFall`)**: los caracteres del hero caen y aterrizan con destello verde; cualquier interacción la termina; el texto real es accesible desde 0 ms (mecánica del diseño técnico §1.6.4, referencia `scene.js:425-481` de la v6).
- **Escenas** tras el hero, en el mismo orden que la cabecera: **Sobre mí · Empresas · Negocios · Proyectos · Blog · «¿Empezamos?»**. Cada escena: min 100svh, titular a dos tonos (qué es / para quién) y un bento de tres celdas sin huecos que decide su rejilla por **container queries** (1 → 2 → 12 columnas). Negocios muestra los 4 packs (900 / 1.400 / 2.500 / 4.200 € «desde», sin IVA) desde `packages/pricing`; Empresas la celda Tarifas con selector (40 €/h · feature cerrada desde 150 €). **Proyectos es un carrusel horizontal fijado** (`animation-timeline`; sin soporte, en pantalla vertical o con reduced motion, tarjetas apiladas en columna). Cierre «¿Empezamos?» con WhatsApp (sólido), Reservar 20 min (fantasma) y pista ⌘K.
- **Un gesto = una escena** (solo escritorio con puntero fino, sin reduced motion y si la escena cabe): rueda, trackpad, teclado y anclas deslizan ~0,6–0,95 s a la siguiente parada; en Proyectos, una tarjeta por gesto. Sin puntero fino: scroll nativo con `scroll-snap-type: y proximity`.
- **Transiciones por elemento ligadas al scroll** (`animation-timeline: view()`): entra subiendo con nitidez; sale retrocediendo y apagándose. **Celdas principales ampliables** con View Transitions (380 ms), `role="dialog"`, foco atrapado, Esc cierra; el hueco `more` lleva un resumen y el enlace a su página (celda ampliada genérica, decisión 1 del inventario).
- **Vida en las celdas**: luz bajo el cursor, marquesina doble del stack, mini chat que se escribe, selección deslizante en Servicios y Packs, selector de tarifa, checks que se dibujan, arte de glifos flotando en la tarjeta activa. Todo se detiene con reduced motion y muestra su estado final.
- **Indicador de sección**: líneas sin texto en el margen derecho; activa más larga y violeta; nunca en el hero, ni durante el carrusel, ni con celda ampliada; no se dibuja si el margen < 2.25rem.
- **Adaptativo sin medidas mágicas**: `clamp` con vw/svh/vmin/cqi, breakpoints en `rem`, probado de 360×640 a 1920×1080.

**Cabecera y pie (todas las páginas públicas)**
- Fija, 4rem, transparente sobre el hero y translúcida tras 80 px. Izquierda: marca y **Sobre mí · Empresas · Negocios · Proyectos · Blog**. Derecha, en este orden: **idioma (EN) → buscador ⌘K → Chat (píldora con punto verde) → Login (botón sólido)**. **«Contacto» no está en la barra**: vive en el cierre de cada página, en ⌘K y en el menú ☰. En ≤ 1080 px (67.5rem) los enlaces pasan al menú ☰ con el idioma dentro; ≤ 900 px buscador y chat solo icono; ≤ 22.5rem Login solo icono. Menú móvil como disclosure nativo (sin hoja shadcn). Paleta ⌘K con `<dialog>` modal, sin animación, comandos «Ir a» y «Acciones» desde un fichero tipado + `messages`. Blog desaparece de cabecera, menú, ⌘K y pie si no hay 3 artículos (D33).
- Pie: secciones, Área de clientes, Legal, revisión con fecha desde `build-info.json`.

**Páginas interiores (D30; detalle en `2026-09-29-pantallas-y-contenidos.md`)**
- **Lenguaje**: escenas con scroll libre: mismo titular a dos tonos y bentos, sin 100svh forzado (`Scene` sin `fill`), sin paginado, sin indicador ni carrusel fijado; en modo Leer y Operar manda la columna de lectura o la herramienta. Modo de superficie: Persuadir (Sobre mí, Empresas, Negocios, Proyectos, Contacto), Leer (caso de estudio, blog, artículo, legales), Operar (auth, chat, área, perfil).
- **Cierre corto** al final de cada página con la primaria de su persona (WhatsApp en Negocios, reservar en Empresas, Hablamos en el resto) y «Otras formas de hablar →» a `/contacto`.
- **Orden de diseño y construcción** (no de lanzamiento): P1 Negocios → P3 Contacto → P4 Empresas → P2 Generador → P7 Proyectos + P8 Caso → P6 Sobre mí (+ Stack y CV) → P18 Legales + P19 Errores → P12–P15, P17 Auth y cuenta → P11 Chat → A1–A7 Área → P9 Blog + P10 Artículo. Cada pantalla se diseña con `/impeccable shape` y un prototipo en `ref/` que Jose valida en el navegador antes de construirla; cada tarea con UI termina con capturas comparadas y aprobación de Jose en preview (working-agreements §5).
- **Área privada**: personalización automática (D32); `Scene`/`Bento` en modo operar (sin luz de cursor); bilingüe (D31).

**UI: sistema visual (`DESIGN.md`, `.impeccable/design.json`)**
- Norte creativo «El lanzador de código»: índigo casi negro `#07060F` como material con grano al 4,5 % y campo de luz violeta que sigue a la nube; texto lavanda (`#ECE9FF`, `#A9A3D6`, `#8C86BD`), acción violeta sólida `#7C6CFF` con texto índigo, verde `#3DDC84` solo para lo vivo; tarjetas de vidrio índigo (`card`, `card-line`) con filete interior de 1 px, nunca `border`; Geist para todo y Geist Mono solo en teclas, idioma y glifos; iconos Lucide monocromos; unidades relativas. Listón: claridad de raycast.com y movimiento de igloo.inc; **nivel estudio sin metáforas, nada de métricas** (precios «desde» sí).
- Rechazos vigentes: glassmorphism de plantilla, gradientes morados genéricos, Inter con texto degradado, iconos brillantes, copy vacío, parallax de fondo, gradientes animados, inclinar o escalar al hover, franja de métricas, negro puro, metáforas de objeto físico, WebGL fuera del hero, badge o eyebrow en el hero, antetítulos sobre nombres de proyecto, «Contacto» en la barra.
- Tokens que faltan en `design.json` (alfas, sombras, desenfoques, duraciones y easings, capas, breakpoints en rem, degradados) se completan como **tarea bloqueante de la fase 1 del plan** antes de portar ninguna escena.

**Requisitos técnicos que fija esta spec (el diseño técnico los concreta)**
1. **Three.js importado en diferido tras el LCP** (sin cambios respecto a v1.5.2): HTML del hero estático como LCP; `import()` tras el LCP; una sola instancia WebGL; `three` empaquetado desde npm con importación selectiva. `packages/glyph-scene` se construye **portando `scene.js` de la v6 a TypeScript**, troceado según DT §1.6.2, sin el código muerto del inventario §4.1 (chorros, puertas, `directedMorph`, `scene:ready`), con PRNG de semilla y los valores de la v6.
2. **Móvil = vídeo + póster generados desde la misma escena; WebGL solo en escritorio** (supera el «la escena en vivo en móvil solo si la medición…» de v1.5.2: ya no hay medición ni flag `HERO_LIVE_MOBILE`). Vídeo ≤ 400 KB sin audio, `playsinline`, `poster`; póster ≤ 60 KB; los posters actuales `glyph-*-alpha.png` (250–300 KB) se regeneran dentro del presupuesto.
3. **Presupuesto:** bundle de la escena ≤ 200 KB gz fuera del camino crítico; JS total de la home ≤ 350 KB gz sin la escena; 60 fps en escritorio; CWV en verde (métrica de §1). Solo `transform` y `opacity` en continuo.
4. **`prefers-reduced-motion`:** sin escena (póster), sin intro, sin paginado ni snap, sin transiciones ligadas al scroll, sin View Transitions, sin carrusel fijado, sin marquesina, sin escritura automática, sin flotación; menú sin animación; el indicador solo funde. `intro_seen` se escribe igual.
5. **Accesibilidad:** escenario con `role="img"` y descripción; caracteres animados `aria-hidden` con el texto real accesible; `h1` único; celda ampliada modal con foco atrapado e `inert`; `SegmentedControl` con semántica correcta (tablist con `aria-controls` o radios); filas de Servicios y Packs son enlaces reales; menú disclosure con `aria-expanded`/`aria-controls`; objetivos táctiles ≥ 2.75rem.
6. **Navegadores:** Baseline 2024 (D28) con la tabla de fallbacks de working-agreements §6.
7. **Aprobación:** el prototipo v6 es la referencia obligatoria y se porta 1:1; los desvíos se marcan `deviation:` y los decide Jose en el navegador (working-agreements §4–§5).

**Integraciones externas (además de Supabase, gateway, worker de Omen, Edge Function `notify` → Telegram, Umami)**
- GitHub: enlace «Código en GitHub» **sin contadores** (sin métricas); la actividad y el número de repos de v1.5.2 quedan fuera de la web pública (el dato puede seguir generándose en build para `llms.txt`, pero no se muestra).
- Stores: enlaces a App Store / Google Play **sin valoraciones ni números**.
- Calendario: Cal.com para «Reservar 20 min» (Empresas, Contacto vía empresa, cierre de la home).
- WhatsApp: `wa.me` prellenado por origen (pack, app, propuesta, contacto) e idioma.
- CV en PDF es/en: generado en build desde `content/radar/` (CV maestro), servido estático.
- Radar (§13.6): sin cambios.
- Newsletter (spec propia): Brevo, GitHub REST, Claude CLI en Omen; fase 10.

**Tests**
- Vitest (lógica, `pricing.json`, reglas de afiliados/ampliación, **módulos de `lib/motion/`**, paleta ⌘K, gate del hero, `IntroFall`, esquemas de contenido, **script de tokens con test de deriva, `i18n:check`**, puntuación y máquina de estados de Radar) + integración (rutas del gateway, RLS con tres cuentas) + Playwright E2E (una prueba por escena de la home, generador, contacto, auth, área, admin, Radar) + **capturas comparadas app/prototipo a 360, 900 y 1440** + snapshot de JSON-LD + Lighthouse CI en build (con la escena real). **Sin unit tests de componentes visuales sin comportamiento** (working-agreements §7).

**Documento previo a implementación (pedido por Jose):** cumplido con `2026-09-17-josecoded-ux.md` v4.0 (mapa y flujos), `2026-09-17-josecoded-diseno-tecnico.md` v1.3, `DESIGN.md`, `2026-09-29-componentes-home-v6.md` y `2026-09-29-pantallas-y-contenidos.md`. `2026-09-17-josecoded-ui.md` v3 queda superado por `DESIGN.md`.

## 13. Radar: caza de empleo y encargos freelance (v1.5, decisiones de Jose del 2026-09-19)

### 13.1 Objetivo y métricas

**Objetivo:** que Jose no busque trabajo: que el trabajo le llegue puntuado y con la candidatura preparada, y que él solo decida. Radar descubre ofertas de empleo y encargos freelance en varias plataformas, las puntúa contra su perfil, prepara el material (CV adaptado, carta o propuesta, formulario prellenado), pide **confirmación de un clic** (admin o Telegram) y entonces **envía donde hay API o formulario propio, o abre el enlace externo con todo preparado**. Después sigue cada candidatura por correo, lleva su calendario y avisa de plazos. **Nunca envía sin confirmación** (D18).

**Qué no es:** no es un bot de "auto-apply" masivo; no sustituye el criterio de Jose; no es un CRM comercial (los clientes siguen en Notion; los leads de la web, en `leads`).

**Métricas (a 3 meses):**
- ≥ 20 ofertas relevantes/semana descubiertas (puntuación ≥ 60) entre todas las plataformas activas; ≤ 10 % de duplicados entre plataformas sin detectar.
- ≥ 5 candidaturas o propuestas confirmadas/semana; tiempo de Jose por candidatura confirmada ≤ 3 min (medido desde "preparada" hasta "confirmada", con edición incluida).
- 100 % de los correos de plataformas y de empresas con candidatura abierta vinculados automáticamente; 0 correos ajenos vinculados por error (revisión semanal de Jose).
- 0 envíos sin confirmación (invariante verificado por test y por el historial).
- 0 plazos perdidos: todo `deadline` confirmado tiene aviso 24 h antes.
- Tasa de respuesta (contactado + entrevista) / enviadas: se mide desde el día 1 para comparar plataformas y ajustar la puntuación; no hay objetivo numérico en v1.

### 13.2 Flujos

Actores: **conector** (una plataforma), **núcleo** (gateway + Supabase), **IA** (puntuar y redactar), **Jose** (admin o Telegram), **correo** (Gmail, Proton), **calendario** (Google Calendar), **avisos** (Telegram).

1. **Descubrir.** Cada conector activo corre en su horario (§13.5) con las consultas del perfil de búsqueda (roles, palabras clave, ubicación/remoto, tipo: empleo o freelance) y entrega ofertas normalizadas (`external_id`, url, título, empresa/cliente, ubicación, modalidad, salario o presupuesto, descripción, fecha de publicación, plazo si existe, tipo de envío que admite) al núcleo por `POST /api/v1/radar/ingest`. El núcleo hace upsert en `radar_offers` por (`platform`, `external_id`), detecta duplicados entre plataformas (misma empresa + título normalizado + fecha ± 7 días → `duplicate_of`) y marca la oferta como `discovered`.
2. **Puntuar.** Para cada oferta nueva, la IA compara descripción y requisitos con el perfil de Jose (`content/radar/profile.json` + CV maestro) y devuelve `score` 0–100 y `reasons[]` (≥ 3 motivos legibles: encaje de stack, modalidad, salario/tarifa, sector, idioma, señales negativas). Reglas duras antes del modelo (sin coste): descartar automáticamente si incumple exclusiones del perfil (presencial fuera de zona, salario bajo el mínimo, sectores excluidos, idiomas no cubiertos) → estado `discarded` con motivo `rule:<nombre>`. La puntuación es explicable y editable: Jose puede subir o bajar el umbral y marcar "no me interesa" (alimenta una lista de exclusiones simple, no un modelo).
3. **Preparar.** Para ofertas con `score ≥ umbral` (por defecto 60; configurable) el núcleo crea la `radar_application` en `discovered` y encola la preparación: la IA genera **CV adaptado** (reordena y destaca desde el CV maestro; no inventa), **carta o propuesta** (empleo: carta; freelance: propuesta con enfoque, plan y tarifa desde el perfil de tarifas), y, si el conector lo admite, el **formulario prellenado** (mapa campo → valor). Todo se guarda en `radar_materials` con `version` y `generated_by`. Estado → `prepared`. Se manda el aviso "Candidatura preparada: {título} en {empresa}, {score}/100" con botones **Confirmar · Editar · Descartar** (Telegram inline keyboard) y aparece en la bandeja.
4. **Confirmar.** Jose pulsa Confirmar (Telegram → webhook del gateway con token secreto y `chat_id` verificado; o admin → Server Action). Se registra `confirmed_by_jose` en `radar_application_events` (con origen `telegram|admin`). Estado → `pending_confirm` solo si Jose eligió "Editar" y aún no confirmó; si confirma directamente, pasa a envío. **Invariante:** ninguna transición a `sent` sin evento `confirmed_by_jose`.
5. **Enviar o asistir.** Si el conector tiene `canSubmit` (API o formulario propio de la plataforma con envío verificado en pruebas), el núcleo llama a `submit()`; con respuesta OK → `sent` con `submitted_at` y `receipt` (id o URL de confirmación). Si el envío falla (error, captcha, cambio de formulario) → se mantiene `prepared` con `last_error`, aviso a Jose y **paso a modo asistido**. Modo asistido (LinkedIn, Indeed y todo lo que no tenga envío propio): Jose recibe el enlace directo a la oferta y un enlace a `/admin/radar/[id]` con el material listo para copiar (botones "copiar carta", "descargar CV.pdf") y, cuando lo haya enviado, marca **"Enviada"** → `sent` con `submitted_via='assisted'`. En Telegram el flujo asistido es: Confirmar → mensaje con enlace + "Marcar enviada".
6. **Seguir por correo.** Cada 30 min el núcleo consulta Gmail (API, solo lectura) y, si Bridge está activo, n8n consulta Proton (IMAP) con filtros: remitentes/dominios de plataformas (`radar_platforms.email_domains`), dominios de empresas con candidatura abierta, hilos que responden a un `message_id` de candidatura y asuntos con referencia de oferta. Los candidatos pasan a la IA con el contexto de candidaturas abiertas y devuelve `{application_id | null, kind: rejected|contacted|interview|offer|info, confidence}`. Con `confidence ≥ 0,8` se vincula (`radar_emails`) y se aplica la transición con `actor='email'`; con menos, se vincula como `info` y se pide a Jose que clasifique (un botón). Se guarda referencia, extracto y enlace al hilo, no el cuerpo entero.
7. **Calendario.** Cuando un correo o Jose indican entrevista, llamada o plazo, el núcleo propone el evento (título, fecha, duración, enlace de videollamada si viene en el correo) y Jose confirma (Telegram/admin) → se crea en el calendario secundario "Radar" de Google Calendar (visible en el calendario habitual de Jose) y en `radar_application_events` con `google_event_id`. Los eventos del calendario "Radar" se leen cada hora para reflejar cambios hechos a mano por Jose. **Nunca se crea, mueve ni borra un evento sin confirmación** (D23, regla global).
8. **Avisos y automatizaciones.** Cron diario (08:00 Europe/Madrid): plazos en < 24 h, seguimientos vencidos (candidatura `sent` o `contacted` sin novedad en 7 días → propone **borrador de seguimiento en Gmail**, nunca enviado, con la voz de Jose), entrevistas de hoy, resumen de la semana (lunes). Todo por Telegram vía Edge Function `notify` (eventos `radar.*`) o directamente desde el gateway. n8n en Omen puede añadir automatizaciones opcionales (reflejo en Notion, D24).

Estados de conector: cada pasada deja `last_run_at`, `last_ok_at`, `last_error` en `radar_platforms`; la bandeja muestra "LinkedIn: última pasada hace 3 h · OK" o "detenido: verificación de seguridad".

### 13.3 Estados y transiciones

Estados de `radar_applications.status` (decisión de Jose): `discovered`, `prepared`, `pending_confirm`, `sent`, `contacted`, `interview`, `offer`, `rejected`, `discarded`.

| Desde | Hacia | Quién | Condición |
|---|---|---|---|
| — | `discovered` | núcleo | oferta con `score ≥ umbral` (o Jose "preparar" a mano sobre una oferta bajo umbral) |
| `discovered` | `prepared` | IA | material generado y validado (CV, carta/propuesta, formulario si aplica) |
| `discovered`, `prepared` | `discarded` | Jose, regla | "No me interesa", exclusión, oferta caducada (`expired`) o duplicada |
| `prepared` | `pending_confirm` | Jose | pulsa "Editar": queda a la espera de su confirmación tras editar |
| `prepared`, `pending_confirm` | `sent` | núcleo (tras `confirmed_by_jose`) | envío propio OK (`submitted_via='connector'`) o Jose marca "Enviada" tras el modo asistido (`submitted_via='assisted'`). **Sin `confirmed_by_jose` no hay transición** |
| `sent` | `contacted` | correo, Jose | respuesta humana de la empresa o plataforma (no rechazo) |
| `sent`, `contacted` | `interview` | correo, Jose | entrevista o llamada propuesta (crea propuesta de evento) |
| `interview` | `offer` | correo, Jose | oferta recibida |
| `sent`, `contacted`, `interview`, `offer` | `rejected` | correo, Jose | rechazo explícito o silencio > 45 días (regla, marcada `auto`) |
| `rejected`, `discarded` | `discovered`/`prepared` | Jose | reabrir (raro; queda en el historial) |

Estados terminales: `rejected`, `discarded`, `offer` (con `outcome: accepted|declined` como campo aparte, no como estado). Toda transición escribe una fila en `radar_application_events` (`kind='status_change'`, `from`, `to`, `actor`, `source_id`) y las hechas por `email` o `rule` son reversibles desde admin en un clic ("no era esto"). Las ofertas (`radar_offers`) tienen su propio ciclo mínimo: `active` → `expired` (fecha límite pasada o ausente en dos pasadas consecutivas) → se descartan las candidaturas no enviadas.

### 13.4 Modelo de datos (tablas aditivas `radar_*`, solo admin)

Todas con RLS `staff_role_of((select auth.uid())) = 'admin'` para select/insert/update/delete del admin; las escrituras de conectores, IA, correo y cron entran por el gateway con service role. Sin FK a tablas heredadas salvo ninguna (Radar es autónomo). Índices en toda FK y en (`platform_id`, `external_id`) único.

| Tabla | Campos principales |
|---|---|
| `radar_platforms` | `id`, `code` (`indeed`, `linkedin`, `infojobs`, `tecnoempleo`, `workana`, `malt`, `upwork`), `name`, `kind` (`jobs`, `freelance`, `both`), `access` (`api`, `mcp`, `feed`, `scrape`), `can_submit` bool, `enabled` bool, `schedule` (cron o texto), `runtime` (`gateway`, `omen`, `mac`), `limits` jsonb (p. ej. `{"runs_per_day":1,"max_offers":30}`), `email_domains` text[], `last_run_at`, `last_ok_at`, `last_error`, `config` jsonb (sin secretos) |
| `radar_offers` | `id`, `platform_id`, `external_id`, `url`, `title`, `company`, `location`, `remote` (`remote`, `hybrid`, `onsite`, `unknown`), `kind` (`job`, `gig`), `compensation` jsonb (`{min,max,currency,period}` o `{budget,hourly}`), `description` text, `requirements` text[], `posted_at`, `deadline_at`, `submit_mode` (`connector`, `assisted`), `raw` jsonb (respuesta original recortada), `fingerprint` (empresa+título normalizados), `duplicate_of` (self FK), `status` (`active`, `expired`), `discovered_at`, `last_seen_at` |
| `radar_scores` (o columnas en `radar_offers`; el diseño técnico decide) | `offer_id`, `score` int, `reasons` jsonb[], `rule_hits` text[], `model`, `profile_version`, `scored_at` |
| `radar_applications` | `id`, `offer_id` (único), `status` (§13.3), `submitted_at`, `submitted_via` (`connector`, `assisted`), `receipt` jsonb, `outcome` (`accepted`, `declined`, null), `notes` text (Jose), `next_action_at` (para seguimientos), `last_activity_at`, `created_at`, `updated_at` |
| `radar_materials` | `id`, `application_id`, `kind` (`cv`, `cover_letter`, `proposal`, `form_payload`, `answers`), `format` (`md`, `pdf`, `json`), `content` text o `storage_path` (bucket privado `radar-materials`), `version` int, `generated_by` (`ai`, `jose`), `model`, `approved` bool, `created_at` |
| `radar_application_events` | `id`, `application_id`, `kind` (`status_change`, `confirmed_by_jose`, `note`, `deadline`, `interview`, `call`, `followup_draft`, `reminder_sent`, `error`), `from_status`, `to_status`, `actor` (`jose`, `ai`, `email`, `rule`, `connector`, `cron`), `source` (`admin`, `telegram`, `gmail`, `proton`, `calendar`), `source_id` (id del mensaje, del evento, etc.), `at` timestamptz (fecha del evento, p. ej. la entrevista), `google_event_id`, `payload` jsonb, `created_at` |
| `radar_emails` | `id`, `application_id` (nullable hasta clasificar), `account` (`gmail`, `proton`), `message_id`, `thread_id`, `from_address`, `subject`, `received_at`, `excerpt` (≤ 500 car.), `link` (URL del hilo en Gmail o `mailto`/referencia en Proton), `classification` (`rejected`, `contacted`, `interview`, `offer`, `info`, `unrelated`), `confidence` numeric, `reviewed_by_jose` bool |
| `radar_profile_versions` (opcional) | `version`, `content` jsonb, `created_at`: copia del `profile.json` usado para puntuar, para explicar puntuaciones antiguas. Alternativa: solo `profile_version` en `radar_scores` y el JSON en git |

Perfil de búsqueda y CV maestro: `content/radar/profile.json` (roles, palabras clave, exclusiones, ubicación, modalidad, salario mínimo, tarifa mínima, idiomas, sectores, disponibilidad) y `content/radar/cv.master.es.md` / `cv.master.en.md` en el repo, versionados. Son la única fuente de hechos para la IA.

Bucket privado `radar-materials` (PDFs de CV generados), políticas solo admin.

### 13.5 Arquitectura de conectores y dónde corre cada pieza

**Interfaz común** (`packages/radar-connectors`, TypeScript, sin dependencias de runtime concreto):

```ts
interface RadarConnector {
  code: PlatformCode;
  capabilities: { discover: true; detail: boolean; prepareForm: boolean; submit: boolean; track: boolean; access: 'api'|'mcp'|'feed'|'scrape' };
  discover(query: SearchQuery, ctx: Ctx): Promise<OfferDraft[]>;      // listado normalizado
  detail?(externalId: string, ctx: Ctx): Promise<OfferDraft>;         // ficha completa
  prepareForm?(offer: Offer, materials: Materials): Promise<FormPayload>; // mapa campo → valor
  submit?(application: Application, payload: FormPayload, ctx: Ctx): Promise<Receipt>; // solo tras confirmed_by_jose
  track?(application: Application, ctx: Ctx): Promise<TrackUpdate | null>; // estado en la plataforma, si lo expone
}
```

El núcleo (gateway) solo conoce la interfaz y la tabla `radar_platforms`. Añadir una plataforma = un fichero nuevo en el paquete + una fila en `radar_platforms` + credenciales en su runtime. **Ninguna plataforma toca el núcleo** (D19). Los conectores que corren fuera del gateway (Omen, Mac) usan la misma interfaz y entregan por `POST /api/v1/radar/ingest` (idempotente, autenticado con `RADAR_INGEST_TOKEN`).

**Conectores iniciales, vía de acceso real y dónde corren** (verificado lo marcado; lo demás se confirma en la tarea 0 de Radar):

| Plataforma | Descubrir / detallar | Enviar | Runtime | Notas honestas |
|---|---|---|---|---|
| **Indeed** | Conector MCP oficial (`search_jobs`, `get_job_details`, `get_company_data`, `get_resume`), **verificado**: busca por palabras clave, ubicación y país y devuelve enlaces de solicitud; no expone envío. La API pública de búsqueda de Indeed no está disponible para nuevos integradores | **Asistido** (enlace) | **Mac de Jose** (launchd, `claude -p` con skill `/radar-indeed`, patrón de `automation/run-skill.sh`): el MCP solo existe dentro de una sesión de Claude | Sin scraping (condiciones de uso y captchas). Si el Mac duerme, la pasada se ejecuta al despertar |
| **LinkedIn** (empleo y freelance/Services) | **Scraping con sesión propia** de Jose desde un navegador headless en Omen (cookies en el credential store de n8n; nunca en el repo) | **Asistido** siempre. Easy Apply automatizado y mensajes: fuera | **Omen** (n8n + contenedor de navegador, IP doméstica) | Viola las condiciones de LinkedIn; riesgo real de restricción de cuenta. Límites: ≤ 1 pasada/día, ≤ 30 ofertas/pasada, pausas aleatorias 3–12 s, solo listados y fichas, parada automática ante captcha/verificación, interruptor en admin. Alternativa sin riesgo lista: alertas de empleo de LinkedIn por correo parseadas por el flujo de correo (D20) |
| **InfoJobs** | API oficial (`api.infojobs.net`, credenciales de aplicación; búsqueda y detalle de ofertas). Candidatura por API: existe en su documentación con autorización del candidato; **a verificar en tarea 0** | `connector` si la API lo permite tras la verificación; si no, asistido | **Gateway** (cron) | Requiere alta de aplicación por Jose (Q14) |
| **Tecnoempleo** | Feed RSS/XML público de ofertas + ficha HTML | Asistido | **Gateway** (cron) | Sin API; el feed es la vía menos frágil |
| **Upwork** | API GraphQL oficial (requiere solicitud de API key y OAuth2 de la cuenta de Jose): búsqueda de trabajos y detalle | Asistido (enviar propuestas por API no está permitido para freelancers) | **Gateway** (cron) | Aprobación de API key puede tardar; conector opcional en el lanzamiento (Q14) |
| **Workana** | Sin API pública; listados públicos sin login → scraping ligero con límites | Asistido | **Omen** | Mismo marco de límites que LinkedIn, sin sesión |
| **Malt** | Sin API; los proyectos llegan como propuestas al freelancer por correo/plataforma | Asistido (responder en Malt) | **Correo** (§13.2 paso 6): los correos de Malt crean la oferta y la candidatura en `contacted` | Malt funciona al revés (te buscan): Radar solo lo sigue, no lo rastrea |

**Dónde corre cada pieza del núcleo:**

| Pieza | Dónde | Por qué |
|---|---|---|
| Ingesta, deduplicación, puntuación, preparación, máquina de estados, confirmación, envío por conector, webhook de Telegram | **Gateway** (`apps/api`, `/api/v1/radar/*`) | Siempre disponible, sin Omen; comparte auth, Supabase service role, Workers AI y AI Gateway |
| Cron (avisos diarios, sondeo de Gmail cada 30 min, lectura del calendario cada hora, conectores por API/feed, caducidad de ofertas) | **Cron Triggers de Workers** en el gateway | Sin depender de Omen ni del Mac |
| Tokens OAuth de Google (Gmail + Calendar, refresh token) y `RADAR_INGEST_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | `wrangler secret` + KV para el access token en caché | Nunca en el frontend ni en el repo |
| Conectores por scraping (LinkedIn, Workana), Proton Bridge + lectura IMAP, reflejo opcional en Notion | **Omen** (n8n + contenedores nuevos) | Necesitan IP residencial, sesión de navegador y un proceso persistente; Bridge solo corre en local |
| Conector Indeed (MCP) | **Mac** (launchd + `claude -p`) | El MCP solo vive en una sesión de Claude |
| Bandeja y detalle (`/admin/radar`, `/admin/radar/[id]`, `/admin/radar/plataformas`) | `apps/web` (RSC + Server Actions sobre Supabase con la sesión admin; acciones que disparan IA o envío llaman al gateway) | Mismo guard del admin (`staff_members.role='admin'`) |
| PDFs de CV | Generación en el gateway (HTML → PDF vía Browser Rendering de Cloudflare, o en Omen si el plan Free no lo cubre; el diseño técnico decide) a `radar-materials` | El material debe existir aunque Omen esté apagado; si no es viable en Workers Free, PDF bajo demanda en el navegador de Jose (impresión a PDF del CV en HTML) como respaldo |

### 13.6 Integraciones

| Integración | Uso | Credenciales y límites |
|---|---|---|
| Conector MCP de Indeed | Descubrir y detallar; datos de empresa para los motivos de puntuación; `get_resume` como contraste del CV maestro | Cuenta de Claude de Jose (ya autenticada); ejecución solo desde el Mac; resultados con enlaces intactos |
| Gmail API | Lectura filtrada (`messages.list` con `q` por remitentes/dominios/asuntos y fecha; `messages.get` formato `metadata` + `snippet`), **borradores** de seguimiento (`drafts.create`). **Nunca `send`** | OAuth 2.0 con app en modo prueba y el usuario de Jose; scopes `gmail.readonly` y `gmail.compose`; refresh token en `wrangler secret` |
| Proton Mail vía Proton Bridge | Lectura IMAP de la bandeja de entrada de Proton con los mismos filtros; sin envío | Requiere plan Proton de pago; contenedor en Omen (Bridge headless) + nodo IMAP de n8n; contraseña de Bridge en `.env` de Omen fuera del repo |
| Google Calendar API | Calendario secundario "Radar" en la cuenta de Jose: crear eventos **solo tras confirmación**; leer cada hora para reflejar cambios | Mismo OAuth que Gmail (scope `calendar.events` limitado al calendario Radar); `google_event_id` en `radar_application_events` |
| Telegram Bot API | Avisos (Edge Function `notify`, eventos `radar.prepared`, `radar.deadline`, `radar.followup_due`, `radar.email_linked`, `radar.connector_error`) y **confirmación con botones inline** (`callback_query` → webhook `POST /api/v1/radar/telegram` con `X-Telegram-Bot-Api-Secret-Token`; solo se aceptan callbacks del `chat_id` de Jose, verificado contra `staff_members.telegram_chat_id`) | Bot existente; webhook nuevo en el gateway |
| Workers AI + AI Gateway (Llama 3.3 70B, Q9) | Puntuar (JSON mode), redactar CV adaptado, carta, propuesta y clasificar correos | Mismo binding que D5; caché y tope de gasto en AI Gateway; respaldo: worker `ai` de Omen (`/ai/summarize`, `/ai/chat`) cuando Workers AI falle o para redacción larga (D22) |
| n8n (Omen) | Orquestar conectores por scraping, IMAP de Proton, reflejo opcional en Notion; **no** es la vía primaria de avisos ni de confirmación | Webhooks con secreto; credenciales en el credential store de n8n |
| Notion (opcional, D24) | Reflejo de solo escritura de candidaturas en una base "Radar" para verlas junto al CRM | Lo escribe n8n desde eventos del gateway; nunca es fuente de verdad; se puede apagar |
| Supabase | Fuente de verdad (`radar_*`), bucket `radar-materials`, RLS admin | Service role solo en el gateway |

Rutas nuevas del gateway (aditivas, todas con auth admin JWT o `RADAR_INGEST_TOKEN` según origen): `POST /radar/ingest`, `POST /radar/offers/:id/score`, `POST /radar/applications/:id/prepare`, `POST /radar/applications/:id/confirm`, `POST /radar/applications/:id/mark-sent`, `POST /radar/applications/:id/discard`, `POST /radar/events/propose`, `POST /radar/events/:id/confirm`, `POST /radar/telegram` (webhook), `GET /radar/platforms/health`, más el handler `scheduled` para los cron.

### 13.7 Riesgos y límites honestos (resumen; los transversales están en §9)

- **LinkedIn:** el scraping incumple sus condiciones de uso aunque sea con sesión propia y lectura; LinkedIn detecta patrones (volumen, horarios, headless) y restringe cuentas, a veces sin aviso. Los límites reducen el riesgo, no lo eliminan. Jose lo acepta (D20) sabiendo que la cuenta es también su canal comercial. La alternativa segura (alertas por correo) queda implementada como conector `linkedin-email` y puede sustituir al scraping con un interruptor.
- **Indeed:** solo vía MCP dentro de Claude; depende del Mac encendido y de la sesión de Claude autenticada; el volumen por consulta es limitado y no hay envío. Scraping descartado.
- **InfoJobs y Upwork:** requieren alta o aprobación de aplicación; los límites de cuota se conocen al obtener credenciales; el envío por API de InfoJobs es una hipótesis a verificar en la tarea 0 de Radar.
- **Captchas y verificaciones:** no se resuelven nunca; ante uno, el conector se detiene y avisa. Los envíos por formulario externo son, por definición, asistidos.
- **Calidad de las candidaturas:** una carta genérica hace más daño que no enviar. La IA solo reordena y redacta a partir de hechos versionados; Jose ve el material antes de confirmar; `usuario-ejemplo` como reclutador evalúa 5 candidaturas antes de dar por buena la rama.
- **Privacidad del correo:** Gmail y Proton contienen la vida de Jose. Radar lee solo mensajes que pasan filtros previos (remitentes, dominios, hilos de candidaturas), guarda referencias y extractos, nunca cuerpos completos ni adjuntos, y todo se borra desde admin. El modelo de IA que clasifica recibe solo el extracto y la lista de candidaturas abiertas.
- **Proton:** Bridge exige plan de pago (Mail Plus o superior) y un proceso persistente; si Jose no lo contrata, Proton queda fuera y Radar funciona con Gmail (Q12).
- **Google OAuth:** app en modo prueba (usuarios de prueba) obliga a renovar el consentimiento cada 7 días salvo que se publique la app o se use una cuenta Workspace; el diseño técnico elige la vía y el plan la deja resuelta antes de la rama de correo.
- **Tres runtimes:** gateway, Omen y Mac. Es el precio de usar cada vía oficial donde existe; se mitiga con un único endpoint de ingesta idempotente y salud por conector visible en admin.
- **Coste:** Workers AI por puntuación (cientos de llamadas/semana, pequeñas) y por redacción (decenas, largas): cabe en el tope de AI Gateway; Proton Mail Plus ≈ 4–5 €/mes; Browser Rendering para PDF puede exigir Workers Paid (5 $/mes) o hacerse en Omen.

### 13.8 Decisiones de Radar (D18–D26)

| # | Decisión | Razón | Descartado |
|---|---|---|---|
| D18 | **Envío solo tras confirmación de un clic** de Jose (admin o Telegram); donde hay API o formulario propio se envía; si no, se abre el enlace con todo preparado; nunca 100 % automático | Decisión de Jose. Protege reputación y cuentas; hace explícito el criterio humano | Auto-apply masivo; modo "confirmación por lotes" sin ver cada candidatura |
| D19 | **Conectores enchufables** con interfaz común (`discover`, `detail`, `prepareForm`, `submit`, `track`) y capacidades declaradas; el núcleo solo conoce `radar_platforms` | Decisión de Jose. Las plataformas cambian; añadir una no debe tocar el núcleo | Lógica por plataforma en el gateway; un solo scraper genérico |
| D20 | **LinkedIn por scraping con sesión propia y límites estrictos**, solo lectura, parada ante captcha, interruptor; conector alternativo `linkedin-email` (alertas por correo) listo | Decisión de Jose asumiendo el riesgo de bloqueo. P7 de josedev lo excluía; se supera | Sin LinkedIn; solo alertas por correo (queda como respaldo); Easy Apply automatizado |
| D21 | **Indeed por el conector MCP oficial ejecutado desde el Mac** (launchd + `claude -p`), envío asistido | Es la única vía oficial disponible; ya existe el patrón de automatización en claude-config | Scraping de Indeed; API Publisher (cerrada) |
| D22 | **IA: Workers AI (Llama 3.3 70B) con AI Gateway** para puntuar, redactar y clasificar correos; worker `ai` de Omen como respaldo | Sin depender de Omen; mismo binding y modelo que el resto (Q9); coste acotado | Claude API (otra credencial y coste); solo Ollama en Omen |
| D23 | **Calendario "Radar" secundario en Google Calendar**, sincronizado con el de Jose; creación y cambios solo con confirmación; lectura horaria | Decisión de Jose; regla global de no tocar eventos proactivamente | Calendario propio en Supabase sin Google; Cal.com |
| D24 | **Fuente de verdad: Supabase (`radar_*`)**; Notion reflejo opcional vía n8n, apagable | Decisión de Jose. Evita acoplar el módulo a un conector | Notion como fuente de verdad; Notion obligatorio |
| D25 | **Correo: Gmail API (lectura filtrada + borradores) y Proton vía Bridge en Omen (IMAP, lectura)**; vínculo por reglas + IA con umbral de confianza; nunca envío | Decisión de Jose. Cubre sus dos cuentas; Gmail sigue la regla global de "solo borradores" | Reenvío automático de Proton a Gmail (expone el correo); leer todo el buzón |
| D26 | **Avisos y confirmación por Telegram**: Edge Function `notify` para avisos, webhook en el gateway para los botones; cron en Workers para plazos y seguimientos; borradores de seguimiento en Gmail | Sin depender de Omen; reutiliza el bot y la Edge Function existentes | Confirmación solo en admin; n8n como único orquestador de avisos |

### 13.9 Impacto en alcance y plazo de v1

- **Alcance:** Radar es el módulo privado más grande de v1: 7 tablas nuevas, un paquete de conectores (7 conectores iniciales, de los que 2–3 pueden llegar después del lanzamiento sin tocar el núcleo), ~10 rutas nuevas y cron en el gateway, 3 pantallas de admin (bandeja, detalle con material editable, plataformas), integración OAuth con Google, webhook de Telegram, 2 contenedores nuevos y workflows en Omen, y una automatización nueva en el Mac.
- **Estimación relativa (esfuerzo, con el resto de v1 = 100):** Radar ≈ **35–45** adicionales. Comparable a la suma de "generador de propuesta + área de clientes + admin actual". Desglose orientativo: núcleo y máquina de estados 8, IA (puntuar, preparar, clasificar) 6, bandeja y detalle en admin 7, conectores 10–15 (LinkedIn y los scrapers son la mitad), correo + calendario + OAuth 6, infra en Omen y Mac 3, tests y puerta 4.
- **Plazo:** con D17, el lanzamiento de v1 se retrasa aproximadamente lo que dure ese 35–45 % adicional. Recomendación de orden para no bloquear el resto: (1) migraciones `radar_*` y paquete de conectores con fixtures pronto (no dependen de la UI); (2) rama "núcleo + bandeja + Telegram" con un conector de bajo riesgo (Tecnoempleo o InfoJobs) para cerrar el flujo completo; (3) Gmail + Calendar; (4) Indeed (Mac) y LinkedIn (Omen); (5) Proton, Upwork y Workana cuando haya credenciales o plan. **Válvula de escape** (no decidida, solo anotada): como Radar vive solo en `/admin`, si el plazo se dispara Jose podría abrir el público con Radar en las fases (1)–(2) y completar el resto en la misma producción; eso reabriría D17 y lo decide Jose, no el plan.
- **Puerta de calidad:** `/puerta-calidad` por rama como el resto; `revisor-seguridad` con especial atención a secretos, webhook de Telegram, RLS de `radar_*` y filtros de correo; `usuario-ejemplo` encarna a Jose (operador) y a un reclutador que recibe el material.

### 13.10 Preguntas abiertas imprescindibles para Jose (máx. 6)

| # | Pregunta | Por qué bloquea | Recomendación |
|---|---|---|---|
| Q10 | **Perfil de búsqueda:** roles y palabras clave (es/en), remoto / híbrido / presencial y zona, salario mínimo bruto anual para empleo, tarifa mínima por hora y presupuesto mínimo por encargo freelance, idiomas, sectores o empresas excluidas, disponibilidad (fecha) | Sin esto no hay reglas duras ni puntuación; es el `profile.json` | Rellenar una plantilla de 12 campos que el plan entrega en `content/radar/profile.json`; se puede ajustar luego desde el repo |
| Q11 | **Cuenta de Google y calendario:** ¿Gmail y Calendar sobre `developerjose12@gmail.com` u otra cuenta? ¿Calendario "Radar" como secundario de esa cuenta? ¿Acepta crear el proyecto OAuth en Google Cloud (app en modo prueba) y reconsentir cada 7 días, o prefiere publicar la app? | Decide el OAuth, los scopes y el trabajo de Jose en consola | Cuenta de Cloudflare (`developerjose12@gmail.com`), calendario secundario, app en modo prueba en v1 |
| Q12 | **Proton:** ¿contrata Proton Mail Plus ahora para Bridge, o Proton queda diferido y v1 arranca solo con Gmail? | Proton Bridge exige plan de pago y un contenedor en Omen | Diferir: lanzar con Gmail y activar Proton cuando el resto esté en producción |
| Q13 | **LinkedIn:** ¿confirma el scraping con su sesión (riesgo de restricción de la cuenta que usa también para clientes) con los límites de D20, o empieza por el conector de alertas por correo y activa el scraping después? ¿Cuántas ofertas/día y a qué hora? | Es la decisión con más riesgo del módulo y afecta a la infra de Omen | Empezar con alertas por correo + scraping apagado; activarlo tras 2 semanas de rodaje |
| Q14 | **Credenciales de plataformas:** ¿tiene cuentas activas en InfoJobs, Tecnoempleo, Upwork, Workana y Malt? ¿Da de alta la aplicación en la API de InfoJobs y solicita la API key de Upwork antes del plan? | Los conectores por API no se pueden probar sin credenciales; Upwork tarda | Solicitar ambas ya; el plan marca Upwork como conector que puede llegar tras el lanzamiento |
| Q15 | **Materiales base:** ¿existe un CV maestro actualizado (es y, si procede, en)? ¿Dónde vive (vault, PDF, LinkedIn)? ¿Quiere que la carta y la propuesta usen `Comercial/voz.md` tal cual o una voz más formal para empleo? ¿Datos de contacto y enlaces a usar en formularios (teléfono, portfolio, GitHub, LinkedIn)? | Sin CV maestro no hay CV adaptado ni formularios prellenados; la voz define las plantillas | Convertir el CV actual a `content/radar/cv.master.es.md` en la primera tarea del plan; voz de `voz.md` con registro "formal-cercano" para empleo |


**Resueltas el 2026-09-19 (batería con Jose):**

| # | Decisión |
|---|---|
| Q11 | Gmail personal de Jose por API y Google Calendar (calendario secundario "Radar") sincronizado con el móvil. OAuth en modo prueba en v1 |
| Q12 | Proton Mail **diferido**: v1 arranca solo con Gmail; el conector de correo es enchufable y Proton Bridge se añade después |
| Q13 | LinkedIn: primero **alertas de empleo por correo** leídas por el Radar; scraping con sesión propia apagado durante 2 semanas de rodaje y activable después con los límites de D20 |
| Q14 | Cuentas en InfoJobs, Tecnoempleo, Upwork, Workana y Malt: Jose las crea cuando toque; el Radar arranca con las que existan (Indeed por MCP + alertas de LinkedIn por correo) |
| Q10, Q15 | Pendientes de Jose: perfil de búsqueda (`content/radar/profile.json`) y CV maestro es/en (`content/radar/cv.master.*.md`) |

## Anexo A — Contratos conservados del gateway (`apps/api`, montado en `/api/v1`)

- `GET /health` (público), `GET /api/v1/health`.
- `GET /api/v1/auth/me`, `GET /api/v1/system/status` (JWT Supabase; `system/status` proxya al worker).
- `admin-chat/*`: `GET thread`, `POST messages`, `POST meeting`, `POST n8n/inbound`. `admin-chat/admin/*`: `GET conversations`, `GET/POST :id/messages`, `POST :id/ai`, `POST :id/read` (solo admin: `staff_members.role='admin'`).
- `forum/*`: intactas, sin consumidor.
- Middlewares: `requestId`, `securityHeaders`, CORS por origen (añadir preview y producción nuevos), rate limit fijo y de escritura.
- **Nuevas (aditivas):** `POST /api/v1/proposals/generate`, `POST /api/v1/notify/lead`, grupo `/api/v1/radar/*` (§13.6) y handler `scheduled` (Cron Triggers) para Radar.

## Anexo B — Worker de Omen (`josecoded-worker`, solo vía gateway)

`GET /health` (público); con token interno: `ai/status`, `ai/chat`, `ai/admin-chat`, `ai/blog/generate`, `ai/blog/improve`, `ai/summarize`, `n8n/status`, `n8n/trigger/:workflow`, `storage/list|upload|file/:area/:filename`, `system/status`. Sin cambios. Radar usa `ai/summarize` y `ai/chat` como respaldo de Workers AI (D22) y `n8n/trigger/radar-*` para los workflows de scraping, IMAP de Proton y reflejo en Notion; los contenedores nuevos de Radar en Omen (Proton Bridge, navegador headless) no forman parte del worker.

## Anexo C — Supabase

Heredadas e intactas (esquema real verificado el 2026-09-17 en el diseño técnico §0 y §6: no existe `admin_superusers`, el admin es `staff_members.role='admin'`): `blog_posts`, `forum_*` (6), `admin_chat_conversations`, `admin_chat_messages`, `staff_members`, `leads`, `lead_assignments`, `commission_entries`, `clients`, `client_tasks`, `client_task_comments`, `client_assets`, `client_pack_extras`, `pack_templates`, `pack_extras`. Edge Function `notify` (requiere `NOTIFY_SHARED_SECRET`).

Aditivas (solo se añade, nunca se altera lo heredado): `blog_comments`; `affiliates` (user_id, code, level `standard|premium`, created_at); columna `leads.affiliate_code` (nullable); `affiliate_rewards` (affiliate_id, lead_id, type `maintenance_months|percent`, amount, status `pending|paid`, paid_at); `upgrade_requests` (client_id, from_pack, to_pack, extras[], computed_price, status). RLS: cada usuario ve solo sus filas; Jose (`staff_members.role='admin'`) ve todo. `pack_templates` y `pack_extras` heredadas se alinean con `pricing.json` mediante el script de sincronización (no se editan a mano).

Aditivas previstas: `blog_comments` + RLS; `leads.ai_proposal jsonb`, `leads.source text`; política de insert anónimo en `leads` acotada. Todas con `list_tables` y `get_advisors` antes y después, y OK de Jose para producción.

**Aditivas de Radar (v1.5, §13.4):** `radar_platforms`, `radar_offers`, `radar_scores` (o columnas en `radar_offers`), `radar_applications`, `radar_materials`, `radar_application_events`, `radar_emails`, `radar_profile_versions` (opcional); bucket privado `radar-materials`. RLS: solo `staff_role_of((select auth.uid())) = 'admin'`; sin políticas para `authenticated` ni `anon`; escrituras de conectores, IA, correo y cron vía gateway con service role. Índices en todas las FK y único en (`platform_id`, `external_id`). Eventos aditivos de la Edge Function `notify`: `radar.prepared`, `radar.deadline`, `radar.followup_due`, `radar.email_linked`, `radar.connector_error`. Antes de la migración: `list_tables` para confirmar que no existe ninguna tabla `radar_*` (verificación pendiente en la tarea 0 de Radar; a 2026-09-17 no constaba ninguna) y `get_advisors` antes y después; aplicar en producción solo con OK de Jose.
